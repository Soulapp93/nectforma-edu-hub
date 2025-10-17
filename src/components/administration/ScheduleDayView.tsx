import React from 'react';
import { Clock, MapPin, User, Calendar, List } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScheduleSlot } from '@/services/scheduleService';
import SlotActionMenu from './SlotActionMenu';

interface ScheduleDayViewProps {
  selectedDate: Date;
  slots: ScheduleSlot[];
  onEditSlot?: (slot: ScheduleSlot) => void;
  onDuplicateSlot?: (slot: ScheduleSlot) => void;
  onDeleteSlot?: (slot: ScheduleSlot) => void;
}

export const ScheduleDayView: React.FC<ScheduleDayViewProps> = ({ 
  selectedDate, 
  slots, 
  onEditSlot,
  onDuplicateSlot,
  onDeleteSlot
}) => {
  const daySlots = slots.filter(slot => 
    new Date(slot.date).toDateString() === selectedDate.toDateString()
  ).sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Convertir le temps en minutes depuis minuit
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Calculer la durée d'un créneau en format lisible
  const formatDuration = (slot: ScheduleSlot): string => {
    const startMinutes = timeToMinutes(slot.start_time);
    const endMinutes = timeToMinutes(slot.end_time);
    const durationMinutes = endMinutes - startMinutes;
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours === 0) return `${minutes}min`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}min`;
  };

  // Calculer dynamiquement les heures de début et fin en fonction des créneaux
  const getTimeRange = () => {
    if (daySlots.length === 0) {
      return { startHour: 8, endHour: 20 };
    }
    
    const times = daySlots.flatMap(slot => [
      timeToMinutes(slot.start_time),
      timeToMinutes(slot.end_time)
    ]);
    
    const minMinutes = Math.min(...times);
    const maxMinutes = Math.max(...times);
    
    // Arrondir au début de l'heure précédente et à la fin de l'heure suivante
    const startHour = Math.floor(minMinutes / 60);
    const endHour = Math.ceil(maxMinutes / 60);
    
    return { startHour, endHour };
  };

  const { startHour, endHour } = getTimeRange();
  
  // Générer les créneaux horaires dynamiquement
  const timeSlots = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => {
      const hour = startHour + i;
      return `${hour.toString().padStart(2, '0')}:00`;
    }
  );

  // Calculer la position et hauteur d'un créneau
  const getSlotPosition = (slot: ScheduleSlot) => {
    const startMinutes = timeToMinutes(slot.start_time);
    const endMinutes = timeToMinutes(slot.end_time);
    const baseMinutes = startHour * 60; // Début de la journée
    
    const HOUR_HEIGHT = 80; // Hauteur d'une heure en pixels
    const top = ((startMinutes - baseMinutes) / 60) * HOUR_HEIGHT;
    const height = ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT;
    
    return { top, height };
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <Card className="mb-8 border-0 shadow-xl overflow-hidden bg-gradient-to-br from-background via-muted/30 to-primary/5 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10"></div>
        <CardHeader className="relative">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                <Calendar className="h-7 w-7 text-white relative z-10" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
                </h2>
                <p className="text-muted-foreground font-medium mt-1">
                  {daySlots.length} créneau{daySlots.length > 1 ? 'x' : ''} programmé{daySlots.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Layout principal: Timeline (66%) + Liste (33%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline - 2/3 de l'espace */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-foreground">
                  Planning de la journée
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex">
                {/* Colonne des heures */}
                <div className="flex-shrink-0 w-16 pt-2 bg-muted/20 rounded-l-lg">
                  {timeSlots.map((time) => (
                    <div key={time} className="h-20 flex items-start justify-end pr-3">
                      <span className="text-sm text-muted-foreground font-semibold">{time}</span>
                    </div>
                  ))}
                </div>
                
                {/* Zone des cours */}
                <div className="flex-1 relative border-l-2 border-border/50">
                  {/* Lignes de grille horizontales */}
                  {timeSlots.map((time, index) => (
                    <div 
                      key={time} 
                      className="h-20 border-b border-border/20"
                      style={{ position: 'relative' }}
                    />
                  ))}
                  
                  {/* Créneaux de cours positionnés absolument */}
                  {daySlots.map((slot, index) => {
                    const { top, height } = getSlotPosition(slot);
                    const duration = formatDuration(slot);
                    const durationMinutes = timeToMinutes(slot.end_time) - timeToMinutes(slot.start_time);
                    
                    return (
                      <div
                        key={slot.id || index}
                        className="absolute left-3 right-3 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden group"
                        style={{ 
                          top: `${top}px`,
                          height: `${height}px`,
                          backgroundColor: slot.color || '#3B82F6',
                          minHeight: '60px'
                        }}
                        onClick={() => onEditSlot?.(slot)}
                      >
                        {/* Effet de brillance au survol */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        <div className="h-full p-4 flex flex-col text-white relative z-10">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-base leading-tight flex-1">
                              {slot.formation_modules?.title || 'Module'}
                            </h4>
                            {onEditSlot && onDuplicateSlot && onDeleteSlot && (
                              <SlotActionMenu 
                                slot={slot}
                                onEdit={onEditSlot}
                                onDuplicate={onDuplicateSlot}
                                onDelete={onDeleteSlot}
                              />
                            )}
                          </div>
                          
                          <div className="space-y-1.5 text-sm">
                            <div className="flex items-center text-white/95 font-medium">
                              <Clock className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                              <span>{slot.start_time} - {slot.end_time}</span>
                              <Badge className="ml-2 bg-white/20 text-white border-0 text-xs">
                                {duration}
                              </Badge>
                            </div>
                            
                            {slot.room && durationMinutes >= 60 && (
                              <div className="flex items-center text-white/90">
                                <MapPin className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                                <span>{slot.room}</span>
                              </div>
                            )}
                            
                            {slot.users && durationMinutes >= 90 && (
                              <div className="flex items-center text-white/90">
                                <User className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                                <span>{slot.users.first_name} {slot.users.last_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des cours - 1/3 de l'espace */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg sticky top-6">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
                  <List className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-foreground">
                  Liste des cours
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {daySlots.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Aucun cours programmé
                </p>
              ) : (
                daySlots.map((slot, index) => (
                  <Card 
                    key={slot.id || index}
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 border-l-4"
                    style={{ borderLeftColor: slot.color || '#3B82F6' }}
                    onClick={() => onEditSlot?.(slot)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                          style={{ backgroundColor: slot.color || '#3B82F6' }}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-sm text-foreground leading-tight mb-1 truncate">
                            {slot.formation_modules?.title || 'Module'}
                          </h5>
                          <div className="flex items-center text-xs text-muted-foreground mb-1">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{slot.start_time} - {slot.end_time}</span>
                          </div>
                          {slot.room && (
                            <div className="flex items-center text-xs text-muted-foreground mb-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="truncate">{slot.room}</span>
                            </div>
                          )}
                          {slot.users && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <User className="h-3 w-3 mr-1" />
                              <span className="truncate">{slot.users.first_name} {slot.users.last_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};