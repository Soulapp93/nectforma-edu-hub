import React, { useState } from 'react';
import { Users, BookOpen, Shield, Clock, Plus, Search, Filter, Download, Upload, Printer, Edit, Trash2, Eye } from 'lucide-react';
import UserModal from '../components/UserModal';
import FormationModal from '../components/FormationModal';

const Administration = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isFormationModalOpen, setIsFormationModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedFormation, setSelectedFormation] = useState(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'Sangare Souleymane',
      email: 'soulsang383@gmail.com',
      role: 'Formateur',
      status: 'Actif',
      initials: 'SS',
      phone: '+33 6 12 34 56 78',
      address: '123 Rue de la Formation, Paris',
      birthDate: '1985-03-15'
    },
    {
      id: 2,
      name: 'souleymane Sangare',
      email: 'soulsang383@gmail.com',
      role: 'Étudiant',
      status: 'Actif',
      initials: 'SS',
      phone: '+33 6 87 65 43 21',
      address: '456 Avenue des Étudiants, Lyon',
      birthDate: '1998-07-22'
    },
    {
      id: 3,
      name: 'Nouvel Utilisateur',
      email: 'mariam383@gmail.com',
      role: 'Étudiant',
      status: 'Actif',
      initials: 'NU',
      phone: '+33 6 11 22 33 44',
      address: '789 Boulevard de l\'Apprentissage, Marseille',
      birthDate: '2000-01-10'
    }
  ]);

  const [formations, setFormations] = useState([
    {
      id: 1,
      title: 'Introduction au Marketing Digital',
      level: 'BAC+1',
      instructor: 'Formateur Prof',
      duration: '40',
      maxStudents: '25',
      enrolledStudents: 2,
      status: 'Actif',
      startDate: '2024-01-15',
      endDate: '2024-06-15',
      price: '1200'
    },
    {
      id: 2,
      title: 'Cours de Photoshop Avancé',
      level: 'BAC+3',
      instructor: 'Non assigné',
      duration: '60',
      maxStudents: '15',
      enrolledStudents: 1,
      status: 'Actif',
      startDate: '2024-02-01',
      endDate: '2024-07-01',
      price: '1800'
    }
  ]);

  const tabs = [
    { id: 'users', name: 'Gestion des utilisateurs', icon: Users },
    { id: 'formations', name: 'Gestion des formations', icon: BookOpen },
    { id: 'roles', name: 'Gestion des rôles', icon: Shield },
    { id: 'time', name: 'Gestion Emploi du Temps', icon: Clock },
  ];

  const handleCreateUser = () => {
    setSelectedUser(null);
    setModalMode('create');
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setModalMode('edit');
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const handleSaveUser = (userData: any) => {
    if (modalMode === 'create') {
      const newUser = {
        ...userData,
        id: Math.max(...users.map(u => u.id)) + 1,
        initials: userData.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
      };
      setUsers([...users, newUser]);
    } else {
      setUsers(users.map(user => 
        user.id === selectedUser?.id ? { ...user, ...userData } : user
      ));
    }
  };

  const handleCreateFormation = () => {
    setSelectedFormation(null);
    setModalMode('create');
    setIsFormationModalOpen(true);
  };

  const handleEditFormation = (formation: any) => {
    setSelectedFormation(formation);
    setModalMode('edit');
    setIsFormationModalOpen(true);
  };

  const handleDeleteFormation = (formationId: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) {
      setFormations(formations.filter(formation => formation.id !== formationId));
    }
  };

  const handleSaveFormation = (formationData: any) => {
    if (modalMode === 'create') {
      const newFormation = {
        ...formationData,
        id: Math.max(...formations.map(f => f.id)) + 1,
        enrolledStudents: 0
      };
      setFormations([...formations, newFormation]);
    } else {
      setFormations(formations.map(formation => 
        formation.id === selectedFormation?.id ? { ...formation, ...formationData } : formation
      ));
    }
  };

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
              <button 
                onClick={handleCreateUser}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvel utilisateur
              </button>
            </div>

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
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Formations Management */}
      {activeTab === 'formations' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Gestion des formations</h2>
              <button 
                onClick={handleCreateFormation}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle formation
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une formation..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option>Tous les niveaux</option>
                <option>BAC+1</option>
                <option>BAC+2</option>
                <option>BAC+3</option>
                <option>BAC+4</option>
                <option>BAC+5</option>
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option>Tous les statuts</option>
                <option>Actif</option>
                <option>Inactif</option>
                <option>Brouillon</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Formation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Niveau</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Formateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Étudiants</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durée</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formations.map((formation) => (
                  <tr key={formation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formation.title}</div>
                      <div className="text-sm text-gray-500">{formation.price}€</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        {formation.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formation.instructor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formation.enrolledStudents}/{formation.maxStudents}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formation.duration}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {formation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditFormation(formation)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteFormation(formation.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
      {activeTab !== 'users' && activeTab !== 'formations' && (
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

      {/* Modals */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={handleSaveUser}
        user={selectedUser}
        mode={modalMode}
      />

      <FormationModal
        isOpen={isFormationModalOpen}
        onClose={() => setIsFormationModalOpen(false)}
        onSave={handleSaveFormation}
        formation={selectedFormation}
        mode={modalMode}
      />
    </div>
  );
};

export default Administration;
