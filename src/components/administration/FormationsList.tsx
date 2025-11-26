
import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Grid3x3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Badge } from '@/components/ui/badge';
import CreateFormationModal from './CreateFormationModal';
import EditFormationModal from './EditFormationModal';
import FormationCard from './FormationCard';
import { formationService } from '@/services/formationService';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const FormationsList: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFormationId, setEditingFormationId] = useState<string | null>(null);
  const [formations, setFormations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { userRole } = useCurrentUser();
  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';

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
      <LoadingState message="Chargement des formations..." />
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Gestion des formations</h2>
            <div className="flex items-center gap-2">
              {/* Toggle vue grille/liste */}
              <div className="flex items-center bg-muted rounded-lg p-1">
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
              
              {isAdmin && (
                <Button 
                  onClick={handleCreateFormation}
                  className="flex items-center gap-2"
                  variant="premium"
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle formation
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher une formation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                />
              </div>
            </div>
            <select 
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
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
              className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            >
              <option value="all">Tous les statuts</option>
              <option value="Actif">Actif</option>
              <option value="Inactif">Inactif</option>
              <option value="Brouillon">Brouillon</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cartes des formations ou vue liste */}
      {filteredFormations.length === 0 ? (
        <EmptyState
          icon={Plus}
          title={searchTerm || selectedLevel !== 'all' || selectedStatus !== 'all' 
            ? 'Aucune formation trouvée' 
            : 'Aucune formation'}
          description={searchTerm || selectedLevel !== 'all' || selectedStatus !== 'all'
            ? 'Essayez de modifier vos critères de recherche.'
            : 'Créez votre première formation pour enrichir votre catalogue.'}
          action={(isAdmin && !searchTerm && selectedLevel === 'all' && selectedStatus === 'all') ? {
            label: 'Créer une formation',
            onClick: handleCreateFormation,
            variant: 'premium'
          } : undefined}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFormations.map((formation) => (
            <FormationCard
              key={formation.id}
              {...formation}
              modules={formation.formation_modules || []}
              onEdit={isAdmin ? () => handleEditFormation(formation.id) : undefined}
              onDelete={isAdmin ? () => handleDeleteFormation(formation.id) : undefined}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Niveau</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Formation</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Durée</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Participants</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Modules</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Statut</th>
                  {isAdmin && <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredFormations.map((formation, index) => (
                  <tr 
                    key={formation.id} 
                    className={`border-b border-border hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
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
                        <div className="font-medium text-foreground">{formation.title}</div>
                        {formation.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {formation.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">{formation.duration}h</span>
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
                        className={formation.status === 'Actif' ? 'bg-success/10 text-success border-success/20' : ''}
                      >
                        {formation.status}
                      </Badge>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditFormation(formation.id)}
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
                        </div>
                      </td>
                    )}
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
    </div>
  );
};

export default FormationsList;
