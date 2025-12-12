import React, { useState, useEffect } from 'react';
import { format, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users, Calendar, GraduationCap, ChevronUp, ChevronDown, Clock, BookOpen, User, MapPin, Eye } from 'lucide-react';
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

    // Vue liste format tableau coloré - Design comme dans l'administration
    // Fonction pour formater les horaires en HH:mm
    const formatTime = (time: string) => {
      if (!time) return '';
      const parts = time.split(':');
      return `${parts[0]}:${parts[1]}`;
    };

    return (
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-8">
        <div className="bg-card rounded-2xl shadow-xl border border-border/40 overflow-hidden">
          {/* En-têtes du tableau - Design moderne comme l'admin */}
          <div className="bg-muted/60 border-b border-border/40 px-4 sm:px-6 py-4">
            <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center text-xs sm:text-sm font-semibold text-muted-foreground">
              <div className="col-span-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horaire
              </div>
              <div className="col-span-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Module
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Formateur
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Salle
              </div>
              <div className="col-span-1 text-center">Actions</div>
            </div>
          </div>

          {/* Corps du tableau - Créneaux colorés */}
          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
            {listEvents.length === 0 && (
              <div className="px-4 sm:px-6 py-8 text-center text-sm text-muted-foreground bg-muted/30 rounded-xl">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Aucun cours pour la période sélectionnée.</p>
              </div>
            )}

            {listEvents.map((event) => {
              const slotColor = event.color || '#8B5CF6';

              return (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                  style={{ backgroundColor: slotColor }}
                >
                  <div className="px-4 sm:px-6 py-4">
                    <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center">
                      {/* Date */}
                      <div className="col-span-2">
                        <div className="text-sm font-bold text-white">
                          {format(event.date, 'dd/MM/yyyy', { locale: fr })}
                        </div>
                        <div className="text-xs text-white/80 capitalize">
                          {format(event.date, 'EEEE', { locale: fr })}
                        </div>
                      </div>

                      {/* Horaire */}
                      <div className="col-span-2">
                        <span className="inline-flex items-center rounded-md bg-white/20 backdrop-blur-sm px-2.5 py-1 text-xs sm:text-sm font-semibold text-white border border-white/30">
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </span>
                      </div>

                      {/* Module */}
                      <div className="col-span-3">
                        <div className="text-sm font-bold text-white">
                          {event.title}
                        </div>
                      </div>

                      {/* Formateur */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-white/70" />
                          <span className="text-sm text-white/90 truncate">
                            {event.instructor || 'Non assigné'}
                          </span>
                        </div>
                      </div>

                      {/* Salle */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-white/70" />
                          <span className="text-sm text-white font-medium">
                            {event.room || 'Non définie'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                          className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
