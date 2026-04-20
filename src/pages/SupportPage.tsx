import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEstablishment } from '@/hooks/useEstablishment';
import { markChannelSeen } from '@/hooks/useUnreadCounters';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Headphones, Send, MessageSquare, Plus, ArrowLeft,
  CheckCircle, Clock, AlertTriangle, XCircle, Loader2,
  Paperclip, User, ShieldCheck, FileText, Image as ImageIcon, X,
} from 'lucide-react';

const STATUS_LABELS: Record<string, string> = { open: 'Ouvert', in_progress: 'En cours', resolved: 'Resolu', closed: 'Ferme' };
const STATUS_COLORS: Record<string, string> = { open: 'bg-amber-100 text-amber-700', in_progress: 'bg-blue-100 text-blue-700', resolved: 'bg-emerald-100 text-emerald-700', closed: 'bg-gray-100 text-gray-700' };

const SupportPage: React.FC = () => {
  const { userId } = useCurrentUser();
  const { establishment } = useEstablishment();
  const queryClient = useQueryClient();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mark support channel as "seen" when page opens or user opens a ticket
  useEffect(() => {
    markChannelSeen('support');
  }, [selectedTicketId]);

  // Fetch tickets for this establishment
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['my-support-tickets', establishment?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('establishment_id', establishment?.id!)
        .order('updated_at', { ascending: false });
      return data || [];
    },
    enabled: !!establishment?.id,
  });

  // Fetch messages for selected ticket
  const { data: messages = [] } = useQuery({
    queryKey: ['my-support-messages', selectedTicketId],
    queryFn: async () => {
      const { data } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', selectedTicketId!)
        .order('created_at', { ascending: true });
      if (!data) return [];
      // Enrich with user names
      const enriched = await Promise.all(data.map(async (m: any) => {
        if (m.sender_id) {
          const { data: user } = await supabase.from('users').select('first_name, last_name').eq('id', m.sender_id).single();
          return { ...m, sender_name: user ? `${user.first_name} ${user.last_name}` : 'Utilisateur' };
        }
        return { ...m, sender_name: m.is_admin_reply ? 'Support Nectforma' : 'Utilisateur' };
      }));
      return enriched;
    },
    enabled: !!selectedTicketId,
  });

  const selectedTicket = tickets.find((t: any) => t.id === selectedTicketId);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send reply
  const handleSendReply = async () => {
    if (!reply.trim() || !selectedTicketId) return;
    setSending(true);
    try {
      await supabase.from('support_messages').insert({
        ticket_id: selectedTicketId,
        sender_id: userId,
        message: reply,
        is_admin_reply: false,
      } as any);
      await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() } as any).eq('id', selectedTicketId);
      queryClient.invalidateQueries({ queryKey: ['my-support-messages', selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ['my-support-tickets'] });
      setReply('');
    } catch (e: any) {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  // Create new ticket
  const handleCreateTicket = async () => {
    if (!newSubject.trim() || !newMessage.trim()) return;
    setCreating(true);
    try {
      const { data } = await supabase.from('support_tickets').insert({
        establishment_id: establishment?.id,
        created_by: userId,
        subject: newSubject,
        description: newMessage,
        status: 'open',
        priority: 'medium',
        category: 'general',
      } as any).select().single();
      queryClient.invalidateQueries({ queryKey: ['my-support-tickets'] });
      setShowCreate(false);
      setNewSubject('');
      setNewMessage('');
      if (data) setSelectedTicketId(data.id);
      toast.success('Ticket cree');
    } catch (e) {
      toast.error('Erreur');
    } finally {
      setCreating(false);
    }
  };

  const unreadCount = tickets.filter((t: any) => t.status === 'in_progress' || t.status === 'open').length;

  // ===== Conversation View =====
  if (selectedTicketId && selectedTicket) {
    return (
      <div className="h-[calc(100vh-80px)] flex flex-col" data-testid="support-conversation-view">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 border-b flex items-center gap-3 shrink-0 bg-background">
          <Button variant="ghost" size="sm" onClick={() => setSelectedTicketId(null)} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold truncate">{selectedTicket.subject}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge className={`${STATUS_COLORS[selectedTicket.status]} text-[9px]`}>{STATUS_LABELS[selectedTicket.status]}</Badge>
              <span className="text-[10px] text-muted-foreground">Cree le {format(new Date(selectedTicket.created_at), 'dd MMMM yyyy', { locale: fr })}</span>
            </div>
          </div>
          {selectedTicket.status === 'resolved' && (
            <Badge className="bg-emerald-100 text-emerald-700 gap-1 text-[10px]"><CheckCircle className="h-3 w-3" />Resolu</Badge>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 bg-muted/20">
          {/* Initial description */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 max-w-[85%]">
              <div className="bg-background rounded-2xl rounded-tl-sm p-3 shadow-sm border">
                <p className="text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
                {/* Check for attachments in description */}
                {selectedTicket.description?.includes('Pieces jointes:') && (
                  <div className="mt-2 pt-2 border-t space-y-1">
                    {selectedTicket.description.split('\n').filter((l: string) => l.startsWith('- [')).map((l: string, i: number) => {
                      const match = l.match(/\[(.+?)\]\((.+?)\)/);
                      if (!match) return null;
                      return (
                        <a key={i} href={match[2]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                          <FileText className="h-3 w-3" />{match[1]}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 ml-1">{format(new Date(selectedTicket.created_at), 'dd/MM HH:mm', { locale: fr })}</p>
            </div>
          </div>

          {/* Thread messages */}
          {messages.map((m: any) => (
            <div key={m.id} className={`flex gap-3 ${m.is_admin_reply ? '' : 'flex-row-reverse'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.is_admin_reply ? 'bg-[hsl(var(--golden))]/20' : 'bg-primary/10'}`}>
                {m.is_admin_reply ? <Headphones className="h-4 w-4 text-[hsl(var(--golden))]" /> : <User className="h-4 w-4 text-primary" />}
              </div>
              <div className={`flex-1 max-w-[85%] ${m.is_admin_reply ? '' : 'flex flex-col items-end'}`}>
                <div className={`rounded-2xl p-3 shadow-sm border ${m.is_admin_reply ? 'bg-[hsl(var(--golden))]/5 border-[hsl(var(--golden))]/20 rounded-tl-sm' : 'bg-primary/5 border-primary/10 rounded-tr-sm'}`}>
                  <p className="text-[11px] font-semibold mb-0.5 text-muted-foreground">{m.is_admin_reply ? 'Support Nectforma' : m.sender_name}</p>
                  <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 mx-1">{format(new Date(m.created_at), 'dd/MM HH:mm', { locale: fr })}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply input */}
        {selectedTicket.status !== 'closed' && (
          <div className="px-4 sm:px-6 py-3 border-t bg-background shrink-0">
            <div className="flex gap-2 items-end">
              <Textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Votre message..."
                className="min-h-[44px] max-h-[120px] resize-none"
                rows={1}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                data-testid="support-reply-field"
              />
              <Button onClick={handleSendReply} disabled={!reply.trim() || sending} className="shrink-0 h-11 w-11 p-0" data-testid="support-send-reply">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Appuyez sur Entree pour envoyer, Shift+Entree pour un saut de ligne</p>
          </div>
        )}

        {selectedTicket.status === 'closed' && (
          <div className="px-4 sm:px-6 py-3 border-t bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground">Ce ticket est ferme. Creez un nouveau ticket si vous avez besoin d'aide.</p>
          </div>
        )}
      </div>
    );
  }

  // ===== Tickets List View =====
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5" data-testid="support-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Headphones className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Support</h1>
            <p className="text-xs text-muted-foreground">Vos echanges avec le support Nectforma</p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)} data-testid="new-ticket-btn">
          <Plus className="h-4 w-4" /> Nouveau ticket
        </Button>
      </div>

      {/* New ticket form */}
      {showCreate && (
        <Card className="border-primary/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Nouvelle demande</h3>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <Input value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="Sujet de votre demande..." className="text-sm" data-testid="new-ticket-subject" />
            <Textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Decrivez votre probleme..." rows={3} className="text-sm" data-testid="new-ticket-message" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Annuler</Button>
              <Button size="sm" onClick={handleCreateTicket} disabled={!newSubject.trim() || !newMessage.trim() || creating} className="gap-1" data-testid="submit-new-ticket">
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Envoyer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tickets list */}
      {isLoading ? (
        <div className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" /></div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="font-semibold text-sm mb-1">Aucun ticket</h3>
            <p className="text-xs text-muted-foreground text-center mb-3">Vous n'avez pas encore contacte le support.</p>
            <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1"><Plus className="h-3.5 w-3.5" />Creer un ticket</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tickets.map((t: any) => {
            const statusIcon = t.status === 'open' ? Clock : t.status === 'in_progress' ? AlertTriangle : t.status === 'resolved' ? CheckCircle : XCircle;
            const StatusIcon = statusIcon;
            return (
              <Card key={t.id} className="hover:ring-2 hover:ring-primary/20 cursor-pointer transition-all" onClick={() => setSelectedTicketId(t.id)} data-testid={`my-ticket-${t.id}`}>
                <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                  <div className={`w-2.5 h-10 rounded-full shrink-0 ${t.status === 'open' ? 'bg-amber-500' : t.status === 'in_progress' ? 'bg-blue-500' : t.status === 'resolved' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold truncate">{t.subject}</p>
                      <Badge className={`${STATUS_COLORS[t.status]} text-[9px] gap-0.5`}><StatusIcon className="h-3 w-3" />{STATUS_LABELS[t.status]}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.description?.substring(0, 80)}...</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted-foreground">{format(new Date(t.updated_at || t.created_at), 'dd/MM/yy', { locale: fr })}</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(t.updated_at || t.created_at), 'HH:mm', { locale: fr })}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SupportPage;
