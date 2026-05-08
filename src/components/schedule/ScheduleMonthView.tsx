import React from 'react';
import { Calendar, Clock, MapPin, User, Plus, ChevronLeft, ChevronRight, Edit, Copy, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScheduleSlot } from '@/services/scheduleService';
import { isAutonomieSlot, getEventLabel, getEventColor } from '@/utils/slotDisplay';
import { isSameMonth, isSameDay, isToday, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatTimeRange } from '@/utils/slotDisplay';

interface Props {
  selectedDate: Date;
  slots: ScheduleSlot[];
  onDateSelect: (date: Date) => void;
  onSlotClick: (slot: ScheduleSlot) => void;
  onNavigateMonth: (direction: 'prev' | 'next') => void;
}

export const ScheduleMonthView: React.FC<Props> = ({
  selectedDate,
  slots,
  onDateSelect,
  onSlotClick,
  onNavigateMonth,
}) => {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay() + 1);
  
  const calendarEnd = new Date(monthEnd);
  const daysToAdd = 7 - calendarEnd.getDay();
  if (daysToAdd < 7) {
    calendarEnd.setDate(calendarEnd.getDate() + daysToAdd);
  }

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const getSlotsForDate = (date: Date) => {
    return slots.filter(slot => isSameDay(new Date(slot.date), date));
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
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
                  {format(selectedDate, 'MMMM yyyy', { locale: fr })}
                </h2>
                <p className="text-muted-foreground font-medium mt-1">{slots.length} cours ce mois-ci</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => onNavigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Badge variant="secondary" className="text-base px-6 py-3 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 text-primary font-semibold rounded-full">
                Vue mensuelle
              </Badge>
              <Button variant="outline" size="sm" onClick={() => onNavigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="border-0 shadow-2xl overflow-hidden rounded-3xl bg-gradient-to-br from-card to-muted/10">
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b border-border bg-gradient-to-r from-primary/5 via-muted/50 to-accent/5">
            {weekDayNames.map((day) => (
              <div key={day} className="p-4 text-center font-bold text-primary/80 backdrop-blur-sm">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((date) => {
              const daySlots = getSlotsForDate(date);
              const isCurrentMonth = isSameMonth(date, selectedDate);
              const isSelected = isSameDay(date, selectedDate);
              const isTodayDate = isToday(date);

              const slotsAsEvents = daySlots.map(slot => {
                const eventLabel = getEventLabel(slot);
                const eventColor = getEventColor(slot);
                const isEvent = !!eventLabel;
                const autonomie = isAutonomieSlot(slot);
                return {
                  id: slot.id,
                  title: isEvent ? (slot.title || eventLabel) : (autonomie ? 'AUTONOMIE' : (slot.formation_modules?.title || 'Module non defini')),
                  startTime: slot.start_time.substring(0, 5),
                  endTime: slot.end_time.substring(0, 5),
                  instructor: isEvent || autonomie ? '' : (slot.users?.first_name && slot.users?.last_name ? `${slot.users.first_name} ${slot.users.last_name}` : 'Instructeur non defini'),
                  room: isEvent || autonomie ? '' : (slot.room || 'Salle non definie'),
                  color: isEvent ? (eventColor || slot.color || '#64748B') : (slot.color || '#3B82F6'),
                  sessionType: autonomie ? 'autonomie' : slot.session_type,
                  isEvent,
                  eventTypeLabel: eventLabel,
                };
              });

              return (
                <div
                  key={date.toISOString()}
                  className={`min-h-[130px] border-r border-b border-border/50 last:border-r-0 cursor-pointer transition-all duration-300 hover:bg-muted/30 ${
                    !isCurrentMonth ? 'bg-muted/20 opacity-60' : 'bg-background hover:shadow-lg'
                  } ${isSelected ? 'ring-2 ring-primary shadow-lg bg-primary/5' : ''}`}
                  onClick={() => onDateSelect(date)}
                >
                  <div className="p-2 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-bold ${
                        !isCurrentMonth ? 'text-muted-foreground'
                          : isTodayDate ? 'nect-gradient text-white w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-lg'
                          : 'text-foreground'
                      }`}>{format(date, 'd')}</span>
                      {slotsAsEvents.length > 0 && (
                        <Badge variant="secondary" className="text-xs px-2 py-1 nect-gradient text-white rounded-full shadow-sm font-semibold">
                          {slotsAsEvents.length}
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1 space-y-1 overflow-hidden">
                      {slotsAsEvents.slice(0, 3).map((event) => {
                        const originalSlot = daySlots.find(s => s.id === event.id);
                        return (
                          <TooltipProvider key={event.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className="px-2 py-2 rounded-md shadow-sm cursor-pointer hover:shadow-md hover:scale-105 transition-all duration-200 mb-1 text-white"
                                  style={{ backgroundColor: event.color }}
                                  onClick={(e) => { e.stopPropagation(); if (originalSlot) onSlotClick(originalSlot); }}
                                >
                                  <div className="space-y-0.5">
                                    <div className="font-bold text-white text-[11px] leading-tight">
                                      {event.isEvent ? event.eventTypeLabel : (event.sessionType === 'autonomie' ? 'AUTONOMIE' : event.title)}
                                    </div>
                                    {!event.isEvent && (
                                      <div className="flex items-center text-[9px] text-white/90">
                                        <Clock className="h-2.5 w-2.5 mr-1 text-white/80" />
                                        <span>{formatTimeRange(event.startTime, event.endTime)}</span>
                                      </div>
                                    )}
                                    {!event.isEvent && event.sessionType !== 'autonomie' && event.room && (
                                      <div className="flex items-center text-[9px] text-white/90">
                                        <MapPin className="h-2.5 w-2.5 mr-1 text-white/80" /><span>{event.room}</span>
                                      </div>
                                    )}
                                    {!event.isEvent && event.sessionType !== 'autonomie' && event.instructor && (
                                      <div className="flex items-center text-[9px] text-white/90">
                                        <User className="h-2.5 w-2.5 mr-1 text-white/80" /><span>{event.instructor}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs">
                                <div className="space-y-1">
                                  <p className="font-semibold">{event.isEvent ? event.eventTypeLabel : event.title}</p>
                                  {event.isEvent && event.title && event.title !== event.eventTypeLabel && (
                                    <p className="text-xs">{event.title}</p>
                                  )}
                                  {!event.isEvent && (
                                    <>
                                      <p className="text-xs">{event.startTime} - {event.endTime}</p>
                                      {event.instructor && <p className="text-xs">{event.instructor}</p>}
                                      {event.room && <p className="text-xs">Salle: {event.room}</p>}
                                    </>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                      {slotsAsEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center py-2 font-medium opacity-75">
                          +{slotsAsEvents.length - 3} autres
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

      <Card className="mt-8 border-0 shadow-xl glass-card rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 nect-gradient rounded-full shadow-md"></div>
                <span className="font-medium">Aujourd'hui</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 border-2 border-primary rounded-full"></div>
                <span className="font-medium">Jour selectionne</span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">Cliquez sur un jour pour voir les details</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
