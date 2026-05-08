import React from 'react';
import { Clock, MapPin, User, Calendar, BookOpen, Users, CalendarOff, GraduationCap, Sparkles } from 'lucide-react';
import { ScheduleEvent } from './CreateEventModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DayViewProps {
  selectedDate: Date;
  events: ScheduleEvent[];
  onEventClick?: (event: ScheduleEvent) => void;
}

const fmtTime = (t: string) => t.split(':').slice(0, 2).join(':');

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const formatDuration = (start: string, end: string): string => {
  const mins = timeToMinutes(end) - timeToMinutes(start);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}`;
};

/**
 * Redesigned Day view — simplified ergonomic layout
 *
 * Structure:
 *   1. Header strip — selected date + quick stats (cours / events / heures totales)
 *   2. Timeline rail (left) with hour markers
 *   3. Cards stacked chronologically — each card has a clear category badge:
 *      • Course   → primary blue, shows module / instructor / room / time / formation
 *      • Autonomie → amber, shows time + notes
 *      • Event    → category colour, shows ONLY type label + custom title + notes (no time/room/instructor)
 *
 * Why this design:
 *   • A timeline grid (legacy) wastes space when only a few slots exist + clips overlapping events.
 *   • A linear chronological list is faster to scan + works equally well on mobile and desktop.
 *   • A clear "category badge" eliminates the ambiguity between courses / autonomies / events
 *     reported by the user in the previous iteration.
 */
export const DayView: React.FC<DayViewProps> = ({ selectedDate, events, onEventClick }) => {
  const dayEvents = events
    .filter(e => e.date.toDateString() === selectedDate.toDateString())
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Quick stats (excluding events from totals — events are not "courses")
  const courseLikeEvents = dayEvents.filter(e => !e.isEvent);
  const totalMinutes = courseLikeEvents.reduce((s, e) => s + (timeToMinutes(e.endTime) - timeToMinutes(e.startTime)), 0);
  const totalHours = `${Math.floor(totalMinutes / 60)}h${(totalMinutes % 60).toString().padStart(2, '0')}`;
  const distinctInstructors = new Set(courseLikeEvents.filter(e => e.sessionType !== 'autonomie' && e.instructor).map(e => e.instructor)).size;
  const eventsCount = dayEvents.filter(e => e.isEvent).length;
  const coursesCount = dayEvents.filter(e => !e.isEvent && e.sessionType !== 'autonomie').length;
  const autonomiesCount = dayEvents.filter(e => e.sessionType === 'autonomie').length;

  // ─── No events ─────────────────────────────────────────────
  if (dayEvents.length === 0) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card p-12 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/40 mb-4">
          <Calendar className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
        </h3>
        <p className="text-sm text-muted-foreground">Aucun cours ni événement programmé ce jour.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="day-view-redesign">
      {/* HEADER ─ date + stats */}
      <div className="rounded-2xl border border-border/40 bg-card p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Vue du jour</div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground capitalize mt-0.5">
              {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
            </h2>
          </div>
          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            {coursesCount > 0 && (
              <StatPill icon={<BookOpen className="h-3.5 w-3.5" />} label={`${coursesCount} cours`} color="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" />
            )}
            {autonomiesCount > 0 && (
              <StatPill icon={<Sparkles className="h-3.5 w-3.5" />} label={`${autonomiesCount} autonomie${autonomiesCount > 1 ? 's' : ''}`} color="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" />
            )}
            {eventsCount > 0 && (
              <StatPill icon={<CalendarOff className="h-3.5 w-3.5" />} label={`${eventsCount} événement${eventsCount > 1 ? 's' : ''}`} color="bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" />
            )}
            {totalMinutes > 0 && (
              <StatPill icon={<Clock className="h-3.5 w-3.5" />} label={totalHours} color="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" />
            )}
            {distinctInstructors > 0 && (
              <StatPill icon={<Users className="h-3.5 w-3.5" />} label={`${distinctInstructors} formateur${distinctInstructors > 1 ? 's' : ''}`} color="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" />
            )}
          </div>
        </div>
      </div>

      {/* TIMELINE ─ chronological card list */}
      <div className="space-y-2.5" data-testid="day-view-timeline">
        {dayEvents.map((event) => {
          const isAuto = event.sessionType === 'autonomie';
          const isEvt = !!event.isEvent;
          const accent = event.color || (isEvt ? '#7C3AED' : isAuto ? '#F59E0B' : '#3B82F6');

          return (
            <div
              key={event.id}
              onClick={() => onEventClick?.(event)}
              className="group relative flex gap-3 sm:gap-4 cursor-pointer"
              data-testid={`day-card-${event.id}`}
            >
              {/* Time rail (left) — hidden for events (no clock anchor) */}
              <div className="flex-shrink-0 w-16 sm:w-20 pt-2 text-right">
                {isEvt ? (
                  <div className="text-[11px] uppercase tracking-wide text-violet-700/80 font-semibold">
                    Toute la journée
                  </div>
                ) : (
                  <>
                    <div className="text-sm font-bold text-foreground">{fmtTime(event.startTime)}</div>
                    <div className="text-[11px] text-muted-foreground">{fmtTime(event.endTime)}</div>
                    <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                      {formatDuration(event.startTime, event.endTime)}
                    </div>
                  </>
                )}
              </div>

              {/* Card body */}
              <div
                className="flex-1 min-w-0 rounded-xl border border-border/40 bg-card hover:shadow-md transition-shadow overflow-hidden"
                style={{ borderLeftColor: accent, borderLeftWidth: 4 }}
              >
                <div className="p-3 sm:p-4">
                  {/* Category badge + title row */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <CategoryBadge isEvt={isEvt} isAuto={isAuto} accent={accent} />
                        {isEvt && event.eventTypeLabel && (
                          <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wide">
                            {event.eventTypeLabel}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground text-base sm:text-lg leading-tight truncate">
                        {isEvt ? (event.title || event.eventTypeLabel || 'Événement') : (isAuto ? 'AUTONOMIE' : event.title)}
                      </h3>
                    </div>
                  </div>

                  {/* Details row — adapted to category */}
                  {!isEvt && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-muted-foreground mt-2">
                      {!isAuto && event.formation && (
                        <span className="flex items-center gap-1.5" data-testid={`day-card-formation-${event.id}`}>
                          <GraduationCap className="h-3.5 w-3.5 text-primary/70" />
                          <span className="truncate max-w-[200px]">{event.formation}</span>
                        </span>
                      )}
                      {!isAuto && event.instructor && (
                        <span className="flex items-center gap-1.5" data-testid={`day-card-instructor-${event.id}`}>
                          <User className="h-3.5 w-3.5 text-primary/70" />
                          <span className="truncate max-w-[160px]">{event.instructor}</span>
                        </span>
                      )}
                      {!isAuto && event.room && (
                        <span className="flex items-center gap-1.5" data-testid={`day-card-room-${event.id}`}>
                          <MapPin className="h-3.5 w-3.5 text-primary/70" />
                          <span>{event.room}</span>
                        </span>
                      )}
                      {isAuto && (
                        <span className="text-amber-700 dark:text-amber-300 italic">Travail en autonomie</span>
                      )}
                    </div>
                  )}

                  {/* Notes / description */}
                  {event.description && (
                    <p
                      className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2 italic"
                      data-testid={`day-card-notes-${event.id}`}
                    >
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StatPill: React.FC<{ icon: React.ReactNode; label: string; color: string }> = ({ icon, label, color }) => (
  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
    {icon}
    {label}
  </div>
);

const CategoryBadge: React.FC<{ isEvt: boolean; isAuto: boolean; accent: string }> = ({ isEvt, isAuto, accent }) => {
  if (isEvt) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
        <CalendarOff className="h-3 w-3" /> Événement
      </span>
    );
  }
  if (isAuto) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        <Sparkles className="h-3 w-3" /> Autonomie
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
      style={{ background: accent }}
    >
      <BookOpen className="h-3 w-3" /> Cours
    </span>
  );
};
