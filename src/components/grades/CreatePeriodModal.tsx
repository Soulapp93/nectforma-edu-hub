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
import { teachingUnitService } from '@/services/teachingUnitService';
import { BookOpen, Search, Layers, ChevronDown, ChevronRight } from 'lucide-react';

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
        .select('module_id, coefficient')
        .eq('period_id', editingPeriod.id);
      return data || [];
    },
    enabled: !!editingPeriod?.id && isOpen,
  });

  // Sync linked modules into local state when query resolves
  useEffect(() => {
    if (!linkedModules) return;
    const ids = linkedModules.map((r: any) => r.module_id);
    const coeffs: Record<string, number> = {};
    linkedModules.forEach((r: any) => { coeffs[r.module_id] = r.coefficient || 1; });
    setSelectedModuleIds(ids);
    setExamCoefficients(coeffs);
  }, [linkedModules]);

  const needsSemesterSelection = periodType === 'semestre';
  const needsModuleSelection = PERIOD_OPTIONS.find(o => o.value === periodType)?.needsModules || false;

  // Fetch all modules for this formation
  const { data: allModules = [] } = useQuery({
    queryKey: ['formation-modules', formationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('formation_modules')
        .select('id, title, semester, coefficient, teaching_unit_id')
        .eq('formation_id', formationId)
        .order('order_index', { ascending: true });
      return data || [];
    },
    enabled: !!formationId && isOpen,
  });

  // Fetch UEs for this formation
  const { data: teachingUnits = [] } = useQuery({
    queryKey: ['teaching-units', formationId],
    queryFn: () => teachingUnitService.listForFormation(formationId),
    enabled: !!formationId && isOpen,
  });

  // Group modules by UE
  const modulesByUE = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const mod of allModules as any[]) {
      const k = mod.teaching_unit_id || '_unassigned';
      const arr = map.get(k) || [];
      arr.push(mod);
      map.set(k, arr);
    }
    return map;
  }, [allModules]);

  // UE expansion state (default: all open)
  const [collapsedUEs, setCollapsedUEs] = useState<Record<string, boolean>>({});
  const toggleUECollapsed = (ueId: string) => setCollapsedUEs((p) => ({ ...p, [ueId]: !p[ueId] }));

  // (Note: selection helpers now operate at UE level via selectByUE — see below)

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

  const selectByUE = (ueId: string) => {
    const ueModIds = (modulesByUE.get(ueId) || []).map((m: any) => m.id);
    const allSelected = ueModIds.every((id) => selectedModuleIds.includes(id));
    if (allSelected) {
      // Deselect all matières of this UE
      setSelectedModuleIds((prev) => prev.filter((id) => !ueModIds.includes(id)));
      setExamCoefficients((c) => {
        const n = { ...c };
        ueModIds.forEach((id) => delete n[id]);
        return n;
      });
    } else {
      // Select all matières of this UE
      setSelectedModuleIds((prev) => [...new Set([...prev, ...ueModIds])]);
      setExamCoefficients((c) => {
        const n = { ...c };
        ueModIds.forEach((id) => {
          const mod = allModules.find((m: any) => m.id === id);
          if (!(id in n)) n[id] = mod?.coefficient || 1;
        });
        return n;
      });
    }
  };

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

  const isValid = periodType && (needsSemesterSelection ? !!semesterNumber : true) && (needsModuleSelection ? selectedModuleIds.length > 0 : true);

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

          {/* Module selection grouped by UE */}
          {needsModuleSelection && allModules.length > 0 && (
            <div className="space-y-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Unités d'enseignement & matières concernées
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

              {/* Modules grouped by UE */}
              <div className="max-h-[320px] overflow-y-auto space-y-2 border rounded-lg p-2 bg-muted/20">
                {[...teachingUnits, null].map((ue) => {
                  const ueKey = ue?.id || '_unassigned';
                  const ueModules = modulesByUE.get(ueKey) || [];
                  const visibleModules = ueModules.filter((m: any) =>
                    !moduleSearch || m.title.toLowerCase().includes(moduleSearch.toLowerCase())
                  );
                  if (visibleModules.length === 0) return null;
                  const allUESelected = visibleModules.every((m: any) => selectedModuleIds.includes(m.id));
                  const someUESelected = visibleModules.some((m: any) => selectedModuleIds.includes(m.id));
                  const isCollapsed = collapsedUEs[ueKey] === true;
                  return (
                    <div key={ueKey} className="border border-border/60 rounded-md bg-background overflow-hidden" data-testid={`period-ue-block-${ueKey}`}>
                      {/* UE header */}
                      <div
                        className="flex items-center gap-2 px-2.5 py-2 bg-primary/5 border-b border-border/50 cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={() => toggleUECollapsed(ueKey)}
                      >
                        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                        <Checkbox
                          checked={allUESelected ? true : someUESelected ? 'indeterminate' as any : false}
                          onCheckedChange={(e) => { e as any; selectByUE(ueKey); }}
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`period-ue-checkbox-${ueKey}`}
                        />
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-bold text-foreground">
                          {ue ? ue.title : 'Matières non rattachées'}
                        </span>
                        {ue?.code && <Badge variant="outline" className="text-[10px]">{ue.code}</Badge>}
                        <Badge variant="secondary" className="text-[10px] ml-auto">
                          {visibleModules.filter((m: any) => selectedModuleIds.includes(m.id)).length}/{visibleModules.length}
                        </Badge>
                      </div>

                      {/* Matières list */}
                      {!isCollapsed && (
                        <div className="space-y-0.5 p-1">
                          {visibleModules.map((m: any) => (
                            <div
                              key={m.id}
                              className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
                              data-testid={`module-checkbox-${m.id}`}
                            >
                              <Checkbox
                                checked={selectedModuleIds.includes(m.id)}
                                onCheckedChange={() => toggleModule(m.id)}
                              />
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
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedModuleIds.length === 0 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  Sélectionnez au moins une matière (ou une UE entière) pour cette période
                </p>
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
