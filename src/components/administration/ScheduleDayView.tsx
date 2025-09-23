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
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  const getSlotForTimeSlot = (time: string) => {
    return daySlots.find(slot => {
      const slotStart = slot.start_time.slice(0, 5);
      const nextHour = String(parseInt(time.split(':')[0]) + 1).padStart(2, '0') + ':00';
      return slotStart >= time && slotStart < nextHour;
    });
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
        {timeSlots.map((time, index) => {
          const slot = getSlotForTimeSlot(time);
          
          return (
            <div key={time} className="flex">
              {/* Time column */}
              <div className="w-20 flex-shrink-0 text-right pr-6 pt-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {time}
                </span>
              </div>
              
              {/* Content column */}
              <div className="flex-1 relative">
                {index < timeSlots.length - 1 && (
                  <div className="absolute left-0 top-0 bottom-0 w-px bg-border"></div>
                )}
                
                <div className="relative pl-6">
                  <div className="absolute left-0 top-2 w-3 h-3 bg-background border-2 border-border rounded-full"></div>
                  
                  {slot ? (
                    <Card className="mb-4 shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 bg-gradient-to-r from-background to-muted/30"
                          style={{ borderLeftColor: slot.color || '#6B7280' }}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <Badge variant="secondary" className="text-xs font-medium">
                                {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                              </Badge>
                              <div className="w-3 h-3 rounded-full" 
                                   style={{ backgroundColor: slot.color || '#6B7280' }}></div>
                            </div>
                            
                            <h3 className="font-bold text-lg mb-2 text-foreground">
                              {slot.formation_modules?.title || 'Module non défini'}
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center space-x-2 text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>{slot.users ? `${slot.users.first_name} ${slot.users.last_name}` : 'Non assigné'}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{slot.room || 'Salle non définie'}</span>
                              </div>
                            </div>
                            
                            {slot.notes && (
                              <p className="text-sm text-muted-foreground mt-3 p-3 bg-muted/50 rounded-lg">
                                {slot.notes}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex flex-col space-y-2 ml-4">
                            {onEditSlot && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditSlot(slot)}
                                className="h-8 w-8 p-0 hover:bg-primary/10"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {onDuplicateSlot && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDuplicateSlot(slot)}
                                className="h-8 w-8 p-0 hover:bg-primary/10"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}
                            {onDeleteSlot && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteSlot(slot)}
                                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="h-16 flex items-center text-muted-foreground text-sm">
                      Aucun créneau programmé
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};