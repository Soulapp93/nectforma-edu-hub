import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Plus, AlertCircle, BookOpen, GraduationCap, FileSpreadsheet, Printer } from 'lucide-react';
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
}

const GradeSheetView: React.FC<GradeSheetViewProps> = ({ mode }) => {
  const { userId, userRole } = useCurrentUser();
  const { establishment } = useEstablishment();
  const queryClient = useQueryClient();
  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';
  const [selectedFormation, setSelectedFormation] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [localGrades, setLocalGrades] = useState<Map<string, Map<string, number | null>>>(new Map());
  const [isDirty, setIsDirty] = useState(false);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const printRef = useRef<HTMLDivElement>(null);

  // Formations
  const { data: formations = [] } = useQuery({
    queryKey: ['formations-grade-sheet'],
    queryFn: async () => {
      if (!isAdmin) {
        const { data } = await supabase
          .from('user_formation_assignments')
          .select('formation_id, formations(id, title, status, color, level, start_date, end_date)')
          .eq('user_id', userId!);
        return (data || []).map((d: any) => d.formations).filter(Boolean);
      }
      const { data } = await supabase.from('formations').select('id, title, status, color, level, start_date, end_date').order('title');
      return data || [];
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (formations.length > 0 && !selectedFormation) setSelectedFormation(formations[0].id);
  }, [formations]);

  // Modules de la formation
  const { data: modules = [] } = useQuery({
    queryKey: ['formation-modules-sheet', selectedFormation],
    queryFn: async () => {
      const { data } = await supabase
        .from('formation_modules')
        .select('id, title, coefficient, order_index, teaching_unit_id')
        .eq('formation_id', selectedFormation)
        .order('order_index');
      return data || [];
    },
    enabled: !!selectedFormation,
  });

  // Teaching units
  const { data: teachingUnits = [] } = useQuery({
    queryKey: ['teaching-units-sheet', selectedFormation],
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

  // Périodes
  const { data: periods = [] } = useQuery({
    queryKey: ['periods-sheet', selectedFormation],
    queryFn: () => getEvaluationPeriods(selectedFormation),
    enabled: !!selectedFormation,
  });

  // Étudiants
  const { data: students = [] } = useQuery({
    queryKey: ['students-grade-sheet', selectedFormation],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_formation_students', {
        formation_id_param: selectedFormation,
      });
      return (data || []).sort((a: any, b: any) => {
        const lastNameCmp = (a.last_name || '').localeCompare(b.last_name || '');
        if (lastNameCmp !== 0) return lastNameCmp;
        return (a.first_name || '').localeCompare(b.first_name || '');
      });
    },
    enabled: !!selectedFormation,
  });

  // All evaluations for the formation
  const { data: allEvaluations = [] } = useQuery({
    queryKey: ['evaluations-sheet-all', selectedFormation],
    queryFn: async () => {
      const allEvals = await getEvaluations(selectedFormation);
      return allEvals;
    },
    enabled: !!selectedFormation,
  });

  // Filter evaluations by period
  const filteredEvaluations = useMemo(() => {
    if (selectedPeriod === 'all') return allEvaluations;
    return allEvaluations.filter(e => e.period_id === selectedPeriod);
  }, [allEvaluations, selectedPeriod]);

  // Split CC vs Examen Blanc
  const ccEvaluations = useMemo(() =>
    filteredEvaluations.filter(e => e.evaluation_type === 'controle_continu' || e.evaluation_type === 'projet' || e.evaluation_type === 'tp'),
    [filteredEvaluations]
  );

  const examEvaluations = useMemo(() =>
    filteredEvaluations.filter(e => e.evaluation_type === 'examen_blanc' || e.evaluation_type === 'examen_final'),
    [filteredEvaluations]
  );

  // Group CC evaluations by module
  const ccByModule = useMemo(() => {
    const map = new Map<string, Evaluation[]>();
    for (const mod of modules) {
      map.set(mod.id, ccEvaluations.filter(e => e.module_id === mod.id));
    }
    return map;
  }, [modules, ccEvaluations]);

  // Group Exam evaluations by module
  const examByModule = useMemo(() => {
    const map = new Map<string, Evaluation[]>();
    for (const mod of modules) {
      map.set(mod.id, examEvaluations.filter(e => e.module_id === mod.id));
    }
    return map;
  }, [modules, examEvaluations]);

  // Max CC controls across modules
  const maxCCControls = useMemo(() => {
    let max = 0;
    ccByModule.forEach(evals => { if (evals.length > max) max = evals.length; });
    return Math.max(max, 2); // min 2 columns
  }, [ccByModule]);

  // Fetch all grades
  const { data: allGradesData = [] } = useQuery({
    queryKey: ['all-grades-sheet', filteredEvaluations.map(e => e.id).join(',')],
    queryFn: async () => {
      const results: { evalId: string; grades: Grade[] }[] = [];
      for (const ev of filteredEvaluations) {
        const grades = await getGradesByEvaluation(ev.id);
        results.push({ evalId: ev.id, grades });
      }
      return results;
    },
    enabled: filteredEvaluations.length > 0,
  });

  // Init local grades
  useEffect(() => {
    const gradeMap = new Map<string, Map<string, number | null>>();
    students.forEach((s: any) => {
      const studentGrades = new Map<string, number | null>();
      filteredEvaluations.forEach(ev => {
        const gradeData = allGradesData.find(g => g.evalId === ev.id);
        const grade = gradeData?.grades.find(g => g.student_id === s.user_id);
        studentGrades.set(ev.id, grade?.value ?? null);
      });
      gradeMap.set(s.user_id, studentGrades);
    });
    setLocalGrades(gradeMap);
    setIsDirty(false);
  }, [students, filteredEvaluations, allGradesData]);

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

  // Get CC average for a student on a module
  const getModuleCCAverage = useCallback((studentId: string, moduleId: string): number | null => {
    const evals = ccByModule.get(moduleId) || [];
    const studentGrades = localGrades.get(studentId);
    if (!studentGrades || evals.length === 0) return null;
    const values: number[] = [];
    evals.forEach(ev => {
      const v = studentGrades.get(ev.id);
      if (v !== null && v !== undefined) values.push(v);
    });
    if (values.length === 0) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
  }, [ccByModule, localGrades]);

  // Get exam score for a student on a module (single note or average)
  const getModuleExamScore = useCallback((studentId: string, moduleId: string): number | null => {
    const evals = examByModule.get(moduleId) || [];
    const studentGrades = localGrades.get(studentId);
    if (!studentGrades || evals.length === 0) return null;
    const values: number[] = [];
    evals.forEach(ev => {
      const v = studentGrades.get(ev.id);
      if (v !== null && v !== undefined) values.push(v);
    });
    if (values.length === 0) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
  }, [examByModule, localGrades]);

  // Class average for a module CC
  const getClassModuleCCAvg = useCallback((moduleId: string): number | null => {
    const avgs: number[] = [];
    students.forEach((s: any) => {
      const avg = getModuleCCAverage(s.user_id, moduleId);
      if (avg !== null) avgs.push(avg);
    });
    if (avgs.length === 0) return null;
    return Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 100) / 100;
  }, [students, getModuleCCAverage]);

  // Class average for exam
  const getClassModuleExamAvg = useCallback((moduleId: string): number | null => {
    const avgs: number[] = [];
    students.forEach((s: any) => {
      const avg = getModuleExamScore(s.user_id, moduleId);
      if (avg !== null) avgs.push(avg);
    });
    if (avgs.length === 0) return null;
    return Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 100) / 100;
  }, [students, getModuleExamScore]);

  // Save
  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const ev of filteredEvaluations) {
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
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #1a1a1a; font-size: 11px; }
        h2 { text-align: center; color: #1e40af; margin: 10px 0 5px; font-size: 14px; }
        h3 { text-align: center; font-size: 12px; margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px; }
        th, td { border: 1px solid #94a3b8; padding: 4px 6px; }
        th { background: #3b82f6; color: white; font-weight: 600; }
        .section-header { background: #dbeafe; font-weight: bold; text-align: center; color: #1e40af; }
        .ue-header { background: #e0e7ff; font-weight: 600; }
        .avg-green { color: #16a34a; font-weight: bold; }
        .avg-red { color: #dc2626; font-weight: bold; }
        .total-row { background: #bfdbfe; font-weight: bold; }
        @media print { body { padding: 10px; } }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  const currentFormation = formations.find((f: any) => f.id === selectedFormation);
  const currentPeriod = periods.find(p => p.id === selectedPeriod);

  const avgColor = (val: number | null) => {
    if (val === null) return '';
    return val >= 10 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  // Group modules by teaching unit
  const modulesByUnit = useMemo(() => {
    const grouped: { unitId: string | null; unitTitle: string; modules: typeof modules }[] = [];
    const unitsUsed = new Set<string>();

    for (const tu of teachingUnits) {
      const unitModules = modules.filter(m => m.teaching_unit_id === tu.id);
      if (unitModules.length > 0) {
        grouped.push({ unitId: tu.id, unitTitle: tu.title, modules: unitModules });
        unitsUsed.add(tu.id);
      }
    }

    const unassigned = modules.filter(m => !m.teaching_unit_id || !unitsUsed.has(m.teaching_unit_id));
    if (unassigned.length > 0) {
      grouped.push({ unitId: null, unitTitle: 'Matières', modules: unassigned });
    }

    if (grouped.length === 0 && modules.length > 0) {
      grouped.push({ unitId: null, unitTitle: 'Matières', modules });
    }

    return grouped;
  }, [modules, teachingUnits]);

  // Render a grade input cell
  const renderGradeCell = (studentId: string, ev: Evaluation, canEdit: boolean) => {
    const studentGrades = localGrades.get(studentId);
    const value = studentGrades?.get(ev.id);
    const isOpen = ev.status === 'ouvert' || ev.status === 'brouillon';

    if (canEdit && isOpen) {
      return (
        <Input
          ref={(el) => { if (el) inputRefs.current.set(`${studentId}-${ev.id}`, el); }}
          type="number"
          min={0}
          max={ev.scale || 20}
          step={0.25}
          value={value ?? ''}
          onChange={(e) => updateGrade(studentId, ev.id, e.target.value === '' ? null : parseFloat(e.target.value))}
          className="w-14 h-6 text-center text-[11px] mx-auto border-border/50 focus:border-primary p-0"
          placeholder="—"
        />
      );
    }
    return (
      <span className={`text-xs ${value != null ? 'font-medium' : 'text-muted-foreground'}`}>
        {value != null ? value : '—'}
      </span>
    );
  };

  const hasExamEvals = examEvaluations.length > 0;

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Select value={selectedFormation} onValueChange={(v) => { setSelectedFormation(v); }}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="Sélectionner une formation" />
          </SelectTrigger>
          <SelectContent>
            {formations.map((f: any) => (
              <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {periods.length > 0 && (
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les périodes</SelectItem>
              {periods.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {isDirty && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 animate-pulse">
              <AlertCircle className="h-3 w-3 mr-1" />
              Non enregistré
            </Badge>
          )}
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />
            Ajouter une évaluation
          </Button>
          <Button size="sm" variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimer
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
            <p className="text-sm text-muted-foreground mt-1">Choisissez une formation pour afficher les feuilles de notes</p>
          </CardContent>
        </Card>
      ) : modules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-14 w-14 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-foreground">Aucun module</h3>
            <p className="text-sm text-muted-foreground mt-1">Cette formation n'a pas encore de modules configurés</p>
          </CardContent>
        </Card>
      ) : (
        <div ref={printRef}>
          {/* Header info */}
          <div className="text-center mb-4 print:mb-2">
            {establishment?.logo_url && (
              <img src={establishment.logo_url} alt="" className="h-12 mx-auto mb-2" />
            )}
            <h2 className="text-base font-bold text-foreground">{establishment?.name}</h2>
            <h3 className="text-sm font-semibold text-primary">
              {currentFormation?.title} {currentFormation?.level ? `— ${currentFormation.level}` : ''}
            </h3>
            {currentPeriod && <p className="text-xs text-muted-foreground">{currentPeriod.name}</p>}
          </div>

          {/* ============ SECTION CONTRÔLE CONTINU ============ */}
          <div className="rounded-lg border border-border shadow-sm bg-card overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  {/* Section title */}
                  <tr>
                    <th colSpan={maxCCControls + 4} className="bg-blue-600 text-white text-center p-2 text-sm font-bold uppercase tracking-wider">
                      Contrôle Continu
                    </th>
                  </tr>
                  {/* Column headers */}
                  <tr className="bg-blue-100 dark:bg-blue-900/30">
                    <th className="text-left p-2 border border-border font-semibold min-w-[180px] sticky left-0 bg-blue-100 dark:bg-blue-900/30 z-10">
                      Apprenant
                    </th>
                    {Array.from({ length: maxCCControls }, (_, i) => (
                      <th key={i} className="text-center p-2 border border-border font-semibold w-16">
                        Contrôle {i + 1}
                      </th>
                    ))}
                    <th className="text-center p-2 border border-border font-semibold w-16 bg-blue-200/50 dark:bg-blue-800/30">
                      Moyenne
                    </th>
                    <th className="text-center p-2 border border-border font-semibold w-14">
                      Coef.
                    </th>
                    <th className="text-center p-2 border border-border font-semibold min-w-[120px]">
                      Appréciation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student: any) => (
                    <React.Fragment key={student.user_id}>
                      {/* Student name row spanning all module rows */}
                      <tr className="bg-muted/40 border-t-2 border-primary/20">
                        <td colSpan={maxCCControls + 4} className="p-2 font-bold text-foreground">
                          {student.last_name} {student.first_name}
                        </td>
                      </tr>
                      {/* One row per module group */}
                      {modulesByUnit.map(group => (
                        <React.Fragment key={group.unitId || 'ungrouped'}>
                          {teachingUnits.length > 0 && (
                            <tr>
                              <td colSpan={maxCCControls + 4} className="bg-indigo-50 dark:bg-indigo-900/20 p-1.5 pl-4 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider border border-border">
                                {group.unitTitle}
                              </td>
                            </tr>
                          )}
                          {group.modules.map((mod: any) => {
                            const moduleEvals = ccByModule.get(mod.id) || [];
                            const canEdit = mode === 'admin' || moduleEvals.some(ev => ev.instructor_id === userId);
                            const avg = getModuleCCAverage(student.user_id, mod.id);

                            return (
                              <tr key={mod.id} className="hover:bg-muted/20 border-b border-border/30">
                                <td className="p-1.5 pl-6 border border-border/50 text-foreground sticky left-0 bg-card z-10">
                                  {mod.title}
                                </td>
                                {Array.from({ length: maxCCControls }, (_, i) => {
                                  const ev = moduleEvals[i];
                                  return (
                                    <td key={i} className="p-1 border border-border/50 text-center">
                                      {ev ? renderGradeCell(student.user_id, ev, canEdit) : (
                                        <span className="text-muted-foreground/30">—</span>
                                      )}
                                    </td>
                                  );
                                })}
                                <td className={`p-1.5 border border-border/50 text-center font-bold bg-blue-50/50 dark:bg-blue-900/10 ${avgColor(avg)}`}>
                                  {avg !== null ? avg.toFixed(2) : '—'}
                                </td>
                                <td className="p-1.5 border border-border/50 text-center text-muted-foreground">
                                  {mod.coefficient}
                                </td>
                                <td className="p-1 border border-border/50">
                                  {/* Empty appreciation cell for now */}
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </React.Fragment>
                  ))}
                  {/* Class average row */}
                  {students.length > 0 && (
                    <tr className="bg-blue-100 dark:bg-blue-900/30 font-bold border-t-2 border-blue-400">
                      <td className="p-2 border border-border text-right uppercase text-[10px] tracking-wider sticky left-0 bg-blue-100 dark:bg-blue-900/30 z-10">
                        Moyenne de classe
                      </td>
                      {Array.from({ length: maxCCControls }, (_, i) => (
                        <td key={i} className="p-1.5 border border-border text-center">—</td>
                      ))}
                      <td className="p-1.5 border border-border text-center bg-blue-200/50 dark:bg-blue-800/30">
                        {/* Global CC average */}
                        {(() => {
                          const allAvgs: number[] = [];
                          students.forEach((s: any) => {
                            const modAvgs = modules.map((m: any) => ({
                              average: getModuleCCAverage(s.user_id, m.id),
                              coefficient: m.coefficient || 1,
                            }));
                            const valid = modAvgs.filter(x => x.average !== null);
                            if (valid.length > 0) {
                              const totalCoeff = valid.reduce((a, x) => a + x.coefficient, 0);
                              const weightedSum = valid.reduce((a, x) => a + (x.average! * x.coefficient), 0);
                              allAvgs.push(weightedSum / totalCoeff);
                            }
                          });
                          if (allAvgs.length === 0) return '—';
                          const avg = Math.round((allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length) * 100) / 100;
                          return <span className={avgColor(avg)}>{avg.toFixed(2)}</span>;
                        })()}
                      </td>
                      <td className="p-1.5 border border-border"></td>
                      <td className="p-1.5 border border-border"></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ============ SECTION EXAMEN BLANC ============ */}
          {(hasExamEvals || true) && (
            <div className="rounded-lg border border-border shadow-sm bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      <th colSpan={5} className="bg-blue-600 text-white text-center p-2 text-sm font-bold uppercase tracking-wider">
                        Examen Blanc
                      </th>
                    </tr>
                    <tr className="bg-blue-100 dark:bg-blue-900/30">
                      <th className="text-left p-2 border border-border font-semibold min-w-[180px] sticky left-0 bg-blue-100 dark:bg-blue-900/30 z-10">
                        Apprenant
                      </th>
                      <th className="text-center p-2 border border-border font-semibold w-16">Notes</th>
                      <th className="text-center p-2 border border-border font-semibold w-14">Coef.</th>
                      <th className="text-center p-2 border border-border font-semibold w-16">Points</th>
                      <th className="text-center p-2 border border-border font-semibold min-w-[150px]">Appréciation générale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student: any) => (
                      <React.Fragment key={student.user_id}>
                        <tr className="bg-muted/40 border-t-2 border-primary/20">
                          <td colSpan={5} className="p-2 font-bold text-foreground">
                            {student.last_name} {student.first_name}
                          </td>
                        </tr>
                        {modulesByUnit.map(group => (
                          <React.Fragment key={group.unitId || 'ungrouped'}>
                            {teachingUnits.length > 0 && (
                              <tr>
                                <td colSpan={5} className="bg-indigo-50 dark:bg-indigo-900/20 p-1.5 pl-4 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider border border-border">
                                  {group.unitTitle}
                                </td>
                              </tr>
                            )}
                            {group.modules.map((mod: any) => {
                              const moduleExamEvals = examByModule.get(mod.id) || [];
                              const canEdit = mode === 'admin' || moduleExamEvals.some(ev => ev.instructor_id === userId);
                              const examScore = getModuleExamScore(student.user_id, mod.id);
                              const points = examScore !== null ? Math.round(examScore * (mod.coefficient || 1) * 100) / 100 : null;

                              return (
                                <tr key={mod.id} className="hover:bg-muted/20 border-b border-border/30">
                                  <td className="p-1.5 pl-6 border border-border/50 text-foreground sticky left-0 bg-card z-10">
                                    {mod.title}
                                  </td>
                                  <td className="p-1 border border-border/50 text-center">
                                    {moduleExamEvals.length > 0 ? (
                                      moduleExamEvals.map(ev => (
                                        <div key={ev.id}>{renderGradeCell(student.user_id, ev, canEdit)}</div>
                                      ))
                                    ) : (
                                      <span className="text-muted-foreground/30">—</span>
                                    )}
                                  </td>
                                  <td className="p-1.5 border border-border/50 text-center text-muted-foreground">
                                    {mod.coefficient}
                                  </td>
                                  <td className={`p-1.5 border border-border/50 text-center font-bold ${avgColor(points)}`}>
                                    {points !== null ? points.toFixed(2) : '0,00'}
                                  </td>
                                  <td className="p-1 border border-border/50"></td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ))}
                        {/* Student total */}
                        <tr className="bg-blue-50 dark:bg-blue-900/20 font-bold">
                          <td className="p-1.5 border border-border text-right uppercase text-[10px] sticky left-0 bg-blue-50 dark:bg-blue-900/20 z-10">
                            TOTAL
                          </td>
                          <td className="p-1.5 border border-border"></td>
                          <td className="p-1.5 border border-border text-center">
                            {modules.reduce((sum: number, m: any) => sum + (m.coefficient || 1), 0)}
                          </td>
                          <td className={`p-1.5 border border-border text-center ${avgColor(
                            (() => {
                              let total = 0;
                              modules.forEach((mod: any) => {
                                const score = getModuleExamScore(student.user_id, mod.id);
                                if (score !== null) total += score * (mod.coefficient || 1);
                              });
                              return total;
                            })()
                          )}`}>
                            {(() => {
                              let total = 0;
                              modules.forEach((mod: any) => {
                                const score = getModuleExamScore(student.user_id, mod.id);
                                if (score !== null) total += score * (mod.coefficient || 1);
                              });
                              return total.toFixed(2);
                            })()}
                          </td>
                          <td className="p-1.5 border border-border text-center">
                            {(() => {
                              const totalCoeff = modules.reduce((sum: number, m: any) => sum + (m.coefficient || 1), 0);
                              const totalPoints = modules.reduce((sum: number, mod: any) => {
                                const score = getModuleExamScore(student.user_id, mod.id);
                                return sum + (score !== null ? score * (mod.coefficient || 1) : 0);
                              }, 0);
                              const threshold = totalCoeff * 10;
                              return totalPoints >= threshold ? (
                                <Badge variant="outline" className="text-green-600 border-green-300 text-[10px]">ADMIS</Badge>
                              ) : (
                                <Badge variant="outline" className="text-red-600 border-red-300 text-[10px]">NON ADMIS</Badge>
                              );
                            })()}
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{students.length} étudiant{students.length > 1 ? 's' : ''} • {modules.length} matière{modules.length > 1 ? 's' : ''} • {filteredEvaluations.length} évaluation{filteredEvaluations.length > 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateEvaluationModal
          isOpen={true}
          onClose={() => setShowCreateModal(false)}
          evaluation={null}
          formationId={selectedFormation}
          mode={mode}
        />
      )}
    </div>
  );
};

export default GradeSheetView;
