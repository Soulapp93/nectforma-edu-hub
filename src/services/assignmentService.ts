
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type Assignment = Database['public']['Tables']['assignments']['Row'];
export type AssignmentSubmission = Database['public']['Tables']['assignment_submissions']['Row'];

export const assignmentService = {
  async getModuleAssignments(moduleId: string) {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('module_id', moduleId)
      .order('created_at');
    
    if (error) throw error;
    return data;
  },

  async createAssignment(assignment: Database['public']['Tables']['assignments']['Insert']) {
    const { data, error } = await supabase
      .from('assignments')
      .insert(assignment)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateAssignment(id: string, updates: Database['public']['Tables']['assignments']['Update']) {
    const { data, error } = await supabase
      .from('assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAssignment(id: string) {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async addAssignmentFile(file: Database['public']['Tables']['assignment_files']['Insert']) {
    const { data, error } = await supabase
      .from('assignment_files')
      .insert(file)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAssignmentSubmissions(assignmentId: string) {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        student:users(first_name, last_name, email)
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async submitAssignment(submission: Database['public']['Tables']['assignment_submissions']['Insert']) {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .insert(submission)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
