import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/hooks/useEstablishment';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { format, isAfter, isBefore, addMinutes, subMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Video, Calendar, Clock, Users, ExternalLink,
  CheckCircle2, Play, Timer, CircleDot,
} from 'lucide-react';

interface VirtualClassItem {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration: number;
  join_url: string | null;
  status: string;
  provider: string;
  formation_title: string | null;
  instructor_name: string | null;
}

type ClassStatus = 'upcoming' | 'live' | 'ended';

function getClassStatus(scheduledAt: string, duration: number): ClassStatus {
  const now = new Date();
  const start = new Date(scheduledAt);
  const end = addMinutes(start, duration);

  if (isAfter(now, end)) return 'ended';
  if (isAfter(now, subMinutes(start, 15)) && isBefore(now, end)) return 'live';
  return 'upcoming';
}

function getTimeUntil(scheduledAt: string): string {
  const now = new Date();
  const start = new Date(scheduledAt);
  const diffMs = start.getTime() - now.getTime();
  if (diffMs <= 0) return '';

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `dans ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `dans ${diffHours}h${diffMins % 60 > 0 ? `${String(diffMins % 60).padStart(2, '0')}` : ''}`;
  const diffDays = Math.floor(diffHours / 24);
  return `dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
}

const StudentVirtualClasses: React.FC = () => {
  const { establishment } = useEstablishment();
  const { userId, userRole } = useCurrentUser();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'ended'>('all');

  // Fetch virtual classes for this user's establishment + formations
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['student-virtual-classes', establishment?.id, userId],
    queryFn: async () => {
      // Get user's formation assignments
      const { data: assignments } = await supabase
        .from('user_formation_assignments')
        .select('formation_id')
        .eq('user_id', userId || '');

      const formationIds = (assignments || []).map((a: any) => a.formation_id);

      // Get virtual classes for the establishment
      let query = supabase
        .from('virtual_classes')
        .select('*')
        .eq('establishment_id', establishment?.id || '')
        .in('status', ['pending', 'synced'])
        .order('scheduled_at', { ascending: true });

      const { data: allClasses, error } = await query;
      if (error) throw error;

      // Filter: classes linked to user's formations OR with no formation (establishment-wide)
      const relevantClasses = (allClasses || []).filter((vc: any) =>
        !vc.formation_id || formationIds.includes(vc.formation_id)
      );

      // Get formation titles and instructor names
      const fIds = [...new Set(relevantClasses.map((vc: any) => vc.formation_id).filter(Boolean))];
      const iIds = [...new Set(relevantClasses.map((vc: any) => vc.instructor_id).filter(Boolean))];

      const { data: formations } = fIds.length > 0
        ? await supabase.from('formations').select('id, title').in('id', fIds)
        : { data: [] };
      const { data: instructors } = iIds.length > 0
        ? await supabase.from('users').select('id, first_name, last_name').in('id', iIds)
        : { data: [] };

      const formationMap = new Map((formations || []).map((f: any) => [f.id, f.title]));
      const instructorMap = new Map((instructors || []).map((i: any) => [i.id, `${i.first_name} ${i.last_name}`]));

      return relevantClasses.map((vc: any) => ({
        id: vc.id,
        title: vc.title,
        description: vc.description,
        scheduled_at: vc.scheduled_at,
        duration: vc.duration,
        join_url: vc.join_url,
        status: vc.status,
        provider: vc.provider,
        formation_title: vc.formation_id ? formationMap.get(vc.formation_id) || null : null,
        instructor_name: vc.instructor_id ? instructorMap.get(vc.instructor_id) || null : null,
      })) as VirtualClassItem[];
    },
    enabled: !!establishment?.id && !!userId,
    refetchInterval: 30000, // Refresh every 30s to update live status
  });

  const classesWithStatus = useMemo(() =>
    classes.map(c => ({ ...c, liveStatus: getClassStatus(c.scheduled_at, c.duration) })),
    [classes]
  );

  const filteredClasses = useMemo(() => {
    if (filter === 'all') return classesWithStatus;
    return classesWithStatus.filter(c => c.liveStatus === filter);
  }, [classesWithStatus, filter]);

  const liveCount = classesWithStatus.filter(c => c.liveStatus === 'live').length;
  const upcomingCount = classesWithStatus.filter(c => c.liveStatus === 'upcoming').length;

  if (isLoading) return <LoadingState message="Chargement des classes virtuelles..." />;

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6 lg:p-8" data-testid="student-virtual-classes">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Video className="h-6 w-6 text-primary" />
            Classes virtuelles
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {liveCount > 0 && (
              <span className="text-emerald-600 font-medium">{liveCount} en cours · </span>
            )}
            {upcomingCount} à venir
          </p>
        </div>
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="vc-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les classes</SelectItem>
            <SelectItem value="live">En cours</SelectItem>
            <SelectItem value="upcoming">À venir</SelectItem>
            <SelectItem value="ended">Terminées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Live classes banner */}
      {liveCount > 0 && filter !== 'ended' && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 animate-pulse-slow">
          <div className="flex items-center gap-2 mb-2">
            <CircleDot className="h-4 w-4 text-emerald-600 animate-pulse" />
            <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              {liveCount} classe{liveCount > 1 ? 's' : ''} en cours
            </span>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Cliquez sur "Participer" pour rejoindre la session.
          </p>
        </div>
      )}

      {/* Classes list */}
      {filteredClasses.length === 0 ? (
        <EmptyState
          icon={Video}
          title={filter === 'all' ? 'Aucune classe virtuelle' : `Aucune classe ${filter === 'live' ? 'en cours' : filter === 'upcoming' ? 'à venir' : 'terminée'}`}
          description="Les classes virtuelles créées par votre établissement apparaîtront ici."
        />
      ) : (
        <div className="space-y-3">
          {filteredClasses.map((vc) => (
            <VirtualClassCard key={vc.id} vc={vc} liveStatus={vc.liveStatus} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Card component ───
const VirtualClassCard: React.FC<{
  vc: VirtualClassItem;
  liveStatus: ClassStatus;
}> = ({ vc, liveStatus }) => {
  const isLive = liveStatus === 'live';
  const isUpcoming = liveStatus === 'upcoming';
  const isEnded = liveStatus === 'ended';
  const canJoin = isLive && vc.join_url;
  const timeUntil = isUpcoming ? getTimeUntil(vc.scheduled_at) : '';

  return (
    <Card
      className={`overflow-hidden transition-all ${
        isLive ? 'ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/10' : ''
      } ${isEnded ? 'opacity-60' : ''}`}
      data-testid={`vc-card-${vc.id}`}
    >
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Left color bar */}
          <div className={`w-full sm:w-1.5 h-1.5 sm:h-auto ${
            isLive ? 'bg-emerald-500' : isUpcoming ? 'bg-blue-500' : 'bg-muted-foreground/30'
          }`} />

          <div className="flex-1 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              {/* Info */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">{vc.title}</h3>
                  {isLive && (
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 gap-1 animate-pulse">
                      <CircleDot className="h-3 w-3" />En cours
                    </Badge>
                  )}
                  {isUpcoming && timeUntil && (
                    <Badge variant="outline" className="gap-1 text-blue-600 border-blue-200">
                      <Timer className="h-3 w-3" />{timeUntil}
                    </Badge>
                  )}
                  {isEnded && (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />Terminée
                    </Badge>
                  )}
                </div>

                {vc.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{vc.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                    {format(new Date(vc.scheduled_at), "EEEE d MMMM yyyy", { locale: fr })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                    {format(new Date(vc.scheduled_at), "HH:mm", { locale: fr })} · {vc.duration} min
                  </span>
                  {vc.formation_title && (
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 flex-shrink-0" />
                      {vc.formation_title}
                    </span>
                  )}
                  {vc.instructor_name && (
                    <span className="text-xs">Formateur : {vc.instructor_name}</span>
                  )}
                </div>
              </div>

              {/* Action button */}
              <div className="flex-shrink-0">
                {canJoin ? (
                  <Button
                    asChild
                    size="lg"
                    className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25"
                    data-testid={`join-vc-${vc.id}`}
                  >
                    <a href={vc.join_url!} target="_blank" rel="noopener noreferrer">
                      <Play className="h-4 w-4" />
                      Participer
                    </a>
                  </Button>
                ) : isUpcoming && vc.join_url ? (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto gap-2 cursor-not-allowed opacity-60"
                    disabled
                    data-testid={`waiting-vc-${vc.id}`}
                  >
                    <Clock className="h-4 w-4" />
                    Pas encore commencée
                  </Button>
                ) : isUpcoming ? (
                  <Badge variant="outline" className="px-4 py-2 text-sm">
                    <Clock className="h-3.5 w-3.5 mr-1.5" />À venir
                  </Badge>
                ) : isEnded ? (
                  <Badge variant="secondary" className="px-4 py-2 text-sm">Terminée</Badge>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentVirtualClasses;
