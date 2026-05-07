import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createEvaluationPeriod, updateEvaluationPeriod, type EvaluationPeriod } from '@/services/gradesService';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Search, Layers } from 'lucide-react';

const PERIOD_OPTIONS = [
  { value: 'semestre', label: 'Semestre', needsModules: true },
  { value: 'trimestre', label: 'Trimestre', needsModules: true },
  { value: 'bts_blanc', label: 'BTS Blanc', needsModules: true },
  { value: 'examen_blanc', label: 'Examen Blanc', needsModules: true },
  { value: 'examen_final', label: 'Examen Final', needsModules: true },
  { value: 'partiels', label: 'Partiels', needsModules: true },
  { value: 'rattrapage', label: 'Rattrapage', needsModules: true },
  { value: 'custom', label: 'Personnalise', needsModules: true },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  formationId: string;
  semestersCount: number;
  existingPeriodsCount: number;
  /** When provided, the modal switches to "edit" mode. */
  editingPeriod?: EvaluationPeriod | null;
}

const CreatePeriodModal: React.FC<Props> = ({
  isOpen,
  onClose,
  formationId,
  semestersCount,
  existingPeriodsCount,
  editingPeriod = null,
}) => {
  const queryClient = useQueryClient();
  const isEditing = !!editingPeriod;
  const [periodType, setPeriodType] = useState('');
  const [name, setName] = useState('');
  const [semesterNumber, setSemesterNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [examCoefficients, setExamCoefficients] = useState<Record<string, number>>({});
  const [moduleSearch, setModuleSearch] = useState('');

  // BTS Blanc dedicated state: indépendant des matières Écrit vs Oral.
  // Key format: "{module_id}:{ecrit|oral}"
  const [btsEcritIds, setBtsEcritIds] = useState<string[]>([]);
  const [btsOralIds, setBtsOralIds] = useState<string[]>([]);
  const [btsEcritCoefs, setBtsEcritCoefs] = useState<Record<string, number>>({});
  const [btsOralCoefs, setBtsOralCoefs] = useState<Record<string, number>>({});

  // Preload existing values when editing
  useEffect(() => {
    if (!isOpen) return;
    if (editingPeriod) {
      setPeriodType(editingPeriod.period_type || '');
      setName(editingPeriod.name || '');
      // Extract semester number from name like "Semestre 3" if applicable
      const semMatch = editingPeriod.name?.match(/^Semestre\s+(\d+)/i);
      setSemesterNumber(semMatch ? semMatch[1] : '');
      setStartDate(editingPeriod.start_date || '');
      setEndDate(editingPeriod.end_date || '');
    }
  }, [editingPeriod, isOpen]);

  // Load linked modules when editing an exam-type period
  const { data: linkedModules } = useQuery({
    queryKey: ['period-modules', editingPeriod?.id],
    queryFn: async () => {
      if (!editingPeriod?.id) return [];
      const { data } = await supabase
        .from('period_modules')
        .select('module_id, coefficient, exam_part')
        .eq('period_id', editingPeriod.id);
      return data || [];
    },
    enabled: !!editingPeriod?.id && isOpen,
  });

  // Sync linked modules into local state when query resolves
  useEffect(() => {
    if (!linkedModules) return;
    // For BTS Blanc, rows are split by exam_part
    if (editingPeriod?.period_type === 'bts_blanc') {
      const ecrit: string[] = []; const oral: string[] = [];
      const ecritCoef: Record<string, number> = {}; const oralCoef: Record<string, number> = {};
      linkedModules.forEach((r: any) => {
        if (r.exam_part === 'ecrit') { ecrit.push(r.module_id); ecritCoef[r.module_id] = r.coefficient || 1; }
        else if (r.exam_part === 'oral') { oral.push(r.module_id); oralCoef[r.module_id] = r.coefficient || 1; }
      });
      setBtsEcritIds(ecrit); setBtsOralIds(oral);
      setBtsEcritCoefs(ecritCoef); setBtsOralCoefs(oralCoef);
      return;
    }
    const ids = linkedModules.map((r: any) => r.module_id);
    const coeffs: Record<string, number> = {};
    linkedModules.forEach((r: any) => { coeffs[r.module_id] = r.coefficient || 1; });
    setSelectedModuleIds(ids);
    setExamCoefficients(coeffs);
  }, [linkedModules, editingPeriod?.period_type]);

  const needsSemesterSelection = periodType === 'semestre';
  const isBtsBlanc = periodType === 'bts_blanc';
  const needsModuleSelection = (PERIOD_OPTIONS.find(o => o.value === periodType)?.needsModules || false) && !isBtsBlanc;
  const needsBtsPartSelection = isBtsBlanc;

  // Fetch all modules for this formation
  const { data: allModules = [] } = useQuery({
    queryKey: ['formation-modules', formationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('formation_modules')
        .select('id, title, semester, coefficient')
        .eq('formation_id', formationId)
        .order('order_index', { ascending: true });
      return data || [];
    },
    enabled: !!formationId && isOpen,
  });

  // Filter modules by search
  const visibleModules = useMemo(() =>
    (allModules as any[]).filter((m) => !moduleSearch || m.title.toLowerCase().includes(moduleSearch.toLowerCase())),
    [allModules, moduleSearch]
  );

  const computedName = useMemo(() => {
    if (name) return name;
    if (periodType === 'semestre' && semesterNumber) return `Semestre ${semesterNumber}`;
    const opt = PERIOD_OPTIONS.find(o => o.value === periodType);
    return opt?.label || '';
  }, [name, periodType, semesterNumber]);

  const toggleModule = (moduleId: string) => {
    setSelectedModuleIds(prev => {
      if (prev.includes(moduleId)) {
        const next = prev.filter(id => id !== moduleId);
        setExamCoefficients(c => { const n = { ...c }; delete n[moduleId]; return n; });
        return next;
      } else {
        const mod = allModules.find((m: any) => m.id === moduleId);
        setExamCoefficients(c => ({ ...c, [moduleId]: mod?.coefficient || 1 }));
        return [...prev, moduleId];
      }
    });
  };

  const selectAll = () => {
    setSelectedModuleIds(allModules.map((m: any) => m.id));
    const coeffs: Record<string, number> = {};
    allModules.forEach((m: any) => { coeffs[m.id] = m.coefficient || 1; });
    setExamCoefficients(coeffs);
  };
  const deselectAll = () => { setSelectedModuleIds([]); setExamCoefficients({}); };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (isEditing && editingPeriod) {
        // === EDIT MODE ===
        await updateEvaluationPeriod(editingPeriod.id, {
          name: computedName,
          period_type: periodType,
          start_date: startDate || editingPeriod.start_date,
          end_date: endDate || editingPeriod.end_date,
        });

        // Replace linked modules if this is an exam-type period
        if (needsModuleSelection) {
          await supabase.from('period_modules').delete().eq('period_id', editingPeriod.id);
          if (selectedModuleIds.length > 0) {
            const rows = selectedModuleIds.map(moduleId => ({
              period_id: editingPeriod.id,
              module_id: moduleId,
              coefficient: examCoefficients[moduleId] || 1,
            }));
            await supabase.from('period_modules').insert(rows);
          }
        }

        // BTS Blanc: persist écrit + oral selections
        if (needsBtsPartSelection) {
          await supabase.from('period_modules').delete().eq('period_id', editingPeriod.id);
          const rows: any[] = [];
          btsEcritIds.forEach((id) => rows.push({ period_id: editingPeriod.id, module_id: id, coefficient: btsEcritCoefs[id] || 1, exam_part: 'ecrit' }));
          btsOralIds.forEach((id) => rows.push({ period_id: editingPeriod.id, module_id: id, coefficient: btsOralCoefs[id] || 1, exam_part: 'oral' }));
          if (rows.length > 0) await supabase.from('period_modules').insert(rows);
        }
        return;
      }

      // === CREATE MODE ===
      const period = await createEvaluationPeriod({
        formation_id: formationId,
        name: computedName,
        period_type: periodType,
        start_date: startDate || new Date().toISOString().split('T')[0],
        end_date: endDate || new Date().toISOString().split('T')[0],
        order_index: existingPeriodsCount,
        is_locked: false,
      });

      if (needsModuleSelection && selectedModuleIds.length > 0 && period?.id) {
        const rows = selectedModuleIds.map(moduleId => ({
          period_id: period.id,
          module_id: moduleId,
          coefficient: examCoefficients[moduleId] || 1,
        }));
        await supabase.from('period_modules').insert(rows);
      }

      if (needsBtsPartSelection && period?.id) {
        const rows: any[] = [];
        btsEcritIds.forEach((id) => rows.push({ period_id: period.id, module_id: id, coefficient: btsEcritCoefs[id] || 1, exam_part: 'ecrit' }));
        btsOralIds.forEach((id) => rows.push({ period_id: period.id, module_id: id, coefficient: btsOralCoefs[id] || 1, exam_part: 'oral' }));
        if (rows.length > 0) await supabase.from('period_modules').insert(rows);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      queryClient.invalidateQueries({ queryKey: ['evaluation-periods'] });
      queryClient.invalidateQueries({ queryKey: ['period-modules'] });
      toast.success(
        isEditing
          ? `Periode "${computedName}" modifiee`
          : `Période "${computedName}" créée avec ${needsModuleSelection ? `${selectedModuleIds.length} matière(s)` : 'succès'}`
      );
      onClose();
      resetForm();
    },
    onError: (e: any) => toast.error(e.message || (isEditing ? 'Erreur lors de la modification' : 'Erreur lors de la creation')),
  });

  const resetForm = () => {
    setPeriodType('');
    setName('');
    setSemesterNumber('');
    setStartDate('');
    setEndDate('');
    setSelectedModuleIds([]);
    setExamCoefficients({});
    setModuleSearch('');
  };

  const isValid = periodType && (needsSemesterSelection ? !!semesterNumber : true) && (needsModuleSelection ? selectedModuleIds.length > 0 : true) && (needsBtsPartSelection ? (btsEcritIds.length + btsOralIds.length) > 0 : true);

  // BTS Blanc helper: toggle a module in a given part (ecrit/oral)
  const toggleBtsModule = (moduleId: string, part: 'ecrit' | 'oral') => {
    const ids = part === 'ecrit' ? btsEcritIds : btsOralIds;
    const setIds = part === 'ecrit' ? setBtsEcritIds : setBtsOralIds;
    const setCoefs = part === 'ecrit' ? setBtsEcritCoefs : setBtsOralCoefs;
    const mod = allModules.find((m: any) => m.id === moduleId);
    if (ids.includes(moduleId)) {
      setIds(ids.filter((i) => i !== moduleId));
      setCoefs((c) => { const n = { ...c }; delete n[moduleId]; return n; });
    } else {
      setIds([...ids, moduleId]);
      setCoefs((c) => ({ ...c, [moduleId]: mod?.coefficient || 1 }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className={`${needsModuleSelection && allModules.length > 0 ? 'sm:max-w-xl' : 'sm:max-w-md'} max-h-[85vh] overflow-hidden flex flex-col`}>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier la periode d'evaluation" : "Creer une periode d'evaluation"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 overflow-y-auto flex-1">
          {/* Type */}
          <div className="space-y-2">
            <Label>Type de periode</Label>
            <Select value={periodType} onValueChange={(v) => { setPeriodType(v); setName(''); setSemesterNumber(''); setSelectedModuleIds([]); }}>
              <SelectTrigger data-testid="period-type-select">
                <SelectValue placeholder="Choisir le type..." />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Semester number */}
          {needsSemesterSelection && (
            <div className="space-y-2">
              <Label>Numero du semestre</Label>
              <Select value={semesterNumber} onValueChange={setSemesterNumber}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 6 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>Semestre {i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label>Nom (optionnel)</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={computedName || 'Nom de la periode'} />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date de debut <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date de fin <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* Module selection (flat list) */}
          {needsModuleSelection && allModules.length > 0 && (
            <div className="space-y-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Matières concernées
                </Label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{selectedModuleIds.length}/{allModules.length}</Badge>
                  <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={selectAll}>Tout</Button>
                  <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={deselectAll}>Aucun</Button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={moduleSearch}
                  onChange={(e) => setModuleSearch(e.target.value)}
                  placeholder="Rechercher une matière..."
                  className="pl-8 h-8 text-sm"
                  data-testid="module-search"
                />
              </div>

              {/* Flat modules list */}
              <div className="max-h-[320px] overflow-y-auto space-y-0.5 border rounded-lg p-2 bg-muted/20">
                {visibleModules.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic px-2 py-3 text-center">Aucune matière trouvée.</p>
                ) : visibleModules.map((m: any) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors bg-background"
                    data-testid={`module-checkbox-${m.id}`}
                  >
                    <Checkbox
                      checked={selectedModuleIds.includes(m.id)}
                      onCheckedChange={() => toggleModule(m.id)}
                    />
                    <BookOpen className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                    <span className="text-sm flex-1">{m.title}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">coef {m.coefficient || 1}</span>
                    {selectedModuleIds.includes(m.id) && (
                      <div className="flex items-center gap-1 shrink-0">
                        <label className="text-[10px] text-amber-600 font-medium">Coeff période:</label>
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={examCoefficients[m.id] || 1}
                          onChange={(e) => setExamCoefficients(prev => ({ ...prev, [m.id]: Number(e.target.value) || 1 }))}
                          className="w-14 px-1.5 py-0.5 text-xs border border-amber-300 rounded bg-amber-50 text-amber-800 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          data-testid={`exam-coeff-${m.id}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {selectedModuleIds.length === 0 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  Sélectionnez au moins une matière pour cette période
                </p>
              )}
            </div>
          )}

          {/* BTS Blanc — Écrit + Oral dual selection (flat) */}
          {needsBtsPartSelection && allModules.length > 0 && (
            <div className="space-y-3 border-t pt-3" data-testid="bts-part-selection">
              <Label className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Épreuves BTS Blanc — Écrit & Oral
              </Label>
              <p className="text-xs text-muted-foreground">
                Sélectionnez les matières à évaluer pour l'épreuve écrite et pour l'épreuve orale. Une même matière peut apparaître dans les deux avec un coefficient distinct.
              </p>
              {(['ecrit', 'oral'] as const).map((part) => {
                const ids = part === 'ecrit' ? btsEcritIds : btsOralIds;
                const coefs = part === 'ecrit' ? btsEcritCoefs : btsOralCoefs;
                const setCoefs = part === 'ecrit' ? setBtsEcritCoefs : setBtsOralCoefs;
                const partLabel = part === 'ecrit' ? 'Écrit' : 'Oral';
                const partColor = part === 'ecrit' ? '#2563eb' : '#9333ea';
                return (
                  <div key={part} className="rounded-lg border bg-muted/10 overflow-hidden" data-testid={`bts-part-block-${part}`}>
                    <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ background: `${partColor}10` }}>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wide" style={{ background: partColor }}>
                        {partLabel}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {ids.length} matière{ids.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="p-2 max-h-[220px] overflow-y-auto space-y-0.5">
                      {visibleModules.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic px-2 py-2 text-center">Aucune matière.</p>
                      ) : visibleModules.map((m: any) => (
                        <div key={m.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/40 bg-background" data-testid={`bts-mod-${part}-${m.id}`}>
                          <Checkbox
                            checked={ids.includes(m.id)}
                            onCheckedChange={() => toggleBtsModule(m.id, part)}
                          />
                          <BookOpen className="h-3 w-3 text-primary/70 shrink-0" />
                          <span className="text-xs flex-1 truncate">{m.title}</span>
                          {ids.includes(m.id) && (
                            <div className="flex items-center gap-1 shrink-0">
                              <label className="text-[10px] text-muted-foreground">Coef:</label>
                              <input
                                type="number"
                                min="0.5"
                                step="0.5"
                                value={coefs[m.id] || 1}
                                onChange={(e) => setCoefs(prev => ({ ...prev, [m.id]: Number(e.target.value) || 1 }))}
                                className="w-12 px-1 py-0.5 text-xs border rounded"
                                data-testid={`bts-coef-${part}-${m.id}`}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {(btsEcritIds.length + btsOralIds.length) === 0 && (
                <p className="text-xs text-amber-600">Sélectionnez au moins une matière (Écrit ou Oral) pour la période.</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!isValid || createMutation.isPending}
            data-testid="create-period-submit"
          >
            {createMutation.isPending
              ? (isEditing ? 'Modification...' : 'Creation...')
              : (isEditing ? 'Enregistrer' : 'Creer la periode')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePeriodModal;
