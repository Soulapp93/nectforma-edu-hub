// Centralise l'affichage des créneaux pour uniformiser UI + PDF

import type { ScheduleSlot } from '@/services/scheduleService';

export const isAutonomieSession = (sessionType?: string | null) => sessionType === 'autonomie';

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
