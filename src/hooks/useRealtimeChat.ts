import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './use-toast';

export interface ChatMessage {
  id: string;
  user_id: string;
  virtual_class_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
  is_instructor?: boolean;
}

export const useRealtimeChat = (classId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const { userId } = useCurrentUser();
  const { toast } = useToast();

  const fetchMessages = useCallback(async () => {
    if (!classId) return;
    try {
      setIsLoading(true);
      const { data, error } = await (supabase as any)
        .from('virtual_class_messages')
        .select('*')
        .eq('virtual_class_id', classId)
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) throw error;
      setMessages(data || []);
    } catch {
      // Table may not exist yet — start with empty messages
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (!classId) return;
    fetchMessages();

    const ch = supabase
      .channel(`virtual-class-chat-${classId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'virtual_class_messages', filter: `virtual_class_id=eq.${classId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = ch;

    return () => {
      supabase.removeChannel(ch);
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [classId, fetchMessages]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || !userId || !classId) return;

    try {
      const { error } = await (supabase as any)
        .from('virtual_class_messages')
        .insert({
          user_id: userId,
          virtual_class_id: classId,
          content: messageText.trim(),
        });

      if (error) throw error;
    } catch {
      toast({
        title: 'Erreur',
        description: "Impossible d'envoyer le message",
        variant: 'destructive',
      });
    }
  }, [classId, userId, toast]);

  return {
    messages,
    isConnected,
    isLoading,
    sendMessage,
    refetchMessages: fetchMessages,
  };
};
