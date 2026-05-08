import React, { useMemo } from 'react';
import { Clock, MapPin, User, Calendar, GraduationCap, Sparkles, CalendarOff } from 'lucide-react';
import { ScheduleEvent } from './CreateEventModal';
import { format, isSameDay } from 'date-fns';
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
  if (h <= 0 && m <= 0) return '';
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}`;
};

const isAllDayEvent = (e: ScheduleEvent): boolean => {
  if (!e.isEvent) return false;
  const startMin = timeToMinutes(e.startTime);
  const endMin = timeToMinutes(e.endTime);
  if (fmtTime(e.startTime) === '00:00' && fmtTime(e.endTime) === '23:59') return true;
  return endMin - startMin >= 23 * 60;
};

/** Course-card badge (CM / TD / TP / AUTO / COURS). Events use their own dedicated card style. */
const getCourseBadgeLabel = (e: ScheduleEvent): string => {
  if (e.sessionType === 'autonomie') return 'AUTO';
  switch ((e.sessionType || '').toLowerCase()) {
    case 'cm': return 'CM';
    case 'td': return 'TD';
    case 'tp': return 'TP';
    default: return 'COURS';
  }
};

const getCourseBadgeClasses = (e: ScheduleEvent): string => {
  if (e.sessionType === 'autonomie')
    return 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200 border-amber-500/30';
  return 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200 border-emerald-500/30';
};

type RailItem =
  | { kind: 'course'; label: string; event: ScheduleEvent }
  | { kind: 'empty'; label: string; key: string };

/**
 * Build a course-only timeline rail.
 *  - Hours adapt to actual course times: rail starts at the first course's hour
 *    and ends at the round hour after the last course's end.
 *  - Hours where a course starts get the course card (label = course start time).
 *  - Hours covered by a course's body are skipped.
 *  - Other round hours render a "Pas de cours" filler.
 *
 * Events are NOT included in the rail; they are rendered separately as full-width
 * colored cards (no hour anchor) above the rail.
 */
const buildRail = (events: ScheduleEvent[]): {
  allDayEvents: ScheduleEvent[];
  timedEvents: ScheduleEvent[];
  courses: ScheduleEvent[];
  rail: RailItem[];
} => {
  const allDayEvents: ScheduleEvent[] = [];
  const timedEvents: ScheduleEvent[] = [];
  const courses: ScheduleEvent[] = [];

  for (const e of events) {
    if (e.isEvent) {
      if (isAllDayEvent(e)) allDayEvents.push(e);
      else timedEvents.push(e);
    } else {
      courses.push(e);
    }
  }

  // Sort everything chronologically
  timedEvents.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  courses.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  if (courses.length === 0) {
    return { allDayEvents, timedEvents, courses, rail: [] };
  }

  const minHour = Math.floor(timeToMinutes(courses[0].startTime) / 60);
  const maxHour = Math.ceil(timeToMinutes(courses[courses.length - 1].endTime) / 60);

  const rail: RailItem[] = [];
  for (let h = minHour; h <= maxHour; h++) {
    const hourStart = h * 60;
    const hourEnd = (h + 1) * 60;
    const startingHere = courses.find(c => {
      const s = timeToMinutes(c.startTime);
      return s >= hourStart && s < hourEnd;
    });
    if (startingHere) {
      rail.push({ kind: 'course', label: fmtTime(startingHere.startTime), event: startingHere });
      continue;
    }
    const coveredByPrev = courses.some(c => {
      const s = timeToMinutes(c.startTime);
      const en = timeToMinutes(c.endTime);
      return s <= hourStart && en > hourStart;
    });
    if (coveredByPrev) continue;
    rail.push({ kind: 'empty', label: `${String(h).padStart(2, '0')}:00`, key: `empty-${h}` });
  }

  return { allDayEvents, timedEvents, courses, rail };
};

export const DayView: React.FC<DayViewProps> = ({ selectedDate, events, onEventClick }) => {
  const dayEvents = useMemo(
    () => events.filter(e => isSameDay(e.date, selectedDate)),
    [events, selectedDate]
  );

  const { allDayEvents, timedEvents, courses, rail } = useMemo(() => buildRail(dayEvents), [dayEvents]);

  const autonomies = courses.filter(c => c.sessionType === 'autonomie');
  const realCourses = courses.filter(c => c.sessionType !== 'autonomie');
  const examEvents = [...allDayEvents, ...timedEvents].filter(e =>
    /examen|partiel|rattrapage/i.test(e.eventTypeLabel || '')
  );
  const otherEvents = [...allDayEvents, ...timedEvents].filter(e =>
    !/examen|partiel|rattrapage/i.test(e.eventTypeLabel || '')
  );

  const headline: string[] = [];
  if (realCourses.length) headline.push(`${realCourses.length} cours`);
  if (autonomies.length) headline.push(`${autonomies.length} autonomie${autonomies.length > 1 ? 's' : ''}`);
  if (examEvents.length) headline.push(`${examEvents.length} examen${examEvents.length > 1 ? 's' : ''}`);
  if (otherEvents.length) headline.push(`${otherEvents.length} événement${otherEvents.length > 1 ? 's' : ''}`);

  const isToday = isSameDay(selectedDate, new Date());

  if (dayEvents.length === 0) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden" data-testid="day-view-redesign">
        <Header selectedDate={selectedDate} headline={null} isToday={isToday} />
        <div className="px-4 py-12 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/40 mb-3">
            <Calendar className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Aucun cours ni événement programmé ce jour.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card overflow-hidden" data-testid="day-view-redesign">
      <Header selectedDate={selectedDate} headline={headline.join(' · ')} isToday={isToday} />

      {/* EVENTS — full-width colored cards, no hour anchor (all-day + timed grouped together) */}
      {(allDayEvents.length > 0 || timedEvents.length > 0) && (
        <div className="px-4 sm:px-6 pt-4 space-y-2.5" data-testid="day-view-events">
          {[...allDayEvents, ...timedEvents].map(e => (
            <EventBanner key={`evt-${e.id}`} event={e} onClick={() => onEventClick?.(e)} />
          ))}
        </div>
      )}

      {/* COURSES TIMELINE — hour rail with adaptive hours */}
      {rail.length > 0 && (
        <div className="px-2 sm:px-4 py-4" data-testid="day-view-rail">
          <div className="divide-y divide-border/30">
            {rail.map((item, idx) => (
              <RailRow
                key={item.kind === 'course' ? `course-${item.event.id}` : item.key + idx}
                item={item}
                onEventClick={onEventClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* FOOTER STATS */}
      <div className="border-t border-border/40 px-6 py-3 flex items-center gap-4 flex-wrap text-xs text-muted-foreground" data-testid="day-view-footer">
        {realCourses.length > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Cours : <strong className="text-foreground">{realCourses.length}</strong></span>
          </span>
        )}
        {autonomies.length > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Autonomies : <strong className="text-foreground">{autonomies.length}</strong></span>
          </span>
        )}
        {examEvents.length > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span>Examens : <strong className="text-foreground">{examEvents.length}</strong></span>
          </span>
        )}
        {otherEvents.length > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-violet-500" />
            <span>Événements : <strong className="text-foreground">{otherEvents.length}</strong></span>
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Sub-components ────────────────────────────────────────────────────────

const Header: React.FC<{ selectedDate: Date; headline: string | null; isToday: boolean }> = ({ selectedDate, headline, isToday }) => (
  <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-border/40 px-6 py-5">
    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1">
      Semaine {format(selectedDate, 'I', { locale: fr })}
    </div>
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <h2 className="text-2xl font-bold text-foreground capitalize" data-testid="day-view-title">
        {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
      </h2>
      {isToday && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground">
          Aujourd'hui
        </span>
      )}
    </div>
    {headline && (
      <p className="text-sm text-muted-foreground mt-1.5" data-testid="day-view-headline">{headline}</p>
    )}
  </div>
);

/**
 * Event card — full width, colored background tinted with the event color, no hour anchor.
 * Shows: event type label + custom title + time (or "Toute la journée") + notes.
 */
const EventBanner: React.FC<{ event: ScheduleEvent; onClick: () => void }> = ({ event, onClick }) => {
  const allDay = isAllDayEvent(event);
  const accent = event.color || '#7C3AED';
  const duration = !allDay ? formatDuration(event.startTime, event.endTime) : '';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl border transition-all hover:shadow-md cursor-pointer overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${accent}1A 0%, ${accent}0D 100%)`,
        borderColor: `${accent}66`,
      }}
      data-testid={`day-event-card-${event.id}`}
    >
      <div className="px-4 py-3 flex items-start gap-3">
        <div
          className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: `${accent}33` }}
        >
          <CalendarOff className="h-4 w-4" style={{ color: accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: accent }}
              data-testid={`day-event-label-${event.id}`}
            >
              {event.eventTypeLabel || 'Événement'}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">
              {allDay
                ? 'Toute la journée'
                : `${fmtTime(event.startTime)} → ${fmtTime(event.endTime)}${duration ? ` · ${duration}` : ''}`}
            </span>
          </div>
          <h3 className="text-base font-semibold text-foreground truncate" data-testid={`day-event-title-${event.id}`}>
            {event.title || event.eventTypeLabel || 'Événement'}
          </h3>
          {event.description && (
            <p className="text-xs text-muted-foreground italic line-clamp-2 mt-1" data-testid={`day-event-notes-${event.id}`}>
              {event.description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
};

const RailRow: React.FC<{ item: RailItem; onEventClick?: (e: ScheduleEvent) => void }> = ({ item, onEventClick }) => {
  if (item.kind === 'empty') {
    return (
      <div className="flex items-stretch gap-3 sm:gap-4 px-3 py-2.5">
        <div className="w-12 sm:w-14 shrink-0 text-right">
          <div className="text-xs font-semibold tabular-nums text-muted-foreground/70">{item.label}</div>
        </div>
        <div className="flex-1 flex items-center pl-3 border-l border-dashed border-border/40">
          <span className="text-xs italic text-muted-foreground/60">Pas de cours</span>
        </div>
      </div>
    );
  }

  const e = item.event;
  const isAuto = e.sessionType === 'autonomie';
  const accent = e.color || (isAuto ? '#F59E0B' : '#10B981');
  const duration = formatDuration(e.startTime, e.endTime);
  const badgeLabel = getCourseBadgeLabel(e);
  const badgeCls = getCourseBadgeClasses(e);

  return (
    <div className="flex items-stretch gap-3 sm:gap-4 px-3 py-2.5">
      <div className="w-12 sm:w-14 shrink-0 text-right pt-1">
        <div className="text-sm font-bold tabular-nums text-foreground">{item.label}</div>
      </div>
      <button
        type="button"
        onClick={() => onEventClick?.(e)}
        className="group flex-1 text-left rounded-xl border border-border/40 bg-card hover:border-border hover:shadow-md transition-all overflow-hidden cursor-pointer"
        style={{ borderLeftColor: accent, borderLeftWidth: 4 }}
        data-testid={`day-card-${e.id}`}
      >
        <div className="px-4 py-3">
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <h3 className="font-semibold text-foreground text-base leading-tight truncate flex-1" data-testid={`day-card-title-${e.id}`}>
              {isAuto ? 'AUTONOMIE' : e.title}
            </h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shrink-0 ${badgeCls}`} data-testid={`day-card-badge-${e.id}`}>
              {badgeLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5" data-testid={`day-card-time-${e.id}`}>
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="tabular-nums">{fmtTime(e.startTime)} → {fmtTime(e.endTime)}</span>
            {duration && <span className="text-muted-foreground/60">· {duration}</span>}
          </div>

          {!isAuto && (
            <div className="flex flex-col gap-1 mt-1">
              {e.instructor && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid={`day-card-instructor-${e.id}`}>
                  <User className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{e.instructor}</span>
                </div>
              )}
              {e.room && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid={`day-card-room-${e.id}`}>
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>{e.room}</span>
                </div>
              )}
              {e.formation && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80" data-testid={`day-card-formation-${e.id}`}>
                  <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{e.formation}</span>
                </div>
              )}
            </div>
          )}

          {isAuto && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 italic mt-1">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>Travail en autonomie</span>
            </div>
          )}

          {e.description && !isAuto && (
            <p className="text-xs text-muted-foreground/80 italic line-clamp-2 mt-1.5" data-testid={`day-card-notes-${e.id}`}>
              {e.description}
            </p>
          )}
        </div>
      </button>
    </div>
  );
};
