
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, BookOpen, Users, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
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
    return <LoadingState message="Chargement des formations..." />;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="glass-card rounded-xl p-8 text-center">
          <div className="text-destructive mb-2">Erreur: {error}</div>
          <Button onClick={refetch} variant="outline">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        title="Formations"
        description="Découvrez notre catalogue de formations"
      >
        <Button 
          onClick={handleCreateFormation}
          variant="premium"
          className="flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Nouvelle formation
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="glass-card rounded-xl p-6">
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
            {levels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
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

      {/* Formations Grid */}
      {filteredFormations.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={searchTerm || selectedLevel !== 'all' || selectedStatus !== 'all' 
            ? 'Aucune formation trouvée' 
            : 'Aucune formation'}
          description={searchTerm || selectedLevel !== 'all' || selectedStatus !== 'all'
            ? 'Essayez de modifier vos critères de recherche.'
            : 'Créez votre première formation pour enrichir votre catalogue.'}
          action={(!searchTerm && selectedLevel === 'all' && selectedStatus === 'all') ? {
            label: 'Créer une formation',
            onClick: handleCreateFormation,
            variant: 'premium'
          } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
