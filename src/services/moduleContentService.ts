
import { supabase } from '@/integrations/supabase/client';

export interface ModuleContent {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  content_type: 'cours' | 'support' | 'video' | 'document';
  file_url?: string;
  file_name?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const moduleContentService = {
  async getModuleContents(moduleId: string) {
    const { data, error } = await supabase
      .from('module_contents')
      .select('*')
      .eq('module_id', moduleId)
      .order('created_at');
    
    if (error) throw error;
    return data;
  },

  async createContent(content: Omit<ModuleContent, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('module_contents')
      .insert(content)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateContent(id: string, updates: Partial<ModuleContent>) {
    const { data, error } = await supabase
      .from('module_contents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteContent(id: string) {
    const { error } = await supabase
      .from('module_contents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
