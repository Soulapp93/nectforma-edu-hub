import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  getEvaluations,
  getGradesByEvaluation,
  getGradingRules,
  calculateWeightedAverage,
  getMention,
  EVALUATION_TYPES,
  MENTIONS,
  type Evaluation,
} from '@/services/gradesService';
import { Trash2, Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface Props {
  formationId: string;
}

const CalculValidation: React.FC<Props> = ({ formationId }) => {
  const { data: formation } = useQuery({
    queryKey: ['formation-calc', formationId],
    queryFn: async () => {
      const { data } = await supabase.from('formations').select('id, title, formation_type').eq('id', formationId).single();
      return data;
    },
    enabled: !!formationId,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['modules-calc', formationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('formation_modules')
        .select('id, title, coefficient, order_index, semester')
        .eq('formation_id', formationId)
        .order('order_index');
      return data || [];
    },
    enabled: !!formationId,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students-calc', formationId],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_formation_students', { formation_id_param: formationId });
      return (data || []).sort((a: any, b: any) => (a.last_name || '').localeCompare(b.last_name || ''));
    },
    enabled: !!formationId,
  });

  const { data: allEvaluations = [] } = useQuery({
    queryKey: ['evaluations-calc', formationId],
    queryFn: () => getEvaluations(formationId),
    enabled: !!formationId,
  });

  const { data: allGradesData = [] } = useQuery({
    queryKey: ['grades-calc', allEvaluations.map(e => e.id).join(',')],
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
    queryKey: ['grading-rules-calc', formationId],
    queryFn: () => getGradingRules(formationId),
    enabled: !!formationId,
  });

  const ccTypes = EVALUATION_TYPES.filter(t => t.category === 'cc').map(t => t.value);

  // Calculate module averages per student
  const studentData = useMemo(() => {
    return students.map((student: any) => {
      const moduleAverages: Record<string, number | null> = {};
      
      modules.forEach((mod: any) => {
        const modEvals = allEvaluations.filter(e => e.module_id === mod.id && ccTypes.includes(e.evaluation_type));
        const grades = modEvals.map(ev => {
          const gradeData = allGradesData.find(g => g.evalId === ev.id);
          return gradeData?.grades.find((g: any) => g.student_id === student.user_id);
        }).filter(Boolean);

        if (grades.length === 0) {
          moduleAverages[mod.id] = null;
          return;
        }
        const validGrades = grades.filter((g: any) => g.value !== null && !g.is_absent && !g.is_dispensed);
        if (validGrades.length === 0) {
          moduleAverages[mod.id] = null;
          return;
        }
        const sum = validGrades.reduce((acc: number, g: any) => acc + (g.is_cheating ? 0 : g.value), 0);
        moduleAverages[mod.id] = Math.round((sum / validGrades.length) * 100) / 100;
      });

      const generalAvg = calculateWeightedAverage(
        modules.map((mod: any) => ({
          average: moduleAverages[mod.id],
          coefficient: mod.coefficient || 1,
        }))
      );

      const defaultRules = {
        mention_passable_threshold: 10, mention_ab_threshold: 12,
        mention_bien_threshold: 14, mention_tb_threshold: 16,
      };
      const rules = gradingRules || defaultRules;
      const mention = generalAvg !== null ? getMention(generalAvg, rules as any) : null;

      return {
        ...student,
        moduleAverages,
        generalAvg,
        mention,
      };
    });
  }, [students, modules, allEvaluations, allGradesData, gradingRules]);

  // Rank students
  const rankedStudents = useMemo(() => {
    const sorted = [...studentData]
      .filter(s => s.generalAvg !== null)
      .sort((a, b) => (b.generalAvg || 0) - (a.generalAvg || 0));
    
    return studentData.map(s => ({
      ...s,
      rank: s.generalAvg !== null ? sorted.findIndex(x => x.user_id === s.user_id) + 1 : null,
    }));
  }, [studentData]);

  const avgColor = (val: number | null) => {
    if (val === null) return '';
    return val >= 10 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const mentionLabel = (m: string | null) => MENTIONS.find(x => x.value === m)?.label || '';
  const mentionColor = (m: string | null) => {
    if (!m) return '';
    if (m === 'tres_bien') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    if (m === 'bien') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    if (m === 'assez_bien') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    return 'bg-muted text-muted-foreground';
  };

  if (students.length === 0) {
    return <EmptyState icon={Users} title="Aucun étudiant" description="Aucun étudiant inscrit à cette formation" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">
          Récapitulatif des moyennes — {formation?.title}
        </h2>
      </div>

      <div className="rounded-lg border border-border shadow-sm bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="text-left p-3 border border-primary/80 font-semibold min-w-[180px]">Étudiant</th>
                {modules.map((mod: any) => (
                  <th key={mod.id} className="text-center p-3 border border-primary/80 font-semibold text-xs min-w-[80px]" title={mod.title}>
                    {mod.title.length > 15 ? mod.title.substring(0, 12) + '...' : mod.title}
                  </th>
                ))}
                <th className="text-center p-3 border border-primary/80 font-bold bg-amber-500 text-white min-w-[80px]">Moy. Gén.</th>
                <th className="text-center p-3 border border-primary/80 font-semibold min-w-[90px]">Mention</th>
                <th className="text-center p-3 border border-primary/80 font-semibold min-w-[60px]">Rang</th>
              </tr>
            </thead>
            <tbody>
              {rankedStudents.map((student, idx) => (
                <tr key={student.user_id} className={`hover:bg-muted/20 ${idx % 2 === 0 ? 'bg-card' : 'bg-muted/10'}`}>
                  <td className="p-3 border border-border/50 font-medium text-foreground whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {(student.first_name?.[0] || '').toUpperCase()}{(student.last_name?.[0] || '').toUpperCase()}
                      </div>
                      {student.last_name} {student.first_name}
                    </div>
                  </td>
                  {modules.map((mod: any) => (
                    <td key={mod.id} className={`p-3 border border-border/50 text-center font-bold text-xs ${avgColor(student.moduleAverages[mod.id])}`}>
                      {student.moduleAverages[mod.id] !== null ? student.moduleAverages[mod.id]!.toFixed(2) : '—'}
                    </td>
                  ))}
                  <td className={`p-3 border border-border/50 text-center font-bold ${avgColor(student.generalAvg)}`}>
                    {student.generalAvg !== null ? student.generalAvg.toFixed(2) : '—'}
                  </td>
                  <td className="p-3 border border-border/50 text-center">
                    {student.mention && (
                      <Badge className={`text-[10px] ${mentionColor(student.mention)}`}>
                        {mentionLabel(student.mention)}
                      </Badge>
                    )}
                  </td>
                  <td className="p-3 border border-border/50 text-center font-bold text-foreground">
                    {student.rank !== null ? `${student.rank}/${rankedStudents.filter(s => s.generalAvg !== null).length}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CalculValidation;
