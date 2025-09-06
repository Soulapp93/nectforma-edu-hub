import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useFormations } from '@/hooks/useFormations';
import { useInstructors } from '@/hooks/useInstructors';
import { scheduleService } from '@/services/scheduleService';
import { toast } from 'sonner';

interface AddSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  scheduleId: string;
  formationId: string;
  selectedSlot: { date: string; time: string } | null;
}

const colors = [
  { value: '#3B82F6', label: 'Bleu' },
  { value: '#10B981', label: 'Vert' },
  { value: '#F59E0B', label: 'Orange' },
  { value: '#EF4444', label: 'Rouge' },
  { value: '#8B5CF6', label: 'Violet' },
  { value: '#EC4899', label: 'Rose' },
];

const AddSlotModal: React.FC<AddSlotModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  scheduleId,
  formationId,
  selectedSlot
}) => {
  const { formations } = useFormations();
  const { instructors } = useInstructors();
  const [loading, setLoading] = useState(false);

  const formation = formations.find(f => f.id === formationId);
  const modules = formation?.formation_modules || [];

  const [formData, setFormData] = useState({
    module_id: '',
    instructor_id: '',
    date: selectedSlot?.date || '',
    start_time: selectedSlot?.time || '',
    end_time: '',
    room: '',
    color: '#8B5CF6',
    notes: ''
  });

  React.useEffect(() => {
    if (selectedSlot) {
      setFormData(prev => ({
        ...prev,
        date: selectedSlot.date,
        start_time: selectedSlot.time,
        end_time: selectedSlot.time // Will be updated by user
      }));
    }
  }, [selectedSlot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.module_id || !formData.date || !formData.start_time || !formData.end_time) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.start_time >= formData.end_time) {
      toast.error('L\'heure de fin doit être postérieure à l\'heure de début');
      return;
    }

    setLoading(true);
    try {
      await scheduleService.createScheduleSlot({
        schedule_id: scheduleId,
        module_id: formData.module_id || undefined,
        instructor_id: formData.instructor_id || undefined,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        room: formData.room || undefined,
        color: formData.color,
        notes: formData.notes || undefined
      });
      
      setFormData({
        module_id: '',
        instructor_id: '',
        date: '',
        start_time: '',
        end_time: '',
        room: '',
        color: '#8B5CF6',
        notes: ''
      });
      onSuccess();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du créneau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un créneau</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="module">Nom du module *</Label>
              <Select value={formData.module_id} onValueChange={(value) => setFormData(prev => ({ ...prev, module_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Heure début *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">Heure fin *</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="room">Salle</Label>
              <Input
                id="room"
                value={formData.room}
                onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                placeholder="Salle A1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructor">Formateur</Label>
              <Select value={formData.instructor_id} onValueChange={(value) => setFormData(prev => ({ ...prev, instructor_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un formateur" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id}>
                      {instructor.first_name} {instructor.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Couleur du créneau</Label>
            <div className="flex space-x-2">
              {colors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === color.value ? 'border-gray-900' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notes additionnelles..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? 'Ajout...' : 'Ajouter le créneau'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSlotModal;