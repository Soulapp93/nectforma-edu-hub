
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
    console.log('Récupération des devoirs pour le module:', moduleId);
    const { data, error } = await supabase
      .from('module_assignments')
      .select('*')
      .eq('module_id', moduleId)
      .order('created_at');
    
    if (error) {
      console.error('Erreur lors de la récupération des devoirs:', error);
      throw error;
    }
    console.log('Devoirs récupérés:', data);
    return data;
  },

  async createAssignment(assignment: Database['public']['Tables']['module_assignments']['Insert']) {
    console.log('Création du devoir avec les données:', assignment);
    
    const { data, error } = await supabase
      .from('module_assignments')
      .insert(assignment)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création du devoir:', error);
      throw error;
    }
    
    console.log('Devoir créé avec succès:', data);
    return data;
  },

  async updateAssignment(id: string, updates: Database['public']['Tables']['module_assignments']['Update']) {
    console.log('Mise à jour du devoir:', id, updates);
    
    const { data, error } = await supabase
      .from('module_assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour du devoir:', error);
      throw error;
    }
    
    console.log('Devoir mis à jour avec succès:', data);
    return data;
  },

  async deleteAssignment(id: string) {
    console.log('Suppression du devoir:', id);
    
    const { error } = await supabase
      .from('module_assignments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur lors de la suppression du devoir:', error);
      throw error;
    }
    
    console.log('Devoir supprimé avec succès');
  },

  async addAssignmentFile(file: Database['public']['Tables']['assignment_files']['Insert']) {
    console.log('Ajout de fichier au devoir:', file);
    
    const { data, error } = await supabase
      .from('assignment_files')
      .insert(file)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de l\'ajout du fichier:', error);
      throw error;
    }
    
    console.log('Fichier ajouté avec succès:', data);
    return data;
  },

  async getAssignmentSubmissions(assignmentId: string) {
    console.log('Récupération des soumissions pour le devoir:', assignmentId);
    
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        student:users!assignment_submissions_student_id_fkey(first_name, last_name, email),
        correction:assignment_corrections(*)
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });
    
    if (error) {
      console.error('Erreur lors de la récupération des soumissions:', error);
      throw error;
    }
    
    console.log('Soumissions récupérées:', data);
    return data;
  },

  async submitAssignment(submission: Database['public']['Tables']['assignment_submissions']['Insert']) {
    console.log('Soumission du devoir:', submission);
    
    const { data, error } = await supabase
      .from('assignment_submissions')
      .insert(submission)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la soumission:', error);
      throw error;
    }
    
    console.log('Devoir soumis avec succès:', data);
    return data;
  },

  async addSubmissionFile(file: Database['public']['Tables']['submission_files']['Insert']) {
    console.log('Ajout de fichier à la soumission:', file);
    
    const { data, error } = await supabase
      .from('submission_files')
      .insert(file)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de l\'ajout du fichier de soumission:', error);
      throw error;
    }
    
    console.log('Fichier de soumission ajouté avec succès:', data);
    return data;
  },

  async getSubmissionFiles(submissionId: string) {
    console.log('Récupération des fichiers de soumission:', submissionId);
    
    const { data, error } = await supabase
      .from('submission_files')
      .select('*')
      .eq('submission_id', submissionId);
    
    if (error) {
      console.error('Erreur lors de la récupération des fichiers:', error);
      throw error;
    }
    
    console.log('Fichiers de soumission récupérés:', data);
    return data;
  },

  async correctSubmission(submissionId: string, correction: Omit<Database['public']['Tables']['assignment_corrections']['Insert'], 'submission_id'>) {
    console.log('Correction de la soumission:', submissionId, correction);
    
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

    if (error) {
      console.error('Erreur lors de la correction:', error);
      throw error;
    }
    
    console.log('Correction sauvegardée avec succès:', data);
    return data;
  },

  async publishCorrections(assignmentId: string) {
    console.log('Publication des corrections pour le devoir:', assignmentId);
    
    // Get all submissions for the assignment
    const { data: submissions } = await supabase
      .from('assignment_submissions')
      .select('id')
      .eq('assignment_id', assignmentId);

    if (!submissions) {
      console.log('Aucune soumission trouvée');
      return;
    }

    // Update all corrections to published
    const { error } = await supabase
      .from('assignment_corrections')
      .update({ published_at: new Date().toISOString() })
      .in('submission_id', submissions.map(s => s.id))
      .eq('is_corrected', true);

    if (error) {
      console.error('Erreur lors de la publication des corrections:', error);
      throw error;
    }
    
    console.log('Corrections publiées avec succès');
  }
};
