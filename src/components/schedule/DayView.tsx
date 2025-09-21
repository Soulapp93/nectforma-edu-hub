import React from 'react';
import { Clock, MapPin, User, Book, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScheduleEvent } from './CreateEventModal';

interface DayViewProps {
  selectedDate: Date;
  events: ScheduleEvent[];
  onEventClick?: (event: ScheduleEvent) => void;
}

export const DayView: React.FC<DayViewProps> = ({ selectedDate, events, onEventClick }) => {
  const dayEvents = events.filter(event => 
    event.date.toDateString() === selectedDate.toDateString()
  ).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  const getEventForTimeSlot = (time: string) => {
    return dayEvents.find(event => {
      const eventStart = event.startTime;
      const nextHour = String(parseInt(time.split(':')[0]) + 1).padStart(2, '0') + ':00';
      return eventStart >= time && eventStart < nextHour;
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
              <div className="w-14 h-14 rounded-3xl nect-gradient flex items-center justify-center shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                <Calendar className="h-7 w-7 text-white relative z-10" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
                </h2>
                <p className="text-muted-foreground font-medium mt-1">
                  {dayEvents.length} cours programmé{dayEvents.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <Badge 
              variant="secondary" 
              className="text-base px-6 py-3 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 text-primary font-semibold rounded-full"
            >
              Vue journalière
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {dayEvents.length === 0 ? (
        <Card className="border-0 shadow-2xl glass-card rounded-3xl overflow-hidden">
          <CardContent className="p-16 text-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
            <div className="relative">
              <div className="w-20 h-20 rounded-full nect-gradient flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Calendar className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">
                Aucun cours aujourd'hui
              </h3>
              <p className="text-muted-foreground text-lg">
                Profitez de cette journée libre ! 🌟
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              
              {timeSlots.map((time) => {
                const event = getEventForTimeSlot(time);
                
                return (
                  <div key={time} className="relative flex items-start space-x-4 pb-6">
                    <div className="flex-shrink-0 w-12 text-center">
                      <div className={`w-5 h-5 rounded-full border-3 ${
                        event ? 'timeline-dot pulse-dot' : 'bg-muted border-border'
                      } relative z-10 transition-all duration-300`}></div>
                      <div className="text-xs text-muted-foreground mt-2 font-medium">{time}</div>
                    </div>
                    
                    <div className="flex-1 min-w-0 pb-2">
                      {event ? (
                        <div 
                          className="p-4 rounded-lg bg-white border-l-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                          style={{ 
                            borderLeftColor: event.color || 'hsl(var(--primary))'
                          }}
                        >
                          <div className="space-y-2">
                            <h4 className="font-bold text-gray-900 text-base leading-tight">
                              Module {event.title}
                            </h4>
                            
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-2 text-gray-400" />
                                {event.startTime} - {event.endTime}
                              </div>
                              {event.room && (
                                <div className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-2 text-gray-400" />
                                  {event.room}
                                </div>
                              )}
                              {event.instructor && (
                                <div className="flex items-center">
                                  <User className="h-3 w-3 mr-2 text-gray-400" />
                                  {event.instructor}
                                </div>
                              )}
                            </div>
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

          {/* Détails des cours */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 rounded-2xl nect-gradient flex items-center justify-center">
                <Book className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Détails des cours
              </h3>
            </div>
            
                     <div className="space-y-4">
               {dayEvents.map((event) => (
                  <Card 
                    key={event.id} 
                    className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer floating-card rounded-2xl overflow-hidden bg-gradient-to-br from-card to-muted/20"
                    onClick={() => onEventClick?.(event)}
                  >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                          {event.title}
                        </h4>
                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                          <Clock className="h-4 w-4 mr-2" />
                          {event.startTime} - {event.endTime}
                          <span className="mx-2">•</span>
                          <span>
                            {Math.round((parseInt(event.endTime.split(':')[0]) - parseInt(event.startTime.split(':')[0])) * 60 + 
                            (parseInt(event.endTime.split(':')[1]) - parseInt(event.startTime.split(':')[1])))} min
                          </span>
                        </div>
                      </div>
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: event.color || 'hsl(var(--primary))' }}
                      ></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {event.instructor && (
                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                          <User className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>{event.instructor}</span>
                        </div>
                      )}
                      
                      {event.room && (
                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>{event.room}</span>
                        </div>
                      )}
                      
                      {event.formation && (
                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-300 md:col-span-2">
                          <Book className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>{event.formation}</span>
                        </div>
                      )}
                    </div>

                    {event.description && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {event.description}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};