import { supabase } from '@/integrations/supabase/client';

export const notificationService = {
  // Notifier les utilisateurs d'une formation spécifique via messages
  async notifyFormationUsers(formationId: string, title: string, message: string, type: string) {
    try {
      // Utiliser le système de messages existant pour envoyer une notification
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Créer un message système pour notifier les utilisateurs de la formation
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.user.id,
          subject: title,
          content: message,
          is_draft: false
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Ajouter les destinataires (formation)
      const { error: recipientError } = await supabase
        .from('message_recipients')
        .insert({
          message_id: messageData.id,
          recipient_type: 'formation',
          recipient_id: formationId
        });

      if (recipientError) throw recipientError;

      return { success: true, message_id: messageData.id };
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