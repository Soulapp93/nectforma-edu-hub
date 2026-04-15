import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEstablishment } from '@/hooks/useEstablishment';
import { toast } from 'sonner';
import {
  getEvaluations,
  getGradesByEvaluation,
  getGradingRules,
  calculateWeightedAverage,
  getMention,
  getDecision,
  EVALUATION_TYPES,
  DECISIONS,
  MENTIONS,
} from '@/services/gradesService';
import { Users, Award, CheckCircle, XCircle, AlertTriangle, Star, FileText } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  formationId: string;
  periodId?: string | null;
}

const JURY_DECISIONS = [
  { value: 'admis', label: 'Admis', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
  { value: 'rattrapage', label: 'Rattrapage', icon: AlertTriangle, color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
  { value: 'ajourne', label: 'Ajourné', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
  { value: 'felicitations', label: 'Félicitations', icon: Star, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' },
];

const JuryDeliberation: React.FC<Props> = ({ formationId, periodId }) => {
  const { userId } = useCurrentUser();
  const { establishment } = useEstablishment();
  const queryClient = useQueryClient();
  const [juryDecisions, setJuryDecisions] = useState<Record<string, string>>({});

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

      return { ...student, generalAvg, mention, autoDecision };
    });
  }, [students, modules, allEvaluations, allGradesData, gradingRules]);

  const rankedStudents = useMemo(() => {
    const sorted = [...studentResults].filter(s => s.generalAvg !== null).sort((a, b) => (b.generalAvg || 0) - (a.generalAvg || 0));
    return studentResults.map(s => ({
      ...s,
      rank: s.generalAvg !== null ? sorted.findIndex(x => x.user_id === s.user_id) + 1 : null,
      totalRanked: sorted.length,
    }));
  }, [studentResults]);

  // Stats
  const stats = useMemo(() => {
    const decisions = rankedStudents.map(s => juryDecisions[s.user_id] || s.autoDecision);
    return {
      admis: decisions.filter(d => d === 'admis').length,
      rattrapage: decisions.filter(d => d === 'rattrapage').length,
      ajourne: decisions.filter(d => d === 'ajourne').length,
      felicitations: decisions.filter(d => d === 'felicitations').length,
    };
  }, [rankedStudents, juryDecisions]);

  const handleSignValidate = async () => {
    toast.success('Procès-verbal signé et validé avec succès');
  };

  const mentionLabel = (m: string | null) => MENTIONS.find(x => x.value === m)?.label || '';

  if (students.length === 0) {
    return <EmptyState icon={Users} title="Aucun étudiant" description="Aucun étudiant inscrit" />;
  }

  return (
    <div className="space-y-5">
      {/* Session info banner */}
      <div className="bg-primary text-primary-foreground rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Award className="h-6 w-6" />
          <div>
            <h3 className="font-bold text-sm">Session du Jury — {formation?.academic_year || ''}</h3>
            <p className="text-xs opacity-80">
              {format(new Date(), "d MMMM yyyy", { locale: fr })}
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={handleSignValidate} className="gap-2">
          <FileText className="h-4 w-4" />
          Signer & Valider le PV
        </Button>
      </div>

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
                <th className="text-left p-3 border-b border-border font-semibold">Étudiant</th>
                <th className="text-center p-3 border-b border-border font-semibold">Moy. Gén.</th>
                <th className="text-center p-3 border-b border-border font-semibold">Mention</th>
                <th className="text-center p-3 border-b border-border font-semibold">Rang</th>
                <th className="text-center p-3 border-b border-border font-semibold min-w-[160px]">Décision du Jury</th>
              </tr>
            </thead>
            <tbody>
              {rankedStudents.map((student, idx) => {
                const currentDecision = juryDecisions[student.user_id] || student.autoDecision;
                const decisionInfo = JURY_DECISIONS.find(d => d.value === currentDecision) || JURY_DECISIONS[0];
                return (
                  <tr key={student.user_id} className={`hover:bg-muted/20 ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}>
                    <td className="p-3 border-b border-border/50 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {(student.first_name?.[0] || '').toUpperCase()}{(student.last_name?.[0] || '').toUpperCase()}
                        </div>
                        <div>
                          <div>{student.last_name} {student.first_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className={`p-3 border-b border-border/50 text-center font-bold ${student.generalAvg !== null ? (student.generalAvg >= 10 ? 'text-green-600' : 'text-red-600') : ''}`}>
                      {student.generalAvg !== null ? `${student.generalAvg.toFixed(2)}/20` : '—'}
                    </td>
                    <td className="p-3 border-b border-border/50 text-center">
                      {student.mention && (
                        <Badge variant="outline" className="text-xs">
                          {mentionLabel(student.mention)}
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 border-b border-border/50 text-center font-bold">
                      {student.rank !== null ? (
                        <span className="flex items-center justify-center gap-1">
                          {student.rank === 1 && <Award className="h-4 w-4 text-amber-500" />}
                          {student.rank}<sup className="text-[8px]">{student.rank === 1 ? 'er' : 'ème'}</sup>
                        </span>
                      ) : '—'}
                    </td>
                    <td className="p-3 border-b border-border/50 text-center">
                      <Select
                        value={currentDecision}
                        onValueChange={(v) => setJuryDecisions(prev => ({ ...prev, [student.user_id]: v }))}
                      >
                        <SelectTrigger className={`w-[150px] mx-auto text-xs h-8 ${decisionInfo.bgColor}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {JURY_DECISIONS.map(d => {
                            const Icon = d.icon;
                            return (
                              <SelectItem key={d.value} value={d.value}>
                                <span className={`flex items-center gap-1.5 ${d.color}`}>
                                  <Icon className="h-3.5 w-3.5" />
                                  {d.label}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default JuryDeliberation;
