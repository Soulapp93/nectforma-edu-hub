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

  async createFormation(formationData: CreateFormationData) {
    const { data, error } = await supabase
      .from('formations')
      .insert(formationData)
      .select()
      .single();

    if (error) throw error;
    return data;
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
