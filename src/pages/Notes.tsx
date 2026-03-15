import React, { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEstablishment } from '@/hooks/useEstablishment';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, FileText, Settings2, GraduationCap, ClipboardList, ArrowLeft, Calendar, Users } from 'lucide-react';
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

const Notes = () => {
  const { userRole, userId } = useCurrentUser();
  const { establishment } = useEstablishment();
  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';
  const isFormateur = userRole === 'Formateur';
  const isStudent = userRole === 'Étudiant';
  const isTutor = userRole === 'Tuteur';


  const [selectedFormationId, setSelectedFormationId] = useState<string | null>(null);

  // Fetch formations for admin/formateur
  const { data: formations = [], isLoading } = useQuery({
    queryKey: ['formations-notes-page', userId, isAdmin],
    queryFn: async () => {
      if (isAdmin) {
        const { data } = await supabase
          .from('formations')
          .select('id, title, status, color, level, start_date, end_date, max_students')
          .eq('establishment_id', establishment?.id || '')
          .order('title');
        return data || [];
      }
      // Formateur: only assigned formations
      const { data } = await supabase
        .from('user_formation_assignments')
        .select('formation_id, formations(id, title, status, color, level, start_date, end_date, max_students)')
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

  // Admin/Formateur: Formation detail view
  if (selectedFormationId) {
    const selectedFormation = formations.find((f: any) => f.id === selectedFormationId);
    return (
      <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedFormationId(null)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour aux formations
          </Button>
        </div>
        <PageHeader
          title={selectedFormation?.title || 'Formation'}
          description={`${selectedFormation?.level || ''} — Feuilles de notes et relevés`}
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

  // Admin/Formateur: Formation list view
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">Active</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">À venir</Badge>;
      case 'completed':
        return <Badge className="bg-muted text-muted-foreground border-0">Terminée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Notes & Évaluations"
          description="Sélectionnez une formation pour gérer les notes"
          icon={GraduationCap}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : formations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <GraduationCap className="h-14 w-14 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-foreground">Aucune formation</h3>
            <p className="text-sm text-muted-foreground mt-1">Aucune formation n'est disponible pour la gestion des notes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {formations.map((formation: any) => (
            <Card
              key={formation.id}
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50 group"
              onClick={() => setSelectedFormationId(formation.id)}
            >
              <CardContent className="p-0">
                {/* Color bar */}
                <div
                  className="h-2 rounded-t-lg"
                  style={{ backgroundColor: formation.color || 'hsl(var(--primary))' }}
                />
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {formation.title}
                      </h3>
                      {formation.level && (
                        <p className="text-xs text-muted-foreground mt-0.5">{formation.level}</p>
                      )}
                    </div>
                    {getStatusBadge(formation.status)}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {formation.start_date && formation.end_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(formation.start_date), 'MMM yyyy', { locale: fr })} — {format(new Date(formation.end_date), 'MMM yyyy', { locale: fr })}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {studentCounts[formation.id] || 0} étudiant{(studentCounts[formation.id] || 0) > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notes;
