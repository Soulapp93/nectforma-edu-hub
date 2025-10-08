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
        description: slot.notes || `Cours de ${slot.formation_modules?.title || 'formation'}`,
        formationId: slot.schedules?.formation_id
      };
    });
  };

  const events = convertToEvents(schedules);
  
  // Trier les événements par date et heure pour affichage chronologique
  const sortedEvents = [...events].sort((a, b) => {
    const dateCompare = a.date.getTime() - b.date.getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  // Catégoriser les événements pour les formateurs
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const categorizedEvents = {
    past: sortedEvents.filter(e => e.date < today),
    today: sortedEvents.filter(e => e.date.toDateString() === today.toDateString()),
    upcoming: sortedEvents.filter(e => e.date > today)
  };
  
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
      // Vue liste optimisée pour les formateurs - style tableau clair
      const isInstructor = userRole === 'Formateur' || userRole === 'Tuteur';
      
      if (isInstructor) {
        return (
          <div className="container mx-auto px-6 py-8">
            {/* En-tête de tableau */}
            <div className="bg-card rounded-t-lg border border-border shadow-sm">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 font-semibold text-sm text-muted-foreground border-b border-border">
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Horaire</div>
                <div className="col-span-3">Formation</div>
                <div className="col-span-3">Module</div>
                <div className="col-span-2">Classe/Salle</div>
              </div>
            </div>

            {/* Sections chronologiques */}
            <div className="bg-card rounded-b-lg border-x border-b border-border shadow-sm">
              {/* Cours du jour */}
              {categorizedEvents.today.length > 0 && (
                <div className="border-b border-border">
                  <div className="px-6 py-3 bg-primary/5">
                    <h3 className="font-semibold text-primary flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                      Aujourd'hui ({categorizedEvents.today.length})
                    </h3>
                  </div>
                  {categorizedEvents.today.map((event) => (
                    <div
                      key={event.id}
                      className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border last:border-b-0 items-center"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="col-span-2">
                        <div className="font-medium">{format(event.date, 'dd/MM/yyyy', { locale: fr })}</div>
                        <div className="text-xs text-muted-foreground capitalize">{format(event.date, 'EEEE', { locale: fr })}</div>
                      </div>
                      <div className="col-span-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {event.startTime} - {event.endTime}
                        </Badge>
                      </div>
                      <div className="col-span-3">
                        <div 
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-white"
                          style={{ backgroundColor: event.color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white/80"></span>
                          {event.formation}
                        </div>
                      </div>
                      <div className="col-span-3">
                        <div className="font-medium">{event.title}</div>
                        {event.description && (
                          <div className="text-xs text-muted-foreground truncate">{event.description}</div>
                        )}
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm">{event.room}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cours à venir */}
              {categorizedEvents.upcoming.length > 0 && (
                <div className="border-b border-border">
                  <div className="px-6 py-3 bg-muted/30">
                    <h3 className="font-semibold text-foreground">
                      À venir ({categorizedEvents.upcoming.length})
                    </h3>
                  </div>
                  {categorizedEvents.upcoming.map((event) => (
                    <div
                      key={event.id}
                      className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border last:border-b-0 items-center"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="col-span-2">
                        <div className="font-medium">{format(event.date, 'dd/MM/yyyy', { locale: fr })}</div>
                        <div className="text-xs text-muted-foreground capitalize">{format(event.date, 'EEEE', { locale: fr })}</div>
                      </div>
                      <div className="col-span-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {event.startTime} - {event.endTime}
                        </Badge>
                      </div>
                      <div className="col-span-3">
                        <div 
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-white"
                          style={{ backgroundColor: event.color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white/80"></span>
                          {event.formation}
                        </div>
                      </div>
                      <div className="col-span-3">
                        <div className="font-medium">{event.title}</div>
                        {event.description && (
                          <div className="text-xs text-muted-foreground truncate">{event.description}</div>
                        )}
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm">{event.room}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cours passés */}
              {categorizedEvents.past.length > 0 && (
                <div>
                  <div className="px-6 py-3 bg-muted/20">
                    <h3 className="font-semibold text-muted-foreground">
                      Passés ({categorizedEvents.past.length})
                    </h3>
                  </div>
                  {categorizedEvents.past.slice(-10).reverse().map((event) => (
                    <div
                      key={event.id}
                      className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer border-b border-border last:border-b-0 items-center opacity-60"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="col-span-2">
                        <div className="font-medium">{format(event.date, 'dd/MM/yyyy', { locale: fr })}</div>
                        <div className="text-xs text-muted-foreground capitalize">{format(event.date, 'EEEE', { locale: fr })}</div>
                      </div>
                      <div className="col-span-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {event.startTime} - {event.endTime}
                        </Badge>
                      </div>
                      <div className="col-span-3">
                        <div 
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-white"
                          style={{ backgroundColor: event.color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white/80"></span>
                          {event.formation}
                        </div>
                      </div>
                      <div className="col-span-3">
                        <div className="font-medium">{event.title}</div>
                        {event.description && (
                          <div className="text-xs text-muted-foreground truncate">{event.description}</div>
                        )}
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm">{event.room}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Note informative */}
            <div className="mt-4 text-center text-sm text-muted-foreground">
              💡 Dans cette vue, vous consultez l'ensemble de vos cours de toutes formations confondues, dans l'ordre chronologique
            </div>
          </div>
        );
      }
      
      // Vue liste standard pour les étudiants
      return (
        <div className="container mx-auto px-6 py-8">
          <div className="space-y-6">
            {filteredEvents.map((event) => {
              const eventDate = format(event.date, 'dd/MM/yyyy', { locale: fr });
              const eventDay = format(event.date, 'EEEE', { locale: fr });
              
              return (
                <div
                  key={event.id}
                  className="rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                  style={{ backgroundColor: event.color }}
                  onClick={() => handleEventClick(event)}
                >
                  <div className="p-6">
                    <div className="grid grid-cols-12 gap-4 items-center text-white">
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <div>
                            <div className="font-medium text-white">{eventDate}</div>
                            <div className="text-xs text-white/80">{eventDay}</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="bg-white/20 text-white border-white/30 rounded px-2 py-1 text-xs font-medium inline-block">
                          {event.startTime} - {event.endTime}
                        </div>
                      </div>
                      <div className="col-span-3">
                        <div className="font-medium text-white">{event.title}</div>
                        {event.description && (
                          <div className="text-xs text-white/80 mt-1 truncate">{event.description}</div>
                        )}
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm text-white/90">{event.instructor}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm text-white/90">{event.room}</span>
                      </div>
                      <div className="col-span-1">
                        {event.formation && (
                          <div className="bg-white/20 text-white border-white/30 rounded px-2 py-1 text-xs font-medium text-center">
                            {event.formation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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