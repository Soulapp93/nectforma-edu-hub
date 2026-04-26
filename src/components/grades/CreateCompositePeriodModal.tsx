import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Star, Calendar } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createEvaluationPeriod, type EvaluationPeriod } from '@/services/gradesService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  formationId: string;
  existingPeriods: EvaluationPeriod[];
}

const CreateCompositePeriodModal: React.FC<Props> = ({ isOpen, onClose, formationId, existingPeriods }) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Only allow combining non-composite periods
  const eligiblePeriods = useMemo(
    () => existingPeriods.filter((p) => !p.is_composite),
    [existingPeriods]
  );

  const toggle = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const createMut = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Donnez un nom à ce bulletin');
      if (selectedIds.length < 1) throw new Error('Sélectionnez au moins une période');

      // Compute date range from selected periods
      const selected = eligiblePeriods.filter((p) => selectedIds.includes(p.id));
      const startDate = selected.reduce((min, p) => p.start_date < min ? p.start_date : min, selected[0].start_date);
      const endDate = selected.reduce((max, p) => p.end_date > max ? p.end_date : max, selected[0].end_date);
      const maxOrder = existingPeriods.reduce((m, p) => Math.max(m, p.order_index || 0), 0);

      return createEvaluationPeriod({
        formation_id: formationId,
        name: name.trim(),
        period_type: 'composite',
        start_date: startDate,
        end_date: endDate,
        order_index: maxOrder + 1,
        is_locked: false,
        is_composite: true,
        combined_period_ids: selectedIds,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluation-periods'] });
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      queryClient.invalidateQueries({ queryKey: ['periods-sheet'] });
      toast.success('Bulletin spécifique créé');
      setName('');
      setSelectedIds([]);
      onClose();
    },
    onError: (e: any) => toast.error(e?.message || 'Erreur'),
  });

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl" data-testid="composite-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Créer un bulletin spécifique ou final
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-lg p-3 text-[12px] text-amber-800 dark:text-amber-300">
            Un bulletin spécifique combine plusieurs périodes existantes (ex : <strong>Semestre 1 + Semestre 2</strong> pour un bulletin annuel,
            ou <strong>Semestre 1 + Examen Blanc</strong> pour un bulletin BTS) en un seul bulletin unique avec ses propres notes consolidées et sa propre mise en page.
          </div>

          <div>
            <Label className="text-xs">Nom du bulletin *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Bulletin annuel 2026 / Bulletin final BTS"
              className="mt-1"
              data-testid="composite-name-input"
            />
          </div>

          <div>
            <Label className="text-xs">Périodes à combiner *</Label>
            <p className="text-[11px] text-muted-foreground mt-0.5 mb-2">Sélectionnez les périodes existantes à inclure</p>
            {eligiblePeriods.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aucune période existante. Créez d'abord des périodes d'évaluation.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {eligiblePeriods.map((p) => (
                  <label
                    key={p.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedIds.includes(p.id)
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400'
                        : 'bg-background border-border hover:bg-muted/30'
                    }`}
                    data-testid={`composite-period-option-${p.id}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => toggle(p.id)}
                      className="h-4 w-4 accent-amber-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.period_type} · {p.start_date} → {p.end_date}</p>
                    </div>
                    {p.is_locked && <span className="text-[10px] uppercase tracking-wider text-red-500 font-bold">Verrouillé</span>}
                  </label>
                ))}
              </div>
            )}
            {selectedIds.length > 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2">
                ✓ {selectedIds.length} période{selectedIds.length > 1 ? 's' : ''} sélectionnée{selectedIds.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button
            onClick={() => createMut.mutate()}
            disabled={!name.trim() || selectedIds.length < 1 || createMut.isPending}
            className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
            data-testid="composite-save-btn"
          >
            <Save className="h-4 w-4" />
            {createMut.isPending ? 'Création...' : 'Créer le bulletin'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCompositePeriodModal;
