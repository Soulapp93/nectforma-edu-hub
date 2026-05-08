import React from 'react';
import { Clock, MapPin, User } from 'lucide-react';
import { ScheduleEvent } from './CreateEventModal';
import { useIsMobile } from '@/hooks/use-mobile';

interface DayViewProps {
  selectedDate: Date;
  events: ScheduleEvent[];
  onEventClick?: (event: ScheduleEvent) => void;
}

export const DayView: React.FC<DayViewProps> = ({ selectedDate, events, onEventClick }) => {
  const isMobile = useIsMobile();

  const dayEvents = events.filter(event =>
    event.date.toDateString() === selectedDate.toDateString()
  ).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const timeToMinutes = (time: string): number => {
    const parts = time.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  };

  const fmtTime = (t: string) => t.split(':').slice(0, 2).join(':');

  const isAutonomie = (e: ScheduleEvent) => e.sessionType === 'autonomie';

  // ─── Mobile: liste de cartes ───────────────────────────────────────
  if (isMobile) {
    return (
      <div className="space-y-3 p-2">
        {dayEvents.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-sm">
            Aucun cours programmé
          </p>
        ) : (
          dayEvents.map((event) => {
            const auto = isAutonomie(event);
            return (
              <div
                key={event.id}
                className="rounded-xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
                style={{ backgroundColor: event.color || 'hsl(var(--primary))' }}
                onClick={() => onEventClick?.(event)}
              >
                <h4 className="font-bold text-white text-base mb-2">
                  {auto ? 'AUTONOMIE' : event.title}
                </h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/90">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {fmtTime(event.startTime)} - {fmtTime(event.endTime)}
                  </span>
                  {!auto && event.room && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {event.room}
                    </span>
                  )}
                  {!auto && event.instructor && (
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {event.instructor}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  // ─── Desktop: timeline simple ──────────────────────────────────────
  const START_HOUR = 7;
  const END_HOUR = 22;
  const HOUR_HEIGHT_REM = 5;

  const timeSlots = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => `${(START_HOUR + i).toString().padStart(2, '0')}:00`
  );

  // Overlap detection
  const detectOverlaps = (evts: ScheduleEvent[]) => {
    const map = new Map<string, { column: number; totalColumns: number }>();
    const sorted = [...evts].sort((a, b) => a.startTime.localeCompare(b.startTime));
    const columns: ScheduleEvent[][] = [];

    sorted.forEach(event => {
      const eStart = timeToMinutes(event.startTime);
      const eEnd = timeToMinutes(event.endTime);
      let placed = -1;

      for (let i = 0; i < columns.length; i++) {
        const overlap = columns[i].some(ex => {
          const s = timeToMinutes(ex.startTime);
          const e = timeToMinutes(ex.endTime);
          return eStart < e && eEnd > s;
        });
        if (!overlap) { columns[i].push(event); placed = i; break; }
      }

      if (placed === -1) { columns.push([event]); placed = columns.length - 1; }

      const totalColumns = columns.filter(col =>
        col.some(e => {
          const s = timeToMinutes(e.startTime);
          const en = timeToMinutes(e.endTime);
          return eStart < en && eEnd > s;
        })
      ).length;

      map.set(event.id, { column: placed, totalColumns });
    });
    return map;
  };

  const overlapMap = detectOverlaps(dayEvents);

  const getEventPosition = (event: ScheduleEvent) => {
    const startMin = timeToMinutes(event.startTime);
    const endMin = timeToMinutes(event.endTime);
    const base = START_HOUR * 60;
    const vStart = Math.max(startMin, base);
    const vEnd = Math.min(endMin, END_HOUR * 60);
    const effectiveEnd = vEnd <= vStart ? vStart + 30 : vEnd;
    const topRem = ((vStart - base) / 60) * HOUR_HEIGHT_REM;
    const heightRem = Math.max(((effectiveEnd - vStart) / 60) * HOUR_HEIGHT_REM, 1);
    return { topRem, heightRem };
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="flex">
        {/* Time labels */}
        <div className="flex-shrink-0 w-14 border-r border-border/30">
          {timeSlots.map((time) => (
            <div key={time} className="h-20 flex items-start justify-end pr-2 pt-0.5">
              <span className="text-xs text-muted-foreground font-medium">{time}</span>
            </div>
          ))}
        </div>

        {/* Events area */}
        <div className="flex-1 relative">
          {timeSlots.map((time) => (
            <div key={time} className="h-20 border-b border-border/10" />
          ))}

          {dayEvents.map((event) => {
            const { topRem, heightRem } = getEventPosition(event);
            const auto = isAutonomie(event);
            const info = overlapMap.get(event.id);
            const col = info?.column ?? 0;
            const total = info?.totalColumns ?? 1;
            const wPct = 100 / total;
            const lPct = (col * 100) / total;

            return (
              <div
                key={event.id}
                className="absolute rounded-lg cursor-pointer transition-shadow hover:shadow-lg overflow-hidden"
                style={{
                  top: `${topRem}rem`,
                  height: `${heightRem}rem`,
                  left: `calc(${lPct}% + 4px)`,
                  width: `calc(${wPct}% - ${total > 1 ? '8px' : '8px'})`,
                  backgroundColor: event.color || 'hsl(var(--primary))',
                  zIndex: 10,
                }}
                onClick={(e) => { e.stopPropagation(); onEventClick?.(event); }}
              >
                <div className="h-full p-2.5 flex flex-col text-white">
                  <h4 className="font-bold text-sm leading-tight">
                    {event.isEvent ? (event.eventTypeLabel || event.title) : (auto ? 'AUTONOMIE' : event.title)}
                  </h4>
                  <div className="mt-1 space-y-0.5 text-xs text-white/90">
                    {!event.isEvent && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        {fmtTime(event.startTime)} - {fmtTime(event.endTime)}
                      </span>
                    )}
                    {!event.isEvent && !auto && event.room && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{event.room}</span>
                      </span>
                    )}
                    {!event.isEvent && !auto && event.instructor && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{event.instructor}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
