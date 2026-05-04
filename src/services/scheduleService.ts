import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { retryQuery } from '@/lib/supabaseRetry';

export interface Schedule {
  id: string;
  formation_id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  formations?: {
    title: string;
    color: string;
  };
}

export interface ScheduleSlot {
  id: string;
  schedule_id: string;
  module_id?: string;
  instructor_id?: string;
  date: string;
  start_time: string;
  end_time: string;
  room?: string;
  color?: string;
  notes?: string;
  session_type?: string; // legacy - kept for compat. New slots are always 'encadree'.
  // --- New fields (2026-04-20) ---
  slot_kind?: 'course' | 'event';
  event_type?: EventType | null;
  event_label?: string | null;
  event_scope?: 'formation' | 'establishment';
  is_cancelled?: boolean;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  all_day?: boolean;
  // --- Joined relations ---
  created_at: string;
  updated_at: string;
  formation_modules?: {
    title: string;
  };
  users?: {
    first_name: string;
    last_name: string;
  };
  schedules?: {
    id: string;
    formation_id: string;
    title: string;
    formations?: {
      title: string;
      color: string;
    };
  };
}

export type EventType =
  | 'holiday'
  | 'closed'
  | 'public_holiday'
  | 'open_day'
  | 'autonomy'
  | 'mock_exam'
  | 'final_exam'
  | 'midterm'
  | 'makeup'
  | 'custom';

export const EVENT_TYPE_META: Record<EventType, { label: string; color: string; icon: string }> = {
  holiday:        { label: 'Congés',              color: '#10B981', icon: 'Palmtree' },
  closed:         { label: 'Établissement fermé', color: '#6B7280', icon: 'Lock' },
  public_holiday: { label: 'Jour férié',          color: '#EF4444', icon: 'Flag' },
  open_day:       { label: 'Portes ouvertes',     color: '#F59E0B', icon: 'DoorOpen' },
  autonomy:       { label: 'Autonomie',           color: '#3B82F6', icon: 'BookOpen' },
  mock_exam:      { label: 'Examen blanc',        color: '#8B5CF6', icon: 'FileText' },
  final_exam:     { label: 'Examen final',        color: '#DC2626', icon: 'GraduationCap' },
  midterm:        { label: 'Partiels',            color: '#EC4899', icon: 'FileCheck' },
  makeup:         { label: 'Rattrapage',          color: '#F97316', icon: 'RefreshCw' },
  custom:         { label: 'Autre',               color: '#64748B', icon: 'Sparkles' },
};

const RETRY_OPTIONS = {
  maxRetries: 3,
  baseDelayMs: 500,
  onRetry: (attempt: number, err: Error) => {
    logger.warn(`Retry attempt ${attempt} for schedule service:`, err.message);
  }
};

export const scheduleService = {
  // Get all schedules
  async getSchedules(): Promise<Schedule[]> {
    const { data, error } = await retryQuery(
      () => supabase
        .from('schedules')
        .select(`
          *,
          formations(title, color)
        `)
        .order('created_at', { ascending: false }),
      RETRY_OPTIONS
    );

    if (error) throw new Error(error.message);
    return (data || []) as Schedule[];
  },

  // Get schedule by ID
  async getScheduleById(id: string): Promise<Schedule | null> {
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        *,
        formations(title, color)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Schedule;
  },

  // Create new schedule
  async createSchedule(schedule: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .insert([schedule])
      .select(`
        *,
        formations(title, color)
      `)
      .single();

    if (error) throw error;
    return data as Schedule;
  },

  // Update schedule
  async updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        formations(title, color)
      `)
      .single();

    if (error) throw error;
    return data as Schedule;
  },

  // Delete schedule
  async deleteSchedule(id: string): Promise<void> {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get schedule slots
  async getScheduleSlots(scheduleId: string): Promise<ScheduleSlot[]> {
    const { data, error } = await supabase
      .from('schedule_slots')
      .select(`
        *,
        formation_modules(title),
        users!schedule_slots_instructor_id_fkey(first_name, last_name)
      `)
      .eq('schedule_id', scheduleId)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return (data || []) as ScheduleSlot[];
  },

  // Create schedule slot
  async createScheduleSlot(slot: Omit<ScheduleSlot, 'id' | 'created_at' | 'updated_at'>): Promise<ScheduleSlot> {
    const { data, error } = await supabase
      .from('schedule_slots')
      .insert([slot])
      .select(`
        *,
        formation_modules(title),
        users!schedule_slots_instructor_id_fkey(first_name, last_name)
      `)
      .single();

    if (error) throw error;

    // Get formation_id for notification
    const { data: schedule } = await supabase
      .from('schedules')
      .select('formation_id')
      .eq('id', slot.schedule_id)
      .single();

    // Send notification (fire and forget)
    if (schedule?.formation_id && data) {
      import('./notificationService').then(({ notificationService }) => {
        const moduleName = (data as any).formation_modules?.title || 'Cours';
        const instructorName = (data as any).users 
          ? `${(data as any).users.first_name} ${(data as any).users.last_name}`
          : undefined;
        notificationService.notifyScheduleSlotCreated(
          schedule.formation_id,
          moduleName,
          slot.date,
          slot.start_time,
          slot.end_time,
          instructorName
        ).catch((e) => logger.error(e));
      });
    }

    return data;
  },

  // Update schedule slot
  async updateScheduleSlot(id: string, updates: Partial<ScheduleSlot>): Promise<ScheduleSlot> {
    const { data, error } = await supabase
      .from('schedule_slots')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        formation_modules(title),
        users!schedule_slots_instructor_id_fkey(first_name, last_name)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Delete schedule slot
  async deleteScheduleSlot(id: string, formationId?: string, moduleName?: string, date?: string, startTime?: string): Promise<void> {
    const { error } = await supabase
      .from('schedule_slots')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Send cancellation notification if info provided
    if (formationId && moduleName && date && startTime) {
      import('./notificationService').then(({ notificationService }) => {
        notificationService.notifyScheduleSlotCancelled(formationId, moduleName, date, startTime)
          .catch((e) => logger.error(e));
      });
    }
  },

  // Cancel a course (soft cancel - keeps the slot visible but marked as cancelled)
  async cancelScheduleSlot(id: string, reason: string, userId: string): Promise<ScheduleSlot> {
    const { data, error } = await (supabase as any)
      .from('schedule_slots')
      .update({
        is_cancelled: true,
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
        cancelled_by: userId,
      })
      .eq('id', id)
      .select(`*, formation_modules(title), users!schedule_slots_instructor_id_fkey(first_name, last_name)`)
      .single();
    if (error) throw error;
    return data;
  },

  // Restore a previously cancelled course
  async restoreScheduleSlot(id: string): Promise<ScheduleSlot> {
    const { data, error } = await (supabase as any)
      .from('schedule_slots')
      .update({
        is_cancelled: false,
        cancellation_reason: null,
        cancelled_at: null,
        cancelled_by: null,
      })
      .eq('id', id)
      .select(`*, formation_modules(title), users!schedule_slots_instructor_id_fkey(first_name, last_name)`)
      .single();
    if (error) throw error;
    return data;
  },

  // Create a non-course event (holiday, closed, exams, etc.)
  async createScheduleEvent(payload: {
    schedule_id: string;
    event_type: EventType;
    event_label?: string;
    event_scope: 'formation' | 'establishment';
    date: string;              // start date (single day or range start)
    end_date?: string;         // optional range end (inclusive)
    start_time?: string;
    end_time?: string;
    all_day: boolean;
    color?: string;
    notes?: string;
  }): Promise<ScheduleSlot[]> {
    // Build one row per day (inclusive)
    const startD = new Date(payload.date);
    const endD = payload.end_date ? new Date(payload.end_date) : startD;
    if (endD < startD) {
      throw new Error('La date de fin doit etre posterieure a la date de debut');
    }

    const rows: any[] = [];
    const cur = new Date(startD);
    while (cur <= endD) {
      rows.push({
        schedule_id: payload.schedule_id,
        slot_kind: 'event',
        event_type: payload.event_type,
        event_label: payload.event_label || null,
        event_scope: payload.event_scope,
        date: cur.toISOString().split('T')[0],
        start_time: payload.all_day ? '00:00' : (payload.start_time || '09:00'),
        end_time:   payload.all_day ? '23:59' : (payload.end_time   || '17:00'),
        all_day: payload.all_day,
        color: payload.color || null,
        notes: payload.notes || null,
        session_type: 'encadree', // legacy field, keep non-null
      });
      cur.setDate(cur.getDate() + 1);
    }

    const { data, error } = await (supabase as any)
      .from('schedule_slots')
      .insert(rows)
      .select('*');
    if (error) throw error;
    return data || [];
  },

  // Get published schedules for student by formation IDs
  async getStudentSchedules(formationIds: string[]): Promise<ScheduleSlot[]> {
    if (!formationIds || formationIds.length === 0) return [];

    const { data, error } = await supabase
      .from('schedule_slots')
      .select(`
        *,
        formation_modules(title),
        users!schedule_slots_instructor_id_fkey(first_name, last_name),
        schedules!inner(
          id,
          formation_id,
          title,
          formations(title, color)
        )
      `)
      .in('schedules.formation_id', formationIds)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get published schedules for instructor
  async getInstructorSchedules(instructorId: string): Promise<ScheduleSlot[]> {
    const { data, error } = await supabase
      .from('schedule_slots')
      .select(`
        *,
        formation_modules(title),
        users!schedule_slots_instructor_id_fkey(first_name, last_name),
        schedules!inner(
          id,
          formation_id,
          title,
          formations(title, color)
        )
      `)
      .eq('instructor_id', instructorId)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get all published schedules (for testing when user has no formations)
  async getAllPublishedSchedules(): Promise<ScheduleSlot[]> {
    const { data, error } = await supabase
      .from('schedule_slots')
      .select(`
        *,
        formation_modules(title),
        users!schedule_slots_instructor_id_fkey(first_name, last_name),
        schedules!inner(
          id,
          formation_id,
          title,
          formations(title, color)
        )
      `)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
