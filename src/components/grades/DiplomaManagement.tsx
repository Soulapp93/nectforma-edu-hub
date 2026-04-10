import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/hooks/useEstablishment';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Medal, Search, GraduationCap, Calendar, Users,
  FileText, CheckCircle2, Clock, XCircle, Download, Eye,
} from 'lucide-react';

interface DiplomaStudent {
  student_id: string;
  student_name: string;
  formation_title: string;
  formation_id: string;
  general_average: number | null;
  decision: string | null;
  mention: string | null;
  jury_date: string | null;
  transcript_id: string;
  is_published: boolean;
}

const DECISION_LABELS: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  admis: { label: 'Admis', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: CheckCircle2 },
  ajourne: { label: 'Ajourné', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
  rattrapage: { label: 'Rattrapage', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: Clock },
  en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: Clock },
};

const MENTION_LABELS: Record<string, string> = {
  tres_bien: 'Très bien',
  bien: 'Bien',
  assez_bien: 'Assez bien',
  passable: 'Passable',
};

const DiplomaManagement: React.FC = () => {
  const { establishment } = useEstablishment();
  const { userId } = useCurrentUser();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFormation, setFilterFormation] = useState<string>('all');
  const [filterDecision, setFilterDecision] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<DiplomaStudent | null>(null);

  // Fetch formations for this establishment
  const { data: formations = [] } = useQuery({
    queryKey: ['diploma-formations', establishment?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formations')
        .select('id, title')
        .eq('establishment_id', establishment?.id || '')
        .order('title');
      if (error) throw error;
      return data || [];
    },
    enabled: !!establishment?.id,
  });

  // Fetch transcripts with student info
  const { data: diplomaStudents = [], isLoading } = useQuery({
    queryKey: ['diploma-students', establishment?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transcripts')
        .select(`
          id, student_id, formation_id, general_average, decision, mention, 
          jury_date, is_published, pdf_url,
          formations!inner(title, establishment_id)
        `)
        .eq('formations.establishment_id', establishment?.id || '')
        .not('decision', 'is', null)
        .order('jury_date', { ascending: false });
      if (error) throw error;

      // Get student names
      const studentIds = [...new Set((data || []).map((t: any) => t.student_id))];
      const { data: students } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .in('id', studentIds.length > 0 ? studentIds : ['none']);

      const studentMap = new Map((students || []).map((s: any) => [s.id, `${s.first_name} ${s.last_name}`]));

      return (data || []).map((t: any) => ({
        transcript_id: t.id,
        student_id: t.student_id,
        student_name: studentMap.get(t.student_id) || 'Étudiant inconnu',
        formation_title: t.formations?.title || '',
        formation_id: t.formation_id,
        general_average: t.general_average,
        decision: t.decision,
        mention: t.mention,
        jury_date: t.jury_date,
        is_published: t.is_published,
      })) as DiplomaStudent[];
    },
    enabled: !!establishment?.id,
  });

  const filteredStudents = useMemo(() => {
    return diplomaStudents.filter(s => {
      if (filterFormation !== 'all' && s.formation_id !== filterFormation) return false;
      if (filterDecision !== 'all' && s.decision !== filterDecision) return false;
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        return s.student_name.toLowerCase().includes(lower) || s.formation_title.toLowerCase().includes(lower);
      }
      return true;
    });
  }, [diplomaStudents, filterFormation, filterDecision, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const admis = diplomaStudents.filter(s => s.decision === 'admis').length;
    const ajourne = diplomaStudents.filter(s => s.decision === 'ajourne').length;
    const rattrapage = diplomaStudents.filter(s => s.decision === 'rattrapage').length;
    return { total: diplomaStudents.length, admis, ajourne, rattrapage };
  }, [diplomaStudents]);

  const publishMutation = useMutation({
    mutationFn: async (transcriptId: string) => {
      const { error } = await supabase
        .from('transcripts')
        .update({ is_published: true, published_at: new Date().toISOString() } as any)
        .eq('id', transcriptId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diploma-students'] });
      toast.success('Diplôme publié avec succès');
      setSelectedStudent(null);
    },
    onError: () => toast.error('Erreur lors de la publication'),
  });

  if (isLoading) return <LoadingState message="Chargement des données de diplômes..." />;

  return (
    <div className="space-y-4 sm:space-y-6" data-testid="diploma-management">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Medal className="h-5 w-5 text-primary" />
          </div>
          <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total étudiants</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div><p className="text-2xl font-bold">{stats.admis}</p><p className="text-xs text-muted-foreground">Admis</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div><p className="text-2xl font-bold">{stats.rattrapage}</p><p className="text-xs text-muted-foreground">Rattrapage</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <div><p className="text-2xl font-bold">{stats.ajourne}</p><p className="text-xs text-muted-foreground">Ajournés</p></div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un étudiant..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" data-testid="diploma-search" />
        </div>
        <Select value={filterFormation} onValueChange={setFilterFormation}>
          <SelectTrigger className="w-full sm:w-[220px]" data-testid="diploma-filter-formation">
            <SelectValue placeholder="Formation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les formations</SelectItem>
            {formations.map((f: any) => (
              <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterDecision} onValueChange={setFilterDecision}>
          <SelectTrigger className="w-full sm:w-[160px]" data-testid="diploma-filter-decision">
            <SelectValue placeholder="Décision" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes décisions</SelectItem>
            <SelectItem value="admis">Admis</SelectItem>
            <SelectItem value="ajourne">Ajourné</SelectItem>
            <SelectItem value="rattrapage">Rattrapage</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Students list */}
      {filteredStudents.length === 0 ? (
        <EmptyState
          icon={Medal}
          title="Aucun résultat de jury"
          description="Les résultats de jury apparaîtront ici une fois les délibérations terminées dans la section Notes & Relevés."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Header desktop */}
            <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-3 text-xs font-medium text-muted-foreground border-b bg-muted/30">
              <div className="col-span-3">Étudiant</div>
              <div className="col-span-3">Formation</div>
              <div className="col-span-1 text-center">Moyenne</div>
              <div className="col-span-2 text-center">Décision</div>
              <div className="col-span-1 text-center">Mention</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            <div className="divide-y divide-border">
              {filteredStudents.map((student) => {
                const decisionInfo = DECISION_LABELS[student.decision || ''];
                const DecisionIcon = decisionInfo?.icon || Clock;
                return (
                  <div key={student.transcript_id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                    {/* Desktop */}
                    <div className="hidden sm:grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-3">
                        <p className="text-sm font-medium text-foreground truncate">{student.student_name}</p>
                        {student.jury_date && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            Jury : {format(new Date(student.jury_date), 'dd MMM yyyy', { locale: fr })}
                          </p>
                        )}
                      </div>
                      <div className="col-span-3">
                        <p className="text-sm text-muted-foreground truncate">{student.formation_title}</p>
                      </div>
                      <div className="col-span-1 text-center">
                        <span className="text-sm font-bold text-foreground">{student.general_average?.toFixed(2) ?? '—'}</span>
                        <span className="text-xs text-muted-foreground">/20</span>
                      </div>
                      <div className="col-span-2 flex justify-center">
                        {decisionInfo ? (
                          <Badge className={`${decisionInfo.color} gap-1`}>
                            <DecisionIcon className="h-3 w-3" />
                            {decisionInfo.label}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                      <div className="col-span-1 text-center text-sm">
                        {student.mention ? MENTION_LABELS[student.mention] || student.mention : '—'}
                      </div>
                      <div className="col-span-2 flex justify-end gap-1.5">
                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => setSelectedStudent(student)}>
                          <Eye className="h-3.5 w-3.5" />
                          Détails
                        </Button>
                      </div>
                    </div>
                    {/* Mobile */}
                    <div className="sm:hidden space-y-2" onClick={() => setSelectedStudent(student)}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{student.student_name}</p>
                          <p className="text-xs text-muted-foreground">{student.formation_title}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{student.general_average?.toFixed(2) ?? '—'}<span className="text-xs text-muted-foreground">/20</span></p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {decisionInfo && (
                          <Badge className={`${decisionInfo.color} gap-1 text-[10px]`}>
                            <DecisionIcon className="h-3 w-3" />
                            {decisionInfo.label}
                          </Badge>
                        )}
                        {student.mention && <Badge variant="outline" className="text-[10px]">{MENTION_LABELS[student.mention]}</Badge>}
                        {student.jury_date && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(student.jury_date), 'dd/MM/yy', { locale: fr })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-md" data-testid="diploma-detail-modal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5 text-primary" />
              Détails du diplôme
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/50 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{selectedStudent.student_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedStudent.formation_title}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-background border">
                    <p className="text-[10px] uppercase text-muted-foreground font-medium">Moyenne générale</p>
                    <p className="text-xl font-bold text-foreground">{selectedStudent.general_average?.toFixed(2) ?? '—'}<span className="text-sm text-muted-foreground">/20</span></p>
                  </div>
                  <div className="p-3 rounded-lg bg-background border">
                    <p className="text-[10px] uppercase text-muted-foreground font-medium">Décision du jury</p>
                    {(() => {
                      const info = DECISION_LABELS[selectedStudent.decision || ''];
                      const DIcon = info?.icon || Clock;
                      return info ? (
                        <Badge className={`${info.color} gap-1 mt-1`}><DIcon className="h-3 w-3" />{info.label}</Badge>
                      ) : <p className="text-sm text-muted-foreground mt-1">—</p>;
                    })()}
                  </div>
                  <div className="p-3 rounded-lg bg-background border">
                    <p className="text-[10px] uppercase text-muted-foreground font-medium">Mention</p>
                    <p className="text-sm font-medium text-foreground mt-1">{selectedStudent.mention ? MENTION_LABELS[selectedStudent.mention] : '—'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background border">
                    <p className="text-[10px] uppercase text-muted-foreground font-medium">Date jury</p>
                    <p className="text-sm font-medium text-foreground mt-1">
                      {selectedStudent.jury_date ? format(new Date(selectedStudent.jury_date), 'dd MMMM yyyy', { locale: fr }) : '—'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Statut :</span>
                {selectedStudent.is_published ? (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Publié</Badge>
                ) : (
                  <Badge variant="outline">Non publié</Badge>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            {selectedStudent && !selectedStudent.is_published && (
              <Button
                onClick={() => publishMutation.mutate(selectedStudent.transcript_id)}
                disabled={publishMutation.isPending}
                className="gap-2"
                data-testid="publish-diploma-btn"
              >
                <CheckCircle2 className="h-4 w-4" />
                Publier le résultat
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedStudent(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiplomaManagement;
