import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface WeekNavigationProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onWeekSelect?: (weekStartDate: Date) => void;
  className?: string;
}

const WeekNavigation: React.FC<WeekNavigationProps> = ({
  selectedDate,
  onDateChange,
  onWeekSelect,
  className
}) => {
  const [selectedYear, setSelectedYear] = useState(selectedDate.getFullYear());

  // Get current week number in the year (1-52)
  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((date.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    return Math.ceil((dayOfYear + firstDayOfYear.getDay()) / 7);
  };

  // Get start date of a specific week in a year
  const getWeekStartDate = (year: number, weekNumber: number): Date => {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysToAdd = (weekNumber - 1) * 7 - firstDayOfYear.getDay();
    return new Date(year, 0, 1 + daysToAdd);
  };

  // Get all 52 weeks for the selected year
  const getYearWeeks = () => {
    const weeks = [];
    
    for (let weekNumber = 1; weekNumber <= 52; weekNumber++) {
      const weekStartDate = getWeekStartDate(selectedYear, weekNumber);
      weeks.push({
        number: weekNumber,
        startDate: weekStartDate,
        label: `S${weekNumber}`
      });
    }
    
    return weeks;
  };

  // Navigate to specific week
  const navigateToWeek = (weekStartDate: Date) => {
    onDateChange(new Date(weekStartDate));
    if (onWeekSelect) {
      onWeekSelect(new Date(weekStartDate));
    }
  };

  // Handle year change
  const handleYearChange = (direction: 'prev' | 'next') => {
    const newYear = direction === 'prev' ? selectedYear - 1 : selectedYear + 1;
    setSelectedYear(newYear);
    // Update selected date to first week of new year
    const firstWeekStart = getWeekStartDate(newYear, 1);
    onDateChange(firstWeekStart);
  };

  // Handle calendar date selection
  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedYear(date.getFullYear());
      onDateChange(date);
    }
  };

  const currentWeekNumber = getWeekNumber(selectedDate);
  const weeks = getYearWeeks();

  return (
    <div className={cn("bg-white rounded-xl shadow-sm border border-gray-100", className)}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Navigation par semaines</h2>
          
          <div className="flex items-center space-x-2">
            {/* Year Navigation */}
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleYearChange('prev')}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
                {selectedYear}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleYearChange('next')}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Calendar className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleCalendarSelect}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Weeks Grid */}
        <div className="flex overflow-x-auto scrollbar-hide space-x-2 pb-2">
          {weeks.map((week) => {
            const isCurrentWeek = currentWeekNumber === week.number && selectedDate.getFullYear() === selectedYear;
            return (
              <button
                key={week.number}
                onClick={() => navigateToWeek(week.startDate)}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 min-w-[50px] ${
                  isCurrentWeek
                    ? 'bg-primary text-white shadow-md transform scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                }`}
                title={`Semaine du ${format(week.startDate, 'dd MMM yyyy')}`}
              >
                {week.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeekNavigation;