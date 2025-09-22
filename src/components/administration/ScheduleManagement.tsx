import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Calendar,
  Clock,
  MapPin,
  User,
  Book,
  Grid3X3,
  List,
  Eye,
  Plus,
  ChevronLeft,
  ChevronRight,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  format, 
  addWeeks, 
  subWeeks, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  isSameDay 
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { WeekNavigator } from '@/components/schedule/WeekNavigator';
import WeekNavigation from '@/components/ui/week-navigation';
import { useSchedules } from '@/hooks/useSchedules';
import { scheduleService, Schedule, ScheduleSlot } from '@/services/scheduleService';
import AddSlotModal from '@/components/administration/AddSlotModal';
import EditSlotModal from '@/components/administration/EditSlotModal';
import SlotActionMenu from '@/components/administration/SlotActionMenu';
import ExcelImportModal from '@/components/administration/ExcelImportModal';
import CreateScheduleModal from './CreateScheduleModal';
import { getModuleColor, extractModuleName } from '@/utils/moduleColors';
import { navigateWeek, getWeekInfo, getWeekDays } from '@/utils/calendarUtils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

type ViewMode = 'day' | 'week' | 'month' | 'list';

const ScheduleManagement = () => {
  const { schedules, loading, refetch } = useSchedules();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [isAddSlotModalOpen, setIsAddSlotModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [isEditSlotModalOpen, setIsEditSlotModalOpen] = useState(false);
  const [slotToEdit, setSlotToEdit] = useState<ScheduleSlot | null>(null);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [draggedSlot, setDraggedSlot] = useState<ScheduleSlot | null>(null);
  const [displayViewMode, setDisplayViewMode] = useState<'card' | 'list'>('card');
  const navigate = useNavigate();

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  // Load slots when a schedule is selected
  useEffect(() => {
    if (selectedSchedule?.id) {
      fetchScheduleSlots();
    }
  }, [selectedSchedule?.id]);

  const fetchScheduleSlots = useCallback(async () => {
    if (!selectedSchedule?.id) return;
    
    try {
      setSlotsLoading(true);
      const slotsData = await scheduleService.getScheduleSlots(selectedSchedule.id);
      setSlots(slotsData);
    } catch (error) {
      console.error('Erreur lors du chargement des créneaux:', error);
      toast.error('Erreur lors du chargement des créneaux');
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [selectedSchedule?.id]);

  const handleCreateSchedule = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    refetch();
    setIsCreateModalOpen(false);
    toast.success('Emploi du temps créé avec succès');
  };

  const handleDeleteSchedule = async (scheduleId: string, title: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'emploi du temps "${title}" ?`)) {
      try {
        await scheduleService.deleteSchedule(scheduleId);
        toast.success('Emploi du temps supprimé avec succès');
        refetch();
        if (selectedSchedule?.id === scheduleId) {
          setSelectedSchedule(null);
          setViewMode('list');
        }
      } catch (error) {
        toast.error('Erreur lors de la suppression de l\'emploi du temps');
      }
    }
  };

  const handleEditSchedule = (scheduleId: string) => {
    navigate(`/emploi-temps/edit/${scheduleId}`);
  };

  const handleViewSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setViewMode('week');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Publié':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Brouillon':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Slot management functions
  const handleAddSlot = (date: Date, time: string) => {
    setSelectedSlot({
      date: formatDate(date),
      time
    });
    setIsAddSlotModalOpen(true);
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleEditSlot = (slot: ScheduleSlot) => {
    if (selectedSchedule?.id) {
      setSlotToEdit(slot);
      setIsEditSlotModalOpen(true);
    } else {
      toast.error('Erreur: Aucun emploi du temps sélectionné');
    }
  };

  const handleSlotAdded = () => {
    fetchScheduleSlots();
    setIsAddSlotModalOpen(false);
    setSelectedSlot(null);
    toast.success('Créneau ajouté avec succès');
  };

  const handleSlotEdited = () => {
    fetchScheduleSlots();
    setIsEditSlotModalOpen(false);
    setSlotToEdit(null);
    toast.success('Créneau modifié avec succès');
  };

  const handleDuplicateSlot = async (slot: ScheduleSlot) => {
    try {
      const duplicatedSlot = {
        schedule_id: slot.schedule_id,
        module_id: slot.module_id,
        instructor_id: slot.instructor_id,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        room: slot.room ? `${slot.room} (copie)` : 'Salle (copie)',
        color: slot.color,
        notes: slot.notes
      };
      
      await scheduleService.createScheduleSlot(duplicatedSlot);
      fetchScheduleSlots();
      toast.success('Créneau dupliqué avec succès');
    } catch (error) {
      toast.error('Erreur lors de la duplication du créneau');
    }
  };

  const handleDeleteSlot = async (slot: ScheduleSlot) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) {
      try {
        await scheduleService.deleteScheduleSlot(slot.id);
        fetchScheduleSlots();
        toast.success('Créneau supprimé avec succès');
      } catch (error) {
        toast.error('Erreur lors de la suppression du créneau');
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, slot: ScheduleSlot) => {
    setDraggedSlot(slot);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    
    if (!draggedSlot) return;
    
    try {
      const newDate = formatDate(targetDate);
      if (newDate !== draggedSlot.date) {
        await scheduleService.updateScheduleSlot(draggedSlot.id, {
          date: newDate
        });
        fetchScheduleSlots();
        toast.success('Créneau déplacé avec succès');
      }
    } catch (error) {
      toast.error('Erreur lors du déplacement du créneau');
    } finally {
      setDraggedSlot(null);
    }
  };

  const handleExcelImportSuccess = () => {
    if (selectedSchedule?.id) {
      fetchScheduleSlots();
      setIsExcelImportModalOpen(false);
      toast.success('Import Excel terminé avec succès');
    }
  };

  const handlePublishSchedule = async () => {
    if (!selectedSchedule) return;
    
    try {
      await scheduleService.updateSchedule(selectedSchedule.id, { status: 'Publié' });
      toast.success("Emploi du temps publié avec succès");
      refetch();
      // Update local state
      setSelectedSchedule({ ...selectedSchedule, status: 'Publié' });
    } catch (error) {
      toast.error("Erreur lors de la publication");
    }
  };

  // Navigation handlers
  const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
    if (viewMode === 'month') {
      if (direction === 'prev') setSelectedDate(subMonths(selectedDate, 1));
      else if (direction === 'next') setSelectedDate(addMonths(selectedDate, 1));
      else setSelectedDate(new Date());
    } else if (viewMode === 'day') {
      if (direction === 'prev') {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        setSelectedDate(newDate);
      } else if (direction === 'next') {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 1);
        setSelectedDate(newDate);
      } else {
        setSelectedDate(new Date());
      }
    } else {
      setSelectedDate(navigateWeek(selectedDate, direction));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Chargement des emplois du temps...</p>
        </div>
      </div>
    );
  }

  // Convert ScheduleSlots to events format for display
  const convertSlotsToEvents = (slots: ScheduleSlot[]) => {
    return slots.map(slot => ({
      id: slot.id,
      title: slot.formation_modules?.title || 'Module non défini',
      date: new Date(slot.date),
      startTime: slot.start_time,
      endTime: slot.end_time,
      instructor: slot.users?.first_name && slot.users?.last_name 
        ? `${slot.users.first_name} ${slot.users.last_name}` 
        : 'Instructeur non défini',
      room: slot.room || 'Salle non définie',
      formation: selectedSchedule?.formations?.title || 'Formation',
      color: slot.notes ? getModuleColor(extractModuleName(slot.notes)) : '#3B82F6',
      description: slot.notes || ''
    }));
  };

  const weekInfo = useMemo(() => getWeekInfo(selectedDate), [selectedDate]);
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  
  // Prepare week schedule data for week and list views
  const mockSchedule = weekDays.map((date, index) => {
    const daySlots = slots.filter(slot => 
      new Date(slot.date).toDateString() === date.toDateString()
    );
    
    return {
      id: (index + 1).toString(),
      day: format(date, 'EEEE', { locale: fr }),
      date: format(date, 'd'),
      modules: daySlots.map(slot => ({
        title: slot.formation_modules?.title || 'Module non défini',
        time: `${slot.start_time} - ${slot.end_time}`,
        instructor: slot.users?.first_name && slot.users?.last_name 
          ? `${slot.users.first_name} ${slot.users.last_name}` 
          : 'Instructeur non défini',
        room: slot.room || 'Salle non définie',
        color: slot.notes ? getModuleColor(extractModuleName(slot.notes)) : '#3B82F6'
      }))
    };
  });

  // Schedule detail view with same interface as main schedule
  if (selectedSchedule && (viewMode === 'day' || viewMode === 'week' || viewMode === 'month')) {
    const events = convertSlotsToEvents(slots);
    
    // Render current view function
    const renderCurrentView = () => {
      switch (viewMode) {
        case 'day':
          return renderDayView();
        case 'week':
          return renderWeekOrListView();
        case 'month':
          return renderMonthView();
        default:
          return renderWeekOrListView();
      }
    };

    const renderDayView = () => {
      // Convertir les slots en événements pour la vue jour
      const daySlots = slots.filter(slot => 
        new Date(slot.date).toDateString() === selectedDate.toDateString()
      ).sort((a, b) => a.start_time.localeCompare(b.start_time));

      const slotsAsEvents = daySlots.map(slot => ({
        id: slot.id,
        title: slot.formation_modules?.title || 'Module non défini',
        date: new Date(slot.date),
        startTime: slot.start_time,
        endTime: slot.end_time,
        instructor: slot.users?.first_name && slot.users?.last_name 
          ? `${slot.users.first_name} ${slot.users.last_name}` 
          : 'Instructeur non défini',
        room: slot.room || 'Salle non définie',
        formation: selectedSchedule?.formations?.title || 'Formation',
        color: slot.color || '#3B82F6',
        description: slot.notes || ''
      }));

      const getEventForTimeSlot = (time: string) => {
        return slotsAsEvents.find(event => {
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
                      {slotsAsEvents.length} cours programmé{slotsAsEvents.length > 1 ? 's' : ''}
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

          {slotsAsEvents.length === 0 ? (
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
                              className="px-3 py-2 rounded-md shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer text-white"
                              style={{ 
                                 backgroundColor: event.color
                              }}
                              onClick={() => handleEditSlot(daySlots.find(s => s.id === event.id)!)}
                            >
                              <div className="space-y-1">
                                <h4 className="font-semibold text-white text-sm leading-tight">
                                  Module {event.title}
                                </h4>
                                
                                <div className="flex items-center text-xs text-white/90">
                                  <Clock className="h-3 w-3 mr-1.5 text-white/80" />
                                  <span>{event.startTime} - {event.endTime}</span>
                                </div>
                                
                                {event.room && (
                                  <div className="flex items-center text-xs text-white/90">
                                    <MapPin className="h-3 w-3 mr-1.5 text-white/80" />
                                    <span>Salle {event.room}</span>
                                  </div>
                                )}
                                
                                {event.instructor && (
                                  <div className="flex items-center text-xs text-white/90">
                                    <User className="h-3 w-3 mr-1.5 text-white/80" />
                                    <span>{event.instructor}</span>
                                  </div>
                                )}
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
                
                <div className="space-y-3">
                    {slotsAsEvents.map((event) => (
                       <div
                         key={event.id}
                         className="rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 text-white"
                         style={{ 
                           backgroundColor: event.color
                         }}
                         onClick={() => handleEditSlot(daySlots.find(s => s.id === event.id)!)}
                       >
                         <div className="p-4">
                           <div className="space-y-2">
                              <div className="font-semibold text-white text-sm">
                                Module {event.title}
                              </div>
                              
                              <div className="flex items-center text-xs text-white/90">
                                <Clock className="h-3 w-3 mr-1.5 text-white/80" />
                                <span>{event.startTime}</span>
                              </div>
                              <div className="flex items-center text-xs text-white/90">
                                <Clock className="h-3 w-3 mr-1.5 text-white/80" />
                                <span>{event.endTime}</span>
                              </div>
                              
                              {event.room && (
                                <div className="flex items-center text-xs text-white/90">
                                  <MapPin className="h-3 w-3 mr-1.5 text-white/80" />
                                  <span>Salle {event.room}</span>
                                </div>
                              )}
                              
                              {event.instructor && (
                                <div className="flex items-center text-xs text-white/90">
                                  <User className="h-3 w-3 mr-1.5 text-white/80" />
                                  <span>{event.instructor}</span>
                                </div>
                              )}
                           </div>
                         </div>
                       </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };

    const renderMonthView = () => {
      // Convertir les slots en événements pour la vue mensuelle
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
      
      const getSlotsForDate = (date: Date) => {
        return slots.filter(slot => isSameDay(new Date(slot.date), date));
      };

      const navigateMonth = (direction: 'prev' | 'next') => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        setSelectedDate(newDate);
      };

      const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

      return (
        <div className="max-w-7xl mx-auto p-6">
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
                      {format(selectedDate, 'MMMM yyyy', { locale: fr })}
                    </h2>
                    <p className="text-muted-foreground font-medium mt-1">
                      {slots.length} cours ce mois-ci
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
                  
                  <Badge 
                    variant="secondary" 
                    className="text-base px-6 py-3 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 text-primary font-semibold rounded-full"
                  >
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
          <Card className="border-0 shadow-2xl overflow-hidden rounded-3xl bg-gradient-to-br from-card to-muted/10">
            <CardContent className="p-0">
              {/* En-têtes des jours */}
              <div className="grid grid-cols-7 border-b border-border bg-gradient-to-r from-primary/5 via-muted/50 to-accent/5">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="p-4 text-center font-bold text-primary/80 backdrop-blur-sm"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Jours du calendrier */}
              <div className="grid grid-cols-7">
                {calendarDays.map((date) => {
                  const daySlots = getSlotsForDate(date);
                  const isCurrentMonth = isSameMonth(date, selectedDate);
                  const isSelected = isSameDay(date, selectedDate);
                  const isTodayDate = isToday(date);

                  const slotsAsEvents = daySlots.map(slot => ({
                    id: slot.id,
                    title: slot.formation_modules?.title || 'Module non défini',
                    startTime: slot.start_time,
                    endTime: slot.end_time,
                    instructor: slot.users?.first_name && slot.users?.last_name 
                      ? `${slot.users.first_name} ${slot.users.last_name}` 
                      : 'Instructeur non défini',
                    room: slot.room || 'Salle non définie',
                    color: slot.color || '#3B82F6'
                  }));

                  return (
                    <div
                      key={date.toISOString()}
                      className={`min-h-[130px] border-r border-b border-border/50 last:border-r-0 cursor-pointer transition-all duration-300 hover:bg-muted/30 ${
                        !isCurrentMonth ? 'bg-muted/20 opacity-60' : 'bg-background hover:shadow-lg'
                      } ${isSelected ? 'ring-2 ring-primary shadow-lg bg-primary/5' : ''}`}
                      onClick={() => setSelectedDate(date)}
                    >
                      <div className="p-2 h-full flex flex-col">
                        {/* Numéro du jour */}
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-sm font-bold ${
                              !isCurrentMonth 
                                ? 'text-muted-foreground' 
                                : isTodayDate 
                                  ? 'nect-gradient text-white w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-lg'
                                  : 'text-foreground'
                            }`}
                          >
                            {format(date, 'd')}
                          </span>
                          
                          {slotsAsEvents.length > 0 && (
                            <Badge variant="secondary" className="text-xs px-2 py-1 nect-gradient text-white rounded-full shadow-sm font-semibold">
                              {slotsAsEvents.length}
                            </Badge>
                          )}
                        </div>

                        {/* Événements */}
                        <div className="flex-1 space-y-1 overflow-hidden">
                           {slotsAsEvents.slice(0, 3).map((event, index) => {
                             const originalSlot = daySlots.find(s => s.id === event.id);
                             return (
                               <div
                                 key={event.id}
                                 className="px-2 py-2 rounded-md shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 mb-1 text-white"
                                 style={{ 
                                   backgroundColor: event.color
                                 }}
                                title={`${event.title} - ${event.startTime}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (originalSlot) handleEditSlot(originalSlot);
                                }}
                              >
                                <div className="space-y-0.5">
                                   <div className="font-semibold text-white text-[11px] leading-tight">
                                     Module {event.title}
                                   </div>
                                   
                                    <div className="flex items-center text-[9px] text-white/90">
                                      <Clock className="h-2.5 w-2.5 mr-1 text-white/80" />
                                      <span>{event.startTime}</span>
                                    </div>
                                    <div className="flex items-center text-[9px] text-white/90">
                                      <Clock className="h-2.5 w-2.5 mr-1 text-white/80" />
                                      <span>{event.endTime}</span>
                                    </div>
                                   
                                   {event.room && (
                                     <div className="flex items-center text-[9px] text-white/90">
                                       <MapPin className="h-2.5 w-2.5 mr-1 text-white/80" />
                                       <span>Salle {event.room}</span>
                                     </div>
                                   )}
                                   
                                   {event.instructor && (
                                     <div className="flex items-center text-[9px] text-white/90">
                                       <User className="h-2.5 w-2.5 mr-1 text-white/80" />
                                       <span>{event.instructor}</span>
                                     </div>
                                   )}
                                </div>
                             </div>
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

          {/* Légende */}
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
                    <span className="font-medium">Jour sélectionné</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-medium">Cliquez sur un jour pour voir les détails ✨</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    };

    const renderWeekOrListView = () => (
      <div className="container mx-auto px-6 py-8">
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
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm mb-2">Aucun cours</p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          if (selectedSchedule && selectedSchedule.id) {
                            handleAddSlot(weekDays[parseInt(day.id) - 1], '09:00');
                          } else {
                            toast.error('Veuillez sélectionner un emploi du temps');
                          }
                        }}
                        disabled={!selectedSchedule || !selectedSchedule.id}
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Ajouter
                      </Button>
                  </div>
                ) : (
                  <>
                    {day.modules.map((module, index) => (
                      <div
                        key={index}
                        className="relative p-4 rounded-xl bg-gradient-to-r from-card to-muted/30 border border-border hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer group"
                      >
                         <div 
                           className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
                           style={{ backgroundColor: getModuleColor(module.title) }}
                         />
                        
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
                          
                          {/* Admin actions */}
                          <div className="flex items-center space-x-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                const slot = slots.find(s => 
                                  s.formation_modules?.title === module.title &&
                                  new Date(s.date).toDateString() === weekDays[parseInt(day.id) - 1].toDateString()
                                );
                                if (slot) handleEditSlot(slot);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                const slot = slots.find(s => 
                                  s.formation_modules?.title === module.title &&
                                  new Date(s.date).toDateString() === weekDays[parseInt(day.id) - 1].toDateString()
                                );
                                if (slot) handleDeleteSlot(slot);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleAddSlot(weekDays[parseInt(day.id) - 1], '09:00')}
                      className="w-full text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Ajouter un cours
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
        {/* Header moderne identique à l'emploi du temps */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedSchedule(null);
                    setViewMode('list');
                  }}
                  className="p-2 hover:bg-primary/10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
                  <Calendar className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{selectedSchedule.title}</h1>
                  <p className="text-muted-foreground">
                    {`Semaine du ${weekInfo.start} au ${weekInfo.end}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Button 
                  onClick={() => {
                    console.log('selectedSchedule:', selectedSchedule);
                    if (selectedSchedule && selectedSchedule.id) {
                      setIsAddSlotModalOpen(true);
                    } else {
                      toast.error('Veuillez sélectionner un emploi du temps');
                    }
                  }}
                  disabled={!selectedSchedule || !selectedSchedule.id}
                  className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all hover:scale-105"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un créneau
                </Button>
                
                {selectedSchedule.status === 'Brouillon' && (
                  <Button 
                    onClick={handlePublishSchedule}
                    disabled={slots.length === 0}
                    className="bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg transition-all"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Publier
                  </Button>
                )}
                
                <Button 
                  onClick={() => {
                    console.log('selectedSchedule for Excel:', selectedSchedule);
                    if (selectedSchedule && selectedSchedule.id) {
                      setIsExcelImportModalOpen(true);
                    } else {
                      toast.error('Veuillez sélectionner un emploi du temps');
                    }
                  }}
                  disabled={!selectedSchedule || !selectedSchedule.id}
                  variant="outline"
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Excel
                </Button>
              </div>
            </div>

            {/* Navigation et vues identiques */}
            <div className="flex items-center justify-between">
              <WeekNavigator 
                currentDate={selectedDate}
                onNavigate={handleNavigate}
              />

              <div className="flex items-center space-x-2 bg-muted/50 rounded-xl p-1 border">
                <Button
                  variant={viewMode === 'day' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('day')}
                  className={`px-3 ${viewMode === 'day' ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-primary/10'}`}
                >
                  <Calendar className="h-4 w-4 mr-2" />
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
              </div>
            </div>

            {/* Barre de navigation par semaine */}
            <div className="mt-6">
              <WeekNavigation
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onWeekSelect={(weekStartDate) => {
                  setSelectedDate(weekStartDate);
                  if (viewMode !== 'week') {
                    setViewMode('week');
                  }
                }}
                className="bg-background/95 backdrop-blur-sm border-border"
              />
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        {renderCurrentView()}
      </div>
    );
  }

  // List view (default) - Interface identique à l'emploi du temps principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
      {/* Header moderne identique */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
                <Calendar className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Gestion des Emplois du Temps</h1>
                <p className="text-muted-foreground">
                  Créez et gérez les emplois du temps pour chaque formation
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button 
                onClick={handleCreateSchedule}
                className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer un Emploi du Temps
              </Button>
            </div>
          </div>

          {/* Navigation et vues identiques à l'emploi du temps */}
          <div className="flex items-center justify-between">
            <WeekNavigator 
              currentDate={selectedDate}
              onNavigate={handleNavigate}
            />

            <div className="flex items-center space-x-2 bg-muted/50 rounded-xl p-1 border">
              <Button
                variant={displayViewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDisplayViewMode('card')}
                className={`px-3 ${displayViewMode === 'card' ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-primary/10'}`}
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                Cartes
              </Button>
              <Button
                variant={displayViewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDisplayViewMode('list')}
                className={`px-3 ${displayViewMode === 'list' ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-primary/10'}`}
              >
                <List className="h-4 w-4 mr-2" />
                Liste
              </Button>
            </div>
          </div>

          {/* Barre de navigation par semaine */}
          <div className="mt-6">
            <WeekNavigation
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              className="bg-background/95 backdrop-blur-sm border-border"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Contenu principal avec le même style */}
        {schedules.length === 0 ? (
          <Card className="border-dashed border-2 border-border/50 bg-card/30">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Aucun emploi du temps
              </h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Commencez par créer votre premier emploi du temps pour organiser les cours et formations.
              </p>
              <Button onClick={handleCreateSchedule} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Créer un emploi du temps
              </Button>
            </CardContent>
          </Card>
        ) : displayViewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {schedules.map((schedule) => (
              <Card
                key={schedule.id}
                className={`overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 bg-card shadow-md hover:shadow-primary/10 cursor-pointer`}
                onClick={() => handleViewSchedule(schedule)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-foreground">
                        {schedule.title}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                          {schedule.formations?.title || 'Formation'}
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getStatusColor(schedule.status)}`}
                        >
                          {schedule.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Book className="h-3 w-3 mr-1" />
                      {schedule.academic_year}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(schedule.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  
                  {/* Actions admin */}
                  <div className="flex items-center space-x-1 pt-2 border-t border-border/50">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditSchedule(schedule.id);
                      }}
                      className="flex-1 text-xs"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Éditer
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSchedule(schedule.id, schedule.title);
                      }}
                      className="text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <Card key={schedule.id} className="overflow-hidden border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                        {schedule.title}
                      </CardTitle>
                      <Badge 
                        variant="secondary" 
                        className={getStatusColor(schedule.status)}
                      >
                        {schedule.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleViewSchedule(schedule)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditSchedule(schedule.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteSchedule(schedule.id, schedule.title)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Formation</p>
                      <p className="font-medium">{schedule.formations?.title || 'Non définie'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Année académique</p>
                      <p className="font-medium">{schedule.academic_year}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Créé le</p>
                      <p className="font-medium">{new Date(schedule.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateScheduleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {selectedSchedule && (
        <>
          <AddSlotModal
            isOpen={isAddSlotModalOpen}
            onClose={() => setIsAddSlotModalOpen(false)}
            onSuccess={handleSlotAdded}
            scheduleId={selectedSchedule.id}
            formationId={selectedSchedule.formation_id || ''}
            selectedSlot={selectedSlot}
          />

          <EditSlotModal
            isOpen={isEditSlotModalOpen}
            onClose={() => setIsEditSlotModalOpen(false)}
            onSuccess={handleSlotEdited}
            formationId={selectedSchedule.formation_id || ''}
            slot={slotToEdit}
          />

          <ExcelImportModal
            isOpen={isExcelImportModalOpen}
            onClose={() => setIsExcelImportModalOpen(false)}
            onSuccess={handleExcelImportSuccess}
            scheduleId={selectedSchedule.id}
          />
        </>
      )}
    </div>
  );
};

export default ScheduleManagement;