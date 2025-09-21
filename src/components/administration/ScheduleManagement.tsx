import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, Upload, FileSpreadsheet, CheckCircle, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import WeekNavigation from '@/components/ui/week-navigation';
import { useSchedules } from '@/hooks/useSchedules';
import { scheduleService, Schedule, ScheduleSlot } from '@/services/scheduleService';
import AddSlotModal from '@/components/administration/AddSlotModal';
import EditSlotModal from '@/components/administration/EditSlotModal';
import SlotActionMenu from '@/components/administration/SlotActionMenu';
import ExcelImportModal from '@/components/administration/ExcelImportModal';
import CreateScheduleModal from './CreateScheduleModal';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const ScheduleManagement = () => {
  const { schedules, loading, refetch } = useSchedules();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'list' | 'day' | 'week' | 'month'>('list');
  const [displayMode, setDisplayMode] = useState<'planning' | 'list'>('planning');
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [isAddSlotModalOpen, setIsAddSlotModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [isEditSlotModalOpen, setIsEditSlotModalOpen] = useState(false);
  const [slotToEdit, setSlotToEdit] = useState<ScheduleSlot | null>(null);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [draggedSlot, setDraggedSlot] = useState<ScheduleSlot | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const navigate = useNavigate();

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

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
          setCurrentView('list');
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
    setCurrentView('week');
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

  // Week view helper functions
  const getWeekDates = () => {
    const monday = new Date(selectedDate);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);

    return weekDays.map((_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return date;
    });
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const getSlotsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return slots.filter(slot => slot.date === dateStr).sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    
    if (currentView === 'day') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (currentView === 'week') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (currentView === 'month') {
      newDate.setMonth(selectedDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    
    setSelectedDate(newDate);
  };

  const getCurrentPeriodLabel = () => {
    if (currentView === 'day') {
      return selectedDate.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } else if (currentView === 'week') {
      const weekDates = getWeekDates();
      const start = weekDates[0];
      const end = weekDates[6];
      return `Semaine Du ${start.getDate()} Au ${end.getDate()} ${start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
    } else {
      return selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
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

  // Schedule detail view
  if (selectedSchedule && currentView !== 'list') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
        {/* Modern Header */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedSchedule(null);
                    setCurrentView('list');
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
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {selectedSchedule.formations?.title}
                    </Badge>
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">
                      {selectedSchedule.academic_year}
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className={getStatusColor(selectedSchedule.status)}
                    >
                      {selectedSchedule.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                  {slots.length} créneaux
                </div>
                
                {selectedSchedule.status === 'Brouillon' && (
                  <Button 
                    onClick={handlePublishSchedule}
                    disabled={slots.length === 0}
                    className="bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg transition-all"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Publier l'emploi du temps
                  </Button>
                )}
                
                {selectedSchedule.status === 'Publié' && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Publié</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-6 space-y-6">
          {/* Week Navigation */}
          <WeekNavigation
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            className="mb-6"
          />

          {/* Schedule Editor */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-lg border border-border/50">
            {/* Controls */}
            <div className="p-6 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex bg-muted/50 rounded-xl p-1 border border-border/30">
                    <button
                      onClick={() => setCurrentView('day')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        currentView === 'day' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Jour
                    </button>
                    <button
                      onClick={() => setCurrentView('week')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        currentView === 'week' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Semaine
                    </button>
                    <button
                      onClick={() => setCurrentView('month')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        currentView === 'month' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Mois
                    </button>
                  </div>

                  {(currentView === 'week' || currentView === 'day' || currentView === 'month') && (
                    <div className="flex bg-muted/50 rounded-xl p-1 border border-border/30">
                      <button
                        onClick={() => setDisplayMode('planning')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          displayMode === 'planning' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Planning
                      </button>
                      <button
                        onClick={() => setDisplayMode('list')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          displayMode === 'list' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Liste
                      </button>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigateDate('prev')}
                      className="hover:bg-primary/10"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium min-w-60 text-center text-foreground">{getCurrentPeriodLabel()}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigateDate('next')}
                      className="hover:bg-primary/10"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                    className="hover:bg-primary/10"
                  >
                    Aujourd'hui
                  </Button>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    onClick={() => setIsExcelImportModalOpen(true)}
                    className="hover:bg-primary/10"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Import Excel
                  </Button>
                  <Button 
                    onClick={() => handleAddSlot(new Date(), '09:00')}
                    className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un créneau
                  </Button>
                </div>
              </div>
            </div>

            {/* Schedule content would continue here with modern styling... */}
            <div className="p-6">
              <div className="text-center py-8 text-muted-foreground">
                Interface de planification moderne en cours de développement...
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view (default) - Modern interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
      {/* Modern Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
                <Clock className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Gestion des Emplois du Temps</h1>
                <p className="text-muted-foreground">
                  Créez et gérez les emplois du temps pour chaque formation
                </p>
              </div>
            </div>
            <Button 
              onClick={handleCreateSchedule} 
              className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer un Emploi du Temps
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'card' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('card')}
              className={viewMode === 'card' ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/10'}
            >
              Vue en cartes
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/10'}
            >
              Vue en liste
            </Button>
          </div>
        </div>

        {/* Schedules Grid/List */}
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
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedules.map((schedule) => (
              <Card 
                key={schedule.id} 
                className="group hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {schedule.title}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          {schedule.formations?.title || 'Formation non définie'}
                        </Badge>
                        <Badge variant="secondary" className="bg-muted text-muted-foreground">
                          {schedule.academic_year}
                        </Badge>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={getStatusColor(schedule.status)}
                    >
                      {schedule.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p><strong>Formation:</strong> {schedule.formations?.title || 'Non définie'}</p>
                    <p><strong>Année:</strong> {schedule.academic_year}</p>
                    <p><strong>Créé le:</strong> {new Date(schedule.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleViewSchedule(schedule)}
                      className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEditSchedule(schedule.id)}
                      className="hover:bg-primary/10"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDeleteSchedule(schedule.id, schedule.title)}
                      className="text-destructive hover:bg-destructive/10 hover:border-destructive/20"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left p-4 font-semibold text-foreground">Nom</th>
                      <th className="text-left p-4 font-semibold text-foreground">Formation</th>
                      <th className="text-left p-4 font-semibold text-foreground">Année</th>
                      <th className="text-left p-4 font-semibold text-foreground">Statut</th>
                      <th className="text-left p-4 font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((schedule) => (
                      <tr key={schedule.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-foreground">{schedule.title}</div>
                            <div className="text-sm text-muted-foreground">Emploi du temps</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                            {schedule.formations?.title || 'Non définie'}
                          </Badge>
                        </td>
                        <td className="p-4 text-foreground">{schedule.academic_year}</td>
                        <td className="p-4">
                          <Badge 
                            variant="secondary" 
                            className={getStatusColor(schedule.status)}
                          >
                            {schedule.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex space-x-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleViewSchedule(schedule)}
                              className="hover:bg-primary/10"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleEditSchedule(schedule.id)}
                              className="hover:bg-primary/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDeleteSchedule(schedule.id, schedule.title)}
                              className="text-destructive hover:bg-destructive/10 hover:border-destructive/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateScheduleModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {isAddSlotModalOpen && selectedSlot && selectedSchedule && (
        <AddSlotModal
          isOpen={isAddSlotModalOpen}
          onClose={() => setIsAddSlotModalOpen(false)}
          onSuccess={handleSlotAdded}
          scheduleId={selectedSchedule.id}
          formationId={selectedSchedule.formation_id}
          selectedSlot={selectedSlot}
        />
      )}

      {isEditSlotModalOpen && slotToEdit && selectedSchedule && (
        <EditSlotModal
          isOpen={isEditSlotModalOpen}
          onClose={() => setIsEditSlotModalOpen(false)}
          onSuccess={handleSlotEdited}
          slot={slotToEdit}
          formationId={selectedSchedule.formation_id}
        />
      )}

      {isExcelImportModalOpen && selectedSchedule && (
        <ExcelImportModal
          isOpen={isExcelImportModalOpen}
          onClose={() => setIsExcelImportModalOpen(false)}
          onSuccess={handleExcelImportSuccess}
          scheduleId={selectedSchedule.id}
        />
      )}
    </div>
  );
};

export default ScheduleManagement;