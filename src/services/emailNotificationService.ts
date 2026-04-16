import { supabase } from '@/integrations/supabase/client';

// Types pour les notifications email
export type EmailNotificationType = 
  | 'message_received'
  | 'assignment_created'
  | 'assignment_due_reminder'
  | 'correction_published'
  | 'attendance_open'
  | 'attendance_reminder'
  | 'schedule_change'
  | 'virtual_class_created'
  | 'signature_request';

interface EmailRecipient {
  email: string;
  firstName: string;
  lastName: string;
}

interface EmailNotificationData {
  type: EmailNotificationType;
  subject: string;
  title: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
  additionalInfo?: Record<string, string>;
}

// Template HTML professionnel pour les emails
const generateEmailHtml = (data: EmailNotificationData, recipient: EmailRecipient): string => {
  const appUrl = 'https://nectforme.lovable.app';
  const ctaUrl = data.ctaUrl ? `${appUrl}${data.ctaUrl}` : appUrl;
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f7;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); padding: 30px 40px; border-radius: 12px 12px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">NECTFORMA</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 14px;">Plateforme de gestion de formation</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                Bonjour <strong>${recipient.firstName} ${recipient.lastName}</strong>,
              </p>
              
              <div style="background-color: #F3F4F6; border-left: 4px solid #8B5CF6; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <h2 style="color: #1F2937; font-size: 18px; margin: 0 0 12px 0;">${data.title}</h2>
                <p style="color: #4B5563; font-size: 15px; margin: 0; line-height: 1.6;">${data.message}</p>
              </div>
              
              ${data.additionalInfo ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                ${Object.entries(data.additionalInfo).map(([key, value]) => `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
                    <span style="color: #6B7280; font-size: 14px;">${key}</span>
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB; text-align: right;">
                    <span style="color: #1F2937; font-size: 14px; font-weight: 500;">${value}</span>
                  </td>
                </tr>
                `).join('')}
              </table>
              ` : ''}
              
              ${data.ctaText ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);">${data.ctaText}</a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 24px 40px; border-radius: 0 0 12px 12px; border-top: 1px solid #E5E7EB;">
              <p style="color: #6B7280; font-size: 13px; margin: 0 0 8px 0; text-align: center;">
                Cet email a été envoyé automatiquement par NECTFORMA.
              </p>
              <p style="color: #9CA3AF; font-size: 12px; margin: 0; text-align: center;">
                © ${new Date().getFullYear()} NECTFORMA. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

export const emailNotificationService = {
  /**
   * Envoyer un email de notification à un utilisateur
   */
  async sendEmailNotification(
    recipient: EmailRecipient,
    data: EmailNotificationData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const htmlContent = generateEmailHtml(data, recipient);
      
      const { data: response, error } = await supabase.functions.invoke('send-email-brevo', {
        body: {
          to: recipient.email,
          subject: data.subject,
          htmlContent,
          tags: ['notification', data.type]
        }
      });

      if (error) {
        console.error('Erreur envoi email:', error);
        return { success: false, error: error.message };
      }

      console.log('Email envoyé avec succès:', response);
      return { success: true };
    } catch (error) {
      console.error('Erreur emailNotificationService:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
    }
  },

  /**
   * Envoyer un email pour un nouveau message reçu
   */
  async notifyMessageReceived(
    recipientEmail: string,
    recipientFirstName: string,
    recipientLastName: string,
    senderName: string,
    messageSubject: string
  ) {
    return this.sendEmailNotification(
      { email: recipientEmail, firstName: recipientFirstName, lastName: recipientLastName },
      {
        type: 'message_received',
        subject: `📩 Nouveau message de ${senderName} - NECTFORMA`,
        title: 'Nouveau message reçu',
        message: `${senderName} vous a envoyé un nouveau message: "${messageSubject}".`,
        ctaText: 'Lire le message',
        ctaUrl: '/messagerie'
      }
    );
  },

  /**
   * Envoyer un email pour un nouveau devoir créé
   */
  async notifyAssignmentCreated(
    recipientEmail: string,
    recipientFirstName: string,
    recipientLastName: string,
    assignmentTitle: string,
    moduleName: string,
    dueDate?: string
  ) {
    const additionalInfo: Record<string, string> = {
      'Module': moduleName,
      'Devoir': assignmentTitle
    };
    
    if (dueDate) {
      additionalInfo['Date limite'] = new Date(dueDate).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    return this.sendEmailNotification(
      { email: recipientEmail, firstName: recipientFirstName, lastName: recipientLastName },
      {
        type: 'assignment_created',
        subject: `📝 Nouveau devoir: ${assignmentTitle} - NECTFORMA`,
        title: 'Nouveau devoir à rendre',
        message: `Un nouveau devoir "${assignmentTitle}" a été publié dans le module ${moduleName}.`,
        ctaText: 'Voir le devoir',
        ctaUrl: '/formations',
        additionalInfo
      }
    );
  },

  /**
   * Envoyer un rappel pour un devoir à rendre bientôt
   */
  async notifyAssignmentDueReminder(
    recipientEmail: string,
    recipientFirstName: string,
    recipientLastName: string,
    assignmentTitle: string,
    moduleName: string,
    dueDate: string,
    hoursRemaining: number
  ) {
    const urgencyText = hoursRemaining <= 24 
      ? '⚠️ Moins de 24h restantes !' 
      : hoursRemaining <= 48 
        ? '⏰ Plus que 2 jours !'
        : '';

    return this.sendEmailNotification(
      { email: recipientEmail, firstName: recipientFirstName, lastName: recipientLastName },
      {
        type: 'assignment_due_reminder',
        subject: `⏰ Rappel: Devoir "${assignmentTitle}" à rendre bientôt - NECTFORMA`,
        title: `Rappel: Devoir à rendre ${urgencyText}`,
        message: `Le devoir "${assignmentTitle}" doit être rendu prochainement. N'oubliez pas de le soumettre avant la date limite.`,
        ctaText: 'Soumettre mon devoir',
        ctaUrl: '/formations',
        additionalInfo: {
          'Module': moduleName,
          'Devoir': assignmentTitle,
          'Date limite': new Date(dueDate).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      }
    );
  },

  /**
   * Envoyer un email quand une correction est publiée
   */
  async notifyCorrectionPublished(
    recipientEmail: string,
    recipientFirstName: string,
    recipientLastName: string,
    assignmentTitle: string,
    grade?: number,
    maxPoints?: number
  ) {
    const gradeInfo: Record<string, string> = {
      'Devoir': assignmentTitle
    };
    
    if (grade !== undefined && maxPoints !== undefined) {
      gradeInfo['Note obtenue'] = `${grade}/${maxPoints} (${Math.round((grade / maxPoints) * 100)}%)`;
    }

    return this.sendEmailNotification(
      { email: recipientEmail, firstName: recipientFirstName, lastName: recipientLastName },
      {
        type: 'correction_published',
        subject: `✅ Correction disponible: ${assignmentTitle} - NECTFORMA`,
        title: 'Votre devoir a été corrigé',
        message: `La correction de votre devoir "${assignmentTitle}" est maintenant disponible. Consultez votre note et le retour de votre formateur.`,
        ctaText: 'Voir ma correction',
        ctaUrl: '/formations',
        additionalInfo: gradeInfo
      }
    );
  },

  /**
   * Envoyer un email quand l'émargement est ouvert
   */
  async notifyAttendanceOpen(
    recipientEmail: string,
    recipientFirstName: string,
    recipientLastName: string,
    sessionTitle: string,
    date: string,
    startTime: string,
    endTime: string
  ) {
    return this.sendEmailNotification(
      { email: recipientEmail, firstName: recipientFirstName, lastName: recipientLastName },
      {
        type: 'attendance_open',
        subject: `📋 Émargement ouvert: ${sessionTitle} - NECTFORMA`,
        title: 'Émargement disponible',
        message: `L'émargement pour la session "${sessionTitle}" est maintenant ouvert. Veuillez signer votre présence.`,
        ctaText: 'Signer ma présence',
        ctaUrl: '/emargement',
        additionalInfo: {
          'Session': sessionTitle,
          'Date': new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
          'Horaires': `${startTime} - ${endTime}`
        }
      }
    );
  },

  /**
   * Envoyer un rappel d'émargement
   */
  async notifyAttendanceReminder(
    recipientEmail: string,
    recipientFirstName: string,
    recipientLastName: string,
    sessionTitle: string,
    date: string,
    startTime: string
  ) {
    return this.sendEmailNotification(
      { email: recipientEmail, firstName: recipientFirstName, lastName: recipientLastName },
      {
        type: 'attendance_reminder',
        subject: `⏰ Rappel émargement: ${sessionTitle} - NECTFORMA`,
        title: "N'oubliez pas de signer !",
        message: `Vous n'avez pas encore signé votre présence pour la session "${sessionTitle}". L'émargement est toujours ouvert.`,
        ctaText: 'Signer maintenant',
        ctaUrl: '/emargement',
        additionalInfo: {
          'Session': sessionTitle,
          'Date': new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
          'Heure de début': startTime
        }
      }
    );
  },

  /**
   * Envoyer un email pour un changement d'emploi du temps
   */
  async notifyScheduleChange(
    recipientEmail: string,
    recipientFirstName: string,
    recipientLastName: string,
    changeType: 'created' | 'modified' | 'cancelled',
    moduleName: string,
    date: string,
    startTime: string,
    endTime: string,
    instructorName?: string
  ) {
    const changeMessages = {
      created: {
        subject: `📆 Nouveau cours planifié: ${moduleName}`,
        title: 'Nouveau cours dans votre emploi du temps',
        message: `Un nouveau cours de "${moduleName}" a été ajouté à votre emploi du temps.`
      },
      modified: {
        subject: `🔄 Modification de cours: ${moduleName}`,
        title: 'Modification de cours',
        message: `Le cours de "${moduleName}" a été modifié. Veuillez consulter les nouvelles informations.`
      },
      cancelled: {
        subject: `❌ Cours annulé: ${moduleName}`,
        title: 'Cours annulé',
        message: `Le cours de "${moduleName}" initialement prévu a été annulé.`
      }
    };

    const config = changeMessages[changeType];
    const additionalInfo: Record<string, string> = {
      'Module': moduleName,
      'Date': new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
      'Horaires': `${startTime} - ${endTime}`
    };
    
    if (instructorName) {
      additionalInfo['Formateur'] = instructorName;
    }

    return this.sendEmailNotification(
      { email: recipientEmail, firstName: recipientFirstName, lastName: recipientLastName },
      {
        type: 'schedule_change',
        subject: `${config.subject} - NECTFORMA`,
        title: config.title,
        message: config.message,
        ctaText: 'Voir mon emploi du temps',
        ctaUrl: '/emploi-temps',
        additionalInfo
      }
    );
  },

  /**
   * Envoyer un email pour une nouvelle classe virtuelle
   */
  async notifyVirtualClassCreated(
    recipientEmail: string,
    recipientFirstName: string,
    recipientLastName: string,
    classTitle: string,
    scheduledAt: string,
    duration: number,
    joinUrl?: string,
    password?: string,
    instructorName?: string
  ) {
    const formattedDate = new Date(scheduledAt).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const formattedTime = new Date(scheduledAt).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const endTime = new Date(new Date(scheduledAt).getTime() + duration * 60000).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const additionalInfo: Record<string, string> = {
      'Classe virtuelle': classTitle,
      'Date': formattedDate,
      'Horaires': `${formattedTime} - ${endTime} (${duration} min)`
    };

    if (instructorName) {
      additionalInfo['Formateur'] = instructorName;
    }
    if (joinUrl) {
      additionalInfo['Lien Zoom'] = `<a href="${joinUrl}" style="color: #7C3AED; font-weight: 600;">${joinUrl}</a>`;
    }
    if (password) {
      additionalInfo['Code d\'acces'] = password;
    }

    return this.sendEmailNotification(
      { email: recipientEmail, firstName: recipientFirstName, lastName: recipientLastName },
      {
        type: 'virtual_class_created',
        subject: `Classe virtuelle: ${classTitle} - NECTFORMA`,
        title: 'Nouvelle classe virtuelle programmee',
        message: `Une classe virtuelle "${classTitle}" a ete programmee le ${formattedDate} de ${formattedTime} a ${endTime}.${joinUrl ? ' Cliquez sur le bouton ci-dessous pour rejoindre la session le jour J.' : ''}`,
        ctaText: joinUrl ? 'Rejoindre la classe virtuelle' : 'Voir mes classes virtuelles',
        ctaUrl: joinUrl || '/classes-virtuelles',
        additionalInfo
      }
    );
  },

  /**
   * Envoyer un email de demande de signature pour les bulletins
   */
  async notifySignatureRequest(
    signerEmail: string,
    signerName: string,
    signerRole: string,
    signatureLink: string,
    establishmentName: string,
    formationTitle: string
  ) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demande de signature - Bulletins de notes</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f7;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px 40px; border-radius: 12px 12px 0 0;">
              <h1 style="color: #f59e0b; margin: 0; font-size: 24px; font-weight: 600;">NECTFORMA</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 14px;">${establishmentName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                Bonjour <strong>${signerName}</strong>,
              </p>
              <div style="background-color: #FEF3C7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <h2 style="color: #1F2937; font-size: 18px; margin: 0 0 12px 0;">Signature de bulletins requise</h2>
                <p style="color: #4B5563; font-size: 15px; margin: 0; line-height: 1.6;">
                  L'etablissement <strong>${establishmentName}</strong> vous invite a signer les bulletins de notes en tant que <strong>${signerRole}</strong>.
                </p>
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
                    <span style="color: #6B7280; font-size: 14px;">Formation</span>
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB; text-align: right;">
                    <span style="color: #1F2937; font-size: 14px; font-weight: 500;">${formationTitle}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
                    <span style="color: #6B7280; font-size: 14px;">Votre role</span>
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB; text-align: right;">
                    <span style="color: #1F2937; font-size: 14px; font-weight: 500;">${signerRole}</span>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${signatureLink}" style="display: inline-block; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #f59e0b; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 6px rgba(26, 26, 46, 0.3);">Signer les bulletins</a>
                  </td>
                </tr>
              </table>
              <p style="color: #6B7280; font-size: 13px; text-align: center;">
                Ou copiez ce lien dans votre navigateur :<br/>
                <a href="${signatureLink}" style="color: #1a1a2e; word-break: break-all;">${signatureLink}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F9FAFB; padding: 24px 40px; border-radius: 0 0 12px 12px; border-top: 1px solid #E5E7EB;">
              <p style="color: #6B7280; font-size: 13px; margin: 0 0 8px 0; text-align: center;">
                Cet email a ete envoye automatiquement par NECTFORMA.
              </p>
              <p style="color: #9CA3AF; font-size: 12px; margin: 0; text-align: center;">
                &copy; ${new Date().getFullYear()} NECTFORMA. Tous droits reserves.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

    try {
      const { data: response, error } = await supabase.functions.invoke('send-email-brevo', {
        body: {
          to: signerEmail,
          subject: `Signature de bulletins requise - ${establishmentName}`,
          htmlContent,
          tags: ['notification', 'signature_request']
        }
      });

      if (error) {
        console.error('Erreur envoi email signature:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur emailNotificationService (signature):', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
    }
  },

  /**
   * Récupérer les informations d'un utilisateur pour l'envoi d'email
   */
  async getUserEmailInfo(userId: string): Promise<EmailRecipient | null> {
    try {
      // D'abord vérifier dans la table users
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email, first_name, last_name')
        .eq('id', userId)
        .single();

      if (!userError && user) {
        return {
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name
        };
      }

      // Sinon vérifier dans la table tutors
      const { data: tutor, error: tutorError } = await supabase
        .from('tutors')
        .select('email, first_name, last_name')
        .eq('id', userId)
        .single();

      if (!tutorError && tutor) {
        return {
          email: tutor.email,
          firstName: tutor.first_name,
          lastName: tutor.last_name
        };
      }

      return null;
    } catch (error) {
      console.error('Erreur récupération info utilisateur:', error);
      return null;
    }
  },

  /**
   * Envoyer des emails à plusieurs utilisateurs
   */
  async sendBulkEmailNotifications(
    userIds: string[],
    data: EmailNotificationData
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const userId of userIds) {
      const userInfo = await this.getUserEmailInfo(userId);
      if (userInfo) {
        const result = await this.sendEmailNotification(userInfo, data);
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      } else {
        failed++;
      }
    }

    return { sent, failed };
  }
};
