import React, { useState, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Eye, Printer, ChevronLeft, ChevronRight, Users } from 'lucide-react';
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
  DECISIONS,
  MENTIONS,
  type Evaluation,
  type Grade,
} from '@/services/gradesService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  const { userId } = useCurrentUser();
  const { establishment } = useEstablishment();
  const [internalFormation, setInternalFormation] = useState('');
  const selectedFormation = propFormationId || internalFormation;
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'bulletin'>('list');
  const printRef = useRef<HTMLDivElement>(null);

  // Formations (only needed when no formationId prop)
  const { data: formations = [] } = useQuery({
    queryKey: ['formations-for-transcripts'],
    queryFn: async () => {
      const { data } = await supabase.from('formations').select('id, title, level, start_date, end_date').order('title');
      return data || [];
    },
    enabled: mode === 'admin' && !propFormationId,
  });

  const { data: studentFormations = [] } = useQuery({
    queryKey: ['student-formations-transcripts', studentId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_formation_assignments')
        .select('formation_id, formations(id, title, level, start_date, end_date)')
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

  const { data: modules = [] } = useQuery({
    queryKey: ['formation-modules-transcripts', selectedFormation],
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
    queryKey: ['evaluations-transcripts', selectedFormation, selectedPeriod],
    queryFn: async () => {
      const allEvals = await getEvaluations(selectedFormation);
      if (selectedPeriod && selectedPeriod !== 'all') return allEvals.filter(e => e.period_id === selectedPeriod);
      return allEvals;
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

  // Split evaluations by type
  const ccEvaluations = useMemo(() =>
    evaluations.filter(e => e.evaluation_type !== 'examen_blanc' && e.evaluation_type !== 'examen_final'),
    [evaluations]
  );

  const examEvaluations = useMemo(() =>
    evaluations.filter(e => e.evaluation_type === 'examen_blanc' || e.evaluation_type === 'examen_final'),
    [evaluations]
  );

  // Module grouping by teaching unit
  const modulesByUnit = useMemo(() => {
    const grouped: { unitId: string | null; unitTitle: string; mods: typeof modules }[] = [];
    const unitsUsed = new Set<string>();

    for (const tu of teachingUnits) {
      const unitMods = modules.filter(m => m.teaching_unit_id === tu.id);
      if (unitMods.length > 0) {
        grouped.push({ unitId: tu.id, unitTitle: tu.title, mods: unitMods });
        unitsUsed.add(tu.id);
      }
    }

    const unassigned = modules.filter(m => !m.teaching_unit_id || !unitsUsed.has(m.teaching_unit_id));
    if (unassigned.length > 0) grouped.push({ unitId: null, unitTitle: 'Matières', mods: unassigned });
    if (grouped.length === 0 && modules.length > 0) grouped.push({ unitId: null, unitTitle: 'Matières', mods: modules });

    return grouped;
  }, [modules, teachingUnits]);

  // Build bulletins
  const bulletins: StudentBulletin[] = useMemo(() => {
    if (!students.length || !modules.length) return [];

    const defaultRules = {
      validation_threshold: 10, allow_compensation: true, compensation_threshold: 8,
      mention_passable_threshold: 10, mention_ab_threshold: 12, mention_bien_threshold: 14, mention_tb_threshold: 16,
    };
    const rules = gradingRules || defaultRules;

    // Helper: get student's CC average for a module
    const getStudentModuleCCAvg = (sId: string, modId: string): number | null => {
      const modCCEvals = ccEvaluations.filter(e => e.module_id === modId);
      const grades = modCCEvals.map(e => allGrades.get(e.id)?.find((g: any) => g.student_id === sId)).filter(Boolean);
      return calculateModuleAverage(grades, 20);
    };

    // Helper: get student's exam score for a module
    const getStudentModuleExamScore = (sId: string, modId: string): number | null => {
      const modExamEvals = examEvaluations.filter(e => e.module_id === modId);
      const grades = modExamEvals.map(e => allGrades.get(e.id)?.find((g: any) => g.student_id === sId)).filter(Boolean);
      return calculateModuleAverage(grades, 20);
    };

    return students.map(student => {
      const studentModules: ModuleBulletinData[] = modules.map(mod => {
        const ccAvg = getStudentModuleCCAvg(student.user_id, mod.id);
        const examScore = getStudentModuleExamScore(student.user_id, mod.id);

        // Class averages
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

      // CC general average (weighted)
      const ccGeneralAvg = calculateWeightedAverage(
        studentModules.map(m => ({ average: m.ccAverage, coefficient: m.coefficient }))
      );

      // CC class general average
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

      // Exam total points
      const examTotalPoints = studentModules.reduce((sum, m) => sum + (m.examPoints || 0), 0);
      const examTotalCoeff = modules.reduce((sum, m) => sum + ((m as any).coefficient || 1), 0);

      const generalAvg = ccGeneralAvg; // Use CC average for decision
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
  const selectedPeriodData = periods.find(p => p.id === selectedPeriod);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Bulletin - ${currentBulletin?.studentName}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #1a1a1a; font-size: 12px; }
        .bulletin-header { text-align: center; margin-bottom: 15px; }
        .bulletin-header h1 { font-size: 16px; color: #2563eb; margin: 5px 0; }
        .bulletin-header h2 { font-size: 13px; margin: 3px 0; }
        .student-bar { background: #bfdbfe; padding: 8px 15px; text-align: center; font-weight: bold; font-size: 14px; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
        th, td { border: 1px solid #94a3b8; padding: 5px 8px; }
        th { background: #3b82f6; color: white; font-weight: 600; }
        .section-title { background: #3b82f6; color: white; text-align: center; font-weight: bold; padding: 6px; }
        .ue-row { background: #e0e7ff; font-weight: 600; font-size: 10px; }
        .total-row { background: #bfdbfe; font-weight: bold; }
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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          <Select value={selectedFormation} onValueChange={(v) => { setSelectedFormation(v); setSelectedPeriod(''); setCurrentStudentIndex(0); setViewMode('list'); }}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Sélectionner une formation" />
            </SelectTrigger>
            <SelectContent>
              {availableFormations.map((f: any) => (
                <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {periods.length > 0 && (
            <Select value={selectedPeriod} onValueChange={(v) => { setSelectedPeriod(v); setCurrentStudentIndex(0); }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Toutes les périodes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {periods.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
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
                <div className="p-6 border-b-2 border-blue-400">
                  <div className="flex items-start justify-between">
                    <div>
                      {establishment?.logo_url && <img src={establishment.logo_url} alt="" className="h-14 mb-2" />}
                      <p className="text-xs font-semibold">{establishment?.name}</p>
                      {establishment?.address && <p className="text-[10px] text-muted-foreground">{establishment.address}</p>}
                    </div>
                    <div className="text-right">
                      <h1 className="text-lg font-bold text-blue-600">Bulletin de Formation N°...</h1>
                      <h2 className="text-sm font-bold mt-1">{selectedFormationData?.title}</h2>
                      {selectedFormationData?.level && <p className="text-xs text-muted-foreground">{selectedFormationData.level}</p>}
                      {selectedFormationData?.start_date && selectedFormationData?.end_date && (
                        <p className="text-xs text-muted-foreground">
                          SESSION {format(new Date(selectedFormationData.start_date), 'yyyy')} - {format(new Date(selectedFormationData.end_date), 'yyyy')}
                        </p>
                      )}
                      {selectedPeriodData && <p className="text-xs text-muted-foreground mt-1">... {selectedPeriodData.name}</p>}
                    </div>
                  </div>
                </div>

                {/* ===== NOM ÉTUDIANT ===== */}
                <div className="bg-blue-200 dark:bg-blue-800 py-2 px-6 text-center">
                  <p className="font-bold text-sm">{currentBulletin.studentName}</p>
                </div>

                {/* ===== SECTION CONTRÔLE CONTINU ===== */}
                <div className="px-4 pt-4">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="bg-blue-500 text-white text-left p-2 border border-blue-400 font-semibold" style={{ width: '40%' }}>
                          Contrôle continu
                        </th>
                        <th className="bg-blue-500 text-white text-center p-2 border border-blue-400 font-semibold" style={{ width: '15%' }}>
                          Moyenne du Stagiaire
                        </th>
                        <th className="bg-blue-500 text-white text-center p-2 border border-blue-400 font-semibold" style={{ width: '15%' }}>
                          Moyenne de Classe
                        </th>
                        <th className="bg-blue-500 text-white text-center p-2 border border-blue-400 font-semibold" style={{ width: '30%' }}>
                          Appréciations<br /><span className="font-normal text-[10px]">(travail et comportement)</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {modulesByUnit.map(group => (
                        <React.Fragment key={group.unitId || 'ungrouped'}>
                          {teachingUnits.length > 0 && (
                            <tr>
                              <td colSpan={4} className="bg-blue-50 dark:bg-blue-900/20 p-1.5 pl-3 text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider border border-border/50">
                                {group.unitTitle}
                              </td>
                            </tr>
                          )}
                          {group.mods.map(mod => {
                            const modData = currentBulletin.modules.find(m => m.moduleId === mod.id);
                            // Find instructor for this module
                            const moduleEval = evaluations.find(e => e.module_id === mod.id);
                            return (
                              <tr key={mod.id} className="border-b border-border/30">
                                <td className="p-2 border border-border/50">
                                  <div className="font-medium">{mod.title}</div>
                                  {moduleEval?.instructor_name && (
                                    <div className="text-[10px] text-muted-foreground italic">{moduleEval.instructor_name}</div>
                                  )}
                                </td>
                                <td className={`p-2 border border-border/50 text-center font-bold ${avgColor(modData?.ccAverage ?? null)}`}>
                                  {modData?.ccAverage !== null && modData?.ccAverage !== undefined ? modData.ccAverage.toFixed(2) : '—'}
                                </td>
                                <td className={`p-2 border border-border/50 text-center font-semibold ${avgColor(modData?.ccClassAverage ?? null)}`}>
                                  {modData?.ccClassAverage !== null && modData?.ccClassAverage !== undefined ? modData.ccClassAverage.toFixed(2) : '—'}
                                </td>
                                <td className="p-2 border border-border/50 text-center text-muted-foreground text-[10px]">
                                  {modData?.appreciation || ''}
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      ))}
                      {/* Moyenne Générale CC */}
                      <tr className="bg-blue-200 dark:bg-blue-800/50 font-bold">
                        <td className="p-2.5 border border-blue-300 text-sm uppercase tracking-wider">
                          Moyenne Générale
                        </td>
                        <td className={`p-2.5 border border-blue-300 text-center text-base ${avgColor(currentBulletin.ccGeneralAverage)}`}>
                          {currentBulletin.ccGeneralAverage !== null ? currentBulletin.ccGeneralAverage.toFixed(2) : '—'}
                        </td>
                        <td className={`p-2.5 border border-blue-300 text-center ${avgColor(currentBulletin.ccClassGeneralAverage)}`}>
                          {currentBulletin.ccClassGeneralAverage !== null ? currentBulletin.ccClassGeneralAverage.toFixed(2) : '—'}
                        </td>
                        <td className="p-2.5 border border-blue-300"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* ===== SECTION EXAMEN BLANC ===== */}
                {hasExamData && (
                  <div className="px-4 pt-4">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr>
                          <th className="bg-blue-500 text-white text-left p-2 border border-blue-400 font-semibold" style={{ width: '40%' }}>
                            Examen Blanc
                          </th>
                          <th className="bg-blue-500 text-white text-center p-2 border border-blue-400 font-semibold" style={{ width: '10%' }}>Notes</th>
                          <th className="bg-blue-500 text-white text-center p-2 border border-blue-400 font-semibold" style={{ width: '8%' }}>C</th>
                          <th className="bg-blue-500 text-white text-center p-2 border border-blue-400 font-semibold" style={{ width: '12%' }}>Points</th>
                          <th className="bg-blue-500 text-white text-center p-2 border border-blue-400 font-semibold" style={{ width: '30%' }}>Appréciation générale</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modulesByUnit.map(group => (
                          <React.Fragment key={group.unitId || 'ungrouped'}>
                            {teachingUnits.length > 0 && (
                              <tr>
                                <td colSpan={5} className="bg-blue-50 dark:bg-blue-900/20 p-1.5 pl-3 text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider border border-border/50">
                                  {group.unitTitle}
                                </td>
                              </tr>
                            )}
                            {group.mods.map(mod => {
                              const modData = currentBulletin.modules.find(m => m.moduleId === mod.id);
                              return (
                                <tr key={mod.id} className="border-b border-border/30">
                                  <td className="p-2 border border-border/50 font-medium">
                                    {mod.title}
                                  </td>
                                  <td className={`p-2 border border-border/50 text-center font-bold ${avgColor(modData?.examScore ?? null)}`}>
                                    {modData?.examScore !== null && modData?.examScore !== undefined ? modData.examScore.toFixed(2) : ''}
                                  </td>
                                  <td className="p-2 border border-border/50 text-center text-muted-foreground">
                                    {modData?.coefficient}
                                  </td>
                                  <td className={`p-2 border border-border/50 text-center font-bold ${avgColor(modData?.examPoints ?? null)}`}>
                                    {modData?.examPoints !== null && modData?.examPoints !== undefined ? modData.examPoints.toFixed(2) : '0,00'}
                                  </td>
                                  <td className="p-2 border border-border/50"></td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ))}
                        {/* TOTAL row */}
                        <tr className="bg-blue-200 dark:bg-blue-800/50 font-bold">
                          <td className="p-2.5 border border-blue-300 text-right text-xs uppercase">
                            TOTAL (Admis si &gt; ou = {currentBulletin.examTotalCoeff * 10})
                          </td>
                          <td className="p-2.5 border border-blue-300"></td>
                          <td className="p-2.5 border border-blue-300 text-center">
                            {currentBulletin.examTotalCoeff}
                          </td>
                          <td className={`p-2.5 border border-blue-300 text-center text-base ${avgColor(currentBulletin.examTotalPoints / Math.max(currentBulletin.examTotalCoeff, 1))}`}>
                            {currentBulletin.examTotalPoints.toFixed(2)}
                          </td>
                          <td className="p-2.5 border border-blue-300 text-center font-bold">
                            {currentBulletin.examTotalPoints >= currentBulletin.examTotalCoeff * 10 ? (
                              <span className="text-green-600">ADMIS</span>
                            ) : (
                              <span className="text-red-600">NON ADMIS</span>
                            )}
                          </td>
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
                <div className="px-6 pb-4 flex justify-between text-[10px] text-muted-foreground border-t border-border/50 pt-3">
                  <span>Document généré le {format(new Date(), 'dd/MM/yyyy', { locale: fr })}</span>
                  <span>{establishment?.name} {establishment?.phone ? `• Tél : ${establishment.phone}` : ''}</span>
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
