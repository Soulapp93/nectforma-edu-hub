import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Save, Plus, AlertCircle, BookOpen, GraduationCap, Printer, Copy } from 'lucide-react';
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
  duplicatePeriodWithEvaluations,
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
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [examType, setExamType] = useState<'examen_blanc' | 'examen_final'>('examen_blanc');
  const [showExamSection, setShowExamSection] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [localGrades, setLocalGrades] = useState<Map<string, Map<string, number | null>>>(new Map());
  const [isDirty, setIsDirty] = useState(false);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const printRef = useRef<HTMLDivElement>(null);

  // Formation data
  const { data: currentFormationData } = useQuery({
    queryKey: ['formation-data-sheet', selectedFormation],
    queryFn: async () => {
      const { data } = await supabase.from('formations').select('id, title, status, color, level, start_date, end_date').eq('id', selectedFormation).single();
      return data;
    },
    enabled: !!selectedFormation,
  });

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

  // Auto-select first module
  useEffect(() => {
    if (modules.length > 0 && !selectedModule) setSelectedModule(modules[0].id);
  }, [modules]);

  // Périodes
  const { data: periods = [] } = useQuery({
    queryKey: ['periods-sheet', selectedFormation],
    queryFn: () => getEvaluationPeriods(selectedFormation),
    enabled: !!selectedFormation,
  });

  // Auto-select first period
  useEffect(() => {
    if (periods.length > 0 && !selectedPeriod) setSelectedPeriod(periods[0].id);
  }, [periods]);

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
    queryFn: async () => getEvaluations(selectedFormation),
    enabled: !!selectedFormation,
  });

  // Auto-detect if exam evaluations exist for this formation
  useEffect(() => {
    const hasExams = allEvaluations.some(e => e.evaluation_type === 'examen_blanc' || e.evaluation_type === 'examen_final');
    if (hasExams) setShowExamSection(true);
  }, [allEvaluations]);

  // Filter evaluations by period + module
  const moduleEvaluations = useMemo(() => {
    let evals = allEvaluations;
    if (selectedPeriod) evals = evals.filter(e => e.period_id === selectedPeriod);
    if (selectedModule) evals = evals.filter(e => e.module_id === selectedModule);
    return evals;
  }, [allEvaluations, selectedPeriod, selectedModule]);

  // CC evaluations for current module
  const ccEvaluations = useMemo(() =>
    moduleEvaluations.filter(e => e.evaluation_type === 'controle_continu' || e.evaluation_type === 'projet' || e.evaluation_type === 'tp'),
    [moduleEvaluations]
  );

  // Exam evaluations for current module filtered by examType
  const examEvaluations = useMemo(() =>
    moduleEvaluations.filter(e => e.evaluation_type === examType),
    [moduleEvaluations, examType]
  );

  // All evaluations displayed (for grade fetching)
  const displayedEvaluations = useMemo(() => [...ccEvaluations, ...(showExamSection ? examEvaluations : [])], [ccEvaluations, examEvaluations, showExamSection]);

  // Max CC columns (at least 2)
  const maxCCControls = useMemo(() => Math.max(ccEvaluations.length, 2), [ccEvaluations]);

  // Fetch all grades for displayed evaluations
  const { data: allGradesData = [] } = useQuery({
    queryKey: ['all-grades-sheet', displayedEvaluations.map(e => e.id).join(',')],
    queryFn: async () => {
      const results: { evalId: string; grades: Grade[] }[] = [];
      for (const ev of displayedEvaluations) {
        const grades = await getGradesByEvaluation(ev.id);
        results.push({ evalId: ev.id, grades });
      }
      return results;
    },
    enabled: displayedEvaluations.length > 0,
  });

  // Init local grades
  useEffect(() => {
    const gradeMap = new Map<string, Map<string, number | null>>();
    students.forEach((s: any) => {
      const studentGrades = new Map<string, number | null>();
      displayedEvaluations.forEach(ev => {
        const gradeData = allGradesData.find(g => g.evalId === ev.id);
        const grade = gradeData?.grades.find(g => g.student_id === s.user_id);
        studentGrades.set(ev.id, grade?.value ?? null);
      });
      gradeMap.set(s.user_id, studentGrades);
    });
    setLocalGrades(gradeMap);
    setIsDirty(false);
  }, [students, displayedEvaluations, allGradesData]);

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

  // CC average for a student
  const getCCAverage = useCallback((studentId: string): number | null => {
    const studentGrades = localGrades.get(studentId);
    if (!studentGrades || ccEvaluations.length === 0) return null;
    const values: number[] = [];
    ccEvaluations.forEach(ev => {
      const v = studentGrades.get(ev.id);
      if (v !== null && v !== undefined) values.push(v);
    });
    if (values.length === 0) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
  }, [ccEvaluations, localGrades]);

  // Exam score for a student
  const getExamScore = useCallback((studentId: string): number | null => {
    const studentGrades = localGrades.get(studentId);
    if (!studentGrades || examEvaluations.length === 0) return null;
    const values: number[] = [];
    examEvaluations.forEach(ev => {
      const v = studentGrades.get(ev.id);
      if (v !== null && v !== undefined) values.push(v);
    });
    if (values.length === 0) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
  }, [examEvaluations, localGrades]);

  // Class averages
  const classCCAvg = useMemo(() => {
    const avgs = students.map((s: any) => getCCAverage(s.user_id)).filter((v): v is number => v !== null);
    if (avgs.length === 0) return null;
    return Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 100) / 100;
  }, [students, getCCAverage]);

  const classExamAvg = useMemo(() => {
    const avgs = students.map((s: any) => getExamScore(s.user_id)).filter((v): v is number => v !== null);
    if (avgs.length === 0) return null;
    return Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 100) / 100;
  }, [students, getExamScore]);

  // Save
  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const ev of displayedEvaluations) {
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

  // Duplicate period
  const duplicateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPeriod || !selectedFormation) throw new Error('Sélectionnez une période');
      const currentPeriod = periods.find(p => p.id === selectedPeriod);
      const newName = `${currentPeriod?.name || 'Semestre'} (copie)`;
      return duplicatePeriodWithEvaluations(selectedPeriod, newName, selectedFormation);
    },
    onSuccess: (newPeriod) => {
      queryClient.invalidateQueries({ queryKey: ['periods-sheet'] });
      queryClient.invalidateQueries({ queryKey: ['evaluations-sheet-all'] });
      setSelectedPeriod(newPeriod.id);
      toast.success('Semestre dupliqué avec succès');
    },
    onError: (e: any) => toast.error(e.message || 'Erreur lors de la duplication'),
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
        .header { text-align: center; margin-bottom: 15px; }
        .header h2 { color: #1e40af; margin: 5px 0; font-size: 16px; }
        .header h3 { font-size: 13px; margin: 3px 0; }
        .header p { font-size: 11px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px; }
        th, td { border: 1px solid #94a3b8; padding: 4px 6px; }
        .section-cc { background: #1e40af; color: white; font-weight: 700; text-align: center; font-size: 11px; }
        .section-exam { background: #059669; color: white; font-weight: 700; text-align: center; font-size: 11px; }
        .col-header { background: #e2e8f0; font-weight: 600; text-align: center; font-size: 9px; }
        .avg-green { color: #16a34a; font-weight: bold; }
        .avg-red { color: #dc2626; font-weight: bold; }
        .class-avg-row { background: #dbeafe; font-weight: bold; }
        @media print { body { padding: 10px; } }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  const currentFormation = currentFormationData;
  const currentPeriod = periods.find(p => p.id === selectedPeriod);
  const currentModule = modules.find((m: any) => m.id === selectedModule);

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

  return (
    <div className="space-y-4">
      {/* Top bar: Period + Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">

        {periods.length > 0 && (
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Sélectionner un semestre" />
            </SelectTrigger>
            <SelectContent>
              {periods.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedPeriod && (
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => duplicateMutation.mutate()}
            disabled={duplicateMutation.isPending}
          >
            <Copy className="h-4 w-4" />
            {duplicateMutation.isPending ? 'Duplication...' : 'Dupliquer ce semestre'}
          </Button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {isDirty && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 animate-pulse">
              <AlertCircle className="h-3 w-3 mr-1" />
              Non enregistré
            </Badge>
          )}
          {!showExamSection && (
            <Button size="sm" variant="outline" className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950" onClick={() => setShowExamSection(true)}>
              <Plus className="h-4 w-4" />
              Ajouter un examen
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />
            Évaluation
          </Button>
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
          {/* Module tabs navigation */}
          <Tabs value={selectedModule} onValueChange={setSelectedModule}>
            <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/30 p-1">
              {modules.map((mod: any) => (
                <TabsTrigger key={mod.id} value={mod.id} className="text-xs px-3 py-1.5">
                  {mod.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {modules.map((mod: any) => (
              <TabsContent key={mod.id} value={mod.id}>
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
                    <p className="text-xs font-medium text-foreground mt-1">Module : {mod.title} (Coef. {mod.coefficient})</p>
                  </div>

                  {/* Unified table: CC left + Exam right */}
                  <div className="rounded-lg border border-border shadow-sm bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          {/* Section headers row */}
                          <tr>
                            <th rowSpan={2} className="text-left p-2 border border-border font-semibold min-w-[180px] bg-muted/50 sticky left-0 z-10">
                              Apprenant
                            </th>
                            {/* CC section header */}
                            <th
                              colSpan={maxCCControls + 3}
                              className="bg-blue-600 text-white text-center p-2 text-sm font-bold uppercase tracking-wider border border-blue-700"
                            >
                              Contrôle Continu
                            </th>
                            {/* Exam section header with selector */}
                            {showExamSection && (
                              <th
                                colSpan={4}
                                className="bg-emerald-600 text-white text-center p-2 text-sm font-bold uppercase tracking-wider border border-emerald-700"
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <select
                                    value={examType}
                                    onChange={(e) => setExamType(e.target.value as 'examen_blanc' | 'examen_final')}
                                    className="bg-emerald-700 text-white border-none rounded px-2 py-0.5 text-xs font-bold cursor-pointer focus:outline-none"
                                  >
                                    <option value="examen_blanc">Examen Blanc</option>
                                    <option value="examen_final">Examen Final</option>
                                  </select>
                                  <button
                                    onClick={() => setShowExamSection(false)}
                                    className="ml-1 text-white/70 hover:text-white text-xs"
                                    title="Masquer la section examen"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </th>
                            )}
                          </tr>
                          {/* Column sub-headers */}
                          <tr className="bg-muted/40">
                            {/* CC columns */}
                            {Array.from({ length: maxCCControls }, (_, i) => (
                              <th key={`cc-${i}`} className="text-center p-2 border border-border font-semibold w-16 text-[10px]">
                                {ccEvaluations[i]?.title || `Ctrl ${i + 1}`}
                              </th>
                            ))}
                            <th className="text-center p-2 border border-border font-semibold w-16 bg-blue-100 dark:bg-blue-900/30 text-[10px]">
                              Moyenne
                            </th>
                            <th className="text-center p-2 border border-border font-semibold w-14 text-[10px]">
                              Coef.
                            </th>
                            <th className="text-center p-2 border border-border font-semibold min-w-[100px] text-[10px]">
                              Appréciation
                            </th>
                            {/* Exam columns */}
                            {showExamSection && (
                              <>
                                <th className="text-center p-2 border border-border font-semibold w-16 bg-emerald-100 dark:bg-emerald-900/30 text-[10px]">
                                  Notes
                                </th>
                                <th className="text-center p-2 border border-border font-semibold w-14 text-[10px]">
                                  Coef.
                                </th>
                                <th className="text-center p-2 border border-border font-semibold w-16 text-[10px]">
                                  Points
                                </th>
                                <th className="text-center p-2 border border-border font-semibold min-w-[100px] text-[10px]">
                                  Appréciation
                                </th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((student: any, idx: number) => {
                            const canEditCC = mode === 'admin' || ccEvaluations.some(ev => ev.instructor_id === userId);
                            const canEditExam = mode === 'admin' || examEvaluations.some(ev => ev.instructor_id === userId);
                            const ccAvg = getCCAverage(student.user_id);
                            const examScore = getExamScore(student.user_id);
                            const examPoints = examScore !== null ? Math.round(examScore * (mod.coefficient || 1) * 100) / 100 : null;

                            return (
                              <tr key={student.user_id} className={`hover:bg-muted/20 ${idx % 2 === 0 ? 'bg-card' : 'bg-muted/10'}`}>
                                {/* Student name */}
                                <td className="p-2 border border-border/50 font-medium text-foreground sticky left-0 bg-card z-10">
                                  {student.last_name} {student.first_name}
                                </td>
                                {/* CC grade cells */}
                                {Array.from({ length: maxCCControls }, (_, i) => {
                                  const ev = ccEvaluations[i];
                                  return (
                                    <td key={`cc-${i}`} className="p-1 border border-border/50 text-center">
                                      {ev ? renderGradeCell(student.user_id, ev, canEditCC) : (
                                        <span className="text-muted-foreground/30">—</span>
                                      )}
                                    </td>
                                  );
                                })}
                                {/* CC Average */}
                                <td className={`p-1.5 border border-border/50 text-center font-bold bg-blue-50/50 dark:bg-blue-900/10 ${avgColor(ccAvg)}`}>
                                  {ccAvg !== null ? ccAvg.toFixed(2) : '—'}
                                </td>
                                {/* CC Coefficient */}
                                <td className="p-1.5 border border-border/50 text-center text-muted-foreground">
                                  {mod.coefficient}
                                </td>
                                {/* CC Appreciation */}
                                <td className="p-1.5 border border-border/50 text-center text-[10px] text-muted-foreground">
                                  {getAppreciation(ccAvg)}
                                </td>
                                {/* Exam columns (conditional) */}
                                {showExamSection && (
                                  <>
                                    {/* Exam Notes */}
                                    <td className="p-1 border border-border/50 text-center bg-emerald-50/30 dark:bg-emerald-900/5">
                                      {examEvaluations.length > 0 ? (
                                        examEvaluations.map(ev => (
                                          <div key={ev.id}>{renderGradeCell(student.user_id, ev, canEditExam)}</div>
                                        ))
                                      ) : (
                                        <span className="text-muted-foreground/30">—</span>
                                      )}
                                    </td>
                                    {/* Exam Coefficient */}
                                    <td className="p-1.5 border border-border/50 text-center text-muted-foreground">
                                      {mod.coefficient}
                                    </td>
                                    {/* Exam Points */}
                                    <td className={`p-1.5 border border-border/50 text-center font-bold ${avgColor(examScore)}`}>
                                      {examPoints !== null ? examPoints.toFixed(2) : '—'}
                                    </td>
                                    {/* Exam Appreciation */}
                                    <td className="p-1.5 border border-border/50 text-center text-[10px] text-muted-foreground">
                                      {getAppreciation(examScore)}
                                    </td>
                                  </>
                                )}
                              </tr>
                            );
                          })}
                          {/* Class average row */}
                          {students.length > 0 && (
                            <tr className="bg-blue-100 dark:bg-blue-900/30 font-bold border-t-2 border-blue-400">
                              <td className="p-2 border border-border text-right uppercase text-[10px] tracking-wider sticky left-0 bg-blue-100 dark:bg-blue-900/30 z-10">
                                Moyenne de classe
                              </td>
                              {Array.from({ length: maxCCControls }, (_, i) => (
                                <td key={i} className="p-1.5 border border-border text-center text-muted-foreground">—</td>
                              ))}
                              <td className={`p-1.5 border border-border text-center bg-blue-200/50 dark:bg-blue-800/30 ${avgColor(classCCAvg)}`}>
                                {classCCAvg !== null ? classCCAvg.toFixed(2) : '—'}
                              </td>
                              <td className="p-1.5 border border-border"></td>
                              <td className="p-1.5 border border-border"></td>
                              <td className={`p-1.5 border border-border text-center bg-emerald-100/50 dark:bg-emerald-800/30 ${avgColor(classExamAvg)}`}>
                                {classExamAvg !== null ? classExamAvg.toFixed(2) : '—'}
                              </td>
                              <td className="p-1.5 border border-border"></td>
                              <td className="p-1.5 border border-border"></td>
                              <td className="p-1.5 border border-border"></td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {students.length} étudiant{students.length > 1 ? 's' : ''} •{' '}
                      {ccEvaluations.length} CC • {examEvaluations.length} examen{examEvaluations.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </>
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
