import React, { useState, useEffect } from 'react';
import { X, Calendar, Plus, GraduationCap, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { promotionService, Promotion } from '@/services/promotionService';

interface Props {
  open: boolean;
  onClose: () => void;
  formationId: string;
  formationTitle: string;
  establishmentId: string;
  /** When provided, the modal pre-fills fields from this promotion (duplication mode). */
  duplicateFrom?: Promotion | null;
  onCreated: () => void;
}

const generateYears = (offset: number = -1, span: number = 8) => {
  const current = new Date().getFullYear();
  return Array.from({ length: span }, (_, i) => current + offset + i);
};

const CreatePromotionModal: React.FC<Props> = ({
  open,
  onClose,
  formationId,
  formationTitle,
  establishmentId,
  duplicateFrom = null,
  onCreated,
}) => {
  const isDuplicate = !!duplicateFrom;
  const years = generateYears();
  const currentYear = new Date().getFullYear();

  const [yearStart, setYearStart] = useState<number>(currentYear);
  const [yearEnd, setYearEnd] = useState<number>(currentYear + 1);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Reset / prefill on open
  useEffect(() => {
    if (!open) return;
    if (duplicateFrom) {
      // Duplication: shift by +1 year, keep nothing else (start/end dates must be re-entered)
      const newStartYear = (duplicateFrom.academic_year_start || currentYear) + 1;
      const newEndYear = (duplicateFrom.academic_year_end || currentYear + 1) + 1;
      setYearStart(newStartYear);
      setYearEnd(newEndYear);
      setStartDate(`${newStartYear}-09-01`);
      setEndDate(`${newEndYear}-06-30`);
    } else {
      setYearStart(currentYear);
      setYearEnd(currentYear + 1);
      setStartDate(`${currentYear}-09-01`);
      setEndDate(`${currentYear + 1}-06-30`);
    }
  }, [open, duplicateFrom, currentYear]);

  // Auto-suggest dates when year changes (only update if date matches the previous year boundary)
  useEffect(() => {
    if (!open) return;
    setStartDate(prev => {
      // If user hasn't customised the date, sync it with the new year
      if (!prev || prev.startsWith(String(yearStart))) return prev || `${yearStart}-09-01`;
      // Otherwise, keep the user's custom date
      return prev;
    });
    setEndDate(prev => {
      if (!prev || prev.startsWith(String(yearEnd))) return prev || `${yearEnd}-06-30`;
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearStart, yearEnd, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (yearEnd <= yearStart) {
      toast.error("L'année de fin doit être supérieure à l'année de début");
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Les dates de début et de fin sont obligatoires');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      toast.error('La date de fin doit être postérieure à la date de début');
      return;
    }

    try {
      setSaving(true);
      await promotionService.createPromotionWithResources({
        formationId,
        formationTitle,
        establishmentId,
        academicYear: `${yearStart}-${yearEnd}`,
        startDate,
        endDate,
      });
      toast.success(
        isDuplicate
          ? 'Promotion dupliquée avec succès'
          : 'Promotion créée avec son emploi du temps et son cahier de texte'
      );
      onCreated();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Erreur lors de la création de la promotion');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md" data-testid="create-promotion-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDuplicate ? <Plus className="h-5 w-5 text-primary" /> : <GraduationCap className="h-5 w-5 text-primary" />}
            {isDuplicate ? 'Dupliquer la promotion' : 'Créer une nouvelle promotion'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted/30 rounded-lg p-3 border border-border text-sm">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">{formationTitle}</span>
            </div>
            {isDuplicate && duplicateFrom && (
              <p className="text-xs text-muted-foreground mt-1">
                Promotion source : <strong>{duplicateFrom.name}</strong>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Année de début *</Label>
              <Select value={String(yearStart)} onValueChange={(v) => setYearStart(parseInt(v))}>
                <SelectTrigger className="h-10" data-testid="promotion-year-start-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Année de fin *</Label>
              <Select value={String(yearEnd)} onValueChange={(v) => setYearEnd(parseInt(v))}>
                <SelectTrigger className="h-10" data-testid="promotion-year-end-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Date de début *
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                data-testid="promotion-start-date"
              />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Date de fin *
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                data-testid="promotion-end-date"
              />
            </div>
          </div>

          {isDuplicate && (
            <p className="text-xs text-muted-foreground italic">
              La duplication réutilise les modules, formateurs et configuration de la formation.
              Seules les années et dates sont modifiées.
            </p>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving} data-testid="promotion-submit-btn">
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isDuplicate ? 'Duplication...' : 'Création...'}</>
              ) : (
                isDuplicate ? 'Dupliquer' : 'Créer la promotion'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePromotionModal;
