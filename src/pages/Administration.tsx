import React, { useState } from 'react';
import { Users, BookOpen, Shield, Clock, Plus, Search, Filter, Download, Upload, Printer } from 'lucide-react';

const Administration = () => {
  const [activeTab, setActiveTab] = useState('users');

  const users = [
    {
      id: 1,
      name: 'Sangare Souleymane',
      email: 'soulsang383@gmail.com',
      role: 'Formateur',
      status: 'Actif',
      initials: 'SS'
    },
    {
      id: 2,
      name: 'souleymane Sangare',
      email: 'soulsang383@gmail.com',
      role: 'Étudiant',
      status: 'Actif',
      initials: 'SS'
    },
    {
      id: 3,
      name: 'Nouvel Utilisateur',
      email: 'mariam383@gmail.com',
      role: 'Étudiant',
      status: 'Actif',
      initials: 'NU'
    }
  ];

  const tabs = [
    { id: 'users', name: 'Gestion des utilisateurs', icon: Users },
    { id: 'formations', name: 'Gestion des formations', icon: BookOpen },
    { id: 'roles', name: 'Gestion des rôles', icon: Shield },
    { id: 'time', name: 'Gestion Emploi du Temps', icon: Clock },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Administration</h1>
        <p className="text-gray-600">Gérez les utilisateurs, formations, rôles et emplois du temps de la plateforme.</p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Users Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Gestion des utilisateurs</h2>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Nouvel utilisateur
              </button>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher (nom, email)..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option>Tous les rôles</option>
                <option>Formateur</option>
                <option>Étudiant</option>
                <option>Administrateur</option>
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option>Tous les statuts</option>
                <option>Actif</option>
                <option>Inactif</option>
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option>Filtrer par formation...</option>
                <option>Marketing Digital</option>
                <option>Photoshop Avancé</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Upload className="h-4 w-4 mr-2" />
                Importer (Excel)
              </button>
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="h-4 w-4 mr-2" />
                Exporter (Excel)
              </button>
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-purple-600">{user.initials}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'Formateur' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">Modifier</button>
                        <button className="text-red-600 hover:text-red-900">Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Other tabs content placeholders */}
      {activeTab !== 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {tabs.find(tab => tab.id === activeTab)?.icon && 
                React.createElement(tabs.find(tab => tab.id === activeTab)!.icon, { 
                  className: "h-8 w-8 text-purple-600" 
                })
              }
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {tabs.find(tab => tab.id === activeTab)?.name}
            </h3>
            <p className="text-gray-600">
              Cette section sera développée prochainement. Restez connecté pour découvrir toutes les fonctionnalités.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Administration;
