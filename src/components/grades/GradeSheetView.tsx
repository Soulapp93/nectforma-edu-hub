import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Save, Plus, AlertCircle, BookOpen, GraduationCap, Printer } from 'lucide-react';
import { EVALUATION_TYPES } from '@/services/gradesService';
import { semesterMatchesFilter } from '@/utils/semesterUtils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEstablishment } from '@/hooks/useEstablishment';
import { toast } from 'sonner';
import {
  getEvaluations,
  getGradesByEvaluation,
  upsertGrades,
  getEvaluationPeriods,
  type Evaluation,
  type Grade,
} from '@/services/gradesService';
import CreateEvaluationModal from './CreateEvaluationModal';

interface GradeSheetViewProps {
  mode: 'admin' | 'instructor';
  formationId: string;
}

const GradeSheetView: React.FC<GradeSheetViewProps> = ({ mode, formationId }) => {
  const { userId, userRole } = useCurrentUser();
  const { establishment } = useEstablishment();
  const queryClient = useQueryClient();
  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';
  const selectedFormation = formationId;
  const [semesterView, setSemesterView] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [preselectedModuleId, setPreselectedModuleId] = useState<string>('');
  const [localGrades, setLocalGrades] = useState<Map<string, Map<string, number | null>>>(new Map());
  const [isDirty, setIsDirty] = useState(false);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const printRef = useRef<HTMLDivElement>(null);

  // Formation data
  const { data: currentFormationData } = useQuery({
    queryKey: ['formation-data-sheet', selectedFormation],
    queryFn: async () => {
      const { data } = await supabase.from('formations').select('id, title, status, color, level, start_date, end_date, duration_years, semesters_count, formation_type').eq('id', selectedFormation).single();
      return data;
    },
    enabled: !!selectedFormation,
  });

  // Modules
  const { data: modules = [] } = useQuery({
    queryKey: ['formation-modules-sheet', selectedFormation],
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

  // Periods
  const { data: periods = [] } = useQuery({
    queryKey: ['periods-sheet', selectedFormation],
    queryFn: () => getEvaluationPeriods(selectedFormation),
    enabled: !!selectedFormation,
  });

  const durationYears = (currentFormationData as any)?.duration_years || 1;
  const semestersCount = (currentFormationData as any)?.semesters_count || durationYears * 2;
  const isBTS = (currentFormationData as any)?.formation_type === 'bts';
  const isExamBlancView = semesterView === 'exam_blanc';

  useEffect(() => {
    if (currentFormationData && !semesterView) setSemesterView('s1');
  }, [currentFormationData]);

  const activePeriodIds = useMemo(() => {
    if (!semesterView || periods.length === 0 || isExamBlancView) return [];
    if (semesterView === 'bulletin-global') return periods.map(p => p.id);
    if (semesterView.startsWith('bulletin-')) {
      const yearNum = parseInt(semesterView.split('-')[1]);
      const startIdx = (yearNum - 1) * 2;
      return periods.filter((_, idx) => idx >= startIdx && idx < startIdx + 2).map(p => p.id);
    }
    const semNum = parseInt(semesterView.replace('s', ''));
    const idx = semNum - 1;
    return periods[idx] ? [periods[idx].id] : [];
  }, [semesterView, periods, isExamBlancView]);

  const isFinalView = semesterView.startsWith('bulletin-');

  const activeSemesterNums = useMemo((): number[] | null => {
    if (!semesterView || isExamBlancView) return null; // exam blanc shows all modules
    if (semesterView === 'bulletin-global') return Array.from({ length: semestersCount }, (_, i) => i + 1);
    if (semesterView.startsWith('bulletin-')) {
      const yearNum = parseInt(semesterView.split('-')[1]);
      return [(yearNum - 1) * 2 + 1, (yearNum - 1) * 2 + 2];
    }
    const num = parseInt(semesterView.replace('s', ''));
    return isNaN(num) ? null : [num];
  }, [semesterView, semestersCount, isExamBlancView]);

  const currentPeriodLabel = useMemo(() => {
    if (isExamBlancView) return 'Examen Blanc';
    if (semesterView === 'bulletin-global') return 'Bulletin de Formation';
    if (isFinalView) {
      const yearNum = parseInt(semesterView.split('-')[1]);
      return durationYears === 1 ? 'Bulletin de Formation' : `Bulletin Année ${yearNum}`;
    }
    if (semesterView) {
      const semNum = parseInt(semesterView.replace('s', ''));
      return `Semestre ${semNum}`;
    }
    return '';
  }, [semesterView, isFinalView, durationYears, isExamBlancView]);

  // Students
  const { data: students = [] } = useQuery({
    queryKey: ['students-grade-sheet', selectedFormation],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_formation_students', { formation_id_param: selectedFormation });
      return (data || []).sort((a: any, b: any) => {
        const cmp = (a.last_name || '').localeCompare(b.last_name || '');
        return cmp !== 0 ? cmp : (a.first_name || '').localeCompare(b.first_name || '');
      });
    },
    enabled: !!selectedFormation,
  });

  // All evaluations
  const { data: allEvaluations = [] } = useQuery({
    queryKey: ['evaluations-sheet-all', selectedFormation],
    queryFn: async () => getEvaluations(selectedFormation),
    enabled: !!selectedFormation,
  });

  // Filtered modules by semester (exam blanc view: show all modules)
  const filteredModules = useMemo(() => {
    if (isExamBlancView) return modules;
    if (!activeSemesterNums) return modules;
    return modules.filter((m: any) => !m.semester || semesterMatchesFilter(m.semester, activeSemesterNums));
  }, [modules, activeSemesterNums, isExamBlancView]);

  // Build per-module evaluation groups
  const moduleEvalGroups = useMemo(() => {
    const groups = new Map<string, { cc: Evaluation[]; exam: Evaluation[] }>();
    
    filteredModules.forEach((mod: any) => {
      let evals = allEvaluations.filter(e => e.module_id === mod.id);
      
      // For exam blanc view, only show exam_blanc evaluations
      if (isExamBlancView) {
        const examBlancEvals = evals.filter(e => e.evaluation_type === 'examen_blanc');
        groups.set(mod.id, { cc: [], exam: examBlancEvals });
        return;
      }
      
      // Filter by semester
      if (activeSemesterNums && activeSemesterNums.length > 0) {
        evals = evals.filter(e => {
          if (e.period_id && activePeriodIds.length > 0) return activePeriodIds.includes(e.period_id);
          const m = modules.find(m => m.id === e.module_id);
          if (m?.semester) return semesterMatchesFilter(m.semester, activeSemesterNums);
          return true;
        });
      }
      
      const ccTypes = EVALUATION_TYPES.filter(t => t.category === 'cc').map(t => t.value);
      // In normal semester view, exclude exam_blanc from display
      const cc = evals.filter(e => ccTypes.includes(e.evaluation_type));
      const exam = evals.filter(e => !ccTypes.includes(e.evaluation_type) && e.evaluation_type !== 'examen_blanc');
      groups.set(mod.id, { cc, exam });
    });
    
    return groups;
  }, [filteredModules, allEvaluations, activeSemesterNums, activePeriodIds, modules, isExamBlancView]);

  // All displayed evaluations (for grade fetching)
  const allDisplayedEvals = useMemo(() => {
    const evals: Evaluation[] = [];
    moduleEvalGroups.forEach(group => {
      evals.push(...group.cc, ...group.exam);
    });
    return evals;
  }, [moduleEvalGroups]);

  // Fetch all grades
  const { data: allGradesData = [] } = useQuery({
    queryKey: ['all-grades-sheet', allDisplayedEvals.map(e => e.id).join(',')],
    queryFn: async () => {
      const results: { evalId: string; grades: Grade[] }[] = [];
      for (const ev of allDisplayedEvals) {
        const grades = await getGradesByEvaluation(ev.id);
        results.push({ evalId: ev.id, grades });
      }
      return results;
    },
    enabled: allDisplayedEvals.length > 0,
  });

  // Init local grades
  useEffect(() => {
    const gradeMap = new Map<string, Map<string, number | null>>();
    students.forEach((s: any) => {
      const studentGrades = new Map<string, number | null>();
      allDisplayedEvals.forEach(ev => {
        const gradeData = allGradesData.find(g => g.evalId === ev.id);
        const grade = gradeData?.grades.find(g => g.student_id === s.user_id);
        studentGrades.set(ev.id, grade?.value ?? null);
      });
      gradeMap.set(s.user_id, studentGrades);
    });
    setLocalGrades(gradeMap);
    setIsDirty(false);
  }, [students, allDisplayedEvals, allGradesData]);

  const updateGrade = useCallback((studentId: string, evaluationId: string, value: number | null) => {
    setLocalGrades(prev => {
      const newMap = new Map(prev);
      const studentGrades = new Map(newMap.get(studentId) || new Map());
      studentGrades.set(evaluationId, value);
      newMap.set(studentId, studentGrades);
      return newMap;
    });
    setIsDirty(true);
  }, []);

  // Get average for a set of evaluations for a student
  const getAverage = useCallback((studentId: string, evals: Evaluation[]): number | null => {
    const studentGrades = localGrades.get(studentId);
    if (!studentGrades || evals.length === 0) return null;
    const values: number[] = [];
    evals.forEach(ev => {
      const v = studentGrades.get(ev.id);
      if (v !== null && v !== undefined) values.push(v);
    });
    if (values.length === 0) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
  }, [localGrades]);

  // Module average (CC + Exam weighted if both exist)
  const getModuleAverage = useCallback((studentId: string, moduleId: string): number | null => {
    const group = moduleEvalGroups.get(moduleId);
    if (!group) return null;
    const ccAvg = getAverage(studentId, group.cc);
    const examAvg = getAverage(studentId, group.exam);
    if (ccAvg === null && examAvg === null) return null;
    if (examAvg === null) return ccAvg;
    if (ccAvg === null) return examAvg;
    // 50/50 CC/Exam when both present
    return Math.round((ccAvg * 0.5 + examAvg * 0.5) * 100) / 100;
  }, [moduleEvalGroups, getAverage]);

  // General weighted average
  const getGeneralAverage = useCallback((studentId: string): number | null => {
    let totalPoints = 0;
    let totalCoef = 0;
    filteredModules.forEach((mod: any) => {
      const avg = getModuleAverage(studentId, mod.id);
      if (avg !== null) {
        totalPoints += avg * (mod.coefficient || 1);
        totalCoef += (mod.coefficient || 1);
      }
    });
    if (totalCoef === 0) return null;
    return Math.round((totalPoints / totalCoef) * 100) / 100;
  }, [filteredModules, getModuleAverage]);

  // Class averages per module
  const getClassModuleAvg = useCallback((moduleId: string): number | null => {
    const avgs = students.map((s: any) => getModuleAverage(s.user_id, moduleId)).filter((v): v is number => v !== null);
    if (avgs.length === 0) return null;
    return Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 100) / 100;
  }, [students, getModuleAverage]);

  const getClassGeneralAvg = useMemo(() => {
    const avgs = students.map((s: any) => getGeneralAverage(s.user_id)).filter((v): v is number => v !== null);
    if (avgs.length === 0) return null;
    return Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 100) / 100;
  }, [students, getGeneralAverage]);

  // Save
  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const ev of allDisplayedEvals) {
        const gradesToSave: Partial<Grade>[] = [];
        students.forEach((s: any) => {
          const studentGrades = localGrades.get(s.user_id);
          const value = studentGrades?.get(ev.id) ?? null;
          gradesToSave.push({
            evaluation_id: ev.id,
            student_id: s.user_id,
            value,
            status: 'brouillon',
            is_absent: false,
            is_excused: false,
            is_dispensed: false,
            is_cheating: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        });
        await upsertGrades(gradesToSave);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-grades-sheet'] });
      toast.success('Notes enregistrées avec succès');
      setIsDirty(false);
    },
    onError: (e: any) => toast.error(e.message || 'Erreur lors de l\'enregistrement'),
  });

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Feuille de notes</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 10px; color: #1a1a1a; font-size: 9px; }
        .header { text-align: center; margin-bottom: 10px; }
        .header h2 { color: #1e40af; margin: 3px 0; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; font-size: 8px; }
        th, td { border: 1px solid #94a3b8; padding: 2px 4px; }
        .module-header { background: #1e40af; color: white; font-weight: 700; text-align: center; }
        .sub-header { background: #e2e8f0; font-weight: 600; text-align: center; font-size: 7px; }
        .avg-green { color: #16a34a; font-weight: bold; }
        .avg-red { color: #dc2626; font-weight: bold; }
        .class-avg-row { background: #dbeafe; font-weight: bold; }
        .general-col { background: #fef3c7; }
        @media print { body { padding: 5px; } @page { size: landscape; } }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  const avgColor = (val: number | null) => {
    if (val === null) return '';
    return val >= 10 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const getAppreciation = (avg: number | null): string => {
    if (avg === null) return '';
    if (avg >= 16) return 'Très bien';
    if (avg >= 14) return 'Bien';
    if (avg >= 12) return 'Assez bien';
    if (avg >= 10) return 'Passable';
    if (avg >= 8) return 'Insuffisant';
    return 'Très insuffisant';
  };

  const renderGradeCell = (studentId: string, ev: Evaluation, canEdit: boolean) => {
    const studentGrades = localGrades.get(studentId);
    const value = studentGrades?.get(ev.id);
    const isOpen = ev.status === 'ouvert' || ev.status === 'brouillon';

    if (canEdit && isOpen) {
      return (
        <Input
          type="number"
          min={0}
          max={ev.scale || 20}
          step={0.25}
          value={value ?? ''}
          onChange={(e) => updateGrade(studentId, ev.id, e.target.value === '' ? null : parseFloat(e.target.value))}
          className="w-12 h-5 text-center text-[10px] mx-auto border-border/50 focus:border-primary p-0"
          placeholder="—"
        />
      );
    }
    return (
      <span className={`text-[10px] ${value != null ? 'font-medium' : 'text-muted-foreground'}`}>
        {value != null ? value : '—'}
      </span>
    );
  };

  const handleAddEvaluation = (moduleId: string) => {
    setPreselectedModuleId(moduleId);
    setShowCreateModal(true);
  };

  // Calculate total colSpan for each module
  const getModuleColSpan = (modId: string) => {
    const group = moduleEvalGroups.get(modId);
    if (!group) return 1;
    const ccCols = Math.max(group.cc.length, 1); // at least 1 CC col
    const examCols = group.exam.length > 0 ? group.exam.length : 0;
    return ccCols + 1 + examCols; // +1 for module avg column
  };

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
        {semestersCount > 0 && currentFormationData && (
          <div className="flex flex-wrap items-center gap-1 bg-muted/50 rounded-xl p-1.5">
            {Array.from({ length: durationYears }, (_, y) => {
              const s1 = y * 2 + 1;
              const yearNum = y + 1;
              return (
                <React.Fragment key={yearNum}>
                  {durationYears > 1 && (
                    <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider ml-1.5 mr-0.5">A{yearNum}</span>
                  )}
                  {Array.from({ length: Math.min(2, semestersCount - y * 2) }, (_, si) => {
                    const semNum = s1 + si;
                    return (
                      <button
                        key={`s${semNum}`}
                        onClick={() => setSemesterView(`s${semNum}`)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          semesterView === `s${semNum}` 
                            ? 'bg-primary text-primary-foreground shadow-sm' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        S{semNum}
                      </button>
                    );
                  })}
                  {yearNum < durationYears && <div className="w-px h-5 bg-border mx-0.5" />}
                </React.Fragment>
              );
            })}
            {/* Examen Blanc tab for BTS */}
            {isBTS && (
              <>
                <div className="w-px h-5 bg-border mx-0.5" />
                <button
                  onClick={() => setSemesterView('exam_blanc')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    semesterView === 'exam_blanc'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  Examen Blanc
                </button>
              </>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {isDirty && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 animate-pulse">
              <AlertCircle className="h-3 w-3 mr-1" />
              Non enregistré
            </Badge>
          )}
          <Button size="sm" variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!isDirty || saveMutation.isPending}
            size="sm"
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      {!selectedFormation ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <GraduationCap className="h-14 w-14 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-foreground">Sélectionnez une formation</h3>
          </CardContent>
        </Card>
      ) : filteredModules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-14 w-14 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-foreground">Aucun module pour ce semestre</h3>
            <p className="text-sm text-muted-foreground mt-1">Configurez les modules dans les paramètres de la formation</p>
          </CardContent>
        </Card>
      ) : (
        <div ref={printRef}>
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-3 px-2">
            <div className="flex items-center gap-2">
              {establishment?.logo_url && (
                <img src={establishment.logo_url} alt="" className="h-8 w-8 rounded-md object-contain" />
              )}
              <div className="leading-tight">
                <h2 className="text-sm font-bold text-foreground">{establishment?.name}</h2>
                {currentPeriodLabel && <p className="text-[10px] text-muted-foreground">{currentPeriodLabel}</p>}
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-semibold text-foreground">{currentFormationData?.title}</h3>
              {currentFormationData?.level && <p className="text-[10px] text-muted-foreground">{currentFormationData.level}</p>}
            </div>
          </div>

          {/* Multi-module table */}
          <div className="rounded-lg border border-border shadow-sm bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  {/* Module group headers */}
                  <tr>
                    <th rowSpan={2} className="text-left p-2 border border-border font-semibold min-w-[150px] bg-muted/50 sticky left-0 z-10 text-xs">
                      Apprenant
                    </th>
                    {filteredModules.map((mod: any) => {
                      const group = moduleEvalGroups.get(mod.id);
                      const colSpan = getModuleColSpan(mod.id);
                      return (
                        <th
                          key={mod.id}
                          colSpan={colSpan}
                          className="bg-primary text-primary-foreground text-center p-0 font-bold border border-primary/80 text-[11px]"
                        >
                          <div className="p-1.5">
                            <div className="flex items-center justify-center gap-1">
                              <span>{mod.title}</span>
                              <span className="opacity-70 font-normal">(coef {mod.coefficient})</span>
                              <button
                                onClick={() => handleAddEvaluation(mod.id)}
                                className="ml-1 w-4 h-4 rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/40 flex items-center justify-center text-primary-foreground transition-colors print:hidden"
                                title="Ajouter un contrôle"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            {mod.semester && <div className="text-[8px] opacity-70 font-normal">S{mod.semester}</div>}
                          </div>
                          <div className="border-t border-primary-foreground/30 bg-primary-foreground/10 px-1.5 py-1">
                            <span className="text-[9px] font-semibold opacity-90">Moyenne du module</span>
                          </div>
                        </th>
                      );
                    })}
                    <th rowSpan={2} className="bg-amber-500 text-white text-center p-2 border border-amber-600 font-bold min-w-[70px] text-xs">
                      Moy. Gén.
                    </th>
                  </tr>
                  {/* Sub-headers per module */}
                  <tr className="bg-muted/40">
                    {filteredModules.map((mod: any) => {
                      const group = moduleEvalGroups.get(mod.id);
                      if (!group) return null;
                      const ccCols = Math.max(group.cc.length, 1);
                      const cells = [];
                      
                      // CC evaluation columns
                      for (let i = 0; i < ccCols; i++) {
                        const ev = group.cc[i];
                        const typeInfo = ev ? EVALUATION_TYPES.find(t => t.value === ev.evaluation_type) : null;
                        const shortLabel = ev ? (typeInfo?.label?.match(/\(([^)]+)\)/)?.[1] || `CC${i + 1}`) : `CC${i + 1}`;
                        cells.push(
                          <th key={`${mod.id}-cc-${i}`} className="text-center p-1 border border-border font-medium w-12 text-[8px] truncate max-w-[60px]" title={ev?.title}>
                            {ev ? (ev.title.length > 8 ? shortLabel : ev.title) : `CC${i + 1}`}
                          </th>
                        );
                      }
                      
                      // Exam columns
                      group.exam.forEach((ev, i) => {
                        const typeInfo = EVALUATION_TYPES.find(t => t.value === ev.evaluation_type);
                        const shortLabel = ev.evaluation_type === 'examen_blanc' ? 'Ex.B' : 
                                          ev.evaluation_type === 'examen_final' ? 'Ex.F' :
                                          ev.evaluation_type === 'partiel' ? 'Part.' : 
                                          typeInfo?.label?.match(/\(([^)]+)\)/)?.[1] || 'Ex';
                        cells.push(
                          <th key={`${mod.id}-exam-${i}`} className="text-center p-1 border border-border font-medium w-12 bg-emerald-100/50 dark:bg-emerald-900/20 text-[8px]" title={ev.title}>
                            {shortLabel}
                          </th>
                        );
                      });
                      
                      // Module average column
                      cells.push(
                        <th key={`${mod.id}-avg`} className="text-center p-1 border border-border font-bold w-12 bg-blue-100/50 dark:bg-blue-900/20 text-[8px]">
                          Moy.
                        </th>
                      );
                      
                      return <React.Fragment key={`sub-${mod.id}`}>{cells}</React.Fragment>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student: any, idx: number) => {
                    const generalAvg = getGeneralAverage(student.user_id);
                    return (
                      <tr key={student.user_id} className={`hover:bg-muted/20 ${idx % 2 === 0 ? 'bg-card' : 'bg-muted/10'}`}>
                        <td className="p-1.5 border border-border/50 font-medium text-foreground sticky left-0 bg-card z-10 text-[11px]">
                          {student.last_name} {student.first_name}
                        </td>
                        {filteredModules.map((mod: any) => {
                          const group = moduleEvalGroups.get(mod.id);
                          if (!group) return null;
                          const ccCols = Math.max(group.cc.length, 1);
                          const canEdit = mode === 'admin' || [...group.cc, ...group.exam].some(ev => ev.instructor_id === userId);
                          const modAvg = getModuleAverage(student.user_id, mod.id);
                          const cells = [];

                          // CC cells
                          for (let i = 0; i < ccCols; i++) {
                            const ev = group.cc[i];
                            cells.push(
                              <td key={`${mod.id}-cc-${i}`} className="p-0.5 border border-border/50 text-center">
                                {ev ? renderGradeCell(student.user_id, ev, canEdit) : (
                                  <span className="text-muted-foreground/30">—</span>
                                )}
                              </td>
                            );
                          }

                          // Exam cells
                          group.exam.forEach((ev, i) => {
                            cells.push(
                              <td key={`${mod.id}-exam-${i}`} className="p-0.5 border border-border/50 text-center bg-emerald-50/20 dark:bg-emerald-900/5">
                                {renderGradeCell(student.user_id, ev, canEdit)}
                              </td>
                            );
                          });

                          // Module avg
                          cells.push(
                            <td key={`${mod.id}-avg`} className={`p-1 border border-border/50 text-center font-bold bg-blue-50/30 dark:bg-blue-900/10 ${avgColor(modAvg)}`}>
                              {modAvg !== null ? modAvg.toFixed(2) : '—'}
                            </td>
                          );

                          return <React.Fragment key={`row-${mod.id}`}>{cells}</React.Fragment>;
                        })}
                        {/* General average */}
                        <td className={`p-1.5 border border-border/50 text-center font-bold text-xs bg-amber-50/30 dark:bg-amber-900/10 ${avgColor(generalAvg)}`}>
                          {generalAvg !== null ? generalAvg.toFixed(2) : '—'}
                          {generalAvg !== null && (
                            <div className="text-[7px] font-normal text-muted-foreground">{getAppreciation(generalAvg)}</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Class average row */}
                  {students.length > 0 && (
                    <tr className="bg-primary/5 font-bold border-t-2 border-primary/30">
                      <td className="p-1.5 border border-border text-right uppercase text-[9px] tracking-wider sticky left-0 bg-primary/5 z-10">
                        Moy. classe
                      </td>
                      {filteredModules.map((mod: any) => {
                        const group = moduleEvalGroups.get(mod.id);
                        if (!group) return null;
                        const ccCols = Math.max(group.cc.length, 1);
                        const classModAvg = getClassModuleAvg(mod.id);
                        const cells = [];

                        for (let i = 0; i < ccCols; i++) {
                          cells.push(<td key={`avg-cc-${i}`} className="p-1 border border-border text-center text-muted-foreground">—</td>);
                        }
                        group.exam.forEach((_, i) => {
                          cells.push(<td key={`avg-exam-${i}`} className="p-1 border border-border text-center text-muted-foreground">—</td>);
                        });
                        cells.push(
                          <td key={`avg-mod`} className={`p-1 border border-border text-center font-bold bg-blue-100/50 dark:bg-blue-800/20 ${avgColor(classModAvg)}`}>
                            {classModAvg !== null ? classModAvg.toFixed(2) : '—'}
                          </td>
                        );

                        return <React.Fragment key={`class-${mod.id}`}>{cells}</React.Fragment>;
                      })}
                      <td className={`p-1.5 border border-border text-center font-bold bg-amber-100/50 dark:bg-amber-800/20 ${avgColor(getClassGeneralAvg)}`}>
                        {getClassGeneralAvg !== null ? getClassGeneralAvg.toFixed(2) : '—'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {students.length} étudiant{students.length > 1 ? 's' : ''} • {filteredModules.length} module{filteredModules.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateEvaluationModal
          isOpen={true}
          onClose={() => { setShowCreateModal(false); setPreselectedModuleId(''); }}
          evaluation={null}
          formationId={selectedFormation}
          mode={mode}
          preselectedModuleId={preselectedModuleId}
        />
      )}
    </div>
  );
};

export default GradeSheetView;
