import React, { useState, useEffect } from 'react';
import { Plus, Upload, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSchedules } from '@/hooks/useSchedules';
import { scheduleService, Schedule, ScheduleSlot } from '@/services/scheduleService';
import AddSlotModal from './AddSlotModal';
import EditSlotModal from './EditSlotModal';
import ExcelImportModal from './ExcelImportModal';
import CreateScheduleModal from './CreateScheduleModal';
import { toast } from 'sonner';

const SimpleScheduleManagement = () => {
  const { schedules, refetch } = useSchedules();
  
  // États principaux - simplifiés
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  
  // États des modales - simples
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [showEditSlotModal, setShowEditSlotModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  
  // États temporaires pour les modales
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);

  const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);
  
  // Calculer les jours de la semaine
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  // Charger les créneaux quand l'emploi du temps change
  useEffect(() => {
    loadSlots();
  }, [selectedScheduleId]);

  const loadSlots = async () => {
    if (!selectedScheduleId) {
      setSlots([]);
      return;
    }
    
    try {
      const slotsData = await scheduleService.getScheduleSlots(selectedScheduleId);
      setSlots(slotsData || []);
    } catch (error) {
      console.error('Erreur chargement créneaux:', error);
      setSlots([]);
    }
  };

  // Gestionnaires des boutons principaux
  const handleAddSlot = () => {
    console.log('Ouverture modal ajouter créneau');
    if (!selectedScheduleId) {
      toast.error('Sélectionnez un emploi du temps');
      return;
    }
    setSelectedSlot(null);
    setShowAddSlotModal(true);
  };

  const handleAddSlotForDate = (date: Date) => {
    console.log('Ajouter créneau pour date:', date);
    if (!selectedScheduleId) {
      toast.error('Sélectionnez un emploi du temps');
      return;
    }
    setSelectedSlot({
      date: format(date, 'yyyy-MM-dd'),
      time: '09:00'
    });
    setShowAddSlotModal(true);
  };

  const handleImportExcel = () => {
    console.log('Ouverture import Excel');
    if (!selectedScheduleId) {
      toast.error('Sélectionnez un emploi du temps');
      return;
    }
    setShowExcelModal(true);
  };

  const handleEditSlot = (slot: ScheduleSlot) => {
    setEditingSlot(slot);
    setShowEditSlotModal(true);
  };

  const handleDeleteSlot = async (slot: ScheduleSlot) => {
    try {
      await scheduleService.deleteScheduleSlot(slot.id);
      toast.success('Créneau supprimé');
      loadSlots();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Navigation semaine
  const previousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));

  // Obtenir les créneaux pour un jour/heure spécifique
  const getSlotsForDateTime = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return slots.filter(slot => 
      slot.date === dateStr && 
      slot.start_time === time + ':00'
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec sélection emploi du temps */}
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Emplois du Temps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un emploi du temps" />
                </SelectTrigger>
                <SelectContent>
                  {schedules.map((schedule) => (
                    <SelectItem key={schedule.id} value={schedule.id}>
                      {schedule.title} ({schedule.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              Créer un emploi du temps
            </Button>
          </div>

          {/* Boutons d'action */}
          {selectedScheduleId && (
            <div className="flex items-center gap-2">
              <Button onClick={handleAddSlot} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un créneau
              </Button>
              <Button onClick={handleImportExcel} variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import Excel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vue calendrier */}
      {selectedScheduleId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Semaine du {format(weekStart, 'dd', { locale: fr })} au{' '}
                {format(weekEnd, 'dd MMMM yyyy', { locale: fr })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={previousWeek}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={nextWeek}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-8 gap-1 text-sm">
              {/* En-tête avec heures et jours */}
              <div className="p-2 font-medium">Heure</div>
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="p-2 font-medium text-center border-b">
                  <div>{format(day, 'EEE', { locale: fr })}</div>
                  <div className="text-lg">{format(day, 'dd')}</div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-1 h-6 px-2 text-xs"
                    onClick={() => handleAddSlotForDate(day)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              ))}

              {/* Lignes d'heures */}
              {timeSlots.map((time) => (
                <React.Fragment key={time}>
                  <div className="p-2 text-center font-medium border-r">
                    {time}
                  </div>
                  {weekDays.map((day) => {
                    const daySlots = getSlotsForDateTime(day, time);
                    return (
                      <div key={`${day.toISOString()}-${time}`} className="p-1 border border-gray-200 min-h-[60px]">
                        {daySlots.map((slot) => (
                          <div
                            key={slot.id}
                            className="bg-blue-100 border border-blue-300 rounded p-1 mb-1 cursor-pointer hover:bg-blue-200"
                            onClick={() => handleEditSlot(slot)}
                          >
                            <div className="text-xs font-medium">
                              {slot.formation_modules?.title || 'Module'}
                            </div>
                            <div className="text-xs text-gray-600">
                              {slot.users?.first_name} {slot.users?.last_name}
                            </div>
                            <div className="text-xs">
                              {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modales */}
      <CreateScheduleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          refetch();
        }}
      />

      <AddSlotModal
        isOpen={showAddSlotModal}
        onClose={() => setShowAddSlotModal(false)}
        onSuccess={() => {
          setShowAddSlotModal(false);
          loadSlots();
        }}
        scheduleId={selectedScheduleId}
        formationId={selectedSchedule?.formation_id || ''}
        selectedSlot={selectedSlot}
      />

      <EditSlotModal
        isOpen={showEditSlotModal}
        onClose={() => setShowEditSlotModal(false)}
        onSuccess={() => {
          setShowEditSlotModal(false);
          loadSlots();
        }}
        slot={editingSlot}
        formationId={selectedSchedule?.formation_id || ''}
      />

      <ExcelImportModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        onSuccess={() => {
          setShowExcelModal(false);
          loadSlots();
        }}
        scheduleId={selectedScheduleId}
      />
    </div>
  );
};

export default SimpleScheduleManagement;