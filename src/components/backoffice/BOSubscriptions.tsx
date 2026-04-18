import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CreditCard, TrendingUp, DollarSign, Users, Building2, Edit, Search, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

const PLAN_CONFIG: Record<string, { label: string; price: number; color: string; features: string }> = {
  free: { label: 'Gratuit', price: 0, color: 'bg-gray-100 text-gray-700', features: '5 utilisateurs, 1 formation' },
  starter: { label: 'Starter', price: 49, color: 'bg-blue-100 text-blue-700', features: '25 utilisateurs, 5 formations' },
  pro: { label: 'Pro', price: 149, color: 'bg-purple-100 text-purple-700', features: 'Illimite, toutes fonctionnalites' },
  enterprise: { label: 'Enterprise', price: 399, color: 'bg-amber-100 text-amber-700', features: 'Sur mesure, support dedie' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: 'Actif', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  trial: { label: 'Essai', color: 'bg-amber-100 text-amber-700', icon: Clock },
  past_due: { label: 'Impaye', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  cancelled: { label: 'Annule', color: 'bg-gray-100 text-gray-700', icon: XCircle },
};

const BOSubscriptions: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editSub, setEditSub] = useState<any>(null);
  const [editPlan, setEditPlan] = useState('');
  const [editStatus, setEditStatus] = useState('');

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['bo-subscriptions'],
    queryFn: async () => {
      const { data: subs } = await supabase.from('establishment_subscriptions').select('*, establishments(id, name)').order('created_at', { ascending: false });
      return subs || [];
    },
  });

  const { data: establishments = [] } = useQuery({
    queryKey: ['bo-sub-establishments'],
    queryFn: async () => {
      const { data } = await supabase.from('establishments').select('id, name').order('name');
      return data || [];
    },
  });

  // Establishments without subscription
  const unsubscribed = establishments.filter((e: any) => !subscriptions.find((s: any) => s.establishment_id === e.id));

  const updateSub = useMutation({
    mutationFn: async () => {
      const planPrice = PLAN_CONFIG[editPlan]?.price || 0;
      await supabase.from('establishment_subscriptions').update({
        plan: editPlan, status: editStatus, amount_monthly: planPrice, updated_at: new Date().toISOString(),
      } as any).eq('id', editSub.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bo-subscriptions'] });
      setEditSub(null);
      toast.success('Abonnement mis a jour');
    },
  });

  const createSub = async (establishmentId: string, plan: string) => {
    await supabase.from('establishment_subscriptions').insert({
      establishment_id: establishmentId, plan, status: 'active', amount_monthly: PLAN_CONFIG[plan]?.price || 0,
    } as any);
    queryClient.invalidateQueries({ queryKey: ['bo-subscriptions'] });
    toast.success('Abonnement cree');
  };

  // Revenue metrics
  const mrr = subscriptions.filter((s: any) => s.status === 'active').reduce((sum: number, s: any) => sum + (parseFloat(s.amount_monthly) || 0), 0);
  const arr = mrr * 12;
  const activeCount = subscriptions.filter((s: any) => s.status === 'active').length;
  const trialCount = subscriptions.filter((s: any) => s.status === 'trial').length;

  const filtered = subscriptions.filter((s: any) => s.establishments?.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-5" data-testid="bo-subscriptions">
      <div><h1 className="text-2xl font-bold">Abonnements & Revenus</h1><p className="text-sm text-muted-foreground">{subscriptions.length} abonnement(s)</p></div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4"><p className="text-[10px] text-muted-foreground uppercase">MRR</p><p className="text-xl font-bold text-emerald-600">{mrr.toFixed(0)} EUR</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4"><p className="text-[10px] text-muted-foreground uppercase">ARR</p><p className="text-xl font-bold text-blue-600">{arr.toFixed(0)} EUR</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4"><p className="text-[10px] text-muted-foreground uppercase">Actifs</p><p className="text-xl font-bold text-purple-600">{activeCount}</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4"><p className="text-[10px] text-muted-foreground uppercase">En essai</p><p className="text-xl font-bold text-amber-600">{trialCount}</p></CardContent>
        </Card>
      </div>

      {/* Plan breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(PLAN_CONFIG).map(([key, plan]) => {
          const count = subscriptions.filter((s: any) => s.plan === key).length;
          return (
            <Card key={key}>
              <CardContent className="p-3 text-center">
                <Badge className={`${plan.color} text-[10px] mb-1`}>{plan.label}</Badge>
                <p className="text-lg font-bold">{count}</p>
                <p className="text-[10px] text-muted-foreground">{plan.price > 0 ? `${plan.price} EUR/mois` : 'Gratuit'}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* Unsubscribed establishments */}
      {unsubscribed.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Etablissements sans abonnement ({unsubscribed.length})</p>
            <div className="flex flex-wrap gap-2">
              {unsubscribed.map((e: any) => (
                <Button key={e.id} variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => createSub(e.id, 'free')}>
                  <Building2 className="h-3 w-3" />{e.name} — Ajouter
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscriptions list */}
      <Card>
        <CardContent className="p-0">
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase border-b bg-muted/30">
            <div className="col-span-3">Etablissement</div>
            <div className="col-span-2 text-center">Plan</div>
            <div className="col-span-2 text-center">Statut</div>
            <div className="col-span-2 text-center">Montant</div>
            <div className="col-span-2 text-center">Periode</div>
            <div className="col-span-1 text-right">Action</div>
          </div>
          {filtered.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Aucun abonnement</p> : (
            <div className="divide-y">
              {filtered.map((s: any) => {
                const planConf = PLAN_CONFIG[s.plan] || PLAN_CONFIG.free;
                const statConf = STATUS_CONFIG[s.status] || STATUS_CONFIG.active;
                const StatusIcon = statConf.icon;
                return (
                  <div key={s.id} className="px-4 py-2.5 hover:bg-muted/30" data-testid={`sub-${s.id}`}>
                    <div className="hidden sm:grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-3 text-sm font-medium truncate">{s.establishments?.name}</div>
                      <div className="col-span-2 text-center"><Badge className={`${planConf.color} text-[10px]`}>{planConf.label}</Badge></div>
                      <div className="col-span-2 text-center"><Badge className={`${statConf.color} text-[10px] gap-0.5`}><StatusIcon className="h-3 w-3" />{statConf.label}</Badge></div>
                      <div className="col-span-2 text-center text-sm font-bold">{parseFloat(s.amount_monthly || 0).toFixed(0)} EUR</div>
                      <div className="col-span-2 text-center text-xs text-muted-foreground">{s.current_period_end ? format(new Date(s.current_period_end), 'dd/MM/yy') : '—'}</div>
                      <div className="col-span-1 text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditSub(s); setEditPlan(s.plan); setEditStatus(s.status); }} data-testid={`edit-sub-${s.id}`}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {/* Mobile */}
                    <div className="sm:hidden flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{s.establishments?.name}</p>
                        <div className="flex gap-1.5 mt-0.5"><Badge className={`${planConf.color} text-[9px]`}>{planConf.label}</Badge><Badge className={`${statConf.color} text-[9px]`}>{statConf.label}</Badge></div>
                      </div>
                      <span className="text-sm font-bold">{parseFloat(s.amount_monthly || 0).toFixed(0)} EUR</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editSub} onOpenChange={v => { if (!v) setEditSub(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Modifier l'abonnement — {editSub?.establishments?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Plan</label>
              <Select value={editPlan} onValueChange={setEditPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(PLAN_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label} — {v.price} EUR/mois</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">{PLAN_CONFIG[editPlan]?.features}</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Statut</label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSub(null)}>Annuler</Button>
            <Button onClick={() => updateSub.mutate()}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BOSubscriptions;
