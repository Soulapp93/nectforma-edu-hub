import React, { useState } from 'react';
import { Users, BookOpen, Calendar, TrendingUp, Clock, FileText, AlertCircle, UserCheck, UsersIcon, Trophy, User2, LayoutDashboard, Search, Download, FileWarning } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '../components/DashboardCard';
import EnhancedDashboardCard from '../components/EnhancedDashboardCard';
import DashboardFilters from '../components/DashboardFilters';
import MissingTextBookEntriesModal from '../components/dashboard/MissingTextBookEntriesModal';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useMyContext } from '@/hooks/useMyContext';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedFormationId, setSelectedFormationId] = useState<string | undefined>();
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('month');
  const [showTextBookModal, setShowTextBookModal] = useState(false);
  const { stats, loading, error } = useDashboardStats(selectedFormationId, selectedTimePeriod);
  const { user: myUser } = useMyContext();

  const firstName = myUser?.first_name || 'Utilisateur';

  const dashboardCards = [
    {
      title: 'Étudiants',
      value: loading ? '...' : stats.studentsCount.toString(),
      icon: Users,
      description: selectedFormationId ? 'Dans cette formation' : 'Total des étudiants',
      color: 'blue',
    },
    {
      title: 'Formateurs',
      value: loading ? '...' : stats.instructorsCount.toString(),
      icon: UserCheck,
      description: 'Formateurs actifs',
      color: 'green',
    },
    {
      title: 'Tuteurs',
      value: loading ? '...' : stats.tutorsCount.toString(),
      icon: User2,
      description: 'Tuteurs enregistrés',
      color: 'purple',
    },
    {
      title: 'Formations',
      value: loading ? '...' : stats.formationsCount.toString(),
      icon: BookOpen,
      description: selectedFormationId ? 'Formation sélectionnée' : 'Formations disponibles',
      color: 'navy',
    },
    {
      title: 'Cours cette semaine',
      value: loading ? '...' : stats.weeklyScheduledCourses.toString(),
      icon: Calendar,
      description: 'Sessions programmées',
      color: 'yellow',
    },
    {
      title: 'Taux de présence',
      value: loading ? '...' : `${stats.attendanceRate}%`,
      icon: TrendingUp,
      description: 'Moyenne mensuelle',
      color: 'green',
      trend: stats.attendanceRate >= 80 ? { value: stats.attendanceRate - 70, isPositive: true } : undefined
    },
    {
      title: 'Cahiers de texte',
      value: loading ? '...' : stats.textBookMissingEntries.toString(),
      icon: FileText,
      description: 'Entrées non effectuées',
      clickable: true,
      onClick: () => setShowTextBookModal(true),
      color: 'red',
    },
    {
      title: 'Émargements à traiter',
      value: loading ? '...' : stats.pendingAttendanceSheets.toString(),
      icon: AlertCircle,
      description: 'Feuilles à valider',
      clickable: true,
      onClick: () => {
        // Deep-link to the specific formation's sheets when only ONE formation has pending sheets.
        // If several formations have pending sheets, fallback to the global selector view.
        const ids = stats.pendingAttendanceFormationIds;
        if (ids.length === 1) {
          navigate(`/suivi-emargement-admin?tab=attendance&formationId=${ids[0]}`);
        } else {
          navigate('/suivi-emargement-admin?tab=attendance');
        }
      },
      color: 'navy',
    },
    {
      title: 'Gestion des absences',
      value: loading ? '...' : stats.pendingJustifications.toString(),
      icon: FileWarning,
      description: 'Justificatifs à traiter',
      clickable: true,
      onClick: () => navigate('/suivi-emargement-admin?tab=absences'),
      color: 'red',
    }
  ];


  if (error) {
    return (
      <div className="p-8">
        <div className="text-center py-8">
          <p className="text-destructive">Erreur: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - PCA PREAD style */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="w-full px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
                Tableau de bord
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Vue d'ensemble de votre établissement
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exporter</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 sm:p-6 space-y-6">
        {/* Welcome message */}
        <div className="bg-card rounded-2xl border border-border/50 p-5 sm:p-6 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
            Bonjour {firstName} 👋
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Bienvenue sur votre espace de gestion
          </p>
        </div>

        {/* Filters */}
        <DashboardFilters 
          selectedFormationId={selectedFormationId}
          onFormationChange={setSelectedFormationId}
          selectedTimePeriod={selectedTimePeriod}
          onTimePeriodChange={setSelectedTimePeriod}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dashboardCards.map((card, index) => (
            <DashboardCard key={index} {...card} index={index} />
          ))}
        </div>
        
        {/* Heures de cours */}
        <div>
          <EnhancedDashboardCard
            type="hours"
            title="Heures de cours"
            icon={Clock}
            weeklyHours={loading ? 0 : stats.weeklyHours}
            monthlyHours={loading ? 0 : stats.monthlyHours}
            yearlyHours={loading ? 0 : stats.yearlyHours}
          />
        </div>
        
        {/* Top & Risk Students */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EnhancedDashboardCard
            type="excellent-students"
            title="Top étudiants assidus (≥90%)"
            icon={Trophy}
            students={loading ? [] : stats.excellentStudents}
          />
          
          <EnhancedDashboardCard
            type="risk-students"
            title="Étudiants à risque (<75% présence)"
            icon={AlertCircle}
            students={loading ? [] : stats.riskStudents}
          />
        </div>

        {/* Modales */}
        <MissingTextBookEntriesModal
          isOpen={showTextBookModal}
          onOpenChange={setShowTextBookModal}
          selectedFormationId={selectedFormationId}
        />
      </div>
    </div>
  );
};

export default Dashboard;