
import React, { useState } from 'react';
import { X, Calendar, Clock, Users, Video } from 'lucide-react';
import { useCreateVirtualClass, useInstructors, useFormationsForSelect } from '@/hooks/useVirtualClasses';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (classData: any) => void;
}

const CreateClassModal: React.FC<CreateClassModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { userId: currentUserId, userRole } = useCurrentUser();
  const { data: instructors = [] } = useInstructors();
  const { data: formations = [] } = useFormationsForSelect();
  const createClassMutation = useCreateVirtualClass();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructor_id: userRole === 'Formateur' ? currentUserId : '',
    formation_id: '',
    date: '',
    start_time: '',
    end_time: '',
    max_participants: 25,
    recording_enabled: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createClassMutation.mutateAsync(formData);
      onSubmit?.(formData);
      onClose();
      setFormData({
        title: '',
        description: '',
        instructor_id: userRole === 'Formateur' ? currentUserId : '',
        formation_id: '',
        date: '',
        start_time: '',
        end_time: '',
        max_participants: 25,
        recording_enabled: false,
      });
    } catch (error) {
      console.error('Error creating class:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle classe virtuelle</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre du cours</Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="formation">Formation</Label>
                <Select value={formData.formation_id} onValueChange={(value) => setFormData({ ...formData, formation_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une formation" />
                  </SelectTrigger>
                  <SelectContent>
                    {formations.map((formation) => (
                      <SelectItem key={formation.id} value={formation.id}>
                        {formation.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="instructor">Formateur</Label>
                <Select 
                  value={formData.instructor_id} 
                  onValueChange={(value) => setFormData({ ...formData, instructor_id: value })}
                  disabled={userRole === 'Formateur'}
                >
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="start_time" className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Heure de début
                </Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_time" className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Heure de fin
                </Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="max_participants" className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Nombre maximum de participants
              </Label>
              <Input
                id="max_participants"
                type="number"
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                min="1"
                max="100"
              />
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="recording"
                    checked={formData.recording_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, recording_enabled: checked })}
                  />
                  <Label htmlFor="recording" className="flex items-center">
                    <Video className="h-4 w-4 mr-1" />
                    Activer l'enregistrement automatique
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createClassMutation.isPending}
            >
              {createClassMutation.isPending ? 'Création...' : 'Créer la classe'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClassModal;
