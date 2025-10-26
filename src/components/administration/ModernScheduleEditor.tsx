import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  LayoutGrid, 
  BarChart3, 
  Search, 
  Download, 
  Settings, 
  Bell,
  Zap,
  Sparkles,
  Plus,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ScheduleSlot } from '@/services/scheduleService';
import { Button } from '@/components/ui/button';
import { TimelineView } from '@/components/schedule/TimelineView';
import { KanbanView } from '@/components/schedule/KanbanView';
import { DashboardView } from '@/components/schedule/DashboardView';
import { MasonryView } from '@/components/schedule/MasonryView';
import WeekNavigation from '@/components/ui/week-navigation';

type ViewMode = 'timeline' | 'kanban' | 'dashboard' | 'masonry';
type ScheduleView = 'day' | 'week' | 'month';
type DisplayMode = 'planning' | 'list';

interface ModernScheduleEditorProps {
  scheduleTitle: string;
  scheduleStatus: string;
  slots: ScheduleSlot[];
  slotsLoading: boolean;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  currentView: ScheduleView;
  onViewChange: (view: ScheduleView) => void;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onAddSlot: (date: Date, time: string) => void;
  onEditSlot: (slot: ScheduleSlot) => void;
  onDeleteSlot: (slot: ScheduleSlot) => void;
  onDuplicateSlot: (slot: ScheduleSlot) => void;
  onExcelImport: () => void;
  onPublishSchedule?: () => void;
}

export const ModernScheduleEditor: React.FC<ModernScheduleEditorProps> = ({
  scheduleTitle,
  scheduleStatus,
  slots,
  slotsLoading,
  selectedDate,
  onDateChange,
  currentView,
  onViewChange,
  displayMode,
  onDisplayModeChange,
  onAddSlot,
  onEditSlot,
  onDeleteSlot,
  onDuplicateSlot,
  onExcelImport,
  onPublishSchedule
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  const viewModes = [
    {
      id: 'kanban' as ViewMode,
      name: 'Kanban',
      icon: LayoutGrid,
      description: 'Organisation par colonnes',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'dashboard' as ViewMode,
      name: 'Dashboard',
      icon: BarChart3,
      description: 'Vue complète avec statistiques',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'timeline' as ViewMode,
      name: 'Timeline',
      icon: Clock,
      description: 'Chronologie interactive',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'masonry' as ViewMode,
      name: 'Mosaïque',
      icon: Sparkles,
      description: 'Cartes adaptatives',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    
    if (currentView === 'day') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (currentView === 'week') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (currentView === 'month') {
      newDate.setMonth(selectedDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    
    onDateChange(newDate);
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
      const monday = new Date(selectedDate);
      const day = monday.getDay();
      const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
      monday.setDate(diff);
      
      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        weekDates.push(date);
      }
      
      const start = weekDates[0];
      const end = weekDates[6];
      return `Semaine Du ${start.getDate()} Au ${end.getDate()} ${start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
    } else {
      return selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
  };

  const renderCurrentView = () => {
    switch (viewMode) {
      case 'timeline':
        return <TimelineView schedules={slots} selectedDate={selectedDate} />;
      case 'kanban':
        return <KanbanView schedules={slots} selectedDate={selectedDate} />;
      case 'dashboard':
        return <DashboardView schedules={slots} selectedDate={selectedDate} onDateChange={onDateChange} />;
      case 'masonry':
        return <MasonryView schedules={slots} selectedDate={selectedDate} />;
      default:
        return <KanbanView schedules={slots} selectedDate={selectedDate} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <WeekNavigation
        selectedDate={selectedDate}
        onDateChange={onDateChange}
        className="mb-6"
      />

      {/* Modern Schedule Editor */}
      <div className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-lg border border-border/50">
        {/* Controls Header */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {/* Schedule View Selector */}
              <div className="flex bg-muted/50 rounded-xl p-1 border border-border/30">
                <button
                  onClick={() => onViewChange('day')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === 'day' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Jour
                </button>
                <button
                  onClick={() => onViewChange('week')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === 'week' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Semaine
                </button>
                <button
                  onClick={() => onViewChange('month')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === 'month' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Mois
                </button>
              </div>

              {/* Display Mode Selector */}
              {(currentView === 'week' || currentView === 'day' || currentView === 'month') && (
                <div className="flex bg-muted/50 rounded-xl p-1 border border-border/30">
                  <button
                    onClick={() => onDisplayModeChange('planning')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      displayMode === 'planning' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Planning
                  </button>
                  <button
                    onClick={() => onDisplayModeChange('list')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      displayMode === 'list' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Liste
                  </button>
                </div>
              )}

              {/* Date Navigation */}
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
                onClick={() => onDateChange(new Date())}
                className="hover:bg-primary/10"
              >
                Aujourd'hui
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button 
                variant="outline"
                onClick={onExcelImport}
                className="hover:bg-primary/10"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Import Excel
              </Button>
              <Button 
                onClick={() => onAddSlot(selectedDate, '09:00')}
                className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un créneau
              </Button>
            </div>
          </div>

          {/* View Mode Selector */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {viewModes.map((mode) => {
              const Icon = mode.icon;
              const isActive = viewMode === mode.id;
              
              return (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={`
                    group relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 min-w-fit
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                      : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground hover:scale-102'
                    }
                  `}
                >
                  {isActive && (
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${mode.color} opacity-20 animate-pulse`} />
                  )}
                  
                  <div className="relative flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${isActive ? 'animate-float' : 'group-hover:scale-110'} transition-transform`} />
                    <div className="text-left">
                      <div className="font-semibold text-sm">{mode.name}</div>
                      <div className="text-xs opacity-80">{mode.description}</div>
                    </div>
                  </div>

                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Schedule Content */}
        <div className="relative">
          {slotsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Chargement des créneaux...</p>
              </div>
            </div>
          ) : (
            renderCurrentView()
          )}
        </div>
      </div>
    </div>
  );
};