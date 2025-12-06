import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { ScheduleEvent } from './CreateEventModal';

interface ScheduleDay {
  id: string;
  day: string;
  date: string;
  modules: Array<{
    title: string;
    time: string;
    instructor: string;
    room: string;
    color: string;
  }>;
}

interface ScheduleViewCalendarProps {
  schedule: ScheduleDay[];
  filteredEvents: ScheduleEvent[];
  onEventClick: (event: ScheduleEvent) => void;
}

export const ScheduleViewCalendar: React.FC<ScheduleViewCalendarProps> = ({
  schedule,
  filteredEvents,
  onEventClick
}) => {
  return (
    <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3 sm:gap-4 lg:gap-6">
        {schedule.map((day) => (
          <Card
            key={day.id}
            className={`overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 ${
              day.modules.length > 0 
                ? 'bg-card shadow-md hover:shadow-primary/10' 
                : 'bg-muted/30 shadow-sm opacity-70'
            }`}
          >
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg font-bold text-foreground truncate">
                    {day.day}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl sm:text-2xl font-bold text-primary">
                      {day.date}
                    </span>
                    {day.modules.length > 0 && (
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                        {day.modules.length} cours
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-4 pt-0">
              {day.modules.length === 0 ? (
                <div className="text-center py-4 sm:py-8">
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Aucun cours
                  </p>
                </div>
              ) : (
                day.modules.map((module, index) => {
                  const fullEvent = filteredEvents.find(e => 
                    e.title === module.title && 
                    e.instructor === module.instructor &&
                    e.room === module.room
                  );
                  
                  return (
                    <div
                      key={index}
                      className="px-3 py-3 sm:px-4 sm:py-4 rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer group text-white"
                      style={{ 
                        backgroundColor: module.color || '#3B82F6'
                      }}
                      onClick={() => {
                        if (fullEvent) onEventClick(fullEvent);
                      }}
                    >
                      <div className="flex items-start justify-between mb-2 gap-1">
                        <h4 className="font-semibold text-white text-xs sm:text-sm group-hover:text-white/90 transition-colors line-clamp-2">
                          {module.title}
                        </h4>
                        {fullEvent?.formation && (
                          <Badge 
                            variant="outline" 
                            className="text-[10px] sm:text-xs ml-1 border-white/30 text-white/90 bg-white/10 flex-shrink-0 hidden sm:flex"
                          >
                            {fullEvent.formation}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center text-[10px] sm:text-xs text-white/90">
                          <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{module.time}</span>
                        </div>
                        <div className="flex items-center text-[10px] sm:text-xs text-white/90">
                          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{module.room}</span>
                        </div>
                        <div className="flex items-center text-[10px] sm:text-xs text-white/90">
                          <User className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{module.instructor}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
