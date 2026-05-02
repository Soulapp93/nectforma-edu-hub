import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Save, Plus, AlertCircle, BookOpen, GraduationCap, Printer, Lock, Layers } from 'lucide-react';
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
import { teachingUnitService, type TeachingUnit } from '@/services/teachingUnitService';
import CreateEvaluationModal from './CreateEvaluationModal';

interface GradeSheetViewProps {
  mode: 'admin' | 'instructor';
  formationId: string;
  periodId?: string | null;
}

const GradeSheetView: React.FC<GradeSheetViewProps> = ({ mode, formationId, periodId }) => {
  const { userId, userRole } = useCurrentUser();
  const { establishment } = useEstablishment();
  const queryClient = useQueryClient();
  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';
  const selectedFormation = formationId;
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [preselectedModuleId, setPreselectedModuleId] = useState<string>('');
  const [localGrades, setLocalGrades] = useState<Map<string, Map<string, number | null>>>(new Map());
  const [isDirty, setIsDirty] = useState(false);
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
  const { data: rawModules } = useQuery({
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
  const modules = useMemo(() => rawModules ?? [], [rawModules]);

  // Teaching Units (UE) — to group matières by UE in the sidebar
  const { data: teachingUnits = [] } = useQuery<TeachingUnit[]>({
    queryKey: ['teaching-units-grade-sheet', selectedFormation],
    queryFn: () => teachingUnitService.listForFormation(selectedFormation),
    enabled: !!selectedFormation,
  });

  // Periods
  const { data: rawPeriods } = useQuery({
    queryKey: ['periods-sheet', selectedFormation],
    queryFn: () => getEvaluationPeriods(selectedFormation),
    enabled: !!selectedFormation,
  });
  const periods = useMemo(() => rawPeriods ?? [], [rawPeriods]);

  const isPeriodLocked = useMemo(() => {
    if (!periodId || periods.length === 0) return false;
    const cp = periods.find((p: any) => p.id === periodId);
    return cp?.is_locked === true;
  }, [periodId, periods]);

  void currentFormationData; // formation data fetch (kept for future enhancements)
  // Current selected period (from parent prop) — single source of truth
  const currentPeriod = useMemo(
    () => periods.find((p: any) => p.id === periodId) || null,
    [periods, periodId]
  );
  const isExamBlancView = currentPeriod?.period_type === 'examen_blanc' || currentPeriod?.period_type === 'examen_final';
  // NOTE: Composite periods are deprecated. Each period is now independent.
  // We keep this constant as `false` so existing legacy data renders as
  // a regular single-period bulletin.
  const isComposite = false;

  // Each period is independent — always scope to the single selected period.
  const activePeriodIds = useMemo(() => {
    return periodId ? [periodId] : [];
  }, [periodId]);

  const currentPeriodLabel = currentPeriod?.name || '';

  // Active semester numbers (best-effort: parse from period name)
  const activeSemesterNums = useMemo((): number[] | null => {
    if (!currentPeriod) return null;
    if (isExamBlancView) return null;
    const m = currentPeriod.name.match(/\d+/);
    return m ? [parseInt(m[0])] : null;
  }, [currentPeriod, isExamBlancView]);

  // Students
  const { data: rawStudents } = useQuery({
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
  const students = useMemo(() => rawStudents ?? [], [rawStudents]);

  // All evaluations
  const { data: rawAllEvaluations } = useQuery({
    queryKey: ['evaluations-sheet-all', selectedFormation],
    queryFn: async () => getEvaluations(selectedFormation),
    enabled: !!selectedFormation,
  });
  const allEvaluations = useMemo(() => rawAllEvaluations ?? [], [rawAllEvaluations]);

  // Period-scoped modules: when a period has explicit period_modules rows,
  // restrict the matières shown to those selected during period creation.
  const { data: periodModuleIds = null } = useQuery<string[] | null>({
    queryKey: ['period-module-ids', periodId],
    queryFn: async () => {
      if (!periodId) return null;
      const { data } = await supabase
        .from('period_modules')
        .select('module_id')
        .eq('period_id', periodId);
      const ids = (data || []).map((r: any) => r.module_id);
      return ids.length > 0 ? ids : null; // null = no explicit selection = show all
    },
    enabled: !!periodId,
  });

  // Filtered modules: first by period_modules link (if any), then by semester
  const filteredModules = useMemo(() => {
    let base = modules as any[];
    if (periodModuleIds && periodModuleIds.length > 0) {
      base = base.filter((m: any) => periodModuleIds.includes(m.id));
    }
    if (isExamBlancView) return base;
    if (!activeSemesterNums) return base;
    return base.filter((m: any) => !m.semester || semesterMatchesFilter(m.semester, activeSemesterNums));
  }, [modules, activeSemesterNums, isExamBlancView, periodModuleIds]);

  // Group filtered modules by UE for sidebar
  const matieresByUE = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const mod of filteredModules as any[]) {
      const k = mod.teaching_unit_id || '_unassigned';
      const arr = map.get(k) || [];
      arr.push(mod);
      map.set(k, arr);
    }
    // Ordered sections based on teachingUnits order; append unassigned at end
    const sections: Array<{ ue: TeachingUnit | null; modules: any[] }> = [];
    for (const ue of teachingUnits) {
      const mods = map.get(ue.id) || [];
      if (mods.length > 0) sections.push({ ue, modules: mods });
    }
    const unassigned = map.get('_unassigned') || [];
    if (unassigned.length > 0) sections.push({ ue: null, modules: unassigned });
    return sections;
  }, [filteredModules, teachingUnits]);

  // Auto-select first module when filtered list changes
  useEffect(() => {
    if (filteredModules.length > 0) {
      const stillExists = filteredModules.some((m: any) => m.id === selectedModuleId);
      if (!stillExists) setSelectedModuleId(filteredModules[0].id);
    } else {
      setSelectedModuleId('');
    }
  }, [filteredModules, selectedModuleId]);

  // Build per-module evaluation groups
  const moduleEvalGroups = useMemo(() => {
    const groups = new Map<string, { cc: Evaluation[]; exam: Evaluation[] }>();
    filteredModules.forEach((mod: any) => {
      let evals = allEvaluations.filter(e => e.module_id === mod.id);
      if (isExamBlancView) {
        const examBlancEvals = evals.filter(e => e.evaluation_type === 'examen_blanc');
        groups.set(mod.id, { cc: [], exam: examBlancEvals });
        return;
      }
      // ⭐ STRICT period isolation: when a period is selected, only evaluations
      // explicitly linked to that period are shown. Evaluations with NULL
      // period_id are NOT cross-period contaminated anymore.
      if (currentPeriod) {
        evals = evals.filter(e => e.period_id === currentPeriod.id);
      }
      const ccTypes = EVALUATION_TYPES.filter(t => t.category === 'cc').map(t => t.value);
      const cc = evals.filter(e => ccTypes.includes(e.evaluation_type));
      const exam = evals.filter(e => !ccTypes.includes(e.evaluation_type) && e.evaluation_type !== 'examen_blanc');
      groups.set(mod.id, { cc, exam });
    });
    return groups;
  }, [filteredModules, allEvaluations, currentPeriod, isExamBlancView]);

  // All displayed evaluations (for grade fetching across all modules)
  const allDisplayedEvals = useMemo(() => {
    const evals: Evaluation[] = [];
    moduleEvalGroups.forEach(group => {
      evals.push(...group.cc, ...group.exam);
    });
    return evals;
  }, [moduleEvalGroups]);

  // Fetch all grades
  const { data: rawGradesData } = useQuery({
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
  const allGradesData = useMemo(() => rawGradesData ?? [], [rawGradesData]);

  const evalIdsKey = useMemo(() => allDisplayedEvals.map(e => e.id).join(','), [allDisplayedEvals]);

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
  }, [students, evalIdsKey, allGradesData]);

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

  // Average over a list of evals for a student
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

  // Module average (CC + Exam 50/50 if both exist)
  const getModuleAverage = useCallback((studentId: string, moduleId: string): number | null => {
    const group = moduleEvalGroups.get(moduleId);
    if (!group) return null;
    const ccAvg = getAverage(studentId, group.cc);
    const examAvg = getAverage(studentId, group.exam);
    if (ccAvg === null && examAvg === null) return null;
    if (examAvg === null) return ccAvg;
    if (ccAvg === null) return examAvg;
    return Math.round((ccAvg * 0.5 + examAvg * 0.5) * 100) / 100;
  }, [moduleEvalGroups, getAverage]);

  // Save (saves all evaluations of currently selected module only)
  const saveMutation = useMutation({
    mutationFn: async () => {
      const group = moduleEvalGroups.get(selectedModuleId);
      if (!group) return;
      const evalsToSave = [...group.cc, ...group.exam];
      for (const ev of evalsToSave) {
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
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 12px; color: #1a1a1a; font-size: 11px; }
        .header { text-align: center; margin-bottom: 10px; }
        .header h2 { color: #1e40af; margin: 3px 0; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { border: 1px solid #94a3b8; padding: 4px 6px; }
        th { background: #1e40af; color: white; }
        .avg { color: #1e40af; font-weight: bold; }
        @media print { @page { size: portrait; } }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  const avgColor = (val: number | null) => {
    if (val === null) return '';
    return val >= 10 ? 'text-primary font-bold' : 'text-red-600 dark:text-red-400 font-bold';
  };

  const handleAddEvaluation = (moduleId: string) => {
    setPreselectedModuleId(moduleId);
    setShowCreateModal(true);
  };

  // Currently selected module + its eval group
  const selectedModule = useMemo(
    () => filteredModules.find((m: any) => m.id === selectedModuleId),
    [filteredModules, selectedModuleId]
  );
  const selectedGroup = moduleEvalGroups.get(selectedModuleId);
  const selectedEvals: Evaluation[] = selectedGroup ? [...selectedGroup.cc, ...selectedGroup.exam] : [];

  const getStudentInitials = (s: any) => {
    const f = (s.first_name || '').charAt(0);
    const l = (s.last_name || '').charAt(0);
    return `${f}${l}`.toUpperCase() || '??';
  };

  // Short header label per evaluation
  const getEvalShortLabel = (ev: Evaluation): string => {
    const typeInfo = EVALUATION_TYPES.find(t => t.value === ev.evaluation_type);
    const inParens = typeInfo?.label?.match(/\(([^)]+)\)/)?.[1];
    if (inParens) return inParens;
    if (ev.evaluation_type === 'partiel') return 'Partiel';
    if (ev.evaluation_type === 'examen_final') return 'Examen';
    if (ev.evaluation_type === 'examen_blanc') return 'Ex. Blanc';
    if (ev.evaluation_type === 'rattrapage') return 'Ratt.';
    return typeInfo?.label || ev.title;
  };

  return (
    <div className="space-y-4">
      {/* Top bar : actions only (period selection is handled by parent) */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 ml-auto">
          {isDirty && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 animate-pulse">
              <AlertCircle className="h-3 w-3 mr-1" />
              Non enregistré
            </Badge>
          )}
          <Button size="sm" variant="outline" onClick={handlePrint} className="gap-2" data-testid="sheet-print-btn">
            <Printer className="h-4 w-4" />
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
            <h3 className="text-lg font-medium text-foreground">Aucun module pour cette période</h3>
            <p className="text-sm text-muted-foreground mt-1">Ajoutez des modules à cette période d'évaluation.</p>
          </CardContent>
        </Card>
      ) : (
        <div ref={printRef}>
          {/* Locked banner */}
          {isPeriodLocked && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-center gap-2 mb-3">
              <Lock className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                PV et résultats validés — la saisie est verrouillée. Pour modifier, déverrouillez dans l'onglet "Jury & Délibération".
              </p>
            </div>
          )}

          {/* Two-column layout : sidebar + table */}
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
            {/* LEFT — UE & Matières sidebar */}
            <aside className="bg-card rounded-2xl border border-border shadow-sm p-3 self-start" data-testid="modules-sidebar">
              <h3 className="px-3 pt-1 pb-3 text-base font-bold text-primary flex items-center gap-2">
                <Layers className="h-4 w-4" />
                UE & Matières
              </h3>
              <nav className="flex flex-col gap-3" data-testid="ue-grouped-nav">
                {matieresByUE.length === 0 && (
                  <p className="text-xs text-muted-foreground italic px-3 py-2">Aucune matière disponible.</p>
                )}
                {matieresByUE.map(({ ue, modules: ueModules }) => (
                  <div key={ue?.id || 'unassigned'} className="space-y-1" data-testid={`grade-ue-${ue?.id || 'unassigned'}`}>
                    {/* UE header */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/15">
                      <BookOpen className="h-3 w-3 text-primary/80 shrink-0" />
                      <span className="text-[11px] font-bold text-primary uppercase tracking-wide truncate">
                        {ue ? ue.title : 'Non rattachées'}
                      </span>
                      {ue?.code && <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 ml-auto">{ue.code}</Badge>}
                    </div>
                    {/* Matières of this UE */}
                    <div className="flex flex-col gap-1 pl-1">
                      {ueModules.map((mod: any) => {
                        const isActive = mod.id === selectedModuleId;
                        return (
                          <button
                            key={mod.id}
                            data-testid={`module-tab-${mod.id}`}
                            onClick={() => setSelectedModuleId(mod.id)}
                            className={`text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                              isActive
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'text-foreground/80 hover:bg-muted'
                            }`}
                          >
                            <div className="truncate">{mod.title}</div>
                            {mod.coefficient > 1 && (
                              <div className={`text-[10px] mt-0.5 font-normal ${isActive ? 'opacity-80' : 'text-muted-foreground'}`}>
                                coef {mod.coefficient}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </aside>

            {/* RIGHT — Selected module grade entry */}
            <section className="bg-card rounded-2xl border border-border shadow-sm p-5 sm:p-6 min-w-0">
              {selectedModule ? (
                <>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h2 className="text-xl font-bold text-primary leading-tight">{selectedModule.title}</h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        {currentFormationData?.title}
                        {currentPeriodLabel && <span> · {currentPeriodLabel}</span>}
                      </p>
                    </div>
                    {!isPeriodLocked && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddEvaluation(selectedModule.id)}
                        className="gap-2 print:hidden"
                        data-testid="add-evaluation-btn"
                      >
                        <Plus className="h-4 w-4" />
                        Ajouter une évaluation
                      </Button>
                    )}
                  </div>

                  {selectedEvals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                      <BookOpen className="h-10 w-10 mb-3 opacity-40" />
                      <p className="text-sm">Aucune évaluation pour ce module sur cette période.</p>
                      {!isPeriodLocked && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAddEvaluation(selectedModule.id)}
                          className="mt-3 gap-2 print:hidden"
                        >
                          <Plus className="h-4 w-4" />
                          Créer une évaluation
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Grade entry table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left p-3 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">
                                Étudiant
                              </th>
                              {selectedEvals.map(ev => (
                                <th
                                  key={ev.id}
                                  className="text-center p-3 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider"
                                  title={ev.title}
                                >
                                  {getEvalShortLabel(ev)}
                                </th>
                              ))}
                              <th className="text-right p-3 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider w-20">
                                Moy.
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {students.length === 0 ? (
                              <tr>
                                <td colSpan={selectedEvals.length + 2} className="text-center text-muted-foreground py-12 text-sm">
                                  Aucun étudiant inscrit à cette formation
                                </td>
                              </tr>
                            ) : (
                              students.map((student: any) => {
                                const modAvg = getModuleAverage(student.user_id, selectedModule.id);
                                const studentGrades = localGrades.get(student.user_id);
                                const canEdit = mode === 'admin' || selectedEvals.some(ev => ev.instructor_id === userId);
                                return (
                                  <tr key={student.user_id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                    <td className="p-3 font-medium">
                                      <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold ring-2 ring-amber-400">
                                          {getStudentInitials(student)}
                                        </div>
                                        <span className="text-foreground">{student.first_name} {student.last_name}</span>
                                      </div>
                                    </td>
                                    {selectedEvals.map(ev => {
                                      const isOpen = ev.status === 'ouvert' || ev.status === 'brouillon';
                                      const value = studentGrades?.get(ev.id);
                                      const editable = canEdit && isOpen && !isPeriodLocked;
                                      return (
                                        <td key={ev.id} className="p-3 text-center">
                                          {editable ? (
                                            <Input
                                              type="number"
                                              min={0}
                                              max={ev.scale || 20}
                                              step={0.25}
                                              value={value ?? ''}
                                              onChange={(e) =>
                                                updateGrade(
                                                  student.user_id,
                                                  ev.id,
                                                  e.target.value === '' ? null : parseFloat(e.target.value)
                                                )
                                              }
                                              className="w-16 h-10 text-center mx-auto rounded-lg border-border/60 focus:border-primary"
                                              placeholder="—"
                                              data-testid={`grade-input-${student.user_id}-${ev.id}`}
                                            />
                                          ) : (
                                            <span className={`text-sm ${value != null ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                              {value != null ? value : '—'}
                                            </span>
                                          )}
                                        </td>
                                      );
                                    })}
                                    <td className={`p-3 text-right text-base ${avgColor(modAvg)}`}>
                                      {modAvg !== null ? modAvg.toFixed(2) : '—'}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Save action */}
                      <div className="flex justify-end mt-6 print:hidden">
                        <Button
                          onClick={() => saveMutation.mutate()}
                          disabled={!isDirty || saveMutation.isPending || isPeriodLocked}
                          className="gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-5 rounded-xl shadow-md disabled:opacity-50"
                          data-testid="save-grades-btn"
                        >
                          <Save className="h-4 w-4" />
                          {isPeriodLocked
                            ? 'PV validé (verrouillé)'
                            : saveMutation.isPending
                            ? 'Enregistrement...'
                            : 'Enregistrer'}
                        </Button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                  <BookOpen className="h-12 w-12 mb-3 opacity-40" />
                  <p className="text-sm">Sélectionnez une matière</p>
                </div>
              )}
            </section>
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
          preselectedPeriodId={periodId}
        />
      )}
    </div>
  );
};

export default GradeSheetView;
