import React from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileSpreadsheet, FileText, Settings2, GraduationCap, ClipboardList } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import GradeSheetView from '@/components/grades/GradeSheetView';
import StudentGradesView from '@/components/grades/StudentGradesView';
import TranscriptsPanel from '@/components/grades/TranscriptsPanel';
import GradingSettingsPanel from '@/components/grades/GradingSettingsPanel';
import TutorGradesView from '@/components/grades/TutorGradesView';

const Notes = () => {
  const { userRole, userId } = useCurrentUser();
  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';
  const isFormateur = userRole === 'Formateur';
  const isStudent = userRole === 'Étudiant';
  const isTutor = userRole === 'Tuteur';

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

  // Formateur: feuilles de notes uniquement
  if (isFormateur) {
    return (
      <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6">
        <PageHeader
          title="Notes & Évaluations"
          description="Gérez vos feuilles de notes par formation et matière"
          icon={GraduationCap}
        />
        <GradeSheetView mode="instructor" />
      </div>
    );
  }

  // Admin: vue complète sans onglet évaluations
  return (
    <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6">
      <PageHeader
        title="Notes & Évaluations"
        description="Feuilles de notes, relevés par formation"
        icon={GraduationCap}
      />
      <Tabs defaultValue="feuilles" className="space-y-4">
        <TabsList className="flex flex-wrap gap-1 w-full max-w-2xl">
          <TabsTrigger value="feuilles" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Feuilles de notes
          </TabsTrigger>
          <TabsTrigger value="releves" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Relevés de notes
          </TabsTrigger>
          <TabsTrigger value="parametres" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Paramètres
          </TabsTrigger>
        </TabsList>
        <TabsContent value="feuilles">
          <GradeSheetView mode="admin" />
        </TabsContent>
        <TabsContent value="releves">
          <TranscriptsPanel mode="admin" />
        </TabsContent>
        <TabsContent value="parametres">
          <GradingSettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Notes;
