import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface AbsenceReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reasonType: string, reason: string) => Promise<void>;
  currentReason?: string;
  currentReasonType?: string;
  studentName: string;
  mode?: 'absence' | 'retard';
}

const ABSENCE_REASONS = [
  { value: 'arret_maladie', label: 'Arrêt maladie' },
  { value: 'probleme_transport', label: 'Problème / retard de transport' },
  { value: 'raison_familiale', label: 'Raison familiale' },
  { value: 'en_entreprise', label: 'En entreprise' },
  { value: 'mission_professionnelle', label: 'Mission professionnelle' },
  { value: 'stage', label: 'Stage' },
  { value: 'rendez_vous_medical', label: 'Rendez-vous médical' },
  { value: 'convocation_officielle', label: 'Convocation officielle' },
  { value: 'conge', label: 'Congé' },
  { value: 'injustifie', label: 'Injustifié' },
  { value: 'autre', label: 'Autre' }
];

const DELAY_REASONS = [
  { value: 'probleme_transport', label: 'Problème / retard de transport' },
  { value: 'raison_familiale', label: 'Raison familiale' },
  { value: 'rendez_vous_medical', label: 'Rendez-vous médical' },
  { value: 'sortie_entreprise', label: 'Sortie entreprise tardive' },
  { value: 'probleme_technique', label: 'Problème technique' },
  { value: 'intemperies', label: 'Intempéries' },
  { value: 'autre', label: 'Autre' }
];

const AbsenceReasonModal: React.FC<AbsenceReasonModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentReason = '',
  currentReasonType = '',
  studentName,
  mode = 'absence'
}) => {
  const [reasonType, setReasonType] = useState(currentReasonType);
  const [reason, setReason] = useState(currentReason);
  const [saving, setSaving] = useState(false);

  const reasons = mode === 'retard' ? DELAY_REASONS : ABSENCE_REASONS;
  const title = mode === 'retard' ? 'Motif du retard' : "Motif d'absence";

  useEffect(() => {
    setReasonType(currentReasonType);
    setReason(currentReason);
  }, [currentReasonType, currentReason, isOpen]);

  const handleSave = async () => {
    if (!reasonType) {
      toast.error('Veuillez sélectionner un motif');
      return;
    }

    if (reasonType === 'autre' && !reason.trim()) {
      toast.error('Veuillez préciser le motif');
      return;
    }

    try {
      setSaving(true);
      await onSave(reasonType, reason);
      toast.success('Motif mis à jour');
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du motif');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Étudiant : <span className="font-medium">{studentName}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Motif *
            </label>
            <Select value={reasonType} onValueChange={setReasonType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un motif" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(reasonType === 'autre' || reason) && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                {reasonType === 'autre' ? 'Précisez le motif *' : 'Commentaire additionnel'}
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={reasonType === 'autre' ? 'Saisissez le motif...' : 'Détails supplémentaires (optionnel)'}
                rows={3}
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AbsenceReasonModal;
