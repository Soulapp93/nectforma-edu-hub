import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Building2, Search, Users, GraduationCap, Calendar, BookOpen, Eye, Plus, StickyNote, Phone, Mail, Video, ChevronRight, ArrowLeft, Activity } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = { Actif: 'bg-emerald-100 text-emerald-700', Inactif: 'bg-red-100 text-red-700', trial: 'bg-amber-100 text-amber-700' };

const BOCrm: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState('note');

  const { data: establishments = [] } = useQuery({
    queryKey: ['bo-crm-establishments'],
    queryFn: async () => {
      const { data } = await supabase.from('establishments').select('id, name, logo_url, created_at, address, phone, email, siret, director, type').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: userCounts = {} } = useQuery({
    queryKey: ['bo-crm-user-counts'],
    queryFn: async () => {
      const counts: Record<string, { total: number; students: number; formations: number }> = {};
      for (const e of establishments) {
        const [users, students, formations] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact', head: true }).eq('establishment_id', e.id),
          supabase.from('users').select('id', { count: 'exact', head: true }).eq('establishment_id', e.id).eq('role', 'Étudiant'),
          supabase.from('formations').select('id', { count: 'exact', head: true }).eq('establishment_id', e.id),
        ]);
        counts[e.id] = { total: users.count || 0, students: students.count || 0, formations: formations.count || 0 };
      }
      return counts;
    },
    enabled: establishments.length > 0,
  });

  const { data: subscriptions = {} } = useQuery({
    queryKey: ['bo-crm-subs'],
    queryFn: async () => {
      const { data } = await supabase.from('establishment_subscriptions').select('*');
      const map: Record<string, any> = {};
      (data || []).forEach((s: any) => { map[s.establishment_id] = s; });
      return map;
    },
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['bo-crm-notes', selectedId],
    queryFn: async () => {
      const { data } = await supabase.from('crm_notes').select('*').eq('establishment_id', selectedId!).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!selectedId,
  });

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('crm_notes').insert({ establishment_id: selectedId, author_id: user?.id, content: noteContent, note_type: noteType } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bo-crm-notes', selectedId] });
      setShowNote(false);
      setNoteContent('');
      toast.success('Note ajoutee');
    },
  });

  const filtered = establishments.filter((e: any) => e.name?.toLowerCase().includes(search.toLowerCase()));
  const selected = establishments.find((e: any) => e.id === selectedId);

  const noteIcons: Record<string, any> = { note: StickyNote, call: Phone, email: Mail, meeting: Video };
  const PLAN_LABELS: Record<string, string> = { free: 'Gratuit', starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' };

  // Detail view
  if (selectedId && selected) {
    const counts = userCounts[selectedId] || { total: 0, students: 0, formations: 0 };
    const sub = subscriptions[selectedId];
    return (
      <div className="p-6 space-y-5" data-testid="bo-crm-detail">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}><ArrowLeft className="h-4 w-4 mr-1" />Retour</Button>
          <h2 className="text-lg font-bold">{selected.name}</h2>
          <Badge className={STATUS_COLORS['Actif'] || 'bg-muted'}>{selected.type || 'CFA'}</Badge>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><p className="text-[10px] text-muted-foreground uppercase">Utilisateurs</p><p className="text-2xl font-bold">{counts.total}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-[10px] text-muted-foreground uppercase">Etudiants</p><p className="text-2xl font-bold">{counts.students}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-[10px] text-muted-foreground uppercase">Formations</p><p className="text-2xl font-bold">{counts.formations}</p></CardContent></Card>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold">Informations</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><p className="text-muted-foreground">Email</p><p className="font-medium">{selected.email || '—'}</p></div>
                <div><p className="text-muted-foreground">Telephone</p><p className="font-medium">{selected.phone || '—'}</p></div>
                <div><p className="text-muted-foreground">Type</p><p className="font-medium">{selected.type || '—'}</p></div>
                <div><p className="text-muted-foreground">SIRET</p><p className="font-medium">{selected.siret || '—'}</p></div>
                <div><p className="text-muted-foreground">Inscription</p><p className="font-medium">{format(new Date(selected.created_at), 'dd MMM yyyy', { locale: fr })}</p></div>
                <div><p className="text-muted-foreground">Plan</p><p className="font-medium">{sub ? PLAN_LABELS[sub.plan] || sub.plan : 'Aucun'}{sub?.amount_monthly > 0 ? ` (${sub.amount_monthly} EUR/mois)` : ''}</p></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Notes & Historique</h3>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setShowNote(true)} data-testid="add-crm-note"><Plus className="h-3 w-3" />Ajouter</Button>
              </div>
              {notes.length === 0 ? <p className="text-xs text-muted-foreground">Aucune note</p> : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notes.map((n: any) => {
                    const Icon = noteIcons[n.note_type] || StickyNote;
                    return (
                      <div key={n.id} className="flex gap-2 p-2 rounded-lg bg-muted/50">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs">{n.content}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(n.created_at), 'dd/MM/yy HH:mm', { locale: fr })}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={showNote} onOpenChange={setShowNote}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Ajouter une note</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="call">Appel</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Reunion</SelectItem>
                </SelectContent>
              </Select>
              <Textarea value={noteContent} onChange={e => setNoteContent(e.target.value)} placeholder="Contenu de la note..." rows={4} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNote(false)}>Annuler</Button>
              <Button onClick={() => addNoteMutation.mutate()} disabled={!noteContent.trim()}>Ajouter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // List view
  return (
    <div className="p-6 space-y-4" data-testid="bo-crm">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">CRM</h1><p className="text-sm text-muted-foreground">{establishments.length} etablissement(s)</p></div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="grid gap-3">
        {filtered.map((e: any) => {
          const counts = userCounts[e.id] || { total: 0, students: 0, formations: 0 };
          const sub = subscriptions[e.id];
          return (
            <Card key={e.id} className="hover:ring-2 hover:ring-primary/30 cursor-pointer transition-all" onClick={() => setSelectedId(e.id)} data-testid={`crm-estab-${e.id}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {e.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{e.name}</p>
                    <Badge className={`${STATUS_COLORS['Actif'] || 'bg-muted'} text-[9px]`}>{e.type || 'CFA'}</Badge>
                    {sub && <Badge variant="outline" className="text-[9px]">{PLAN_LABELS[sub.plan] || sub.plan}</Badge>}
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                    <span><Users className="h-3 w-3 inline mr-1" />{counts.total}</span>
                    <span><GraduationCap className="h-3 w-3 inline mr-1" />{counts.students}</span>
                    <span><BookOpen className="h-3 w-3 inline mr-1" />{counts.formations}</span>
                    <span><Calendar className="h-3 w-3 inline mr-1" />{format(new Date(e.created_at), 'dd/MM/yy')}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BOCrm;
