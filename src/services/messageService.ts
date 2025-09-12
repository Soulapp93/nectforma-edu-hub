import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  sender_id: string;
  subject: string;
  content: string;
  created_at: string;
  updated_at: string;
  scheduled_for?: string;
  is_draft: boolean;
  attachment_count: number;
}

export interface MessageRecipient {
  id: string;
  message_id: string;
  recipient_id?: string;
  recipient_type: 'user' | 'formation' | 'all_instructors';
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  content_type?: string;
  created_at: string;
}

export interface CreateMessageData {
  subject: string;
  content: string;
  scheduled_for?: string;
  is_draft?: boolean;
  recipients: {
    type: 'user' | 'formation' | 'all_instructors';
    ids?: string[]; // user_ids for individual, formation_ids for groups
  };
  attachments?: File[];
}

export const messageService = {
  async createMessage(messageData: CreateMessageData): Promise<Message> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Create the message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          subject: messageData.subject,
          content: messageData.content,
          scheduled_for: messageData.scheduled_for,
          is_draft: messageData.is_draft || false,
          attachment_count: messageData.attachments?.length || 0
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Create recipients
      const recipients: Array<{
        message_id: string;
        recipient_id?: string;
        recipient_type: 'user' | 'formation' | 'all_instructors';
      }> = [];

      if (messageData.recipients.type === 'all_instructors') {
        recipients.push({
          message_id: message.id,
          recipient_type: 'all_instructors'
        });
      } else if (messageData.recipients.ids) {
        recipients.push(...messageData.recipients.ids.map(id => ({
          message_id: message.id,
          recipient_id: id,
          recipient_type: messageData.recipients.type
        })));
      }

      if (recipients.length > 0) {
        const { error: recipientsError } = await supabase
          .from('message_recipients')
          .insert(recipients);

        if (recipientsError) throw recipientsError;
      }

      // Handle attachments if any
      if (messageData.attachments && messageData.attachments.length > 0) {
        await this.uploadAttachments(message.id, messageData.attachments);
      }

      return message;
    } catch (error) {
      console.error('Erreur lors de la création du message:', error);
      throw error;
    }
  },

  async uploadAttachments(messageId: string, files: File[]): Promise<void> {
    try {
      const attachmentPromises = files.map(async (file) => {
        // Upload file to Supabase storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${messageId}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('module-files') // Using existing bucket
          .upload(`messages/${fileName}`, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('module-files')
          .getPublicUrl(`messages/${fileName}`);

        // Save attachment record
        const { error: attachmentError } = await supabase
          .from('message_attachments')
          .insert({
            message_id: messageId,
            file_name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            content_type: file.type
          });

        if (attachmentError) throw attachmentError;
      });

      await Promise.all(attachmentPromises);
    } catch (error) {
      console.error('Erreur lors du téléchargement des pièces jointes:', error);
      throw error;
    }
  },

  async getMessages(): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      throw error;
    }
  },

  async getMessageById(id: string): Promise<Message | null> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération du message:', error);
      throw error;
    }
  },

  async markAsRead(messageId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('message_recipients')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('message_id', messageId)
        .eq('recipient_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      throw error;
    }
  }
};