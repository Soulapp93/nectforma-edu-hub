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
// (TranscriptTemplateEditor replaced by BulletinConfigurationPanel — no longer used here)
// (SignaturesCachetTab no longer imported — replaced by BulletinConfigurationPanel signatures tab)

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

  // Auto-init semesterView based on formation data
  useEffect(() => {
    if (selectedFormationObj && !semesterView) setSemesterView('s1');
  }, [selectedFormationObj]);

  const activePeriodIds = useMemo(() => {
    if (!semesterView || periods.length === 0) return [];
    if (semesterView === 'bulletin-global') {
      return periods.map(p => p.id);
    }
    if (semesterView.startsWith('bulletin-')) {
      const yearNum = parseInt(semesterView.split('-')[1]);
      const startIdx = (yearNum - 1) * 2;
      return periods.filter((_, idx) => idx >= startIdx && idx < startIdx + 2).map(p => p.id);
    }
    const semNum = parseInt(semesterView.replace('s', ''));
    const idx = semNum - 1;
    return periods[idx] ? [periods[idx].id] : [];
  }, [semesterView, periods]);

  const isFinalView = semesterView.startsWith('bulletin-');

  const activeSemesterNums = useMemo((): number[] | null => {
    if (!semesterView) return null;
    if (semesterView === 'bulletin-global') {
      return Array.from({ length: semestersCount }, (_, i) => i + 1);
    }
    if (semesterView.startsWith('bulletin-')) {
      const yearNum = parseInt(semesterView.split('-')[1]);
      return [(yearNum - 1) * 2 + 1, (yearNum - 1) * 2 + 2];
    }
    const num = parseInt(semesterView.replace('s', ''));
    return isNaN(num) ? null : [num];
  }, [semesterView, semestersCount]);

  const currentPeriodLabel = useMemo(() => {
    if (semesterView === 'bulletin-global') {
      return 'Bulletin de Formation';
    }
    if (isFinalView) {
      const yearNum = parseInt(semesterView.split('-')[1]);
      return durationYears === 1 ? 'Bulletin de Formation' : `Bulletin Année ${yearNum}`;
    }
    if (semesterView) {
      const semNum = parseInt(semesterView.replace('s', ''));
      return `Semestre ${semNum}`;
    }
    return '';
  }, [semesterView, isFinalView, durationYears]);

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
      const { data } = await supabase
        .from('formation_modules')
        .select('id, title, coefficient, order_index, teaching_unit_id, semester, competency_block_id')
        .eq('formation_id', selectedFormation)
        .order('order_index');
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

  // Saved transcript template (for custom bulletin layout)
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
      const { data } = await supabase
        .from('competency_blocks')
        .select('id, title, code, order_index, coefficient')
        .eq('formation_id', selectedFormation)
        .order('order_index');
      return data || [];
    },
    enabled: !!selectedFormation,
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations-transcripts', selectedFormation, semesterView, activePeriodIds.join(',')],
    queryFn: async () => {
      const allEvals = await getEvaluations(selectedFormation);
      if (!activeSemesterNums || activeSemesterNums.length === 0) return allEvals;
      
      // Filter by semester: use period_id if available, otherwise use module's semester
      return allEvals.filter(e => {
        if (e.period_id && activePeriodIds.length > 0) {
          return activePeriodIds.includes(e.period_id);
        }
        const mod = allModules.find(m => m.id === e.module_id);
        if (mod?.semester) {
          return activeSemesterNums.includes(mod.semester as number);
        }
        return true;
      });
    },
    enabled: !!selectedFormation,
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
      const { error } = await supabase
        .from('published_transcripts')
        .upsert({
          formation_id: selectedFormation,
          semester_number: parseInt(publishSemester),
          published_by: userId,
          published_at: new Date().toISOString(),
          academic_year: selectedFormationData?.academic_year || null,
        }, { onConflict: 'formation_id,semester_number' });
      if (error) throw error;
      await refetchPublished();
      setShowPublishDialog(false);
      setPublishSemester('');
      toast.success(`Relevés du Semestre ${publishSemester} publiés avec succès`);
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
          {/* Semester buttons - no bulletin buttons */}
          {semestersCount > 0 && selectedFormationObj && (
            <div className="flex flex-wrap items-center gap-1 bg-muted/50 rounded-xl p-1.5">
              {Array.from({ length: durationYears }, (_, y) => {
                const s1 = y * 2 + 1;
                const yearNum = y + 1;
                const publishedNums = publishedSemesters.map((ps: any) => ps.semester_number);
                return (
                  <React.Fragment key={yearNum}>
                    {durationYears > 1 && (
                      <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider ml-1.5 mr-0.5">A{yearNum}</span>
                    )}
                    {Array.from({ length: Math.min(2, semestersCount - y * 2) }, (_, si) => {
                      const semNum = s1 + si;
                      // Students only see published semesters
                      if (mode === 'student' && !publishedNums.includes(semNum)) return null;
                      const isPublished = publishedNums.includes(semNum);
                      return (
                        <button
                          key={`s${semNum}`}
                          onClick={() => { setSemesterView(`s${semNum}`); setCurrentStudentIndex(0); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            semesterView === `s${semNum}` 
                              ? 'bg-primary text-primary-foreground shadow-sm' 
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          S{semNum}
                          {isPublished && mode === 'admin' && <Check className="h-3 w-3 ml-1 inline text-green-500" />}
                        </button>
                      );
                    })}
                    {yearNum < durationYears && (
                      <div className="w-px h-5 bg-border mx-0.5" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
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
              Choisissez ce que vous souhaitez publier. Les etudiants pourront consulter leur releve dans leur espace.
            </p>

            {/* Semester selection */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">Periodes individuelles</p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: semestersCount }, (_, i) => {
                  const val = String(i + 1);
                  const isSelected = publishSemester === val;
                  const isPublished = publishedSemesters.some((ps: any) => ps.semester_number === i + 1);
                  return (
                    <button
                      key={i}
                      onClick={() => setPublishSemester(isSelected ? '' : val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : isPublished
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-background border-border hover:border-primary/50'
                      }`}
                    >
                      {isPublished && <Check className="h-3 w-3 inline mr-1" />}
                      Semestre {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Exam periods */}
            {periods.some((p: any) => p.period_type === 'examen_blanc' || p.period_type === 'examen_final') && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">Examens</p>
                <div className="flex flex-wrap gap-2">
                  {periods.filter((p: any) => p.period_type === 'examen_blanc' || p.period_type === 'examen_final').map((p: any) => {
                    const isSelected = publishSemester === `exam-${p.id}`;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPublishSemester(isSelected ? '' : `exam-${p.id}`)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-background border-amber-200 text-amber-700 hover:border-amber-400'
                        }`}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Combined options */}
            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-semibold text-foreground">Bulletins combines</p>
              <div className="flex flex-wrap gap-2">
                {semestersCount >= 2 && (
                  <button
                    onClick={() => setPublishSemester(publishSemester === 'combine-year1' ? '' : 'combine-year1')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      publishSemester === 'combine-year1'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:border-primary/50'
                    }`}
                  >
                    S1 + S2 (Annee 1)
                  </button>
                )}
                {semestersCount >= 4 && (
                  <button
                    onClick={() => setPublishSemester(publishSemester === 'combine-year2' ? '' : 'combine-year2')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      publishSemester === 'combine-year2'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:border-primary/50'
                    }`}
                  >
                    S3 + S4 (Annee 2)
                  </button>
                )}
                <button
                  onClick={() => setPublishSemester(publishSemester === 'combine-all' ? '' : 'combine-all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    publishSemester === 'combine-all'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:border-primary/50'
                  }`}
                >
                  Tous les semestres
                </button>
                {periods.some((p: any) => p.period_type === 'examen_blanc' || p.period_type === 'examen_final') && (
                  <button
                    onClick={() => setPublishSemester(publishSemester === 'combine-cc-exam' ? '' : 'combine-cc-exam')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      publishSemester === 'combine-cc-exam'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:border-primary/50'
                    }`}
                  >
                    CC + Examens (Complet)
                  </button>
                )}
              </div>
            </div>

            {/* Already published */}
            {publishedSemesters.length > 0 && (
              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">Deja publies :</p>
                <div className="flex flex-wrap gap-1.5">
                  {publishedSemesters.map((ps: any) => (
                    <Badge key={ps.id} variant="secondary" className="gap-1 text-xs">
                      <Check className="h-3 w-3 text-green-500" />
                      S{ps.semester_number}
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
                {bulletins.map((b, idx) => (
                  <tr key={b.studentId} className="hover:bg-muted/30 border-b border-border/50">
                    <td className="p-3 text-muted-foreground">{idx + 1}</td>
                    <td className="p-3 font-medium whitespace-nowrap">{b.studentName}</td>
                    <td className={`p-3 text-center font-bold ${avgColor(b.ccGeneralAverage)}`}>
                      {b.ccGeneralAverage !== null ? `${b.ccGeneralAverage.toFixed(2)}/20` : '—'}
                    </td>
                    <td className="p-3 text-center">
                      {b.mention ? (
                        <Badge variant="outline" className="text-[10px]">
                          {MENTIONS.find(m => m.value === b.mention)?.label || ''}
                        </Badge>
                      ) : '—'}
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="outline" className={`text-[10px] ${DECISIONS.find(d => d.value === b.decision)?.color || ''}`}>
                        {decisionLabel(b.decision)}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Button size="sm" variant="outline" onClick={() => { setCurrentStudentIndex(idx); setShowBulletinDialog(true); }} className="h-7 px-3 gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        Voir
                      </Button>
                    </td>
                  </tr>
                ))}
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
                  {templateLayout.hasCustom ? (
                    /* ===== CUSTOM TEMPLATE-DRIVEN BULLETIN ===== */
                    <div className="flex justify-center p-4">
                      <BulletinTemplateRenderer
                        headerElements={templateLayout.headerElements}
                        bodyElements={templateLayout.bodyElements}
                        footerElements={templateLayout.footerElements}
                        tableColumns={templateLayout.tableColumns}
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
                  {/* ===== EN-TÊTE STYLE EDUPRO ===== */}
                  <div className="px-6 pt-6 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {establishment?.logo_url ? (
                          <img src={establishment.logo_url} alt="" className="h-14 w-14 rounded-lg object-contain" />
                        ) : (
                          <div className="h-14 w-14 rounded-lg flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: '#1a1a2e' }}>
                            {establishment?.name?.charAt(0) || 'E'}
                          </div>
                        )}
                        <div>
                          <h2 className="text-lg font-bold" style={{ color: '#1a1a2e' }}>{establishment?.name}</h2>
                          <p className="text-[10px]" style={{ color: '#c8a94e' }}>
                            {establishment?.type === 'universite' ? 'Université' : 'École Supérieure Privée'}
                            {establishment?.address ? ` • ${establishment.address}` : ''}
                          </p>
                          {establishment?.phone && <p className="text-[10px]" style={{ color: '#64748b' }}>Tél : {establishment.phone} {establishment?.website ? `• ${establishment.website}` : ''}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="inline-block px-4 py-2 rounded-md text-sm font-bold text-white" style={{ backgroundColor: '#c8a94e' }}>
                          BULLETIN DE NOTES
                        </div>
                        <p className="text-[10px] mt-1.5" style={{ color: '#64748b' }}>
                          Année : {academicYear} - {currentPeriodLabel}
                        </p>
                        <p className="text-[10px]" style={{ color: '#64748b' }}>Réf : {refNumber}</p>
                      </div>
                    </div>
                  </div>

                  {/* ===== INFOS ÉTUDIANT ===== */}
                  <div className="mx-6 mb-4 grid grid-cols-5 gap-0 border rounded-md overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
                    {[
                      { label: 'Nom & prénoms', value: currentBulletin.studentName },
                      { label: 'Matricule', value: refNumber.split('/')[0] },
                      { label: 'Filière', value: selectedFormationData?.title || '' },
                      { label: 'Niveau', value: selectedFormationData?.level || '' },
                      { label: 'Année', value: academicYear },
                    ].map((item, i) => (
                      <div key={i} className="px-3 py-2" style={{ borderRight: i < 4 ? '1px solid #e2e8f0' : 'none' }}>
                        <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: '#64748b' }}>{item.label}</p>
                        <p className="text-xs font-bold" style={{ color: '#1a1a2e' }}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* ===== SECTION CONTRÔLE CONTINU ===== */}
                  <div className="mx-6 mb-4">
                    <table className="w-full text-[11px] border-collapse" style={{ borderColor: '#cbd5e1' }}>
                      <thead>
                        <tr>
                          <th className="text-left p-2 text-white font-semibold border" style={{ backgroundColor: '#1a1a2e', borderColor: '#334155', width: '28%' }}>Contrôle continu</th>
                          <th className="text-center p-2 text-white font-semibold border" style={{ backgroundColor: '#1a1a2e', borderColor: '#334155', width: '12%' }}>
                            <span className="text-[9px]">Moyenne du<br/>Stagiaire</span>
                          </th>
                          <th className="text-center p-2 text-white font-semibold border" style={{ backgroundColor: '#1a1a2e', borderColor: '#334155', width: '12%' }}>
                            <span className="text-[9px]">Moyenne de<br/>Classe</span>
                          </th>
                          <th className="text-center p-2 text-white font-semibold border" style={{ backgroundColor: '#1a1a2e', borderColor: '#334155', width: '48%' }}>
                            <span className="text-[9px]">Appréciations<br/>(travail et comportement)</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {moduleGroups.map(group => (
                          <React.Fragment key={group.id}>
                            {moduleGroups.length > 1 && (
                              <tr>
                                <td colSpan={4} className="p-1.5 pl-3 text-[10px] font-bold uppercase tracking-wider border" style={{ backgroundColor: '#dbeafe', color: '#1a1a2e', borderColor: '#cbd5e1' }}>
                                  {group.title}
                                </td>
                              </tr>
                            )}
                            {group.mods.map((mod, modIdx) => {
                              const modData = currentBulletin.modules.find(m => m.moduleId === mod.id);
                              const ccAvg = modData?.ccAverage ?? null;
                              const ccClassAvg = modData?.ccClassAverage ?? null;
                              const appreciation = getAppreciation(ccAvg);

                              return (
                                <tr key={mod.id} style={{ backgroundColor: modIdx % 2 === 0 ? '#ffffff' : '#f0f9ff' }}>
                                  <td className="p-2 border" style={{ borderColor: '#cbd5e1' }}>
                                    <span className="font-medium">{mod.title}</span>
                                  </td>
                                  <td className="p-2 border text-center font-semibold" style={{ borderColor: '#cbd5e1' }}>
                                    {ccAvg !== null ? ccAvg.toFixed(2) : ''}
                                  </td>
                                  <td className="p-2 border text-center" style={{ borderColor: '#cbd5e1' }}>
                                    {ccClassAvg !== null ? ccClassAvg.toFixed(2) : ''}
                                  </td>
                                  <td className="p-2 border text-[10px] italic" style={{ borderColor: '#cbd5e1', color: '#64748b' }}>
                                    {appreciation}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ))}
                        {/* Moyenne Générale CC */}
                        <tr style={{ backgroundColor: '#dbeafe' }}>
                          <td className="p-2 border font-bold" style={{ borderColor: '#cbd5e1', color: '#1a1a2e' }}>
                            Moyenne Générale
                          </td>
                          <td className="p-2 border text-center font-bold" style={{ borderColor: '#cbd5e1', color: currentBulletin.ccGeneralAverage !== null && currentBulletin.ccGeneralAverage >= 10 ? '#16a34a' : '#dc2626' }}>
                            {currentBulletin.ccGeneralAverage !== null ? currentBulletin.ccGeneralAverage.toFixed(2) : '—'}
                          </td>
                          <td className="p-2 border text-center font-bold" style={{ borderColor: '#cbd5e1' }}>
                            {currentBulletin.ccClassGeneralAverage !== null ? currentBulletin.ccClassGeneralAverage.toFixed(2) : '—'}
                          </td>
                          <td className="p-2 border" style={{ borderColor: '#cbd5e1' }}></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* ===== SECTION EXAMEN BLANC (BTS) ===== */}
                  {isBTS && showExamBlanc && (() => {
                    // Group exam blanc modules by type (écrit / oral)
                    const examBlancModules = currentBulletin.modules.filter(m => m.examBlancType !== null);
                    const ecritModules = examBlancModules.filter(m => m.examBlancType === 'ecrit');
                    const oralModules = examBlancModules.filter(m => m.examBlancType === 'oral');
                    
                    // Calculate admission threshold: sum of all exam blanc coefficients * 10
                    const totalExamBlancCoeff = examBlancModules.reduce((sum, m) => sum + m.coefficient, 0);
                    const admissionThreshold = totalExamBlancCoeff * 10;
                    const totalPoints = currentBulletin.examBlancTotalPoints;
                    const isAdmis = totalPoints >= admissionThreshold;

                    return (
                      <div className="mx-6 mb-4 flex gap-4">
                        {/* Exam Blanc Table */}
                        <div className="flex-1">
                          <table className="w-full text-[11px] border-collapse" style={{ borderColor: '#cbd5e1' }}>
                            <thead>
                              <tr>
                                <th className="text-center p-2 text-white font-bold border" colSpan={2} style={{ backgroundColor: '#1a1a2e', borderColor: '#334155' }}>
                                  Examen Blanc
                                </th>
                                <th className="text-center p-2 text-white font-semibold border" style={{ backgroundColor: '#1a1a2e', borderColor: '#334155', width: '12%' }}>Notes</th>
                                <th className="text-center p-2 text-white font-semibold border" style={{ backgroundColor: '#1a1a2e', borderColor: '#334155', width: '8%' }}>C.</th>
                                <th className="text-center p-2 text-white font-semibold border" style={{ backgroundColor: '#1a1a2e', borderColor: '#334155', width: '12%' }}>Points</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* ÉCRITS */}
                              {ecritModules.length > 0 && (
                                <>
                                  <tr>
                                    <td rowSpan={ecritModules.length + 1} className="border text-center font-bold text-[10px] align-middle" style={{ backgroundColor: '#dbeafe', borderColor: '#cbd5e1', width: '8%', writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '2px' }}>
                                      É C R I T S
                                    </td>
                                  </tr>
                                  {ecritModules.map((mod, idx) => (
                                    <tr key={mod.moduleId} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f0f9ff' }}>
                                      <td className="p-2 border font-medium" style={{ borderColor: '#cbd5e1' }}>{mod.moduleTitle}</td>
                                      <td className="p-2 border text-center font-semibold" style={{ borderColor: '#cbd5e1' }}>
                                        {mod.examBlancScore !== null ? mod.examBlancScore.toFixed(2) : '0,00'}
                                      </td>
                                      <td className="p-2 border text-center font-bold" style={{ borderColor: '#cbd5e1' }}>
                                        {mod.coefficient}
                                      </td>
                                      <td className="p-2 border text-center font-bold" style={{ borderColor: '#cbd5e1' }}>
                                        {mod.examBlancPoints !== null ? mod.examBlancPoints.toFixed(2) : '0,00'}
                                      </td>
                                    </tr>
                                  ))}
                                </>
                              )}
                              {/* ORAUX */}
                              {oralModules.length > 0 && (
                                <>
                                  <tr>
                                    <td rowSpan={oralModules.length + 1} className="border text-center font-bold text-[10px] align-middle" style={{ backgroundColor: '#dbeafe', borderColor: '#cbd5e1', width: '8%', writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '2px' }}>
                                      O R A U X
                                    </td>
                                  </tr>
                                  {oralModules.map((mod, idx) => (
                                    <tr key={mod.moduleId} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f0f9ff' }}>
                                      <td className="p-2 border font-medium" style={{ borderColor: '#cbd5e1' }}>{mod.moduleTitle}</td>
                                      <td className="p-2 border text-center font-semibold" style={{ borderColor: '#cbd5e1' }}>
                                        {mod.examBlancScore !== null ? mod.examBlancScore.toFixed(2) : '0,00'}
                                      </td>
                                      <td className="p-2 border text-center font-bold" style={{ borderColor: '#cbd5e1' }}>
                                        {mod.coefficient}
                                      </td>
                                      <td className="p-2 border text-center font-bold" style={{ borderColor: '#cbd5e1' }}>
                                        {mod.examBlancPoints !== null ? mod.examBlancPoints.toFixed(2) : '0,00'}
                                      </td>
                                    </tr>
                                  ))}
                                </>
                              )}
                              {/* TOTAL */}
                              <tr style={{ backgroundColor: '#dbeafe' }}>
                                <td colSpan={2} className="p-2 border font-bold text-center" style={{ borderColor: '#cbd5e1', color: '#1a1a2e' }}>
                                  TOTAL (Admis si {'>'} ou = {admissionThreshold})
                                </td>
                                <td className="p-2 border" style={{ borderColor: '#cbd5e1' }}></td>
                                <td className="p-2 border" style={{ borderColor: '#cbd5e1' }}></td>
                                <td className="p-2 border text-center font-bold text-sm" style={{ borderColor: '#cbd5e1', color: isAdmis ? '#16a34a' : '#dc2626' }}>
                                  {totalPoints.toFixed(2)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Appréciation générale + Assiduité (côté droit) */}
                        <div className="w-56 space-y-3">
                          <div className="border rounded-md p-3" style={{ borderColor: '#cbd5e1' }}>
                            <p className="text-[10px] uppercase font-bold mb-2" style={{ color: '#1a1a2e' }}>Appréciation générale</p>
                            <p className="text-[10px] italic" style={{ color: '#64748b' }}>
                              {getAppreciation(currentBulletin.ccGeneralAverage)}
                            </p>
                          </div>
                          <div className="border rounded-md p-3" style={{ borderColor: '#cbd5e1' }}>
                            <p className="text-[10px] uppercase font-bold mb-2" style={{ color: '#1a1a2e' }}>ASSIDUITÉ :</p>
                            <div className="space-y-1 text-[9px]" style={{ color: '#64748b' }}>
                              <p>- Retards ce semestre : ...</p>
                              <p>- Retards au total : ...</p>
                              <p>- Absences ce semestre : ...</p>
                              <p>- Absences au total : ...</p>
                              <p>- Absences restantes à rattraper : ...</p>
                            </div>
                          </div>
                          {/* Decision BTS */}
                          <div className="border-2 rounded-md p-3 text-center font-bold" style={{ 
                            borderColor: isAdmis ? '#16a34a' : '#dc2626',
                            backgroundColor: isAdmis ? '#f0fdf4' : '#fef2f2',
                            color: isAdmis ? '#16a34a' : '#dc2626'
                          }}>
                            {isAdmis ? 'ADMIS' : 'NON ADMIS'}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ===== SECTION EXAMEN pour non-BTS ===== */}
                  {!isBTS && showExam && (
                    <div className="mx-6 mb-4">
                      <table className="w-full text-[11px] border-collapse" style={{ borderColor: '#cbd5e1' }}>
                        <thead>
                          <tr>
                            <th className="text-left p-2 text-white font-semibold border" style={{ backgroundColor: '#1a1a2e', borderColor: '#334155', width: '28%' }}>Matière</th>
                            <th className="text-center p-2 text-white font-semibold border" style={{ backgroundColor: '#1a1a2e', borderColor: '#334155', width: '7%' }}>DS</th>
                            <th className="text-center p-2 font-semibold border" style={{ backgroundColor: '#c8a94e', color: '#1a1a2e', borderColor: '#334155', width: '10%' }}>
                              <span className="text-[9px]">Examen<br/>Final</span>
                            </th>
                            <th className="text-center p-2 text-white font-semibold border" style={{ backgroundColor: '#1a1a2e', borderColor: '#334155', width: '10%' }}>
                              <span className="text-[9px]">Oral/Subt.</span>
                            </th>
                            <th className="text-center p-2 text-white font-semibold border" style={{ backgroundColor: '#1a1a2e', borderColor: '#334155', width: '10%' }}>Moyenne</th>
                            <th className="text-center p-2 text-white font-semibold border" style={{ backgroundColor: '#1a1a2e', borderColor: '#334155', width: '10%' }}>Statut</th>
                            <th className="text-center p-2 text-white font-semibold border" style={{ backgroundColor: '#1a1a2e', borderColor: '#334155', width: '25%' }}>Appréciation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {moduleGroups.map(group => (
                            <React.Fragment key={group.id}>
                              {moduleGroups.length > 1 && (
                                <tr>
                                  <td colSpan={7} className="p-1.5 pl-3 text-[10px] font-bold uppercase tracking-wider border" style={{ backgroundColor: '#f1f5f9', color: '#1a1a2e', borderColor: '#cbd5e1' }}>
                                    {group.title}
                                  </td>
                                </tr>
                              )}
                              {group.mods.map((mod, modIdx) => {
                                const dsAvg = getStudentModuleDSAvg(currentBulletin.studentId, mod.id);
                                const examFinal = getStudentModuleExamFinal(currentBulletin.studentId, mod.id);
                                const oralScore = getStudentModuleOral(currentBulletin.studentId, mod.id);
                                const scores = [dsAvg, examFinal, oralScore].filter(s => s !== null) as number[];
                                const moduleAvg = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : null;
                                const statut = getStatut(moduleAvg);
                                const appreciation = getAppreciation(moduleAvg);

                                return (
                                  <tr key={mod.id} style={{ backgroundColor: modIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                    <td className="p-2 border font-medium" style={{ borderColor: '#cbd5e1' }}>{mod.title}</td>
                                    <td className="p-2 border text-center font-semibold" style={{ borderColor: '#cbd5e1' }}>
                                      {dsAvg !== null ? dsAvg.toFixed(0) : '-'}
                                    </td>
                                    <td className="p-2 border text-center font-semibold" style={{ borderColor: '#cbd5e1' }}>
                                      {examFinal !== null ? examFinal.toFixed(0) : '-'}
                                    </td>
                                    <td className="p-2 border text-center font-semibold" style={{ borderColor: '#cbd5e1' }}>
                                      {oralScore !== null ? oralScore.toFixed(0) : '-'}
                                    </td>
                                    <td className="p-2 border text-center font-bold" style={{ borderColor: '#cbd5e1', color: moduleAvg !== null && moduleAvg >= 10 ? '#c8a94e' : '#dc2626' }}>
                                      {moduleAvg !== null ? moduleAvg.toFixed(2) : '-'}
                                    </td>
                                    <td className="p-2 border text-center" style={{ borderColor: '#cbd5e1' }}>
                                      {moduleAvg !== null && (
                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold ${statut.color}`}>
                                          {statut.label}
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-2 border text-[9px] italic" style={{ borderColor: '#cbd5e1', color: '#64748b' }}>
                                      {appreciation}
                                    </td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ===== RÉSUMÉ EN BAS ===== */}
                  <div className="mx-6 mb-4 grid grid-cols-4 gap-0 border rounded-md overflow-hidden" style={{ borderColor: '#cbd5e1' }}>
                    <div className="p-3 text-center border-r" style={{ borderColor: '#cbd5e1', backgroundColor: '#f8fafc' }}>
                      <p className="text-[9px] uppercase tracking-wider font-semibold mb-1" style={{ color: '#64748b' }}>Moyenne générale</p>
                      <p className="text-xl font-bold" style={{ color: '#c8a94e' }}>
                        {currentBulletin.ccGeneralAverage !== null ? currentBulletin.ccGeneralAverage.toFixed(2) : '—'}
                        <span className="text-xs font-normal" style={{ color: '#64748b' }}>/20</span>
                      </p>
                    </div>
                    <div className="p-3 text-center border-r" style={{ borderColor: '#cbd5e1', backgroundColor: '#f8fafc' }}>
                      <p className="text-[9px] uppercase tracking-wider font-semibold mb-1" style={{ color: '#64748b' }}>Mention</p>
                      <p className="text-sm font-bold" style={{ color: '#c8a94e' }}>
                        {currentBulletin.mention ? (MENTIONS.find(m => m.value === currentBulletin.mention)?.label || '') : '—'}
                      </p>
                    </div>
                    <div className="p-3 text-center border-r" style={{ borderColor: '#cbd5e1', backgroundColor: '#f8fafc' }}>
                      <p className="text-[9px] uppercase tracking-wider font-semibold mb-1" style={{ color: '#64748b' }}>Rang dans la promo</p>
                      <p className="text-sm font-bold" style={{ color: '#1a1a2e' }}>
                        {rank}<sup>ème</sup><span className="text-xs font-normal" style={{ color: '#64748b' }}>/{totalStudents}</span>
                      </p>
                    </div>
                    <div className="p-3 text-center" style={{ backgroundColor: '#f8fafc' }}>
                      <p className="text-[9px] uppercase tracking-wider font-semibold mb-1" style={{ color: '#64748b' }}>Décision</p>
                      <p className={`text-sm font-bold ${currentBulletin.decision === 'admis' ? 'text-green-600' : currentBulletin.decision === 'ajourne' ? 'text-red-600' : ''}`} style={{ color: currentBulletin.decision === 'admis' ? '#16a34a' : currentBulletin.decision === 'ajourne' ? '#dc2626' : '#c8a94e' }}>
                        {decisionLabel(currentBulletin.decision).toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* ===== APPRÉCIATION GÉNÉRALE ===== */}
                  <div className="mx-6 mb-4 p-3 rounded-md" style={{ backgroundColor: '#fef9e7', border: '1px dashed #c8a94e' }}>
                    <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: '#c8a94e' }}>Appréciation générale</p>
                    <p className="text-xs italic" style={{ color: '#1a1a2e' }}>
                      {getAppreciation(currentBulletin.ccGeneralAverage)}
                    </p>
                  </div>

                  {/* ===== SIGNATURES & CACHETS ===== */}
                  {signatories.length > 0 && (
                    <div
                      className={`mx-6 mb-2 grid gap-6 ${
                        signatories.length === 1
                          ? 'grid-cols-1 max-w-xs mx-auto'
                          : signatories.length === 2
                          ? 'grid-cols-2'
                          : signatories.length === 3
                          ? 'grid-cols-3'
                          : 'grid-cols-4'
                      }`}
                    >
                      {signatories.map((s) => (
                        <div key={s.id} className="text-center">
                          <p className="text-[10px] font-semibold mb-1" style={{ color: '#1a1a2e' }}>{s.role_label}</p>
                          <div className="h-12 flex items-center justify-center">
                            {s.signature_image ? (
                              <img
                                src={s.signature_image}
                                alt={s.role_label}
                                className="max-h-12 max-w-full object-contain"
                                crossOrigin="anonymous"
                              />
                            ) : null}
                          </div>
                          <div className="border-b" style={{ borderColor: '#cbd5e1' }}></div>
                          {s.name && !s.is_stamp ? (
                            <p className="text-[10px] mt-1 font-semibold" style={{ color: '#1a1a2e' }}>{s.name}</p>
                          ) : s.is_stamp ? (
                            <p className="text-[9px] mt-1 italic" style={{ color: '#94a3b8' }}>Cachet officiel</p>
                          ) : (
                            <p className="text-[9px] mt-1 italic" style={{ color: '#94a3b8' }}>Signature</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ===== PIED DE PAGE ===== */}
                  <div className="mx-6 pb-4 pt-3 mt-2 text-center" style={{ borderTop: '1px solid #e2e8f0' }}>
                    <p className="text-[9px]" style={{ color: '#94a3b8' }}>
                      Document officiel — {establishment?.name} - Réf : {refNumber} - Ce bulletin est certifié authentique.
                    </p>
                  </div>
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
