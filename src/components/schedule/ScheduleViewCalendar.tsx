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
    <div className="container mx-auto px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-6">
        {schedule.map((day) => (
          <Card
            key={day.id}
            className={`overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 ${
              day.modules.length > 0 
                ? 'bg-card shadow-md hover:shadow-primary/10' 
                : 'bg-muted/30 shadow-sm opacity-70'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    {day.day}
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-2xl font-bold text-primary">
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

            <CardContent className="space-y-3">
              {day.modules.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
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
                      className="relative p-3 rounded-lg border border-muted/20 bg-background/50 hover:bg-background/80 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md"
                      onClick={() => {
                        if (fullEvent) onEventClick(fullEvent);
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div 
                          className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                          style={{ backgroundColor: module.color || '#3B82F6' }}
                        />
                        <h4 className="font-medium text-foreground text-sm group-hover:text-foreground/80 transition-colors flex-1">
                          {module.title}
                        </h4>
                        {fullEvent?.formation && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs ml-2"
                          >
                            {fullEvent.formation}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {module.time}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {module.room}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <User className="h-3 w-3 mr-1" />
                          {module.instructor}
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