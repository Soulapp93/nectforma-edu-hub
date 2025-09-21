import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScheduleEvent } from './CreateEventModal';

interface MonthViewProps {
  selectedDate: Date;
  events: ScheduleEvent[];
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({ 
  selectedDate, 
  events, 
  onDateSelect,
  onMonthChange 
}) => {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  
  // Créer un calendrier avec les jours de la semaine précédente/suivante
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay() + 1); // Commencer le lundi
  
  const calendarEnd = new Date(monthEnd);
  const daysToAdd = 7 - calendarEnd.getDay();
  if (daysToAdd < 7) {
    calendarEnd.setDate(calendarEnd.getDate() + daysToAdd);
  }

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    onMonthChange(newDate);
  };

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="max-w-7xl mx-auto p-6">
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
                  {format(selectedDate, 'MMMM yyyy', { locale: fr })}
                </h2>
                <p className="text-slate-600 dark:text-slate-300">
                  {events.length} cours ce mois-ci
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Badge variant="outline" className="text-lg px-4 py-2">
                Vue mensuelle
              </Badge>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Calendrier */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardContent className="p-0">
          {/* En-têtes des jours */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-4 text-center font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Jours du calendrier */}
          <div className="grid grid-cols-7">
            {calendarDays.map((date) => {
              const dayEvents = getEventsForDate(date);
              const isCurrentMonth = isSameMonth(date, selectedDate);
              const isSelected = isSameDay(date, selectedDate);
              const isTodayDate = isToday(date);

              return (
                <div
                  key={date.toISOString()}
                  className={`min-h-[120px] border-r border-b border-slate-200 dark:border-slate-700 last:border-r-0 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                    !isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-900/50' : 'bg-white dark:bg-slate-800'
                  } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => onDateSelect(date)}
                >
                  <div className="p-2 h-full flex flex-col">
                    {/* Numéro du jour */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-sm font-medium ${
                          !isCurrentMonth 
                            ? 'text-slate-400' 
                            : isTodayDate 
                              ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs'
                              : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {format(date, 'd')}
                      </span>
                      
                      {dayEvents.length > 0 && (
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          {dayEvents.length}
                        </Badge>
                      )}
                    </div>

                    {/* Événements */}
                    <div className="flex-1 space-y-1 overflow-hidden">
                      {dayEvents.slice(0, 3).map((event, index) => (
                        <div
                          key={event.id}
                          className={`text-xs p-1.5 rounded text-white truncate ${event.color}`}
                          title={`${event.title} - ${event.startTime}`}
                        >
                          <div className="flex items-center space-x-1">
                            <Clock className="h-2 w-2 flex-shrink-0" />
                            <span className="truncate">{event.title}</span>
                          </div>
                        </div>
                      ))}
                      
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 text-center py-1">
                          +{dayEvents.length - 3} autres
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Légende */}
      <Card className="mt-6 border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span>Aujourd'hui</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 border-2 border-blue-500 rounded-full"></div>
                <span>Jour sélectionné</span>
              </div>
            </div>
            
            <div className="text-right">
              <p>Cliquez sur un jour pour voir les détails</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};