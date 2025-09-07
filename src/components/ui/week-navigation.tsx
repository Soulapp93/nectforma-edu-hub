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

  // Get current week number using ISO 8601 standard (1-53)
  const getWeekNumber = (date: Date): number => {
    const tempDate = new Date(date.getTime());
    tempDate.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year
    tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
    // January 4 is always in week 1
    const week1 = new Date(tempDate.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count weeks from there
    return 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  // Get start date (Monday) of a specific week in a year using ISO 8601
  const getWeekStartDate = (year: number, weekNumber: number): Date => {
    // January 4 is always in week 1
    const jan4 = new Date(year, 0, 4);
    // Find Thursday of week 1 (January 4 is always in week 1)
    const week1Thursday = new Date(jan4);
    week1Thursday.setDate(jan4.getDate() - (jan4.getDay() + 6) % 7 + 3);
    // Find Monday of week 1
    const week1Monday = new Date(week1Thursday);
    week1Monday.setDate(week1Thursday.getDate() - 3);
    // Calculate the Monday of the specified week
    const targetMonday = new Date(week1Monday);
    targetMonday.setDate(week1Monday.getDate() + (weekNumber - 1) * 7);
    return targetMonday;
  };

  // Get end date (Sunday) of a specific week
  const getWeekEndDate = (weekStartDate: Date): Date => {
    const weekEnd = new Date(weekStartDate);
    weekEnd.setDate(weekStartDate.getDate() + 6);
    return weekEnd;
  };

  // Get all weeks for the selected year (ISO 8601 can have 52 or 53 weeks)
  const getYearWeeks = () => {
    const weeks = [];
    
    // Calculate how many weeks are in this year
    const lastWeekOfYear = getWeekNumber(new Date(selectedYear, 11, 31));
    const maxWeeks = lastWeekOfYear >= 52 ? lastWeekOfYear : 52;
    
    for (let weekNumber = 1; weekNumber <= maxWeeks; weekNumber++) {
      const weekStartDate = getWeekStartDate(selectedYear, weekNumber);
      // Ensure the week belongs to the selected year
      if (weekStartDate.getFullYear() === selectedYear || 
          (weekNumber === 1 && weekStartDate.getFullYear() === selectedYear - 1)) {
        weeks.push({
          number: weekNumber,
          startDate: weekStartDate,
          label: `S${weekNumber}`
        });
      }
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
            const weekEndDate = getWeekEndDate(week.startDate);
            return (
              <button
                key={week.number}
                onClick={() => navigateToWeek(week.startDate)}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 min-w-[50px] ${
                  isCurrentWeek
                    ? 'bg-primary text-white shadow-md transform scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                }`}
                title={`${week.label}: du ${format(week.startDate, 'dd/MM/yyyy')} au ${format(weekEndDate, 'dd/MM/yyyy')}`}
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