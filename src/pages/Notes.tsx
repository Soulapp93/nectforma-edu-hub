import React, { useState, useMemo, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEstablishment } from '@/hooks/useEstablishment';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileSpreadsheet, FileText, Settings2, GraduationCap, ClipboardList,
  ArrowLeft, Calendar, Users, ChevronRight, Clock, BookOpen, Search,
  Calculator, Scale, ScrollText, Plus, X
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteEvaluationPeriod } from '@/services/gradesService';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { getEvaluationPeriods } from '@/services/gradesService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';

// Lazy load heavy grade components
const GradeSheetView = React.lazy(() => import('@/components/grades/GradeSheetView'));
const StudentGradesView = React.lazy(() => import('@/components/grades/StudentGradesView'));
const TranscriptsPanel = React.lazy(() => import('@/components/grades/TranscriptsPanel'));
const TutorGradesView = React.lazy(() => import('@/components/grades/TutorGradesView'));
const CalculValidation = React.lazy(() => import('@/components/grades/CalculValidation'));
const JuryDeliberation = React.lazy(() => import('@/components/grades/JuryDeliberation'));
const CreatePeriodModal = React.lazy(() => import('@/components/grades/CreatePeriodModal'));

const getLevelColor = (level?: string) => {
  const colors: Record<string, string> = {
    'BAC+1': 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300',
    'BAC+2': 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
    'BAC+3': 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
    'BAC+4': 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300',
    'BAC+5': 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300'
  };
  return colors[level || ''] || 'bg-muted text-muted-foreground';
};

const SIDEBAR_TABS = [
  { value: 'saisie', label: 'Saisie des notes', icon: FileSpreadsheet, description: 'CC · DS · Examen Final · Oral / Soutenance' },
  { value: 'calcul', label: 'Calcul & Validation', icon: Calculator, description: 'Moyennes, rangs et récapitulatif par filière' },
  { value: 'jury', label: 'Jury & Délibération', icon: Scale, description: 'Décisions officielles et procès-verbal' },
  { value: 'bulletin', label: 'Bulletin de notes', icon: ScrollText, description: 'Bulletins individuels par étudiant' },
];

const Notes = () => {
  const { userRole, userId } = useCurrentUser();
  const { establishment } = useEstablishment();
  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';
  const isFormateur = userRole === 'Formateur';
  const isStudent = userRole === 'Étudiant';
  const isTutor = userRole === 'Tuteur';

  const [selectedProgramName, setSelectedProgramName] = useState<string | null>(null);
  const [selectedFormationId, setSelectedFormationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('saisie');
  const [showCreatePeriod, setShowCreatePeriod] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<any>(null);
  const [periodToDelete, setPeriodToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const handleDeletePeriod = (periodId: string, periodName: string) => {
    setPeriodToDelete({ id: periodId, name: periodName });
  };
  const confirmDeletePeriod = async () => {
    if (!periodToDelete) return;
    setIsDeleting(true);
    try {
      await deleteEvaluationPeriod(periodToDelete.id);
      queryClient.invalidateQueries({ queryKey: ['evaluation-periods'] });
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      queryClient.invalidateQueries({ queryKey: ['periods-sheet'] });
      if (selectedPeriodId === periodToDelete.id) setSelectedPeriodId(null);
      toast.success(`Période "${periodToDelete.name}" supprimée`);
      setPeriodToDelete(null);
    } catch (e: any) {
      toast.error('Erreur : ' + (e?.message || 'suppression impossible'));
    } finally {
      setIsDeleting(false);
    }
  };

  const { data: formations = [], isLoading } = useQuery({
    queryKey: ['formations-notes-page', userId, isAdmin],
    queryFn: async () => {
      if (isAdmin) {
        const { data } = await supabase
          .from('formations')
          .select('id, title, status, color, level, start_date, end_date, max_students, academic_year, duration, duration_years, semesters_count, formation_type, establishment_id, formation_modules(id)')
          .eq('establishment_id', establishment?.id || '')
          .order('title');
        return data || [];
      }
      const { data } = await supabase
        .from('user_formation_assignments')
        .select('formation_id, formations(id, title, status, color, level, start_date, end_date, max_students, academic_year, duration, duration_years, semesters_count, formation_type, establishment_id, formation_modules(id))')
        .eq('user_id', userId!);
      return (data || []).map((d: any) => d.formations).filter(Boolean);
    },
    enabled: (isAdmin || isFormateur) && !!userId && !!establishment?.id,
  });

  const { data: studentCounts = {} } = useQuery({
    queryKey: ['formation-student-counts', formations.map((f: any) => f.id).join(',')],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const f of formations) {
        const { count } = await supabase
          .from('user_formation_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('formation_id', f.id);
        counts[f.id] = count || 0;
      }
      return counts;
    },
    enabled: formations.length > 0,
  });

  const selectedFormation = formations.find((f: any) => f.id === selectedFormationId);

  // Auto-select formation from URL param
  useEffect(() => {
    const fId = searchParams.get('formationId');
    if (fId && formations.length > 0 && !selectedFormationId) {
      const match = formations.find((f: any) => f.id === fId);
      if (match) {
        setSelectedFormationId(fId);
        setSelectedProgramName(match.title);
      }
    }
  }, [searchParams, formations, selectedFormationId]);

  const { data: periods = [] } = useQuery({
    queryKey: ['evaluation-periods', selectedFormationId],
    queryFn: () => getEvaluationPeriods(selectedFormationId!),
    enabled: !!selectedFormationId,
  });

  // Auto-select first period when periods load
  useEffect(() => {
    if (periods.length > 0 && !selectedPeriodId) {
      setSelectedPeriodId(periods[0].id);
    }
  }, [periods]);

  // Reset period when formation changes
  useEffect(() => {
    setSelectedPeriodId(null);
  }, [selectedFormationId]);

  const selectedPeriod = periods.find((p: any) => p.id === selectedPeriodId);

  const formationGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    formations.forEach((f: any) => {
      const name = f.title;
      if (!groups[name]) groups[name] = [];
      groups[name].push(f);
    });
    Object.values(groups).forEach(group => {
      group.sort((a: any, b: any) => (b.academic_year || '').localeCompare(a.academic_year || ''));
    });
    return groups;
  }, [formations]);

  const programNames = useMemo(() => Object.keys(formationGroups).sort(), [formationGroups]);

  const filteredPrograms = useMemo(() => {
    return programNames.filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [programNames, searchTerm]);

  const selectedGroupFormations = useMemo(() => {
    if (!selectedProgramName) return [];
    return formationGroups[selectedProgramName] || [];
  }, [selectedProgramName, formationGroups]);

  // Étudiant
  if (isStudent) {
    return (
      <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6">
        <PageHeader title="Mes notes" description="Consultez vos résultats et téléchargez vos relevés de notes" icon={GraduationCap} />
        <Tabs defaultValue="notes" className="space-y-4">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="notes" className="flex items-center gap-2"><ClipboardList className="h-4 w-4" />Mes notes</TabsTrigger>
            <TabsTrigger value="releves" className="flex items-center gap-2"><FileText className="h-4 w-4" />Mes relevés</TabsTrigger>
          </TabsList>
          <TabsContent value="notes"><StudentGradesView studentId={userId!} /></TabsContent>
          <TabsContent value="releves"><TranscriptsPanel mode="student" studentId={userId!} /></TabsContent>
        </Tabs>
      </div>
    );
  }

  // Tuteur
  if (isTutor) {
    return (
      <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6">
        <PageHeader title="Notes de l'apprenti" description="Consultez les résultats et relevés de notes de votre apprenti" icon={GraduationCap} />
        <TutorGradesView />
      </div>
    );
  }

  // ============ Formation detail view with sidebar ============
  if (selectedFormationId && selectedFormation) {
    
    // Each period is independent — group only by visual type for display order
    const semesterPeriods = periods.filter((p: any) => p.period_type === 'semestre');
    const examPeriods = periods.filter((p: any) => (p.period_type === 'examen_blanc' || p.period_type === 'examen_final' || p.period_type === 'partiels'));
    const otherPeriods = periods.filter((p: any) => !['semestre', 'examen_blanc', 'examen_final', 'partiels'].includes(p.period_type));
    
    return (
      <div className="p-4 md:p-6 pb-20 md:pb-6">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedFormationId(null); setActiveTab('saisie'); }} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">{selectedFormation.title}</Badge>
            {selectedFormation.level && <Badge variant="outline" className="text-xs">{selectedFormation.level}</Badge>}
            {selectedFormation.academic_year && <Badge variant="outline" className="text-xs">{selectedFormation.academic_year}</Badge>}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCreatePeriod(true)} className="gap-2" data-testid="create-period-btn">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Créer une période</span>
            </Button>
          </div>
        </div>

        {/* Periods navigation pills */}
        {periods.length > 0 && (
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1" data-testid="periods-nav">
            {[...semesterPeriods, ...examPeriods, ...otherPeriods].map((p: any, idx, arr) => {
              const isActive = selectedPeriodId === p.id;
              const isSemester = p.period_type === 'semestre';
              const isExam = ['examen_blanc', 'examen_final', 'partiels'].includes(p.period_type);

              // Visual separator between groups
              const prev = arr[idx - 1];
              const showSeparator = prev && ((
                (prev.period_type === 'semestre') !== isSemester
              ) || (
                (['examen_blanc', 'examen_final', 'partiels'].includes(prev.period_type)) !== isExam
              ));

              const activeColors = isSemester
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : isExam
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-blue-500 text-white border-blue-500 shadow-sm';
              const inactiveColors = p.is_locked
                ? 'bg-muted/50 text-muted-foreground border-muted opacity-60'
                : isSemester
                  ? 'bg-background border-border hover:bg-primary/10 hover:border-primary/50'
                  : isExam
                    ? 'bg-background border-amber-300 text-amber-700 hover:bg-amber-50'
                    : 'bg-background border-border hover:bg-blue-50';
              const dotColor = isActive
                ? 'bg-white'
                : p.is_locked
                  ? 'bg-red-400'
                  : isSemester
                    ? 'bg-emerald-400'
                    : isExam
                      ? 'bg-amber-400'
                      : 'bg-blue-400';

              return (
                <React.Fragment key={p.id}>
                  {showSeparator && <div className="w-px h-5 bg-border shrink-0" />}
                  <div className="relative group shrink-0">
                    <button
                      onClick={() => setSelectedPeriodId(p.id)}
                      className={`flex items-center gap-1.5 pl-3 ${isAdmin && !p.is_locked ? 'pr-12' : 'pr-3'} py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${isActive ? activeColors : inactiveColors}`}
                      data-testid={`period-pill-${p.id}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                      {p.name}
                    </button>
                    {isAdmin && !p.is_locked && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingPeriod(p); }}
                          className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hover:bg-primary/10 hover:text-primary rounded p-0.5 transition-opacity"
                          title="Modifier cette période"
                          data-testid={`period-edit-${p.id}`}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeletePeriod(p.id, p.name); }}
                          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 rounded p-0.5 transition-opacity"
                          title="Supprimer cette période"
                          data-testid={`period-delete-${p.id}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Empty state if no periods */}
        {periods.length === 0 && (
          <Card className="mb-4">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Calendar className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground text-sm font-medium">Aucune periode d'evaluation</p>
              <p className="text-muted-foreground/70 text-xs mb-3">Commencez par creer une periode (Semestre, Examen Blanc...)</p>
              <Button size="sm" onClick={() => setShowCreatePeriod(true)} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Creer une periode
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {/* Horizontal tab navigation */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-1.5 flex flex-wrap gap-1">
              {SIDEBAR_TABS.filter((t) => !t.adminOnly || isAdmin).map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    data-testid={`tab-${tab.value}`}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0`} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  </button>
                );
              })}

              {/* Periods info inline */}
              {periods.length > 0 && (
                <div className="hidden lg:flex items-center gap-2 ml-auto px-3">
                  <div className="w-px h-6 bg-border" />
                  {periods.slice(0, 4).map((p: any) => (
                    <div key={p.id} className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${p.is_locked ? 'bg-red-400' : 'bg-green-400'}`} />
                      {p.name}
                    </div>
                  ))}
                  {periods.length > 4 && <span className="text-[10px] text-muted-foreground">+{periods.length - 4}</span>}
                </div>
              )}
            </div>

            {/* Mobile bottom tab bar */}
            <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-card border-t border-border px-2 py-1.5 flex gap-1">
              {SIDEBAR_TABS.filter((t) => !t.adminOnly || isAdmin).map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[9px] ${
                      isActive ? 'text-primary bg-primary/10 font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label.split(' ')[0]}
                  </button>
                );
              })}
            </div>

            {/* Active period indicator */}
            {selectedPeriod && (
              <div className="bg-muted/40 rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">{selectedPeriod.name}</span>
                {selectedPeriod.is_locked && <Badge variant="destructive" className="text-[10px] px-1.5">Verrouille</Badge>}
              </div>
            )}

            {/* Main content - filtered by selected period */}
            <div>
              {activeTab === 'saisie' && (
                <GradeSheetView mode={isAdmin ? 'admin' : 'instructor'} formationId={selectedFormationId} periodId={selectedPeriodId} />
              )}
              {activeTab === 'calcul' && (
                <CalculValidation formationId={selectedFormationId} periodId={selectedPeriodId} />
              )}
              {activeTab === 'jury' && (
                <JuryDeliberation formationId={selectedFormationId} periodId={selectedPeriodId} />
              )}
              {activeTab === 'bulletin' && (
                <TranscriptsPanel mode="admin" formationId={selectedFormationId} periodId={selectedPeriodId} periodName={selectedPeriod?.name} />
              )}
            </div>
          </div>

        {/* Create / Edit period modal */}
        <CreatePeriodModal
          isOpen={showCreatePeriod || !!editingPeriod}
          onClose={() => { setShowCreatePeriod(false); setEditingPeriod(null); }}
          formationId={selectedFormationId}
          semestersCount={selectedFormation.semesters_count || (selectedFormation.duration_years || 1) * 2}
          existingPeriodsCount={periods.length}
          editingPeriod={editingPeriod}
        />

        {/* Confirm period deletion */}
        <AlertDialog open={!!periodToDelete} onOpenChange={(o) => !o && setPeriodToDelete(null)}>
          <AlertDialogContent data-testid="confirm-delete-period">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <X className="h-5 w-5" />
                Supprimer la période ?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2 pt-2">
                <p>Vous allez supprimer définitivement la période <strong className="text-foreground">"{periodToDelete?.name}"</strong>.</p>
                <p className="text-xs">⚠ Les évaluations qui y étaient rattachées seront <strong>déliées</strong> mais pas supprimées (vous pourrez les ré-affecter à une autre période).</p>
                <p className="text-xs">Cette action est <strong className="text-destructive">irréversible</strong>.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting} data-testid="confirm-delete-cancel">Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeletePeriod}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="confirm-delete-confirm"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ============ Promotions view ============
  if (selectedProgramName) {
    return (
      <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6">
        <div className="bg-card rounded-2xl shadow-lg border-2 border-primary/20 p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setSelectedProgramName(null)} className="p-2 hover:bg-muted rounded-xl transition-colors">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div className="p-2.5 bg-primary/10 rounded-xl"><GraduationCap className="h-5 w-5 text-primary" /></div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{selectedProgramName}</h2>
              <p className="text-sm text-muted-foreground">{selectedGroupFormations.length} promotion(s)</p>
            </div>
          </div>
        </div>
        {selectedGroupFormations.length === 0 ? (
          <EmptyState icon={Calendar} title="Aucune promotion" description="Aucune promotion pour ce programme." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedGroupFormations.map((formation: any) => (
              <div
                key={formation.id}
                onClick={() => setSelectedFormationId(formation.id)}
                className="bg-card rounded-2xl shadow-sm border-2 border-primary/20 hover:shadow-lg hover:border-primary/40 transition-all duration-200 cursor-pointer group overflow-hidden"
              >
                <div className="h-1.5 rounded-t-xl" style={{ backgroundColor: formation.color || 'hsl(var(--primary))' }} />
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {formation.academic_year && (
                      <Badge className="bg-primary text-primary-foreground text-xs px-2.5 py-0.5">
                        <Calendar className="h-3 w-3 mr-1" />{formation.academic_year}
                      </Badge>
                    )}
                    {formation.level && (
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${getLevelColor(formation.level)}`}>{formation.level}</span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">{formation.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(formation.start_date), 'MMM yyyy', { locale: fr })} — {format(new Date(formation.end_date), 'MMM yyyy', { locale: fr })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />{studentCounts[formation.id] || 0} étudiant{(studentCounts[formation.id] || 0) > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-end text-xs text-primary font-medium group-hover:translate-x-1 transition-transform">
                    Gérer les notes <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ============ Programs list ============
  return (
    <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6">
      <div className="bg-card rounded-2xl shadow-lg border-2 border-primary/20 p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-primary/10 rounded-xl"><GraduationCap className="h-5 w-5 text-primary" /></div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Notes & Évaluations</h2>
            <p className="text-sm text-muted-foreground">Sélectionnez une formation pour gérer les notes</p>
          </div>
        </div>
        {programNames.length > 3 && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher une formation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-base border-2 border-primary/30 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        )}
      </div>
      {isLoading ? (
        <LoadingState message="Chargement des formations..." />
      ) : filteredPrograms.length === 0 ? (
        <EmptyState icon={GraduationCap} title="Aucune formation" description="Aucune formation n'est disponible pour la gestion des notes" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((name) => {
            const group = formationGroups[name];
            const latest = group[0];
            return (
              <div
                key={name}
                onClick={() => setSelectedProgramName(name)}
                className="bg-card rounded-2xl shadow-sm border-2 border-primary/20 hover:shadow-lg hover:border-primary/40 transition-all duration-200 cursor-pointer group overflow-hidden"
              >
                <div className="h-2" style={{ backgroundColor: latest?.color || 'hsl(var(--primary))' }} />
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {latest?.level && (
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${getLevelColor(latest.level)}`}>{latest.level}</span>
                    )}
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                      {group.length} promotion{group.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1 line-clamp-2">{name}</h3>
                  <div className="space-y-1">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground/70 flex-shrink-0" />
                      <span>{latest?.duration || 0}h de formation</span>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5 mr-1.5 text-muted-foreground/70 flex-shrink-0" />
                      <span>{latest?.formation_modules?.length || 0} module{(latest?.formation_modules?.length || 0) > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-end text-xs text-primary font-medium group-hover:translate-x-1 transition-transform">
                    Voir les promotions <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notes;
