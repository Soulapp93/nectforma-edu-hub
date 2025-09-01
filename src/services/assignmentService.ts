
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type Assignment = Database['public']['Tables']['module_assignments']['Row'];
export type AssignmentSubmission = Database['public']['Tables']['assignment_submissions']['Row'] & {
  student?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  correction?: AssignmentCorrection;
};
export type AssignmentCorrection = Database['public']['Tables']['assignment_corrections']['Row'];

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

  async getAssignmentSubmissions(assignmentId: string) {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        student:users (
          first_name,
          last_name,
          email
        ),
        correction:assignment_corrections (*)
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at');
    
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

  async correctSubmission(submissionId: string, correction: Omit<Database['public']['Tables']['assignment_corrections']['Insert'], 'submission_id'>) {
    const { data, error } = await supabase
      .from('assignment_corrections')
      .upsert({
        ...correction,
        submission_id: submissionId,
        corrected_at: new Date().toISOString(),
        is_corrected: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async publishCorrections(assignmentId: string) {
    // Récupérer toutes les soumissions pour ce devoir
    const { data: submissions, error: submissionsError } = await supabase
      .from('assignment_submissions')
      .select('id')
      .eq('assignment_id', assignmentId);

    if (submissionsError) throw submissionsError;

    // Publier toutes les corrections
    const { error } = await supabase
      .from('assignment_corrections')
      .update({ published_at: new Date().toISOString() })
      .in('submission_id', submissions.map(s => s.id))
      .eq('is_corrected', true);

    if (error) throw error;
  }
};
