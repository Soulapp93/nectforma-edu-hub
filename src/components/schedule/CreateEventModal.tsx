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
import { Plus, Calendar as CalendarIcon, Clock, MapPin, User, Book } from 'lucide-react';
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
    color: 'bg-blue-500'
  });
  const { toast } = useToast();

  const instructors = ['M. Dubois', 'Mme Martin', 'M. Durand', 'Mme Bernard', 'M. Petit', 'Mme Leroy'];
  const rooms = ['Salle A101', 'Salle B202', 'Salle C301', 'Salle D401', 'Atelier 1', 'Amphithéâtre'];
  const formations = ['Formation Marketing', 'Formation Technique', 'Formation Créative', 'Formation Expert'];
  const colors = [
    { name: 'Bleu', value: 'bg-blue-500' },
    { name: 'Violet', value: 'bg-purple-500' },
    { name: 'Vert', value: 'bg-green-500' },
    { name: 'Orange', value: 'bg-orange-500' },
    { name: 'Rose', value: 'bg-pink-500' },
    { name: 'Indigo', value: 'bg-indigo-500' },
    { name: 'Teal', value: 'bg-teal-500' },
    { name: 'Rouge', value: 'bg-red-500' },
  ];

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eventData.title || !eventData.date || !eventData.startTime || !eventData.endTime) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
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

    // Reset form
    setEventData({
      title: '',
      date: undefined,
      startTime: '',
      endTime: '',
      instructor: '',
      room: '',
      formation: '',
      description: '',
      color: 'bg-blue-500'
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
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Créer un nouveau cours</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Titre du cours */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="title" className="flex items-center">
                <Book className="h-4 w-4 mr-2" />
                Titre du cours *
              </Label>
              <Input
                id="title"
                placeholder="Ex: Introduction au Marketing Digital"
                value={eventData.title}
                onChange={(e) => setEventData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Date *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !eventData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {eventData.date ? format(eventData.date, "PPP", { locale: fr }) : "Sélectionner une date"}
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

            {/* Couleur */}
            <div className="space-y-2">
              <Label>Couleur</Label>
              <Select 
                value={eventData.color} 
                onValueChange={(value) => setEventData(prev => ({ ...prev, color: value }))}
              >
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full ${eventData.color} mr-2`} />
                      {colors.find(c => c.value === eventData.color)?.name}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {colors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full ${color.value} mr-2`} />
                        {color.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Heure de début */}
            <div className="space-y-2">
              <Label className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Heure de début *
              </Label>
              <Select 
                value={eventData.startTime} 
                onValueChange={(value) => setEventData(prev => ({ ...prev, startTime: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner l'heure" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Heure de fin */}
            <div className="space-y-2">
              <Label className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Heure de fin *
              </Label>
              <Select 
                value={eventData.endTime} 
                onValueChange={(value) => setEventData(prev => ({ ...prev, endTime: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner l'heure" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Formateur */}
            <div className="space-y-2">
              <Label className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Formateur
              </Label>
              <Select 
                value={eventData.instructor} 
                onValueChange={(value) => setEventData(prev => ({ ...prev, instructor: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un formateur" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((instructor) => (
                    <SelectItem key={instructor} value={instructor}>{instructor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Salle */}
            <div className="space-y-2">
              <Label className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Salle
              </Label>
              <Select 
                value={eventData.room} 
                onValueChange={(value) => setEventData(prev => ({ ...prev, room: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une salle" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room} value={room}>{room}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Formation */}
            <div className="md:col-span-2 space-y-2">
              <Label>Formation</Label>
              <Select 
                value={eventData.formation} 
                onValueChange={(value) => setEventData(prev => ({ ...prev, formation: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une formation" />
                </SelectTrigger>
                <SelectContent>
                  {formations.map((formation) => (
                    <SelectItem key={formation} value={formation}>{formation}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description du cours (optionnel)"
                value={eventData.description}
                onChange={(e) => setEventData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Créer le cours
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};