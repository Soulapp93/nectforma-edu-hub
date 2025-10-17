
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, BookOpen, Users, Clock, Star } from 'lucide-react';
import FormationCard from '../components/administration/FormationCard';
import FormationModal from '../components/FormationModal';
import { useFormations } from '@/hooks/useFormations';
import { formationService } from '@/services/formationService';
import { toast } from 'sonner';

const Formations = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [formationsWithParticipants, setFormationsWithParticipants] = useState<any[]>([]);
  
  const { formations, loading, error, refetch } = useFormations();

  // Récupérer le nombre de participants pour chaque formation
  useEffect(() => {
    const fetchParticipantsCount = async () => {
      if (formations && formations.length > 0) {
        const formationsWithCounts = await Promise.all(
          formations.map(async (formation) => {
            const participantsCount = await formationService.getFormationParticipantsCount(formation.id);
            return {
              ...formation,
              participantsCount
            };
          })
        );
        setFormationsWithParticipants(formationsWithCounts);
      }
    };

    fetchParticipantsCount();
  }, [formations]);

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

  const handleDeleteFormation = async (formationId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) {
      try {
        await formationService.deleteFormation(formationId);
        toast.success('Formation supprimée avec succès');
        refetch();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression de la formation');
      }
    }
  };

  const handleSaveFormation = async (formationData: any) => {
    try {
      if (modalMode === 'create') {
        await formationService.createFormation({
          ...formationData,
          establishment_id: 'default-establishment-id'
        });
        toast.success('Formation créée avec succès');
      } else {
        await formationService.updateFormation(selectedFormation?.id, formationData);
        toast.success('Formation mise à jour avec succès');
      }
      refetch();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde de la formation');
    }
  };

  const filteredFormations = formationsWithParticipants.filter(formation => {
    const matchesSearch = formation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         formation.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || formation.level === selectedLevel;
    const matchesStatus = selectedStatus === 'all' || formation.status === selectedStatus;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const levels = ['BAC+1', 'BAC+2', 'BAC+3', 'BAC+4', 'BAC+5'];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600">Erreur: {error}</div>
        <button onClick={refetch} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Formations</h1>
          <p className="text-sm sm:text-base text-gray-600">Découvrez notre catalogue de formations</p>
        </div>
        <button 
          onClick={handleCreateFormation}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg flex items-center font-medium text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          Nouvelle formation
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
            <option value="Brouillon">Brouillon</option>
          </select>
        </div>
      </div>


      {/* Formations Grid */}
      {filteredFormations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || selectedLevel !== 'all' || selectedStatus !== 'all' 
                ? 'Aucune formation trouvée' 
                : 'Aucune formation'
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedLevel !== 'all' || selectedStatus !== 'all'
                ? 'Essayez de modifier vos critères de recherche.'
                : 'Créez votre première formation pour enrichir votre catalogue.'
              }
            </p>
            {(!searchTerm && selectedLevel === 'all' && selectedStatus === 'all') && (
              <button 
                onClick={handleCreateFormation}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Créer une formation
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredFormations.map((formation) => (
            <FormationCard
              key={formation.id}
              {...formation}
              modules={formation.formation_modules || []}
              onEdit={() => handleEditFormation(formation)}
              onDelete={() => handleDeleteFormation(formation.id)}
            />
          ))}
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
