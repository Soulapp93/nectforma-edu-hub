import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEstablishment } from '@/hooks/useEstablishment';
import { toast } from 'sonner';
import {
  getEvaluations,
  getGradesByEvaluation,
  getGradingRules,
  getEvaluationPeriods,
  togglePeriodLock,
  calculateWeightedAverage,
  getMention,
  getDecision,
  EVALUATION_TYPES,
  MENTIONS,
} from '@/services/gradesService';
import { Users, Award, CheckCircle, XCircle, AlertTriangle, Star, FileText, Lock, Unlock, Loader2, ShieldCheck, PenLine } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import PeriodSelector from './PeriodSelector';

interface Props {
  formationId: string;
  periodId?: string | null;
}

const JURY_DECISIONS = [
  { value: 'admis', label: 'Admis', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
  { value: 'rattrapage', label: 'Rattrapage', icon: AlertTriangle, color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
  { value: 'ajourne', label: 'Ajourne', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
  { value: 'felicitations', label: 'Felicitations', icon: Star, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' },
];

const JuryDeliberation: React.FC<Props> = ({ formationId, periodId }) => {
  const { userId } = useCurrentUser();
  const { establishment } = useEstablishment();
  const queryClient = useQueryClient();
  const [juryDecisions, setJuryDecisions] = useState<Record<string, string>>({});
  const [localPeriodId, setLocalPeriodId] = useState<string | null>(periodId || null);
  const [showConfirmValidate, setShowConfirmValidate] = useState(false);
  const [validating, setValidating] = useState(false);

  useEffect(() => { if (periodId) setLocalPeriodId(periodId); }, [periodId]);

  const { data: periods = [] } = useQuery({
    queryKey: ['periods-jury', formationId],
    queryFn: () => getEvaluationPeriods(formationId),
    enabled: !!formationId,
  });

  useEffect(() => {
    if (periods.length > 0 && !localPeriodId) setLocalPeriodId(periods[0].id);
  }, [periods]);

  const selectedPeriod = periods.find((p: any) => p.id === localPeriodId);
  const isPVValidated = selectedPeriod?.is_locked === true;

  const { data: formation } = useQuery({
    queryKey: ['formation-jury', formationId],
    queryFn: async () => {
      const { data } = await supabase.from('formations').select('id, title, academic_year, semesters_count, duration_years').eq('id', formationId).single();
      return data;
    },
    enabled: !!formationId,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['modules-jury', formationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('formation_modules')
        .select('id, title, coefficient, semester')
        .eq('formation_id', formationId)
        .order('order_index');
      return data || [];
    },
    enabled: !!formationId,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students-jury', formationId],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_formation_students', { formation_id_param: formationId });
      return (data || []).sort((a: any, b: any) => (a.last_name || '').localeCompare(b.last_name || ''));
    },
    enabled: !!formationId,
  });

  const { data: allEvaluations = [] } = useQuery({
    queryKey: ['evaluations-jury', formationId],
    queryFn: () => getEvaluations(formationId),
    enabled: !!formationId,
  });

  const { data: allGradesData = [] } = useQuery({
    queryKey: ['grades-jury', allEvaluations.map(e => e.id).join(',')],
    queryFn: async () => {
      const results: { evalId: string; grades: any[] }[] = [];
      for (const ev of allEvaluations) {
        const grades = await getGradesByEvaluation(ev.id);
        results.push({ evalId: ev.id, grades });
      }
      return results;
    },
    enabled: allEvaluations.length > 0,
  });

  const { data: gradingRules } = useQuery({
    queryKey: ['grading-rules-jury', formationId],
    queryFn: () => getGradingRules(formationId),
    enabled: !!formationId,
  });

  // Existing transcripts for this formation
  const { data: existingTranscripts = [] } = useQuery({
    queryKey: ['transcripts-jury', formationId],
    queryFn: async () => {
      const { data } = await supabase.from('transcripts').select('id, student_id, decision, mention, general_average, is_published').eq('formation_id', formationId);
      return data || [];
    },
    enabled: !!formationId,
  });

  const ccTypes = EVALUATION_TYPES.filter(t => t.category === 'cc').map(t => t.value);

  const studentResults = useMemo(() => {
    return students.map((student: any) => {
      const modAvgs = modules.map((mod: any) => {
        const modEvals = allEvaluations.filter(e => e.module_id === mod.id && ccTypes.includes(e.evaluation_type));
        const grades = modEvals.map(ev => {
          const gradeData = allGradesData.find(g => g.evalId === ev.id);
          return gradeData?.grades.find((g: any) => g.student_id === student.user_id);
        }).filter(Boolean);

        const validGrades = grades.filter((g: any) => g.value !== null && !g.is_absent && !g.is_dispensed);
        if (validGrades.length === 0) return { average: null, coefficient: mod.coefficient || 1 };
        const sum = validGrades.reduce((acc: number, g: any) => acc + (g.is_cheating ? 0 : g.value), 0);
        return { average: Math.round((sum / validGrades.length) * 100) / 100, coefficient: mod.coefficient || 1 };
      });

      const generalAvg = calculateWeightedAverage(modAvgs);
      const defaultRules = {
        validation_threshold: 10, allow_compensation: true, compensation_threshold: 8,
        mention_passable_threshold: 10, mention_ab_threshold: 12,
        mention_bien_threshold: 14, mention_tb_threshold: 16,
      };
      const rules = gradingRules || defaultRules;
      const mention = generalAvg !== null ? getMention(generalAvg, rules as any) : null;
      const autoDecision = generalAvg !== null ? getDecision(generalAvg, rules as any) : 'en_cours';

      // If PV is validated, load existing transcript decision
      const existingT = existingTranscripts.find((t: any) => t.student_id === student.user_id);

      return { ...student, generalAvg, mention, autoDecision, existingTranscript: existingT };
    });
  }, [students, modules, allEvaluations, allGradesData, gradingRules, existingTranscripts]);

  // Init jury decisions from existing transcripts if PV validated
  useEffect(() => {
    if (isPVValidated && existingTranscripts.length > 0) {
      const decisions: Record<string, string> = {};
      existingTranscripts.forEach((t: any) => {
        if (t.decision) decisions[t.student_id] = t.decision;
      });
      setJuryDecisions(decisions);
    }
  }, [isPVValidated, existingTranscripts]);

  const rankedStudents = useMemo(() => {
    const sorted = [...studentResults].filter(s => s.generalAvg !== null).sort((a, b) => (b.generalAvg || 0) - (a.generalAvg || 0));
    return studentResults.map(s => ({
      ...s,
      rank: s.generalAvg !== null ? sorted.findIndex(x => x.user_id === s.user_id) + 1 : null,
      totalRanked: sorted.length,
    }));
  }, [studentResults]);

  const stats = useMemo(() => {
    const decisions = rankedStudents.map(s => juryDecisions[s.user_id] || s.autoDecision);
    return {
      admis: decisions.filter(d => d === 'admis').length,
      rattrapage: decisions.filter(d => d === 'rattrapage').length,
      ajourne: decisions.filter(d => d === 'ajourne').length,
      felicitations: decisions.filter(d => d === 'felicitations').length,
    };
  }, [rankedStudents, juryDecisions]);

  // VALIDATE PV: lock period + upsert transcripts with decisions
  const handleValidatePV = async () => {
    if (!localPeriodId || !formationId) return;
    setValidating(true);
    try {
      // 1. Upsert transcripts for each student
      for (const student of rankedStudents) {
        const decision = juryDecisions[student.user_id] || student.autoDecision;
        const mention = student.mention;
        const existing = existingTranscripts.find((t: any) => t.student_id === student.user_id);

        if (existing) {
          await supabase.from('transcripts').update({
            decision, mention, general_average: student.generalAvg,
            jury_date: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString(),
          } as any).eq('id', existing.id);
        } else {
          await supabase.from('transcripts').insert({
            student_id: student.user_id,
            formation_id: formationId,
            period_id: localPeriodId,
            decision, mention,
            general_average: student.generalAvg,
            jury_date: new Date().toISOString().split('T')[0],
            is_published: false,
          } as any);
        }
      }

      // 2. Lock the period
      await togglePeriodLock(localPeriodId, true);

      queryClient.invalidateQueries({ queryKey: ['periods-jury'] });
      queryClient.invalidateQueries({ queryKey: ['transcripts-jury'] });
      queryClient.invalidateQueries({ queryKey: ['evaluation-periods'] });
      queryClient.invalidateQueries({ queryKey: ['periods-sheet'] });
      toast.success('PV et resultats valides avec succes');
      setShowConfirmValidate(false);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la validation');
    } finally {
      setValidating(false);
    }
  };

  // UNLOCK PV: unlock period to allow modifications
  const handleUnlockPV = async () => {
    if (!localPeriodId) return;
    try {
      await togglePeriodLock(localPeriodId, false);
      queryClient.invalidateQueries({ queryKey: ['periods-jury'] });
      queryClient.invalidateQueries({ queryKey: ['evaluation-periods'] });
      queryClient.invalidateQueries({ queryKey: ['periods-sheet'] });
      toast.success('PV et resultats deverrouilles — vous pouvez modifier les notes');
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    }
  };

  const mentionLabel = (m: string | null) => MENTIONS.find(x => x.value === m)?.label || '';

  if (students.length === 0) {
    return <EmptyState icon={Users} title="Aucun etudiant" description="Aucun etudiant inscrit" />;
  }

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <PeriodSelector periods={periods} selectedPeriodId={localPeriodId} onSelectPeriod={setLocalPeriodId} label="Periode :" />

      {/* Session info banner */}
      <div className={`rounded-xl p-4 flex items-center justify-between ${isPVValidated ? 'bg-emerald-600 text-white' : 'bg-primary text-primary-foreground'}`}>
        <div className="flex items-center gap-3">
          {isPVValidated ? <ShieldCheck className="h-6 w-6" /> : <Award className="h-6 w-6" />}
          <div>
            <h3 className="font-bold text-sm flex items-center gap-2">
              Session du Jury — {formation?.academic_year || ''} {selectedPeriod ? `\u2022 ${selectedPeriod.name}` : ''}
              {isPVValidated && <Badge className="bg-white/20 text-white text-[10px]">PV et resultats valides</Badge>}
            </h3>
            <p className="text-xs opacity-80">
              {isPVValidated && selectedPeriod?.locked_at
                ? `Valide le ${format(new Date(selectedPeriod.locked_at), "d MMMM yyyy 'a' HH:mm", { locale: fr })}`
                : format(new Date(), "d MMMM yyyy", { locale: fr })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPVValidated ? (
            <Button variant="secondary" size="sm" onClick={handleUnlockPV} className="gap-2" data-testid="unlock-pv-btn">
              <PenLine className="h-4 w-4" />
              Modifier le PV et resultats
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setShowConfirmValidate(true)} className="gap-2" data-testid="validate-pv-btn">
              <ShieldCheck className="h-4 w-4" />
              Valider le PV et les resultats
            </Button>
          )}
        </div>
      </div>

      {/* Locked info banner */}
      {isPVValidated && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 flex items-center gap-2">
          <Lock className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            Le PV et les resultats sont valides. La saisie des notes est verrouillee. Cliquez "Modifier le PV et resultats" pour deverrouiller.
          </p>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {JURY_DECISIONS.map(d => {
          const Icon = d.icon;
          const count = stats[d.value as keyof typeof stats] || 0;
          return (
            <Card key={d.value} className={`border ${d.bgColor}`}>
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${d.color}`}>{count}</p>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <Icon className={`h-4 w-4 ${d.color}`} />
                  <span className={`text-xs font-medium ${d.color}`}>{d.label}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Students table */}
      <div className="rounded-lg border border-border shadow-sm bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-primary/10">
                <th className="text-left p-3 border-b border-border font-semibold">Etudiant</th>
                <th className="text-center p-3 border-b border-border font-semibold">Moy. Gen.</th>
                <th className="text-center p-3 border-b border-border font-semibold">Mention</th>
                <th className="text-center p-3 border-b border-border font-semibold">Rang</th>
                <th className="text-center p-3 border-b border-border font-semibold min-w-[160px]">Decision du Jury</th>
              </tr>
            </thead>
            <tbody>
              {rankedStudents.map((student, idx) => {
                const currentDecision = juryDecisions[student.user_id] || student.autoDecision;
                const decisionInfo = JURY_DECISIONS.find(d => d.value === currentDecision) || JURY_DECISIONS[0];
                return (
                  <tr key={student.user_id} className={`hover:bg-muted/20 ${idx % 2 === 0 ? '' : 'bg-muted/10'}`} data-testid={`jury-row-${student.user_id}`}>
                    <td className="p-3 border-b border-border/50 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {(student.first_name?.[0] || '').toUpperCase()}{(student.last_name?.[0] || '').toUpperCase()}
                        </div>
                        <div>{student.last_name} {student.first_name}</div>
                      </div>
                    </td>
                    <td className={`p-3 border-b border-border/50 text-center font-bold ${student.generalAvg !== null ? (student.generalAvg >= 10 ? 'text-green-600' : 'text-red-600') : ''}`}>
                      {student.generalAvg !== null ? `${student.generalAvg.toFixed(2)}/20` : '\u2014'}
                    </td>
                    <td className="p-3 border-b border-border/50 text-center">
                      {student.mention && <Badge variant="outline" className="text-xs">{mentionLabel(student.mention)}</Badge>}
                    </td>
                    <td className="p-3 border-b border-border/50 text-center font-bold">
                      {student.rank !== null ? (
                        <span className="flex items-center justify-center gap-1">
                          {student.rank === 1 && <Award className="h-4 w-4 text-amber-500" />}
                          {student.rank}<sup className="text-[8px]">{student.rank === 1 ? 'er' : 'eme'}</sup>
                        </span>
                      ) : '\u2014'}
                    </td>
                    <td className="p-3 border-b border-border/50 text-center">
                      {isPVValidated ? (
                        <Badge className={`${decisionInfo.bgColor} ${decisionInfo.color} gap-1`}>
                          <decisionInfo.icon className="h-3 w-3" />{decisionInfo.label}
                        </Badge>
                      ) : (
                        <Select value={currentDecision} onValueChange={(v) => setJuryDecisions(prev => ({ ...prev, [student.user_id]: v }))}>
                          <SelectTrigger className={`w-[150px] mx-auto text-xs h-8 ${decisionInfo.bgColor}`} data-testid={`decision-select-${student.user_id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {JURY_DECISIONS.map(d => {
                              const Icon = d.icon;
                              return (
                                <SelectItem key={d.value} value={d.value}>
                                  <span className={`flex items-center gap-1.5 ${d.color}`}><Icon className="h-3.5 w-3.5" />{d.label}</span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Validate Dialog */}
      <Dialog open={showConfirmValidate} onOpenChange={setShowConfirmValidate}>
        <DialogContent className="sm:max-w-md" data-testid="confirm-validate-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Valider le PV et les resultats</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Cette action va :
            </p>
            <ul className="text-sm space-y-1.5 ml-4">
              <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />Enregistrer les decisions du jury pour {rankedStudents.length} etudiant(s)</li>
              <li className="flex items-center gap-2"><Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />Verrouiller la saisie des notes pour cette periode</li>
              <li className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />Generer les releves de notes</li>
            </ul>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-xs text-amber-700">
              Vous pourrez toujours modifier le PV et les resultats ulterieurement en cliquant "Modifier le PV et resultats".
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmValidate(false)}>Annuler</Button>
            <Button onClick={handleValidatePV} disabled={validating} className="gap-1.5" data-testid="confirm-validate-btn">
              {validating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JuryDeliberation;
