
import React, { useState } from 'react';
import { Users, BookOpen, Calendar, TrendingUp, Clock, FileText, AlertCircle, UserCheck, ClockIcon, MessageSquare } from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import DashboardFilters from '../components/DashboardFilters';
import { useDashboardStats } from '../hooks/useDashboardStats';

const Dashboard = () => {
  const [selectedFormationId, setSelectedFormationId] = useState<string | undefined>();
  const { stats, loading, error } = useDashboardStats(selectedFormationId);

  const dashboardCards = [
    {
      title: 'Étudiants',
      value: loading ? '...' : stats.studentsCount.toString(),
      icon: Users,
      description: selectedFormationId ? 'Étudiants dans cette formation' : 'Total des étudiants',
    },
    {
      title: 'Formateurs',
      value: loading ? '...' : stats.instructorsCount.toString(),
      icon: UserCheck,
      description: 'Formateurs actifs',
    },
    {
      title: 'Formations',
      value: loading ? '...' : stats.formationsCount.toString(),
      icon: BookOpen,
      description: selectedFormationId ? 'Formation sélectionnée' : 'Formations disponibles',
    },
    {
      title: 'Cours cette semaine',
      value: loading ? '...' : stats.weeklyScheduledCourses.toString(),
      icon: Calendar,
      description: 'Sessions programmées',
    },
    {
      title: 'Heures semaine',
      value: loading ? '...' : `${stats.weeklyHours}h`,
      icon: Clock,
      description: 'Total heures cette semaine',
    },
    {
      title: 'Heures mois',
      value: loading ? '...' : `${stats.monthlyHours}h`,
      icon: ClockIcon,
      description: 'Total heures ce mois',
    },
    {
      title: 'Heures année',
      value: loading ? '...' : `${stats.yearlyHours}h`,
      icon: Clock,
      description: 'Total heures cette année',
    },
    {
      title: 'Taux de présence',
      value: loading ? '...' : `${stats.attendanceRate}%`,
      icon: TrendingUp,
      description: 'Moyenne mensuelle',
      trend: stats.attendanceRate >= 80 ? { value: stats.attendanceRate - 70, isPositive: true } : undefined
    },
    {
      title: 'Cahiers de textes',
      value: loading ? '...' : stats.textBookMissingEntries.toString(),
      icon: FileText,
      description: 'Entrées non effectuées',
    },
    {
      title: 'Émargements à traiter',
      value: loading ? '...' : stats.pendingAttendanceSheets.toString(),
      icon: AlertCircle,
      description: 'Feuilles à valider',
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
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Tableau de bord</h1>
        <p className="text-muted-foreground">Bienvenue sur votre espace de gestion NectForma</p>
      </div>

      {/* Filters */}
      <DashboardFilters 
        selectedFormationId={selectedFormationId}
        onFormationChange={setSelectedFormationId}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {dashboardCards.map((card, index) => (
          <DashboardCard key={index} {...card} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
