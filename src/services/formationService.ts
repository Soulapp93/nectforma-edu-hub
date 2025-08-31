
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
  instructor_id?: string;
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
