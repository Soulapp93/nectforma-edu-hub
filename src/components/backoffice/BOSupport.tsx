import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Headphones, MessageSquare, Clock, CheckCircle, AlertTriangle, Send, ArrowLeft, User, Building2, XCircle } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = { open: 'bg-amber-100 text-amber-700', in_progress: 'bg-blue-100 text-blue-700', resolved: 'bg-emerald-100 text-emerald-700', closed: 'bg-gray-100 text-gray-700' };
const STATUS_LABELS: Record<string, string> = { open: 'Ouvert', in_progress: 'En cours', resolved: 'Resolu', closed: 'Ferme' };
const PRIORITY_COLORS: Record<string, string> = { urgent: 'bg-red-100 text-red-700', high: 'bg-orange-100 text-orange-700', medium: 'bg-blue-100 text-blue-700', low: 'bg-gray-100 text-gray-700' };

const BOSupport: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const { data: tickets = [] } = useQuery({
    queryKey: ['bo-support-tickets'],
    queryFn: async () => {
      const { data } = await supabase.from('support_tickets').select('*, establishments(name), users!support_tickets_created_by_fkey(first_name, last_name, email)').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['bo-support-messages', selectedId],
    queryFn: async () => {
      const { data } = await supabase.from('support_messages').select('*, users!support_messages_sender_id_fkey(first_name, last_name)').eq('ticket_id', selectedId!).order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!selectedId,
  });

  const selected = tickets.find((t: any) => t.id === selectedId);

  const sendReply = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('support_messages').insert({ ticket_id: selectedId, sender_id: user?.id, message: reply, is_admin_reply: true } as any);
      if (selected?.status === 'open') {
        await supabase.from('support_tickets').update({ status: 'in_progress', updated_at: new Date().toISOString() } as any).eq('id', selectedId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bo-support-messages', selectedId] });
      queryClient.invalidateQueries({ queryKey: ['bo-support-tickets'] });
      setReply('');
      toast.success('Reponse envoyee');
    },
  });

  const updateStatus = async (ticketId: string, status: string) => {
    await supabase.from('support_tickets').update({ status, updated_at: new Date().toISOString(), ...(status === 'resolved' ? { resolved_at: new Date().toISOString() } : {}) } as any).eq('id', ticketId);
    queryClient.invalidateQueries({ queryKey: ['bo-support-tickets'] });
    toast.success(`Ticket ${STATUS_LABELS[status] || status}`);
  };

  const filteredTickets = filter === 'all' ? tickets : tickets.filter((t: any) => t.status === filter);

  const stats = useMemo(() => ({
    open: tickets.filter((t: any) => t.status === 'open').length,
    in_progress: tickets.filter((t: any) => t.status === 'in_progress').length,
    resolved: tickets.filter((t: any) => t.status === 'resolved').length,
    total: tickets.length,
  }), [tickets]);

  // Conversation view
  if (selectedId && selected) {
    return (
      <div className="flex flex-col h-full" data-testid="bo-support-conversation">
        {/* Header */}
        <div className="p-4 border-b flex items-center gap-3 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold truncate">{selected.subject}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge className={`${STATUS_COLORS[selected.status]} text-[9px]`}>{STATUS_LABELS[selected.status]}</Badge>
              <Badge className={`${PRIORITY_COLORS[selected.priority]} text-[9px]`}>{selected.priority}</Badge>
              <span className="text-[10px] text-muted-foreground">{selected.establishments?.name}</span>
            </div>
          </div>
          <div className="flex gap-1">
            {selected.status !== 'resolved' && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => updateStatus(selected.id, 'resolved')} data-testid="resolve-ticket">
                <CheckCircle className="h-3 w-3" />Resoudre
              </Button>
            )}
            {selected.status !== 'closed' && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => updateStatus(selected.id, 'closed')}>
                <XCircle className="h-3 w-3" />Fermer
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Initial ticket */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 bg-muted rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold">{selected.users?.first_name} {selected.users?.last_name}</span>
                <span className="text-[10px] text-muted-foreground">{format(new Date(selected.created_at), 'dd/MM/yy HH:mm', { locale: fr })}</span>
              </div>
              <p className="text-sm">{selected.description || selected.subject}</p>
            </div>
          </div>

          {/* Replies */}
          {messages.map((m: any) => (
            <div key={m.id} className={`flex gap-3 ${m.is_admin_reply ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.is_admin_reply ? 'bg-primary' : 'bg-primary/10'}`}>
                {m.is_admin_reply ? <Headphones className="h-4 w-4 text-primary-foreground" /> : <User className="h-4 w-4 text-primary" />}
              </div>
              <div className={`flex-1 max-w-[80%] rounded-lg p-3 ${m.is_admin_reply ? 'bg-primary/10' : 'bg-muted'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold">{m.is_admin_reply ? 'Support Nectforma' : `${m.users?.first_name || ''} ${m.users?.last_name || ''}`}</span>
                  <span className="text-[10px] text-muted-foreground">{format(new Date(m.created_at), 'dd/MM HH:mm', { locale: fr })}</span>
                </div>
                <p className="text-sm">{m.message}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Reply input */}
        {selected.status !== 'closed' && (
          <div className="p-4 border-t shrink-0">
            <div className="flex gap-2">
              <Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Votre reponse..." className="min-h-[60px]" rows={2} data-testid="support-reply-input" />
              <Button onClick={() => sendReply.mutate()} disabled={!reply.trim() || sendReply.isPending} className="shrink-0 gap-1" data-testid="send-reply-btn">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="p-6 space-y-4" data-testid="bo-support">
      <div><h1 className="text-2xl font-bold">Support</h1><p className="text-sm text-muted-foreground">{tickets.length} ticket(s)</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="cursor-pointer hover:ring-2 hover:ring-amber-300" onClick={() => setFilter('open')}>
          <CardContent className="p-3 text-center"><p className="text-xl font-bold text-amber-600">{stats.open}</p><p className="text-[10px] text-muted-foreground">Ouverts</p></CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 hover:ring-blue-300" onClick={() => setFilter('in_progress')}>
          <CardContent className="p-3 text-center"><p className="text-xl font-bold text-blue-600">{stats.in_progress}</p><p className="text-[10px] text-muted-foreground">En cours</p></CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 hover:ring-emerald-300" onClick={() => setFilter('resolved')}>
          <CardContent className="p-3 text-center"><p className="text-xl font-bold text-emerald-600">{stats.resolved}</p><p className="text-[10px] text-muted-foreground">Resolus</p></CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 hover:ring-gray-300" onClick={() => setFilter('all')}>
          <CardContent className="p-3 text-center"><p className="text-xl font-bold">{stats.total}</p><p className="text-[10px] text-muted-foreground">Total</p></CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        {filteredTickets.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Aucun ticket</p> : filteredTickets.map((t: any) => (
          <Card key={t.id} className="hover:ring-2 hover:ring-primary/30 cursor-pointer" onClick={() => setSelectedId(t.id)} data-testid={`ticket-${t.id}`}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`w-2 h-10 rounded-full shrink-0 ${t.status === 'open' ? 'bg-amber-500' : t.status === 'in_progress' ? 'bg-blue-500' : t.status === 'resolved' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{t.subject}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground"><Building2 className="h-3 w-3 inline mr-0.5" />{t.establishments?.name || 'N/A'}</span>
                  <Badge className={`${STATUS_COLORS[t.status]} text-[8px]`}>{STATUS_LABELS[t.status]}</Badge>
                  <Badge className={`${PRIORITY_COLORS[t.priority]} text-[8px]`}>{t.priority}</Badge>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{format(new Date(t.created_at), 'dd/MM HH:mm', { locale: fr })}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BOSupport;
