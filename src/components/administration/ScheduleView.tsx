import React, { useState } from 'react';
import { Calendar, Clock, Download, ChevronLeft, ChevronRight, MapPin, User, FileText, Plus } from 'lucide-react';
import { useUserSchedules } from '@/hooks/useUserSchedules';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { ScheduleSlot } from '@/services/scheduleService';
import { exportScheduleToPDF } from '@/services/pdfScheduleService';
import { useToast } from '@/hooks/use-toast';
import { ExportFilterModal } from '@/components/ui/export-filter-modal';
import WeekNavigation from '@/components/ui/week-navigation';

const ScheduleView = () => {
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('week');
  const [displayMode, setDisplayMode] = useState<'planning' | 'liste'>('planning');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [exportModalOpen, setExportModalOpen] = useState(false);
  
  const { schedules, loading, error } = useUserSchedules();
  const { userId, userRole, loading: userLoading } = useCurrentUser();
  const { toast } = useToast();

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  // Navigate to specific week
  const navigateToWeek = (weekStartDate: Date) => {
    setSelectedDate(new Date(weekStartDate));
    setCurrentView('week');
  };

  // Helper functions
  const formatTime = (time: string) => {
    return time.substring(0, 5); // Remove seconds, keep HH:MM
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

  const getSlotsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return schedules
      .filter(slot => slot.date === dateStr)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    
    if (currentView === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    
    setSelectedDate(newDate);
  };

  const getCurrentPeriodLabel = () => {
    if (currentView === 'day') {
      return selectedDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else if (currentView === 'week') {
      const weekDates = getWeekDates();
      const start = weekDates[0];
      const end = weekDates[6];
      return `Semaine Du ${start.getDate()} Au ${end.getDate()} ${start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
    } else {
      return `${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    }
  };

  const handleExportPDF = () => {
    setExportModalOpen(true);
  };

  const handleExportWithFilters = (startDate: Date, endDate: Date, periodLabel: string) => {
    try {
      // Filter schedules by date range
      const filteredSchedules = schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.date);
        return scheduleDate >= startDate && scheduleDate <= endDate;
      });

      if (filteredSchedules.length === 0) {
        toast({
          title: "Aucun cours trouvé",
          description: "Aucun cours trouvé pour cette période.",
          variant: "destructive",
        });
        return;
      }

      const title = `Emploi du Temps - ${periodLabel}`;
      exportScheduleToPDF(
        filteredSchedules,
        title,
        userRole,
        `${userId}`,
        startDate,
        endDate
      );

      toast({
        title: "Export réussi",
        description: `Emploi du temps exporté pour ${periodLabel}`,
      });
    } catch (error) {
      console.error('Erreur lors de l\'exportation:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'exportation du PDF",
        variant: "destructive",
      });
    }
  };

  if (userLoading || loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Chargement de l'emploi du temps...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-destructive">Erreur: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Week Navigation Bar */}
      <WeekNavigation
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onWeekSelect={navigateToWeek}
      />

      {/* Schedule Viewer */}
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

              {/* Display Mode Toggle for Week View */}
              {currentView === 'week' && (
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
                    onClick={() => setDisplayMode('liste')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      displayMode === 'liste' ? 'bg-white text-primary shadow-sm' : 'text-gray-600'
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
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un créneau
              </Button>
              <Button variant="outline" size="sm">
                Import Excel
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={schedules.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter PDF
              </Button>
            </div>
          </div>
        </div>

        {schedules.length === 0 ? (
          <div className="p-6 text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun cours programmé</h3>
            <p className="text-gray-600">
              Aucun créneau de formation n'est programmé pour cette période.
            </p>
          </div>
        ) : (
          <>
            {/* Weekly Schedule - Planning View */}
            {currentView === 'week' && displayMode === 'planning' && (
              <div className="p-6">
                <div className="grid grid-cols-7 gap-3">
                  {getWeekDates().map((date, index) => (
                    <div key={index} className="min-h-[500px]">
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
                            className="p-4 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border border-white/20 cursor-pointer"
                            style={{
                              backgroundColor: slot.color || '#8B5CF6',
                              color: 'white'
                            }}
                          >
                            <div className="font-semibold text-sm leading-tight mb-2">
                              {slot.formation_modules?.title || 'Module non défini'}
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
                        
                        {/* Add slot button */}
                        <button className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:border-primary hover:text-primary transition-colors flex items-center justify-center">
                          <Plus className="h-6 w-6" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly Schedule - List View */}
            {currentView === 'week' && displayMode === 'liste' && (
              <div className="p-6">
                <div className="space-y-6">
                  {getWeekDates().map((date, index) => {
                    const daySlots = getSlotsForDate(date);
                    if (daySlots.length === 0) return null;
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-primary flex items-center">
                            <Calendar className="h-5 w-5 mr-2" />
                            {weekDays[index]} {date.getDate()} {date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                          </h3>
                        </div>
                        
                        <div className="divide-y divide-gray-100">
                          {daySlots.map((slot) => (
                            <div key={slot.id} className="p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center mb-2">
                                    <div 
                                      className="w-4 h-4 rounded-full mr-3"
                                      style={{ backgroundColor: slot.color || '#8B5CF6' }}
                                    ></div>
                                    <h4 className="font-semibold text-gray-900">
                                      {slot.formation_modules?.title || 'Module non défini'}
                                    </h4>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                    <div className="flex items-center">
                                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                    </div>
                                    
                                    <div className="flex items-center">
                                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                      {slot.room || 'Salle non définie'}
                                    </div>
                                    
                                    <div className="flex items-center">
                                      <User className="h-4 w-4 mr-2 text-gray-400" />
                                      {slot.users ? 
                                        `${slot.users.first_name} ${slot.users.last_name}` : 
                                        'Formateur'
                                      }
                                    </div>
                                  </div>
                                  
                                  {slot.notes && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                      <div className="flex items-start">
                                        <FileText className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                                        <span className="text-sm text-gray-600">{slot.notes}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Export Modal */}
      <ExportFilterModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        currentDate={selectedDate}
        onExport={handleExportWithFilters}
      />
    </div>
  );
};

export default ScheduleView;