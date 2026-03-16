import React, { useState } from 'react';
import { X, Copy, Calendar, GraduationCap } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { formationService } from '@/services/formationService';
import { toast } from 'sonner';

interface DuplicateFormationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  formation: { id: string; title: string; academic_year?: string } | null;
}

const generateAcademicYears = () => {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let i = 0; i <= 4; i++) {
    const y = currentYear + i;
    years.push(`${y}-${y + 1}`);
  }
  return years;
};

const DuplicateFormationModal: React.FC<DuplicateFormationModalProps> = ({
  isOpen, onClose, onSuccess, formation
}) => {
  const currentYear = new Date().getFullYear();
  const [academicYear, setAcademicYear] = useState(`${currentYear + 1}-${currentYear + 2}`);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const academicYears = generateAcademicYears();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formation) return;

    try {
      setLoading(true);
      const defaultStart = `${academicYear.split('-')[0]}-09-01`;
      const defaultEnd = `${academicYear.split('-')[1]}-06-30`;

      await formationService.duplicateFormationForNewYear(
        formation.id,
        academicYear,
        startDate || defaultStart,
        endDate || defaultEnd
      );

      toast.success(`Formation dupliquée pour l'année ${academicYear}`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la duplication');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !formation) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md border-2 border-primary/20">
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Copy className="h-5 w-5 text-primary" />
            Nouvelle année académique
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-muted/30 rounded-xl p-3 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{formation.title}</span>
            </div>
            {formation.academic_year && (
              <span className="text-xs text-muted-foreground">Année actuelle : {formation.academic_year}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              Nouvelle année académique *
            </label>
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger className="h-11 rounded-xl border-2 border-primary/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Date début</label>
              <DatePicker value={startDate} onChange={setStartDate} placeholder="Optionnel" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Date fin</label>
              <DatePicker value={endDate} onChange={setEndDate} placeholder="Optionnel" />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Les modules, sous-modules et la structure seront dupliqués. Les étudiants et notes ne seront pas copiés.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={loading}
              className="px-4 py-2 text-foreground border border-border rounded-xl hover:bg-muted transition-colors text-sm">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 text-sm font-medium transition-all">
              {loading ? 'Duplication...' : 'Dupliquer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DuplicateFormationModal;
