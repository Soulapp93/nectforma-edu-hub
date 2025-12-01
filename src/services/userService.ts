
import { supabase } from '@/integrations/supabase/client';
import { activationService } from './activationService';

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
  profile_photo_url?: string;
}

export interface CreateUserData {
  first_name: string;
  last_name: string;
  email: string;
  role: 'Admin' | 'Formateur' | 'Étudiant';
  status: 'Actif' | 'Inactif' | 'En attente';
  phone?: string;
  profile_photo_url?: string;
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

  async createUser(userData: CreateUserData, formationIds: string[] = [], tutorData?: any): Promise<User> {
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

    // Si des données de tuteur sont fournies et que l'utilisateur est un étudiant, créer le tuteur
    if (tutorData && userData.role === 'Étudiant') {
      try {
        // Créer le tuteur
        const tutorCreateData = {
          first_name: tutorData.first_name,
          last_name: tutorData.last_name,
          email: tutorData.email,
          phone: tutorData.phone,
          company_name: tutorData.company_name,
          company_address: tutorData.company_address,
          position: tutorData.position,
          establishment_id: establishment.id
        };

        const { data: tutor, error: tutorError } = await supabase
          .from('tutors')
          .insert([tutorCreateData])
          .select()
          .single();

        if (tutorError) throw tutorError;

        // Créer l'assignation tuteur-étudiant
        const assignmentData = {
          tutor_id: tutor.id,
          student_id: data.id,
          contract_type: tutorData.contract_type,
          contract_start_date: tutorData.contract_start_date,
          contract_end_date: tutorData.contract_end_date
        };

        const { error: assignmentError } = await supabase
          .from('tutor_student_assignments')
          .insert([assignmentData]);

        if (assignmentError) {
          console.error('Erreur lors de l\'assignation tuteur-étudiant:', assignmentError);
        }

        // Envoyer l'email d'activation au tuteur
        try {
          await activationService.sendActivationEmail(
            tutorData.email,
            'tutor-activation-token', // Temporaire, doit être généré
            tutorData.first_name,
            tutorData.last_name
          );
        } catch (emailError) {
          console.error('Erreur lors de l\'envoi de l\'email au tuteur:', emailError);
        }
      } catch (tutorError) {
        console.error('Erreur lors de la création du tuteur:', tutorError);
        // On continue même si la création du tuteur échoue
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

    // Éviter les doublons d'emails pour ne pas faire échouer tout l'import
    const emails = usersData.map((u) => u.email);

    const { data: existingUsers, error: existingError } = await supabase
      .from('users')
      .select('id, email')
      .in('email', emails);

    if (existingError) {
      console.error('Erreur lors de la vérification des emails existants:', existingError);
    }

    const existingEmailSet = new Set((existingUsers || []).map((u) => u.email));

    const usersToInsert = usersData.filter((u) => !existingEmailSet.has(u.email));

    if (usersToInsert.length === 0) {
      throw new Error("Aucun utilisateur importé : tous les emails du fichier existent déjà dans la base.");
    }

    const usersWithEstablishment = usersToInsert.map((user) => ({
      ...user,
      establishment_id: establishment.id,
    }));

    const { data, error } = await supabase
      .from('users')
      .insert(usersWithEstablishment)
      .select();

    if (error) throw error;
    return data || [];
  }
};
