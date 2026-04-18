import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Users, GraduationCap, Headphones, CreditCard, TrendingUp, Activity, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const BODashboard: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['bo-dashboard-stats'],
    queryFn: async () => {
      const [estab, users, students, tickets, subs, posts] = await Promise.all([
        supabase.from('establishments').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'Étudiant'),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('establishment_subscriptions').select('id, amount_monthly'),
        supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      ]);
      const mrr = (subs.data || []).reduce((s: number, r: any) => s + (parseFloat(r.amount_monthly) || 0), 0);
      return {
        establishments: estab.count || 0,
        users: users.count || 0,
        students: students.count || 0,
        openTickets: tickets.count || 0,
        mrr,
        publishedPosts: posts.count || 0,
      };
    },
  });

  const { data: recentEstablishments = [] } = useQuery({
    queryKey: ['bo-recent-establishments'],
    queryFn: async () => {
      const { data } = await supabase.from('establishments').select('id, name, created_at').order('created_at', { ascending: false }).limit(5);
      return data || [];
    },
  });

  const { data: recentTickets = [] } = useQuery({
    queryKey: ['bo-recent-tickets'],
    queryFn: async () => {
      const { data } = await supabase.from('support_tickets').select('id, subject, status, priority, created_at').order('created_at', { ascending: false }).limit(5);
      return data || [];
    },
  });

  const statCards = [
    { label: 'Etablissements', value: stats?.establishments || 0, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Utilisateurs', value: stats?.users || 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Etudiants', value: stats?.students || 0, icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Tickets ouverts', value: stats?.openTickets || 0, icon: Headphones, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'MRR', value: `${(stats?.mrr || 0).toFixed(0)} EUR`, icon: CreditCard, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Articles publies', value: stats?.publishedPosts || 0, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const priorityColors: Record<string, string> = { urgent: 'bg-red-100 text-red-700', high: 'bg-orange-100 text-orange-700', medium: 'bg-blue-100 text-blue-700', low: 'bg-gray-100 text-gray-700' };
  const statusColors: Record<string, string> = { open: 'bg-amber-100 text-amber-700', in_progress: 'bg-blue-100 text-blue-700', resolved: 'bg-emerald-100 text-emerald-700', closed: 'bg-gray-100 text-gray-700' };

  return (
    <div className="p-6 space-y-6" data-testid="bo-dashboard">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Vue d'ensemble de Nectforma</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                <s.icon className={`h-4.5 w-4.5 ${s.color}`} />
              </div>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" />Derniers etablissements</h3>
            {recentEstablishments.length === 0 ? <p className="text-xs text-muted-foreground">Aucun</p> : (
              <div className="space-y-2">
                {recentEstablishments.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <span className="text-sm font-medium">{e.name}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(e.created_at), 'dd MMM yyyy', { locale: fr })}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Headphones className="h-4 w-4 text-amber-500" />Derniers tickets</h3>
            {recentTickets.length === 0 ? <p className="text-xs text-muted-foreground">Aucun ticket</p> : (
              <div className="space-y-2">
                {recentTickets.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.subject}</p>
                      <div className="flex gap-1.5 mt-0.5">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[t.status] || ''}`}>{t.status}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${priorityColors[t.priority] || ''}`}>{t.priority}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{format(new Date(t.created_at), 'dd/MM', { locale: fr })}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BODashboard;
