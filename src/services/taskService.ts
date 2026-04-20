import { supabase } from '@/integrations/supabase/client';

export interface ModuleTask {
  id: string;
  module_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority: 'low' | 'medium' | 'high';
  attachment_url?: string | null;
  attachment_name?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export const taskService = {
  async list(moduleId: string): Promise<ModuleTask[]> {
    const { data, error } = await (supabase as any)
      .from('module_tasks')
      .select('*')
      .eq('module_id', moduleId)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as ModuleTask[];
  },

  async create(payload: Partial<ModuleTask> & { module_id: string; title: string }): Promise<ModuleTask> {
    const { data, error } = await (supabase as any)
      .from('module_tasks')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as ModuleTask;
  },

  async update(id: string, updates: Partial<ModuleTask>): Promise<ModuleTask> {
    const { data, error } = await (supabase as any)
      .from('module_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as ModuleTask;
  },

  async remove(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('module_tasks')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
