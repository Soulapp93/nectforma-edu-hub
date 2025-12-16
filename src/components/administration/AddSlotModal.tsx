import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, Users, UserX, Info } from 'lucide-react';
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
  { value: '#8B5CF6', label: 'Violet', bgClass: 'bg-violet-500' },
  { value: '#3B82F6', label: 'Bleu', bgClass: 'bg-blue-500' },
  { value: '#10B981', label: 'Vert', bgClass: 'bg-green-500' },
  { value: '#F59E0B', label: 'Orange', bgClass: 'bg-orange-500' },
  { value: '#EF4444', label: 'Rouge', bgClass: 'bg-red-500' },
  { value: '#EC4899', label: 'Rose', bgClass: 'bg-pink-500' },
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
    notes: '',
    session_type: 'encadree' as 'encadree' | 'autonomie'
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

  // Clear instructor when switching to autonomy mode
  React.useEffect(() => {
    if (formData.session_type === 'autonomie') {
      setFormData(prev => ({ ...prev, instructor_id: '' }));
    }
  }, [formData.session_type]);

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
        instructor_id: formData.session_type === 'encadree' ? (formData.instructor_id || undefined) : undefined,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        room: formData.room || undefined,
        color: formData.color,
        notes: formData.notes || undefined,
        session_type: formData.session_type
      });
      
      setFormData({
        module_id: '',
        instructor_id: '',
        date: '',
        start_time: '',
        end_time: '',
        room: '',
        color: '#8B5CF6',
        notes: '',
        session_type: 'encadree'
      });
      onSuccess();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du créneau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0">
        {/* En-tête moderne avec gradient violet */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">Ajouter un créneau</DialogTitle>
              <p className="text-violet-100 text-sm mt-1">
                Créer un nouveau créneau dans votre emploi du temps
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Type de session */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Type de session *
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, session_type: 'encadree' }))}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                    formData.session_type === 'encadree'
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-violet-300'
                  }`}
                >
                  <Users className={`h-6 w-6 ${formData.session_type === 'encadree' ? 'text-violet-600' : 'text-gray-400'}`} />
                  <span className={`font-medium text-sm ${formData.session_type === 'encadree' ? 'text-violet-700 dark:text-violet-300' : 'text-gray-600 dark:text-gray-400'}`}>
                    Session encadrée
                  </span>
                  <span className="text-xs text-gray-500 text-center">Avec formateur • QR Code autorisé</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, session_type: 'autonomie' }))}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                    formData.session_type === 'autonomie'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <UserX className={`h-6 w-6 ${formData.session_type === 'autonomie' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`font-medium text-sm ${formData.session_type === 'autonomie' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
                    Session en autonomie
                  </span>
                  <span className="text-xs text-gray-500 text-center">Sans formateur • Lien uniquement</span>
                </button>
              </div>
              {formData.session_type === 'autonomie' && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-700 dark:text-blue-300">
                    Les sessions en autonomie ne permettent pas l'utilisation du QR Code. L'émargement se fait uniquement via l'envoi de liens par l'administration.
                  </span>
                </div>
              )}
            </div>

            {/* Nom du module */}
            <div className="space-y-2">
              <Label htmlFor="module" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Nom du module *
              </Label>
              <Select value={formData.module_id} onValueChange={(value) => setFormData(prev => ({ ...prev, module_id: value }))}>
                <SelectTrigger className="h-11 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
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

            {/* Date et heures */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="h-11 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_time" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Début *
                </Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="h-11 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Fin *
                </Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="h-11 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>
            </div>

            {/* Salle et Formateur */}
            <div className={`grid gap-4 ${formData.session_type === 'encadree' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div className="space-y-2">
                <Label htmlFor="room" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Salle
                </Label>
                <Input
                  id="room"
                  value={formData.room}
                  onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                  placeholder="Salle A1"
                  className="h-11 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>

              {/* Formateur - affiché uniquement pour les sessions encadrées */}
              {formData.session_type === 'encadree' && (
                <div className="space-y-2">
                  <Label htmlFor="instructor" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Formateur
                  </Label>
                  <Select value={formData.instructor_id} onValueChange={(value) => setFormData(prev => ({ ...prev, instructor_id: value }))}>
                    <SelectTrigger className="h-11 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <SelectValue placeholder="Choisir un formateur" />
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
              )}
            </div>

            {/* Couleur du créneau */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Couleur du créneau
              </Label>
              <div className="flex space-x-3 p-2">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-10 h-10 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-lg ${
                      color.bgClass
                    } ${
                      formData.color === color.value 
                        ? 'ring-4 ring-gray-300 dark:ring-gray-600 scale-110' 
                        : 'ring-2 ring-gray-200 dark:ring-gray-700 hover:ring-gray-300'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            {/* Notes complémentaires */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Notes complémentaires
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Ajouter des informations supplémentaires sur ce cours..."
                rows={3}
                className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 resize-none"
              />
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="px-6 h-11 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="px-6 h-11 bg-violet-600 hover:bg-violet-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? 'Ajout...' : 'Ajouter le créneau'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddSlotModal;