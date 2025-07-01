
import React from 'react';
import { Users, BookOpen, Calendar, MessageSquare, FileText, TrendingUp } from 'lucide-react';
import DashboardCard from '../components/DashboardCard';

const Dashboard = () => {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
        <p className="text-gray-600">Vue d'ensemble de votre plateforme de formation</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Étudiants actifs"
          value="156"
          icon={Users}
          description="Total des étudiants inscrits"
          trend={{ value: 12, isPositive: true }}
        />
        <DashboardCard
          title="Formations actives"
          value="8"
          icon={BookOpen}
          description="Formations en cours"
          trend={{ value: 2, isPositive: true }}
        />
        <DashboardCard
          title="Sessions planifiées"
          value="24"
          icon={Calendar}
          description="Sessions cette semaine"
        />
        <DashboardCard
          title="Messages non lus"
          value="7"
          icon={MessageSquare}
          description="Nouveaux messages"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Activité récente</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Nouveau étudiant inscrit</p>
                <p className="text-xs text-gray-500">Il y a 2 heures</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Émargement validé</p>
                <p className="text-xs text-gray-500">Il y a 4 heures</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Formation mise à jour</p>
                <p className="text-xs text-gray-500">Hier</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Accès rapide</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left">
              <Users className="h-8 w-8 text-purple-600 mb-2" />
              <p className="font-medium text-gray-900">Gérer les utilisateurs</p>
              <p className="text-sm text-gray-500">Administration</p>
            </button>
            <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left">
              <BookOpen className="h-8 w-8 text-blue-600 mb-2" />
              <p className="font-medium text-gray-900">Créer une formation</p>
              <p className="text-sm text-gray-500">Formations</p>
            </button>
            <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left">
              <Calendar className="h-8 w-8 text-green-600 mb-2" />
              <p className="font-medium text-gray-900">Planning</p>
              <p className="text-sm text-gray-500">Emploi du temps</p>
            </button>
            <button className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left">
              <MessageSquare className="h-8 w-8 text-orange-600 mb-2" />
              <p className="font-medium text-gray-900">Messages</p>
              <p className="text-sm text-gray-500">Messagerie</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
