import React, { useState, useEffect } from 'react';
import { format, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users, Calendar, GraduationCap, ChevronUp, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
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
import { useUserFormations } from '@/hooks/useUserFormations';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PrintScheduleModal } from '@/components/schedule/PrintScheduleModal';
import type { ScheduleEvent } from '@/components/schedule/CreateEventModal';

// Définition du type pour les créneaux de l'emploi du temps
interface ScheduleSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  room: string;
  notes: string;
  formation_modules?: {
    title: string;
  };
  users?: {
    first_name: string;
    last_name: string;
  };
  schedules?: {
    formation_id: string;
    formations?: {
      title: string;
      color: string;
    };
  };
  color?: string;
}

type ViewMode = 'day' | 'week' | 'month' | 'list';

const EmploiTemps = () => {
  const { userRole, userId } = useCurrentUser();
  const [isWeekNavigationOpen, setIsWeekNavigationOpen] = useState(true);
  const isInstructor = userRole === 'Formateur' || userRole === 'Tuteur';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [selectedFormationId, setSelectedFormationId] = useState<string | null>(null);

  const { toast } = useToast();
  const { schedules, loading, error } = useUserSchedules();
  const { userFormations, loading: loadingFormations } = useUserFormations();

  // Auto-sélectionner la formation si l'utilisateur n'en a qu'une (étudiant)
  useEffect(() => {
    if (userRole === 'Étudiant' && userFormations.length === 1 && !selectedFormationId) {
      setSelectedFormationId(userFormations[0].formation_id);
    }
  }, [userFormations, userRole, selectedFormationId]);

  // Conversion des créneaux en événements
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

  const allEvents = convertToEvents(schedules);

  const events = userRole === 'Étudiant' && selectedFormationId
    ? allEvents.filter(event => event.formationId === selectedFormationId)
    : allEvents;

  const sortedEvents = [...events].sort((a, b) => {
    const dateCompare = a.date.getTime() - b.date.getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const categorizedEvents = {
    past: sortedEvents.filter(e => e.date < today),
    today: sortedEvents.filter(e => e.date.toDateString() === today.toDateString()),
    upcoming: sortedEvents.filter(e => e.date > today)
  };

  if (loading || loadingFormations) {
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
            label: 'Réessayer',
            onClick: () => window.location.reload(),
          }}
        />
      </div>
    );
  }

  const handleEventClick = (event: ScheduleEvent) => {
    setSelectedEvent(event);
    setIsEventDetailsOpen(true);
  };

  const handleEventEdit = () => {
    toast({
      title: 'Information',
      description: "Seuls les administrateurs peuvent modifier les emplois du temps via l'onglet Administration.",
    });
  };

  const handleEventDelete = () => {
    toast({
      title: 'Information',
      description: 'Seuls les administrateurs peuvent supprimer des créneaux via l\'onglet Administration.',
    });
  };

  const handleEventDuplicate = () => {
    toast({
      title: 'Information',
      description: 'Seuls les administrateurs peuvent dupliquer des créneaux via l\'onglet Administration.',
    });
  };

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

  const filteredEvents = (() => {
    if (viewMode === 'day') {
      return events.filter(event => event.date.toDateString() === currentDate.toDateString());
    }

    if (viewMode === 'week' || viewMode === 'list') {
      const weekDays = getWeekDays(currentDate);
      const weekStart = weekDays[0];
      const weekEnd = weekDays[6];
      return events.filter(event => event.date >= weekStart && event.date <= weekEnd);
    }

    if (viewMode === 'month') {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      return events.filter(event => event.date >= monthStart && event.date <= monthEnd);
    }

    return events;
  })();

  const listEvents = [...filteredEvents].sort((a, b) => {
    const dateCompare = a.date.getTime() - b.date.getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  const weekDays = getWeekDays(currentDate);
  const mockSchedule = weekDays.map((date, index) => {
    const dayEvents = filteredEvents.filter(event => event.date.toDateString() === date.toDateString());

    return {
      id: (index + 1).toString(),
      day: format(date, 'EEEE', { locale: fr }),
      date: format(date, 'd'),
      modules: dayEvents.map(event => ({
        title: event.title,
        time: `${event.startTime} - ${event.endTime}`,
        instructor: event.instructor,
        room: event.room,
        color: event.color,
      })),
    };
  });

  const weekInfo = getWeekInfo(currentDate);

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
    }

    const instructor = userRole === 'Formateur' || userRole === 'Tuteur';

    if (instructor) {
      return (
        <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-8">
          <div className="bg-card rounded-2xl shadow-lg border border-border/60 overflow-hidden">
            {/* En-têtes */}
            <div className="px-4 sm:px-6 py-3 border-b border-border/60 bg-muted/40">
              <div className="grid grid-cols-12 gap-4 items-center text-xs sm:text-sm font-medium text-muted-foreground">
                <div className="col-span-3 sm:col-span-3">Date</div>
                <div className="col-span-3 sm:col-span-2">Horaire</div>
                <div className="hidden sm:block sm:col-span-3">Module</div>
                <div className="hidden sm:block sm:col-span-2">Formateur</div>
                <div className="col-span-6 sm:col-span-2">Salle</div>
              </div>
            </div>

            {/* Lignes */}
            <div className="divide-y divide-border/60">
              {listEvents.length === 0 && (
                <div className="px-4 sm:px-6 py-6 text-center text-sm text-muted-foreground">
                  Aucun cours pour la semaine sélectionnée.
                </div>
              )}

              {listEvents.map((event) => (
                <div key={event.id} className="px-4 sm:px-6 py-4 sm:py-5">
                  <div
                    className="rounded-xl shadow-md sm:shadow-lg overflow-hidden"
                    style={{ backgroundColor: event.color }}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center px-4 sm:px-6 py-3 sm:py-4 text-primary-foreground">
                      {/* Date */}
                      <div className="col-span-3 sm:col-span-3">
                        <div className="text-sm sm:text-base font-semibold">
                          {format(event.date, 'dd/MM/yyyy', { locale: fr })}
                        </div>
                        <div className="text-xs sm:text-sm opacity-80 capitalize">
                          {format(event.date, 'EEEE', { locale: fr })}
                        </div>
                      </div>

                      {/* Horaire */}
                      <div className="col-span-3 sm:col-span-2">
                        <span className="inline-flex items-center rounded-full bg-background/20 px-3 py-1 text-xs sm:text-sm font-medium">
                          {event.startTime} - {event.endTime}
                        </span>
                      </div>

                      {/* Module */}
                      <div className="hidden sm:block sm:col-span-3">
                        <div className="text-sm sm:text-base font-semibold truncate">
                          {event.title}
                        </div>
                        <div className="text-xs opacity-80 truncate mt-0.5">
                          {event.formation}
                        </div>
                      </div>

                      {/* Formateur */}
                      <div className="hidden sm:block sm:col-span-2">
                        <div className="text-xs sm:text-sm opacity-90 truncate">
                          {event.instructor}
                        </div>
                      </div>

                      {/* Salle */}
                      <div className="col-span-6 sm:col-span-2">
                        <div className="inline-flex items-center rounded-full bg-background/20 px-3 py-1 text-xs sm:text-sm font-medium">
                          {event.room}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Vue liste standard pour les étudiants
    return (
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-8">
        <h2 className="text-2xl font-bold mb-4">Liste des cours</h2>
        {categorizedEvents.upcoming.length > 0 && (
          <section className="mb-6">
            <h3 className="text-xl font-semibold mb-2">À venir</h3>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {categorizedEvents.upcoming.map((event) => (
                <div key={event.id} className="bg-card rounded-lg shadow-md p-4 border border-border">
                  <h4 className="font-semibold">{event.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(event.date, 'EEEE d MMMM', { locale: fr })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {event.startTime} - {event.endTime}
                  </p>
                  <p className="text-sm text-muted-foreground">Salle: {event.room}</p>
                  <p className="text-sm text-muted-foreground">
                    Intervenant: {event.instructor}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {categorizedEvents.today.length > 0 && (
          <section className="mb-6">
            <h3 className="text-xl font-semibold">Aujourd'hui</h3>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {categorizedEvents.today.map((event) => (
                <div key={event.id} className="bg-card rounded-lg shadow-md p-4 border border-border">
                  <h4 className="font-semibold">{event.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(event.date, 'EEEE d MMMM', { locale: fr })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {event.startTime} - {event.endTime}
                  </p>
                  <p className="text-sm text-muted-foreground">Salle: {event.room}</p>
                  <p className="text-sm text-muted-foreground">
                    Intervenant: {event.instructor}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  };

  const hasNoEvents = events.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
      <ScheduleViewHeader
        currentDate={currentDate}
        weekInfo={weekInfo}
        viewMode={viewMode}
        schedulesCount={events.length}
      />

      <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        {/* Print button for all users */}
        <div className="flex justify-end mb-3">
          <PrintScheduleModal
            schedules={schedules}
            title="Emploi du temps"
            userRole={userRole || undefined}
          />
        </div>

        {userRole === 'Étudiant' && userFormations.length > 1 && (
          <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-card p-3 sm:p-4 rounded-lg border border-border shadow-sm">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Formation :</span>
            </div>
            <Select
              value={selectedFormationId || undefined}
              onValueChange={setSelectedFormationId}
            >
              <SelectTrigger className="w-full sm:w-[320px]">
                <SelectValue placeholder="Sélectionnez une formation" />
              </SelectTrigger>
              <SelectContent>
                {userFormations.map((uf) => (
                  <SelectItem key={uf.formation_id} value={uf.formation_id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: uf.formation.color || '#8B5CF6' }}
                      />
                      <span className="truncate">{uf.formation.title}</span>
                      <Badge variant="outline" className="ml-2 text-xs hidden sm:inline-flex">
                        {uf.formation.level}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <WeekNavigator currentDate={currentDate} onNavigate={handleNavigate} />

          <ViewModeSelector viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>

        {/* Barre de navigation par semaine - Collapsible */}
        <Collapsible open={isWeekNavigationOpen} onOpenChange={setIsWeekNavigationOpen} className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Navigation par semaines</h3>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isWeekNavigationOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <WeekNavigation
              selectedDate={currentDate}
              onDateChange={setCurrentDate}
              onWeekSelect={(weekStartDate) => {
                setCurrentDate(weekStartDate);
                if (viewMode !== 'week') {
                  setViewMode('week');
                }
              }}
              className="bg-background/95 backdrop-blur-sm border border-border rounded-xl"
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Important: pour les formateurs/tuteurs, on rend toujours la vue calendrier même sans cours */}
        {hasNoEvents && !isInstructor && viewMode !== 'week' ? (
          <div className="mt-8">
            <EmptyState
              title="Aucun cours planifié"
              description={
                userRole === 'Étudiant'
                  ? "Aucun cours n'est programmé pour vos formations actuellement."
                  : "Aucun emploi du temps publié pour le moment."
              }
            />
          </div>
        ) : (
          renderCurrentView()
        )}
      </div>

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
