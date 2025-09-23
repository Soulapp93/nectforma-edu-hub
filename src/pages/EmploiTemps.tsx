import React, { useState } from 'react';
import { format, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { navigateWeek, getWeekInfo, getWeekDays } from '@/utils/calendarUtils';
import { useToast } from '@/hooks/use-toast';
import { EventDetailsModal } from '@/components/schedule/EventDetailsModal';
import { DayView } from '@/components/schedule/DayView';
import { MonthView } from '@/components/schedule/MonthView';
import { ScheduleViewHeader } from '@/components/schedule/ScheduleViewHeader';
import { ViewModeSelector } from '@/components/schedule/ViewModeSelector';
import { ScheduleViewCalendar } from '@/components/schedule/ScheduleViewCalendar';
import { WeekNavigator } from '@/components/schedule/WeekNavigator';
import WeekNavigation from '@/components/ui/week-navigation';
import { useUserSchedules } from '@/hooks/useUserSchedules';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import type { ScheduleEvent } from '@/components/schedule/CreateEventModal';

type ViewMode = 'day' | 'week' | 'month' | 'list';

const EmploiTemps = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  
  const { toast } = useToast();
  const { userRole } = useCurrentUser();
  const { schedules, loading, error } = useUserSchedules();

  // Convertir les données de Supabase en format d'événements
  const convertToEvents = (scheduleSlots: any[]): ScheduleEvent[] => {
    return scheduleSlots.map(slot => {
      const formation = slot.schedules?.formations;
      return {
        id: slot.id,
        title: slot.formation_modules?.title || 'Cours',
        date: new Date(slot.date),
        startTime: slot.start_time,
        endTime: slot.end_time,
        instructor: slot.users ? `${slot.users.first_name} ${slot.users.last_name}` : 'Non assigné',
        room: slot.room || 'Salle non définie',
        formation: formation?.title || 'Formation non définie',
        color: slot.color || formation?.color || '#6B7280',
        description: slot.notes || `Cours de ${slot.formation_modules?.title || 'formation'}`
      };
    });
  };

  const events = convertToEvents(schedules);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
        <LoadingState message="Chargement de votre emploi du temps..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
        <EmptyState
          title="Erreur de chargement"
          description={error}
          action={{
            label: "Réessayer",
            onClick: () => window.location.reload()
          }}
        />
      </div>
    );
  }

  // Event handlers
  const handleEventClick = (event: ScheduleEvent) => {
    setSelectedEvent(event);
    setIsEventDetailsOpen(true);
  };

  const handleEventEdit = (event: ScheduleEvent) => {
    toast({
      title: "Information",
      description: "Seuls les administrateurs peuvent modifier les emplois du temps via l'onglet Administration.",
      variant: "default",
    });
  };

  const handleEventDelete = (eventId: string) => {
    toast({
      title: "Information",
      description: "Seuls les administrateurs peuvent supprimer des créneaux via l'onglet Administration.",
      variant: "default",
    });
  };

  const handleEventDuplicate = (event: ScheduleEvent) => {
    toast({
      title: "Information", 
      description: "Seuls les administrateurs peuvent dupliquer des créneaux via l'onglet Administration.",
      variant: "default",
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

  // Filtrer les événements selon la période affichée
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

  const renderWeekOrListView = () => {
    if (viewMode === 'week') {
        return (
          <ScheduleViewCalendar
            schedule={mockSchedule}
            filteredEvents={filteredEvents}
            onEventClick={handleEventClick}
          />
        );
    } else {
      // Vue liste simplifiée
      return (
        <div className="container mx-auto px-6 py-8">
          <div className="space-y-4">
            {mockSchedule.filter(day => day.modules.length > 0).map((day) => (
              <div key={day.id} className="bg-card rounded-xl p-6 shadow-lg border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-foreground">
                    {day.day} {day.date}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {day.modules.length} cours
                  </span>
                </div>
                     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                   {day.modules.map((module, index) => {
                     const fullEvent = filteredEvents.find(e => 
                       e.title === module.title && 
                       e.instructor === module.instructor &&
                       e.room === module.room
                     );
                     return (
                       <div
                         key={index}
                         className="p-4 rounded-lg border border-border hover:shadow-md transition-all duration-200 cursor-pointer"
                         onClick={() => {
                           if (fullEvent) handleEventClick(fullEvent);
                         }}
                       >
                         <div className="flex items-start space-x-3">
                             <div 
                             className="w-3 h-3 rounded-full mt-1" 
                             style={{ backgroundColor: fullEvent?.color || '#6B7280' }}
                           />
                           <div className="flex-1">
                             <div className="flex items-center justify-between mb-2">
                               <h4 className="font-semibold text-foreground">
                                 {module.title}
                               </h4>
                               {fullEvent?.formation && (
                                 <Badge 
                                   variant="outline" 
                                   className="text-xs"
                                   style={{ 
                                     borderColor: fullEvent.color,
                                     color: fullEvent.color 
                                   }}
                                 >
                                   {fullEvent.formation}
                                 </Badge>
                               )}
                             </div>
                             <div className="space-y-1 text-sm text-muted-foreground">
                               <div>{module.time}</div>
                               <div>{module.room}</div>
                               <div>{module.instructor}</div>
                             </div>
                           </div>
                         </div>
                       </div>
                     );
                   })}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
        <ScheduleViewHeader
          currentDate={currentDate}
          weekInfo={weekInfo}
          viewMode={viewMode}
          schedulesCount={0}
        />
        <EmptyState
          title="Aucun cours planifié"
          description={
            userRole === 'Étudiant' 
              ? "Aucun cours n'est programmé pour vos formations actuellement."
              : userRole === 'Formateur' || userRole === 'Tuteur'
              ? "Vous n'avez aucun cours assigné actuellement."
              : "Aucun emploi du temps publié pour le moment."
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
      {/* Header simplifié pour consultation */}
      <ScheduleViewHeader
        currentDate={currentDate}
        weekInfo={weekInfo}
        viewMode={viewMode}
        schedulesCount={events.length}
      />

      {/* Navigation et contrôles */}
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <WeekNavigator 
            currentDate={currentDate}
            onNavigate={handleNavigate}
          />

          <ViewModeSelector
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        {/* Barre de navigation par semaine */}
        <div className="mt-6">
          <WeekNavigation
            selectedDate={currentDate}
            onDateChange={setCurrentDate}
            onWeekSelect={(weekStartDate) => {
              setCurrentDate(weekStartDate);
              if (viewMode !== 'week') {
                setViewMode('week');
              }
            }}
            className="bg-background/95 backdrop-blur-sm border-border"
          />
        </div>
      </div>

      {/* Contenu principal */}
      {renderCurrentView()}

      {/* Modal de détails seulement */}
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