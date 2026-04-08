import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, GraduationCap, BookText, CalendarDays, ClipboardCheck, ShieldCheck, FolderOpen, Archive, AlertTriangle } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

// Lazy load all heavy tab components
const EnhancedUsersList = React.lazy(() => import('../components/administration/EnhancedUsersList'));
const FormationsList = React.lazy(() => import('../components/administration/FormationsList'));
const TextBooksList = React.lazy(() => import('../components/administration/TextBooksList'));
const ScheduleManagement = React.lazy(() => import('../components/administration/ScheduleManagement'));
const AttendanceManagement = React.lazy(() => import('../components/administration/AttendanceManagement'));
const StudentFilesManagement = React.lazy(() => import('../components/administration/StudentFilesManagement'));
const ArchivesManagement = React.lazy(() => import('../components/administration/ArchivesManagement'));
const AbsenceManagement = React.lazy(() => import('../components/administration/AbsenceManagement'));

const TabFallback = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
  </div>
);

const Administration = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['users', 'formations', 'textbooks', 'schedules', 'attendance', 'student-files', 'archives', 'absences'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const getPageInfo = (): { title: string; description: string; icon: LucideIcon } => {
    switch (activeTab) {
      case 'users': 
        return { title: 'Gestion des utilisateurs', description: 'Gérez les comptes utilisateurs de la plateforme.', icon: Users };
      case 'formations': 
        return { title: 'Gestion des formations', description: 'Créez et gérez les formations proposées.', icon: GraduationCap };
      case 'textbooks': 
        return { title: 'Gestion des cahiers de texte', description: 'Consultez et gérez les cahiers de texte.', icon: BookText };
      case 'schedules': 
        return { title: 'Gestion des emplois du temps', description: 'Organisez les emplois du temps des formations.', icon: CalendarDays };
      case 'attendance': 
        return { title: 'Feuilles d\'émargement', description: 'Validez et gérez les feuilles d\'émargement.', icon: ClipboardCheck };
      case 'student-files':
        return { title: 'Dossiers étudiants', description: 'Gérez les documents et dossiers de chaque étudiant.', icon: FolderOpen };
      case 'archives':
        return { title: 'Archives', description: 'Consultez les données archivées des promotions terminées.', icon: Archive };
      case 'absences':
        return { title: 'Gestion des absences', description: 'Gérez les justificatifs d\'absence des étudiants et formateurs.', icon: AlertTriangle };
      default: 
        return { title: 'Administration', description: 'Gérez les utilisateurs, formations, rôles et emplois du temps de la plateforme.', icon: ShieldCheck };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25 flex-shrink-0">
                <pageInfo.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
                  {pageInfo.title}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
                  {pageInfo.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        <Suspense fallback={<TabFallback />}>
          {activeTab === 'users' && <EnhancedUsersList />}
          {activeTab === 'formations' && <FormationsList />}
          {activeTab === 'textbooks' && <TextBooksList />}
          {activeTab === 'schedules' && <ScheduleManagement />}
          {activeTab === 'attendance' && <AttendanceManagement />}
          {activeTab === 'student-files' && <StudentFilesManagement />}
          {activeTab === 'archives' && <ArchivesManagement />}
          {activeTab === 'absences' && <AbsenceManagement />}
        </Suspense>

        {!['users', 'formations', 'textbooks', 'schedules', 'attendance', 'student-files', 'archives', 'absences'].includes(activeTab) && (
          <div className="glass-card rounded-xl p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="h-8 w-8 text-primary">📋</div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Section en développement</h3>
              <p className="text-muted-foreground">Cette section sera développée prochainement.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Administration;
