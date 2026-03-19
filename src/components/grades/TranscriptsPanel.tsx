import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Eye, Printer, ChevronLeft, ChevronRight, Users, Settings2 } from 'lucide-react';
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
  DECISIONS,
  MENTIONS,
  type Evaluation,
  type Grade,
  type TranscriptTemplateConfig,
  type TranscriptHeaderConfig,
  type TranscriptFooterConfig,
  type TranscriptStyleConfig,
} from '@/services/gradesService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import TranscriptTemplateEditor from './TranscriptTemplateEditor';

interface Props {
  mode: 'admin' | 'student';
  studentId?: string;
  formationId?: string;
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
  appreciation: string;
  teachingUnitId: string | null;
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
  decision: string;
  mention: string | null;
}

const TranscriptsPanel: React.FC<Props> = ({ mode, studentId, formationId: propFormationId }) => {
  const { userId, userRole } = useCurrentUser();
  const { establishment } = useEstablishment();
  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';
  const [internalFormation, setInternalFormation] = useState('');
  const selectedFormation = propFormationId || internalFormation;
  const [semesterView, setSemesterView] = useState<string>('');
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'bulletin'>('list');
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Formations (only needed when no formationId prop)
  const { data: formations = [] } = useQuery({
    queryKey: ['formations-for-transcripts'],
    queryFn: async () => {
      const { data } = await supabase.from('formations').select('id, title, level, start_date, end_date, duration_years, semesters_count').order('title');
      return data || [];
    },
    enabled: mode === 'admin' && !propFormationId,
  });

  const { data: studentFormations = [] } = useQuery({
    queryKey: ['student-formations-transcripts', studentId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_formation_assignments')
        .select('formation_id, formations(id, title, level, start_date, end_date, duration_years, semesters_count)')
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
    if (semesterView.startsWith('final-')) {
      const yearNum = parseInt(semesterView.split('-')[1]);
      const startIdx = (yearNum - 1) * 2;
      return periods.filter((_, idx) => idx >= startIdx && idx < startIdx + 2).map(p => p.id);
    }
    const semNum = parseInt(semesterView.replace('s', ''));
    const idx = semNum - 1;
    return periods[idx] ? [periods[idx].id] : [];
  }, [semesterView, periods]);

  const isFinalView = semesterView.startsWith('final-');

  const activeSemesterNums = useMemo((): number[] | null => {
    if (!semesterView) return null;
    if (semesterView.startsWith('final-')) {
      const yearNum = parseInt(semesterView.split('-')[1]);
      return [(yearNum - 1) * 2 + 1, (yearNum - 1) * 2 + 2];
    }
    const num = parseInt(semesterView.replace('s', ''));
    return isNaN(num) ? null : [num];
  }, [semesterView]);

  const currentPeriodLabel = useMemo(() => {
    if (isFinalView) {
      const yearNum = parseInt(semesterView.split('-')[1]);
      return durationYears === 1 ? 'Final (S1 + S2)' : `Final Année ${yearNum}`;
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
        .select('id, title, coefficient, order_index, teaching_unit_id, semester')
        .eq('formation_id', selectedFormation)
        .order('order_index');
      return data || [];
    },
    enabled: !!selectedFormation,
  });

  // Filter modules by semester
  const modules = useMemo(() => {
    if (!activeSemesterNums) return allModules;
    return allModules.filter((m: any) => !m.semester || activeSemesterNums.includes(m.semester));
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

  // Split evaluations by type
  const ccEvaluations = useMemo(() =>
    evaluations.filter(e => e.evaluation_type !== 'examen_blanc' && e.evaluation_type !== 'examen_final'),
    [evaluations]
  );

  const examEvaluations = useMemo(() =>
    evaluations.filter(e => e.evaluation_type === 'examen_blanc' || e.evaluation_type === 'examen_final'),
    [evaluations]
  );

  // Module grouping: use template sections if available, otherwise fallback to teaching units
  const moduleGroups = useMemo(() => {
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
  }, [modules, teachingUnits, tplColumns.sections]);

  // Build bulletins
  const bulletins: StudentBulletin[] = useMemo(() => {
    if (!students.length || !modules.length) return [];

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

    return students.map(student => {
      const studentModules: ModuleBulletinData[] = modules.map(mod => {
        const ccAvg = getStudentModuleCCAvg(student.user_id, mod.id);
        const examScore = getStudentModuleExamScore(student.user_id, mod.id);

        const classCCAvgs = students.map(s => getStudentModuleCCAvg(s.user_id, mod.id)).filter(v => v !== null) as number[];
        const classExamAvgs = students.map(s => getStudentModuleExamScore(s.user_id, mod.id)).filter(v => v !== null) as number[];

        const ccClassAvg = classCCAvgs.length > 0 ? Math.round((classCCAvgs.reduce((a, b) => a + b, 0) / classCCAvgs.length) * 100) / 100 : null;
        const examClassAvg = classExamAvgs.length > 0 ? Math.round((classExamAvgs.reduce((a, b) => a + b, 0) / classExamAvgs.length) * 100) / 100 : null;

        return {
          moduleId: mod.id,
          moduleTitle: mod.title,
          coefficient: (mod as any).coefficient || 1,
          ccAverage: ccAvg,
          ccClassAverage: ccClassAvg,
          examScore,
          examClassAverage: examClassAvg,
          examPoints: examScore !== null ? Math.round(examScore * ((mod as any).coefficient || 1) * 100) / 100 : null,
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
        decision,
        mention,
      };
    });
  }, [students, modules, evaluations, allGrades, gradingRules, ccEvaluations, examEvaluations]);

  const currentBulletin = bulletins[currentStudentIndex] || null;
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
  const showExam = tplColumns.showExamSection && hasExamData;

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
            <Select value={selectedFormation} onValueChange={(v) => { setInternalFormation(v); setSemesterView(''); setCurrentStudentIndex(0); setViewMode('list'); }}>
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
          {/* Semester buttons */}
          {semestersCount > 0 && selectedFormationObj && (
            <div className="flex flex-wrap items-center gap-2">
              {Array.from({ length: durationYears }, (_, y) => {
                const s1 = y * 2 + 1;
                const s2 = y * 2 + 2;
                const yearNum = y + 1;
                return (
                  <div key={yearNum} className="flex items-center gap-1">
                    {durationYears > 1 && (
                      <span className="text-xs font-medium text-muted-foreground mr-1">A{yearNum}:</span>
                    )}
                    <Button
                      size="sm"
                      variant={semesterView === `s${s1}` ? 'default' : 'outline'}
                      onClick={() => { setSemesterView(`s${s1}`); setCurrentStudentIndex(0); }}
                      className="text-xs h-8"
                    >
                      S{s1}
                    </Button>
                    <Button
                      size="sm"
                      variant={semesterView === `s${s2}` ? 'default' : 'outline'}
                      onClick={() => { setSemesterView(`s${s2}`); setCurrentStudentIndex(0); }}
                      className="text-xs h-8"
                    >
                      S{s2}
                    </Button>
                    <Button
                      size="sm"
                      variant={semesterView === `final-${yearNum}` ? 'default' : 'outline'}
                      onClick={() => { setSemesterView(`final-${yearNum}`); setCurrentStudentIndex(0); }}
                      className="text-xs h-8 font-semibold"
                    >
                      {durationYears === 1 ? 'Final (S1+S2)' : `Final A${yearNum}`}
                    </Button>
                    {yearNum < durationYears && (
                      <span className="text-border mx-1">|</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {isAdmin && selectedFormation && establishment?.id && (
            <Button variant="outline" size="sm" onClick={() => setShowTemplateEditor(true)} className="gap-2">
              <Settings2 className="h-4 w-4" />
              Configurer le modèle
            </Button>
          )}
          {selectedFormation && bulletins.length > 0 && (
            <Button
              variant={viewMode === 'bulletin' ? 'default' : 'outline'}
              onClick={() => setViewMode(viewMode === 'bulletin' ? 'list' : 'bulletin')}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              {viewMode === 'bulletin' ? 'Vue liste' : 'Vue bulletin'}
            </Button>
          )}
        </div>
      </div>

      {/* Template Editor Dialog */}
      {isAdmin && selectedFormation && establishment?.id && (
        <TranscriptTemplateEditor
          open={showTemplateEditor}
          onOpenChange={setShowTemplateEditor}
          formationId={selectedFormation}
          establishmentId={establishment.id}
        />
      )}

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
      ) : viewMode === 'list' ? (
        /* ============ VUE LISTE ============ */
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground mb-3">
            {bulletins.length} étudiant(s) • {selectedFormationData?.title}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-primary/10">
                  <th className="text-left p-3 border-b border-border font-semibold">#</th>
                  <th className="text-left p-3 border-b border-border font-semibold">Étudiant</th>
                  <th className="text-center p-3 border-b border-border font-semibold bg-blue-100/50 dark:bg-blue-900/20">Moy. CC</th>
                  {hasExamData && (
                    <th className="text-center p-3 border-b border-border font-semibold bg-amber-100/50 dark:bg-amber-900/20">Points Examen</th>
                  )}
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
                    {hasExamData && (
                      <td className={`p-3 text-center font-bold ${avgColor(b.examTotalPoints / Math.max(b.examTotalCoeff, 1))}`}>
                        {b.examTotalPoints.toFixed(2)}
                      </td>
                    )}
                    <td className="p-3 text-center">
                      <Badge variant="outline" className={`text-[10px] ${DECISIONS.find(d => d.value === b.decision)?.color || ''}`}>
                        {decisionLabel(b.decision)}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Button size="sm" variant="ghost" onClick={() => { setCurrentStudentIndex(idx); setViewMode('bulletin'); }} className="h-7 px-2">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : currentBulletin ? (
        /* ============ VUE BULLETIN ============ */
        <div className="space-y-4">
          {/* Navigation */}
          <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3 border border-border/50">
            <Button variant="ghost" size="sm" disabled={currentStudentIndex <= 0} onClick={() => setCurrentStudentIndex(p => p - 1)} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{currentBulletin.studentName}</span>
              <Badge variant="secondary" className="text-xs">{currentStudentIndex + 1} / {bulletins.length}</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1">
                <Printer className="h-3.5 w-3.5" /> Imprimer
              </Button>
              <Button variant="ghost" size="sm" disabled={currentStudentIndex >= bulletins.length - 1} onClick={() => setCurrentStudentIndex(p => p + 1)} className="gap-1">
                Suivant <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div ref={printRef} className="bulletin">
                {/* ===== EN-TÊTE ===== */}
                <div className="p-6 border-b-2" style={{ borderColor: tplStyle.primaryColor }}>
                  <div className="flex items-start justify-between">
                    <div>
                      {tplHeader.showLogo && establishment?.logo_url && <img src={establishment.logo_url} alt="" className="h-14 mb-2" />}
                      <p className="text-xs font-semibold">{establishment?.name}</p>
                      {establishment?.address && <p className="text-[10px] text-muted-foreground">{establishment.address}</p>}
                    </div>
                    <div className="text-right">
                      <h1 className="text-lg font-bold" style={{ color: tplStyle.primaryColor }}>
                        {tplHeader.title} N°...
                      </h1>
                      {tplHeader.subtitle && <p className="text-xs text-muted-foreground">{tplHeader.subtitle}</p>}
                      <h2 className="text-sm font-bold mt-1">{selectedFormationData?.title}</h2>
                      {selectedFormationData?.level && <p className="text-xs text-muted-foreground">{selectedFormationData.level}</p>}
                      {tplHeader.showSession && selectedFormationData?.start_date && selectedFormationData?.end_date && (
                        <p className="text-xs text-muted-foreground">
                          SESSION {format(new Date(selectedFormationData.start_date), 'yyyy')} - {format(new Date(selectedFormationData.end_date), 'yyyy')}
                        </p>
                      )}
                      {currentPeriodLabel && <p className="text-xs text-muted-foreground mt-1">{currentPeriodLabel}</p>}
                    </div>
                  </div>
                </div>

                {/* ===== NOM ÉTUDIANT ===== */}
                <div className="py-2 px-6 text-center" style={{ backgroundColor: `${tplStyle.primaryColor}33` }}>
                  <p className="font-bold text-sm">{currentBulletin.studentName}</p>
                </div>

                {/* ===== SECTION CONTRÔLE CONTINU ===== */}
                <div className="px-4 pt-4">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="text-white text-left p-2 border font-semibold" style={{ backgroundColor: tplStyle.primaryColor, borderColor: tplStyle.primaryColor, width: '40%' }}>
                          Contrôle continu
                        </th>
                        {showCCMoyenne && (
                          <th className="text-white text-center p-2 border font-semibold" style={{ backgroundColor: tplStyle.primaryColor, borderColor: tplStyle.primaryColor, width: '15%' }}>
                            Moyenne du Stagiaire
                          </th>
                        )}
                        {showCCClasseMoyenne && (
                          <th className="text-white text-center p-2 border font-semibold" style={{ backgroundColor: tplStyle.primaryColor, borderColor: tplStyle.primaryColor, width: '15%' }}>
                            Moyenne de Classe
                          </th>
                        )}
                        {showCCAppreciation && (
                          <th className="text-white text-center p-2 border font-semibold" style={{ backgroundColor: tplStyle.primaryColor, borderColor: tplStyle.primaryColor, width: '30%' }}>
                            Appréciations<br /><span className="font-normal text-[10px]">(travail et comportement)</span>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {moduleGroups.map(group => (
                        <React.Fragment key={group.id}>
                          {moduleGroups.length > 1 && (
                            <tr>
                              <td colSpan={ccColCount} className="p-1.5 pl-3 text-[10px] font-bold uppercase tracking-wider border border-border/50" style={{ backgroundColor: `${tplStyle.primaryColor}11`, color: tplStyle.primaryColor }}>
                                {group.title}
                              </td>
                            </tr>
                          )}
                          {group.mods.map(mod => {
                            const modData = currentBulletin.modules.find(m => m.moduleId === mod.id);
                            return (
                              <tr key={mod.id} className="border-b border-border/30">
                                <td className="p-2 border border-border/50">
                                  <div className="font-medium">{mod.title}</div>
                                </td>
                                {showCCMoyenne && (
                                  <td className={`p-2 border border-border/50 text-center font-bold ${avgColor(modData?.ccAverage ?? null)}`}>
                                    {modData?.ccAverage !== null && modData?.ccAverage !== undefined ? modData.ccAverage.toFixed(2) : '—'}
                                  </td>
                                )}
                                {showCCClasseMoyenne && (
                                  <td className={`p-2 border border-border/50 text-center font-semibold ${avgColor(modData?.ccClassAverage ?? null)}`}>
                                    {modData?.ccClassAverage !== null && modData?.ccClassAverage !== undefined ? modData.ccClassAverage.toFixed(2) : '—'}
                                  </td>
                                )}
                                {showCCAppreciation && (
                                  <td className="p-2 border border-border/50 text-center text-muted-foreground text-[10px]">
                                    {modData?.appreciation || ''}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      ))}
                      {/* Moyenne Générale CC */}
                      <tr className="font-bold" style={{ backgroundColor: `${tplStyle.primaryColor}33` }}>
                        <td className="p-2.5 border text-sm uppercase tracking-wider" style={{ borderColor: `${tplStyle.primaryColor}66` }}>
                          Moyenne Générale
                        </td>
                        {showCCMoyenne && (
                          <td className={`p-2.5 border text-center text-base ${avgColor(currentBulletin.ccGeneralAverage)}`} style={{ borderColor: `${tplStyle.primaryColor}66` }}>
                            {currentBulletin.ccGeneralAverage !== null ? currentBulletin.ccGeneralAverage.toFixed(2) : '—'}
                          </td>
                        )}
                        {showCCClasseMoyenne && (
                          <td className={`p-2.5 border text-center ${avgColor(currentBulletin.ccClassGeneralAverage)}`} style={{ borderColor: `${tplStyle.primaryColor}66` }}>
                            {currentBulletin.ccClassGeneralAverage !== null ? currentBulletin.ccClassGeneralAverage.toFixed(2) : '—'}
                          </td>
                        )}
                        {showCCAppreciation && (
                          <td className="p-2.5 border" style={{ borderColor: `${tplStyle.primaryColor}66` }}></td>
                        )}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* ===== SECTION EXAMEN BLANC ===== */}
                {showExam && (
                  <div className="px-4 pt-4">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr>
                          <th className="text-white text-left p-2 border font-semibold" style={{ backgroundColor: tplStyle.primaryColor, borderColor: tplStyle.primaryColor, width: '40%' }}>
                            Examen Blanc
                          </th>
                          {showExamNotes && (
                            <th className="text-white text-center p-2 border font-semibold" style={{ backgroundColor: tplStyle.primaryColor, borderColor: tplStyle.primaryColor, width: '10%' }}>Notes</th>
                          )}
                          {showExamCoeff && (
                            <th className="text-white text-center p-2 border font-semibold" style={{ backgroundColor: tplStyle.primaryColor, borderColor: tplStyle.primaryColor, width: '8%' }}>C</th>
                          )}
                          {showExamPoints && (
                            <th className="text-white text-center p-2 border font-semibold" style={{ backgroundColor: tplStyle.primaryColor, borderColor: tplStyle.primaryColor, width: '12%' }}>Points</th>
                          )}
                          {showExamAppreciation && (
                            <th className="text-white text-center p-2 border font-semibold" style={{ backgroundColor: tplStyle.primaryColor, borderColor: tplStyle.primaryColor, width: '30%' }}>Appréciation générale</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {moduleGroups.map(group => (
                          <React.Fragment key={group.id}>
                            {moduleGroups.length > 1 && (
                              <tr>
                                <td colSpan={examColCount} className="p-1.5 pl-3 text-[10px] font-bold uppercase tracking-wider border border-border/50" style={{ backgroundColor: `${tplStyle.primaryColor}11`, color: tplStyle.primaryColor }}>
                                  {group.title}
                                </td>
                              </tr>
                            )}
                            {group.mods.map(mod => {
                              const modData = currentBulletin.modules.find(m => m.moduleId === mod.id);
                              return (
                                <tr key={mod.id} className="border-b border-border/30">
                                  <td className="p-2 border border-border/50 font-medium">{mod.title}</td>
                                  {showExamNotes && (
                                    <td className={`p-2 border border-border/50 text-center font-bold ${avgColor(modData?.examScore ?? null)}`}>
                                      {modData?.examScore !== null && modData?.examScore !== undefined ? modData.examScore.toFixed(2) : ''}
                                    </td>
                                  )}
                                  {showExamCoeff && (
                                    <td className="p-2 border border-border/50 text-center text-muted-foreground">
                                      {modData?.coefficient}
                                    </td>
                                  )}
                                  {showExamPoints && (
                                    <td className={`p-2 border border-border/50 text-center font-bold ${avgColor(modData?.examPoints ?? null)}`}>
                                      {modData?.examPoints !== null && modData?.examPoints !== undefined ? modData.examPoints.toFixed(2) : '0,00'}
                                    </td>
                                  )}
                                  {showExamAppreciation && (
                                    <td className="p-2 border border-border/50"></td>
                                  )}
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ))}
                        {/* TOTAL row */}
                        <tr className="font-bold" style={{ backgroundColor: `${tplStyle.primaryColor}33` }}>
                          <td className="p-2.5 border text-right text-xs uppercase" style={{ borderColor: `${tplStyle.primaryColor}66` }}>
                            TOTAL (Admis si &gt; ou = {currentBulletin.examTotalCoeff * 10})
                          </td>
                          {showExamNotes && <td className="p-2.5 border" style={{ borderColor: `${tplStyle.primaryColor}66` }}></td>}
                          {showExamCoeff && (
                            <td className="p-2.5 border text-center" style={{ borderColor: `${tplStyle.primaryColor}66` }}>
                              {currentBulletin.examTotalCoeff}
                            </td>
                          )}
                          {showExamPoints && (
                            <td className={`p-2.5 border text-center text-base ${avgColor(currentBulletin.examTotalPoints / Math.max(currentBulletin.examTotalCoeff, 1))}`} style={{ borderColor: `${tplStyle.primaryColor}66` }}>
                              {currentBulletin.examTotalPoints.toFixed(2)}
                            </td>
                          )}
                          {showExamAppreciation && (
                            <td className="p-2.5 border text-center font-bold" style={{ borderColor: `${tplStyle.primaryColor}66` }}>
                              {currentBulletin.examTotalPoints >= currentBulletin.examTotalCoeff * 10 ? (
                                <span className="text-green-600">ADMIS</span>
                              ) : (
                                <span className="text-red-600">NON ADMIS</span>
                              )}
                            </td>
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ===== DÉCISION FINALE ===== */}
                <div className="px-6 py-4">
                  <div className={`p-4 rounded-lg border-2 text-center ${
                    currentBulletin.decision === 'admis' ? 'border-green-400 bg-green-50 dark:bg-green-900/20' :
                    currentBulletin.decision === 'ajourne' ? 'border-red-400 bg-red-50 dark:bg-red-900/20' :
                    'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                  }`}>
                    <p className="text-xs uppercase tracking-wider font-medium mb-1 text-muted-foreground">Décision du conseil</p>
                    <p className={`text-xl font-bold ${
                      currentBulletin.decision === 'admis' ? 'text-green-600' :
                      currentBulletin.decision === 'ajourne' ? 'text-red-600' : 'text-amber-600'
                    }`}>
                      {decisionLabel(currentBulletin.decision)}
                    </p>
                    {currentBulletin.mention && (
                      <p className="text-sm mt-1">Mention : {MENTIONS.find(m => m.value === currentBulletin.mention)?.label || ''}</p>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-4 space-y-2">
                  {tplFooter.showAssiduity && (
                    <p className="text-[10px] text-muted-foreground italic">Assiduité : .............................</p>
                  )}
                  {tplFooter.customText && (
                    <p className="text-[10px] text-muted-foreground">{tplFooter.customText}</p>
                  )}
                  {tplFooter.showSignature && (
                    <div className="flex justify-end mt-4">
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Signature du directeur</p>
                        <div className="w-32 h-12 border-b border-border mt-1"></div>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between text-[10px] text-muted-foreground border-t border-border/50 pt-3 mt-3">
                    <span>Document généré le {format(new Date(), 'dd/MM/yyyy', { locale: fr })}</span>
                    <span>{establishment?.name} {establishment?.phone ? `• Tél : ${establishment.phone}` : ''}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
};

export default TranscriptsPanel;
