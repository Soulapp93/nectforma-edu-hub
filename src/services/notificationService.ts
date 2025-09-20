import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'schedule_update' | 'schedule_published' | 'general';
  is_read: boolean;
  created_at: string;
  metadata?: any;
}

export const notificationService = {
  // Créer une notification
  async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
      throw error;
    }
  },

  // Notifier les utilisateurs d'une formation spécifique
  async notifyFormationUsers(formationId: string, title: string, message: string, type: string) {
    try {
      // Récupérer tous les utilisateurs (étudiants et formateurs) de la formation
      const { data: students, error: studentsError } = await supabase
        .from('user_formation_assignments')
        .select('user_id')
        .eq('formation_id', formationId);

      if (studentsError) throw studentsError;

      const { data: instructors, error: instructorsError } = await supabase
        .from('module_instructors')
        .select('instructor_id')
        .in('module_id', [
          // Récupérer les modules de la formation
          supabase
            .from('formation_modules')
            .select('id')
            .eq('formation_id', formationId)
        ]);

      if (instructorsError) throw instructorsError;

      // Combiner tous les utilisateurs
      const allUsers = [
        ...students.map(s => s.user_id),
        ...instructors.map(i => i.instructor_id)
      ];

      // Créer une notification pour chaque utilisateur unique
      const uniqueUsers = [...new Set(allUsers)];
      
      const notifications = uniqueUsers.map(userId => ({
        user_id: userId,
        title,
        message,
        type,
        metadata: { formation_id: formationId }
      }));

      if (notifications.length > 0) {
        const { error } = await supabase
          .from('notifications')
          .insert(notifications);

        if (error) throw error;
      }

      return { success: true, notified_users: uniqueUsers.length };
    } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications:', error);
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