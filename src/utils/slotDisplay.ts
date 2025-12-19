// Centralise l'affichage des créneaux pour uniformiser UI + PDF

export const isAutonomieSession = (sessionType?: string | null) => sessionType === 'autonomie';

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
