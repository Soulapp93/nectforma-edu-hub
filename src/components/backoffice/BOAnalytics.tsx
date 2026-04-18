import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart3, Users, Building2, Activity, TrendingUp, Clock, GraduationCap, Eye, BookOpen, FileText, MessageSquare } from 'lucide-react';

const BOAnalytics: React.FC = () => {
  // Global stats
  const { data: globalStats } = useQuery({
    queryKey: ['bo-analytics-global'],
    queryFn: async () => {
      const [estab, users, students, formateurs, formations, modules, posts] = await Promise.all([
        supabase.from('establishments').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'Étudiant'),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'Formateur'),
        supabase.from('formations').select('id', { count: 'exact', head: true }),
        supabase.from('formation_modules').select('id', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('id, views_count').eq('status', 'published'),
      ]);
      const totalViews = (posts.data || []).reduce((s: number, p: any) => s + (p.views_count || 0), 0);
      return {
        establishments: estab.count || 0,
        users: users.count || 0,
        students: students.count || 0,
        formateurs: formateurs.count || 0,
        formations: formations.count || 0,
        modules: modules.count || 0,
        blogViews: totalViews,
        publishedPosts: posts.data?.length || 0,
      };
    },
  });

  // Activity data (users created per day last 30 days)
  const { data: activityData = [] } = useQuery({
    queryKey: ['bo-analytics-activity'],
    queryFn: async () => {
      const since = subDays(new Date(), 30).toISOString();
      const { data } = await supabase.from('users').select('created_at').gte('created_at', since).order('created_at');
      return data || [];
    },
  });

  // Top establishments by user count
  const { data: topEstablishments = [] } = useQuery({
    queryKey: ['bo-analytics-top-estab'],
    queryFn: async () => {
      const { data: establishments } = await supabase.from('establishments').select('id, name');
      if (!establishments) return [];
      const results: { name: string; users: number; formations: number }[] = [];
      for (const e of establishments) {
        const [u, f] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact', head: true }).eq('establishment_id', e.id),
          supabase.from('formations').select('id', { count: 'exact', head: true }).eq('establishment_id', e.id),
        ]);
        results.push({ name: e.name, users: u.count || 0, formations: f.count || 0 });
      }
      return results.sort((a, b) => b.users - a.users).slice(0, 10);
    },
  });

  // Feature usage
  const { data: featureUsage } = useQuery({
    queryKey: ['bo-analytics-features'],
    queryFn: async () => {
      const [attendance, evaluations, tickets, diplomas, transcripts, chatMessages] = await Promise.all([
        supabase.from('attendance_sheets').select('id', { count: 'exact', head: true }),
        supabase.from('evaluations').select('id', { count: 'exact', head: true }),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }),
        supabase.from('generated_diplomas').select('id', { count: 'exact', head: true }),
        supabase.from('transcripts').select('id', { count: 'exact', head: true }),
        supabase.from('chat_messages').select('id', { count: 'exact', head: true }),
      ]);
      return [
        { name: 'Emargements', count: attendance.count || 0, icon: Clock },
        { name: 'Evaluations', count: evaluations.count || 0, icon: FileText },
        { name: 'Releves/Bulletins', count: transcripts.count || 0, icon: BookOpen },
        { name: 'Diplomes', count: diplomas.count || 0, icon: GraduationCap },
        { name: 'Messages chat', count: chatMessages.count || 0, icon: MessageSquare },
        { name: 'Tickets support', count: tickets.count || 0, icon: Activity },
      ];
    },
  });

  // Daily chart data
  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const count = activityData.filter((u: any) => u.created_at?.startsWith(dayStr)).length;
      return { date: format(day, 'dd/MM', { locale: fr }), count };
    });
  }, [activityData]);

  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  const stats = globalStats || { establishments: 0, users: 0, students: 0, formateurs: 0, formations: 0, modules: 0, blogViews: 0, publishedPosts: 0 };

  return (
    <div className="p-6 space-y-6" data-testid="bo-analytics">
      <div><h1 className="text-2xl font-bold">Analytics</h1><p className="text-sm text-muted-foreground">Metriques globales de la plateforme</p></div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Etablissements', value: stats.establishments, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Utilisateurs', value: stats.users, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Etudiants', value: stats.students, icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Formateurs', value: stats.formateurs, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Formations', value: stats.formations, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Modules', value: stats.modules, icon: FileText, color: 'text-pink-600', bg: 'bg-pink-50' },
          { label: 'Vues blog', value: stats.blogViews, icon: Eye, color: 'text-cyan-600', bg: 'bg-cyan-50' },
          { label: 'Articles publies', value: stats.publishedPosts, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <div><p className="text-lg font-bold">{s.value}</p><p className="text-[10px] text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity chart */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Nouveaux utilisateurs (30 derniers jours)</h3>
          <div className="flex items-end gap-[2px] h-32">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative" title={`${d.date}: ${d.count} utilisateur(s)`}>
                <div className="w-full rounded-t transition-all bg-primary/60 hover:bg-primary min-h-[2px]" style={{ height: `${Math.max(2, (d.count / maxCount) * 100)}%` }} />
                {i % 5 === 0 && <span className="text-[7px] text-muted-foreground rotate-0 mt-1">{d.date}</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Top establishments */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Building2 className="h-4 w-4 text-blue-500" />Top etablissements</h3>
            <div className="space-y-2">
              {topEstablishments.map((e: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4">{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium truncate">{e.name}</span>
                      <span className="text-xs text-muted-foreground">{e.users} util.</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary/60 rounded-full" style={{ width: `${(e.users / (topEstablishments[0]?.users || 1)) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
              {topEstablishments.length === 0 && <p className="text-xs text-muted-foreground">Aucun</p>}
            </div>
          </CardContent>
        </Card>

        {/* Feature usage */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Activity className="h-4 w-4 text-emerald-500" />Utilisation des fonctionnalites</h3>
            <div className="space-y-2.5">
              {(featureUsage || []).map((f: any) => (
                <div key={f.name} className="flex items-center gap-3">
                  <f.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium">{f.name}</span>
                      <span className="text-xs font-bold">{f.count}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500/60 rounded-full" style={{ width: `${Math.min(100, (f.count / (Math.max(...(featureUsage || []).map((x: any) => x.count)) || 1)) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BOAnalytics;
