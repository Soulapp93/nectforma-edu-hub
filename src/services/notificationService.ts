import { supabase } from '@/integrations/supabase/client';

export const notificationService = {
  // Notifier les utilisateurs d'une formation spécifique
  async notifyFormationUsers(formationId: string, title: string, message: string, type: string, metadata?: any) {
    try {
      // Récupérer tous les utilisateurs assignés à cette formation
      const { data: userAssignments, error: assignError } = await supabase
        .from('user_formation_assignments')
        .select('user_id')
        .eq('formation_id', formationId);

      if (assignError) throw assignError;

      if (!userAssignments || userAssignments.length === 0) {
        return { success: true, notified_users: 0 };
      }

      // Créer une notification pour chaque utilisateur
      const notifications = userAssignments.map(assignment => ({
        user_id: assignment.user_id,
        title,
        message,
        type,
        metadata: metadata || {},
        is_read: false
      }));

      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) throw insertError;

      return { success: true, notified_users: notifications.length };
    } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications:', error);
      throw error;
    }
  },

  // Notifier un utilisateur spécifique
  async notifyUser(userId: string, title: string, message: string, type: string, metadata?: any) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          metadata: metadata || {},
          is_read: false
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
      throw error;
    }
  },

  // Notifier tous les formateurs
  async notifyAllInstructors(title: string, message: string, type: string, metadata?: any) {
    try {
      // Récupérer tous les formateurs
      const { data: instructors, error: instructorError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'Formateur');

      if (instructorError) throw instructorError;

      if (!instructors || instructors.length === 0) {
        return { success: true, notified_users: 0 };
      }

      // Créer une notification pour chaque formateur
      const notifications = instructors.map(instructor => ({
        user_id: instructor.id,
        title,
        message,
        type,
        metadata: metadata || {},
        is_read: false
      }));

      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) throw insertError;

      return { success: true, notified_users: notifications.length };
    } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications aux formateurs:', error);
      throw error;
    }
  },

  // Notifier pour un événement
  async notifyEventParticipants(eventId: string, title: string, message: string, type: string, metadata?: any) {
    try {
      // Récupérer tous les participants à l'événement
      const { data: registrations, error: regError } = await supabase
        .from('event_registrations')
        .select('user_id')
        .eq('event_id', eventId)
        .eq('status', 'Confirmée');

      if (regError) throw regError;

      if (!registrations || registrations.length === 0) {
        return { success: true, notified_users: 0 };
      }

      // Créer une notification pour chaque participant
      const notifications = registrations.map(registration => ({
        user_id: registration.user_id,
        title,
        message,
        type,
        metadata: { ...metadata, event_id: eventId },
        is_read: false
      }));

      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) throw insertError;

      return { success: true, notified_users: notifications.length };
    } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications d\'événement:', error);
      throw error;
    }
  },

  // Récupérer les notifications d'un utilisateur
  async getUserNotifications(userId: string, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      throw error;
    }
  },

  // Marquer une notification comme lue
  async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
      throw error;
    }
  },

  // Marquer toutes les notifications d'un utilisateur comme lues
  async markAllAsRead(userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erreur lors du marquage des notifications:', error);
      throw error;
    }
  }
};