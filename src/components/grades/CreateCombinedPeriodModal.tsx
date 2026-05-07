import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Layers, Calculator } from 'lucide-react';
import {
  createCombinedPeriod,
  updateCombinedPeriod,
  type CombinedPeriodConfig,
  type CombinedCalculationRule,
} from '@/services/combinedPeriodService';
import type { EvaluationPeriod } from '@/services/gradesService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  formationId: string;
  /** All non-combined periods of the formation (eligible sources) */
  availablePeriods: EvaluationPeriod[];
  /** When provided, switches to edit mode. */
  editingPeriod?: EvaluationPeriod | null;
}

const RULE_LABELS: Record<CombinedCalculationRule, { title: string; help: string }> = {
  simple_average: {
    title: 'Moyenne simple',
    help: "Moyenne des moyennes générales de chaque période. Ex : (S1=10 + S2=10) / 2 = 10",
  },
  weighted_average: {
    title: 'Moyenne pondérée',
    help: 'Moyenne pondérée par les poids définis ci-dessous. Ex : S1×0.4 + S2×0.6.',
  },
  weighted_by_coefficient: {
    title: 'Pondérée par coefficient des modules',
    help: 'Somme des points (moyenne × coef) de tous les modules de toutes les périodes / somme des coefficients.',
  },
};

const CreateCombinedPeriodModal: React.FC<Props> = ({
  isOpen,
  onClose,
  formationId,
  availablePeriods,
  editingPeriod = null,
}) => {
  const queryClient = useQueryClient();
  const isEditing = !!editingPeriod;

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPeriodIds, setSelectedPeriodIds] = useState<string[]>([]);
  const [calculationRule, setCalculationRule] = useState<CombinedCalculationRule>('simple_average');
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [customLabel, setCustomLabel] = useState('');

  // Preload when editing
  useEffect(() => {
    if (!isOpen) return;
    if (editingPeriod) {
      setName(editingPeriod.name || '');
      setStartDate(editingPeriod.start_date || '');
      setEndDate(editingPeriod.end_date || '');
      setSelectedPeriodIds(editingPeriod.combined_period_ids || []);
      const cfg: any = editingPeriod.composite_config || {};
      setCalculationRule((cfg.calculation_rule as CombinedCalculationRule) || 'simple_average');
      setWeights(cfg.weights || {});
      setCustomLabel(cfg.custom_label || '');
    } else {
      setName('');
      setStartDate('');
      setEndDate('');
      setSelectedPeriodIds([]);
      setCalculationRule('simple_average');
      setWeights({});
      setCustomLabel('');
    }
  }, [isOpen, editingPeriod]);

  // Eligible periods: ALL periods of the same formation (including composites),
  // excluding the current period itself when editing (to prevent self-reference cycles)
  const eligible = useMemo(
    () =>
      availablePeriods
        .filter((p) => p.id !== editingPeriod?.id)
        .sort((a, b) => (a as any).order_index - (b as any).order_index),
    [availablePeriods, editingPeriod?.id],
  );

  const togglePeriod = (id: string) => {
    setSelectedPeriodIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      // Initialize weight when adding
      if (!prev.includes(id) && !(id in weights)) {
        setWeights((w) => ({ ...w, [id]: 1 }));
      }
      return next;
    });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const config: CombinedPeriodConfig = {
        calculation_rule: calculationRule,
        weights: calculationRule === 'weighted_average' ? weights : undefined,
        custom_label: customLabel || undefined,
      };
      if (isEditing && editingPeriod) {
        return updateCombinedPeriod(editingPeriod.id, {
          name,
          start_date: startDate,
          end_date: endDate,
          combined_period_ids: selectedPeriodIds,
          config,
        });
      }
      return createCombinedPeriod({
        formation_id: formationId,
        name,
        start_date: startDate,
        end_date: endDate,
        combined_period_ids: selectedPeriodIds,
        config,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods-for-transcripts'] });
      queryClient.invalidateQueries({ queryKey: ['evaluation-periods'] });
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      toast.success(isEditing ? 'Période combinée mise à jour' : 'Période combinée créée');
      onClose();
    },
    onError: (e: any) => {
      toast.error(e.message || 'Erreur lors de l\'enregistrement');
    },
  });

  const canSubmit =
    name.trim().length > 0 &&
    startDate &&
    endDate &&
    selectedPeriodIds.length >= 2;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="combined-period-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            {isEditing ? 'Modifier la période combinée' : 'Créer une période combinée'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Identity */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label>Nom de la période combinée *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex : Année complète, Examen final BTS, Bulletin annuel..."
                data-testid="combined-period-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date de début *</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} data-testid="combined-period-start" />
              </div>
              <div>
                <Label>Date de fin *</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} data-testid="combined-period-end" />
              </div>
            </div>
          </div>

          {/* Source periods */}
          <div>
            <Label className="mb-2 block">Périodes à combiner * (au moins 2)</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Cochez les périodes à empiler dans le bulletin combiné. Les périodes simples ET combinées sont acceptées (ex: combiner S1+S2 avec un BTS Blanc, ou deux bulletins combinés entre eux).
            </p>
            {eligible.length === 0 ? (
              <p className="text-xs italic text-muted-foreground border rounded p-3">
                Aucune période disponible. Créez d'abord des périodes simples (S1, S2…).
              </p>
            ) : (
              <div className="border rounded p-2 space-y-1.5 max-h-60 overflow-y-auto">
                {eligible.map((p) => {
                  const checked = selectedPeriodIds.includes(p.id);
                  const isComposite = (p as any).is_composite === true;
                  return (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => togglePeriod(p.id)}
                      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); togglePeriod(p.id); } }}
                      className={`flex items-center gap-2 px-1.5 py-1 rounded cursor-pointer ${checked ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted/40'}`}
                      data-testid={`combined-source-row-${p.id}`}
                    >
                      <Checkbox
                        checked={checked}
                        onClick={(e) => e.stopPropagation()}
                        onCheckedChange={() => togglePeriod(p.id)}
                        data-testid={`combined-source-checkbox-${p.id}`}
                      />
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-sm font-medium">{p.name}</span>
                        <Badge variant="outline" className="text-[10px]">{p.period_type}</Badge>
                        {isComposite && (
                          <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800 border-amber-200">Combinée</Badge>
                        )}
                      </div>
                      {calculationRule === 'weighted_average' && checked && (
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={weights[p.id] ?? 1}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setWeights((w) => ({ ...w, [p.id]: Number(e.target.value) }))}
                          className="w-20 h-7 text-xs"
                          data-testid={`combined-weight-${p.id}`}
                          placeholder="Poids"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Calculation rule */}
          <div>
            <Label className="mb-2 flex items-center gap-1">
              <Calculator className="h-3.5 w-3.5" />
              Règle de calcul de la moyenne combinée
            </Label>
            <Select
              value={calculationRule}
              onValueChange={(v: CombinedCalculationRule) => setCalculationRule(v)}
            >
              <SelectTrigger data-testid="combined-rule-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(RULE_LABELS) as CombinedCalculationRule[]).map((k) => (
                  <SelectItem key={k} value={k}>{RULE_LABELS[k].title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2 italic">
              {RULE_LABELS[calculationRule].help}
            </p>
          </div>

          {/* Custom label */}
          <div>
            <Label>Libellé du bandeau final (facultatif)</Label>
            <Input
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="Bulletin combiné — Année complète"
              data-testid="combined-custom-label"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Laisser vide pour utiliser le nom de la période.
            </p>
          </div>

          {/* Summary preview */}
          {selectedPeriodIds.length >= 2 && (
            <div className="border rounded p-3 bg-primary/5">
              <p className="text-[11px] font-semibold text-muted-foreground mb-1">Récapitulatif</p>
              <p className="text-xs">
                <strong>{name || 'Période combinée'}</strong> empilera {selectedPeriodIds.length} bulletins
                {' '}({selectedPeriodIds.map((id) => eligible.find((p) => p.id === id)?.name).filter(Boolean).join(' + ')}),
                {' '}avec la règle <strong>{RULE_LABELS[calculationRule].title.toLowerCase()}</strong>.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            data-testid="combined-period-submit"
          >
            {mutation.isPending ? 'Enregistrement…' : isEditing ? 'Mettre à jour' : 'Créer la période combinée'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCombinedPeriodModal;
