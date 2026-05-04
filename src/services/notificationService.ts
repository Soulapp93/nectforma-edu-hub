import { supabase } from '@/integrations/supabase/client';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
// Type helper for database operations on non-typed tables
const db = supabase as any;

export type NotificationType = 
  | 'message'
  | 'assignment'
  | 'correction'
  | 'attendance'
  | 'attendance_open'
  | 'attendance_reminder'
  | 'schedule_published'
  | 'schedule_update'
  | 'schedule_slot_created'
  | 'schedule_slot_cancelled'
  | 'event'
  | 'formation'
  | 'reminder'
  | 'system'
  | 'general'
  | 'textbook_reminder'
  | 'virtual_class';

export interface NotificationMetadata {
  message_id?: string;
  assignment_id?: string;
  module_id?: string;
  due_date?: string;
  attendance_sheet_id?: string;
  formation_id?: string;
  schedule_id?: string;
  event_id?: string;
  slot_id?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  instructor_name?: string;
  formation_title?: string;
  module_title?: string;
  action_url?: string;
  [key: string]: any;
}

export const notificationService = {
  // ============================================
  // CORE NOTIFICATION FUNCTIONS
  // ============================================

  /**
   * Notifier un utilisateur spécifique
   */
  async notifyUser(
    userId: string, 
    title: string, 
    message: string, 
    type: NotificationType, 
    metadata?: NotificationMetadata
  ) {
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
      logger.error('Erreur lors de l\'envoi de la notification:', error);
      throw error;
    }
  },

  /**
   * Notifier plusieurs utilisateurs
   */
  async notifyUsers(
    userIds: string[], 
    title: string, 
    message: string, 
    type: NotificationType, 
    metadata?: NotificationMetadata
  ) {
    try {
      if (!userIds || userIds.length === 0) {
        return { success: true, notified_users: 0 };
      }

      const notifications = userIds.map(userId => ({
        user_id: userId,
        title,
        message,
        type,
        metadata: metadata || {},
        is_read: false
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;
      return { success: true, notified_users: notifications.length };
    } catch (error) {
      logger.error('Erreur lors de l\'envoi des notifications:', error);
      throw error;
    }
  },

  /**
   * Notifier les utilisateurs d'une formation spécifique
   */
  async notifyFormationUsers(
    formationId: string, 
    title: string, 
    message: string, 
    type: NotificationType, 
    metadata?: NotificationMetadata
  ) {
    try {
      const { data: userAssignments, error: assignError } = await supabase
        .from('user_formation_assignments')
        .select('user_id')
        .eq('formation_id', formationId);

      if (assignError) throw assignError;

      if (!userAssignments || userAssignments.length === 0) {
        return { success: true, notified_users: 0 };
      }

      const userIds = userAssignments.map(a => a.user_id);
      return this.notifyUsers(userIds, title, message, type, {
        ...metadata,
        formation_id: formationId
      });
    } catch (error) {
      logger.error('Erreur lors de l\'envoi des notifications:', error);
      throw error;
    }
  },

  /**
   * Notifier tous les formateurs de l'établissement
   */
  async notifyAllInstructors(
    title: string, 
    message: string, 
    type: NotificationType, 
    metadata?: NotificationMetadata
  ) {
    try {
      const { data: instructors, error: instructorError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'Formateur');

      if (instructorError) throw instructorError;

      if (!instructors || instructors.length === 0) {
        return { success: true, notified_users: 0 };
      }

      const instructorIds = instructors.map(i => i.id);
      return this.notifyUsers(instructorIds, title, message, type, metadata);
    } catch (error) {
      logger.error('Erreur lors de l\'envoi des notifications aux formateurs:', error);
      throw error;
    }
  },

  /**
   * Notifier tous les administrateurs
   */
  async notifyAllAdmins(
    title: string, 
    message: string, 
    type: NotificationType, 
    metadata?: NotificationMetadata
  ) {
    try {
      const { data: admins, error } = await supabase
        .from('users')
        .select('id')
        .in('role', ['Admin', 'AdminPrincipal']);

      if (error) throw error;

      if (!admins || admins.length === 0) {
        return { success: true, notified_users: 0 };
      }

      const adminIds = admins.map(a => a.id);
      return this.notifyUsers(adminIds, title, message, type, metadata);
    } catch (error) {
      logger.error('Erreur lors de l\'envoi des notifications aux admins:', error);
      throw error;
    }
  },

  // ============================================
  // MESSAGE NOTIFICATIONS
  // ============================================

  async notifyNewMessage(
    recipientIds: string[],
    senderName: string,
    subject: string,
    messageId: string
  ) {
    return this.notifyUsers(
      recipientIds,
      '📩 Nouveau message',
      `${senderName} vous a envoyé un message: "${subject}"`,
      'message',
      { 
        message_id: messageId,
        action_url: '/messagerie'
      }
    );
  },

  // ============================================
  // ASSIGNMENT NOTIFICATIONS
  // ============================================

  async notifyAssignmentCreated(
    formationId: string,
    assignmentTitle: string,
    assignmentId: string,
    moduleId: string,
    dueDate?: string
  ) {
    const dueDateText = dueDate 
      ? ` À rendre avant le ${new Date(dueDate).toLocaleDateString('fr-FR')}.`
      : '';
    
    return this.notifyFormationUsers(
      formationId,
      '📝 Nouveau devoir',
      `Un nouveau devoir "${assignmentTitle}" a été publié.${dueDateText}`,
      'assignment',
      {
        assignment_id: assignmentId,
        module_id: moduleId,
        due_date: dueDate,
        action_url: `/formations`
      }
    );
  },

  async notifyCorrectionPublished(
    studentId: string,
    assignmentTitle: string,
    assignmentId: string,
    moduleId: string,
    grade?: number,
    maxPoints?: number
  ) {
    const gradeText = grade !== undefined && maxPoints !== undefined
      ? ` Note: ${grade}/${maxPoints}`
      : '';

    return this.notifyUser(
      studentId,
      '✅ Correction disponible',
      `La correction de votre devoir "${assignmentTitle}" est disponible.${gradeText}`,
      'correction',
      {
        assignment_id: assignmentId,
        module_id: moduleId,
        action_url: `/formations`
      }
    );
  },

  async notifySubmissionReceived(
    instructorId: string,
    studentName: string,
    assignmentTitle: string,
    assignmentId: string,
    moduleId: string
  ) {
    return this.notifyUser(
      instructorId,
      '📥 Devoir reçu',
      `${studentName} a rendu le devoir "${assignmentTitle}".`,
      'assignment',
      {
        assignment_id: assignmentId,
        module_id: moduleId,
        action_url: `/formations`
      }
    );
  },

  /**
   * Notifier les étudiants d'un nouveau travail à faire
   * (in-app + email via Brevo)
   */
  async notifyTaskCreated(
    moduleId: string,
    taskId: string,
    taskTitle: string,
    dueDate?: string | null,
    priority?: 'low' | 'medium' | 'high'
  ) {
    try {
      // 1. Resolve formation_id from module
      const { data: moduleRow, error: moduleErr } = await db
        .from('formation_modules')
        .select('formation_id, title')
        .eq('id', moduleId)
        .single();
      if (moduleErr || !moduleRow) throw moduleErr || new Error('Module introuvable');
      const formationId = moduleRow.formation_id as string;
      const moduleTitle = moduleRow.title as string;

      // 2. Get student user IDs (only Étudiant role) assigned to the formation
      const { data: assignments, error: assignErr } = await db
        .from('user_formation_assignments')
        .select('user_id, users!inner(id, email, first_name, last_name, role)')
        .eq('formation_id', formationId);
      if (assignErr) throw assignErr;

      const students = (assignments || [])
        .map((a: any) => a.users)
        .filter((u: any) => u && u.role === 'Étudiant');

      if (students.length === 0) {
        return { success: true, notified_users: 0, emails_sent: 0 };
      }

      const studentIds = students.map((u: any) => u.id);

      // 3. Compose labels
      const priorityLabel =
        priority === 'high' ? '🔴 Priorité haute'
        : priority === 'low' ? '🟢 Priorité basse'
        : '🟡 Priorité moyenne';
      const dueDateText = dueDate
        ? ` À faire avant le ${new Date(dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}.`
        : '';

      // 4. In-app notifications (bulk insert)
      await this.notifyUsers(
        studentIds,
        '📌 Nouveau travail à faire',
        `${moduleTitle} — "${taskTitle}".${dueDateText}`,
        'assignment',
        {
          task_id: taskId,
          module_id: moduleId,
          formation_id: formationId,
          due_date: dueDate || undefined,
          module_title: moduleTitle,
          priority,
          action_url: `/formations`,
        } as NotificationMetadata
      );

      // 5. Email notifications (fire-and-forget, best effort)
      try {
        const subject = `Nouveau travail à faire — ${moduleTitle}`;
        const title = `Nouveau travail : ${taskTitle}`;
        const message = `Votre formateur a publié un nouveau travail dans le module <strong>${moduleTitle}</strong>.<br/><br/><strong>${taskTitle}</strong><br/>${dueDateText ? dueDateText + ' ' : ''}${priorityLabel}`;
        await db.functions.invoke('send-notification-emails', {
          body: {
            type: 'bulk_notification',
            userIds: studentIds,
            notificationData: {
              subject,
              title,
              message,
              ctaText: 'Voir le module',
              ctaUrl: '/formations',
            },
          },
        });
      } catch (e) {
        logger.warn('Email notification (task) failed:', e);
      }

      return { success: true, notified_users: studentIds.length };
    } catch (error) {
      logger.error('Erreur notifyTaskCreated:', error);
      // Do not throw - we do not want to block the task creation if the notification fails
      return { success: false, error };
    }
  },

  // ============================================
  // ATTENDANCE NOTIFICATIONS
  // ============================================

  async notifyAttendanceOpen(
    formationId: string,
    sheetTitle: string,
    sheetId: string,
    date: string,
    startTime: string,
    endTime: string
  ) {
    return this.notifyFormationUsers(
      formationId,
      '📋 Émargement ouvert',
      `L'émargement pour "${sheetTitle}" est maintenant ouvert. Veuillez signer votre présence.`,
      'attendance_open',
      {
        attendance_sheet_id: sheetId,
        date,
        start_time: startTime,
        end_time: endTime,
        action_url: '/emargement'
      }
    );
  },

  async notifyAttendanceReminder(
    userId: string,
    sheetTitle: string,
    sheetId: string
  ) {
    return this.notifyUser(
      userId,
      '⏰ Rappel émargement',
      `N'oubliez pas de signer votre présence pour "${sheetTitle}".`,
      'attendance_reminder',
      {
        attendance_sheet_id: sheetId,
        action_url: '/emargement'
      }
    );
  },

  async notifyAttendanceValidated(
    formationId: string,
    sheetTitle: string,
    sheetId: string,
    date: string
  ) {
    return this.notifyFormationUsers(
      formationId,
      '✔️ Émargement validé',
      `La feuille d'émargement "${sheetTitle}" du ${new Date(date).toLocaleDateString('fr-FR')} a été validée.`,
      'attendance',
      {
        attendance_sheet_id: sheetId,
        date,
        action_url: '/emargement'
      }
    );
  },

  async notifyAbsenceRecorded(
    userId: string,
    sheetTitle: string,
    date: string,
    reason?: string
  ) {
    const reasonText = reason ? ` Motif: ${reason}` : ' Aucun motif spécifié.';
    
    return this.notifyUser(
      userId,
      '⚠️ Absence enregistrée',
      `Vous avez été marqué(e) absent(e) pour "${sheetTitle}" le ${new Date(date).toLocaleDateString('fr-FR')}.${reasonText}`,
      'attendance',
      {
        date,
        action_url: '/emargement'
      }
    );
  },

  // ============================================
  // SCHEDULE NOTIFICATIONS
  // ============================================

  async notifySchedulePublished(
    formationId: string,
    scheduleTitle: string,
    formationTitle: string
  ) {
    return this.notifyFormationUsers(
      formationId,
      '📅 Emploi du temps publié',
      `L'emploi du temps "${scheduleTitle}" pour ${formationTitle} a été publié.`,
      'schedule_published',
      {
        formation_id: formationId,
        action_url: '/emploi-temps'
      }
    );
  },

  async notifyScheduleSlotCreated(
    formationId: string,
    moduleName: string,
    date: string,
    startTime: string,
    endTime: string,
    instructorName?: string
  ) {
    const instructorText = instructorName ? ` avec ${instructorName}` : '';
    const formattedDate = new Date(date).toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });

    return this.notifyFormationUsers(
      formationId,
      '📆 Nouveau cours planifié',
      `Cours de "${moduleName}" prévu le ${formattedDate} de ${startTime} à ${endTime}${instructorText}.`,
      'schedule_slot_created',
      {
        formation_id: formationId,
        date,
        start_time: startTime,
        end_time: endTime,
        module_title: moduleName,
        instructor_name: instructorName,
        action_url: '/emploi-temps'
      }
    );
  },

  async notifyScheduleUpdated(
    formationId: string,
    changeDescription: string,
    date: string
  ) {
    return this.notifyFormationUsers(
      formationId,
      '🔄 Modification d\'emploi du temps',
      `${changeDescription} (${new Date(date).toLocaleDateString('fr-FR')})`,
      'schedule_update',
      {
        formation_id: formationId,
        date,
        action_url: '/emploi-temps'
      }
    );
  },

  async notifyScheduleSlotCancelled(
    formationId: string,
    moduleName: string,
    date: string,
    startTime: string
  ) {
    const formattedDate = new Date(date).toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });

    return this.notifyFormationUsers(
      formationId,
      '❌ Cours annulé',
      `Le cours de "${moduleName}" du ${formattedDate} à ${startTime} a été annulé.`,
      'schedule_slot_cancelled',
      {
        formation_id: formationId,
        date,
        start_time: startTime,
        module_title: moduleName,
        action_url: '/emploi-temps'
      }
    );
  },

  // ============================================
  // FORMATION NOTIFICATIONS
  // ============================================

  async notifyFormationEnrollment(
    userId: string,
    formationTitle: string,
    formationId: string
  ) {
    return this.notifyUser(
      userId,
      '🎓 Inscription confirmée',
      `Vous avez été inscrit(e) à la formation "${formationTitle}".`,
      'formation',
      {
        formation_id: formationId,
        action_url: '/formations'
      }
    );
  },

  async notifyFormationStarting(
    formationId: string,
    formationTitle: string,
    startDate: string
  ) {
    return this.notifyFormationUsers(
      formationId,
      '🚀 Formation qui démarre',
      `La formation "${formationTitle}" commence le ${new Date(startDate).toLocaleDateString('fr-FR')}.`,
      'formation',
      {
        formation_id: formationId,
        action_url: '/formations'
      }
    );
  },

  // ============================================
  // EVENT NOTIFICATIONS
  // ============================================

  async notifyEventParticipants(
    eventId: string, 
    title: string, 
    message: string, 
    type: NotificationType, 
    metadata?: NotificationMetadata
  ) {
    try {
      const { data: registrations, error: regError } = await db
        .from('event_registrations')
        .select('user_id')
        .eq('event_id', eventId)
        .eq('status', 'Confirmée');

      if (regError) throw regError;

      if (!registrations || registrations.length === 0) {
        return { success: true, notified_users: 0 };
      }

      const participantIds = registrations.map((r: any) => r.user_id);
      return this.notifyUsers(participantIds, title, message, type, { 
        ...metadata, 
        event_id: eventId 
      });
    } catch (error) {
      logger.error('Erreur lors de l\'envoi des notifications d\'événement:', error);
      throw error;
    }
  },

  // ============================================
  // VIRTUAL CLASS NOTIFICATIONS
  // ============================================

  async notifyVirtualClassCreated(
    establishmentId: string,
    classTitle: string,
    scheduledAt: string,
    duration: number,
    joinUrl?: string,
    formationId?: string,
    instructorId?: string
  ) {
    const formattedDate = new Date(scheduledAt).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });

    const zoomText = joinUrl ? `\nLien Zoom: ${joinUrl}` : '';
    const message = `Nouvelle classe virtuelle "${classTitle}" programmee le ${formattedDate} (${duration} min).${zoomText}`;
    const metadata: NotificationMetadata = {
      action_url: '/classes-virtuelles',
      date: scheduledAt,
    };

    const userIds: string[] = [];

    // Get students/formateurs from the formation if linked
    if (formationId) {
      const { data: assignments } = await supabase
        .from('user_formation_assignments')
        .select('user_id')
        .eq('formation_id', formationId);

      if (assignments) {
        userIds.push(...assignments.map(a => a.user_id));
      }
    } else {
      // Notify all students + formateurs of the establishment
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('establishment_id', establishmentId)
        .in('role', ['Étudiant', 'Formateur']);

      if (users) {
        userIds.push(...users.map(u => u.id));
      }
    }

    // Also notify the instructor specifically if not already included
    if (instructorId && !userIds.includes(instructorId)) {
      userIds.push(instructorId);
    }

    if (userIds.length === 0) {
      return { success: true, notified_users: 0 };
    }

    return this.notifyUsers(userIds, 'Nouvelle classe virtuelle', message, 'virtual_class', metadata);
  },

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

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
      logger.error('Erreur lors de la récupération des notifications:', error);
      throw error;
    }
  },

  async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      logger.error('Erreur lors du marquage de la notification:', error);
      throw error;
    }
  },

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
      logger.error('Erreur lors du marquage des notifications:', error);
      throw error;
    }
  },

  async deleteNotification(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      logger.error('Erreur lors de la suppression de la notification:', error);
      throw error;
    }
  },

  async deleteAllReadNotifications(userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('is_read', true);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      logger.error('Erreur lors de la suppression des notifications lues:', error);
      throw error;
    }
  },

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error('Erreur lors du comptage des notifications:', error);
      return 0;
    }
  }
};
