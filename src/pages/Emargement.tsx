
import React, { useState } from 'react';
import QuickActions from '../components/emargement/QuickActions';
import EmargementFilters from '../components/emargement/EmargementFilters';
import SessionsList from '../components/emargement/SessionsList';
import AttendanceDetail from '../components/emargement/AttendanceDetail';

const Emargement = () => {
  const [selectedFormation, setSelectedFormation] = useState('');

  const formations = [
    { id: 1, name: 'Marketing Digital', level: 'BAC+1' },
    { id: 2, name: 'Photoshop Avancé', level: 'BAC+3' },
    { id: 3, name: 'Communication digitale', level: 'BAC+2' }
  ];

  const sessions = [
    {
      id: 1,
      date: '2024-01-15',
      time: '09:00 - 12:00',
      formation: 'Marketing Digital',
      instructor: 'Formateur Prof',
      studentsPresent: 12,
      studentsTotal: 15,
      status: 'Terminé'
    },
    {
      id: 2,
      date: '2024-01-16',
      time: '14:00 - 17:00',
      formation: 'Photoshop Avancé',
      instructor: 'Formateur Design',
      studentsPresent: 8,
      studentsTotal: 10,
      status: 'En cours'
    },
    {
      id: 3,
      date: '2024-01-17',
      time: '10:00 - 12:00',
      formation: 'Communication digitale',
      instructor: 'Formateur Communication',
      studentsPresent: 0,
      studentsTotal: 8,
      status: 'Programmé'
    }
  ];

  const students = [
    { id: 1, name: 'Sangare Souleymane', present: true, signedAt: '09:05' },
    { id: 2, name: 'Nouvel Utilisateur', present: true, signedAt: '09:10' },
    { id: 3, name: 'Marie Dubois', present: false, signedAt: null },
    { id: 4, name: 'Pierre Martin', present: true, signedAt: '09:03' },
    { id: 5, name: 'Sophie Bernard', present: true, signedAt: '09:08' }
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Émargement</h1>
        <p className="text-gray-600">Gérez les présences et les feuilles d'émargement</p>
      </div>

      <QuickActions />
      
      <EmargementFilters 
        formations={formations}
        selectedFormation={selectedFormation}
        onFormationChange={setSelectedFormation}
      />

      <SessionsList sessions={sessions} />

      <AttendanceDetail students={students} />
    </div>
  );
};

export default Emargement;
