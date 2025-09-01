
import { supabase } from '@/integrations/supabase/client';

export interface Assignment {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  assignment_type: 'devoir' | 'evaluation';
  due_date?: string;
  max_points: number;
  created_by: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_text?: string;
  submitted_at: string;
  updated_at: string;
  student?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  correction?: AssignmentCorrection;
}

export interface AssignmentCorrection {
  id: string;
  submission_id: string;
  corrected_by: string;
  score?: number;
  max_score: number;
  comments?: string;
  is_corrected: boolean;
  corrected_at?: string;
  published_at?: string;
}

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

  async createAssignment(assignment: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) {
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

  async submitAssignment(submission: Omit<AssignmentSubmission, 'id' | 'submitted_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .insert(submission)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async correctSubmission(submissionId: string, correction: Omit<AssignmentCorrection, 'id' | 'submission_id' | 'created_at' | 'updated_at'>) {
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
