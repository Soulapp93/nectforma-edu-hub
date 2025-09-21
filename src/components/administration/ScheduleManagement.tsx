import React, { useState, useEffect } from 'react';
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
import { format, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { WeekNavigator } from '@/components/schedule/WeekNavigator';
import { useSchedules } from '@/hooks/useSchedules';
import { scheduleService, Schedule, ScheduleSlot } from '@/services/scheduleService';
import AddSlotModal from '@/components/administration/AddSlotModal';
import EditSlotModal from '@/components/administration/EditSlotModal';
import SlotActionMenu from '@/components/administration/SlotActionMenu';
import ExcelImportModal from '@/components/administration/ExcelImportModal';
import CreateScheduleModal from './CreateScheduleModal';
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
    if (selectedSchedule) {
      fetchScheduleSlots();
    }
  }, [selectedSchedule]);

  const fetchScheduleSlots = async () => {
    if (!selectedSchedule) return;
    
    try {
      setSlotsLoading(true);
      const slotsData = await scheduleService.getScheduleSlots(selectedSchedule.id);
      setSlots(slotsData);
    } catch (error) {
      toast.error('Erreur lors du chargement des créneaux');
    } finally {
      setSlotsLoading(false);
    }
  };

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

  const handleSlotAdded = () => {
    fetchScheduleSlots();
    setIsAddSlotModalOpen(false);
    setSelectedSlot(null);
    toast.success('Créneau ajouté avec succès');
  };

  const handleEditSlot = (slot: ScheduleSlot) => {
    setSlotToEdit(slot);
    setIsEditSlotModalOpen(true);
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
    if (selectedSchedule) {
      fetchScheduleSlots();
    }
    setIsExcelImportModalOpen(false);
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
      color: slot.color || 'bg-blue-500',
      description: slot.notes || ''
    }));
  };

  const weekInfo = getWeekInfo(selectedDate);
  const weekDays = getWeekDays(selectedDate);
  
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
        color: slot.color || 'bg-blue-500'
      }))
    };
  });

  // Schedule detail view with same interface as main schedule
  if (selectedSchedule && viewMode !== 'list') {
    const events = convertSlotsToEvents(slots);
    
    // Render current view function
    const renderCurrentView = () => {
      switch (viewMode) {
        case 'week':
        default:
          return renderWeekOrListView();
      }
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
                      onClick={() => handleAddSlot(weekDays[parseInt(day.id) - 1], '09:00')}
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
                          
                          {/* Admin actions */}
                          <div className="flex items-center space-x-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
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
                  onClick={() => setIsExcelImportModalOpen(true)}
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
                  variant={viewMode === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                  className={`px-3 ${viewMode === 'week' ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-primary/10'}`}
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Semaine
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="px-3 hover:bg-primary/10"
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

      <AddSlotModal
        isOpen={isAddSlotModalOpen}
        onClose={() => setIsAddSlotModalOpen(false)}
        onSuccess={handleSlotAdded}
        scheduleId={selectedSchedule?.id || ''}
        formationId={selectedSchedule?.formation_id || ''}
        selectedSlot={selectedSlot}
      />

      <EditSlotModal
        isOpen={isEditSlotModalOpen}
        onClose={() => setIsEditSlotModalOpen(false)}
        onSuccess={handleSlotEdited}
        formationId={selectedSchedule?.formation_id || ''}
        slot={slotToEdit}
      />

      <ExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
        onSuccess={handleExcelImportSuccess}
        scheduleId={selectedSchedule?.id || ''}
      />
    </div>
  );
};

export default ScheduleManagement;