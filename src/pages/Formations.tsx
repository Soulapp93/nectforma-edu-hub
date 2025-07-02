
import React, { useState } from 'react';
import { Plus, Search, Filter, BookOpen, Users, Clock, Star, Calendar, Edit, Trash2 } from 'lucide-react';
import FormationCard from '../components/FormationCard';
import FormationModal from '../components/FormationModal';

const Formations = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');

  const [formations, setFormations] = useState([
    {
      id: 1,
      title: 'Introduction au Marketing Digital',
      level: 'BAC+1',
      students: 2,
      modules: 2,
      instructor: 'Formateur Prof',
      status: 'Actif' as const,
      color: '#8B5CF6',
      description: 'Formation complète aux fondamentaux du marketing digital moderne.',
      duration: '40',
      price: '1200',
      startDate: '2024-01-15',
      endDate: '2024-06-15',
      maxStudents: '25'
    },
    {
      id: 2,
      title: 'Cours de Photoshop Avancé',
      level: 'BAC+3',
      students: 1,
      modules: 0,
      instructor: 'Non assigné',
      status: 'Actif' as const,
      color: '#3B82F6',
      description: 'Maîtrisez les techniques avancées de retouche photo et de création graphique.',
      duration: '60',
      price: '1800',
      startDate: '2024-02-01',
      endDate: '2024-07-01',
      maxStudents: '15'
    },
    {
      id: 3,
      title: 'Communication digitale',
      level: 'BAC+2',
      students: 5,
      modules: 4,
      instructor: 'Formateur Communication',
      status: 'Actif' as const,
      color: '#10B981',
      description: 'Apprenez à créer des stratégies de communication digitale efficaces.',
      duration: '35',
      price: '1000',
      startDate: '2024-03-01',
      endDate: '2024-08-01',
      maxStudents: '20'
    }
  ]);

  const handleCreateFormation = () => {
    setSelectedFormation(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditFormation = (formation: any) => {
    setSelectedFormation(formation);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteFormation = (formationId: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) {
      setFormations(formations.filter(f => f.id !== formationId));
    }
  };

  const handleSaveFormation = (formationData: any) => {
    if (modalMode === 'create') {
      const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
      const newFormation = {
        ...formationData,
        id: Math.max(...formations.map(f => f.id)) + 1,
        students: 0,
        modules: 0,
        color: colors[Math.floor(Math.random() * colors.length)]
      };
      setFormations([...formations, newFormation]);
    } else {
      setFormations(formations.map(formation => 
        formation.id === selectedFormation?.id ? { ...formation, ...formationData } : formation
      ));
    }
  };

  const filteredFormations = formations.filter(formation => {
    const matchesSearch = formation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         formation.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || formation.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const formationsByLevel = filteredFormations.reduce((acc, formation) => {
    if (!acc[formation.level]) {
      acc[formation.level] = [];
    }
    acc[formation.level].push(formation);
    return acc;
  }, {} as Record<string, typeof formations>);

  const levels = ['BAC+1', 'BAC+2', 'BAC+3', 'BAC+4', 'BAC+5'];

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Formations</h1>
            <p className="text-gray-600">Gérez votre catalogue de formations</p>
          </div>
          <button 
            onClick={handleCreateFormation}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center font-medium"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nouvelle formation
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une formation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <select 
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Tous les niveaux</option>
              {levels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total formations</p>
                <p className="text-2xl font-bold text-gray-900">{formations.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Étudiants inscrits</p>
                <p className="text-2xl font-bold text-gray-900">{formations.reduce((sum, f) => sum + f.students, 0)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Heures de cours</p>
                <p className="text-2xl font-bold text-gray-900">{formations.reduce((sum, f) => sum + parseInt(f.duration || '0'), 0)}h</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taux de satisfaction</p>
                <p className="text-2xl font-bold text-gray-900">4.8/5</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formations by Level */}
      {levels.map(level => {
        const levelFormations = formationsByLevel[level];
        if (!levelFormations || levelFormations.length === 0) return null;

        return (
          <div key={level} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-purple-600">{level}</h2>
              <span className="text-sm text-gray-500">{levelFormations.length} formation(s)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {levelFormations.map((formation) => (
                <div key={formation.id} className="relative group">
                  <FormationCard {...formation} />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditFormation(formation)}
                        className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteFormation(formation.id)}
                        className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty State */}
      {filteredFormations.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || selectedLevel !== 'all' ? 'Aucune formation trouvée' : 'Aucune formation'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedLevel !== 'all' 
                ? 'Essayez de modifier vos critères de recherche.' 
                : 'Créez votre première formation pour enrichir votre catalogue.'
              }
            </p>
            {(!searchTerm && selectedLevel === 'all') && (
              <button 
                onClick={handleCreateFormation}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Créer une formation
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      <FormationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveFormation}
        formation={selectedFormation}
        mode={modalMode}
      />
    </div>
  );
};

export default Formations;
