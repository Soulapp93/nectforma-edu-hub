import React, { useState, useMemo } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEstablishment } from '@/hooks/useEstablishment';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, FileText, Settings2, GraduationCap, ClipboardList, ArrowLeft, Calendar, Users, ChevronRight, Clock, BookOpen, Search } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import GradeSheetView from '@/components/grades/GradeSheetView';
import StudentGradesView from '@/components/grades/StudentGradesView';
import TranscriptsPanel from '@/components/grades/TranscriptsPanel';
import GradingSettingsPanel from '@/components/grades/GradingSettingsPanel';
import TutorGradesView from '@/components/grades/TutorGradesView';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';

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

const Notes = () => {
  const { userRole, userId } = useCurrentUser();
  const { establishment } = useEstablishment();
  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';
  const isFormateur = userRole === 'Formateur';
  const isStudent = userRole === 'Étudiant';
  const isTutor = userRole === 'Tuteur';

  // Hierarchical navigation state
  const [selectedProgramName, setSelectedProgramName] = useState<string | null>(null);
  const [selectedFormationId, setSelectedFormationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch formations for admin/formateur
  const { data: formations = [], isLoading } = useQuery({
    queryKey: ['formations-notes-page', userId, isAdmin],
    queryFn: async () => {
      if (isAdmin) {
        const { data } = await supabase
          .from('formations')
          .select('id, title, status, color, level, start_date, end_date, max_students, academic_year, duration, formation_modules(id)')
          .eq('establishment_id', establishment?.id || '')
          .order('title');
        return data || [];
      }
      // Formateur: only assigned formations
      const { data } = await supabase
        .from('user_formation_assignments')
        .select('formation_id, formations(id, title, status, color, level, start_date, end_date, max_students, academic_year, duration, formation_modules(id))')
        .eq('user_id', userId!);
      return (data || []).map((d: any) => d.formations).filter(Boolean);
    },
    enabled: (isAdmin || isFormateur) && !!userId && !!establishment?.id,
  });

  // Count students per formation
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

  // Group formations by title (program)
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
    return programNames.filter(name =>
      name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [programNames, searchTerm]);

  const selectedGroupFormations = useMemo(() => {
    if (!selectedProgramName) return [];
    return formationGroups[selectedProgramName] || [];
  }, [selectedProgramName, formationGroups]);

  // Étudiant: vue simplifiée
  if (isStudent) {
    return (
      <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6">
        <PageHeader
          title="Mes notes"
          description="Consultez vos résultats et téléchargez vos relevés de notes"
          icon={GraduationCap}
        />
        <Tabs defaultValue="notes" className="space-y-4">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Mes notes
            </TabsTrigger>
            <TabsTrigger value="releves" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Mes relevés
            </TabsTrigger>
          </TabsList>
          <TabsContent value="notes">
            <StudentGradesView studentId={userId!} />
          </TabsContent>
          <TabsContent value="releves">
            <TranscriptsPanel mode="student" studentId={userId!} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Tuteur: vue apprenti
  if (isTutor) {
    return (
      <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6">
        <PageHeader
          title="Notes de l'apprenti"
          description="Consultez les résultats et relevés de notes de votre apprenti"
          icon={GraduationCap}
        />
        <TutorGradesView />
      </div>
    );
  }

  // Admin/Formateur: Formation detail view (after selecting a promotion)
  if (selectedFormationId) {
    const selectedFormation = formations.find((f: any) => f.id === selectedFormationId);
    return (
      <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedFormationId(null)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour aux promotions
          </Button>
        </div>
        <PageHeader
          title={selectedFormation?.title || 'Formation'}
          description={`${selectedFormation?.level || ''} ${selectedFormation?.academic_year ? `— ${selectedFormation.academic_year}` : ''} — Feuilles de notes et relevés`}
          icon={GraduationCap}
        />
        <Tabs defaultValue="feuilles" className="space-y-4">
          <TabsList className="flex flex-wrap gap-1 w-full max-w-lg">
            <TabsTrigger value="feuilles" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Feuilles de notes
            </TabsTrigger>
            <TabsTrigger value="releves" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Relevés de notes
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Paramètres
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="feuilles">
            <GradeSheetView mode={isAdmin ? 'admin' : 'instructor'} formationId={selectedFormationId} />
          </TabsContent>
          <TabsContent value="releves">
            <TranscriptsPanel mode="admin" formationId={selectedFormationId} />
          </TabsContent>
          {isAdmin && (
            <TabsContent value="settings">
              <GradingSettingsPanel />
            </TabsContent>
          )}
        </Tabs>
      </div>
    );
  }

  // Admin/Formateur: Promotions view (after selecting a program)
  if (selectedProgramName) {
    return (
      <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6">
        <div className="bg-card rounded-2xl shadow-lg border-2 border-primary/20 p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setSelectedProgramName(null)}
              className="p-2 hover:bg-muted rounded-xl transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
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
                        <Calendar className="h-3 w-3 mr-1" />
                        {formation.academic_year}
                      </Badge>
                    )}
                    {formation.level && (
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${getLevelColor(formation.level)}`}>
                        {formation.level}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">{formation.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(formation.start_date), 'MMM yyyy', { locale: fr })} — {format(new Date(formation.end_date), 'MMM yyyy', { locale: fr })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {studentCounts[formation.id] || 0} étudiant{(studentCounts[formation.id] || 0) > 1 ? 's' : ''}
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

  // Admin/Formateur: Programs list view
  return (
    <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6">
      <div className="bg-card rounded-2xl shadow-lg border-2 border-primary/20 p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
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
        <EmptyState
          icon={GraduationCap}
          title="Aucune formation"
          description="Aucune formation n'est disponible pour la gestion des notes"
        />
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
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${getLevelColor(latest.level)}`}>
                        {latest.level}
                      </span>
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
