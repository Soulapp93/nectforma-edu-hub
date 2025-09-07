
import React, { useState } from 'react';
import { Calendar, Clock, Download, Filter, ChevronLeft, ChevronRight, MapPin, User, FileText } from 'lucide-react';
import { useUserSchedules } from '@/hooks/useUserSchedules';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScheduleSlot } from '@/services/scheduleService';
import { exportScheduleToPDF } from '@/services/pdfScheduleService';
import { useToast } from '@/hooks/use-toast';

const EmploiTemps = () => {
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const { schedules, loading, error } = useUserSchedules();
  const { userId, userRole, loading: userLoading } = useCurrentUser();
  const { toast } = useToast();

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  // Helper functions
  const formatTime = (time: string) => {
    return time.substring(0, 5); // Remove seconds, keep HH:MM
  };

  const getWeekDates = () => {
    const monday = new Date(selectedDate);
    monday.setDate(selectedDate.getDate() - selectedDate.getDay() + 1);
    
    return Array.from({ length: 5 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
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
      const start = weekDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      const end = weekDates[4].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
      return `${start} - ${end}`;
    } else {
      return `${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    }
  };

  const handleExportPDF = () => {
    if (schedules.length === 0) {
      toast({
        title: "Aucune donnée à exporter",
        description: "Votre emploi du temps est vide.",
        variant: "destructive",
      });
      return;
    }

    const title = userRole === 'Étudiant' ? 'Mon Emploi du Temps' : 'Mes Créneaux de Formation';
    exportScheduleToPDF(schedules, title, userRole, `${userId}`);
    
    toast({
      title: "Export réussi",
      description: "Votre emploi du temps a été exporté en PDF.",
    });
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {userRole === 'Étudiant' ? 'Mon Emploi du Temps' : 'Mes Créneaux de Formation'}
        </h1>
        <p className="text-muted-foreground">
          {userRole === 'Étudiant' 
            ? 'Consultez votre planning de cours' 
            : 'Consultez tous vos créneaux d\'enseignement'
          }
        </p>
      </div>

          {/* Controls */}
      <div className="mb-6 bg-background rounded-lg border border-border/50 shadow-sm">
        <div className="p-6 border-b border-border/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex bg-muted/50 rounded-lg p-1 border border-border/30">
                <Button
                  variant={currentView === 'day' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('day')}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Jour
                </Button>
                <Button
                  variant={currentView === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('week')}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Semaine
                </Button>
                <Button
                  variant={currentView === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('month')}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Mois
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate('prev')}
                  className="border-border/50 hover:bg-muted/50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold min-w-[200px] text-center px-4 py-2 bg-muted/30 rounded-md border border-border/30">
                  {getCurrentPeriodLabel()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate('next')}
                  className="border-border/50 hover:bg-muted/50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={schedules.length === 0}
                className="border-border/50 hover:bg-muted/50"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter PDF
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {schedules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun cours programmé</h3>
              <p>
                {userRole === 'Étudiant' 
                  ? 'Aucun cours n\'est programmé pour vos formations.'
                  : 'Aucun créneau de formation ne vous est assigné.'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Day View */}
              {currentView === 'day' && (
                <div className="space-y-4">
                  {getSlotsForDate(selectedDate).map((slot) => (
                    <div 
                      key={slot.id} 
                      className="p-4 rounded-lg border border-border/50 shadow-sm bg-background hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-md">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold text-sm">
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              </span>
                            </div>
                            {slot.room && (
                              <div className="flex items-center gap-2 px-3 py-1 bg-muted/30 rounded-md">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{slot.room}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            {slot.formation_modules?.title && (
                              <h3 className="font-semibold text-lg">{slot.formation_modules.title}</h3>
                            )}
                            {slot.notes && (
                              <p className="text-muted-foreground text-sm bg-muted/20 p-2 rounded-md">{slot.notes}</p>
                            )}
                            {slot.users && userRole === 'Étudiant' && (
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{slot.users.first_name} {slot.users.last_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div 
                          className="w-6 h-20 rounded-lg shadow-sm border-2 border-white/20"
                          style={{ backgroundColor: slot.color || '#8B5CF6' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Week View */}
              {currentView === 'week' && (
                <div className="overflow-x-auto bg-background border border-border/50 rounded-lg">
                  <div className="grid grid-cols-6 gap-0 min-w-[800px]">
                    {/* Time column */}
                    <div className="border-r border-border/50">
                      <div className="h-12 font-semibold text-center p-3 bg-muted/30 border-b border-border/50">
                        Horaires
                      </div>
                      {timeSlots.map(time => (
                        <div key={time} className="h-16 flex items-center justify-center text-sm text-muted-foreground bg-muted/10 border-b border-border/30">
                          {time}
                        </div>
                      ))}
                    </div>

                    {/* Day columns */}
                    {getWeekDates().map((date, dayIndex) => {
                      const daySlots = getSlotsForDate(date);
                      return (
                        <div key={dayIndex} className="border-r border-border/50 last:border-r-0">
                          <div className="h-12 font-semibold text-center p-2 bg-muted/30 border-b border-border/50">
                            <div className="text-sm">{weekDays[dayIndex]}</div>
                            <div className="text-xs text-muted-foreground">
                              {date.getDate()}/{date.getMonth() + 1}
                            </div>
                          </div>
                          
                          <div className="relative min-h-[400px] p-1">
                            {daySlots.map((slot, index) => {
                              const startHour = parseInt(slot.start_time.split(':')[0]);
                              const topPosition = (startHour - 8) * 64; // 64px per hour slot
                              const duration = getSlotDuration(slot);
                              
                              return (
                                <div
                                  key={slot.id}
                                  className="absolute left-1 right-1 p-2 rounded-md text-white text-xs shadow-sm border border-white/20"
                                  style={{ 
                                    backgroundColor: slot.color || '#8B5CF6',
                                    top: `${topPosition}px`,
                                    height: `${duration * 64 - 4}px`,
                                    zIndex: 10 + index
                                  }}
                                >
                                  <div className="font-medium mb-1">
                                    {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                  </div>
                                  {slot.formation_modules?.title && (
                                    <div className="mb-1 text-xs">{slot.formation_modules.title}</div>
                                  )}
                                  {slot.notes && (
                                    <div className="opacity-90 mb-1 text-xs">{slot.notes}</div>
                                  )}
                                  {slot.room && (
                                    <div className="opacity-75 text-xs">{slot.room}</div>
                                  )}
                                  {slot.users && userRole === 'Étudiant' && (
                                    <div className="opacity-75 text-xs">
                                      {slot.users.first_name} {slot.users.last_name}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {/* Grid lines for hours */}
                            {timeSlots.map((_, index) => (
                              <div
                                key={index}
                                className="absolute left-0 right-0 border-b border-border/20"
                                style={{ top: `${index * 64}px` }}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Month View */}
              {currentView === 'month' && (
                <div className="space-y-4">
                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {/* Days of week header */}
                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                      <div key={day} className="p-3 text-center font-medium text-muted-foreground border-b">
                        {day}
                      </div>
                    ))}
                    
                    {/* Calendar days */}
                    {Array.from({ length: 35 }, (_, i) => {
                      const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
                      const startDate = new Date(firstDay);
                      startDate.setDate(startDate.getDate() - firstDay.getDay() + 1 + i);
                      
                      const isCurrentMonth = startDate.getMonth() === selectedDate.getMonth();
                      const daySlots = isCurrentMonth ? getSlotsForDate(startDate) : [];
                      
                      return (
                        <div
                          key={i}
                          className={`p-2 min-h-[120px] border border-border/50 ${
                            isCurrentMonth ? 'bg-background' : 'bg-muted/30'
                          }`}
                        >
                          <div className={`text-sm font-medium mb-2 ${
                            isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {startDate.getDate()}
                          </div>
                          
                          <div className="space-y-1">
                            {daySlots.map((slot) => (
                              <div
                                key={slot.id}
                                className="text-xs p-2 rounded-md text-white"
                                style={{ backgroundColor: slot.color || '#8B5CF6' }}
                                title={`${formatTime(slot.start_time)} - ${formatTime(slot.end_time)} | ${slot.formation_modules?.title || slot.notes} | ${slot.room || ''}`}
                              >
                                <div className="font-medium mb-1">
                                  {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                </div>
                                {slot.formation_modules?.title && (
                                  <div className="truncate mb-1">{slot.formation_modules.title}</div>
                                )}
                                {slot.notes && (
                                  <div className="truncate opacity-90 mb-1">{slot.notes}</div>
                                )}
                                {slot.room && (
                                  <div className="truncate opacity-75">{slot.room}</div>
                                )}
                                {slot.users && userRole === 'Étudiant' && (
                                  <div className="truncate opacity-75">
                                    {slot.users.first_name} {slot.users.last_name}
                                  </div>
                                )}
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
      </div>

      {/* Statistics */}
      {schedules.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {userRole === 'Étudiant' ? 'Cours cette semaine' : 'Créneaux cette semaine'}
                </p>
                <p className="text-2xl font-bold">
                  {(() => {
                    const weekDates = getWeekDates();
                    const weekStart = formatDate(weekDates[0]);
                    const weekEnd = formatDate(weekDates[4]);
                    return schedules.filter(slot => 
                      slot.date >= weekStart && slot.date <= weekEnd
                    ).length;
                  })()}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Heures programmées</p>
                <p className="text-2xl font-bold">
                  {schedules.reduce((total, slot) => {
                    return total + getSlotDuration(slot);
                  }, 0)}h
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {userRole === 'Étudiant' ? 'Formateurs' : 'Formations'}
                </p>
                <p className="text-2xl font-bold">
                  {userRole === 'Étudiant' 
                    ? new Set(schedules.filter(s => s.users).map(s => `${s.users?.first_name} ${s.users?.last_name}`)).size
                    : new Set(schedules.map(s => s.schedule_id)).size
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <User className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Salles utilisées</p>
                <p className="text-2xl font-bold">
                  {new Set(schedules.filter(s => s.room).map(s => s.room)).size}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <MapPin className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EmploiTemps;
