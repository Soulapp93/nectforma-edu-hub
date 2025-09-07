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
        return 'bg-green-100 text-green-800';
      case 'Brouillon':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Schedule detail view
  if (selectedSchedule && currentView !== 'list') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedSchedule(null);
                setCurrentView('list');
              }}
              className="p-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{selectedSchedule.title}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {selectedSchedule.formations?.title}
                </Badge>
                <Badge variant="secondary">
                  {selectedSchedule.academic_year}
                </Badge>
                <Badge 
                  variant="secondary" 
                  className={selectedSchedule.status === 'Publié' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                >
                  {selectedSchedule.status}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{slots.length} créneaux</span>
            
            {selectedSchedule.status === 'Brouillon' && (
              <Button 
                onClick={handlePublishSchedule}
                disabled={slots.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Publier l'emploi du temps
              </Button>
            )}
            
            {selectedSchedule.status === 'Publié' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Publié</span>
              </div>
            )}
          </div>
        </div>

        {/* Week Navigation */}
        <WeekNavigation
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          className="mb-6"
        />

        {/* Schedule Editor */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {/* Controls */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setCurrentView('day')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === 'day' ? 'bg-white text-primary shadow-sm' : 'text-gray-600'
                    }`}
                  >
                    Jour
                  </button>
                  <button
                    onClick={() => setCurrentView('week')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === 'week' ? 'bg-white text-primary shadow-sm' : 'text-gray-600'
                    }`}
                  >
                    Semaine
                  </button>
                  <button
                    onClick={() => setCurrentView('month')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === 'month' ? 'bg-white text-primary shadow-sm' : 'text-gray-600'
                    }`}
                  >
                    Mois
                  </button>
                </div>

                {(currentView === 'week' || currentView === 'day' || currentView === 'month') && (
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setDisplayMode('planning')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        displayMode === 'planning' ? 'bg-white text-primary shadow-sm' : 'text-gray-600'
                      }`}
                    >
                      Planning
                    </button>
                    <button
                      onClick={() => setDisplayMode('list')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        displayMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-gray-600'
                      }`}
                    >
                      Liste
                    </button>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => navigateDate('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-60 text-center">{getCurrentPeriodLabel()}</span>
                  <Button variant="ghost" size="sm" onClick={() => navigateDate('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Aujourd'hui
                </Button>
              </div>

              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => setIsExcelImportModalOpen(true)}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Import Excel
                </Button>
                <Button 
                  onClick={() => handleAddSlot(new Date(), '09:00')}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un créneau
                </Button>
              </div>
            </div>
          </div>

          {/* Weekly Schedule - Planning View */}
          {currentView === 'week' && displayMode === 'planning' && (
            <div className="p-6">
              {slotsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-3">
                  {getWeekDates().map((date, index) => (
                    <div 
                      key={index} 
                      className="min-h-[500px]"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, date)}
                    >
                      <div className="text-center mb-4 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/10">
                        <div className="font-semibold text-base text-primary">{weekDays[index]}</div>
                        <div className="text-3xl font-bold mt-2 text-foreground">
                          {date.getDate()}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {date.toLocaleDateString('fr-FR', { month: 'short' })}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {getSlotsForDate(date).map((slot) => (
                          <div
                            key={slot.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, slot)}
                            className="p-4 rounded-xl shadow-sm cursor-move hover:shadow-lg transition-all duration-200 border border-white/20 group"
                            style={{
                              backgroundColor: slot.color || selectedSchedule.formations?.color || '#8B5CF6',
                              color: 'white'
                            }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="font-semibold text-sm leading-tight flex-1">
                                {slot.formation_modules?.title || 'Module non défini'}
                              </div>
                              <SlotActionMenu
                                slot={slot}
                                onEdit={handleEditSlot}
                                onDuplicate={handleDuplicateSlot}
                                onDelete={handleDeleteSlot}
                              />
                            </div>
                            
                            <div className="flex items-center text-xs opacity-95 mb-2">
                              <Clock className="h-3 w-3 mr-2" />
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </div>
                            
                            <div className="flex items-center text-xs opacity-95 mb-2">
                              <Calendar className="h-3 w-3 mr-2" />
                              {slot.room || 'Salle non définie'}
                            </div>
                            
                            <div className="flex items-center text-xs opacity-90">
                              <div className="w-4 h-4 mr-2 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                                {slot.users ? 
                                  `${slot.users.first_name[0]}${slot.users.last_name[0]}` : 
                                  'F'
                                }
                              </div>
                              <span className="truncate">
                                {slot.users ? 
                                  `${slot.users.first_name} ${slot.users.last_name}` : 
                                  'Formateur'
                                }
                              </span>
                            </div>
                          </div>
                        ))}
                        
                        <div 
                          className="h-20 hover:bg-muted/50 rounded-xl transition-colors cursor-pointer flex items-center justify-center group border-2 border-dashed border-muted-foreground/30 hover:border-primary/50"
                          onClick={() => handleAddSlot(date, '09:00')}
                        >
                          <Plus className="h-6 w-6 text-muted-foreground/50 group-hover:text-primary/70 transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Weekly Schedule - List View */}
          {currentView === 'week' && displayMode === 'list' && (
            <div className="p-6">
              {slotsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {getWeekDates().map((date, index) => {
                    const daySlots = getSlotsForDate(date);
                    return (
                      <div key={index} className="bg-muted/30 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-foreground">
                            {weekDays[index]} {date.getDate()} {date.toLocaleDateString('fr-FR', { month: 'long' })}
                          </h3>
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            {daySlots.length} cours
                          </Badge>
                        </div>
                        
                        {daySlots.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Aucun cours programmé</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {daySlots.map((slot) => (
                              <div
                                key={slot.id}
                                className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                      <div 
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: slot.color || selectedSchedule.formations?.color || '#8B5CF6' }}
                                      />
                                      <h4 className="font-semibold text-foreground">
                                        {slot.formation_modules?.title || 'Module non défini'}
                                      </h4>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                                      <div className="flex items-center">
                                        <Clock className="h-4 w-4 mr-2" />
                                        <span>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                                      </div>
                                      
                                      <div className="flex items-center">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        <span>{slot.room || 'Salle non définie'}</span>
                                      </div>
                                      
                                      <div className="flex items-center">
                                        <div className="w-4 h-4 mr-2 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                          {slot.users ? 
                                            `${slot.users.first_name[0]}${slot.users.last_name[0]}` : 
                                            'F'
                                          }
                                        </div>
                                        <span>
                                          {slot.users ? 
                                            `${slot.users.first_name} ${slot.users.last_name}` : 
                                            'Formateur'
                                          }
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <SlotActionMenu
                                    slot={slot}
                                    onEdit={handleEditSlot}
                                    onDuplicate={handleDuplicateSlot}
                                    onDelete={handleDeleteSlot}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Day View - Planning */}
          {currentView === 'day' && displayMode === 'planning' && (
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 mb-6 border border-primary/10">
                  <h3 className="text-xl font-semibold text-primary mb-2">
                    {selectedDate.toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </h3>
                  <p className="text-muted-foreground">
                    {getSlotsForDate(selectedDate).length} cours programmés
                  </p>
                </div>

                {slotsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : getSlotsForDate(selectedDate).length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucun cours programmé
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Aucun cours n'est programmé pour cette journée
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getSlotsForDate(selectedDate).map((slot) => (
                      <div
                        key={slot.id}
                        className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: slot.color || selectedSchedule.formations?.color || '#8B5CF6' }}
                              />
                              <h4 className="text-lg font-semibold text-foreground">
                                {slot.formation_modules?.title || 'Module non défini'}
                              </h4>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                <span className="font-medium">{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                              </div>
                              
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>{slot.room || 'Salle non définie'}</span>
                              </div>
                              
                              <div className="flex items-center">
                                <div className="w-4 h-4 mr-2 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                  {slot.users ? 
                                    `${slot.users.first_name[0]}${slot.users.last_name[0]}` : 
                                    'F'
                                  }
                                </div>
                                <span>
                                  {slot.users ? 
                                    `${slot.users.first_name} ${slot.users.last_name}` : 
                                    'Formateur'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <SlotActionMenu
                            slot={slot}
                            onEdit={handleEditSlot}
                            onDuplicate={handleDuplicateSlot}
                            onDelete={handleDeleteSlot}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Day View - List */}
          {currentView === 'day' && displayMode === 'list' && (
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 mb-6 border border-primary/10">
                  <h3 className="text-xl font-semibold text-primary mb-2">
                    {selectedDate.toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </h3>
                  <p className="text-muted-foreground">
                    {getSlotsForDate(selectedDate).length} cours programmés
                  </p>
                </div>

                {slotsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : getSlotsForDate(selectedDate).length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucun cours programmé
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Aucun cours n'est programmé pour cette journée
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getSlotsForDate(selectedDate).map((slot) => (
                      <div
                        key={slot.id}
                        className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div 
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: slot.color || selectedSchedule.formations?.color || '#8B5CF6' }}
                              />
                              <h4 className="font-semibold text-foreground">
                                {slot.formation_modules?.title || 'Module non défini'}
                              </h4>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                <span>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                              </div>
                              
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>{slot.room || 'Salle non définie'}</span>
                              </div>
                              
                              <div className="flex items-center">
                                <div className="w-4 h-4 mr-2 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                  {slot.users ? 
                                    `${slot.users.first_name[0]}${slot.users.last_name[0]}` : 
                                    'F'
                                  }
                                </div>
                                <span>
                                  {slot.users ? 
                                    `${slot.users.first_name} ${slot.users.last_name}` : 
                                    'Formateur'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <SlotActionMenu
                            slot={slot}
                            onEdit={handleEditSlot}
                            onDuplicate={handleDuplicateSlot}
                            onDelete={handleDeleteSlot}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Month View - Planning */}
          {currentView === 'month' && displayMode === 'planning' && (
            <div className="p-6">
              {slotsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-3">
                  {/* Days header */}
                  {weekDays.map(day => (
                    <div key={day} className="p-3 text-center font-semibold text-primary text-sm bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar days */}
                  {(() => {
                    const year = selectedDate.getFullYear();
                    const month = selectedDate.getMonth();
                    const firstDay = new Date(year, month, 1);
                    const lastDay = new Date(year, month + 1, 0);
                    const daysInMonth = lastDay.getDate();
                    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
                    
                    const days = [];
                    
                    // Empty cells for days before the first day of the month
                    for (let i = 0; i < startingDayOfWeek; i++) {
                      days.push(<div key={`empty-${i}`} className="min-h-[200px] border border-gray-200 bg-gray-50 rounded-xl"></div>);
                    }
                    
                    // Days of the month
                    for (let day = 1; day <= daysInMonth; day++) {
                      const date = new Date(year, month, day);
                      const daySlots = getSlotsForDate(date);
                      
                      days.push(
                        <div key={day} className="min-h-[200px] border border-gray-200 p-3 bg-white hover:bg-gray-50 transition-colors rounded-xl flex flex-col">
                          <div className="font-bold text-lg mb-2 text-gray-900">{day}</div>
                          <div className="space-y-1 flex-1 overflow-y-auto">
                            {daySlots.length > 0 ? (
                              daySlots.map((slot, index) => (
                                <div
                                  key={slot.id}
                                  className="text-xs p-2 rounded-lg text-white shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                                  style={{ backgroundColor: slot.color || selectedSchedule.formations?.color || '#8B5CF6' }}
                                  onClick={() => handleEditSlot(slot)}
                                  title={`${slot.formation_modules?.title || 'Module'} - ${formatTime(slot.start_time)}-${formatTime(slot.end_time)} - ${slot.room || 'Salle'} - ${slot.users ? `${slot.users.first_name} ${slot.users.last_name}` : 'Formateur'}`}
                                >
                                  <div className="font-semibold text-[10px] leading-tight mb-1">
                                    {slot.formation_modules?.title || 'Module'}
                                  </div>
                                  <div className="text-[9px] opacity-95 flex items-center">
                                    <Clock className="h-2 w-2 mr-1 flex-shrink-0" />
                                    <span className="truncate">{formatTime(slot.start_time)}-{formatTime(slot.end_time)}</span>
                                  </div>
                                  {slot.room && (
                                    <div className="text-[9px] opacity-90 flex items-center mt-0.5">
                                      <Calendar className="h-2 w-2 mr-1 flex-shrink-0" />
                                      <span className="truncate">{slot.room}</span>
                                    </div>
                                  )}
                                  <div className="text-[9px] opacity-85 flex items-center mt-0.5">
                                    <div className="w-2 h-2 mr-1 rounded-full bg-white/20 flex items-center justify-center text-[8px] font-bold">
                                      {slot.users ? 
                                        `${slot.users.first_name[0]}${slot.users.last_name[0]}` : 
                                        'F'
                                      }
                                    </div>
                                    <span className="truncate">
                                      {slot.users ? `${slot.users.first_name} ${slot.users.last_name}` : 'Formateur'}
                                    </span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-gray-400 italic">Aucun cours</div>
                            )}
                            {daySlots.length > 3 && (
                              <div className="text-xs text-gray-500 text-center py-1">
                                +{daySlots.length - 3} cours supplémentaires
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    
                    return days;
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Month View - List */}
          {currentView === 'month' && displayMode === 'list' && (
            <div className="p-6">
              {slotsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    console.log('Month List View - Rendering for:', selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
                    console.log('Total slots available:', slots.length);
                    
                    const year = selectedDate.getFullYear();
                    const month = selectedDate.getMonth();
                    const firstDay = new Date(year, month, 1);
                    const lastDay = new Date(year, month + 1, 0);
                    const daysInMonth = lastDay.getDate();
                    
                    const daysWithSlots = [];
                    
                    // Get all days in the month that have slots
                    for (let day = 1; day <= daysInMonth; day++) {
                      const date = new Date(year, month, day);
                      const daySlots = getSlotsForDate(date);
                      
                      if (daySlots.length > 0) {
                        console.log(`Day ${day}: ${daySlots.length} slots found`);
                        daysWithSlots.push({ date, slots: daySlots });
                      }
                    }
                    
                    console.log('Days with slots:', daysWithSlots.length);
                    
                    if (daysWithSlots.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Aucun cours programmé ce mois
                          </h3>
                          <p className="text-gray-600 mb-4">
                            Aucun cours n'est programmé pour le mois de {selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                          </p>
                          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4 mt-4">
                            <p><strong>Informations de débogage :</strong></p>
                            <p>• Emploi du temps sélectionné : {selectedSchedule?.title || 'Aucun'}</p>
                            <p>• Total des créneaux : {slots.length}</p>
                            <p>• Mois actuel : {selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                          </div>
                        </div>
                      );
                    }
                    
                    return daysWithSlots.map(({ date, slots }) => (
                      <div key={date.toISOString()} className="bg-muted/30 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-foreground">
                            {date.toLocaleDateString('fr-FR', { 
                              weekday: 'long', 
                              day: 'numeric', 
                              month: 'long' 
                            })}
                          </h3>
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            {slots.length} cours
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                          {slots.map((slot) => (
                            <div
                              key={slot.id}
                              className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <div 
                                      className="w-3 h-3 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: slot.color || selectedSchedule.formations?.color || '#8B5CF6' }}
                                    />
                                    <h4 className="font-semibold text-foreground">
                                      {slot.formation_modules?.title || 'Module non défini'}
                                    </h4>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center">
                                      <Clock className="h-4 w-4 mr-2" />
                                      <span>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                                    </div>
                                    
                                    <div className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-2" />
                                      <span>{slot.room || 'Salle non définie'}</span>
                                    </div>
                                    
                                    <div className="flex items-center">
                                      <div className="w-4 h-4 mr-2 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                        {slot.users ? 
                                          `${slot.users.first_name[0]}${slot.users.last_name[0]}` : 
                                          'F'
                                        }
                                      </div>
                                      <span>
                                        {slot.users ? 
                                          `${slot.users.first_name} ${slot.users.last_name}` : 
                                          'Formateur'
                                        }
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <SlotActionMenu
                                  slot={slot}
                                  onEdit={handleEditSlot}
                                  onDuplicate={handleDuplicateSlot}
                                  onDelete={handleDeleteSlot}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        {selectedSlot && (
          <AddSlotModal
            isOpen={isAddSlotModalOpen}
            onClose={() => {
              setIsAddSlotModalOpen(false);
              setSelectedSlot(null);
            }}
            onSuccess={handleSlotAdded}
            scheduleId={selectedSchedule.id}
            formationId={selectedSchedule.formation_id}
            selectedSlot={selectedSlot}
          />
        )}

        {slotToEdit && (
          <EditSlotModal
            isOpen={isEditSlotModalOpen}
            onClose={() => {
              setIsEditSlotModalOpen(false);
              setSlotToEdit(null);
            }}
            onSuccess={handleSlotEdited}
            slot={slotToEdit}
            formationId={selectedSchedule.formation_id}
          />
        )}

        <ExcelImportModal
          isOpen={isExcelImportModalOpen}
          onClose={() => setIsExcelImportModalOpen(false)}
          onSuccess={handleExcelImportSuccess}
          scheduleId={selectedSchedule.id}
        />
      </div>
    );
  }

  // List view (default)
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Emplois du Temps</h2>
          <p className="text-gray-600 mt-1">
            Créez et gérez les emplois du temps pour chaque formation
          </p>
        </div>
        <Button onClick={handleCreateSchedule} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Créer un Emploi du Temps
        </Button>
      </div>

      {/* Week Navigation */}
      <WeekNavigation
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        className="mb-6"
      />

      {schedules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun emploi du temps
            </h3>
            <p className="text-gray-600 mb-4">
              Commencez par créer votre premier emploi du temps pour une formation
            </p>
            <Button onClick={handleCreateSchedule} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Créer un Emploi du Temps
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((schedule) => (
            <Card key={schedule.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: schedule.formations?.color || '#8B5CF6' }}
                  />
                  <Badge variant="secondary" className={getStatusColor(schedule.status)}>
                    {schedule.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{schedule.title}</CardTitle>
                <div className="text-sm text-gray-600">
                  <p>Formation: {schedule.formations?.title}</p>
                  <p>Année: {schedule.academic_year}</p>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    Modifié le {new Date(schedule.updated_at).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewSchedule(schedule)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditSchedule(schedule.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSchedule(schedule.id, schedule.title)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateScheduleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default ScheduleManagement;