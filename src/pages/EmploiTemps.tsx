
import React, { useState } from 'react';
import { Calendar, Clock, Download, Filter, ChevronLeft, ChevronRight, MapPin, User, FileText } from 'lucide-react';
import { useUserSchedules } from '@/hooks/useUserSchedules';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScheduleSlot } from '@/services/scheduleService';
import { exportScheduleToPDF } from '@/services/pdfScheduleService';
import { useToast } from '@/hooks/use-toast';
import { ExportFilterModal } from '@/components/ui/export-filter-modal';

const EmploiTemps = () => {
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('week');
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

  // Get current week number
  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Get all weeks for the current academic year
  const getAcademicWeeks = () => {
    const currentYear = new Date().getFullYear();
    const weeks = [];
    
    // Academic year starts in September
    const startDate = new Date(currentYear, 8, 1); // September 1st
    const endDate = new Date(currentYear + 1, 6, 31); // July 31st next year
    
    let currentWeek = new Date(startDate);
    let weekNumber = 1;
    
    while (currentWeek <= endDate) {
      weeks.push({
        number: weekNumber,
        startDate: new Date(currentWeek),
        label: `S${weekNumber}`
      });
      
      currentWeek.setDate(currentWeek.getDate() + 7);
      weekNumber++;
    }
    
    return weeks;
  };

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

  const getSlotDuration = (slot: ScheduleSlot) => {
    const startHour = parseInt(slot.start_time.split(':')[0]);
    const endHour = parseInt(slot.end_time.split(':')[0]);
    return Math.max(1, endHour - startHour);
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
          <p className="mt-2 text-muted-foreground">Chargement de votre emploi du temps...</p>
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
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {userRole === 'Formateur' ? 'Mon Emploi du Temps' : 'Emploi du Temps'}
            </h1>
            <p className="text-gray-600 mt-1">
              {userRole === 'Formateur' 
                ? 'Consultez vos cours et sessions de formation'
                : 'Consultez votre emploi du temps et vos prochains cours'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Week Navigation Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Navigation par semaines</h2>
          <div className="flex overflow-x-auto scrollbar-hide space-x-2">
            {getAcademicWeeks().map((week) => {
              const isCurrentWeek = getWeekNumber(selectedDate) === week.number;
              return (
                <button
                  key={week.number}
                  onClick={() => navigateToWeek(week.startDate)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 min-w-[60px] ${
                    isCurrentWeek
                      ? 'bg-primary text-white shadow-md transform scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                  }`}
                >
                  {week.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

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
              {userRole === 'Formateur' 
                ? 'Aucun créneau de formation ne vous est assigné.'
                : 'Aucun cours n\'est programmé pour vos formations.'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Weekly Schedule */}
            {currentView === 'week' && (
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
                            className="p-4 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border border-white/20"
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
                  <div className="text-center mb-6 p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/10">
                    <div className="text-2xl font-bold text-primary">
                      {selectedDate.toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {getSlotsForDate(selectedDate).length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Aucun cours prévu pour cette journée</p>
                      </div>
                    ) : (
                      getSlotsForDate(selectedDate).map((slot) => (
                        <div
                          key={slot.id}
                          className="p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border border-white/20"
                          style={{
                            backgroundColor: slot.color || '#8B5CF6',
                            color: 'white'
                          }}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="font-semibold text-xl leading-tight flex-1">
                              {slot.formation_modules?.title || 'Module non défini'}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm opacity-95">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-3" />
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </div>
                            
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-3" />
                              {slot.room || 'Salle non définie'}
                            </div>
                            
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-3" />
                              {slot.users ? 
                                `${slot.users.first_name} ${slot.users.last_name}` : 
                                'Formateur'
                              }
                            </div>
                          </div>
                          
                          {slot.notes && (
                            <div className="mt-4 pt-4 border-t border-white/20">
                              <div className="flex items-start">
                                <FileText className="h-4 w-4 mr-3 mt-0.5" />
                                <span className="text-sm opacity-90">{slot.notes}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Month View */}
            {currentView === 'month' && (
              <div className="p-6">
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
                                  style={{ backgroundColor: slot.color || '#8B5CF6' }}
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
                                      <MapPin className="h-2 w-2 mr-1 flex-shrink-0" />
                                      <span className="truncate">{slot.room}</span>
                                    </div>
                                  )}
                                  <div className="text-[9px] opacity-85 flex items-center mt-0.5">
                                    <User className="h-2 w-2 mr-1 flex-shrink-0" />
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
              </div>
            )}
          </>
        )}
      </div>

      <ExportFilterModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        currentDate={selectedDate}
        onExport={handleExportWithFilters}
      />
    </div>
  );
};

export default EmploiTemps;
