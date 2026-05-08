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

/** Map session/event type → short uppercase badge label shown top-right of the card. */
const getBadgeLabel = (e: ScheduleEvent): string => {
  if (e.isEvent) {
    const lbl = (e.eventTypeLabel || '').toLowerCase();
    if (lbl.includes('examen')) return 'EXAM';
    if (lbl.includes('partiel')) return 'PARTIEL';
    if (lbl.includes('rattrapage')) return 'RATTRAP';
    if (lbl.includes('jour férié') || lbl.includes('ferié')) return 'FÉRIÉ';
    if (lbl.includes('congé')) return 'CONGÉS';
    if (lbl.includes('fermé')) return 'FERMÉ';
    if (lbl.includes('porte')) return 'PO';
    return 'EVT';
  }
  if (e.sessionType === 'autonomie') return 'AUTO';
  // Default course badge
  switch ((e.sessionType || '').toLowerCase()) {
    case 'cm': return 'CM';
    case 'td': return 'TD';
    case 'tp': return 'TP';
    default: return 'COURS';
  }
};

const getBadgeClasses = (e: ScheduleEvent): string => {
  if (e.isEvent) {
    const lbl = (e.eventTypeLabel || '').toLowerCase();
    if (lbl.includes('examen') || lbl.includes('partiel') || lbl.includes('rattrapage'))
      return 'bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-300 border-red-500/30';
    return 'bg-violet-500/15 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200 border-violet-500/30';
  }
  if (e.sessionType === 'autonomie')
    return 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200 border-amber-500/30';
  return 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200 border-emerald-500/30';
};

type RailItem =
  | { kind: 'event'; label: string; event: ScheduleEvent }
  | { kind: 'empty'; label: string; key: string };

/**
 * Build the timeline rail:
 *  - For each integer hour H in [minHour..maxHour]:
 *      • if an event starts at HH:mm where H ≤ HH < H+1 → render the event card (label = exact start)
 *      • else if an event spans this hour → skip (already represented by the previous event card)
 *      • else → render "Pas de cours" filler labelled "H:00"
 *  - All-day events (e.g., Jour férié, Établissement fermé) are rendered as a single banner
 *    above the timeline (they don't belong on a specific hour).
 */
const buildRail = (events: ScheduleEvent[]): { allDay: ScheduleEvent[]; rail: RailItem[] } => {
  const allDay: ScheduleEvent[] = [];
  const timed: ScheduleEvent[] = [];

  for (const e of events) {
    const startMin = timeToMinutes(e.startTime);
    const endMin = timeToMinutes(e.endTime);
    const isAllDay = e.isEvent && (
      (fmtTime(e.startTime) === '00:00' && fmtTime(e.endTime) === '23:59') ||
      (endMin - startMin) >= 23 * 60
    );
    if (isAllDay) allDay.push(e);
    else timed.push(e);
  }

  if (timed.length === 0) {
    // Default empty rail 8h → 19h so the user still sees a timeline skeleton
    const rail: RailItem[] = [];
    for (let h = 8; h <= 19; h++) {
      rail.push({ kind: 'empty', label: `${String(h).padStart(2, '0')}:00`, key: `empty-${h}` });
    }
    return { allDay, rail };
  }

  // Sort by start time
  timed.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const minHour = Math.min(8, Math.floor(timeToMinutes(timed[0].startTime) / 60));
  const maxHour = Math.max(19, Math.ceil(timeToMinutes(timed[timed.length - 1].endTime) / 60));

  const rail: RailItem[] = [];
  for (let h = minHour; h <= maxHour; h++) {
    const hourStart = h * 60;
    const hourEnd = (h + 1) * 60;
    // Event starting in this hour bucket
    const startingHere = timed.find(e => {
      const s = timeToMinutes(e.startTime);
      return s >= hourStart && s < hourEnd;
    });
    if (startingHere) {
      rail.push({ kind: 'event', label: fmtTime(startingHere.startTime), event: startingHere });
      continue;
    }
    // Hour covered by a previous event's body → skip (visual continuity through the card itself)
    const coveredByPrev = timed.some(e => {
      const s = timeToMinutes(e.startTime);
      const en = timeToMinutes(e.endTime);
      return s <= hourStart && en > hourStart;
    });
    if (coveredByPrev) continue;
    rail.push({ kind: 'empty', label: `${String(h).padStart(2, '0')}:00`, key: `empty-${h}` });
  }
  return { allDay, rail };
};

export const DayView: React.FC<DayViewProps> = ({ selectedDate, events, onEventClick }) => {
  const dayEvents = useMemo(
    () => events.filter(e => isSameDay(e.date, selectedDate))
                .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [events, selectedDate]
  );

  const { allDay, rail } = useMemo(() => buildRail(dayEvents), [dayEvents]);

  // Header stats
  const courses = dayEvents.filter(e => !e.isEvent && e.sessionType !== 'autonomie');
  const autonomies = dayEvents.filter(e => e.sessionType === 'autonomie');
  const examEvents = dayEvents.filter(e => e.isEvent && /examen|partiel|rattrapage/i.test(e.eventTypeLabel || ''));
  const otherEvents = dayEvents.filter(e => e.isEvent && !/examen|partiel|rattrapage/i.test(e.eventTypeLabel || ''));

  const headline: string[] = [];
  if (courses.length) headline.push(`${courses.length} cours`);
  if (autonomies.length) headline.push(`${autonomies.length} autonomie${autonomies.length > 1 ? 's' : ''}`);
  if (examEvents.length) headline.push(`${examEvents.length} examen${examEvents.length > 1 ? 's' : ''}`);
  if (otherEvents.length) headline.push(`${otherEvents.length} événement${otherEvents.length > 1 ? 's' : ''}`);

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <div className="rounded-2xl border border-border/40 bg-card overflow-hidden" data-testid="day-view-redesign">
      {/* HEADER */}
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
        {headline.length > 0 && (
          <p className="text-sm text-muted-foreground mt-1.5" data-testid="day-view-headline">
            {headline.join(' · ')}
          </p>
        )}
      </div>

      {/* ALL-DAY EVENTS BANNER */}
      {allDay.length > 0 && (
        <div className="px-6 pt-4 space-y-2" data-testid="day-view-allday">
          {allDay.map(e => (
            <button
              key={`allday-${e.id}`}
              type="button"
              onClick={() => onEventClick?.(e)}
              className="w-full text-left rounded-xl border border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 transition-colors px-4 py-3 flex items-center gap-3 group"
              data-testid={`day-allday-card-${e.id}`}
            >
              <div className="h-9 w-9 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                <CalendarOff className="h-4 w-4 text-violet-700 dark:text-violet-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                    {e.eventTypeLabel || 'Événement'}
                  </span>
                  <span className="text-[10px] font-medium text-violet-600/70 dark:text-violet-400/70">
                    Toute la journée
                  </span>
                </div>
                <div className="text-sm font-semibold text-foreground truncate mt-0.5">
                  {e.title || e.eventTypeLabel || 'Événement'}
                </div>
                {e.description && (
                  <div className="text-xs text-muted-foreground italic truncate mt-0.5">
                    {e.description}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* TIMELINE RAIL */}
      <div className="px-2 sm:px-4 py-4">
        {rail.length === 0 && allDay.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/40 mb-3">
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Aucun cours ni événement programmé ce jour.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {rail.map((item, idx) => (
              <RailRow key={item.kind === 'event' ? `evt-${item.event.id}` : item.key + idx} item={item} onEventClick={onEventClick} />
            ))}
          </div>
        )}
      </div>

      {/* FOOTER STATS */}
      {dayEvents.length > 0 && (
        <div className="border-t border-border/40 px-6 py-3 flex items-center gap-4 flex-wrap text-xs text-muted-foreground" data-testid="day-view-footer">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Cours : <strong className="text-foreground">{courses.length}</strong></span>
          </span>
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
      )}
    </div>
  );
};

// ─── Sub-components ────────────────────────────────────────────────────────

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
  const isEvt = !!e.isEvent;
  const isAuto = e.sessionType === 'autonomie';
  const accent = e.color || (isEvt ? '#7C3AED' : isAuto ? '#F59E0B' : '#10B981');
  const duration = formatDuration(e.startTime, e.endTime);
  const badgeLabel = getBadgeLabel(e);
  const badgeCls = getBadgeClasses(e);

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
              {isEvt ? (e.title || e.eventTypeLabel || 'Événement') : (isAuto ? 'AUTONOMIE' : e.title)}
            </h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shrink-0 ${badgeCls}`} data-testid={`day-card-badge-${e.id}`}>
              {badgeLabel}
            </span>
          </div>

          {/* Time row */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5" data-testid={`day-card-time-${e.id}`}>
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="tabular-nums">{fmtTime(e.startTime)} → {fmtTime(e.endTime)}</span>
            {duration && <span className="text-muted-foreground/60">· {duration}</span>}
          </div>

          {/* Event type label (events only) */}
          {isEvt && e.eventTypeLabel && (
            <div className="text-xs font-medium text-muted-foreground italic" data-testid={`day-card-evtlabel-${e.id}`}>
              {e.eventTypeLabel}
            </div>
          )}

          {/* Course details (NOT shown for events nor autonomies) */}
          {!isEvt && !isAuto && (
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

          {/* Autonomie hint */}
          {isAuto && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 italic mt-1">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>Travail en autonomie</span>
            </div>
          )}

          {/* Notes */}
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
