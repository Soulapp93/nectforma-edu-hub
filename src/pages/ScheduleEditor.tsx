import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Plus, ArrowLeft, Save, Eye, ChevronLeft, ChevronRight, Upload, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { scheduleService, Schedule, ScheduleSlot } from '@/services/scheduleService';
import AddSlotModal from '@/components/administration/AddSlotModal';
import EditSlotModal from '@/components/administration/EditSlotModal';
import SlotActionMenu from '@/components/administration/SlotActionMenu';
import ExcelImportModal from '@/components/administration/ExcelImportModal';
import { toast } from 'sonner';

const ScheduleEditor = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddSlotModalOpen, setIsAddSlotModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [isEditSlotModalOpen, setIsEditSlotModalOpen] = useState(false);
  const [slotToEdit, setSlotToEdit] = useState<ScheduleSlot | null>(null);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [draggedSlot, setDraggedSlot] = useState<ScheduleSlot | null>(null);

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  useEffect(() => {
    if (scheduleId) {
      fetchScheduleData();
    }
  }, [scheduleId]);

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      const [scheduleData, slotsData] = await Promise.all([
        scheduleService.getScheduleById(scheduleId!),
        scheduleService.getScheduleSlots(scheduleId!)
      ]);
      
      setSchedule(scheduleData);
      setSlots(slotsData);
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'emploi du temps');
      navigate('/administration');
    } finally {
      setLoading(false);
    }
  };

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
    // Convert HH:MM:SS to HH:MM
    return time.slice(0, 5);
  };

  const getSlotsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return slots.filter(slot => slot.date === dateStr).sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const getSlotDuration = (slot: ScheduleSlot) => {
    const start = new Date(`2000-01-01T${slot.start_time}`);
    const end = new Date(`2000-01-01T${slot.end_time}`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // in hours
  };

  const handleAddSlot = (date: Date, time: string) => {
    setSelectedSlot({
      date: formatDate(date),
      time
    });
    setIsAddSlotModalOpen(true);
  };

  const handleSlotAdded = () => {
    fetchScheduleData();
    setIsAddSlotModalOpen(false);
    setSelectedSlot(null);
    toast.success('Créneau ajouté avec succès');
  };

  const handleEditSlot = (slot: ScheduleSlot) => {
    setSlotToEdit(slot);
    setIsEditSlotModalOpen(true);
  };

  const handleSlotEdited = () => {
    fetchScheduleData();
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
      fetchScheduleData();
      toast.success('Créneau dupliqué avec succès');
    } catch (error) {
      toast.error('Erreur lors de la duplication du créneau');
    }
  };

  const handleDeleteSlot = async (slot: ScheduleSlot) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) {
      try {
        await scheduleService.deleteScheduleSlot(slot.id);
        fetchScheduleData();
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
        fetchScheduleData();
        toast.success('Créneau déplacé avec succès');
      }
    } catch (error) {
      toast.error('Erreur lors du déplacement du créneau');
    } finally {
      setDraggedSlot(null);
    }
  };

  const handleExcelImportSuccess = () => {
    fetchScheduleData();
    setIsExcelImportModalOpen(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Emploi du temps introuvable</h1>
        <Button onClick={() => navigate('/administration')}>
          Retour à l'administration
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/administration')}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{schedule.title}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {schedule.formations?.title}
                </Badge>
                <Badge variant="secondary">
                  {schedule.academic_year}
                </Badge>
                <Badge 
                  variant="secondary" 
                  className={schedule.status === 'Publié' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                >
                  {schedule.status}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">4 créneaux • Modifications en cours</span>
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" />
              Republier les modifications
            </Button>
          </div>
        </div>
      </div>

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
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un créneau
              </Button>
            </div>
          </div>
        </div>

        {/* Weekly Schedule */}
        {currentView === 'week' && (
          <div className="p-6">
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
                          backgroundColor: slot.color || schedule.formations?.color || '#8B5CF6',
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
          </div>
        )}

        {/* Day View */}
        {currentView === 'day' && (
          <div className="p-6">
            <div className="w-full">
              <div className="text-center mb-6 p-4 bg-muted/30 rounded-lg">
                <h2 className="text-xl font-bold text-primary">
                  {selectedDate.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </h2>
              </div>
              
              <div className="space-y-3">
                {getSlotsForDate(selectedDate).length > 0 ? (
                  getSlotsForDate(selectedDate).map((slot) => (
                    <div
                      key={slot.id}
                      className="w-full p-6 rounded-xl shadow-sm border-l-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
                      style={{
                        backgroundColor: `${slot.color || schedule.formations?.color || '#8B5CF6'}15`,
                        borderLeftColor: slot.color || schedule.formations?.color || '#8B5CF6',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-bold text-xl text-foreground">
                              {slot.formation_modules?.title || 'Module non défini'}
                            </div>
                            <SlotActionMenu
                              slot={slot}
                              onEdit={handleEditSlot}
                              onDuplicate={handleDuplicateSlot}
                              onDelete={handleDeleteSlot}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center text-base text-muted-foreground">
                              <Clock className="h-5 w-5 mr-3" 
                                    style={{ color: slot.color || schedule.formations?.color || '#8B5CF6' }} />
                              <span className="font-medium">
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              </span>
                            </div>
                            
                            <div className="flex items-center text-base text-muted-foreground">
                              <Calendar className="h-5 w-5 mr-3" 
                                      style={{ color: slot.color || schedule.formations?.color || '#8B5CF6' }} />
                              <span>{slot.room || 'Salle non définie'}</span>
                            </div>
                            
                            <div className="flex items-center text-base text-muted-foreground">
                              <div className="w-5 h-5 mr-3 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                   style={{ backgroundColor: slot.color || schedule.formations?.color || '#8B5CF6' }}>
                                {slot.users ? 
                                  `${slot.users.first_name[0]}${slot.users.last_name[0]}` : 
                                  'F'
                                }
                              </div>
                              <span>
                                {slot.users ? 
                                  `${slot.users.first_name} ${slot.users.last_name}` : 
                                  'Formateur non défini'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <Badge 
                            variant="secondary" 
                            className="text-white px-4 py-2"
                            style={{ 
                              backgroundColor: slot.color || schedule.formations?.color || '#8B5CF6' 
                            }}
                          >
                            {Math.round(getSlotDuration(slot) * 60)} min
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                      <Calendar className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Aucun créneau</h3>
                    <p className="text-base mb-6">Aucun cours prévu pour cette journée</p>
                    <Button 
                      size="lg"
                      onClick={() => handleAddSlot(selectedDate, '09:00')}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Ajouter un créneau
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Month View */}
        {currentView === 'month' && (
          <div className="p-6">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold">
                {selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </h2>
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {/* Header */}
              {weekDays.map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground bg-muted">
                  {day.substring(0, 3)}
                </div>
              ))}
              
              {/* Calendar Days */}
              {Array.from({ length: 42 }, (_, i) => {
                const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
                const startDate = new Date(firstDay);
                startDate.setDate(startDate.getDate() - ((firstDay.getDay() + 6) % 7));
                
                const currentDay = new Date(startDate);
                currentDay.setDate(startDate.getDate() + i);
                
                const isCurrentMonth = currentDay.getMonth() === selectedDate.getMonth();
                const daySlots = getSlotsForDate(currentDay);
                
                return (
                  <div
                    key={i}
                    className={`min-h-24 p-2 border border-border ${
                      isCurrentMonth ? 'bg-background' : 'bg-muted/30'
                    } hover:bg-accent/50 cursor-pointer transition-colors`}
                    onClick={() => {
                      setSelectedDate(currentDay);
                      setCurrentView('day');
                    }}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {currentDay.getDate()}
                    </div>
                      <div className="space-y-1">
                       {daySlots.slice(0, 3).map((slot) => (
                         <div
                           key={slot.id}
                           className="text-xs p-2 rounded-md text-white shadow-sm group relative"
                           style={{
                             backgroundColor: slot.color || schedule.formations?.color || '#8B5CF6',
                           }}
                           title={`${formatTime(slot.start_time)}-${formatTime(slot.end_time)} | ${slot.formation_modules?.title || 'Module'} | ${slot.room || 'Salle'} | ${slot.users ? `${slot.users.first_name} ${slot.users.last_name}` : 'Formateur'}`}
                         >
                           <div className="font-medium truncate">
                             {slot.formation_modules?.title || 'Module'}
                           </div>
                           <div className="flex items-center justify-between mt-1 opacity-90">
                             <span className="text-xs">{formatTime(slot.start_time)}-{formatTime(slot.end_time)}</span>
                             <span className="text-xs">{slot.room || 'Salle'}</span>
                           </div>
                           <div className="text-xs mt-1 opacity-80 truncate">
                             {slot.users ? `${slot.users.first_name} ${slot.users.last_name}` : 'Formateur'}
                           </div>
                           <SlotActionMenu
                             slot={slot}
                             onEdit={handleEditSlot}
                             onDuplicate={handleDuplicateSlot}
                             onDelete={handleDeleteSlot}
                           />
                         </div>
                       ))}
                       {daySlots.length > 3 && (
                         <div className="text-xs text-muted-foreground p-1 text-center">
                           +{daySlots.length - 3} autres
                         </div>
                       )}
                     </div>
                   </div>
                 );
               })}
             </div>
           </div>
         )}
       </div>

      <AddSlotModal
        isOpen={isAddSlotModalOpen}
        onClose={() => {
          setIsAddSlotModalOpen(false);
          setSelectedSlot(null);
        }}
        onSuccess={handleSlotAdded}
        scheduleId={scheduleId!}
        formationId={schedule.formation_id}
        selectedSlot={selectedSlot}
      />

      <EditSlotModal
        isOpen={isEditSlotModalOpen}
        onClose={() => {
          setIsEditSlotModalOpen(false);
          setSlotToEdit(null);
        }}
        onSuccess={handleSlotEdited}
        slot={slotToEdit}
        formationId={schedule.formation_id}
      />

      <ExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
        onSuccess={handleExcelImportSuccess}
        scheduleId={scheduleId!}
      />
    </div>
  );
};

export default ScheduleEditor;
