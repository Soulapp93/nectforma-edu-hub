import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Plus, Download, Printer, AlertCircle, BookOpen, GraduationCap, FileSpreadsheet } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';
import {
  getEvaluations,
  getGradesByEvaluation,
  upsertGrades,
  saveGradeHistory,
  getEvaluationPeriods,
  type Evaluation,
  type Grade,
  type EvaluationPeriod,
} from '@/services/gradesService';
import CreateEvaluationModal from './CreateEvaluationModal';

interface GradeSheetViewProps {
  mode: 'admin' | 'instructor';
}

interface StudentGradeRow {
  studentId: string;
  firstName: string;
  lastName: string;
  grades: Map<string, number | null>; // evaluationId → value
  appreciation: string;
}

const GradeSheetView: React.FC<GradeSheetViewProps> = ({ mode }) => {
  const { userId, userRole } = useCurrentUser();
  const queryClient = useQueryClient();
  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';
  const [selectedFormation, setSelectedFormation] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [localGrades, setLocalGrades] = useState<Map<string, Map<string, number | null>>>(new Map());
  const [appreciations, setAppreciations] = useState<Map<string, string>>(new Map());
  const [isDirty, setIsDirty] = useState(false);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Formations
  const { data: formations = [] } = useQuery({
    queryKey: ['formations-grade-sheet'],
    queryFn: async () => {
      if (!isAdmin) {
        const { data } = await supabase
          .from('user_formation_assignments')
          .select('formation_id, formations(id, title, status, color)')
          .eq('user_id', userId!);
        return (data || []).map((d: any) => d.formations).filter(Boolean);
      }
      const { data } = await supabase.from('formations').select('id, title, status, color').order('title');
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
        .select('id, title, coefficient, order_index')
        .eq('formation_id', selectedFormation)
        .order('order_index');
      return data || [];
    },
    enabled: !!selectedFormation,
  });

  useEffect(() => {
    if (modules.length > 0 && !selectedModule) setSelectedModule(modules[0].id);
  }, [modules]);

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

  // Évaluations du module sélectionné
  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations-sheet', selectedFormation, selectedModule, selectedPeriod],
    queryFn: async () => {
      const allEvals = await getEvaluations(selectedFormation);
      let filtered = allEvals.filter(e => e.module_id === selectedModule);
      if (selectedPeriod !== 'all') {
        filtered = filtered.filter(e => e.period_id === selectedPeriod);
      }
      return filtered.sort((a, b) => {
        if (a.evaluation_date && b.evaluation_date) return a.evaluation_date.localeCompare(b.evaluation_date);
        return 0;
      });
    },
    enabled: !!selectedFormation && !!selectedModule,
  });

  // Fetch all grades for all evaluations of this module
  const { data: allGradesData = [] } = useQuery({
    queryKey: ['all-grades-sheet', evaluations.map(e => e.id).join(',')],
    queryFn: async () => {
      const results: { evalId: string; grades: Grade[] }[] = [];
      for (const ev of evaluations) {
        const grades = await getGradesByEvaluation(ev.id);
        results.push({ evalId: ev.id, grades });
      }
      return results;
    },
    enabled: evaluations.length > 0,
  });

  // Init local grades
  useEffect(() => {
    const gradeMap = new Map<string, Map<string, number | null>>();
    students.forEach((s: any) => {
      const studentGrades = new Map<string, number | null>();
      evaluations.forEach(ev => {
        const gradeData = allGradesData.find(g => g.evalId === ev.id);
        const grade = gradeData?.grades.find(g => g.student_id === s.user_id);
        studentGrades.set(ev.id, grade?.value ?? null);
      });
      gradeMap.set(s.user_id, studentGrades);
    });
    setLocalGrades(gradeMap);
    setIsDirty(false);
  }, [students, evaluations, allGradesData]);

  // Formateur du module (get from evaluations or module instructor)
  const { data: moduleInstructor } = useQuery({
    queryKey: ['module-instructor', selectedModule],
    queryFn: async () => {
      // Get instructor from the first evaluation of this module
      const firstEval = evaluations[0];
      if (!firstEval) return null;
      const { data } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', firstEval.instructor_id)
        .single();
      return data;
    },
    enabled: evaluations.length > 0,
  });

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

  const updateAppreciation = useCallback((studentId: string, value: string) => {
    setAppreciations(prev => {
      const newMap = new Map(prev);
      newMap.set(studentId, value);
      return newMap;
    });
    setIsDirty(true);
  }, []);

  // Calculate student average
  const getStudentAverage = useCallback((studentId: string): number | null => {
    const studentGrades = localGrades.get(studentId);
    if (!studentGrades) return null;
    const values: number[] = [];
    studentGrades.forEach((value) => {
      if (value !== null && value !== undefined) values.push(value);
    });
    if (values.length === 0) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
  }, [localGrades]);

  // Calculate class average
  const getClassAverage = useCallback((): number | null => {
    const averages: number[] = [];
    students.forEach((s: any) => {
      const avg = getStudentAverage(s.user_id);
      if (avg !== null) averages.push(avg);
    });
    if (averages.length === 0) return null;
    return Math.round((averages.reduce((a, b) => a + b, 0) / averages.length) * 100) / 100;
  }, [students, getStudentAverage]);

  // Calculate column average (per evaluation)
  const getEvalAverage = useCallback((evaluationId: string): number | null => {
    const values: number[] = [];
    students.forEach((s: any) => {
      const studentGrades = localGrades.get(s.user_id);
      const value = studentGrades?.get(evaluationId);
      if (value !== null && value !== undefined) values.push(value);
    });
    if (values.length === 0) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
  }, [students, localGrades]);

  // Keyboard nav
  const handleKeyDown = useCallback((e: React.KeyboardEvent, studentId: string, evalId: string, rowIdx: number, colIdx: number) => {
    const studentIds = students.map((s: any) => s.user_id);
    const evalIds = evaluations.map(ev => ev.id);
    
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      const nextStudent = studentIds[rowIdx + 1];
      if (nextStudent) inputRefs.current.get(`${nextStudent}-${evalId}`)?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevStudent = studentIds[rowIdx - 1];
      if (prevStudent) inputRefs.current.get(`${prevStudent}-${evalId}`)?.focus();
    } else if (e.key === 'ArrowRight' && e.currentTarget === document.activeElement) {
      const nextEval = evalIds[colIdx + 1];
      if (nextEval) {
        e.preventDefault();
        inputRefs.current.get(`${studentId}-${nextEval}`)?.focus();
      }
    } else if (e.key === 'ArrowLeft' && e.currentTarget === document.activeElement) {
      const prevEval = evalIds[colIdx - 1];
      if (prevEval) {
        e.preventDefault();
        inputRefs.current.get(`${studentId}-${prevEval}`)?.focus();
      }
    } else if (e.key === 'Tab') {
      const nextEval = evalIds[colIdx + 1];
      if (nextEval) {
        e.preventDefault();
        inputRefs.current.get(`${studentId}-${nextEval}`)?.focus();
      } else {
        const nextStudent = studentIds[rowIdx + 1];
        const firstEval = evalIds[0];
        if (nextStudent && firstEval) {
          e.preventDefault();
          inputRefs.current.get(`${nextStudent}-${firstEval}`)?.focus();
        }
      }
    }
  }, [students, evaluations]);

  // Save
  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const ev of evaluations) {
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
            internal_comment: appreciations.get(s.user_id) || null,
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

  const currentFormation = formations.find((f: any) => f.id === selectedFormation);
  const currentModule = modules.find((m: any) => m.id === selectedModule);
  const currentPeriod = periods.find(p => p.id === selectedPeriod);

  const formatEvalHeader = (ev: Evaluation, index: number) => {
    if (ev.title) return ev.title;
    return `Note n°${index + 1}`;
  };

  const formatEvalDate = (ev: Evaluation) => {
    if (!ev.evaluation_date) return '';
    const d = new Date(ev.evaluation_date);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {/* Top bar: formation + period selectors */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Select value={selectedFormation} onValueChange={(v) => { setSelectedFormation(v); setSelectedModule(''); }}>
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
        <>
          {/* Module tabs */}
          <Tabs value={selectedModule} onValueChange={setSelectedModule} className="space-y-4">
            <div className="overflow-x-auto">
              <TabsList className="inline-flex h-auto gap-1 bg-muted/50 p-1">
                {modules.map((m: any) => (
                  <TabsTrigger
                    key={m.id}
                    value={m.id}
                    className="text-xs sm:text-sm px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap"
                  >
                    {m.title}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {modules.map((m: any) => (
              <TabsContent key={m.id} value={m.id} className="mt-0">
                {/* Excel-style sheet */}
                <div className="rounded-xl border border-border shadow-sm bg-card overflow-hidden">
                  {/* Sheet header */}
                  <div className="bg-primary/10 border-b border-border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-bold text-foreground">
                          {currentFormation?.title} {currentPeriod ? `— ${currentPeriod.name}` : ''}
                        </h2>
                      </div>
                      <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowCreateModal(true)}>
                        <Plus className="h-4 w-4" />
                        Ajouter une évaluation
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground font-medium">Matière : </span>
                        <span className="font-semibold text-foreground">{currentModule?.title}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-medium">Formateur : </span>
                        <span className="font-semibold text-foreground">
                          {moduleInstructor ? `${moduleInstructor.first_name} ${moduleInstructor.last_name}` : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Grade table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      {/* Header rows */}
                      <thead>
                        {/* Row 1: "Contrôle Continu" header spanning evaluations */}
                        <tr className="bg-muted/60">
                          <th className="sticky left-0 bg-muted/60 z-10 text-left p-2 border-b border-r border-border font-semibold text-foreground w-8">
                            #
                          </th>
                          <th className="sticky left-8 bg-muted/60 z-10 text-left p-2 border-b border-r border-border font-semibold text-foreground min-w-[180px]">
                            Apprenant
                          </th>
                          {(() => {
                            const ccEvals = evaluations.filter(e => e.evaluation_type !== 'examen_blanc');
                            const ebEvals = evaluations.filter(e => e.evaluation_type === 'examen_blanc');
                            if (evaluations.length === 0) {
                              return (
                                <th className="text-center p-2 border-b border-r border-border text-muted-foreground italic">
                                  Aucune évaluation
                                </th>
                              );
                            }
                            return (
                              <>
                                {ccEvals.length > 0 && (
                                  <th
                                    colSpan={ccEvals.length}
                                    className="text-center p-2 border-b border-r border-border font-semibold text-foreground bg-blue-50 dark:bg-blue-950/30"
                                  >
                                    Contrôle Continu
                                  </th>
                                )}
                                {ebEvals.length > 0 && (
                                  <th
                                    colSpan={ebEvals.length}
                                    className="text-center p-2 border-b border-r border-border font-semibold text-foreground bg-amber-50 dark:bg-amber-950/30"
                                  >
                                    Examen Blanc
                                  </th>
                                )}
                              </>
                            );
                          })()}
                          <th className="text-center p-2 border-b border-r border-border font-semibold text-foreground w-20">
                            Moyenne
                          </th>
                          <th className="text-center p-2 border-b border-border font-semibold text-foreground min-w-[200px]">
                            Appréciations
                          </th>
                        </tr>
                        {/* Row 2: Evaluation names / dates */}
                        <tr className="bg-muted/40">
                          <th className="sticky left-0 bg-muted/40 z-10 p-2 border-b border-r border-border"></th>
                          <th className="sticky left-8 bg-muted/40 z-10 p-2 border-b border-r border-border"></th>
                          {evaluations.map((ev, i) => (
                            <th key={ev.id} className="text-center p-2 border-b border-r border-border min-w-[90px]">
                              <div className="text-xs font-semibold text-foreground">{formatEvalHeader(ev, i)}</div>
                              {ev.evaluation_date && (
                                <div className="text-[10px] text-muted-foreground mt-0.5">{formatEvalDate(ev)}</div>
                              )}
                              <div className="text-[10px] text-muted-foreground">/{ev.scale || 20}</div>
                            </th>
                          ))}
                          {evaluations.length === 0 && <th className="border-b border-r border-border"></th>}
                          <th className="p-2 border-b border-r border-border text-center text-xs text-muted-foreground">/20</th>
                          <th className="p-2 border-b border-border text-center text-xs text-muted-foreground">(travail et comportement)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student: any, rowIdx: number) => {
                          const avg = getStudentAverage(student.user_id);
                          return (
                            <tr
                              key={student.user_id}
                              className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                            >
                              {/* # */}
                              <td className="sticky left-0 bg-card z-10 p-2 border-r border-border text-center text-muted-foreground font-medium text-xs">
                                {rowIdx + 1}
                              </td>
                              {/* Name */}
                              <td className="sticky left-8 bg-card z-10 p-2 border-r border-border font-medium text-foreground whitespace-nowrap">
                                {student.last_name} {student.first_name}
                              </td>
                              {/* Grade cells */}
                              {evaluations.map((ev, colIdx) => {
                                const studentGrades = localGrades.get(student.user_id);
                                const value = studentGrades?.get(ev.id);
                                const canEdit = mode === 'admin' || ev.instructor_id === userId;
                                const isOpen = ev.status === 'ouvert' || ev.status === 'brouillon';
                                return (
                                  <td key={ev.id} className="p-1 border-r border-border text-center">
                                    {canEdit && isOpen ? (
                                      <Input
                                        ref={(el) => { if (el) inputRefs.current.set(`${student.user_id}-${ev.id}`, el); }}
                                        type="number"
                                        min={0}
                                        max={ev.scale || 20}
                                        step={0.25}
                                        value={value ?? ''}
                                        onChange={(e) => updateGrade(
                                          student.user_id,
                                          ev.id,
                                          e.target.value === '' ? null : parseFloat(e.target.value)
                                        )}
                                        onKeyDown={(e) => handleKeyDown(e, student.user_id, ev.id, rowIdx, colIdx)}
                                        className="w-16 h-7 text-center text-xs mx-auto border-border/50 focus:border-primary"
                                        placeholder="—"
                                      />
                                    ) : (
                                      <span className={`text-sm ${value !== null && value !== undefined ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                        {value !== null && value !== undefined ? value : '—'}
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                              {evaluations.length === 0 && (
                                <td className="p-2 border-r border-border text-center text-muted-foreground">—</td>
                              )}
                              {/* Average */}
                              <td className="p-2 border-r border-border text-center">
                                <span className={`font-bold text-sm ${
                                  avg === null ? 'text-muted-foreground' :
                                  avg >= 10 ? 'text-green-600 dark:text-green-400' :
                                  'text-red-600 dark:text-red-400'
                                }`}>
                                  {avg !== null ? avg.toFixed(2) : '—'}
                                </span>
                              </td>
                              {/* Appreciation */}
                              <td className="p-1 border-border">
                                <Input
                                  value={appreciations.get(student.user_id) || ''}
                                  onChange={(e) => updateAppreciation(student.user_id, e.target.value)}
                                  className="h-7 text-xs border-border/50"
                                  placeholder="Appréciation..."
                                />
                              </td>
                            </tr>
                          );
                        })}
                        {students.length === 0 && (
                          <tr>
                            <td colSpan={evaluations.length + 4} className="text-center py-8 text-muted-foreground">
                              Aucun étudiant inscrit à cette formation
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {/* Footer: class averages */}
                      {students.length > 0 && (
                        <tfoot>
                          <tr className="bg-muted/50 font-semibold border-t-2 border-border">
                            <td className="sticky left-0 bg-muted/50 z-10 p-2 border-r border-border"></td>
                            <td className="sticky left-8 bg-muted/50 z-10 p-2 border-r border-border text-right text-xs text-muted-foreground uppercase tracking-wide">
                              Moyenne de classe
                            </td>
                            {evaluations.map(ev => {
                              const evalAvg = getEvalAverage(ev.id);
                              return (
                                <td key={ev.id} className="p-2 border-r border-border text-center">
                                  <span className={`text-sm font-bold ${
                                    evalAvg === null ? 'text-muted-foreground' :
                                    evalAvg >= 10 ? 'text-green-600 dark:text-green-400' :
                                    'text-red-600 dark:text-red-400'
                                  }`}>
                                    {evalAvg !== null ? evalAvg.toFixed(2) : '—'}
                                  </span>
                                </td>
                              );
                            })}
                            {evaluations.length === 0 && (
                              <td className="p-2 border-r border-border text-center">—</td>
                            )}
                            <td className="p-2 border-r border-border text-center">
                              <span className={`text-sm font-bold ${
                                getClassAverage() === null ? 'text-muted-foreground' :
                                (getClassAverage() ?? 0) >= 10 ? 'text-green-600 dark:text-green-400' :
                                'text-red-600 dark:text-red-400'
                              }`}>
                                {getClassAverage() !== null ? getClassAverage()!.toFixed(2) : '—'}
                              </span>
                            </td>
                            <td className="p-2 border-border"></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>

                  {/* Footer info */}
                  <div className="bg-muted/30 border-t border-border px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{students.length} étudiant{students.length > 1 ? 's' : ''} • {evaluations.length} évaluation{evaluations.length > 1 ? 's' : ''}</span>
                    <span>Coef. module : {currentModule?.coefficient || 1}</span>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}

      {/* Create evaluation modal */}
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
