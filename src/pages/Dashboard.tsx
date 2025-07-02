
import React from 'react';
import { Users, BookOpen, Calendar, MessageSquare, TrendingUp, Clock, FileText, Award } from 'lucide-react';
import DashboardCard from '../components/DashboardCard';

const Dashboard = () => {
  const stats = [
    {
      title: 'Étudiants actifs',
      value: '3',
      icon: Users,
      description: 'Total des étudiants inscrits',
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Formations',
      value: '2',
      icon: BookOpen,
      description: 'Formations disponibles',
      trend: { value: 0, isPositive: true }
    },
    {
      title: 'Cours cette semaine',
      value: '8',
      icon: Calendar,
      description: 'Sessions programmées',
      trend: { value: 5, isPositive: true }
    },
    {
      title: 'Messages non lus',
      value: '0',
      icon: MessageSquare,
      description: 'Messagerie interne'
    },
    {
      title: 'Taux de présence',
      value: '95%',
      icon: TrendingUp,
      description: 'Moyenne mensuelle',
      trend: { value: 3, isPositive: true }
    },
    {
      title: 'Heures de cours',
      value: '124h',
      icon: Clock,
      description: 'Ce mois-ci'
    }
  ];

  const quickActions = [
    {
      title: 'Ajouter un étudiant',
      description: 'Inscrire un nouvel étudiant',
      icon: Users,
      color: 'bg-blue-500',
      link: '/administration'
    },
    {
      title: 'Créer une formation',
      description: 'Nouvelle formation',
      icon: BookOpen,
      color: 'bg-green-500',
      link: '/formations'
    },
    {
      title: 'Planifier un cours',
      description: 'Ajouter au planning',
      icon: Calendar,
      color: 'bg-orange-500',
      link: '/emploi-temps'
    },
    {
      title: 'Émargement',
      description: 'Gérer les présences',
      icon: FileText,
      color: 'bg-red-500',
      link: '/emargement'
    }
  ];

  const recentActivity = [
    {
      type: 'inscription',
      message: 'Nouvel Utilisateur s\'est inscrit à Marketing Digital',
      time: 'Il y a 2 heures',
      icon: Users
    },
    {
      type: 'cours',
      message: 'Cours de Photoshop Avancé programmé pour demain',
      time: 'Il y a 4 heures',
      icon: Calendar
    },
    {
      type: 'message',
      message: 'Nouveau message de Formateur Prof',
      time: 'Il y a 6 heures',
      icon: MessageSquare
    }
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
        <p className="text-gray-600">Bienvenue sur votre espace de gestion NectForma</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <DashboardCard key={index} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions rapides</h2>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Activité récente</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Icon className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium">
            Voir toute l'activité
          </button>
        </div>
      </div>

      {/* Performance Chart Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Performance mensuelle</h2>
          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option>Ce mois</option>
            <option>Mois dernier</option>
            <option>3 derniers mois</option>
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">85%</div>
            <div className="text-sm text-gray-600">Taux de présence</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">94%</div>
            <div className="text-sm text-gray-600">Satisfaction</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 mb-1">78%</div>
            <div className="text-sm text-gray-600">Taux de réussite</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-1">12</div>
            <div className="text-sm text-gray-600">Certifications</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
