import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileText, Eye, Printer, ChevronLeft, ChevronRight, Users, Send, Check } from 'lucide-react';
import { semesterMatchesFilter } from '@/utils/semesterUtils';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEstablishment } from '@/hooks/useEstablishment';
import {
  getEvaluationPeriods,
  getEvaluations,
  getGradesByEvaluation,
  getGradingRules,
  calculateModuleAverage,
  calculateWeightedAverage,
  getMention,
  getDecision,
  getTranscriptTemplate,
  getEstablishmentSignatories,
  DECISIONS,
  MENTIONS,
  EVALUATION_TYPES,
  type Evaluation,
  type Grade,
  type TranscriptTemplateConfig,
  type TranscriptHeaderConfig,
  type TranscriptFooterConfig,
  type TranscriptStyleConfig,
} from '@/services/gradesService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import BulletinTemplateRenderer, { type BulletinTableRow, type BulletinRenderData } from './BulletinTemplateRenderer';
import { DEFAULT_TABLE_COLUMNS, DEFAULT_TABLE_STYLE, DEFAULT_HEADER_ELEMENTS, DEFAULT_BODY_ELEMENTS, DEFAULT_FOOTER_ELEMENTS } from './BulletinLayoutEditor';
import OfficialBulletinTemplate, { type OfficialBulletinData, type BulletinModuleRow } from './OfficialBulletinTemplate';
import SimpleBulletinTemplate from './SimpleBulletinTemplate';
import BtsBlancBulletinTemplate from './BtsBlancBulletinTemplate';
import CombinedBulletinRenderer from './CombinedBulletinRenderer';
import { getCombinedSourcePeriods } from '@/services/combinedPeriodService';
import { resolveConfigForPeriod, pickAppreciationForGrade, pickMentionForAverage, pickDecisionForAverage } from '@/services/bulletinConfigService';
import { computeBulletins, type ComputeBulletinResponse } from '@/services/bulletinComputeService';
import { DEFAULT_CONFIG } from '@/types/bulletinConfig';
// (TranscriptTemplateEditor + SignaturesCachetTab replaced by the new BulletinConfigModal)

interface Props {
  mode: 'admin' | 'student';
  studentId?: string;
  formationId?: string;
  periodId?: string | null;
  periodName?: string;
}

interface ModuleBulletinData {
  moduleId: string;
  moduleTitle: string;
  coefficient: number;
  ccAverage: number | null;
  ccClassAverage: number | null;
  examScore: number | null;
  examClassAverage: number | null;
  examPoints: number | null;
  examBlancScore: number | null;
  examBlancClassAverage: number | null;
  examBlancPoints: number | null;
  appreciation: string;
  teachingUnitId: string | null;
  // For BTS: whether this module has oral exam blanc
  examBlancType: 'ecrit' | 'oral' | null;
}

interface StudentBulletin {
  studentId: string;
  studentName: string;
  studentEmail: string;
  modules: ModuleBulletinData[];
  ccGeneralAverage: number | null;
  ccClassGeneralAverage: number | null;
  examTotalPoints: number;
  examTotalCoeff: number;
  examBlancTotalPoints: number;
  examBlancTotalCoeff: number;
  decision: string;
  mention: string | null;
}

const TranscriptsPanel: React.FC<Props> = ({ mode, studentId, formationId: propFormationId, periodId, periodName }) => {
  const { userId, userRole } = useCurrentUser();
  const { establishment } = useEstablishment();
  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';
  const [internalFormation, setInternalFormation] = useState('');
  const selectedFormation = propFormationId || internalFormation;
  const [semesterView, setSemesterView] = useState<string>('');
  const [currentStudentIndex, setCurrentStudentIndex] = useState<number | null>(null);
  const [showBulletinDialog, setShowBulletinDialog] = useState(false);
  const [showTemplateEditor] = useState(false);
  void showTemplateEditor;
  // (Signatures & Cachet now managed inside the Configuration tab)
  const [groupingMode] = useState<'section' | 'bloc' | 'semester'>('section');
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishSemester, setPublishSemester] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Formations (only needed when no formationId prop)
  const { data: formations = [] } = useQuery({
    queryKey: ['formations-for-transcripts'],
    queryFn: async () => {
      const { data } = await supabase.from('formations').select('id, title, level, start_date, end_date, duration_years, semesters_count, formation_type').order('title');
      return data || [];
    },
    enabled: mode === 'admin' && !propFormationId,
  });

  const { data: studentFormations = [] } = useQuery({
    queryKey: ['student-formations-transcripts', studentId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_formation_assignments')
        .select('formation_id, formations(id, title, level, start_date, end_date, duration_years, semesters_count, formation_type)')
        .eq('user_id', studentId!);
      return (data || []).map((d: any) => d.formations).filter(Boolean);
    },
    enabled: mode === 'student' && !!studentId,
  });

  const availableFormations = mode === 'admin' ? formations : studentFormations;

  const { data: periods = [] } = useQuery({
    queryKey: ['periods-for-transcripts', selectedFormation],
    queryFn: () => getEvaluationPeriods(selectedFormation),
    enabled: !!selectedFormation,
  });

  // Semester computed values
  const selectedFormationObj = availableFormations.find((f: any) => f.id === selectedFormation);
  const durationYears = (selectedFormationObj as any)?.duration_years || 1;
  const semestersCount = (selectedFormationObj as any)?.semesters_count || durationYears * 2;

  // Sync semesterView with the parent-provided periodId (single source of truth)
  useEffect(() => {
    if (!periodId || periods.length === 0) return;
    const period = periods.find((p: any) => p.id === periodId);
    if (!period) return;
    // NOTE: Composite periods are deprecated. Each period is now independent.
    // Best-effort numeric semester from name
    const m = period.name.match(/\d+/);
    if (m && period.period_type === 'semestre') setSemesterView(`s${m[0]}`);
    else setSemesterView(`period-${period.id}`);
  }, [periodId, periods]);

  // Each period is independent — always scope to the single selected period.
  const activePeriodIds = useMemo(() => {
    return periodId ? [periodId] : [];
  }, [periodId]);

  // Composite "final view" deprecated — always false now.
  const isFinalView = false;

  const activeSemesterNums = useMemo((): number[] | null => {
    if (!periodId) return null;
    const period = periods.find((p: any) => p.id === periodId);
    if (!period) return null;
    const m = period.name.match(/\d+/);
    return m ? [parseInt(m[0])] : null;
  }, [periodId, periods]);

  const currentPeriodLabel = useMemo(() => {
    if (!periodId) return periodName || '';
    const p = periods.find((pp: any) => pp.id === periodId);
    return p?.name || periodName || '';
  }, [periodId, periods, periodName]);

  // ⭐ Detect if the current period is a COMBINED period
  const currentPeriod = useMemo(
    () => periods.find((p: any) => p.id === periodId) || null,
    [periodId, periods],
  );
  const isCombinedPeriod = !!currentPeriod && (currentPeriod as any).is_composite === true;

  // Load source periods for the combined view
  const { data: combinedSourcePeriods = [] } = useQuery({
    queryKey: ['combined-source-periods', periodId],
    queryFn: () => getCombinedSourcePeriods(periodId!),
    enabled: !!periodId && isCombinedPeriod,
  });

  void semestersCount; void durationYears; void selectedFormationObj;

  const { data: students = [] } = useQuery({
    queryKey: ['formation-students-transcripts', selectedFormation],
    queryFn: async () => {
      if (mode === 'student' && studentId) {
        const { data } = await supabase.from('users').select('id, first_name, last_name, email').eq('id', studentId).single();
        return data ? [{ user_id: data.id, first_name: data.first_name, last_name: data.last_name, email: data.email }] : [];
      }
      const { data } = await supabase.rpc('get_formation_students', { formation_id_param: selectedFormation });
      return data || [];
    },
    enabled: !!selectedFormation,
  });

  const { data: allModules = [] } = useQuery({
    queryKey: ['formation-modules-transcripts', selectedFormation],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formation_modules')
        .select('id, title, coefficient, order_index, teaching_unit_id, semester')
        .eq('formation_id', selectedFormation)
        .order('order_index');
      if (error) {
        // eslint-disable-next-line no-console
        console.error('[TranscriptsPanel] modules query failed:', error.message);
        return [];
      }
      return data || [];
    },
    enabled: !!selectedFormation,
  });

  // Custom signatories defined by the establishment (for bulletin footer)
  const { data: signatories = [] } = useQuery({
    queryKey: ['bulletin-signatories', establishment?.id],
    queryFn: () => getEstablishmentSignatories(establishment!.id),
    enabled: !!establishment?.id,
  });

  // ─── DATA for the new OFFICIAL BULLETIN ────────────────────────────
  // 1) Instructors per module (first name + last name)
  const { data: moduleInstructorsRaw = [] } = useQuery({
    queryKey: ['module-instructors-for-bulletin', selectedFormation],
    queryFn: async () => {
      if (!selectedFormation) return [];
      const { data: mods } = await supabase
        .from('formation_modules')
        .select('id')
        .eq('formation_id', selectedFormation);
      const moduleIds = (mods || []).map((m: any) => m.id);
      if (moduleIds.length === 0) return [];
      const { data } = await supabase
        .from('module_instructors')
        .select('module_id, instructor:users(id, first_name, last_name)')
        .in('module_id', moduleIds);
      return data || [];
    },
    enabled: !!selectedFormation,
  });

  const instructorsByModuleId = useMemo(() => {
    const map = new Map<string, string[]>();
    (moduleInstructorsRaw as any[]).forEach((r: any) => {
      const inst = r.instructor;
      if (!inst) return;
      const fullName = `${inst.first_name || ''} ${inst.last_name || ''}`.trim();
      if (!fullName) return;
      const arr = map.get(r.module_id) || [];
      arr.push(fullName);
      map.set(r.module_id, arr);
    });
    return map;
  }, [moduleInstructorsRaw]);

  // 2) Student date of birth + matricule
  const { data: studentExtras = [] } = useQuery({
    queryKey: ['student-extras-for-bulletin', students.map((s: any) => s.user_id).sort().join(',')],
    queryFn: async () => {
      const ids = (students as any[]).map((s: any) => s.user_id);
      if (ids.length === 0) return [];
      const { data } = await supabase
        .from('users')
        .select('id, date_of_birth, student_number')
        .in('id', ids);
      return data || [];
    },
    enabled: students.length > 0,
  });

  const studentExtrasById = useMemo(() => {
    const map = new Map<string, { dob: string | null; matricule: string | null }>();
    (studentExtras as any[]).forEach((u: any) => {
      map.set(u.id, { dob: u.date_of_birth || null, matricule: u.student_number || null });
    });
    return map;
  }, [studentExtras]);

  // 3) Absences & lates for each student in the selected period
  const { data: absenceStats } = useQuery({
    queryKey: ['absence-stats-for-bulletin', selectedFormation, activePeriodIds.join(',')],
    queryFn: async () => {
      if (!selectedFormation) return {};
      const { data: sheets } = await supabase
        .from('attendance_sheets')
        .select('id, formation_id')
        .eq('formation_id', selectedFormation);
      const sheetIds = (sheets || []).map((s: any) => s.id);
      if (sheetIds.length === 0) return {};
      const { data } = await supabase
        .from('attendance_signatures')
        .select('user_id, present, is_late, is_excused')
        .in('attendance_sheet_id', sheetIds)
        .eq('user_type', 'student');
      const stats: Record<string, { absences: number; lates: number; excused: number }> = {};
      (data || []).forEach((sig: any) => {
        if (!stats[sig.user_id]) stats[sig.user_id] = { absences: 0, lates: 0, excused: 0 };
        if (sig.present === false) {
          stats[sig.user_id].absences += 1;
          if (sig.is_excused) stats[sig.user_id].excused += 1;
        }
        if (sig.is_late) stats[sig.user_id].lates += 1;
      });
      return stats;
    },
    enabled: !!selectedFormation,
  });

  // Saved transcript template (for custom bulletin layout)

  // ⭐ Bulletin configuration (cascade-resolved for this period)
  const { data: bulletinConfig = DEFAULT_CONFIG } = useQuery({
    queryKey: ['bulletin-config-resolved', periodId],
    queryFn: () => resolveConfigForPeriod(periodId!),
    enabled: !!periodId,
  });

  // ⭐ Server-side computed bulletins (honors sources_config / calculation_rules
  //    incl. multi-period combinations like "BTS blanc"). Falls back to client
  //    calculation when the edge function is unavailable.
  const { data: computedResponse } = useQuery<ComputeBulletinResponse | null>({
    queryKey: ['computed-bulletins', selectedFormation, periodId],
    queryFn: async () => {
      if (!selectedFormation || !periodId) return null;
      try {
        return await computeBulletins({ formation_id: selectedFormation, period_id: periodId });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[TranscriptsPanel] compute-bulletin unavailable, using client calc:', e);
        return null;
      }
    },
    enabled: !!selectedFormation && !!periodId,
    staleTime: 30_000,
    retry: false,
  });
  const { data: savedTemplate } = useQuery({
    queryKey: ['transcript-template-render', selectedFormation],
    queryFn: () => getTranscriptTemplate(selectedFormation),
    enabled: !!selectedFormation,
  });

  // Extract layout config from saved template (with defaults)
  const templateLayout = useMemo(() => {
    const tpl: any = savedTemplate || {};
    const hc: any = tpl.header_config || {};
    const fc: any = tpl.footer_config || {};
    const cc: any = tpl.columns_config || {};
    const hasCustom = Array.isArray(hc.elements) && hc.elements.length > 0;
    return {
      hasCustom,
      headerElements: Array.isArray(hc.elements) && hc.elements.length > 0 ? hc.elements : DEFAULT_HEADER_ELEMENTS,
      bodyElements: Array.isArray(cc.bodyElements) && cc.bodyElements.length > 0 ? cc.bodyElements : DEFAULT_BODY_ELEMENTS,
      footerElements: Array.isArray(fc.elements) && fc.elements.length > 0 ? fc.elements : DEFAULT_FOOTER_ELEMENTS,
      tableColumns: Array.isArray(cc.tableColumns) && cc.tableColumns.length > 0 ? cc.tableColumns : DEFAULT_TABLE_COLUMNS,
      tableStyle: cc.tableStyle ? { ...DEFAULT_TABLE_STYLE, ...cc.tableStyle } : DEFAULT_TABLE_STYLE,
    };
  }, [savedTemplate]);

  // Filter modules by semester - fallback to all modules if none match
  const modules = useMemo(() => {
    if (!activeSemesterNums || activeSemesterNums.length === 0) return allModules;
    const filtered = allModules.filter((m: any) => semesterMatchesFilter(m.semester, activeSemesterNums));
    // Fallback: if no modules match the semester filter, show all modules
    return filtered.length > 0 ? filtered : allModules;
  }, [allModules, activeSemesterNums]);

  const { data: teachingUnits = [] } = useQuery({
    queryKey: ['teaching-units-transcripts', selectedFormation],
    queryFn: async () => {
      const { data } = await supabase
        .from('teaching_units')
        .select('id, title, code, order_index')
        .eq('formation_id', selectedFormation)
        .order('order_index');
      return data || [];
    },
    enabled: !!selectedFormation,
  });

  const { data: competencyBlocks = [] } = useQuery({
    queryKey: ['competency-blocks-transcripts', selectedFormation],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competency_blocks')
        .select('id, title, code, order_index, coefficient')
        .eq('formation_id', selectedFormation)
        .order('order_index');
      if (error) return [];
      return data || [];
    },
    enabled: !!selectedFormation,
    retry: false,
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations-transcripts', selectedFormation, periodId],
    queryFn: async () => {
      const allEvals = await getEvaluations(selectedFormation);
      // ⭐ STRICT period isolation: only return evaluations explicitly linked
      // to the currently selected period. Evaluations with NULL period_id are
      // NOT shown anymore (no cross-period contamination).
      if (!periodId) return [];
      return allEvals.filter(e => e.period_id === periodId);
    },
    enabled: !!selectedFormation && !!periodId,
  });

  const { data: allGrades = new Map(), isLoading } = useQuery({
    queryKey: ['all-grades-transcripts', evaluations.map(e => e.id).join(',')],
    queryFn: async () => {
      const gradesMap = new Map<string, any[]>();
      for (const ev of evaluations) {
        const grades = await getGradesByEvaluation(ev.id);
        gradesMap.set(ev.id, grades);
      }
      return gradesMap;
    },
    enabled: evaluations.length > 0,
  });

  const { data: gradingRules } = useQuery({
    queryKey: ['grading-rules-transcripts', selectedFormation],
    queryFn: () => getGradingRules(selectedFormation),
    enabled: !!selectedFormation,
  });

  // Published semesters
  const { data: publishedSemesters = [], refetch: refetchPublished } = useQuery({
    queryKey: ['published-transcripts', selectedFormation],
    queryFn: async () => {
      const { data } = await supabase
        .from('published_transcripts')
        .select('*')
        .eq('formation_id', selectedFormation)
        .order('semester_number');
      return data || [];
    },
    enabled: !!selectedFormation,
  });

  const handlePublish = async () => {
    if (!publishSemester || !selectedFormation || !userId) return;
    setIsPublishing(true);
    try {
      // publishSemester format: "period-<uuid>"
      let periodId: string | null = null;
      let semesterNumber: number = 0;
      let displayName = '';
      if (publishSemester.startsWith('period-')) {
        periodId = publishSemester.substring('period-'.length);
        const period = periods.find((p: any) => p.id === periodId);
        if (period) {
          displayName = period.name;
          // Best-effort numeric semester from period order or name
          const m = period.name.match(/\d+/);
          semesterNumber = m ? parseInt(m[0]) : (periods.indexOf(period) + 1);
        }
      } else {
        semesterNumber = parseInt(publishSemester);
        displayName = `Semestre ${semesterNumber}`;
      }
      const { error } = await supabase
        .from('published_transcripts')
        .upsert({
          formation_id: selectedFormation,
          semester_number: semesterNumber,
          period_id: periodId,
          published_by: userId,
          published_at: new Date().toISOString(),
          academic_year: selectedFormationData?.academic_year || null,
        } as any, { onConflict: periodId ? 'formation_id,period_id' : 'formation_id,semester_number' });
      if (error) throw error;
      await refetchPublished();
      setShowPublishDialog(false);
      setPublishSemester('');
      toast.success(`${displayName} publié avec succès`);
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la publication');
    } finally {
      setIsPublishing(false);
    }
  };

  // Load transcript template
  const { data: template } = useQuery({
    queryKey: ['transcript-template', selectedFormation],
    queryFn: () => getTranscriptTemplate(selectedFormation),
    enabled: !!selectedFormation,
  });

  const tplColumns: TranscriptTemplateConfig = template?.columns_config || {
    sections: [],
    ccColumns: ['moyenne_stagiaire', 'moyenne_classe', 'appreciation'],
    examColumns: ['notes', 'coefficient', 'points', 'appreciation'],
    showExamSection: true,
  };
  const tplHeader: TranscriptHeaderConfig = template?.header_config || {
    title: 'Bulletin de Formation',
    showLogo: true,
    showSession: true,
    subtitle: '',
  };
  const tplFooter: TranscriptFooterConfig = template?.footer_config || {
    showAssiduity: true,
    customText: '',
    showSignature: true,
  };
  const tplStyle: TranscriptStyleConfig = template?.style_config || {
    primaryColor: '#3b82f6',
    fontFamily: 'Segoe UI',
  };

  // Split evaluations by type using categories from EVALUATION_TYPES
  const ccTypes = EVALUATION_TYPES.filter(t => t.category === 'cc').map(t => t.value);
  
  const ccEvaluations = useMemo(() =>
    evaluations.filter(e => ccTypes.includes(e.evaluation_type)),
    [evaluations]
  );

  // Examen blanc (BTS specific - separate section)
  const examBlancEvaluations = useMemo(() =>
    evaluations.filter(e => e.evaluation_type === 'examen_blanc'),
    [evaluations]
  );

  // Other exams (partiel, examen_final, rattrapage)
  const examEvaluations = useMemo(() =>
    evaluations.filter(e => !ccTypes.includes(e.evaluation_type) && e.evaluation_type !== 'examen_blanc'),
    [evaluations]
  );

  // Module grouping: use template sections if available, otherwise fallback to teaching units
  const moduleGroups = useMemo(() => {
    // Grouping by semester
    if (groupingMode === 'semester') {
      const grouped: { id: string; title: string; mods: typeof modules }[] = [];
      const semNums = [...new Set(modules.map((m: any) => m.semester).filter(Boolean))].sort((a, b) => (a as number) - (b as number));
      for (const sem of semNums) {
        const semMods = modules.filter((m: any) => m.semester === sem);
        if (semMods.length > 0) {
          grouped.push({ id: `sem-${sem}`, title: `Semestre ${sem}`, mods: semMods });
        }
      }
      const noSem = modules.filter((m: any) => !m.semester);
      if (noSem.length > 0) grouped.push({ id: 'no-sem', title: 'Non assigné', mods: noSem });
      if (grouped.length === 0 && modules.length > 0) grouped.push({ id: 'all', title: 'Matières', mods: modules });
      return grouped;
    }

    // Grouping by competency block
    if (groupingMode === 'bloc' && competencyBlocks.length > 0) {
      const grouped: { id: string; title: string; mods: typeof modules }[] = [];
      const assignedIds = new Set<string>();
      for (const block of competencyBlocks) {
        const blockMods = modules.filter((m: any) => m.competency_block_id === block.id);
        if (blockMods.length > 0) {
          grouped.push({ id: block.id, title: `${block.code ? block.code + ' - ' : ''}${block.title}`, mods: blockMods });
          blockMods.forEach(m => assignedIds.add(m.id));
        }
      }
      const unassigned = modules.filter(m => !assignedIds.has(m.id));
      if (unassigned.length > 0) grouped.push({ id: 'other', title: 'Autres matières', mods: unassigned });
      if (grouped.length === 0 && modules.length > 0) grouped.push({ id: 'all', title: 'Matières', mods: modules });
      return grouped;
    }

    // Grouping by section (template sections > teaching units > flat)
    // If template has sections defined, use them
    if (tplColumns.sections.length > 0) {
      const groups: { id: string; title: string; mods: typeof modules }[] = [];
      const assignedIds = new Set<string>();

      for (const section of tplColumns.sections) {
        const sectionMods = section.moduleIds
          .map(id => modules.find(m => m.id === id))
          .filter(Boolean) as typeof modules;
        if (sectionMods.length > 0) {
          groups.push({ id: section.id, title: section.title, mods: sectionMods });
          sectionMods.forEach(m => assignedIds.add(m.id));
        }
      }

      const unassigned = modules.filter(m => !assignedIds.has(m.id));
      if (unassigned.length > 0) {
        groups.push({ id: 'other', title: 'Autres', mods: unassigned });
      }

      return groups;
    }

    // Fallback: group by teaching unit
    const grouped: { id: string; title: string; mods: typeof modules }[] = [];
    const unitsUsed = new Set<string>();

    for (const tu of teachingUnits) {
      const unitMods = modules.filter(m => m.teaching_unit_id === tu.id);
      if (unitMods.length > 0) {
        grouped.push({ id: tu.id, title: tu.title, mods: unitMods });
        unitsUsed.add(tu.id);
      }
    }

    const unassigned = modules.filter(m => !m.teaching_unit_id || !unitsUsed.has(m.teaching_unit_id));
    if (unassigned.length > 0) grouped.push({ id: 'ungrouped', title: 'Matières', mods: unassigned });
    if (grouped.length === 0 && modules.length > 0) grouped.push({ id: 'all', title: 'Matières', mods: modules });

    return grouped;
  }, [modules, teachingUnits, tplColumns.sections, groupingMode, competencyBlocks]);

  // Build bulletins
  const bulletins: StudentBulletin[] = useMemo(() => {
    if (!students.length) return [];
    // If no modules for this semester, still show students with empty data
    if (!modules.length) {
      return students.map(student => ({
        studentId: student.user_id,
        studentName: `${student.last_name} ${student.first_name}`,
        studentEmail: student.email || '',
        modules: [],
        ccGeneralAverage: null,
        ccClassGeneralAverage: null,
        examTotalPoints: 0,
        examTotalCoeff: 0,
        examBlancTotalPoints: 0,
        examBlancTotalCoeff: 0,
        mention: null,
        decision: 'en_cours',
      }));
    }

    const defaultRules = {
      validation_threshold: 10, allow_compensation: true, compensation_threshold: 8,
      mention_passable_threshold: 10, mention_ab_threshold: 12, mention_bien_threshold: 14, mention_tb_threshold: 16,
    };
    const rules = gradingRules || defaultRules;

    const getStudentModuleCCAvg = (sId: string, modId: string): number | null => {
      const modCCEvals = ccEvaluations.filter(e => e.module_id === modId);
      const grades = modCCEvals.map(e => allGrades.get(e.id)?.find((g: any) => g.student_id === sId)).filter(Boolean);
      return calculateModuleAverage(grades, 20);
    };

    const getStudentModuleExamScore = (sId: string, modId: string): number | null => {
      const modExamEvals = examEvaluations.filter(e => e.module_id === modId);
      const grades = modExamEvals.map(e => allGrades.get(e.id)?.find((g: any) => g.student_id === sId)).filter(Boolean);
      return calculateModuleAverage(grades, 20);
    };

    const getStudentModuleExamBlancScore = (sId: string, modId: string): number | null => {
      const modExamBlancEvals = examBlancEvaluations.filter(e => e.module_id === modId);
      const grades = modExamBlancEvals.map(e => allGrades.get(e.id)?.find((g: any) => g.student_id === sId)).filter(Boolean);
      return calculateModuleAverage(grades, 20);
    };

    return students.map(student => {
      const studentModules: ModuleBulletinData[] = modules.map(mod => {
        const ccAvg = getStudentModuleCCAvg(student.user_id, mod.id);
        const examScore = getStudentModuleExamScore(student.user_id, mod.id);
        const examBlancScore = getStudentModuleExamBlancScore(student.user_id, mod.id);

        const classCCAvgs = students.map(s => getStudentModuleCCAvg(s.user_id, mod.id)).filter(v => v !== null) as number[];
        const classExamAvgs = students.map(s => getStudentModuleExamScore(s.user_id, mod.id)).filter(v => v !== null) as number[];
        const classExamBlancAvgs = students.map(s => getStudentModuleExamBlancScore(s.user_id, mod.id)).filter(v => v !== null) as number[];

        const ccClassAvg = classCCAvgs.length > 0 ? Math.round((classCCAvgs.reduce((a, b) => a + b, 0) / classCCAvgs.length) * 100) / 100 : null;
        const examClassAvg = classExamAvgs.length > 0 ? Math.round((classExamAvgs.reduce((a, b) => a + b, 0) / classExamAvgs.length) * 100) / 100 : null;
        const examBlancClassAvg = classExamBlancAvgs.length > 0 ? Math.round((classExamBlancAvgs.reduce((a, b) => a + b, 0) / classExamBlancAvgs.length) * 100) / 100 : null;

        // Determine exam blanc type (oral if module title contains "oral")
        const isOral = mod.title.toLowerCase().includes('oral');
        const examBlancType: 'ecrit' | 'oral' | null = examBlancScore !== null || examBlancEvaluations.some(e => e.module_id === mod.id) 
          ? (isOral ? 'oral' : 'ecrit') 
          : null;

        return {
          moduleId: mod.id,
          moduleTitle: mod.title,
          coefficient: (mod as any).coefficient || 1,
          ccAverage: ccAvg,
          ccClassAverage: ccClassAvg,
          examScore,
          examClassAverage: examClassAvg,
          examPoints: examScore !== null ? Math.round(examScore * ((mod as any).coefficient || 1) * 100) / 100 : null,
          examBlancScore,
          examBlancClassAverage: examBlancClassAvg,
          examBlancPoints: examBlancScore !== null ? Math.round(examBlancScore * ((mod as any).coefficient || 1) * 100) / 100 : null,
          examBlancType,
          appreciation: '',
          teachingUnitId: mod.teaching_unit_id,
        };
      });

      const ccGeneralAvg = calculateWeightedAverage(
        studentModules.map(m => ({ average: m.ccAverage, coefficient: m.coefficient }))
      );

      const allStudentCCAvgs = students.map(s => {
        const mods = modules.map(mod => ({
          average: getStudentModuleCCAvg(s.user_id, mod.id),
          coefficient: (mod as any).coefficient || 1,
        }));
        return calculateWeightedAverage(mods);
      }).filter(a => a !== null) as number[];

      const ccClassGeneralAvg = allStudentCCAvgs.length > 0
        ? Math.round((allStudentCCAvgs.reduce((a, b) => a + b, 0) / allStudentCCAvgs.length) * 100) / 100
        : null;

      const examTotalPoints = studentModules.reduce((sum, m) => sum + (m.examPoints || 0), 0);
      const examTotalCoeff = modules.reduce((sum, m) => sum + ((m as any).coefficient || 1), 0);

      const examBlancTotalPoints = studentModules.reduce((sum, m) => sum + (m.examBlancPoints || 0), 0);
      const examBlancModules = studentModules.filter(m => m.examBlancType !== null);
      const examBlancTotalCoeff = examBlancModules.reduce((sum, m) => sum + m.coefficient, 0);

      const generalAvg = ccGeneralAvg;
      const decision = generalAvg !== null ? getDecision(generalAvg, rules as any) : 'en_cours';
      const mention = generalAvg !== null ? getMention(generalAvg, rules as any) : null;

      return {
        studentId: student.user_id,
        studentName: `${student.last_name} ${student.first_name}`,
        studentEmail: student.email || '',
        modules: studentModules,
        ccGeneralAverage: ccGeneralAvg,
        ccClassGeneralAverage: ccClassGeneralAvg,
        examTotalPoints: Math.round(examTotalPoints * 100) / 100,
        examTotalCoeff,
        examBlancTotalPoints: Math.round(examBlancTotalPoints * 100) / 100,
        examBlancTotalCoeff,
        decision,
        mention,
      };
    });
  }, [students, modules, evaluations, allGrades, gradingRules, ccEvaluations, examEvaluations, examBlancEvaluations]);

  const currentBulletin = currentStudentIndex !== null ? (bulletins[currentStudentIndex] || null) : null;
  const selectedFormationData = availableFormations.find((f: any) => f.id === selectedFormation);

  // Composite period rendering — fully removed. Each period is independent
  // and renders the standard OfficialBulletinTemplate.

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const pc = tplStyle.primaryColor;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Bulletin - ${currentBulletin?.studentName}</title>
      <style>
        body { font-family: '${tplStyle.fontFamily}', Arial, sans-serif; padding: 20px; color: #1a1a1a; font-size: 12px; }
        .bulletin-header { text-align: center; margin-bottom: 15px; }
        .bulletin-header h1 { font-size: 16px; color: ${pc}; margin: 5px 0; }
        .bulletin-header h2 { font-size: 13px; margin: 3px 0; }
        .student-bar { background: ${pc}33; padding: 8px 15px; text-align: center; font-weight: bold; font-size: 14px; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
        th, td { border: 1px solid #94a3b8; padding: 5px 8px; }
        th { background: ${pc}; color: white; font-weight: 600; }
        .section-title { background: ${pc}22; color: ${pc}; text-align: center; font-weight: bold; padding: 6px; }
        .total-row { background: ${pc}33; font-weight: bold; }
        .avg-green { color: #16a34a; }
        .avg-red { color: #dc2626; }
        .decision { text-align: center; padding: 10px; font-weight: bold; font-size: 14px; margin-top: 10px; border: 2px solid; }
        .decision.admis { border-color: #16a34a; color: #16a34a; background: #f0fdf4; }
        .decision.non-admis { border-color: #dc2626; color: #dc2626; background: #fef2f2; }
        @media print { body { padding: 10px; } }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  const avgColor = (val: number | null) => {
    if (val === null) return '';
    return val >= 10 ? 'text-green-600' : 'text-red-600';
  };

  const decisionLabel = (d: string) => DECISIONS.find(x => x.value === d)?.label || 'En cours';

  const hasExamData = examEvaluations.length > 0;
  const hasExamBlancData = examBlancEvaluations.length > 0;
  const showExam = tplColumns.showExamSection && hasExamData;
  const showExamBlanc = hasExamBlancData;
  const formationType = (selectedFormationData as any)?.formation_type || 'ecole_sup';
  const isBTS = formationType === 'bts';

  // CC columns visibility
  const showCCMoyenne = tplColumns.ccColumns.includes('moyenne_stagiaire');
  const showCCClasseMoyenne = tplColumns.ccColumns.includes('moyenne_classe');
  const showCCAppreciation = tplColumns.ccColumns.includes('appreciation');
  const ccColCount = 1 + (showCCMoyenne ? 1 : 0) + (showCCClasseMoyenne ? 1 : 0) + (showCCAppreciation ? 1 : 0);

  // Exam columns visibility
  const showExamNotes = tplColumns.examColumns.includes('notes');
  const showExamCoeff = tplColumns.examColumns.includes('coefficient');
  const showExamPoints = tplColumns.examColumns.includes('points');
  const showExamAppreciation = tplColumns.examColumns.includes('appreciation');
  const examColCount = 1 + (showExamNotes ? 1 : 0) + (showExamCoeff ? 1 : 0) + (showExamPoints ? 1 : 0) + (showExamAppreciation ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-wrap items-center">
          {!propFormationId && (
            <Select value={selectedFormation} onValueChange={(v) => { setInternalFormation(v); setSemesterView(''); setCurrentStudentIndex(0); }}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Sélectionner une formation" />
              </SelectTrigger>
              <SelectContent>
                {availableFormations.map((f: any) => (
                  <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {/* Period selector now handled by parent (Notes page) — internal S1/S2 buttons removed */}
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {isAdmin && selectedFormation && (
            <Button variant="default" size="sm" onClick={() => setShowPublishDialog(true)} className="gap-2">
              <Send className="h-4 w-4" />
              Publier les relevés
            </Button>
          )}
        </div>
      </div>

      {/* Publish Dialog - Enhanced with flexible options */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Publier les releves de notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Sélectionnez les bulletins à publier. Les étudiants pourront consulter leur relevé dans leur espace.
            </p>

            {/* All available periods/bulletins */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">Bulletins disponibles</p>
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {periods.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-3">Aucune période d'évaluation. Créez-en une depuis l'onglet principal.</p>
                ) : (
                  periods.map((p: any) => {
                    const isSelected = publishSemester === `period-${p.id}`;
                    const isPublished = publishedSemesters.some((ps: any) => ps.period_id === p.id);
                    // Color by period type — composite logic deprecated.
                    const colorClass = (p.period_type === 'examen_blanc' || p.period_type === 'examen_final')
                      ? (isSelected ? 'bg-amber-500 text-white border-amber-500' : 'border-amber-300 text-amber-700 hover:bg-amber-50')
                      : (isSelected ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50');
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPublishSemester(isSelected ? '' : `period-${p.id}`)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${colorClass}`}
                        data-testid={`publish-period-${p.id}`}
                      >
                        {isPublished && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                        <span className="flex-1 text-left">{p.name}</span>
                        <span className="text-[10px] uppercase tracking-wider opacity-70">{p.period_type}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Already published */}
            {publishedSemesters.length > 0 && (
              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">Déjà publiés :</p>
                <div className="flex flex-wrap gap-1.5">
                  {publishedSemesters.map((ps: any) => (
                    <Badge key={ps.id} variant="secondary" className="gap-1 text-xs">
                      <Check className="h-3 w-3 text-green-500" />
                      {ps.period_id ? (periods.find((p: any) => p.id === ps.period_id)?.name || `S${ps.semester_number}`) : `S${ps.semester_number}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>Annuler</Button>
            <Button 
              onClick={handlePublish} 
              disabled={!publishSemester || isPublishing}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {isPublishing ? 'Publication...' : 'Publier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!selectedFormation ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Sélectionnez une formation</h3>
            <p className="text-sm text-muted-foreground">Choisissez une formation pour afficher les relevés de notes</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : bulletins.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Aucun étudiant</h3>
          </CardContent>
        </Card>
      ) : (
        /* ============ LISTE DES ÉTUDIANTS ============ */
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground mb-3">
            {bulletins.length} étudiant(s) • {selectedFormationData?.title} • {currentPeriodLabel}
          </div>
          {isCombinedPeriod && combinedSourcePeriods.length > 0 && (
            <div
              className="mb-3 px-3 py-2 rounded-md border border-purple-200 bg-purple-50 text-purple-800 text-xs flex items-center gap-2"
              data-testid="combined-period-notice"
            >
              <span className="font-semibold">Période combinée</span>
              <span>—</span>
              <span>
                Empile{' '}
                <strong>{(combinedSourcePeriods as any[]).map((p: any) => p.name).join(' + ')}</strong>
                {' '}selon la règle{' '}
                <strong>
                  {(((currentPeriod as any)?.composite_config as any)?.calculation_rule) === 'simple_average' && 'moyenne simple'}
                  {(((currentPeriod as any)?.composite_config as any)?.calculation_rule) === 'weighted_average' && 'moyenne pondérée'}
                  {(((currentPeriod as any)?.composite_config as any)?.calculation_rule) === 'weighted_by_coefficient' && 'pondérée par coefficient'}
                </strong>
                . Cliquez sur <em>Voir</em> pour afficher le bulletin combiné complet.
              </span>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-primary/10">
                  <th className="text-left p-3 border-b border-border font-semibold">#</th>
                  <th className="text-left p-3 border-b border-border font-semibold">Étudiant</th>
                  <th className="text-center p-3 border-b border-border font-semibold">Moyenne Générale</th>
                  <th className="text-center p-3 border-b border-border font-semibold">Mention</th>
                  <th className="text-center p-3 border-b border-border font-semibold">Décision</th>
                  <th className="text-center p-3 border-b border-border font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {bulletins.map((b, idx) => {
                  const sb = computedResponse?.bulletins.find((s) => s.student_id === b.studentId);
                  const displayAvg = sb?.general_average ?? b.ccGeneralAverage;
                  const displayMention = sb?.mention ?? (b.mention ? (MENTIONS.find((m: any) => m.value === b.mention)?.label || '') : '');
                  const displayDecision = sb ? sb.decision : decisionLabel(b.decision);
                  const displayAdmitted: boolean | null = sb ? sb.admitted : null;
                  return (
                  <tr key={b.studentId} className="hover:bg-muted/30 border-b border-border/50">
                    <td className="p-3 text-muted-foreground">{idx + 1}</td>
                    <td className="p-3 font-medium whitespace-nowrap">{b.studentName}</td>
                    <td className={`p-3 text-center font-bold ${avgColor(displayAvg)}`}>
                      {isCombinedPeriod
                        ? <span className="text-xs italic text-muted-foreground">Voir le bulletin →</span>
                        : (displayAvg !== null ? `${displayAvg.toFixed(2)}/20` : '—')}
                    </td>
                    <td className="p-3 text-center">
                      {isCombinedPeriod ? <span className="text-xs text-muted-foreground">—</span>
                        : displayMention ? (
                          <Badge variant="outline" className="text-[10px]">
                            {displayMention}
                          </Badge>
                        ) : '—'}
                    </td>
                    <td className="p-3 text-center">
                      {isCombinedPeriod ? (
                        <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                          Bulletin combiné
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${displayAdmitted === true ? 'text-green-700 bg-green-50 border-green-200' : displayAdmitted === false ? 'text-red-700 bg-red-50 border-red-200' : (DECISIONS.find(d => d.value === b.decision)?.color || '')}`}
                        >
                          {displayDecision}
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <Button size="sm" variant="outline" onClick={() => { setCurrentStudentIndex(idx); setShowBulletinDialog(true); }} className="h-7 px-3 gap-1.5" data-testid={`view-bulletin-${b.studentId}`}>
                        <Eye className="h-3.5 w-3.5" />
                        Voir
                      </Button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============ DIALOG BULLETIN ÉTUDIANT ============ */}
      <Dialog open={showBulletinDialog} onOpenChange={(open) => { setShowBulletinDialog(open); if (!open) setCurrentStudentIndex(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          {currentBulletin && (() => {
            // Compute rank
            const sortedBulletins = [...bulletins].sort((a, b) => (b.ccGeneralAverage ?? 0) - (a.ccGeneralAverage ?? 0));
            const rank = sortedBulletins.findIndex(b => b.studentId === currentBulletin.studentId) + 1;
            const totalStudents = bulletins.length;

            // DS evaluations (devoir_surveille type)
            const getStudentModuleDSAvg = (sId: string, modId: string): number | null => {
              const dsEvals = evaluations.filter(e => e.module_id === modId && e.evaluation_type === 'devoir_surveille');
              if (dsEvals.length === 0) return null;
              const grades = dsEvals.map(e => allGrades.get(e.id)?.find((g: any) => g.student_id === sId)).filter(Boolean);
              return calculateModuleAverage(grades, 20);
            };

            // Exam final
            const getStudentModuleExamFinal = (sId: string, modId: string): number | null => {
              const examFinalEvals = evaluations.filter(e => e.module_id === modId && (e.evaluation_type === 'examen_final' || e.evaluation_type === 'partiel'));
              if (examFinalEvals.length === 0) return null;
              const grades = examFinalEvals.map(e => allGrades.get(e.id)?.find((g: any) => g.student_id === sId)).filter(Boolean);
              return calculateModuleAverage(grades, 20);
            };

            // Oral/Soutenance
            const getStudentModuleOral = (sId: string, modId: string): number | null => {
              const oralEvals = evaluations.filter(e => e.module_id === modId && (e.evaluation_type === 'oral' || e.evaluation_type === 'soutenance'));
              if (oralEvals.length === 0) return null;
              const grades = oralEvals.map(e => allGrades.get(e.id)?.find((g: any) => g.student_id === sId)).filter(Boolean);
              return calculateModuleAverage(grades, 20);
            };

            const getAppreciation = (avg: number | null): string => {
              if (avg === null) return '';
              if (avg >= 16) return 'Excellent. Très bon travail.';
              if (avg >= 14) return 'Résultats satisfaisants. Peut mieux faire.';
              if (avg >= 12) return 'Résultats satisfaisants. Peut mieux faire.';
              if (avg >= 10) return 'Niveau acceptable. Des efforts sont nécessaires.';
              if (avg >= 8) return 'Résultats insuffisants. Doit progresser.';
              return 'Résultats très insuffisants.';
            };

            const getStatut = (avg: number | null): { label: string; color: string } => {
              if (avg === null) return { label: '—', color: '' };
              if (avg >= 10) return { label: 'Validé', color: 'text-green-700 bg-green-100' };
              return { label: 'Non validé', color: 'text-red-700 bg-red-100' };
            };

            // Student first/last name split
            const nameParts = currentBulletin.studentName.split(' ');
            const academicYear = selectedFormationData?.start_date && selectedFormationData?.end_date
              ? `${format(new Date(selectedFormationData.start_date), 'yyyy')}-${format(new Date(selectedFormationData.end_date), 'yyyy')}`
              : '';
            const refNumber = `${String((currentStudentIndex ?? 0) + 1).padStart(4, '0')}/S${semesterView.replace('s', '') || '1'}/${format(new Date(), 'yyyy')}`;

            return (
              <>
                {/* Navigation header */}
                <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
                  <Button variant="ghost" size="sm" disabled={currentStudentIndex === null || currentStudentIndex <= 0} onClick={() => setCurrentStudentIndex(p => (p ?? 1) - 1)} className="gap-1">
                    <ChevronLeft className="h-4 w-4" /> Précédent
                  </Button>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{currentBulletin.studentName}</span>
                    <Badge variant="secondary" className="text-xs">{(currentStudentIndex ?? 0) + 1} / {bulletins.length}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1">
                      <Printer className="h-3.5 w-3.5" /> Imprimer
                    </Button>
                    <Button variant="ghost" size="sm" disabled={currentStudentIndex === null || currentStudentIndex >= bulletins.length - 1} onClick={() => setCurrentStudentIndex(p => (p ?? 0) + 1)} className="gap-1">
                      Suivant <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div ref={printRef} className="bulletin bg-white text-[#1a1a2e]">
                  {isCombinedPeriod && currentPeriod ? (
                    /* ===== COMBINED BULLETIN (vertical stack of source periods + final summary) ===== */
                    (() => {
                      const studentExtra = studentExtrasById.get(currentBulletin.studentId);
                      const studentMatricule = studentExtra?.matricule || refNumber.split('/')[0] || nameParts.join('').substring(0, 8).toUpperCase();
                      const studentAbs = (absenceStats as any)?.[currentBulletin.studentId] || { absences: 0, lates: 0, excused: 0 };
                      return (
                        <CombinedBulletinRenderer
                          combinedPeriod={currentPeriod as any}
                          combinedConfig={bulletinConfig}
                          sourcePeriods={combinedSourcePeriods as any}
                          studentId={currentBulletin.studentId}
                          studentFullName={currentBulletin.studentName}
                          studentMatricule={studentMatricule}
                          studentDateOfBirth={studentExtra?.dob}
                          formationId={selectedFormation}
                          formationTitle={selectedFormationData?.title || ''}
                          formationLevel={(selectedFormationData as any)?.level}
                          academicYear={academicYear}
                          establishmentName={establishment?.name || ''}
                          establishmentLogoUrl={establishment?.logo_url}
                          establishmentAddress={(establishment as any)?.address}
                          establishmentPhone={(establishment as any)?.phone}
                          establishmentWebsite={(establishment as any)?.website}
                          referenceNumber={refNumber}
                          signatories={signatories as any}
                          absenceStats={studentAbs}
                          instructorsByModuleId={instructorsByModuleId}
                        />
                      );
                    })()
                  ) : templateLayout.hasCustom && false ? (
                    /* ===== CUSTOM TEMPLATE-DRIVEN BULLETIN ===== */
                    <div className="flex justify-center p-4">
                      <BulletinTemplateRenderer
                        headerElements={templateLayout.headerElements}
                        bodyElements={templateLayout.bodyElements}
                        footerElements={templateLayout.footerElements}
                        tableColumns={(() => {
                          // Auto-filter: only keep columns whose evaluation type actually exists for this period
                          const existingTypes = new Set<string>();
                          evaluations.forEach((e: any) => existingTypes.add(e.evaluation_type));
                          const ccTypes = EVALUATION_TYPES.filter((t) => t.category === 'cc').map((t) => t.value);
                          const hasCC = ccTypes.some((t) => existingTypes.has(t));
                          const hasDS = existingTypes.has('partiels') || existingTypes.has('ds');
                          const hasExam = existingTypes.has('examen_final') || existingTypes.has('examen_blanc');
                          const hasOral = existingTypes.has('oral') || existingTypes.has('soutenance');
                          const hasTP = existingTypes.has('tp');
                          return templateLayout.tableColumns.filter((c: any) => {
                            // Always keep these structural columns
                            if (['module', 'coefficient', 'moyenne', 'points', 'credits', 'status', 'appreciation', 'rang', 'custom_static', 'custom_formula'].includes(c.key)) return true;
                            if (c.key === 'cc') return hasCC;
                            if (c.key === 'ds') return hasDS;
                            if (c.key === 'exam') return hasExam;
                            if (c.key === 'oral') return hasOral;
                            if (c.key === 'tp') return hasTP;
                            return true;
                          });
                        })()}
                        tableStyle={templateLayout.tableStyle}
                        data={(() => {
                          const d: BulletinRenderData = {
                            nom_complet: currentBulletin.studentName,
                            prenom: nameParts[0] || '',
                            nom: nameParts.slice(1).join(' ') || nameParts[0] || '',
                            numero_etudiant: String((currentStudentIndex ?? 0) + 1).padStart(4, '0'),
                            formation: selectedFormationData?.title || '',
                            niveau: (selectedFormationData as any)?.level || '',
                            annee_academique: academicYear,
                            periode: periodName || semesterView,
                            etablissement: establishment?.name || '',
                            adresse_etablissement: (establishment as any)?.address || '',
                            moyenne_generale: currentBulletin.ccGeneralAverage !== null ? currentBulletin.ccGeneralAverage.toFixed(2) : '—',
                            rang: `${rank} / ${totalStudents}`,
                            mention: currentBulletin.ccGeneralAverage !== null ? (getMention(currentBulletin.ccGeneralAverage, gradingRules as any) || '—') : '—',
                            decision: currentBulletin.ccGeneralAverage !== null ? (getDecision(currentBulletin.ccGeneralAverage, gradingRules as any) === 'admis' ? 'Admis' : 'Ajourné') : 'En cours',
                            credits_acquis: '—',
                            numero_bulletin: refNumber,
                            date_emission: format(new Date(), 'dd/MM/yyyy'),
                            code_verification: refNumber,
                          };
                          return d;
                        })()}
                        rows={(() => {
                          const tableRows: BulletinTableRow[] = [];
                          modules.forEach((mod: any) => {
                            const modData = currentBulletin.modules.find(m => m.moduleId === mod.id);
                            if (!modData) return;
                            const dsAvg = getStudentModuleDSAvg(currentBulletin.studentId, mod.id);
                            const examFinal = getStudentModuleExamFinal(currentBulletin.studentId, mod.id);
                            const oral = getStudentModuleOral(currentBulletin.studentId, mod.id);
                            const moy = modData.ccAverage;
                            tableRows.push({
                              module: mod.title,
                              coefficient: mod.coefficient || 1,
                              cc: modData.ccAverage,
                              ds: dsAvg,
                              exam: examFinal,
                              oral: oral,
                              tp: null,
                              moyenne: moy !== null ? moy.toFixed(2) : '—',
                              points: moy !== null ? (moy * (mod.coefficient || 1)).toFixed(2) : '—',
                              credits: '—',
                              status: moy !== null && moy >= 10 ? 'Validé' : (moy !== null ? 'Ajourné' : '—'),
                              appreciation: getAppreciation(moy),
                            });
                          });
                          return tableRows;
                        })()}
                        establishmentLogo={establishment?.logo_url}
                        signatories={signatories as any}
                      />
                    </div>
                  ) : (
                  <>
                  {(() => {
                    const studentExtra = studentExtrasById.get(currentBulletin.studentId);
                    const nameParts = currentBulletin.studentName.split(' ');
                    const studentMatricule = studentExtra?.matricule || refNumber.split('/')[0] || nameParts.join('').substring(0, 8).toUpperCase();

                    return (
                      ((currentPeriod as any)?.period_type === 'bts_blanc' || (currentPeriod as any)?.period_type === 'examen_blanc') ? (
                        <BtsBlancBulletinTemplate
                          period={currentPeriod as any}
                          config={bulletinConfig}
                          studentId={currentBulletin.studentId}
                          studentFullName={currentBulletin.studentName}
                          studentMatricule={studentMatricule}
                          formationId={selectedFormation}
                          formationTitle={selectedFormationData?.title || ''}
                          formationLevel={(selectedFormationData as any)?.level}
                          academicYear={academicYear}
                          establishmentName={establishment?.name || ''}
                          establishmentLogoUrl={establishment?.logo_url}
                          referenceNumber={refNumber}
                          signatories={signatories as any}
                          sourcePeriods={combinedSourcePeriods as any}
                          totalAdmissionThreshold={Number(((currentPeriod as any)?.composite_config as any)?.total_admission_threshold) || 220}
                        />
                      ) : (
                        <SimpleBulletinTemplate
                          period={currentPeriod as any}
                          config={bulletinConfig}
                          studentId={currentBulletin.studentId}
                          studentFullName={currentBulletin.studentName}
                          studentMatricule={studentMatricule}
                          formationId={selectedFormation}
                          formationTitle={selectedFormationData?.title || ''}
                          formationLevel={(selectedFormationData as any)?.level}
                          academicYear={academicYear}
                          establishmentName={establishment?.name || ''}
                          establishmentLogoUrl={establishment?.logo_url}
                          referenceNumber={refNumber}
                          signatories={signatories as any}
                          instructorsByModuleId={instructorsByModuleId}
                          sourcePeriods={combinedSourcePeriods as any}
                        />
                      )
                    );
                  })()}
                  </>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TranscriptsPanel;
