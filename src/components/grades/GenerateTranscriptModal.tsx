import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  getEvaluationPeriods,
  getEvaluations,
  getGradesByEvaluation,
  getGradingRules,
  createTranscript,
  createTranscriptModules,
  calculateModuleAverage,
  calculateWeightedAverage,
  getMention,
  getDecision,
} from '@/services/gradesService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  formationId: string;
}

const GenerateTranscriptModal: React.FC<Props> = ({ isOpen, onClose, formationId }) => {
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [publishImmediately, setPublishImmediately] = useState(false);

  const { data: periods = [] } = useQuery({
    queryKey: ['periods-generate', formationId],
    queryFn: () => getEvaluationPeriods(formationId),
    enabled: !!formationId,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students-generate', formationId],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_formation_students', { formation_id_param: formationId });
      return data || [];
    },
    enabled: !!formationId,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const rules = await getGradingRules(formationId);
      const defaultRules = {
        validation_threshold: 10,
        allow_compensation: true,
        compensation_threshold: 8,
        mention_passable_threshold: 10,
        mention_ab_threshold: 12,
        mention_bien_threshold: 14,
        mention_tb_threshold: 16,
      };
      const effectiveRules = rules || defaultRules;

      // Get all evaluations for this formation (filtered by period if selected)
      const allEvals = await getEvaluations(formationId);
      const evals = selectedPeriod
        ? allEvals.filter(e => e.period_id === selectedPeriod)
        : allEvals;

      // Get modules
      const { data: modules } = await supabase
        .from('formation_modules')
        .select('id, title, coefficient')
        .eq('formation_id', formationId);

      if (!modules || modules.length === 0) throw new Error('Aucun module trouvé');

      // Get all grades for all evaluations
      const gradesByEval = new Map();
      for (const ev of evals) {
        const grades = await getGradesByEvaluation(ev.id);
        gradesByEval.set(ev.id, grades);
      }

      // Generate transcript for each student
      let created = 0;
      for (const student of students) {
        const moduleAverages: { moduleId: string; average: number | null; coefficient: number }[] = [];

        for (const mod of modules) {
          const moduleEvals = evals.filter(e => e.module_id === mod.id);
          const studentGrades = moduleEvals
            .map(e => gradesByEval.get(e.id)?.find((g: any) => g.student_id === student.user_id))
            .filter(Boolean);

          const avg = calculateModuleAverage(studentGrades, 20);
          moduleAverages.push({
            moduleId: mod.id,
            average: avg,
            coefficient: (mod as any).coefficient || 1,
          });
        }

        const generalAvg = calculateWeightedAverage(
          moduleAverages.map(m => ({ average: m.average, coefficient: m.coefficient }))
        );

        const decision = generalAvg !== null ? getDecision(generalAvg, effectiveRules as any) : 'en_cours';
        const mention = generalAvg !== null ? getMention(generalAvg, effectiveRules as any) : null;

        const transcript = await createTranscript({
          student_id: student.user_id,
          formation_id: formationId,
          period_id: selectedPeriod || null,
          general_average: generalAvg,
          decision,
          mention,
          is_published: publishImmediately,
          published_at: publishImmediately ? new Date().toISOString() : null,
        } as any);

        // Create transcript modules
        const transcriptModules = moduleAverages.map(m => ({
          transcript_id: transcript.id,
          module_id: m.moduleId,
          module_average: m.average,
          coefficient: m.coefficient,
          is_validated: m.average !== null && m.average >= (effectiveRules as any).validation_threshold,
        }));

        await createTranscriptModules(transcriptModules);
        created++;
      }

      return created;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['transcripts'] });
      toast.success(`${count} relevé(s) de notes générés`);
      onClose();
    },
    onError: (e: any) => toast.error(e.message || 'Erreur lors de la génération'),
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Générer les relevés de notes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Période (optionnel)</Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les périodes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toute la formation</SelectItem>
                {periods.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            {students.length} étudiant(s) recevront un relevé de notes.
          </p>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={publishImmediately}
              onCheckedChange={(v) => setPublishImmediately(!!v)}
            />
            <Label className="text-sm">Publier immédiatement (visible par les étudiants)</Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending || students.length === 0}
            >
              {generateMutation.isPending ? 'Génération...' : `Générer (${students.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateTranscriptModal;
