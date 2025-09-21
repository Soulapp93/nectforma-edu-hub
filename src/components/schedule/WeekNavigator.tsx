import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WeekNavigatorProps {
  currentDate: Date;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
}

export const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  currentDate,
  onNavigate
}) => {
  return (
    <div className="flex items-center space-x-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onNavigate('prev')}
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <CalendarIcon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          <span className="font-medium text-slate-900 dark:text-white min-w-[120px] text-center">
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </span>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('today')}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          Aujourd'hui
        </Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onNavigate('next')}
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};