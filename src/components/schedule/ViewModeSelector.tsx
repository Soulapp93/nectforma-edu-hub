import React from 'react';
import { Eye, Grid3X3, Calendar, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ViewMode = 'day' | 'week' | 'month' | 'list';

interface ViewModeSelectorProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({
  viewMode,
  onViewModeChange
}) => {
  const viewModes = [
    { id: 'day' as ViewMode, label: 'Jour', icon: Eye },
    { id: 'week' as ViewMode, label: 'Semaine', icon: Grid3X3 },
    { id: 'month' as ViewMode, label: 'Mois', icon: Calendar },
    { id: 'list' as ViewMode, label: 'Liste', icon: List }
  ];

  return (
    <div className="flex items-center space-x-2 bg-muted/50 rounded-xl p-1 border">
      {viewModes.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          variant={viewMode === id ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange(id)}
          className={`px-3 ${
            viewMode === id 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'hover:bg-primary/10'
          }`}
        >
          <Icon className="h-4 w-4 mr-2" />
          {label}
        </Button>
      ))}
    </div>
  );
};