import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';
import {
  createEvaluation,
  updateEvaluation,
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
  /** Auto-link new evaluations to this period for strict period isolation. */
  preselectedPeriodId?: string | null;
}

/**
 * When editing an existing evaluation whose title doesn't match the label of
 * a known type, we fallback to "autre" and prefill the custom title field.
 */
const resolveInitialState = (evaluation: Evaluation | null) => {
  if (!evaluation) {
    return { evaluationType: 'controle_continu', customTitle: '' };
  }
  const matchingType = EVALUATION_TYPES.find(
    (t) => t.value === evaluation.evaluation_type && t.label === evaluation.title,
  );
  if (matchingType) {
    return { evaluationType: matchingType.value, customTitle: '' };
  }
  // Either the title was customized, or it's an "autre" entry
  return { evaluationType: 'autre', customTitle: evaluation.title || '' };
};

const CreateEvaluationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  evaluation,
  formationId,
  mode,
  preselectedModuleId,
  preselectedPeriodId,
}) => {
  const { userId } = useCurrentUser();
  const queryClient = useQueryClient();
  const isEditing = !!evaluation;

  const initial = resolveInitialState(evaluation);
  const [evaluationType, setEvaluationType] = useState(initial.evaluationType);
  const [customTitle, setCustomTitle] = useState(initial.customTitle);
  const [moduleId, setModuleId] = useState(evaluation?.module_id || preselectedModuleId || '');
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

  // ⭐ When the evaluation is created in a BTS Blanc / Examen Blanc period,
  // auto-fill the coefficient from the per-module coefficient defined when
  // the period was created (period_modules table).
  const { data: periodModules = [] } = useQuery({
    queryKey: ['period-modules', preselectedPeriodId],
    queryFn: async () => {
      if (!preselectedPeriodId) return [];
      const { data } = await supabase
        .from('period_modules')
        .select('module_id, coefficient')
        .eq('period_id', preselectedPeriodId);
      return (data || []) as Array<{ module_id: string; coefficient: number }>;
    },
    enabled: !!preselectedPeriodId && !isEditing,
  });

  const periodCoefByModule = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const r of periodModules) m.set(r.module_id, r.coefficient || 1);
    return m;
  }, [periodModules]);

  // When a module is picked AND the period has a pre-defined coefficient
  // for that module, auto-update the coefficient field. The user can still
  // override it manually.
  React.useEffect(() => {
    if (isEditing) return;
    if (!moduleId) return;
    const periodCoef = periodCoefByModule.get(moduleId);
    if (periodCoef !== undefined) {
      setCoefficient(String(periodCoef));
    }
  }, [moduleId, periodCoefByModule, isEditing]);

  const isOther = evaluationType === 'autre';
  const selectedType = EVALUATION_TYPES.find((t) => t.value === evaluationType);
  // Derived title: use custom input when "Autre", else the type label.
  const resolvedTitle = (isOther ? customTitle.trim() : selectedType?.label || '').trim();
  const canSubmit = !!resolvedTitle && !!moduleId;

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: resolvedTitle,
        module_id: moduleId,
        // instructor_id is required in DB; use current user by default.
        // Admins can reassign the responsible instructor later from the
        // evaluation management screen.
        instructor_id: evaluation?.instructor_id || userId,
        evaluation_type: evaluationType,
        evaluation_date: evaluationDate || null,
        scale: parseFloat(scale),
        coefficient: parseFloat(coefficient),
        // Strict period isolation: auto-link new evaluations to the active
        // period so they only show up in that period's view.
        period_id: evaluation?.period_id ?? preselectedPeriodId ?? null,
      };

      if (isEditing) {
        return updateEvaluation(evaluation!.id, payload);
      }
      return createEvaluation(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['evaluations-sheet-all'] });
      toast.success(isEditing ? 'Évaluation modifiée' : 'Évaluation créée');
      onClose();
    },
    onError: (e: any) => toast.error(e.message || 'Erreur'),
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        data-testid="create-evaluation-modal"
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier l'évaluation" : 'Nouvelle évaluation'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Type d'évaluation *</Label>
            <Select
              value={evaluationType}
              onValueChange={(v) => {
                setEvaluationType(v);
                if (v !== 'autre') setCustomTitle('');
              }}
            >
              <SelectTrigger data-testid="evaluation-type-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVALUATION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isOther && (
            <div>
              <Label>Nom de l'évaluation *</Label>
              <Input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Ex : Dossier pro, Soutenance blanche..."
                data-testid="evaluation-custom-title-input"
              />
            </div>
          )}

          <div>
            <Label>Module *</Label>
            <Select value={moduleId} onValueChange={setModuleId}>
              <SelectTrigger data-testid="evaluation-module-select">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  // For BTS Blanc / Examen Blanc periods, restrict the module
                  // list to those configured for that period (period_modules).
                  const allowedIds = periodModules.length > 0
                    ? new Set(periodModules.map((r) => r.module_id))
                    : null;
                  const filtered = allowedIds
                    ? modules.filter((m: any) => allowedIds.has(m.id))
                    : modules;
                  return filtered.map((m: any) => {
                    const periodCoef = periodCoefByModule.get(m.id);
                    return (
                      <SelectItem key={m.id} value={m.id}>
                        {m.title}{periodCoef !== undefined ? ` (coef ${periodCoef})` : ''}
                      </SelectItem>
                    );
                  });
                })()}
              </SelectContent>
            </Select>
            {periodModules.length > 0 && (
              <p className="text-[11px] text-muted-foreground mt-1 italic">
                Coefficients pré-définis lors de la création de la période — vous pouvez encore les ajuster ci-dessous.
              </p>
            )}
          </div>

          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={evaluationDate}
              onChange={(e) => setEvaluationDate(e.target.value)}
              data-testid="evaluation-date-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Barème (sur)</Label>
              <Input
                type="number"
                value={scale}
                onChange={(e) => setScale(e.target.value)}
                min="1"
                step="1"
                data-testid="evaluation-scale-input"
              />
            </div>
            <div>
              <Label>Coefficient</Label>
              <Input
                type="number"
                value={coefficient}
                onChange={(e) => setCoefficient(e.target.value)}
                min="0.1"
                step="0.1"
                data-testid="evaluation-coefficient-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} data-testid="evaluation-cancel-btn">
              Annuler
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!canSubmit || mutation.isPending}
              data-testid="evaluation-submit-btn"
            >
              {mutation.isPending
                ? 'En cours...'
                : isEditing
                ? 'Modifier'
                : 'Créer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEvaluationModal;
