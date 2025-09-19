
import React, { useState } from 'react';
import { Users, BookOpen, Calendar, TrendingUp, Clock, FileText, AlertCircle, UserCheck, UsersIcon, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '../components/DashboardCard';
import EnhancedDashboardCard from '../components/EnhancedDashboardCard';
import DashboardFilters from '../components/DashboardFilters';
import MissingTextBookEntriesModal from '../components/dashboard/MissingTextBookEntriesModal';
import { useDashboardStats } from '../hooks/useDashboardStats';

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedFormationId, setSelectedFormationId] = useState<string | undefined>();
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('month');
  const [showTextBookModal, setShowTextBookModal] = useState(false);
  const { stats, loading, error } = useDashboardStats(selectedFormationId, selectedTimePeriod);

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
      clickable: true,
      onClick: () => setShowTextBookModal(true),
    },
    {
      title: 'Émargements à traiter',
      value: loading ? '...' : stats.pendingAttendanceSheets.toString(),
      icon: AlertCircle,
      description: 'Feuilles à valider',
      clickable: true,
      onClick: () => navigate('/administration?tab=attendance'),
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
        selectedTimePeriod={selectedTimePeriod}
        onTimePeriodChange={setSelectedTimePeriod}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {dashboardCards.map((card, index) => (
          <DashboardCard key={index} {...card} />
        ))}
        
        {/* Carte heures regroupées */}
        <EnhancedDashboardCard
          type="hours"
          title="Heures de cours"
          icon={Clock}
          weeklyHours={loading ? 0 : stats.weeklyHours}
          monthlyHours={loading ? 0 : stats.monthlyHours}
          yearlyHours={loading ? 0 : stats.yearlyHours}
        />
        
        {/* Carte étudiants assidus */}
        <EnhancedDashboardCard
          type="excellent-students"
          title="Top Étudiants Assidus (≥90%)"
          icon={Trophy}
          students={loading ? [] : stats.excellentStudents}
        />
        
        {/* Carte étudiants à risque */}
        <EnhancedDashboardCard
          type="risk-students"
          title="Étudiants à Risque (<75% Présence)"
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
  );
};

export default Dashboard;
