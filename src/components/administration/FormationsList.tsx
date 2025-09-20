
import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import CreateFormationModal from './CreateFormationModal';
import EditFormationModal from './EditFormationModal';
import FormationCard from './FormationCard';
import { formationService } from '@/services/formationService';
import { toast } from 'sonner';

const FormationsList: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFormationId, setEditingFormationId] = useState<string | null>(null);
  const [formations, setFormations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const fetchFormations = async () => {
    try {
      setLoading(true);
      const data = await formationService.getAllFormations();
      
      // Récupérer le nombre de participants pour chaque formation
      const formationsWithParticipants = await Promise.all(
        (data || []).map(async (formation) => {
          const participantsCount = await formationService.getFormationParticipantsCount(formation.id);
          return {
            ...formation,
            participantsCount
          };
        })
      );
      
      setFormations(formationsWithParticipants);
    } catch (error) {
      console.error('Erreur lors du chargement des formations:', error);
      toast.error('Erreur lors du chargement des formations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormations();
  }, []);

  const handleCreateFormation = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditFormation = (formationId: string) => {
    setEditingFormationId(formationId);
    setIsEditModalOpen(true);
  };

  const handleSuccess = () => {
    fetchFormations();
    toast.success('Formation mise à jour avec succès');
  };

  const handleCreateSuccess = () => {
    fetchFormations();
    toast.success('Formation créée avec succès');
  };

  const handleDeleteFormation = async (formationId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette formation ? Cette action supprimera également tous les modules associés et ne peut pas être annulée.')) {
      try {
        await formationService.deleteFormation(formationId);
        toast.success('Formation supprimée avec succès');
        fetchFormations();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression de la formation');
      }
    }
  };

  const filteredFormations = formations.filter(formation => {
    const matchesSearch = formation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         formation.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || formation.level === selectedLevel;
    const matchesStatus = selectedStatus === 'all' || formation.status === selectedStatus;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Chargement des formations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
              <option value="BAC+1">BAC+1</option>
              <option value="BAC+2">BAC+2</option>
              <option value="BAC+3">BAC+3</option>
              <option value="BAC+4">BAC+4</option>
              <option value="BAC+5">BAC+5</option>
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
      </div>

      {/* Cartes des formations */}
      {filteredFormations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-purple-600" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFormations.map((formation) => (
            <FormationCard
              key={formation.id}
              {...formation}
              modules={formation.formation_modules || []}
              onEdit={() => handleEditFormation(formation.id)}
              onDelete={() => handleDeleteFormation(formation.id)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateFormationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditFormationModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingFormationId(null);
        }}
        onSuccess={handleSuccess}
        formationId={editingFormationId}
      />
    </div>
  );
};

export default FormationsList;
