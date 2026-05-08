// Centralise l'affichage des créneaux pour uniformiser UI + PDF

import type { ScheduleSlot, EventType } from '@/services/scheduleService';
import { EVENT_TYPE_META } from '@/services/scheduleService';

export const isAutonomieSession = (sessionType?: string | null) => sessionType === 'autonomie';

/**
 * A schedule slot is an "event" (not a regular course) when it carries an `event_type`.
 * Events: Congés, Établissement fermé, Jour férié, Portes ouvertes, Autonomie,
 * Examen blanc, Examen final, Partiels, Rattrapage, Autre.
 *
 * Events should NOT show instructor / room / module — they only need to display
 * their type label (and date range).
 */
export const isEventSlot = (slot?: Pick<ScheduleSlot, 'event_type'> | null): boolean => {
  if (!slot) return false;
  return Boolean(slot.event_type);
};

/**
 * Returns the human-readable label for an event slot, or null if the slot is a regular course.
 * Uses EVENT_TYPE_META to ensure consistency across all calendar views.
 */
export const getEventLabel = (slot?: Pick<ScheduleSlot, 'event_type'> | null): string | null => {
  if (!isEventSlot(slot)) return null;
  const type = slot!.event_type as EventType;
  return EVENT_TYPE_META[type]?.label || 'Événement';
};

/**
 * Returns the colour to use for the slot card.
 * For events: uses the EVENT_TYPE_META colour; for courses: caller decides.
 */
export const getEventColor = (slot?: Pick<ScheduleSlot, 'event_type'> | null): string | null => {
  if (!isEventSlot(slot)) return null;
  const type = slot!.event_type as EventType;
  return EVENT_TYPE_META[type]?.color || '#64748B';
};

/**
 * Détection robuste du créneau "autonomie".
 * - Si session_type est explicitement "autonomie" → autonomie
 * - Sinon, si aucun module n'est rattaché (module_id null) → on considère autonomie (cas des créneaux sans module)
 */
export const isAutonomieSlot = (slot?: Pick<ScheduleSlot, 'session_type' | 'module_id'> | null) => {
  if (!slot) return false;
  if (isAutonomieSession(slot.session_type)) return true;
  return !slot.session_type && !slot.module_id;
};

export const formatHHmm = (time?: string | null) => {
  if (!time) return '';
  // supporte HH:mm et HH:mm:ss
  const [h, m] = time.split(':');
  return `${h}:${m}`;
};

export const formatTimeRange = (start?: string | null, end?: string | null) => {
  const s = formatHHmm(start);
  const e = formatHHmm(end);
  if (!s && !e) return '';
  if (!e) return s;
  return `${s} - ${e}`;
};

/**
 * Extrait le titre du module depuis les notes (format: "Nom du module - Formateur")
 */
export const extractModuleFromNotes = (notes?: string | null): string | null => {
  if (!notes) return null;
  // Les notes sont au format "Module - Formateur" ou juste "Module"
  const parts = notes.split(' - ');
  return parts[0]?.trim() || null;
};

/**
 * Extrait le nom du formateur depuis les notes (format: "Nom du module - Formateur")
 */
export const extractInstructorFromNotes = (notes?: string | null): string | null => {
  if (!notes) return null;
  const parts = notes.split(' - ');
  return parts.length > 1 ? parts.slice(1).join(' - ').trim() : null;
};

/**
 * Obtient le titre du module de façon robuste :
 * 1. Si le slot a un module lié → utilise formation_modules.title
 * 2. Sinon, extrait le nom du module depuis les notes
 * 3. Sinon, retourne le fallback par défaut
 */
export const getSlotModuleTitle = (
  slot: Pick<ScheduleSlot, 'session_type' | 'formation_modules' | 'notes'>,
  fallback: string = 'Module non défini'
): string => {
  // Si c'est un créneau autonomie
  if (isAutonomieSession(slot.session_type)) {
    return 'AUTONOMIE';
  }
  
  // Si le module est lié dans la base de données
  if (slot.formation_modules?.title) {
    return slot.formation_modules.title;
  }
  
  // Sinon, essayer d'extraire depuis les notes
  const moduleFromNotes = extractModuleFromNotes(slot.notes);
  if (moduleFromNotes) {
    return moduleFromNotes;
  }
  
  return fallback;
};

/**
 * Obtient le nom de l'instructeur de façon robuste :
 * 1. Si le slot a un instructeur lié → utilise users.first_name + last_name
 * 2. Sinon, extrait le nom du formateur depuis les notes
 * 3. Sinon, retourne le fallback par défaut
 */
export const getSlotInstructorName = (
  slot: Pick<ScheduleSlot, 'users' | 'notes'>,
  fallback: string = 'Instructeur non défini'
): string => {
  // Si l'instructeur est lié dans la base de données
  if (slot.users?.first_name || slot.users?.last_name) {
    return `${slot.users.first_name || ''} ${slot.users.last_name || ''}`.trim();
  }
  
  // Sinon, essayer d'extraire depuis les notes
  const instructorFromNotes = extractInstructorFromNotes(slot.notes);
  if (instructorFromNotes) {
    return instructorFromNotes;
  }
  
  return fallback;
};
