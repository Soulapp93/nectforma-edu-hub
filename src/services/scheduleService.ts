import { supabase } from '@/integrations/supabase/client';

export interface Schedule {
  id: string;
  formation_id: string;
  title: string;
  academic_year: string;
  status: string;
  created_by?: string;
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
  created_at: string;
  updated_at: string;
  formation_modules?: {
    title: string;
  };
  users?: {
    first_name: string;
    last_name: string;
  };
}

export const scheduleService = {
  // Get all schedules
  async getSchedules(): Promise<Schedule[]> {
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        *,
        formations(title, color)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
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
    return data;
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
    return data;
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
    return data;
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
        users(first_name, last_name)
      `)
      .eq('schedule_id', scheduleId)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Create schedule slot
  async createScheduleSlot(slot: Omit<ScheduleSlot, 'id' | 'created_at' | 'updated_at'>): Promise<ScheduleSlot> {
    const { data, error } = await supabase
      .from('schedule_slots')
      .insert([slot])
      .select(`
        *,
        formation_modules(title),
        users(first_name, last_name)
      `)
      .single();

    if (error) throw error;
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
        users(first_name, last_name)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Delete schedule slot
  async deleteScheduleSlot(id: string): Promise<void> {
    const { error } = await supabase
      .from('schedule_slots')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};