import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';
import {
  createEvaluation,
  updateEvaluation,
  getEvaluationPeriods,
  EVALUATION_TYPES,
  type Evaluation,
} from '@/services/gradesService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  evaluation: Evaluation | null;
  formationId: string;
  mode: 'admin' | 'instructor';
  preselectedModuleId?: string;
}

const CreateEvaluationModal: React.FC<Props> = ({ isOpen, onClose, evaluation, formationId, mode }) => {
  const { userId } = useCurrentUser();
  const queryClient = useQueryClient();
  const isEditing = !!evaluation;

  const [title, setTitle] = useState(evaluation?.title || '');
  const [description, setDescription] = useState(evaluation?.description || '');
  const [moduleId, setModuleId] = useState(evaluation?.module_id || '');
  const [periodId, setPeriodId] = useState(evaluation?.period_id || '');
  const [instructorId, setInstructorId] = useState(evaluation?.instructor_id || userId || '');
  const [evaluationType, setEvaluationType] = useState(evaluation?.evaluation_type || 'controle_continu');
  const [evaluationDate, setEvaluationDate] = useState(evaluation?.evaluation_date || '');
  const [scale, setScale] = useState(evaluation?.scale?.toString() || '20');
  const [coefficient, setCoefficient] = useState(evaluation?.coefficient?.toString() || '1');

  // Fetch modules for the formation
  const { data: modules = [] } = useQuery({
    queryKey: ['formation-modules', formationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('formation_modules')
        .select('id, title')
        .eq('formation_id', formationId)
        .order('order_index');
      return data || [];
    },
    enabled: !!formationId,
  });

  // Fetch periods
  const { data: periods = [] } = useQuery({
    queryKey: ['evaluation-periods', formationId],
    queryFn: () => getEvaluationPeriods(formationId),
    enabled: !!formationId,
  });

  // Fetch instructors (admin only)
  const { data: instructors = [] } = useQuery({
    queryKey: ['formation-instructors', formationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_formation_assignments')
        .select('user_id, users!inner(id, first_name, last_name, role)')
        .eq('formation_id', formationId);
      return (data || [])
        .map((d: any) => d.users)
        .filter((u: any) => u?.role === 'Formateur');
    },
    enabled: !!formationId && mode === 'admin',
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title,
        description: description || null,
        module_id: moduleId,
        period_id: periodId || null,
        instructor_id: mode === 'admin' ? instructorId : userId,
        evaluation_type: evaluationType,
        evaluation_date: evaluationDate || null,
        scale: parseFloat(scale),
        coefficient: parseFloat(coefficient),
      };

      if (isEditing) {
        return updateEvaluation(evaluation!.id, payload);
      }
      return createEvaluation(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      toast.success(isEditing ? 'Évaluation modifiée' : 'Évaluation créée');
      onClose();
    },
    onError: (e: any) => toast.error(e.message || 'Erreur'),
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifier l\'évaluation' : 'Nouvelle évaluation'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Titre *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Examen final module 1" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Module *</Label>
              <Select value={moduleId} onValueChange={setModuleId}>
                <SelectTrigger><SelectValue placeholder="Module" /></SelectTrigger>
                <SelectContent>
                  {modules.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Période</Label>
              <Select value={periodId} onValueChange={setPeriodId}>
                <SelectTrigger><SelectValue placeholder="Période (optionnel)" /></SelectTrigger>
                <SelectContent>
                  {periods.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {mode === 'admin' && (
            <div>
              <Label>Formateur responsable *</Label>
              <Select value={instructorId} onValueChange={setInstructorId}>
                <SelectTrigger><SelectValue placeholder="Formateur" /></SelectTrigger>
                <SelectContent>
                  {instructors.map((i: any) => (
                    <SelectItem key={i.id} value={i.id}>{i.first_name} {i.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type *</Label>
              <Select value={evaluationType} onValueChange={setEvaluationType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVALUATION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={evaluationDate} onChange={(e) => setEvaluationDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Barème (sur)</Label>
              <Input type="number" value={scale} onChange={(e) => setScale(e.target.value)} min="1" step="1" />
            </div>
            <div>
              <Label>Coefficient</Label>
              <Input type="number" value={coefficient} onChange={(e) => setCoefficient(e.target.value)} min="0.1" step="0.1" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!title || !moduleId || mutation.isPending}
            >
              {mutation.isPending ? 'En cours...' : isEditing ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEvaluationModal;
