import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Star, Calendar, Layers, Rows3, ChevronDown, ChevronUp, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createEvaluationPeriod,
  type EvaluationPeriod,
  type CompositeBulletinConfig,
  type CompositeBlockConfig,
} from '@/services/gradesService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  formationId: string;
  existingPeriods: EvaluationPeriod[];
}

// All possible columns the user can pick per block
const AVAILABLE_COLUMNS: { key: string; label: string; group: string }[] = [
  { key: 'module', label: 'Module / Matière', group: 'base' },
  { key: 'coefficient', label: 'Coefficient', group: 'base' },
  { key: 'cc', label: 'Note CC', group: 'notes' },
  { key: 'ds', label: 'Note DS / Partiel', group: 'notes' },
  { key: 'exam', label: 'Examen final', group: 'notes' },
  { key: 'oral', label: 'Oral / Soutenance', group: 'notes' },
  { key: 'tp', label: 'TP', group: 'notes' },
  { key: 'moyenne', label: 'Moyenne stagiaire', group: 'calc' },
  { key: 'moyenne_classe', label: 'Moyenne de classe', group: 'calc' },
  { key: 'points', label: 'Points (Note × Coef)', group: 'calc' },
  { key: 'credits', label: 'Crédits ECTS', group: 'calc' },
  { key: 'status', label: 'Statut (Validé / Ajourné)', group: 'meta' },
  { key: 'appreciation', label: 'Appréciation', group: 'meta' },
  { key: 'rang', label: 'Rang', group: 'meta' },
];

const DEFAULT_BLOCK_COLUMNS = ['module', 'moyenne', 'moyenne_classe', 'appreciation'];
const DEFAULT_EXAM_COLUMNS = ['module', 'cc', 'coefficient', 'points'];

const CreateCompositePeriodModal: React.FC<Props> = ({ isOpen, onClose, formationId, existingPeriods }) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<CompositeBlockConfig[]>([]);
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [totalEnabled, setTotalEnabled] = useState(true);
  const [totalLabel, setTotalLabel] = useState('TOTAL (Admis si > ou = 220)');
  const [totalFormula, setTotalFormula] = useState<'sum_points' | 'average_avg' | 'weighted_avg' | 'custom'>('sum_points');
  const [totalCustom, setTotalCustom] = useState('');
  const [threshold, setThreshold] = useState<number>(220);
  const [admittedLabel, setAdmittedLabel] = useState('ADMIS');
  const [rejectedLabel, setRejectedLabel] = useState('NON ADMIS');

  const eligiblePeriods = useMemo(
    () => existingPeriods.filter((p) => !p.is_composite),
    [existingPeriods]
  );

  // Reset state when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setName('');
    setSelectedIds([]);
    setBlocks([]);
    setExpandedBlock(null);
    setTotalEnabled(true);
    setTotalLabel('TOTAL (Admis si > ou = 220)');
    setTotalFormula('sum_points');
    setTotalCustom('');
    setThreshold(220);
    setAdmittedLabel('ADMIS');
    setRejectedLabel('NON ADMIS');
  }, [isOpen]);

  // Sync blocks with selected periods
  useEffect(() => {
    setBlocks((prev) => {
      // Remove blocks for unselected periods
      const filtered = prev.filter((b) => selectedIds.includes(b.period_id));
      // Add blocks for newly selected
      const newOnes: CompositeBlockConfig[] = [];
      selectedIds.forEach((pid, idx) => {
        if (!filtered.find((b) => b.period_id === pid)) {
          const period = eligiblePeriods.find((p) => p.id === pid);
          const isExam = period?.period_type === 'examen_blanc' || period?.period_type === 'examen_final' || period?.period_type === 'partiels';
          newOnes.push({
            period_id: pid,
            render_mode: 'block',
            title: period?.name || '',
            columns: isExam ? [...DEFAULT_EXAM_COLUMNS] : [...DEFAULT_BLOCK_COLUMNS],
            show_appreciation: true,
            order_index: filtered.length + newOnes.length,
          });
        }
      });
      const merged = [...filtered, ...newOnes];
      // Reindex to keep order_index contiguous and respect selection order
      return merged
        .sort((a, b) => selectedIds.indexOf(a.period_id) - selectedIds.indexOf(b.period_id))
        .map((b, i) => ({ ...b, order_index: i }));
    });
  }, [selectedIds, eligiblePeriods]);

  const togglePeriod = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const updateBlock = (periodId: string, patch: Partial<CompositeBlockConfig>) => {
    setBlocks((prev) => prev.map((b) => b.period_id === periodId ? { ...b, ...patch } : b));
  };

  const moveBlock = (periodId: string, dir: -1 | 1) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.period_id === periodId);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr.map((b, i) => ({ ...b, order_index: i }));
    });
  };

  const toggleColumn = (periodId: string, key: string) => {
    setBlocks((prev) => prev.map((b) => {
      if (b.period_id !== periodId) return b;
      const has = b.columns.includes(key);
      return { ...b, columns: has ? b.columns.filter((k) => k !== key) : [...b.columns, key] };
    }));
  };

  const createMut = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Donnez un nom à ce bulletin');
      if (selectedIds.length < 1) throw new Error('Sélectionnez au moins une période');

      const selected = eligiblePeriods.filter((p) => selectedIds.includes(p.id));
      const startDate = selected.reduce((min, p) => p.start_date < min ? p.start_date : min, selected[0].start_date);
      const endDate = selected.reduce((max, p) => p.end_date > max ? p.end_date : max, selected[0].end_date);
      const maxOrder = existingPeriods.reduce((m, p) => Math.max(m, p.order_index || 0), 0);

      const compositeConfig: CompositeBulletinConfig = {
        blocks: blocks.sort((a, b) => a.order_index - b.order_index),
        total: {
          enabled: totalEnabled,
          label: totalLabel,
          formula: totalFormula,
          custom_expression: totalFormula === 'custom' ? totalCustom : undefined,
          threshold,
          admitted_label: admittedLabel,
          rejected_label: rejectedLabel,
        },
      };

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
        composite_config: compositeConfig,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluation-periods'] });
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      queryClient.invalidateQueries({ queryKey: ['periods-sheet'] });
      toast.success('Bulletin spécifique créé avec sa configuration');
      onClose();
    },
    onError: (e: any) => toast.error(e?.message || 'Erreur'),
  });

  const groupedColumns = useMemo(() => {
    const g: Record<string, typeof AVAILABLE_COLUMNS> = {};
    AVAILABLE_COLUMNS.forEach((c) => {
      if (!g[c.group]) g[c.group] = [];
      g[c.group].push(c);
    });
    return g;
  }, []);

  const groupLabels: Record<string, string> = {
    base: 'Base',
    notes: 'Notes',
    calc: 'Calculs',
    meta: 'Annotations',
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="composite-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Créer un bulletin spécifique ou final
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Step 1 - Name & periods */}
          <section className="space-y-3">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-lg p-3 text-[12px] text-amber-800 dark:text-amber-300">
              <strong>Étape 1 — Choix des périodes</strong> · Combinez plusieurs périodes en un bulletin unique. Vous pourrez ensuite configurer chaque bloc indépendamment (ex: <em>Contrôle continu Semestre 1</em> + <em>BTS Blanc</em> avec colonnes séparées comme sur le modèle IRTA).
            </div>

            <div>
              <Label className="text-xs">Nom du bulletin *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Bulletin BTS Final / Bulletin Annuel"
                className="mt-1"
                data-testid="composite-name-input"
              />
            </div>

            <div>
              <Label className="text-xs">Périodes à combiner *</Label>
              {eligiblePeriods.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center mt-1">
                  <Calendar className="h-7 w-7 text-muted-foreground/40 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Aucune période existante. Créez d'abord des périodes d'évaluation.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                  {eligiblePeriods.map((p) => (
                    <label
                      key={p.id}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition-all ${
                        selectedIds.includes(p.id)
                          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400'
                          : 'bg-background border-border hover:bg-muted/30'
                      }`}
                      data-testid={`composite-period-option-${p.id}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => togglePeriod(p.id)}
                        className="h-4 w-4 accent-amber-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.period_type}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Step 2 - Blocks configuration */}
          {blocks.length > 0 && (
            <section className="space-y-2">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-3 text-[12px] text-blue-800 dark:text-blue-300">
                <strong>Étape 2 — Configuration de chaque bloc</strong> · Choisissez le mode de rendu et les colonnes pour chaque période.
              </div>

              {blocks.map((block, idx) => {
                const period = eligiblePeriods.find((p) => p.id === block.period_id);
                const isExpanded = expandedBlock === block.period_id;
                return (
                  <div key={block.period_id} className="border border-border rounded-lg overflow-hidden" data-testid={`block-config-${block.period_id}`}>
                    {/* Block header */}
                    <div className="flex items-center gap-2 p-3 bg-muted/40">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{block.title || period?.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {block.render_mode === 'block' ? `Bloc séparé · ${block.columns.length} colonne(s)` : 'Fusionné dans le tableau principal'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveBlock(block.period_id, -1)} disabled={idx === 0} title="Monter">
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveBlock(block.period_id, 1)} disabled={idx === blocks.length - 1} title="Descendre">
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          onClick={() => setExpandedBlock(isExpanded ? null : block.period_id)}
                          data-testid={`block-expand-${block.period_id}`}
                        >
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          {isExpanded ? 'Fermer' : 'Configurer'}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded config */}
                    {isExpanded && (
                      <div className="p-3 space-y-3 bg-background">
                        {/* Render mode */}
                        <div>
                          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Mode de rendu</Label>
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => updateBlock(block.period_id, { render_mode: 'block' })}
                              className={`p-2.5 rounded-lg border-2 text-left transition-all ${
                                block.render_mode === 'block'
                                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                                  : 'border-border hover:border-muted-foreground'
                              }`}
                              data-testid={`mode-block-${block.period_id}`}
                            >
                              <Layers className="h-4 w-4 text-amber-600 mb-1" />
                              <p className="text-xs font-semibold">Bloc séparé</p>
                              <p className="text-[10px] text-muted-foreground">Tableau dédié avec son titre + ses colonnes (ex: Contrôle continu)</p>
                            </button>
                            <button
                              type="button"
                              onClick={() => updateBlock(block.period_id, { render_mode: 'merged' })}
                              className={`p-2.5 rounded-lg border-2 text-left transition-all ${
                                block.render_mode === 'merged'
                                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-border hover:border-muted-foreground'
                              }`}
                              data-testid={`mode-merged-${block.period_id}`}
                            >
                              <Rows3 className="h-4 w-4 text-blue-600 mb-1" />
                              <p className="text-xs font-semibold">Fusion ligne</p>
                              <p className="text-[10px] text-muted-foreground">Notes intégrées dans le tableau principal (1 colonne par période)</p>
                            </button>
                          </div>
                        </div>

                        {/* Block title */}
                        <div>
                          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Titre affiché du bloc</Label>
                          <Input
                            value={block.title || ''}
                            onChange={(e) => updateBlock(block.period_id, { title: e.target.value })}
                            placeholder={period?.name || 'Titre'}
                            className="mt-1 h-8 text-xs"
                            data-testid={`block-title-${block.period_id}`}
                          />
                        </div>

                        {/* Columns */}
                        {block.render_mode === 'block' && (
                          <div>
                            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Colonnes visibles dans ce bloc</Label>
                            <div className="space-y-2 mt-1">
                              {Object.entries(groupedColumns).map(([grp, cols]) => (
                                <div key={grp} className="border border-border rounded p-2">
                                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">{groupLabels[grp]}</p>
                                  <div className="grid grid-cols-2 gap-1.5">
                                    {cols.map((c) => (
                                      <label key={c.key} className="flex items-center gap-1.5 text-xs cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={block.columns.includes(c.key)}
                                          onChange={() => toggleColumn(block.period_id, c.key)}
                                          className="h-3.5 w-3.5 accent-amber-500"
                                          data-testid={`col-${block.period_id}-${c.key}`}
                                        />
                                        <span>{c.label}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          {/* Step 3 - Total/decision */}
          {blocks.length > 0 && (
            <section className="space-y-2">
              <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 rounded-lg p-3 text-[12px] text-violet-800 dark:text-violet-300">
                <strong>Étape 3 — Total & décision finale</strong> · Calcul global et seuil d'admission (ex: <em>TOTAL ≥ 220 → ADMIS</em>).
              </div>

              <div className="border border-border rounded-lg p-3 space-y-3">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={totalEnabled}
                    onChange={(e) => setTotalEnabled(e.target.checked)}
                    className="h-4 w-4 accent-violet-500"
                    data-testid="total-enabled"
                  />
                  <span className="font-medium">Afficher un Total + décision Admis/Non Admis</span>
                </label>

                {totalEnabled && (
                  <div className="space-y-3 pl-6">
                    <div>
                      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Libellé du total</Label>
                      <Input value={totalLabel} onChange={(e) => setTotalLabel(e.target.value)} className="mt-1 h-8 text-xs" data-testid="total-label" />
                    </div>

                    <div>
                      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Mode de calcul</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                        {[
                          { v: 'sum_points', l: 'Somme des points', d: 'Σ (note × coef) sur tous les blocs' },
                          { v: 'average_avg', l: 'Moyenne des moyennes', d: 'Moyenne arithmétique des moyennes par bloc' },
                          { v: 'weighted_avg', l: 'Moyenne pondérée', d: 'Σ(moyenne × coef) / Σ(coef)' },
                          { v: 'custom', l: 'Formule personnalisée', d: 'Variables: {sum_points}, {avg_cc}, {avg_exam}…' },
                        ].map((opt) => (
                          <button
                            key={opt.v}
                            type="button"
                            onClick={() => setTotalFormula(opt.v as any)}
                            className={`p-2 rounded border-2 text-left transition-all ${
                              totalFormula === opt.v ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20' : 'border-border hover:border-muted-foreground'
                            }`}
                            data-testid={`formula-${opt.v}`}
                          >
                            <p className="text-xs font-semibold">{opt.l}</p>
                            <p className="text-[10px] text-muted-foreground">{opt.d}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {totalFormula === 'custom' && (
                      <div>
                        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Expression</Label>
                        <Input
                          value={totalCustom}
                          onChange={(e) => setTotalCustom(e.target.value)}
                          placeholder="Ex: {sum_points} * 0.6 + {avg_cc} * 0.4"
                          className="mt-1 h-8 text-xs font-mono"
                          data-testid="total-custom"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Seuil</Label>
                        <Input
                          type="number"
                          value={threshold}
                          onChange={(e) => setThreshold(parseFloat(e.target.value) || 0)}
                          className="mt-1 h-8 text-xs"
                          data-testid="total-threshold"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Si ≥ seuil</Label>
                        <Input value={admittedLabel} onChange={(e) => setAdmittedLabel(e.target.value)} className="mt-1 h-8 text-xs" data-testid="admitted-label" />
                      </div>
                      <div>
                        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Si &lt; seuil</Label>
                        <Input value={rejectedLabel} onChange={(e) => setRejectedLabel(e.target.value)} className="mt-1 h-8 text-xs" data-testid="rejected-label" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
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
            {createMut.isPending ? 'Création...' : `Créer le bulletin (${blocks.length} bloc${blocks.length > 1 ? 's' : ''})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCompositePeriodModal;
