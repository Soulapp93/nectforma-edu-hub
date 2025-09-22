import React, { useState, useEffect } from 'react';
import { Plus, Upload, Calendar, ChevronLeft, ChevronRight, Search, Filter, Edit, Trash2 } from 'lucide-react';
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
  
  // États principaux
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // États des modales
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

  // Charger les créneaux
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

  // Gestionnaires des boutons
  const handleCreateSchedule = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCreateModal(true);
  };

  const handleAddSlot = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedScheduleId) {
      toast.error('Sélectionnez un emploi du temps');
      return;
    }
    setSelectedSlot(null);
    setShowAddSlotModal(true);
  };

  const handleImportExcel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedScheduleId) {
      toast.error('Sélectionnez un emploi du temps');
      return;
    }
    setShowExcelModal(true);
  };

  const handleAddSlotForDate = (date: Date, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const handleEditSlot = (slot: ScheduleSlot) => {
    setEditingSlot(slot);
    setShowEditSlotModal(true);
  };

  const handleDeleteSlot = async (slot: ScheduleSlot) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) {
      try {
        await scheduleService.deleteScheduleSlot(slot.id);
        toast.success('Créneau supprimé');
        loadSlots();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
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

  const filteredSchedules = schedules.filter(schedule =>
    schedule.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* En-tête avec filtres et actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Gestion des emplois du temps</h2>
            <button 
              onClick={handleCreateSchedule}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvel emploi du temps
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un emploi du temps..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <select 
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Sélectionner un emploi du temps</option>
              {filteredSchedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.title} ({schedule.status})
                </option>
              ))}
            </select>
          </div>

          {/* Boutons d'action */}
          {selectedScheduleId && (
            <div className="flex items-center gap-2 mt-4">
              <button 
                onClick={handleAddSlot}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un créneau
              </button>
              <button 
                onClick={handleImportExcel}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Excel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Vue calendrier */}
      {selectedScheduleId ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Semaine du {format(weekStart, 'dd', { locale: fr })} au{' '}
                {format(weekEnd, 'dd MMMM yyyy', { locale: fr })}
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={previousWeek}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={nextWeek}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-8 gap-1 text-sm">
              {/* En-tête avec heures et jours */}
              <div className="p-2 font-medium">Heure</div>
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="p-2 font-medium text-center border-b">
                  <div>{format(day, 'EEE', { locale: fr })}</div>
                  <div className="text-lg">{format(day, 'dd')}</div>
                  <button 
                    onClick={(e) => handleAddSlotForDate(day, e)}
                    className="mt-1 h-6 px-2 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded flex items-center justify-center w-full"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Ajouter
                  </button>
                </div>
              ))}

              {/* Lignes d'heures */}
              {timeSlots.map((time) => (
                <React.Fragment key={time}>
                  <div className="p-2 text-center font-medium border-r bg-gray-50">
                    {time}
                  </div>
                  {weekDays.map((day) => {
                    const daySlots = getSlotsForDateTime(day, time);
                    return (
                      <div key={`${day.toISOString()}-${time}`} className="p-1 border border-gray-200 min-h-[60px] bg-white hover:bg-gray-50">
                        {daySlots.map((slot) => (
                          <div
                            key={slot.id}
                            className="bg-purple-100 border border-purple-300 rounded p-2 mb-1 cursor-pointer hover:bg-purple-200 group"
                            onClick={() => handleEditSlot(slot)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="text-xs font-medium text-purple-900">
                                  {slot.formation_modules?.title || 'Module'}
                                </div>
                                <div className="text-xs text-purple-700">
                                  {slot.users?.first_name} {slot.users?.last_name}
                                </div>
                                <div className="text-xs text-purple-600">
                                  {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditSlot(slot);
                                  }}
                                  className="p-1 hover:bg-purple-300 rounded"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSlot(slot);
                                  }}
                                  className="p-1 hover:bg-red-200 rounded"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sélectionnez un emploi du temps
            </h3>
            <p className="text-gray-600 mb-4">
              Choisissez un emploi du temps dans la liste ci-dessus pour commencer à gérer les créneaux.
            </p>
            <button 
              onClick={handleCreateSchedule}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Créer un emploi du temps
            </button>
          </div>
        </div>
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