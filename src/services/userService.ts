
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id?: string;
  establishment_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: 'Admin' | 'Formateur' | 'Étudiant';
  status: 'Actif' | 'Inactif' | 'En attente';
  invitation_sent_at?: string;
  created_at?: string;
  updated_at?: string;
}

export const userService = {
  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
    // Pour l'instant, on utilise le premier établissement trouvé
    const { data: establishment } = await supabase
      .from('establishments')
      .select('id')
      .limit(1)
      .single();

    const { data, error } = await supabase
      .from('users')
      .insert([{
        ...userData,
        establishment_id: establishment?.id
      }])
      .select()
      .single();

    if (error) throw error;

    // Ici on simule l'envoi d'email d'invitation
    console.log(`Email d'invitation envoyé à ${userData.email}`);
    
    return data;
  },

  async updateUser(id: string, userData: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteUser(id: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async bulkCreateUsers(users: Omit<User, 'id' | 'created_at' | 'updated_at'>[]) {
    // Pour l'instant, on utilise le premier établissement trouvé
    const { data: establishment } = await supabase
      .from('establishments')
      .select('id')
      .limit(1)
      .single();

    const usersWithEstablishment = users.map(user => ({
      ...user,
      establishment_id: establishment?.id
    }));

    const { data, error } = await supabase
      .from('users')
      .insert(usersWithEstablishment)
      .select();

    if (error) throw error;

    // Simulation de l'envoi d'emails en masse
    users.forEach(user => {
      console.log(`Email d'invitation envoyé à ${user.email}`);
    });

    return data;
  }
};
