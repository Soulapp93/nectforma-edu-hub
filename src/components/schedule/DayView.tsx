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
      <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
                </h2>
                <p className="text-slate-600 dark:text-slate-300">
                  {dayEvents.length} cours programmé{dayEvents.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              Vue journalière
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {dayEvents.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Calendar className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Aucun cours aujourd'hui
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Profitez de cette journée libre !
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Planning de la journée
            </h3>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
              
              {timeSlots.map((time) => {
                const event = getEventForTimeSlot(time);
                
                return (
                  <div key={time} className="relative flex items-start space-x-4 pb-6">
                    <div className="flex-shrink-0 w-12 text-center">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        event ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
                      } relative z-10`}></div>
                      <div className="text-xs text-slate-500 mt-1">{time}</div>
                    </div>
                    
                    <div className="flex-1 min-w-0 pb-2">
                      {event ? (
                        <div 
                          className="p-4 rounded-lg border-2 bg-gray-50 dark:bg-slate-700 shadow-sm hover:shadow-md transition-shadow"
                          style={{ 
                            borderColor: event.color || 'hsl(var(--primary))'
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-slate-900 dark:text-white">
                              {event.title}
                            </h4>
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: event.color || 'hsl(var(--primary))' }}
                            ></div>
                          </div>
                          
                          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-2" />
                              {event.startTime} - {event.endTime}
                            </div>
                            {event.instructor && (
                              <div className="flex items-center">
                                <User className="h-3 w-3 mr-2" />
                                {event.instructor}
                              </div>
                            )}
                            {event.room && (
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-2" />
                                {event.room}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400 text-sm italic">Libre</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Détails des cours */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Détails des cours
            </h3>
            
                     <div className="space-y-4">
               {dayEvents.map((event) => (
                 <Card 
                   key={event.id} 
                   className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
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