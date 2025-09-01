
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'Admin' | 'Formateur' | 'Étudiant';
  status: 'Actif' | 'Inactif' | 'En attente';
  phone?: string;
  created_at: string;
  updated_at: string;
  establishment_id: string;
  is_activated?: boolean;
}

export interface CreateUserData {
  first_name: string;
  last_name: string;
  email: string;
  role: 'Admin' | 'Formateur' | 'Étudiant';
  status: 'Actif' | 'Inactif' | 'En attente';
  phone?: string;
}

export const userService = {
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getUserById(id: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createUser(userData: CreateUserData, formationIds: string[] = []): Promise<User> {
    const { data: establishment } = await supabase
      .from('establishments')
      .select('id')
      .limit(1)
      .single();

    if (!establishment) {
      throw new Error('Aucun établissement trouvé');
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{
        ...userData,
        establishment_id: establishment.id
      }])
      .select()
      .single();

    if (error) throw error;

    // Assigner l'utilisateur aux formations
    if (formationIds.length > 0) {
      const assignments = formationIds.map(formationId => ({
        user_id: data.id,
        formation_id: formationId
      }));

      const { error: assignmentError } = await supabase
        .from('user_formation_assignments')
        .insert(assignments);

      if (assignmentError) {
        console.error('Erreur lors de l\'assignation aux formations:', assignmentError);
      }
    }

    return data;
  },

  async updateUser(id: string, userData: Partial<CreateUserData>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async bulkCreateUsers(usersData: CreateUserData[]): Promise<User[]> {
    const { data: establishment } = await supabase
      .from('establishments')
      .select('id')
      .limit(1)
      .single();

    if (!establishment) {
      throw new Error('Aucun établissement trouvé');
    }

    const usersWithEstablishment = usersData.map(user => ({
      ...user,
      establishment_id: establishment.id
    }));

    const { data, error } = await supabase
      .from('users')
      .insert(usersWithEstablishment)
      .select();

    if (error) throw error;
    return data || [];
  }
};
