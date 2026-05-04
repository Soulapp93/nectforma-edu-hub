
import { supabase } from '@/integrations/supabase/client';
import { getAppBaseUrl } from '@/lib/appBaseUrl';
import { retryQuery } from '@/lib/supabaseRetry';
import { retryQuery } from '@/lib/supabaseRetry';
import { logger } from '@/utils/logger';
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'AdminPrincipal' | 'Admin' | 'Formateur' | 'Étudiant' | 'Tuteur';
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
  role: 'AdminPrincipal' | 'Admin' | 'Formateur' | 'Étudiant' | 'Tuteur';
  status: 'Actif' | 'Inactif' | 'En attente';
  phone?: string;
  profile_photo_url?: string;
}

// Helper function to get the current user's establishment_id
async function getCurrentUserEstablishmentId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user?.id) {
    throw new Error('Utilisateur non connecté');
  }

  const { data: userData, error } = await supabase
    .from('users')
    .select('establishment_id')
    .eq('id', session.user.id)
    .single();

  if (error || !userData?.establishment_id) {
    throw new Error('Impossible de récupérer l\'établissement de l\'utilisateur');
  }

  return userData.establishment_id;
}

// NEW: Native Supabase invitation via invite-user-native edge function
async function sendNativeInvitation(
  email: string,
  firstName: string,
  lastName: string,
  role: string,
  establishmentId: string
): Promise<{ success: boolean; user_id?: string; error?: string }> {
  try {
    logger.log(`Envoi invitation native Supabase à ${email}...`);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Session non trouvée');
    }
    
    const { data, error } = await supabase.functions.invoke('invite-user-native', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: {
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        establishment_id: establishmentId,
        redirect_url: getAppBaseUrl(),
      }
    });

    if (error) {
      logger.error('Erreur invitation native:', error);
      return { success: false, error: error.message };
    }
    
    if (data?.error) {
      logger.error('Erreur API invitation:', data.error);
      return { success: false, error: data.error };
    }

    logger.log('✅ Invitation native envoyée:', data);
    return { success: true, user_id: data.user_id };
  } catch (error: any) {
    logger.error('Erreur lors de l\'invitation native:', error);
    return { success: false, error: error.message };
  }
}

// NEW: Native Supabase invitation for tutors via invite-tutor-native edge function
async function inviteTutorNative(
  email: string,
  firstName: string,
  lastName: string,
  phone: string | undefined,
  companyName: string,
  position: string | undefined,
  establishmentId: string,
  studentId?: string
): Promise<{ success: boolean; tutor_id?: string; error?: string; warning?: string }> {
  try {
    logger.log(`[inviteTutorNative] 📧 Début invitation tuteur: ${email} pour étudiant: ${studentId || 'non spécifié'}`);
    logger.log(`[inviteTutorNative] Données: ${JSON.stringify({ email, firstName, lastName, companyName, position, establishmentId })}`);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      logger.error('[inviteTutorNative] ❌ Pas de session active');
      return { success: false, error: 'Session non trouvée - veuillez vous reconnecter' };
    }
    
    logger.log('[inviteTutorNative] ✅ Session trouvée, appel Edge Function...');
    
    const { data, error } = await supabase.functions.invoke('invite-tutor-native', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: {
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        company_name: companyName,
        position,
        establishment_id: establishmentId,
        student_id: studentId,
        redirect_url: getAppBaseUrl(),
      }
    });

    logger.log('[inviteTutorNative] Réponse Edge Function:', JSON.stringify(data), 'Erreur:', error);

    if (error) {
      logger.error('[inviteTutorNative] ❌ Erreur invocation:', error);
      return { success: false, error: error.message };
    }
    
    if (data?.error) {
      logger.error('[inviteTutorNative] ❌ Erreur API:', data.error);
      return { success: false, error: data.error };
    }

    // Vérifier si il y a un warning (email envoyé mais avec problème potentiel)
    if (data?.warning) {
      logger.warn('[inviteTutorNative] ⚠️ Warning:', data.warning);
      return { success: true, tutor_id: data.tutor_id, warning: data.warning };
    }

    logger.log('[inviteTutorNative] ✅ Succès! Tuteur ID:', data.tutor_id, 'Email ID:', data.email_id);
    return { success: true, tutor_id: data.tutor_id };
  } catch (error: any) {
    logger.error('[inviteTutorNative] ❌ Exception:', error);
    return { success: false, error: error.message };
  }
}

// Legacy: send activation email (fallback for existing users)
async function sendLegacyActivationEmail(user: User, establishmentId: string): Promise<void> {
  try {
    logger.log(`Sending legacy activation email to ${user.email}...`);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      logger.error('No session found - cannot send activation email');
      return;
    }
    
    const { data, error } = await supabase.functions.invoke('send-user-activation', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: {
        userId: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        establishmentId: establishmentId
      }
    });

    if (error) {
      logger.error('Error sending activation email:', error);
      throw error;
    }
    
    if (data?.error) {
      logger.error('Activation email API error:', data.error);
      throw new Error(data.error);
    }

    logger.log('Legacy activation email sent successfully:', data);
  } catch (error) {
    logger.error('Failed to send activation email:', error);
  }
}

const RETRY_OPTIONS = {
  maxRetries: 3,
  baseDelayMs: 500,
  onRetry: (attempt: number, err: Error) => {
    logger.warn(`Retry attempt ${attempt} for user service:`, err.message);
  }
};

export const userService = {
  async getUsers(): Promise<User[]> {
    const { data, error } = await retryQuery(
      () => supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false }),
      RETRY_OPTIONS
    );

    if (error) throw new Error(error.message);
    return (data || []) as User[];
  },

  async getUserById(id: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as User;
  },

  async createUser(userData: CreateUserData, formationIds: string[] = [], tutorData?: any): Promise<User> {
    const establishmentId = await getCurrentUserEstablishmentId();
    const normalizedEmail = userData.email.trim().toLowerCase();

    // Check if user already exists in this establishment
    const { data: existingUser, error: existingError } = await supabase
      .from('users')
      .select('*')
      .eq('establishment_id', establishmentId)
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingError && (existingError as any).code !== 'PGRST116') {
      throw existingError;
    }

    if (existingUser) {
      // User exists - assign formations and resend invitation if needed
      if (formationIds.length > 0) {
        const assignments = formationIds.map((formationId) => ({
          user_id: existingUser.id,
          formation_id: formationId,
        }));

        const { error: upsertError } = await supabase
          .from('user_formation_assignments')
          .upsert(assignments, { onConflict: 'user_id,formation_id', ignoreDuplicates: true } as any);

        if (upsertError) {
          logger.error('Erreur lors de l\'assignation des formations (utilisateur existant):', upsertError);
          throw upsertError;
        }
      }

      // Resend invitation if not activated
      if (!existingUser.is_activated) {
        await supabase.functions.invoke('resend-invitation-native', {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: { email: normalizedEmail }
        });
      }

      return existingUser as User;
    }

    // NEW: Use native Supabase invitation - this creates both auth user and users table entry
    const inviteResult = await sendNativeInvitation(
      normalizedEmail,
      userData.first_name,
      userData.last_name,
      userData.role,
      establishmentId
    );

    if (!inviteResult.success || !inviteResult.user_id) {
      throw new Error(inviteResult.error || 'Échec de l\'invitation');
    }

    // Get the created user
    const { data: newUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', inviteResult.user_id)
      .single();

    if (fetchError || !newUser) {
      throw new Error('Utilisateur créé mais impossible de le récupérer');
    }

    // Assign formations
    if (formationIds.length > 0) {
      const assignments = formationIds.map((formationId) => ({
        user_id: newUser.id,
        formation_id: formationId,
      }));

      const { error: assignmentError } = await supabase
        .from('user_formation_assignments')
        .insert(assignments);

      if (assignmentError) throw assignmentError;
    }

    // Handle tutor data for students - Use invite-tutor-native Edge Function
    if (tutorData && userData.role === 'Étudiant') {
      logger.log('[createUser] 👤 Données tuteur détectées, lancement invitation...');
      logger.log('[createUser] tutorData:', JSON.stringify(tutorData));
      
      const tutorResult = await inviteTutorNative(
        tutorData.email,
        tutorData.first_name,
        tutorData.last_name,
        tutorData.phone,
        tutorData.company_name,
        tutorData.position,
        establishmentId,
        newUser.id // student_id pour l'assignation automatique
      );
      
      if (!tutorResult.success) {
        logger.error('[createUser] ❌ Échec invitation tuteur:', tutorResult.error);
        // On ne bloque pas la création de l'étudiant, mais on stocke l'erreur pour l'afficher
        (newUser as any)._tutorInviteError = tutorResult.error;
      } else {
        logger.log('[createUser] ✅ Tuteur invité et assigné:', tutorResult.tutor_id);
        if (tutorResult.warning) {
          logger.warn('[createUser] ⚠️ Warning tuteur:', tutorResult.warning);
          (newUser as any)._tutorInviteWarning = tutorResult.warning;
        }
      }
    } else {
      logger.log('[createUser] Pas de tutorData ou rôle non étudiant, skip invitation tuteur');
    }

    return newUser as User;
  },

  async updateUser(id: string, userData: Partial<CreateUserData>, formationIds?: string[], tutorData?: any): Promise<User> {
    const { role, ...safeUserData } = userData;
    const updateData = role && role !== 'Tuteur' ? { ...safeUserData, role } : safeUserData;
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (formationIds !== undefined) {
      await supabase
        .from('user_formation_assignments')
        .delete()
        .eq('user_id', id);

      if (formationIds.length > 0) {
        const assignments = formationIds.map((formationId) => ({
          user_id: id,
          formation_id: formationId,
        }));

        const { error: assignmentError } = await supabase
          .from('user_formation_assignments')
          .insert(assignments);

        if (assignmentError) throw assignmentError;
      }
    }

    // Handle tutor data for students - Use invite-tutor-native Edge Function
    if (tutorData && data.role === 'Étudiant') {
      logger.log('[updateUser] 👤 Données tuteur détectées, lancement invitation...');
      logger.log('[updateUser] tutorData:', JSON.stringify(tutorData));
      
      const establishmentId = await getCurrentUserEstablishmentId();
      
      const tutorResult = await inviteTutorNative(
        tutorData.email,
        tutorData.first_name,
        tutorData.last_name,
        tutorData.phone,
        tutorData.company_name,
        tutorData.position,
        establishmentId,
        id // student_id pour l'assignation automatique
      );
      
      if (!tutorResult.success) {
        logger.error('[updateUser] ❌ Échec invitation tuteur:', tutorResult.error);
        (data as any)._tutorInviteError = tutorResult.error;
      } else {
        logger.log('[updateUser] ✅ Tuteur invité/mis à jour:', tutorResult.tutor_id);
        if (tutorResult.warning) {
          (data as any)._tutorInviteWarning = tutorResult.warning;
        }
      }
    } else {
      logger.log('[updateUser] Pas de tutorData ou rôle non étudiant, skip invitation tuteur');
    }

    return data as User;
  },

  async getUserFormations(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_formation_assignments')
      .select('formation_id')
      .eq('user_id', userId);

    if (error) {
      logger.error('Erreur lors de la récupération des formations:', error);
      return [];
    }

    return data?.map(d => d.formation_id) || [];
  },

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async bulkCreateUsers(usersData: (CreateUserData & { _formationNames?: string[] })[]): Promise<User[]> {
    const establishmentId = await getCurrentUserEstablishmentId();
    const emails = usersData.map((u) => u.email.trim().toLowerCase());

    const { data: existingUsers, error: existingUsersError } = await supabase
      .from('users')
      .select('id, email, is_activated')
      .in('email', emails);

    if (existingUsersError) throw existingUsersError;

    const existingByEmail = new Map<string, { id: string; is_activated: boolean | null }>();
    (existingUsers || []).forEach((u) => existingByEmail.set(u.email.toLowerCase(), { id: u.id, is_activated: u.is_activated }));

    // Charger toutes les formations de l'établissement pour la résolution des noms
    const { data: allFormations } = await supabase
      .from('formations')
      .select('id, title')
      .eq('establishment_id', establishmentId);

    const formationMap = new Map<string, string>();
    (allFormations || []).forEach((f) => {
      formationMap.set(f.title.toLowerCase().trim(), f.id);
    });

    const results: User[] = [];

    // Créer les nouveaux utilisateurs + (important) assigner formations aux utilisateurs déjà existants
    for (const userData of usersData) {
      try {
        // Résoudre les noms de formations en IDs
        const formationNames = userData._formationNames || [];
        const formationIds: string[] = [];
        
        for (const name of formationNames) {
          const normalizedName = name.toLowerCase().trim();
          // Recherche exacte puis partielle
          let formationId = formationMap.get(normalizedName);
          if (!formationId) {
            // Recherche partielle
            for (const [key, id] of formationMap.entries()) {
              if (key.includes(normalizedName) || normalizedName.includes(key)) {
                formationId = id;
                break;
              }
            }
          }
          if (formationId) {
            formationIds.push(formationId);
          } else {
            logger.warn(`Formation non trouvée: "${name}"`);
          }
        }

        const normalizedEmail = userData.email.trim().toLowerCase();
        const existing = existingByEmail.get(normalizedEmail);

        // Cas 1: utilisateur déjà existant -> on ASSIGNE les formations (upsert), sans recréer le compte
        if (existing) {
          if (formationIds.length > 0) {
            const assignments = formationIds.map((formationId) => ({
              user_id: existing.id,
              formation_id: formationId,
            }));

            const { error: upsertError } = await supabase
              .from('user_formation_assignments')
              .upsert(assignments, { onConflict: 'user_id,formation_id', ignoreDuplicates: true } as any);

            if (upsertError) throw upsertError;
          }

          // Optionnel: si le compte n'est pas activé, on peut renvoyer l'invitation
          if (!existing.is_activated) {
            await supabase.functions.invoke('resend-invitation-native', {
              headers: {
                Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              },
              body: { email: normalizedEmail },
            });
          }

          const refreshed = await this.getUserById(existing.id);
          results.push(refreshed);
          continue;
        }

        // Cas 2: nouvel utilisateur -> création + assignation formations
        const { _formationNames, ...cleanUserData } = userData;
        const created = await this.createUser(cleanUserData, formationIds);
        results.push(created);
      } catch (error) {
        logger.error(`Erreur création utilisateur ${userData.email}:`, error);
      }
    }

    if (results.length === 0) {
      throw new Error("Aucun utilisateur n'a pu être créé ou mis à jour.");
    }

    return results;
  },

  // Resend activation email using native Supabase invitation
  async resendActivationEmail(userId: string): Promise<void> {
    const user = await this.getUserById(userId);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Session non trouvée');
    }

    const { data, error } = await supabase.functions.invoke('resend-invitation-native', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: { email: user.email }
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    logger.log('✅ Invitation renvoyée via Supabase Auth natif');
  }
};
