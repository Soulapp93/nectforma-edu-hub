
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type Assignment = Database['public']['Tables']['module_assignments']['Row'];
export type AssignmentSubmission = Database['public']['Tables']['assignment_submissions']['Row'] & {
  student?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  correction?: Database['public']['Tables']['assignment_corrections']['Row'];
};

export const assignmentService = {
  async getModuleAssignments(moduleId: string) {
    const { data, error } = await supabase
      .from('module_assignments')
      .select('*')
      .eq('module_id', moduleId)
      .order('created_at');
    
    if (error) throw error;
    return data;
  },

  async createAssignment(assignment: Database['public']['Tables']['module_assignments']['Insert']) {
    const { data, error } = await supabase
      .from('module_assignments')
      .insert(assignment)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateAssignment(id: string, updates: Database['public']['Tables']['module_assignments']['Update']) {
    const { data, error } = await supabase
      .from('module_assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAssignment(id: string) {
    const { error } = await supabase
      .from('module_assignments')
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
        student:users(first_name, last_name, email),
        correction:assignment_corrections(*)
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
  },

  async addSubmissionFile(file: Database['public']['Tables']['submission_files']['Insert']) {
    const { data, error } = await supabase
      .from('submission_files')
      .insert(file)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSubmissionFiles(submissionId: string) {
    const { data, error } = await supabase
      .from('submission_files')
      .select('*')
      .eq('submission_id', submissionId);
    
    if (error) throw error;
    return data;
  },

  async correctSubmission(submissionId: string, correction: Database['public']['Tables']['assignment_corrections']['Insert']) {
    const { data, error } = await supabase
      .from('assignment_corrections')
      .upsert({
        ...correction,
        submission_id: submissionId,
        is_corrected: true,
        corrected_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async publishCorrections(assignmentId: string) {
    // Get all submissions for the assignment
    const { data: submissions } = await supabase
      .from('assignment_submissions')
      .select('id')
      .eq('assignment_id', assignmentId);

    if (!submissions) return;

    // Update all corrections to published
    const { error } = await supabase
      .from('assignment_corrections')
      .update({ published_at: new Date().toISOString() })
      .in('submission_id', submissions.map(s => s.id))
      .eq('is_corrected', true);

    if (error) throw error;
  }
};
