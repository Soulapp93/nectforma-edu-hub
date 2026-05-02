
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Grid3x3, List, GraduationCap, Copy, ArrowRightLeft, Calendar, ChevronRight, ArrowLeft, Clock, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CreateFormationModal from './CreateFormationModal';
import EditFormationModal from './EditFormationModal';
import FormationCard from './FormationCard';
import FormationParticipantsModal from './FormationParticipantsModal';
import DuplicateFormationModal from './DuplicateFormationModal';
import MigrateStudentsModal from './MigrateStudentsModal';
import { formationService } from '@/services/formationService';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const FormationsList: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isMigrateModalOpen, setIsMigrateModalOpen] = useState(false);
  const [editingFormationId, setEditingFormationId] = useState<string | null>(null);
  const [selectedFormationId, setSelectedFormationId] = useState<string | null>(null);
  const [duplicatingFormation, setDuplicatingFormation] = useState<any>(null);
  const [formations, setFormations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFormationName, setSelectedFormationName] = useState<string | null>(null);
  
  const { userRole } = useCurrentUser();
  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';

  const fetchFormations = async () => {
    try {
      setLoading(true);
      const data = await formationService.getAllFormations();
      
      const formationsWithParticipants = await Promise.all(
        (data || []).map(async (formation) => {
          const participantsCount = await formationService.getFormationParticipantsCount(formation.id);
          return { ...formation, participantsCount };
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

  // Group formations by title (programme name)
  const formationGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    formations.forEach(f => {
      const name = f.title;
      if (!groups[name]) groups[name] = [];
      groups[name].push(f);
    });
    // Sort each group by academic_year desc
    Object.values(groups).forEach(group => {
      group.sort((a, b) => (b.academic_year || '').localeCompare(a.academic_year || ''));
    });
    return groups;
  }, [formations]);

  const formationNames = useMemo(() => Object.keys(formationGroups).sort(), [formationGroups]);

  // If a formation name is selected, show its academic years
  const selectedGroupFormations = useMemo(() => {
    if (!selectedFormationName) return [];
    return formationGroups[selectedFormationName] || [];
  }, [selectedFormationName, formationGroups]);

  const handleCreateFormation = () => setIsCreateModalOpen(true);

  const handleEditFormation = (formationId: string) => {
    setEditingFormationId(formationId);
    setIsEditModalOpen(true);
  };

  const handleViewParticipants = (formationId: string) => {
    setSelectedFormationId(formationId);
    setIsParticipantsModalOpen(true);
  };

  const handleDuplicate = (formation: any) => {
    setDuplicatingFormation(formation);
    setIsDuplicateModalOpen(true);
  };

  const handleSuccess = () => fetchFormations();
  const handleCreateSuccess = () => { fetchFormations(); toast.success('Formation créée avec succès'); };

  const handleDeleteFormation = async (formationId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette formation ? Cette action est irréversible.')) {
      try {
        await formationService.deleteFormation(formationId);
        toast.success('Formation supprimée avec succès');
        fetchFormations();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  // Filtered formation groups for the catalogue view
  const filteredGroups = useMemo(() => {
    return formationNames.filter(name => {
      const group = formationGroups[name];
      const latest = group[0];
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        latest?.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = selectedLevel === 'all' || latest?.level === selectedLevel;
      return matchesSearch && matchesLevel;
    });
  }, [formationNames, formationGroups, searchTerm, selectedLevel]);

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'BAC+1': 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300',
      'BAC+2': 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
      'BAC+3': 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
      'BAC+4': 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300',
      'BAC+5': 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300'
    };
    return colors[level] || 'bg-muted text-muted-foreground';
  };

  if (loading) {
    return <LoadingState message="Chargement des formations..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-2xl shadow-lg border-2 border-primary/20">
        <div className="p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              {selectedFormationName && (
                <button
                  onClick={() => setSelectedFormationName(null)}
                  className="p-2 hover:bg-muted rounded-xl transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-foreground" />
                </button>
              )}
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {selectedFormationName || 'Gestion des formations'}
                </h2>
                {selectedFormationName && (
                  <p className="text-sm text-muted-foreground">
                    {selectedGroupFormations.length} année(s) académique(s)
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isAdmin && (
                <>
                  <Button
                    onClick={() => setIsMigrateModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1.5 text-xs border-primary/30"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Migrer étudiants</span>
                  </Button>
                  <Button 
                    onClick={handleCreateFormation}
                    variant="premium"
                    size="sm"
                    className="flex items-center gap-1.5 text-xs sm:text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Nouvelle formation
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Formation name tabs / navigation */}
          {!selectedFormationName && formationNames.length > 0 && (
            <div className="mb-5">
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-2">
                  {formationNames.map(name => {
                    const count = formationGroups[name].length;
                    const latestFormation = formationGroups[name][0];
                    return (
                      <button
                        key={name}
                        onClick={() => setSelectedFormationName(name)}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-primary/20 bg-card hover:border-primary/40 hover:bg-primary/5 transition-all group"
                      >
                        <div 
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: latestFormation?.color || '#8B5CF6' }}
                        />
                        <span className="text-sm font-medium text-foreground whitespace-nowrap">{name}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                          {count}
                        </Badge>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </button>
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}

          {/* Search and filters */}
          {!selectedFormationName && (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Rechercher une formation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 text-base border-2 border-primary/30 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-[160px] border-2 border-primary/30 rounded-xl">
                  <SelectValue placeholder="Niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous niveaux</SelectItem>
                  <SelectItem value="BAC+1">BAC+1</SelectItem>
                  <SelectItem value="BAC+2">BAC+2</SelectItem>
                  <SelectItem value="BAC+3">BAC+3</SelectItem>
                  <SelectItem value="BAC+4">BAC+4</SelectItem>
                  <SelectItem value="BAC+5">BAC+5</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center bg-muted rounded-xl p-1 border border-primary/10">
                <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="h-8 px-3 rounded-lg">
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="h-8 px-3 rounded-lg">
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {selectedFormationName ? (
        /* Academic years view for a specific formation */
        <div className="space-y-4">
          {selectedGroupFormations.length === 0 ? (
            <EmptyState icon={Calendar} title="Aucune année académique" description="Créez une formation pour commencer." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedGroupFormations.map((formation) => (
                <div key={formation.id} className="relative">
                  {/* Academic year badge */}
                  {formation.academic_year && (
                    <div className="absolute -top-2 left-4 z-10">
                      <Badge className="bg-primary text-primary-foreground text-xs px-2.5 py-0.5 shadow-sm">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formation.academic_year}
                      </Badge>
                    </div>
                  )}
                  <FormationCard
                    {...formation}
                    modules={formation.formation_modules || []}
                    onEdit={isAdmin ? () => handleEditFormation(formation.id) : undefined}
                    onDelete={isAdmin ? () => handleDeleteFormation(formation.id) : undefined}
                    onDuplicate={isAdmin ? () => handleDuplicate(formation) : undefined}
                    isAdmin={isAdmin}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Quick action: create new academic year */}
          {isAdmin && selectedGroupFormations.length > 0 && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => handleDuplicate(selectedGroupFormations[0])}
                className="border-dashed border-2 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50"
              >
                <Copy className="h-4 w-4 mr-2" />
                Créer une nouvelle promotion
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* All formations view - grouped by name, no action buttons */
        <>
          {filteredGroups.length === 0 ? (
            <EmptyState
              icon={Plus}
              title={searchTerm || selectedLevel !== 'all' ? 'Aucune formation trouvée' : 'Aucune formation'}
              description={searchTerm || selectedLevel !== 'all'
                ? 'Essayez de modifier vos critères de recherche.'
                : 'Créez votre première formation pour enrichir votre catalogue.'}
              action={(isAdmin && !searchTerm && selectedLevel === 'all') ? {
                label: 'Créer une formation',
                onClick: handleCreateFormation,
                variant: 'premium'
              } : undefined}
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((name) => {
                const group = formationGroups[name];
                const latest = group[0]; // most recent year
                return (
                  <div
                    key={name}
                    onClick={() => setSelectedFormationName(name)}
                    className="bg-card rounded-2xl shadow-sm border-2 border-primary/20 hover:shadow-lg hover:border-primary/40 transition-all duration-200 cursor-pointer group overflow-hidden"
                  >
                    <div className="h-2 sm:h-2.5" style={{ backgroundColor: latest?.color || '#8B5CF6' }} />
                    <div className="p-3 sm:p-4">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
                        <span className={`px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${getLevelColor(latest?.level)}`}>
                          {latest?.level}
                        </span>
                        <Badge variant="outline" className="text-[10px] sm:text-xs border-primary/30 text-primary">
                          {group.length} promotion{group.length > 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 line-clamp-2">{name}</h3>
                      {latest?.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">{latest.description}</p>
                      )}
                      <div className="space-y-1.5 sm:space-y-2">
                        <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-muted-foreground/70 flex-shrink-0" />
                          <span className="truncate">Du {new Date(latest?.start_date).toLocaleDateString('fr-FR')} au {new Date(latest?.end_date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-muted-foreground/70 flex-shrink-0" />
                          <span>{latest?.duration}h de formation</span>
                        </div>
                        <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                          <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-muted-foreground/70 flex-shrink-0" />
                          <span>{latest?.formation_modules?.length || 0} matière{(latest?.formation_modules?.length || 0) > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border flex items-center justify-end text-xs text-primary font-medium group-hover:translate-x-1 transition-transform">
                        Voir les promotions <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-card rounded-xl overflow-hidden border border-border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-primary/5 border-b border-primary/10">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-sm font-medium text-primary/80">Formation</th>
                      <th className="px-6 py-3.5 text-left text-sm font-medium text-primary/80">Niveau</th>
                      <th className="px-6 py-3.5 text-left text-sm font-medium text-primary/80">Durée</th>
                      <th className="px-6 py-3.5 text-left text-sm font-medium text-primary/80">Matières</th>
                      <th className="px-6 py-3.5 text-left text-sm font-medium text-primary/80">Promotions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredGroups.map((name) => {
                      const group = formationGroups[name];
                      const latest = group[0];
                      return (
                        <tr
                          key={name}
                          className="hover:bg-muted/20 transition-colors cursor-pointer"
                          onClick={() => setSelectedFormationName(name)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: latest?.color || '#8B5CF6' }} />
                              <div>
                                <div className="font-medium text-foreground">{name}</div>
                                {latest?.description && (
                                  <div className="text-xs text-muted-foreground line-clamp-1 max-w-[250px]">{latest.description}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getLevelColor(latest?.level)}`}>{latest?.level}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">{latest?.duration}h</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{latest?.formation_modules?.length || 0} matière{(latest?.formation_modules?.length || 0) > 1 ? 's' : ''}</td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                              {group.length} promotion{group.length > 1 ? 's' : ''}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <CreateFormationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditFormationModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingFormationId(null); }}
        onSuccess={handleSuccess}
        formationId={editingFormationId}
      />

      <DuplicateFormationModal
        isOpen={isDuplicateModalOpen}
        onClose={() => { setIsDuplicateModalOpen(false); setDuplicatingFormation(null); }}
        onSuccess={handleSuccess}
        formation={duplicatingFormation}
      />

      <MigrateStudentsModal
        isOpen={isMigrateModalOpen}
        onClose={() => setIsMigrateModalOpen(false)}
        onSuccess={handleSuccess}
        formations={formations.map(f => ({ id: f.id, title: f.title, academic_year: f.academic_year, color: f.color }))}
      />

      {selectedFormationId && (
        <FormationParticipantsModal
          isOpen={isParticipantsModalOpen}
          onClose={() => { setIsParticipantsModalOpen(false); setSelectedFormationId(null); }}
          formationId={selectedFormationId}
          formationTitle={formations.find(f => f.id === selectedFormationId)?.title || ''}
          formationColor={formations.find(f => f.id === selectedFormationId)?.color}
        />
      )}
    </div>
  );
};

export default FormationsList;
