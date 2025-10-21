import { supabase } from '@/integrations/supabase/client';

// Helper function to get current user ID (supports demo mode)
const getCurrentUserId = async (): Promise<string> => {
  // Check for demo user first
  const demoUser = sessionStorage.getItem('demo_user');
  
  if (demoUser) {
    const userData = JSON.parse(demoUser);
    let userId = userData.id;
    
    // Convert ALL demo IDs to valid UUIDs
    if (userId === 'demo-adminprincipal') {
      userId = '00000000-0000-4000-8000-000000000001';
    } else if (userId === 'demo-student' || userId === 'demo-étudiant') {
      userId = '00000000-0000-4000-8000-000000000002';
    } else if (userId === 'demo-formateur' || userId === 'demo-instructor') {
      userId = '00000000-0000-4000-8000-000000000003';
    } else if (typeof userId === 'string' && !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      // If it's still not a valid UUID, try to find the user in the database by email or construct a UUID
      console.warn('Invalid demo user ID, attempting to resolve:', userId);
      // For any other demo user, use the étudiant UUID as fallback
      userId = '00000000-0000-4000-8000-000000000002';
    }
    
    console.log('✅ Demo user ID converted:', userId);
    return userId;
  }
  
  // Otherwise use Supabase auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user.id;
};

export interface ChatGroup {
  id: string;
  establishment_id: string;
  formation_id: string | null;
  name: string;
  description: string | null;
  group_type: 'establishment' | 'formation' | 'private';
  created_by: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  unread_count?: number;
  last_message?: ChatMessage;
  member_count?: number;
}

export interface ChatGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  last_read_at: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_photo_url: string | null;
    role: string;
  };
}

export interface ChatMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'file' | 'system';
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_photo_url: string | null;
    role: string;
  };
  attachments?: ChatMessageAttachment[];
}

export interface ChatMessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  content_type: string | null;
  created_at: string;
}

export const chatService = {
  // Get all groups for current user
  async getUserGroups(): Promise<ChatGroup[]> {
    const userId = await getCurrentUserId();
    console.log('✅ Getting groups for user:', userId);

    // First, get the group IDs the user is a member of
    const { data: memberData, error: memberError } = await supabase
      .from('chat_group_members')
      .select('group_id')
      .eq('user_id', userId);

    if (memberError) {
      console.error('❌ Error fetching memberships:', memberError);
      throw memberError;
    }

    console.log('✅ User memberships:', memberData);

    if (!memberData || memberData.length === 0) {
      console.log('⚠️ No group memberships found');
      return [];
    }

    const groupIds = memberData.map(m => m.group_id);

    // Then fetch the groups
    const { data, error } = await supabase
      .from('chat_groups')
      .select('*')
      .in('id', groupIds)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching groups:', error);
      throw error;
    }

    console.log('✅ Groups fetched:', data);
    return (data || []) as ChatGroup[];
  },

  // Get group by ID with details
  async getGroupById(groupId: string): Promise<ChatGroup> {
    const { data, error } = await supabase
      .from('chat_groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error) throw error;
    return data as ChatGroup;
  },

  // Get group members
  async getGroupMembers(groupId: string): Promise<ChatGroupMember[]> {
    const { data, error } = await supabase
      .from('chat_group_members')
      .select(`
        *,
        user:users(id, first_name, last_name, email, profile_photo_url, role)
      `)
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return (data || []) as ChatGroupMember[];
  },

  // Create a new group
  async createGroup(groupData: {
    name: string;
    description?: string;
    formation_id?: string;
    member_ids: string[];
  }): Promise<ChatGroup> {
    const userId = await getCurrentUserId();

    // Get user's establishment
    const { data: userData } = await supabase
      .from('users')
      .select('establishment_id')
      .eq('id', userId)
      .single();

    if (!userData) throw new Error('User data not found');

    // Create the group
    const { data: group, error: groupError } = await supabase
      .from('chat_groups')
      .insert({
        establishment_id: userData.establishment_id,
        formation_id: groupData.formation_id || null,
        name: groupData.name,
        description: groupData.description || null,
        group_type: 'private',
        created_by: userId,
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // Add members including creator as admin
    const members = [
      { group_id: group.id, user_id: userId, role: 'admin' as const },
      ...groupData.member_ids.map(userId => ({
        group_id: group.id,
        user_id: userId,
        role: 'member' as const,
      })),
    ];

    const { error: membersError } = await supabase
      .from('chat_group_members')
      .insert(members);

    if (membersError) throw membersError;

    return group as ChatGroup;
  },

  // Get messages for a group
  async getGroupMessages(groupId: string, limit: number = 50): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:users(id, first_name, last_name, profile_photo_url, role),
        attachments:chat_message_attachments(*)
      `)
      .eq('group_id', groupId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return ((data || []) as ChatMessage[]).reverse();
  },

  // Send a message
  async sendMessage(groupId: string, content: string): Promise<ChatMessage> {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        group_id: groupId,
        sender_id: userId,
        content,
        message_type: 'text' as const,
      })
      .select(`
        *,
        sender:users(id, first_name, last_name, profile_photo_url, role)
      `)
      .single();

    if (error) throw error;

    // Update group updated_at
    await supabase
      .from('chat_groups')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', groupId);

    return data as ChatMessage;
  },

  // Upload attachment
  async uploadAttachment(messageId: string, file: File): Promise<ChatMessageAttachment> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${messageId}/${Date.now()}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('module-files')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('module-files')
      .getPublicUrl(fileName);

    const { data, error } = await supabase
      .from('chat_message_attachments')
      .insert({
        message_id: messageId,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        content_type: file.type,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update last read timestamp
  async updateLastRead(groupId: string): Promise<void> {
    try {
      const userId = await getCurrentUserId();
      
      const { error } = await supabase
        .from('chat_group_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      // Silently fail if user is not authenticated
      console.warn('Could not update last read:', error);
    }
  },

  // Subscribe to new messages
  subscribeToMessages(groupId: string, callback: (message: ChatMessage) => void) {
    const channel = supabase
      .channel(`chat_messages:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const { data } = await supabase
            .from('chat_messages')
            .select(`
              *,
              sender:users(id, first_name, last_name, profile_photo_url, role),
              attachments:chat_message_attachments(*)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            callback(data as ChatMessage);
          }
        }
      )
      .subscribe();

    return channel;
  },

  // Leave group
  async leaveGroup(groupId: string): Promise<void> {
    const userId = await getCurrentUserId();

    const { error } = await supabase
      .from('chat_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
  },
};
