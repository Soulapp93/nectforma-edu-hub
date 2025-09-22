import React, { useState } from 'react';
import { format, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { navigateWeek, getWeekInfo, getWeekDays } from '@/utils/calendarUtils';
import { useToast } from '@/hooks/use-toast';
import { CreateEventModal, ScheduleEvent } from '@/components/schedule/CreateEventModal';
import { EventDetailsModal } from '@/components/schedule/EventDetailsModal';
import { DayView } from '@/components/schedule/DayView';
import { MonthView } from '@/components/schedule/MonthView';
import { ScheduleHeader } from '@/components/schedule/ScheduleHeader';
import { ViewModeSelector } from '@/components/schedule/ViewModeSelector';
import { ScheduleCalendarView } from '@/components/schedule/ScheduleCalendarView';
import { ExcelImportModal } from '@/components/schedule/ExcelImportModal';
import { WeekNavigator } from '@/components/schedule/WeekNavigator';
import WeekNavigation from '@/components/ui/week-navigation';

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
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [selectedDateForSlot, setSelectedDateForSlot] = useState<Date | undefined>(undefined);
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

  const handleImportExcel = () => {
    setIsExcelImportOpen(true);
  };

  const handleExcelImport = (data: any[]) => {
    const importedEvents: ScheduleEvent[] = data.map((row, index) => ({
      id: `imported-${Date.now()}-${index}`,
      title: row.module,
      date: new Date(row.date),
      startTime: row.startTime,
      endTime: row.endTime,
      instructor: row.instructor,
      room: row.room,
      formation: row.formation,
      color: '#8B5CF6',
      description: `Importé depuis Excel`
    }));

    setEvents(prev => [...prev, ...importedEvents]);
    setIsExcelImportOpen(false);
  };

  const handleAddSlotToDate = (date: string) => {
    // Créer une date à partir du jour sélectionné dans le mois courant
    const selectedDate = new Date(currentDate);
    selectedDate.setDate(parseInt(date));
    
    // Ouvrir le modal avec la date pré-sélectionnée
    setSelectedDateForSlot(selectedDate);
    setIsCreateEventModalOpen(true);
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

  const renderWeekOrListView = () => {
    if (viewMode === 'week') {
      return (
        <ScheduleCalendarView
          schedule={mockSchedule}
          filteredEvents={filteredEvents}
          onEventClick={handleEventClick}
          onAddSlotToDate={handleAddSlotToDate}
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
                  {day.modules.map((module, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border border-border hover:shadow-md transition-all duration-200 cursor-pointer"
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
                          <h4 className="font-semibold text-foreground mb-2">
                            {module.title}
                          </h4>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div>{module.time}</div>
                            <div>{module.room}</div>
                            <div>{module.instructor}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
      {/* Header refactorisé */}
      <ScheduleHeader
        currentDate={currentDate}
        weekInfo={weekInfo}
        viewMode={viewMode}
        onEventCreated={handleEventCreated}
        onImportExcel={handleImportExcel}
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

      {/* Modals */}
      <EventDetailsModal
        event={selectedEvent}
        isOpen={isEventDetailsOpen}
        onClose={() => setIsEventDetailsOpen(false)}
        onEdit={handleEventEdit}
        onDelete={handleEventDelete}
        onDuplicate={handleEventDuplicate}
      />

      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onOpenChange={setIsExcelImportOpen}
        onImport={handleExcelImport}
      />

      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onOpenChange={setIsCreateEventModalOpen}
        onEventCreated={handleEventCreated}
        preselectedDate={selectedDateForSlot}
      />
    </div>
  );
};

export default EmploiTemps;