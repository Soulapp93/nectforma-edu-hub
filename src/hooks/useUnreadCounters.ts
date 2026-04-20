import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from './useCurrentUser';
import { useEstablishment } from './useEstablishment';

/**
 * Tracks "last seen" timestamps via localStorage for features that have no
 * dedicated read-state column (chat_messages, support_messages).
 */
const LS_KEYS = {
  groupes: 'nect-unread-groupes-last-seen',
  support: 'nect-unread-support-last-seen',
} as const;

export const markChannelSeen = (channel: keyof typeof LS_KEYS) => {
  try {
    localStorage.setItem(LS_KEYS[channel], new Date().toISOString());
    // Notify same-tab listeners
    window.dispatchEvent(new CustomEvent('nect-unread-refresh'));
  } catch {
    /* noop */
  }
};

const getLastSeen = (channel: keyof typeof LS_KEYS): string => {
  try {
    return localStorage.getItem(LS_KEYS[channel]) || '1970-01-01T00:00:00Z';
  } catch {
    return '1970-01-01T00:00:00Z';
  }
};

interface Counters {
  messagerie: number;
  groupes: number;
  support: number;
  total: number;
}

export const useUnreadCounters = () => {
  const { userId } = useCurrentUser();
  const { establishment } = useEstablishment();
  const [counters, setCounters] = useState<Counters>({ messagerie: 0, groupes: 0, support: 0, total: 0 });
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchAll = useCallback(async () => {
    if (!userId) {
      setCounters({ messagerie: 0, groupes: 0, support: 0, total: 0 });
      return;
    }

    const db = supabase as any;

    // 1) Messagerie: unread message_recipients for this user
    let messagerie = 0;
    try {
      const { count } = await db
        .from('message_recipients')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false)
        .eq('is_deleted', false);
      messagerie = count || 0;
    } catch {
      /* non-critical */
    }

    // 2) Groupes: chat_messages created after last seen in groups where user is member, not sent by current user
    let groupes = 0;
    try {
      const lastSeen = getLastSeen('groupes');
      const { data: memberships } = await db
        .from('chat_group_members')
        .select('group_id')
        .eq('user_id', userId);
      const groupIds = (memberships || []).map((m: any) => m.group_id);
      if (groupIds.length > 0) {
        const { count } = await db
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .in('group_id', groupIds)
          .neq('sender_id', userId)
          .gt('created_at', lastSeen);
        groupes = count || 0;
      }
    } catch {
      /* non-critical */
    }

    // 3) Support: support_messages with is_admin_reply=true for this establishment, created after last seen
    let support = 0;
    try {
      if (establishment?.id) {
        const lastSeen = getLastSeen('support');
        const { data: myTickets } = await db
          .from('support_tickets')
          .select('id')
          .eq('establishment_id', establishment.id);
        const ticketIds = (myTickets || []).map((t: any) => t.id);
        if (ticketIds.length > 0) {
          const { count } = await db
            .from('support_messages')
            .select('id', { count: 'exact', head: true })
            .in('ticket_id', ticketIds)
            .eq('is_admin_reply', true)
            .gt('created_at', lastSeen);
          support = count || 0;
        }
      }
    } catch {
      /* non-critical */
    }

    setCounters({ messagerie, groupes, support, total: messagerie + groupes + support });
  }, [userId, establishment?.id]);

  useEffect(() => {
    fetchAll();

    // Realtime subscriptions
    let ch: ReturnType<typeof supabase.channel> | null = null;
    try {
      ch = supabase
        .channel(`unread-counters-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'message_recipients' }, () => fetchAll())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => fetchAll())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, () => fetchAll())
        .subscribe();
      channelRef.current = ch;
    } catch {
      /* non-critical */
    }

    // Refresh when markChannelSeen is called in the same tab
    const handler = () => fetchAll();
    window.addEventListener('nect-unread-refresh', handler);

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      window.removeEventListener('nect-unread-refresh', handler);
    };
  }, [fetchAll]);

  return { counters, refetch: fetchAll };
};
