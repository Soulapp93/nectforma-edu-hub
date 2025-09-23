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
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 rounded-2xl nect-gradient flex items-center justify-center">
            <Clock className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-xl font-bold text-foreground">
            Planning de la journée
          </h3>
        </div>
        
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent"></div>
          
          {timeSlots.map((time, index) => {
            const slot = getSlotForTimeSlot(time);
            
            return (
              <div key={time} className="relative flex items-start space-x-4 pb-6">
                <div className="flex-shrink-0 w-12 text-center">
                  <div className={`w-5 h-5 rounded-full border-3 ${
                    slot ? 'timeline-dot pulse-dot' : 'bg-muted border-border'
                  } relative z-10 transition-all duration-300`}></div>
                  <div className="text-xs text-muted-foreground mt-2 font-medium">{time}</div>
                </div>
                
                <div className="flex-1 min-w-0 pb-2">
                  {slot ? (
                    <div 
                      className="px-3 py-2 rounded-md shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer text-white"
                      style={{ 
                        backgroundColor: slot.color || '#3B82F6'
                      }}
                      onClick={() => onEditSlot?.(slot)}
                    >
                      <div className="space-y-1">
                        <h4 className="font-semibold text-white text-sm leading-tight">
                          {slot.formation_modules?.title || 'Module'}
                        </h4>
                        
                        <div className="flex items-center text-xs text-white/90">
                          <Clock className="h-3 w-3 mr-1.5 text-white/80" />
                          <span>{slot.start_time} - {slot.end_time}</span>
                        </div>
                        
                        {slot.room && (
                          <div className="flex items-center text-xs text-white/90">
                            <MapPin className="h-3 w-3 mr-1.5 text-white/80" />
                            <span>{slot.room}</span>
                          </div>
                        )}
                        
                        {slot.users && (
                          <div className="flex items-center text-xs text-white/90">
                            <User className="h-3 w-3 mr-1.5 text-white/80" />
                            <span>{slot.users.first_name} {slot.users.last_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm italic opacity-60">Libre</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};