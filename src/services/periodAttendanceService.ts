/**
 * Period attendance helper.
 *
 * Aggregates a student's lateness + injustified absences from the
 * `attendance_sheets` + `attendance_signatures` tables, filtered by a
 * specific period's date range. For combined periods, caller can pass
 * multiple date ranges (source periods) and their counts are summed.
 */
import { supabase } from '@/integrations/supabase/client';

export interface PeriodAttendance {
  /** Count of injustified absences (absent + reason='injustifié' OR no reason) */
  absences_injustifiees: number;
  /** Count of any absences (present=false, any reason) */
  absences_total: number;
  /** Count of lateness (late arrivals — tracked via absence_reason_type='retard' if available, else 0) */
  retards: number;
  /** Total attendance records observed */
  total_sheets: number;
}

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;
}

/**
 * Compute attendance for a student over one or multiple date ranges
 * (for combined periods, pass all source periods' date ranges — they're summed).
 */
export async function getStudentAttendanceForRanges(
  studentId: string,
  formationId: string,
  ranges: DateRange[],
): Promise<PeriodAttendance> {
  const empty: PeriodAttendance = {
    absences_injustifiees: 0,
    absences_total: 0,
    retards: 0,
    total_sheets: 0,
  };
  if (!studentId || !formationId || ranges.length === 0) return empty;

  // 1. Load all attendance sheets of the formation within any of the ranges
  const orFilters = ranges
    .map((r) => `and(date.gte.${r.start},date.lte.${r.end})`)
    .join(',');

  const { data: sheets, error: sheetErr } = await supabase
    .from('attendance_sheets')
    .select('id, date')
    .eq('formation_id', formationId)
    .or(orFilters);
  if (sheetErr || !sheets || sheets.length === 0) return empty;

  const sheetIds = sheets.map((s: any) => s.id);

  // 2. Load the student's signatures for these sheets
  const { data: signatures } = await supabase
    .from('attendance_signatures')
    .select('id, attendance_sheet_id, present, absence_reason_type')
    .eq('user_id', studentId)
    .in('attendance_sheet_id', sheetIds);

  if (!signatures || signatures.length === 0) {
    // Student was on every sheet but never signed -> count all as injustified absences
    return {
      absences_injustifiees: sheets.length,
      absences_total: sheets.length,
      retards: 0,
      total_sheets: sheets.length,
    };
  }

  let absTotal = 0;
  let absInjust = 0;
  let retards = 0;
  const signedIds = new Set<string>();

  for (const sig of signatures) {
    signedIds.add(sig.attendance_sheet_id as string);
    const reason = (sig as any).absence_reason_type as string | null;
    if (!sig.present) {
      absTotal++;
      if (!reason || reason === 'injustifié' || reason === 'autre') absInjust++;
    }
    // "Retard" is stored as a distinct absence_reason_type when the student
    // arrived late — count separately (and not as an absence).
    if ((reason as any) === 'retard') retards++;
  }

  // Sheets where the student had no signature row at all => injustified absence
  const missing = sheets.filter((s: any) => !signedIds.has(s.id)).length;
  absTotal += missing;
  absInjust += missing;

  return {
    absences_injustifiees: absInjust,
    absences_total: absTotal,
    retards,
    total_sheets: sheets.length,
  };
}
