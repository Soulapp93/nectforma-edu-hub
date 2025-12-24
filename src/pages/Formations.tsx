import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, BookOpen, Users, Clock, Star, Grid3x3, List } from 'lucide-react';
import FormationCard from '../components/administration/FormationCard';
import CreateFormationModal from '@/components/administration/CreateFormationModal';
import EditFormationModal from '@/components/administration/EditFormationModal';
import FormationParticipantsModal from '@/components/administration/FormationParticipantsModal';
import { useFormations } from '@/hooks/useFormations';
import { formationService } from '@/services/formationService';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TutorFormationsView } from '@/components/formations/TutorFormationsView';

const Formations = () => {
  const { userRole } = useCurrentUser();
  
  // Si c'est un tuteur, afficher la vue tuteur spécifique
  if (userRole === 'Tuteur') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 min-h-screen">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">Formations Apprenti</h1>
          <p className="text-base sm:text-lg text-gray-600">Suivez les formations de votre apprenti</p>
        </div>
        <TutorFormationsView />
      </div>
    );
  }
  
  return <FormationsContent userRole={userRole} />;
};

const FormationsContent = ({ userRole }: { userRole: string | null }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFormationId, setEditingFormationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [formationsWithParticipants, setFormationsWithParticipants] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [selectedFormationId, setSelectedFormationId] = useState<string | null>(null);
  
  const { formations, loading, error, refetch } = useFormations();
  
  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';

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

  // Récupérer le nombre de participants pour chaque formation
  useEffect(() => {
    fetchParticipantsCount();
  }, [formations]);

  const handleCreateFormation = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditFormation = (formation: any) => {
    setEditingFormationId(formation.id);
    setIsEditModalOpen(true);
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

  const handleViewParticipants = (formationId: string) => {
    setSelectedFormationId(formationId);
    setIsParticipantsModalOpen(true);
  };

  const handleSuccess = () => {
    refetch();
    toast.success('Formation mise à jour avec succès');
  };

  const handleCreateSuccess = () => {
    refetch();
    toast.success('Formation créée avec succès');
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">Formations</h1>
          <p className="text-base sm:text-lg text-gray-600">Découvrez notre catalogue de formations</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Catalogue des formations</h2>
          
          {/* Toggle vue grille/liste */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 px-3"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une formation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <select 
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            <option value="all">Tous les niveaux</option>
            {levels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            <option value="all">Tous les statuts</option>
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
            <option value="Brouillon">Brouillon</option>
          </select>
        </div>
      </div>


      {/* Formations Grid ou Liste */}
      {filteredFormations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-10 lg:p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
              {searchTerm || selectedLevel !== 'all' || selectedStatus !== 'all' 
                ? 'Aucune formation trouvée' 
                : 'Aucune formation'
              }
            </h3>
            <p className="text-base sm:text-lg text-gray-600 mb-6">
              {searchTerm || selectedLevel !== 'all' || selectedStatus !== 'all'
                ? 'Essayez de modifier vos critères de recherche.'
                : 'Aucune formation disponible pour le moment.'
              }
            </p>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {filteredFormations.map((formation) => (
            <FormationCard
              key={formation.id}
              {...formation}
              modules={formation.formation_modules || []}
              onEdit={isAdmin ? () => handleEditFormation(formation) : undefined}
              onDelete={isAdmin ? () => handleDeleteFormation(formation.id) : undefined}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Niveau</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Formation</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Dates</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Durée</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Participants</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Modules</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Statut</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFormations.map((formation, index) => (
                  <tr 
                    key={formation.id} 
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    <td className="px-6 py-4">
                      <Badge 
                        variant="outline"
                        className="font-medium"
                        style={{ borderColor: formation.color, color: formation.color }}
                      >
                        {formation.level}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{formation.title}</div>
                        {formation.description && (
                          <div className="text-sm text-gray-600 line-clamp-1 mt-1">
                            {formation.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-gray-900">
                          Du {new Date(formation.start_date).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-gray-600">
                          au {new Date(formation.end_date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{formation.duration}h</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {formation.participantsCount || 0} / {formation.max_students}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">
                        {formation.formation_modules?.length || 0} modules
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={formation.status === 'Actif' ? 'default' : 'secondary'}
                        className={formation.status === 'Actif' ? 'bg-green-100 text-green-700 border-green-200' : ''}
                      >
                        {formation.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/formations/${formation.id}`}
                        >
                          Voir détail
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewParticipants(formation.id)}
                        >
                          Voir les participants ({formation.participantsCount || 0})
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditFormation(formation)}
                            >
                              Modifier
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteFormation(formation.id)}
                            >
                              Supprimer
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      {selectedFormationId && (
        <FormationParticipantsModal
          isOpen={isParticipantsModalOpen}
          onClose={() => {
            setIsParticipantsModalOpen(false);
            setSelectedFormationId(null);
          }}
          formationId={selectedFormationId}
          formationTitle={filteredFormations.find(f => f.id === selectedFormationId)?.title || ''}
          formationColor={filteredFormations.find(f => f.id === selectedFormationId)?.color}
        />
      )}
    </div>
  );
};

export default Formations;
