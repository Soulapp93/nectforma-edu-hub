
import React, { useState } from 'react';
import { X, Users, Calendar, Copy } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { promotionService, Promotion } from '@/services/promotionService';
import { toast } from 'sonner';

interface CreatePromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  formationId: string;
  formationTitle: string;
  establishmentId: string;
  existingPromotions?: Promotion[];
}

const CreatePromotionModal: React.FC<CreatePromotionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  formationId,
  formationTitle,
  establishmentId,
  existingPromotions = []
}) => {
  const currentYear = new Date().getFullYear();
  const [mode, setMode] = useState<'create' | 'duplicate'>('create');
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: `Promotion ${currentYear}-${currentYear + 1}`,
    academic_year: `${currentYear}-${currentYear + 1}`,
    start_date: `${currentYear}-09-01`,
    end_date: `${currentYear + 1}-06-30`,
    capacity: 30
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Le nom de la promotion est requis');
      return;
    }

    try {
      setLoading(true);

      if (mode === 'duplicate' && selectedSourceId) {
        await promotionService.duplicatePromotion(selectedSourceId, formData);
        toast.success('Promotion dupliquée avec succès');
      } else {
        await promotionService.createPromotion({
          formation_id: formationId,
          name: formData.name,
          academic_year: formData.academic_year,
          start_date: formData.start_date,
          end_date: formData.end_date,
          capacity: formData.capacity,
          establishment_id: establishmentId,
          status: 'active'
        });
        toast.success('Promotion créée avec succès');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const academicYears = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - 1 + i;
    return `${year}-${year + 1}`;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg border-2 border-primary/20">
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary-foreground" />
              </div>
              Nouvelle promotion
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{formationTitle}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-primary/10 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Mode selector */}
          {existingPromotions.length > 0 && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === 'create' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('create')}
                className="flex-1"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Créer
              </Button>
              <Button
                type="button"
                variant={mode === 'duplicate' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('duplicate')}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Dupliquer
              </Button>
            </div>
          )}

          {mode === 'duplicate' && existingPromotions.length > 0 && (
            <div className="space-y-2">
              <Label>Promotion source</Label>
              <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner la promotion à dupliquer" />
                </SelectTrigger>
                <SelectContent>
                  {existingPromotions.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.academic_year})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Nom de la promotion *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Promotion 2024-2025"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Année académique</Label>
            <Select 
              value={formData.academic_year} 
              onValueChange={(v) => {
                setFormData(prev => ({ 
                  ...prev, 
                  academic_year: v,
                  name: `Promotion ${v}`,
                  start_date: `${v.split('-')[0]}-09-01`,
                  end_date: `${v.split('-')[1]}-06-30`
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de début</Label>
              <DatePicker
                value={formData.start_date}
                onChange={(v) => setFormData(prev => ({ ...prev, start_date: v }))}
                placeholder="Début"
              />
            </div>
            <div className="space-y-2">
              <Label>Date de fin</Label>
              <DatePicker
                value={formData.end_date}
                onChange={(v) => setFormData(prev => ({ ...prev, end_date: v }))}
                placeholder="Fin"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Capacité (nombre d'étudiants)</Label>
            <Input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 30 }))}
              min={1}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || (mode === 'duplicate' && !selectedSourceId)}>
              {loading ? 'Création...' : mode === 'duplicate' ? 'Dupliquer' : 'Créer la promotion'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePromotionModal;
