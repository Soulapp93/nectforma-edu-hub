import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CreateEventModalProps {
  onEventCreated: (event: ScheduleEvent) => void;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  instructor: string;
  room: string;
  formation: string;
  description?: string;
  color: string;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ onEventCreated }) => {
  const [open, setOpen] = useState(false);
  const [eventData, setEventData] = useState({
    title: '',
    date: undefined as Date | undefined,
    startTime: '',
    endTime: '',
    instructor: '',
    room: '',
    formation: '',
    description: '',
    color: '#8B5CF6' // Couleur primaire de l'application par défaut
  });
  const { toast } = useToast();

  const modules = [
    'Sélectionner un module',
    'Les absences',
    'Marketing Digital',
    'Développement Web',
    'Gestion de Projet',
    'Communication',
    'Design UX/UI'
  ];

  const instructors = [
    'Sélectionner un formateur',
    'Formateur Demo',
    'M. Dubois',
    'Mme Martin', 
    'M. Durand',
    'Mme Bernard'
  ];

  const rooms = ['Salle A1', 'Salle B2', 'Salle C3', 'Amphithéâtre', 'Atelier'];

  const colors = [
    '#8B5CF6', // Violet (couleur de l'app)
    '#3B82F6', // Bleu
    '#10B981', // Vert
    '#F59E0B', // Orange
    '#EF4444', // Rouge
    '#EC4899'  // Rose
  ];

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', eventData);
    
    // Validation avec logs détaillés
    if (!eventData.formation) {
      console.log('Formation missing');
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un module.",
        variant: "destructive",
      });
      return;
    }
    
    if (!eventData.date) {
      console.log('Date missing');
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une date.",
        variant: "destructive",
      });
      return;
    }
    
    if (!eventData.startTime) {
      console.log('Start time missing');
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une heure de début.",
        variant: "destructive",
      });
      return;
    }
    
    if (!eventData.endTime) {
      console.log('End time missing');
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une heure de fin.",
        variant: "destructive",
      });
      return;
    }

    const newEvent: ScheduleEvent = {
      id: Date.now().toString(),
      title: eventData.title,
      date: eventData.date,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      instructor: eventData.instructor,
      room: eventData.room,
      formation: eventData.formation,
      description: eventData.description,
      color: eventData.color
    };

    onEventCreated(newEvent);

    toast({
      title: "Cours créé",
      description: "Le nouveau cours a été ajouté avec succès.",
    });

    setEventData({
      title: '',
      date: undefined,
      startTime: '',
      endTime: '',
      instructor: '',
      room: '',
      formation: '',
      description: '',
      color: '#8B5CF6' // Couleur primaire de l'application par défaut
    });
    
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau cours
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md p-0 bg-white rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Ajouter un créneau
          </DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setOpen(false)}
            className="h-8 w-8 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Nom du module */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Nom du module *
            </Label>
            <Select 
              value={eventData.formation} 
              onValueChange={(value) => setEventData(prev => ({ ...prev, formation: value, title: value }))}
            >
              <SelectTrigger className="w-full bg-purple-50 border-purple-200 text-purple-700 focus:border-purple-300">
                <SelectValue placeholder="Sélectionner un module" />
              </SelectTrigger>
              <SelectContent>
                {modules.slice(1).map((module) => (
                  <SelectItem key={module} value={module}>{module}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date et Heures */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-center text-xs px-2 py-2 h-auto"
                  >
                    {eventData.date ? format(eventData.date, "dd/MM/yyyy") : "Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={eventData.date}
                    onSelect={(date) => setEventData(prev => ({ ...prev, date }))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Heure début *</Label>
              <Select 
                value={eventData.startTime} 
                onValueChange={(value) => setEventData(prev => ({ ...prev, startTime: value }))}
              >
                <SelectTrigger className="w-full text-xs px-2 py-2 h-auto">
                  <SelectValue placeholder="09:00" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Heure fin *</Label>
              <Select 
                value={eventData.endTime} 
                onValueChange={(value) => setEventData(prev => ({ ...prev, endTime: value }))}
              >
                <SelectTrigger className="w-full text-xs px-2 py-2 h-auto">
                  <SelectValue placeholder="09:00" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Salle et Formateur */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Salle</Label>
              <Input
                placeholder="Salle A1"
                value={eventData.room}
                onChange={(e) => setEventData(prev => ({ ...prev, room: e.target.value }))}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Formateur</Label>
              <Select 
                value={eventData.instructor} 
                onValueChange={(value) => setEventData(prev => ({ ...prev, instructor: value }))}
              >
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Sélectionner un formateur" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.slice(1).map((instructor) => (
                    <SelectItem key={instructor} value={instructor}>{instructor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Couleur du créneau */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Couleur du créneau</Label>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setEventData(prev => ({ ...prev, color: color }))}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all",
                    eventData.color === color ? "border-gray-900 scale-110" : "border-gray-200"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Notes</Label>
            <Textarea
              placeholder="Notes complémentaires..."
              value={eventData.description}
              onChange={(e) => setEventData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              Ajouter le créneau
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};