
import { supabase } from '@/integrations/supabase/client';

export interface Formation {
  id: string;
  title: string;
  description?: string;
  level: string;
  status: string;
  start_date: string;
  end_date: string;
  max_students: number;
  establishment_id: string;
  duration: number;
  price?: number;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFormationData {
  title: string;
  description?: string;
  level: string;
  status: string;
  start_date: string;
  end_date: string;
  max_students: number;
  establishment_id: string;
  duration: number;
  price?: number;
  color?: string;
}

export interface UpdateFormationData {
  title?: string;
  description?: string;
  level?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  max_students?: number;
  duration?: number;
  price?: number;
  color?: string;
}

export const formationService = {
  async getFormations() {
    const { data, error } = await supabase
      .from('formations')
      .select('*')
      .eq('status', 'Actif')
      .order('title');
    
    if (error) throw error;
    return data;
  },

  async getAllFormations() {
    const { data, error } = await supabase
      .from('formations')
      .select(`
        *,
        formation_modules (
          id,
          title,
          duration_hours,
          module_instructors (
            instructor:users (
              id,
              first_name,
              last_name
            )
          )
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getFormationById(id: string) {
    const { data, error } = await supabase
      .from('formations')
      .select(`
        *,
        formation_modules (
          id,
          title,
          description,
          duration_hours,
          order_index,
          module_instructors (
            instructor:users (
              id,
              first_name,
              last_name
            )
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createFormation(formationData: CreateFormationData) {
    const { data, error } = await supabase
      .from('formations')
      .insert(formationData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateFormation(id: string, formationData: UpdateFormationData) {
    const { data, error } = await supabase
      .from('formations')
      .update({
        ...formationData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteFormation(id: string) {
    // D'abord supprimer les modules et leurs instructeurs
    const { error: moduleInstructorsError } = await supabase
      .from('module_instructors')
      .delete()
      .in('module_id', 
        supabase.from('formation_modules').select('id').eq('formation_id', id)
      );

    if (moduleInstructorsError) throw moduleInstructorsError;

    // Supprimer les modules
    const { error: modulesError } = await supabase
      .from('formation_modules')
      .delete()
      .eq('formation_id', id);

    if (modulesError) throw modulesError;

    // Supprimer les assignations d'utilisateurs
    const { error: assignmentsError } = await supabase
      .from('user_formation_assignments')
      .delete()
      .eq('formation_id', id);

    if (assignmentsError) throw assignmentsError;

    // Supprimer les inscriptions d'étudiants
    const { error: enrollmentsError } = await supabase
      .from('student_formations')
      .delete()
      .eq('formation_id', id);

    if (enrollmentsError) throw enrollmentsError;

    // Enfin, supprimer la formation
    const { error } = await supabase
      .from('formations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async assignUserToFormations(userId: string, formationIds: string[]) {
    const assignments = formationIds.map(formationId => ({
      user_id: userId,
      formation_id: formationId
    }));

    const { data, error } = await supabase
      .from('user_formation_assignments')
      .insert(assignments)
      .select();

    if (error) throw error;
    return data;
  }
};
