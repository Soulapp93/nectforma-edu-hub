import React from 'react';
import { Clock, MapPin, User, Book, Calendar, Edit, Copy, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScheduleSlot } from '@/services/scheduleService';

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

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  // Convertir le temps en minutes depuis minuit
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Calculer la position et hauteur d'un créneau
  const getSlotPosition = (slot: ScheduleSlot) => {
    const startMinutes = timeToMinutes(slot.start_time);
    const endMinutes = timeToMinutes(slot.end_time);
    const baseMinutes = timeToMinutes('08:00'); // Début de la journée
    
    const HOUR_HEIGHT = 80; // Hauteur d'une heure en pixels
    const top = ((startMinutes - baseMinutes) / 60) * HOUR_HEIGHT;
    const height = ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT - 8; // -8 pour un petit espacement
    
    return { top, height };
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
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

      {/* Timeline */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 rounded-2xl nect-gradient flex items-center justify-center">
            <Clock className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-xl font-bold text-foreground">
            Planning de la journée
          </h3>
        </div>
        
        <div className="flex">
          {/* Colonne des heures */}
          <div className="flex-shrink-0 w-20 pt-2">
            {timeSlots.map((time) => (
              <div key={time} className="h-20 flex items-start justify-end pr-3">
                <span className="text-sm text-muted-foreground font-medium">{time}</span>
              </div>
            ))}
          </div>
          
          {/* Zone des cours */}
          <div className="flex-1 relative border-l border-border/50">
            {/* Lignes de grille horizontales */}
            {timeSlots.map((time, index) => (
              <div 
                key={time} 
                className="h-20 border-b border-border/30"
                style={{ position: 'relative' }}
              />
            ))}
            
            {/* Créneaux de cours positionnés absolument */}
            {daySlots.map((slot, index) => {
              const { top, height } = getSlotPosition(slot);
              
              return (
                <div
                  key={slot.id || index}
                  className="absolute left-2 right-2 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                  style={{ 
                    top: `${top}px`,
                    height: `${height}px`,
                    backgroundColor: slot.color || '#3B82F6',
                    minHeight: '60px'
                  }}
                  onClick={() => onEditSlot?.(slot)}
                >
                  <div className="h-full p-3 flex flex-col text-white relative z-10">
                    <h4 className="font-bold text-sm leading-tight mb-2">
                      {slot.formation_modules?.title || 'Module'}
                    </h4>
                    
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center text-white/90">
                        <Clock className="h-3 w-3 mr-1.5 flex-shrink-0" />
                        <span className="font-medium">{slot.start_time} - {slot.end_time}</span>
                      </div>
                      
                      {slot.room && (
                        <div className="flex items-center text-white/90">
                          <MapPin className="h-3 w-3 mr-1.5 flex-shrink-0" />
                          <span>{slot.room}</span>
                        </div>
                      )}
                      
                      {slot.users && (
                        <div className="flex items-center text-white/90">
                          <User className="h-3 w-3 mr-1.5 flex-shrink-0" />
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
      </div>
    </div>
  );
};