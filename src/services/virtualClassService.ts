import { supabase } from '@/integrations/supabase/client';
import { notificationService } from './notificationService';
import { emailNotificationService } from './emailNotificationService';
import { emailNotificationService } from './emailNotificationService';
import { logger } from '@/utils/logger';
export interface VirtualClass {
  id: string;
  establishment_id: string;
  formation_id: string | null;
  schedule_slot_id: string | null;
  provider: 'zoom' | 'teams' | 'google_meet';
  provider_meeting_id: string | null;
  join_url: string | null;
  start_url: string | null;
  password: string | null;
  status: 'pending' | 'synced' | 'error' | 'cancelled';
  title: string;
  description: string | null;
  scheduled_at: string;
  duration: number;
  host_user_id: string | null;
  instructor_id: string | null;
  error_message: string | null;
  last_sync_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ZoomConnection {
  id: string;
  establishment_id: string;
  account_id: string;
  client_id: string;
  client_secret_encrypted: string;
  status: 'active' | 'inactive' | 'error';
  connected_at: string;
  connected_by: string | null;
}

export interface IntegrationLog {
  id: string;
  establishment_id: string;
  virtual_class_id: string | null;
  action: string;
  provider: string;
  request_data: any;
  response_data: any;
  status: string;
  error_message: string | null;
  performed_by: string | null;
  created_at: string;
}

export const virtualClassService = {
  // ========== ZOOM CONNECTION ==========
  async getZoomConnection(establishmentId: string): Promise<ZoomConnection | null> {
    const { data, error } = await supabase
      .from('zoom_connections')
      .select('*')
      .eq('establishment_id', establishmentId)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching zoom connection:', error);
      return null;
    }
    return data as ZoomConnection | null;
  },

  async saveZoomConnection(establishmentId: string, credentials: {
    account_id: string;
    client_id: string;
    client_secret: string;
  }): Promise<ZoomConnection> {
    const { data: { session } } = await supabase.auth.getSession();

    // Upsert - one connection per establishment
    const { data, error } = await supabase
      .from('zoom_connections')
      .upsert({
        establishment_id: establishmentId,
        account_id: credentials.account_id,
        client_id: credentials.client_id,
        client_secret_encrypted: credentials.client_secret,
        status: 'active' as const,
        connected_by: session?.user?.id || null,
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'establishment_id' })
      .select()
      .single();

    if (error) throw error;
    return data as ZoomConnection;
  },

  async disconnectZoom(establishmentId: string): Promise<void> {
    const { error } = await supabase
      .from('zoom_connections')
      .delete()
      .eq('establishment_id', establishmentId);

    if (error) throw error;
  },

  async testZoomConnection(establishmentId: string): Promise<{ success: boolean; message: string }> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await supabase.functions.invoke('zoom-meeting', {
      body: {
        action: 'test_connection',
        establishment_id: establishmentId,
      },
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
    });

    if (response.error) throw response.error;
    return response.data;
  },

  // ========== VIRTUAL CLASSES ==========
  async getVirtualClasses(establishmentId: string, filters?: {
    formation_id?: string;
    status?: 'pending' | 'synced' | 'error' | 'cancelled';
  }): Promise<VirtualClass[]> {
    let query = supabase
      .from('virtual_classes')
      .select('*')
      .eq('establishment_id', establishmentId)
      .order('scheduled_at', { ascending: false });

    if (filters?.formation_id) {
      query = query.eq('formation_id', filters.formation_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as VirtualClass[];
  },

  async getVirtualClass(id: string): Promise<VirtualClass | null> {
    const { data, error } = await supabase
      .from('virtual_classes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as VirtualClass;
  },

  async createVirtualClass(params: {
    establishment_id: string;
    title: string;
    description?: string;
    scheduled_at: string;
    duration: number;
    provider: 'zoom' | 'teams' | 'google_meet';
    formation_id?: string;
    schedule_slot_id?: string;
    instructor_id?: string;
    auto_create_meeting?: boolean;
  }): Promise<VirtualClass> {
    const { data: { session } } = await supabase.auth.getSession();

    // Create the virtual class record
    const { data: vc, error } = await supabase
      .from('virtual_classes')
      .insert({
        establishment_id: params.establishment_id,
        title: params.title,
        description: params.description || null,
        scheduled_at: params.scheduled_at,
        duration: params.duration,
        provider: params.provider,
        formation_id: params.formation_id || null,
        schedule_slot_id: params.schedule_slot_id || null,
        instructor_id: params.instructor_id || null,
        status: 'pending',
        created_by: session?.user?.id || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Auto-create Zoom meeting if requested
    if (params.auto_create_meeting && params.provider === 'zoom') {
      try {
        const response = await supabase.functions.invoke('zoom-meeting', {
          body: {
            action: 'create',
            establishment_id: params.establishment_id,
            virtual_class_id: vc.id,
            title: params.title,
            description: params.description,
            scheduled_at: params.scheduled_at,
            duration: params.duration,
          },
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (response.error) {
          // Mark as error but don't fail the creation
          await supabase
            .from('virtual_classes')
            .update({ status: 'error' as const, error_message: response.error.message })
            .eq('id', vc.id);
        } else {
          // Refresh the vc data
          const { data: updated } = await supabase
            .from('virtual_classes')
            .select('*')
            .eq('id', vc.id)
            .single();
          if (updated) {
            // Send notifications after successful Zoom sync
            this._sendVirtualClassNotifications(updated as VirtualClass, params.establishment_id, params.formation_id, params.instructor_id).catch((e) => logger.error(e));
            return updated as VirtualClass;
          }
        }
      } catch (err: any) {
        await supabase
          .from('virtual_classes')
          .update({ status: 'error' as const, error_message: err.message })
          .eq('id', vc.id);
      }
    }

    // Send notifications even without Zoom (no join_url)
    this._sendVirtualClassNotifications(vc as VirtualClass, params.establishment_id, params.formation_id, params.instructor_id).catch((e) => logger.error(e));

    return vc as VirtualClass;
  },

  /**
   * Send all notifications (in-app + email + messagerie) for a new virtual class.
   * Fire-and-forget: errors are logged but never block the caller.
   */
  async _sendVirtualClassNotifications(
    vc: VirtualClass,
    establishmentId: string,
    formationId?: string,
    instructorId?: string
  ) {
    try {
      // 1. In-app bell notifications
      await notificationService.notifyVirtualClassCreated(
        establishmentId,
        vc.title,
        vc.scheduled_at,
        vc.duration,
        vc.join_url || undefined,
        formationId,
        instructorId
      );

      // 2. Collect user IDs for email + messaging
      let userIds: string[] = [];
      if (formationId) {
        const { data: assignments } = await supabase
          .from('user_formation_assignments')
          .select('user_id')
          .eq('formation_id', formationId);
        if (assignments) userIds = assignments.map(a => a.user_id);
      } else {
        const { data: users } = await supabase
          .from('users')
          .select('id')
          .eq('establishment_id', establishmentId)
          .in('role', ['Étudiant', 'Formateur']);
        if (users) userIds = users.map(u => u.id);
      }
      if (instructorId && !userIds.includes(instructorId)) {
        userIds.push(instructorId);
      }

      if (userIds.length === 0) return;

      // Get instructor name for emails
      let instructorName: string | undefined;
      if (instructorId) {
        const { data: inst } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', instructorId)
          .single();
        if (inst) instructorName = `${inst.first_name} ${inst.last_name}`;
      }

      // 3. Send emails to each user
      for (const userId of userIds) {
        const userInfo = await emailNotificationService.getUserEmailInfo(userId);
        if (userInfo) {
          emailNotificationService.notifyVirtualClassCreated(
            userInfo.email,
            userInfo.firstName,
            userInfo.lastName,
            vc.title,
            vc.scheduled_at,
            vc.duration,
            vc.join_url || undefined,
            vc.password || undefined,
            instructorName
          ).catch((e) => logger.error(e));
        }
      }

      // 4. Send message in Nectforma messagerie
      const formattedDate = new Date(vc.scheduled_at).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
      const formattedTime = new Date(vc.scheduled_at).toLocaleTimeString('fr-FR', {
        hour: '2-digit', minute: '2-digit'
      });
      const endTime = new Date(new Date(vc.scheduled_at).getTime() + vc.duration * 60000).toLocaleTimeString('fr-FR', {
        hour: '2-digit', minute: '2-digit'
      });

      const msgContent = [
        `Bonjour,`,
        ``,
        `Une nouvelle classe virtuelle a ete programmee :`,
        ``,
        `Titre : ${vc.title}`,
        vc.description ? `Description : ${vc.description}` : null,
        `Date : ${formattedDate}`,
        `Horaires : ${formattedTime} - ${endTime} (${vc.duration} min)`,
        instructorName ? `Formateur : ${instructorName}` : null,
        ``,
        vc.join_url ? `Lien pour rejoindre la session :` : null,
        vc.join_url ? vc.join_url : null,
        vc.password ? `Code d'acces : ${vc.password}` : null,
        ``,
        `Bonne session !`,
        `L'equipe Nectforma`
      ].filter(Boolean).join('\n');

      const { messageService } = await import('./messageService');
      await messageService.createMessage({
        subject: `Classe virtuelle : ${vc.title} - ${formattedDate}`,
        content: msgContent,
        recipients: {
          type: 'user',
          ids: userIds
        }
      });

    } catch (err) {
      logger.error('Error sending virtual class notifications:', err);
    }
  },

  async updateVirtualClass(id: string, params: {
    title?: string;
    description?: string;
    scheduled_at?: string;
    duration?: number;
    sync_zoom?: boolean;
    establishment_id?: string;
  }): Promise<VirtualClass> {
    const { data: { session } } = await supabase.auth.getSession();

    const updateData: any = { updated_at: new Date().toISOString() };
    if (params.title) updateData.title = params.title;
    if (params.description !== undefined) updateData.description = params.description;
    if (params.scheduled_at) updateData.scheduled_at = params.scheduled_at;
    if (params.duration) updateData.duration = params.duration;

    const { data, error } = await supabase
      .from('virtual_classes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Sync with Zoom if requested
    if (params.sync_zoom && params.establishment_id) {
      try {
        await supabase.functions.invoke('zoom-meeting', {
          body: {
            action: 'update',
            establishment_id: params.establishment_id,
            virtual_class_id: id,
            title: params.title,
            scheduled_at: params.scheduled_at,
            duration: params.duration,
            description: params.description,
          },
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
      } catch (err: any) {
        logger.error('Zoom sync error:', err);
      }
    }

    return data as VirtualClass;
  },

  async deleteVirtualClass(id: string, establishmentId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();

    // Delete Zoom meeting first
    try {
      await supabase.functions.invoke('zoom-meeting', {
        body: {
          action: 'delete',
          establishment_id: establishmentId,
          virtual_class_id: id,
        },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
    } catch (err) {
      logger.error('Zoom delete error:', err);
    }

    const { error } = await supabase
      .from('virtual_classes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async retrySync(id: string, establishmentId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    const { data: vc } = await supabase
      .from('virtual_classes')
      .select('*')
      .eq('id', id)
      .single();

    if (!vc) throw new Error('Classe virtuelle introuvable');

    if (vc.provider_meeting_id) {
      // Update existing
      await supabase.functions.invoke('zoom-meeting', {
        body: {
          action: 'update',
          establishment_id: establishmentId,
          virtual_class_id: id,
          title: vc.title,
          scheduled_at: vc.scheduled_at,
          duration: vc.duration,
        },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
    } else {
      // Create new
      await supabase.functions.invoke('zoom-meeting', {
        body: {
          action: 'create',
          establishment_id: establishmentId,
          virtual_class_id: id,
          title: vc.title,
          scheduled_at: vc.scheduled_at,
          duration: vc.duration,
          description: vc.description,
        },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
    }
  },

  // ========== LOGS ==========
  async getIntegrationLogs(establishmentId: string, limit = 50): Promise<IntegrationLog[]> {
    const { data, error } = await supabase
      .from('integration_logs')
      .select('*')
      .eq('establishment_id', establishmentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as IntegrationLog[];
  },
};
