import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ViewModeSelector } from '@/components/schedule/ViewModeSelector';
import { WeekNavigator } from '@/components/schedule/WeekNavigator';
import WeekNavigation from '@/components/ui/week-navigation';
import { ScheduleManagementHeader } from '@/components/administration/ScheduleManagementHeader';
import { ScheduleManagementCalendar } from '@/components/administration/ScheduleManagementCalendar';
import { scheduleService, Schedule, ScheduleSlot } from '@/services/scheduleService';
import { navigateWeek, getWeekInfo, getWeekDays } from '@/utils/calendarUtils';
import AddSlotModal from '@/components/administration/AddSlotModal';
import EditSlotModal from '@/components/administration/EditSlotModal';
import ExcelImportModal from '@/components/administration/ExcelImportModal';
import { toast } from 'sonner';

type ViewMode = 'day' | 'week' | 'month' | 'list';

const ModernScheduleEditor = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();
  
  // États principaux
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // États pour les modales
  const [isAddSlotModalOpen, setIsAddSlotModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [isEditSlotModalOpen, setIsEditSlotModalOpen] = useState(false);
  const [slotToEdit, setSlotToEdit] = useState<ScheduleSlot | null>(null);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [draggedSlot, setDraggedSlot] = useState<ScheduleSlot | null>(null);

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

  // Handlers des créneaux
  const handleAddSlot = () => {
    if (!schedule?.id) {
      toast.error('Erreur lors de l\'ouverture du modal d\'ajout');
      return;
    }
    setSelectedSlot(null);
    setIsAddSlotModalOpen(true);
  };

  const handleAddSlotToDate = (date: Date) => {
    if (!schedule?.id) {
      toast.error('Erreur lors de l\'ouverture du modal d\'ajout');
      return;
    }
    setSelectedSlot({
      date: date.toISOString().split('T')[0],
      time: '09:00'
    });
    setIsAddSlotModalOpen(true);
  };

  const handleSlotAdded = async () => {
    fetchScheduleData();
    setIsAddSlotModalOpen(false);
    setSelectedSlot(null);
    toast.success('Créneau ajouté avec succès');
    
    // Notifier les utilisateurs si l'emploi du temps est publié
    if (schedule?.status === 'Publié') {
      try {
        await scheduleService.notifyScheduleUpdate(schedule);
        toast.success('Les utilisateurs ont été notifiés des modifications');
      } catch (error) {
        console.error('Erreur lors de l\'envoi des notifications:', error);
      }
    }
  };

  const handleEditSlot = (slot: ScheduleSlot) => {
    setSlotToEdit(slot);
    setIsEditSlotModalOpen(true);
  };

  const handleSlotEdited = async () => {
    fetchScheduleData();
    setIsEditSlotModalOpen(false);
    setSlotToEdit(null);
    toast.success('Créneau modifié avec succès');
    
    // Notifier les utilisateurs si l'emploi du temps est publié
    if (schedule?.status === 'Publié') {
      try {
        await scheduleService.notifyScheduleUpdate(schedule);
        toast.success('Les utilisateurs ont été notifiés des modifications');
      } catch (error) {
        console.error('Erreur lors de l\'envoi des notifications:', error);
      }
    }
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

  const handleImportExcel = () => {
    setIsExcelImportModalOpen(true);
  };

  const handleExcelImportSuccess = () => {
    fetchScheduleData();
    setIsExcelImportModalOpen(false);
    toast.success('Import Excel réussi');
  };

  const handlePublishSchedule = async () => {
    try {
      await scheduleService.updateSchedule(scheduleId!, { status: 'Publié' });
      toast.success("Emploi du temps publié avec succès");
      fetchScheduleData();
    } catch (error) {
      toast.error("Erreur lors de la publication");
    }
  };

  const handleBackToList = () => {
    navigate('/administration');
  };

  // Drag & Drop handlers
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
      const newDate = targetDate.toISOString().split('T')[0];
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

  // Convertir les slots pour le calendrier
  const convertSlotsToScheduleData = () => {
    const weekDays = getWeekDays(selectedDate);
    return weekDays.map((date, index) => {
      const daySlots = slots.filter(slot => 
        new Date(slot.date).toDateString() === date.toDateString()
      ).sort((a, b) => a.start_time.localeCompare(b.start_time));

      return {
        id: (index + 1).toString(),
        day: format(date, 'EEEE', { locale: fr }),
        date: format(date, 'd'),
        dateObj: date,
        modules: daySlots.map(slot => ({
          id: slot.id,
          title: slot.formation_modules?.title || 'Module non défini',
          time: `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`,
          instructor: slot.users ? `${slot.users.first_name} ${slot.users.last_name}` : 'Non assigné',
          room: slot.room || 'Salle non définie',
          color: slot.color || schedule?.formations?.color || '#6B7280',
          formation: schedule?.formations?.title,
          slot
        }))
      };
    });
  };

  const weekInfo = getWeekInfo(selectedDate);
  const scheduleData = convertSlotsToScheduleData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
        <LoadingState message="Chargement de l'emploi du temps..." />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
        <EmptyState
          title="Emploi du temps introuvable"
          description="L'emploi du temps demandé n'existe pas ou n'est plus accessible."
          action={{
            label: "Retour à l'administration",
            onClick: handleBackToList
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
      {/* Header moderne */}
      <ScheduleManagementHeader
        currentDate={selectedDate}
        weekInfo={weekInfo}
        viewMode={viewMode}
        selectedSchedule={schedule}
        schedulesCount={1}
        slotsCount={slots.length}
        onAddSlot={handleAddSlot}
        onImportExcel={handleImportExcel}
        onPublishSchedule={schedule.status === 'Brouillon' ? handlePublishSchedule : undefined}
        onBackToList={handleBackToList}
      />

      {/* Navigation et contrôles */}
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <WeekNavigator 
            currentDate={selectedDate}
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

      {/* Contenu principal - Vue semaine moderne */}
      <ScheduleManagementCalendar
        schedule={scheduleData}
        filteredSlots={slots}
        onAddSlotToDate={handleAddSlotToDate}
        onEditSlot={handleEditSlot}
        onDuplicateSlot={handleDuplicateSlot}
        onDeleteSlot={handleDeleteSlot}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />

      {/* Modals */}
      <AddSlotModal
        isOpen={isAddSlotModalOpen}
        onClose={() => setIsAddSlotModalOpen(false)}
        onSuccess={handleSlotAdded}
        scheduleId={scheduleId!}
      />

      <EditSlotModal
        slot={slotToEdit}
        isOpen={isEditSlotModalOpen}
        onClose={() => setIsEditSlotModalOpen(false)}
        onSuccess={handleSlotEdited}
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

export default ModernScheduleEditor;