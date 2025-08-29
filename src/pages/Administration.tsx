import React, { useState } from 'react';
import AdministrationTabs from '../components/administration/AdministrationTabs';
import UsersList from '../components/administration/UsersList';
import FormationsList from '../components/administration/FormationsList';
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

      <AdministrationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'users' && (
        <UsersList
          users={users}
          onCreateUser={handleCreateUser}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
        />
      )}

      {activeTab === 'formations' && (
        <FormationsList
          formations={formations}
          onCreateFormation={handleCreateFormation}
          onEditFormation={handleEditFormation}
          onDeleteFormation={handleDeleteFormation}
        />
      )}

      
      {activeTab !== 'users' && activeTab !== 'formations' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="h-8 w-8 text-purple-600">📋</div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Section en développement
            </h3>
            <p className="text-gray-600">
              Cette section sera développée prochainement. Restez connecté pour découvrir toutes les fonctionnalités.
            </p>
          </div>
        </div>
      )}

      
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
