import React, { useState } from 'react';
import { 
  Calendar,
  Clock,
  MapPin,
  User,
  Book,
  Grid3X3,
  List,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { WeekNavigator } from '@/components/schedule/WeekNavigator';
import { CreateEventModal, ScheduleEvent } from '@/components/schedule/CreateEventModal';
import { EventDetailsModal } from '@/components/schedule/EventDetailsModal';
import { DayView } from '@/components/schedule/DayView';
import { MonthView } from '@/components/schedule/MonthView';
import { navigateWeek, getWeekInfo, getWeekDays } from '@/utils/calendarUtils';
import { useToast } from '@/hooks/use-toast';

type ViewMode = 'day' | 'week' | 'month' | 'list';

interface ScheduleSettings {
  theme: 'auto' | 'light' | 'dark';
  defaultView: 'day' | 'week' | 'month' | 'list';
  startHour: number;
  endHour: number;
  showWeekends: boolean;
  showHours: boolean;
  enableNotifications: boolean;
  autoRefresh: boolean;
  compactMode: boolean;
  colorScheme: 'default' | 'modern' | 'pastel' | 'vibrant';
}

const EmploiTemps = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [events, setEvents] = useState<ScheduleEvent[]>([
    {
      id: '1',
      title: 'Module Introduction Marketing',
      date: new Date(2024, 9, 21),
      startTime: '09:00',
      endTime: '11:00',
      instructor: 'M. Dubois',
      room: 'Salle A101',
      formation: 'Formation Marketing',
      color: 'bg-blue-500',
      description: 'Introduction aux concepts fondamentaux du marketing digital'
    },
    {
      id: '2',
      title: 'Module Technique Avancé',
      date: new Date(2024, 9, 22),
      startTime: '10:00',
      endTime: '12:00',
      instructor: 'M. Durand',
      room: 'Salle C301',
      formation: 'Formation Technique',
      color: 'bg-green-500',
      description: 'Techniques avancées de développement'
    },
    {
      id: '3',
      title: 'Atelier Créatif',
      date: new Date(2024, 9, 23),
      startTime: '09:30',
      endTime: '11:30',
      instructor: 'M. Petit',
      room: 'Atelier 1',
      formation: 'Formation Créative',
      color: 'bg-pink-500',
      description: 'Développement de la créativité en équipe'
    }
  ]);
  
  const { toast } = useToast();

  // Event handlers
  const handleEventClick = (event: ScheduleEvent) => {
    setSelectedEvent(event);
    setIsEventDetailsOpen(true);
  };

  const handleEventEdit = (event: ScheduleEvent) => {
    // TODO: Implémenter l'édition d'événement
    toast({
      title: "Modification d'événement",
      description: "Fonctionnalité en cours de développement",
    });
  };

  const handleEventDelete = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    toast({
      title: "Événement supprimé",
      description: "L'événement a été supprimé avec succès",
    });
  };

  const handleEventDuplicate = (event: ScheduleEvent) => {
    const newEvent = {
      ...event,
      id: Date.now().toString(),
      title: `${event.title} (Copie)`,
      date: new Date(event.date.getTime() + 24 * 60 * 60 * 1000) // Jour suivant
    };
    setEvents(prev => [...prev, newEvent]);
    toast({
      title: "Événement dupliqué",
      description: "L'événement a été dupliqué pour le jour suivant",
    });
  };

  // Navigation handlers
  const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
    if (viewMode === 'month') {
      if (direction === 'prev') setCurrentDate(subMonths(currentDate, 1));
      else if (direction === 'next') setCurrentDate(addMonths(currentDate, 1));
      else setCurrentDate(new Date());
    } else if (viewMode === 'day') {
      if (direction === 'prev') {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 1);
        setCurrentDate(newDate);
      } else if (direction === 'next') {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 1);
        setCurrentDate(newDate);
      } else {
        setCurrentDate(new Date());
      }
    } else {
      setCurrentDate(navigateWeek(currentDate, direction));
    }
  };

  // Event handlers
  const handleEventCreated = (event: ScheduleEvent) => {
    setEvents(prev => [...prev, event]);
  };

  // All events are displayed without filters
  const filteredEvents = events;

  // Prepare week schedule data for week and list views
  const weekDays = getWeekDays(currentDate);
  const mockSchedule = weekDays.map((date, index) => {
    const dayEvents = filteredEvents.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
    
    return {
      id: (index + 1).toString(),
      day: format(date, 'EEEE', { locale: fr }),
      date: format(date, 'd'),
      modules: dayEvents.map(event => ({
        title: event.title,
        time: `${event.startTime} - ${event.endTime}`,
        instructor: event.instructor,
        room: event.room,
        color: event.color
      }))
    };
  });

  const weekInfo = getWeekInfo(currentDate);

  // Render current view
  const renderCurrentView = () => {
    switch (viewMode) {
      case 'day':
        return (
          <DayView 
            selectedDate={currentDate} 
            events={filteredEvents}
            onEventClick={handleEventClick}
          />
        );
      case 'month':
        return (
          <MonthView 
            selectedDate={currentDate} 
            events={filteredEvents}
            onDateSelect={setCurrentDate}
            onMonthChange={setCurrentDate}
            onEventClick={handleEventClick}
          />
        );
      case 'week':
      case 'list':
      default:
        return renderWeekOrListView();
    }
  };

  const renderWeekOrListView = () => (
    <div className="container mx-auto px-6 py-8">
      {viewMode === 'week' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-6">
          {mockSchedule.map((day) => (
            <Card
              key={day.id}
              className={`overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 ${
                day.modules.length > 0 
                  ? 'bg-card shadow-md hover:shadow-primary/10' 
                  : 'bg-muted/30 shadow-sm opacity-70'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-foreground">
                      {day.day}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-2xl font-bold text-primary">
                        {day.date}
                      </span>
                      {day.modules.length > 0 && (
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                          {day.modules.length} cours
                        </Badge>
                      )}
                    </div>
                  </div>
                  {day.modules.length === 0 && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {day.modules.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    Aucun cours
                  </p>
                ) : (
                  day.modules.map((module, index) => (
                     <div
                       key={index}
                       className="relative p-4 rounded-xl bg-gradient-to-r from-card to-muted/30 border border-border hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer group"
                       onClick={() => {
                         const fullEvent = filteredEvents.find(e => 
                           e.title === module.title && 
                           e.instructor === module.instructor &&
                           e.room === module.room
                         );
                         if (fullEvent) handleEventClick(fullEvent);
                       }}
                     >
                      <div className={`absolute top-0 left-0 w-1 h-full ${module.color} rounded-l-xl`} />
                      
                      <div className="ml-3">
                        <h4 className="font-semibold text-foreground text-sm mb-2 group-hover:text-primary transition-colors">
                          {module.title}
                        </h4>
                        
                        <div className="space-y-1">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {module.time}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            {module.room}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <User className="h-3 w-3 mr-1" />
                            {module.instructor}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {mockSchedule.filter(day => day.modules.length > 0).map((day) => (
            <Card key={day.id} className="overflow-hidden border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700">
                <CardTitle className="flex items-center space-x-3">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    {day.day} {day.date}
                  </span>
                  <Badge variant="outline">{day.modules.length} cours</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {day.modules.map((module, index) => (
                   <div
                     key={index}
                     className="p-4 rounded-xl border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all duration-200 cursor-pointer"
                     onClick={() => {
                       const fullEvent = filteredEvents.find(e => 
                         e.title === module.title && 
                         e.instructor === module.instructor &&
                         e.room === module.room
                       );
                       if (fullEvent) handleEventClick(fullEvent);
                     }}
                   >
                      <div className="flex items-start space-x-3">
                        <div className={`w-3 h-3 ${module.color} rounded-full mt-1`} />
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                            {module.title}
                          </h4>
                          <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-2" />
                              {module.time}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-2" />
                              {module.room}
                            </div>
                            <div className="flex items-center">
                              <User className="h-3 w-3 mr-2" />
                              {module.instructor}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
      {/* Header moderne */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
                <Calendar className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Emploi du Temps</h1>
                <p className="text-muted-foreground">
                  {viewMode === 'month' 
                    ? format(currentDate, 'MMMM yyyy', { locale: fr })
                    : `Semaine du ${weekInfo.start} au ${weekInfo.end}`
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <CreateEventModal onEventCreated={handleEventCreated} />
            </div>
          </div>

          {/* Navigation et vues */}
          <div className="flex items-center justify-between">
            <WeekNavigator 
              currentDate={currentDate}
              onNavigate={handleNavigate}
            />

            <div className="flex items-center space-x-2 bg-muted/50 rounded-xl p-1 border">
              <Button
                variant={viewMode === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('day')}
                className={`px-3 ${viewMode === 'day' ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-primary/10'}`}
              >
                <Eye className="h-4 w-4 mr-2" />
                Jour
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('week')}
                className={`px-3 ${viewMode === 'week' ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-primary/10'}`}
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                Semaine
              </Button>
              <Button
                variant={viewMode === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('month')}
                className={`px-3 ${viewMode === 'month' ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-primary/10'}`}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Mois
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={`px-3 ${viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-primary/10'}`}
              >
                <List className="h-4 w-4 mr-2" />
                Liste
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      {renderCurrentView()}

      {/* Modals */}
      <EventDetailsModal
        event={selectedEvent}
        isOpen={isEventDetailsOpen}
        onClose={() => setIsEventDetailsOpen(false)}
        onEdit={handleEventEdit}
        onDelete={handleEventDelete}
        onDuplicate={handleEventDuplicate}
      />
    </div>
  );
};

export default EmploiTemps;