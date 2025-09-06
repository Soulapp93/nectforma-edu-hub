import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Plus, ArrowLeft, Save, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { scheduleService, Schedule, ScheduleSlot } from '@/services/scheduleService';
import AddSlotModal from '@/components/administration/AddSlotModal';
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

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

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

  const getSlotForDateTime = (date: Date, time: string) => {
    const dateStr = formatDate(date);
    return slots.find(slot => 
      slot.date === dateStr && 
      slot.start_time <= time && 
      slot.end_time > time
    );
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

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(newDate);
  };

  const getWeekLabel = () => {
    const weekDates = getWeekDates();
    const start = weekDates[0];
    const end = weekDates[4];
    return `Semaine Du ${start.getDate()} Au ${end.getDate()} ${start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
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
                  {schedule.formation?.title}
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
                <Button variant="ghost" size="sm" onClick={() => navigateWeek('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">{getWeekLabel()}</span>
                <Button variant="ghost" size="sm" onClick={() => navigateWeek('next')}>
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

            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un créneau
            </Button>
          </div>
        </div>

        {/* Weekly Schedule */}
        {currentView === 'week' && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="w-20 p-3 text-left text-sm font-medium text-gray-500">Heure</th>
                    {getWeekDates().map((date, index) => (
                      <th key={index} className="p-3 text-center text-sm font-medium text-gray-500 min-w-48">
                        <div>
                          <div>{weekDays[index]}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {date.getDate()} {date.toLocaleDateString('fr-FR', { month: 'short' })}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((time) => (
                    <tr key={time} className="border-t border-gray-100">
                      <td className="p-3 text-sm text-gray-600 bg-gray-50">{time}</td>
                      {getWeekDates().map((date, dayIndex) => {
                        const slot = getSlotForDateTime(date, time);
                        const isFirstSlot = slot && slot.start_time === time;
                        const duration = slot ? getSlotDuration(slot) : 1;
                        
                        if (slot && !isFirstSlot) {
                          return null; // Skip rendering for continuation slots
                        }
                        
                        return (
                          <td key={`${dayIndex}-${time}`} className="p-1 border-l border-gray-100 relative">
                            {slot && isFirstSlot ? (
                              <div 
                                className="text-white p-3 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                                style={{ 
                                  backgroundColor: slot.color || schedule.formation?.color || '#8B5CF6',
                                  minHeight: `${duration * 60}px`,
                                  position: 'relative',
                                  zIndex: 1
                                }}
                              >
                                <div className="font-medium text-sm mb-1">
                                  {slot.module?.title || 'Module non défini'}
                                </div>
                                <div className="text-xs opacity-90 mb-1">
                                  {slot.instructor ? 
                                    `${slot.instructor.first_name} ${slot.instructor.last_name}` : 
                                    'Formateur non défini'
                                  }
                                </div>
                                <div className="text-xs opacity-75">{slot.room || 'Salle non définie'}</div>
                              </div>
                            ) : (
                              <div 
                                className="h-16 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center group"
                                onClick={() => handleAddSlot(date, time)}
                              >
                                <Plus className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Other views placeholder */}
        {currentView !== 'week' && (
          <div className="p-6">
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Vue {currentView}</h3>
              <p>Cette vue sera développée prochainement</p>
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
    </div>
  );
};

export default ScheduleEditor;
