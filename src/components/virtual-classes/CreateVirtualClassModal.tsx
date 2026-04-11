import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { virtualClassService } from '@/services/virtualClassService';

interface Props {
  open: boolean;
  onClose: () => void;
  establishmentId: string;
  formations: any[];
  zoomConnected: boolean;
  onCreated: () => void;
}

export const CreateVirtualClassModal: React.FC<Props> = ({
  open,
  onClose,
  establishmentId,
  formations,
  zoomConnected,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState('60');
  const [provider, setProvider] = useState<'zoom'>('zoom');
  const [formationId, setFormationId] = useState('');
  const [autoCreate, setAutoCreate] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title || !date || !time) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }

    setSaving(true);
    try {
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
      await virtualClassService.createVirtualClass({
        establishment_id: establishmentId,
        title,
        description,
        scheduled_at: scheduledAt,
        duration: parseInt(duration),
        provider,
        formation_id: formationId || undefined,
        auto_create_meeting: autoCreate && zoomConnected,
      });
      toast.success('Classe virtuelle creee');
      onClose();
      onCreated();
      setTitle(''); setDescription(''); setDate(''); setTime('09:00'); setDuration('60'); setFormationId('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvelle classe virtuelle</DialogTitle>
        </DialogHeader>
        <div className="space-y-4" aria-describedby="vc-form-description">
          <span id="vc-form-description" className="sr-only">Formulaire de creation d'une classe virtuelle</span>
          <div>
            <Label>Titre *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Cours de mathematiques" data-testid="vc-title-input" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="vc-date-input" />
            </div>
            <div>
              <Label>Heure *</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} data-testid="vc-time-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Duree (minutes)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">1h</SelectItem>
                  <SelectItem value="90">1h30</SelectItem>
                  <SelectItem value="120">2h</SelectItem>
                  <SelectItem value="180">3h</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fournisseur</Label>
              <Select value={provider} onValueChange={(v: any) => setProvider(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="zoom">Zoom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {formations.length > 0 && (
            <div>
              <Label>Formation (optionnel)</Label>
              <Select value={formationId} onValueChange={setFormationId}>
                <SelectTrigger><SelectValue placeholder="Selectionner une formation" /></SelectTrigger>
                <SelectContent>
                  {formations.map((f: any) => (
                    <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {zoomConnected && (
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div>
                <p className="text-sm font-medium">Creer automatiquement la reunion Zoom</p>
                <p className="text-xs text-muted-foreground">Le lien sera genere automatiquement</p>
              </div>
              <Switch checked={autoCreate} onCheckedChange={setAutoCreate} />
            </div>
          )}
          {!zoomConnected && (
            <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
              Zoom n'est pas connecte. La classe sera creee sans reunion Zoom. Configurez Zoom dans l'onglet Integrations.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={saving} data-testid="vc-submit-btn">
            {saving ? 'Creation...' : 'Creer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
