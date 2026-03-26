import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createEvaluationPeriod } from '@/services/gradesService';

const PERIOD_OPTIONS = [
  { value: 'semestre', label: 'Semestre' },
  { value: 'trimestre', label: 'Trimestre' },
  { value: 'examen_blanc', label: 'Examen Blanc' },
  { value: 'examen_final', label: 'Examen Final' },
  { value: 'partiels', label: 'Partiels' },
  { value: 'rattrapage', label: 'Rattrapage' },
  { value: 'custom', label: 'Personnalisé' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  formationId: string;
  semestersCount: number;
  existingPeriodsCount: number;
}

const CreatePeriodModal: React.FC<Props> = ({ isOpen, onClose, formationId, semestersCount, existingPeriodsCount }) => {
  const queryClient = useQueryClient();
  const [periodType, setPeriodType] = useState('');
  const [name, setName] = useState('');
  const [semesterNumber, setSemesterNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const needsSemesterSelection = periodType === 'semestre';

  const computedName = React.useMemo(() => {
    if (name) return name;
    if (periodType === 'semestre' && semesterNumber) return `Semestre ${semesterNumber}`;
    const opt = PERIOD_OPTIONS.find(o => o.value === periodType);
    return opt?.label || '';
  }, [name, periodType, semesterNumber]);

  const createMutation = useMutation({
    mutationFn: async () => {
      await createEvaluationPeriod({
        formation_id: formationId,
        name: computedName,
        period_type: periodType,
        start_date: startDate || new Date().toISOString().split('T')[0],
        end_date: endDate || new Date().toISOString().split('T')[0],
        order_index: existingPeriodsCount,
        is_locked: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      queryClient.invalidateQueries({ queryKey: ['evaluation-periods'] });
      toast.success(`Période "${computedName}" créée avec succès`);
      onClose();
      resetForm();
    },
    onError: (e: any) => toast.error(e.message || 'Erreur lors de la création'),
  });

  const resetForm = () => {
    setPeriodType('');
    setName('');
    setSemesterNumber('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer une période d'évaluation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Type de période</Label>
            <Select value={periodType} onValueChange={(v) => { setPeriodType(v); setName(''); setSemesterNumber(''); }}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir le type..." />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needsSemesterSelection && (
            <div className="space-y-2">
              <Label>Numéro du semestre</Label>
              <Select value={semesterNumber} onValueChange={setSemesterNumber}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: semestersCount }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>Semestre {i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Nom (optionnel)</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={computedName || 'Nom de la période'}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date de début <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date de fin <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!periodType || createMutation.isPending || (needsSemesterSelection && !semesterNumber)}
          >
            {createMutation.isPending ? 'Création...' : 'Créer la période'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePeriodModal;
