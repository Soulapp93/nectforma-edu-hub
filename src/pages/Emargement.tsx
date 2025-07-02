
import React, { useState } from 'react';
import { FileText, Plus, Download, Send, Users, Calendar, Clock, CheckCircle } from 'lucide-react';

const Emargement = () => {
  const [selectedFormation, setSelectedFormation] = useState('');
  const [selectedSession, setSelectedSession] = useState('');

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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Plus className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Action</span>
          </div>
          <h3 className="font-medium text-gray-900 mb-2">Créer émargement</h3>
          <p className="text-sm text-gray-600 mb-4">Nouvelle feuille d'émargement</p>
          <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium">
            Créer
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Send className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Action</span>
          </div>
          <h3 className="font-medium text-gray-900 mb-2">Envoyer pour signature</h3>
          <p className="text-sm text-gray-600 mb-4">Signature électronique</p>
          <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
            Envoyer
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Download className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Action</span>
          </div>
          <h3 className="font-medium text-gray-900 mb-2">Télécharger PDF</h3>
          <p className="text-sm text-gray-600 mb-4">Exporter en PDF</p>
          <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium">
            Télécharger
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">Archive</span>
          </div>
          <h3 className="font-medium text-gray-900 mb-2">Archiver</h3>
          <p className="text-sm text-gray-600 mb-4">Sauvegarder définitivement</p>
          <button className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm font-medium">
            Archiver
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Formation</label>
            <select 
              value={selectedFormation}
              onChange={(e) => setSelectedFormation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Toutes les formations</option>
              {formations.map(formation => (
                <option key={formation.id} value={formation.id}>
                  {formation.name} ({formation.level})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              <option value="">Tous les statuts</option>
              <option value="termine">Terminé</option>
              <option value="en-cours">En cours</option>
              <option value="programme">Programmé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Sessions de cours</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horaire</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Formation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Formateur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Présences</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{session.date}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{session.time}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.formation}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.instructor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {session.studentsPresent}/{session.studentsTotal}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      session.status === 'Terminé' 
                        ? 'bg-green-100 text-green-800'
                        : session.status === 'En cours'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-purple-600 hover:text-purple-900">
                        Voir détails
                      </button>
                      <button className="text-blue-600 hover:text-blue-900">
                        Émargement
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Detail */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Détail des présences - Marketing Digital (15/01/2024)</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Liste des étudiants</h3>
              <div className="space-y-3">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        student.present ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {student.present ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <span className="text-red-600 font-bold">X</span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{student.name}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {student.present ? `Émargé à ${student.signedAt}` : 'Absent'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Statistiques</h3>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Présents</span>
                    <span className="text-2xl font-bold text-green-600">4</span>
                  </div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-red-800">Absents</span>
                    <span className="text-2xl font-bold text-red-600">1</span>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">Taux de présence</span>
                    <span className="text-2xl font-bold text-blue-600">80%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Emargement;
