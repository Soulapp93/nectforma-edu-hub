import React, { useState, useMemo } from 'react';
import { Search, Grid3x3, List, GraduationCap, Clock, Calendar, BookOpen, Users, Eye, ArrowLeft, ChevronRight } from 'lucide-react';
import { useFormations } from '@/hooks/useFormations';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TutorFormationsView } from '@/components/formations/TutorFormationsView';
import { PageHeader } from '@/components/ui/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import FormationParticipantsModal from '@/components/administration/FormationParticipantsModal';

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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Actif': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
    case 'Inactif': return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300';
    default: return 'bg-muted text-muted-foreground';
  }
};

const Formations = () => {
  const { userRole } = useCurrentUser();
  
  if (userRole === 'Tuteur') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 min-h-screen">
        <PageHeader 
          title="Formations apprenti"
          description="Suivez les formations de votre apprenti"
          icon={GraduationCap}
        />
        <TutorFormationsView />
      </div>
    );
  }
  
  return <FormationsContent userRole={userRole} />;
};

const FormationsContent = ({ userRole }: { userRole: string | null }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [participantsFormationId, setParticipantsFormationId] = useState<string | null>(null);
  const [participantsFormationTitle, setParticipantsFormationTitle] = useState('');
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedProgramName, setSelectedProgramName] = useState<string | null>(null);
  const navigate = useNavigate();

  const { formations, loading, error, refetch } = useFormations();

  const levels = ['BAC+1', 'BAC+2', 'BAC+3', 'BAC+4', 'BAC+5'];

  // Group formations by title (program)
  const formationGroups = useMemo(() => {
    const filtered = (formations || []).filter(f => {
      const matchesSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = selectedLevel === 'all' || f.level === selectedLevel;
      const matchesStatus = selectedStatus === 'all' || f.status === selectedStatus;
      return matchesSearch && matchesLevel && matchesStatus;
    });

    const groups: Record<string, typeof filtered> = {};
    filtered.forEach(f => {
      const name = f.title;
      if (!groups[name]) groups[name] = [];
      groups[name].push(f);
    });
    Object.values(groups).forEach(group => {
      group.sort((a, b) => ((b as any).academic_year || '').localeCompare((a as any).academic_year || ''));
    });
    return groups;
  }, [formations, searchTerm, selectedLevel, selectedStatus]);

  const programNames = useMemo(() => Object.keys(formationGroups).sort(), [formationGroups]);

  const selectedGroupFormations = useMemo(() => {
    if (!selectedProgramName) return [];
    return formationGroups[selectedProgramName] || [];
  }, [selectedProgramName, formationGroups]);

  const isNetworkError = error?.toLowerCase().includes('load failed') || 
                         error?.toLowerCase().includes('failed to fetch');

  if (loading) {
    return <div className="p-8"><LoadingState message="Chargement des formations..." /></div>;
  }

  if (error) {
    return <div className="p-8"><ErrorState title="Erreur de chargement" message={error} onRetry={refetch} isNetworkError={isNetworkError} /></div>;
  }

  // Promotions view for a selected program
  if (selectedProgramName) {
    return (
      <div className="min-h-screen">
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedProgramName(null)}
                className="p-2 hover:bg-muted rounded-xl transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </button>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
                <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{selectedProgramName}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">{selectedGroupFormations.length} promotion(s) disponible(s)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {selectedGroupFormations.length === 0 ? (
            <EmptyState icon={Calendar} title="Aucune promotion" description="Aucune promotion disponible pour ce programme." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {selectedGroupFormations.map((formation) => (
                <Card
                  key={formation.id}
                  className="hover:shadow-lg transition-all duration-200 overflow-hidden border border-border/60"
                >
                  <div className="h-1.5 rounded-t-xl" style={{ backgroundColor: formation.color || '#8B5CF6' }} />
                  <CardContent className="p-4 pb-3">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {(formation as any).academic_year && (
                        <Badge className="bg-primary text-primary-foreground text-xs px-2.5 py-0.5">
                          <Calendar className="h-3 w-3 mr-1" />
                          {(formation as any).academic_year}
                        </Badge>
                      )}
                      <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-md ${getLevelColor(formation.level)}`}>
                        {formation.level}
                      </span>
                      <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-md ${getStatusColor(formation.status)}`}>
                        {formation.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground mb-3 line-clamp-2">{formation.title}</h3>

                    <div className="space-y-2 text-[13px] text-muted-foreground mb-4">
                      <div className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-2 flex-shrink-0 text-muted-foreground/70" />
                        Du {new Date(formation.start_date).toLocaleDateString('fr-FR')} au {new Date(formation.end_date).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-2 flex-shrink-0 text-muted-foreground/70" />
                        {formation.duration}h de formation
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="h-3.5 w-3.5 mr-2 flex-shrink-0 text-muted-foreground/70" />
                        {formation.formation_modules?.length || 0} module{(formation.formation_modules?.length || 0) > 1 ? 's' : ''}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs bg-muted/50 border-border/60 text-muted-foreground hover:bg-muted"
                        onClick={() => {
                          setParticipantsFormationId(formation.id);
                          setParticipantsFormationTitle(formation.title);
                          setShowParticipantsModal(true);
                        }}
                      >
                        <Users className="h-3.5 w-3.5 mr-1.5" />
                        ({formation.max_students || 0})
                      </Button>
                      <Button
                        size="sm"
                        className="w-full text-xs text-white shadow-sm"
                        style={{ backgroundColor: formation.color || '#8B5CF6' }}
                        onClick={() => navigate(`/formations/${formation.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        Détail
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {participantsFormationId && (
          <FormationParticipantsModal
            isOpen={showParticipantsModal}
            onClose={() => { setShowParticipantsModal(false); setParticipantsFormationId(null); }}
            formationId={participantsFormationId}
            formationTitle={participantsFormationTitle}
          />
        )}
      </div>
    );
  }

  // Programs list view
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
              <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Formations</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Découvrez notre catalogue de formations</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Filters */}
        <div className="bg-card rounded-2xl shadow-lg border-2 border-primary/20 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Catalogue des formations</h2>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher une formation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-base border-2 border-primary/30 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-[180px] border-2 border-primary/30 rounded-xl">
                <SelectValue placeholder="Tous les niveaux" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                {levels.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px] border-2 border-primary/30 rounded-xl">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="Actif">Actif</SelectItem>
                <SelectItem value="Inactif">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Programs Grid */}
        {programNames.length === 0 ? (
          <div className="bg-card rounded-xl shadow-sm border border-border p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3">
              {searchTerm || selectedLevel !== 'all' || selectedStatus !== 'all' ? 'Aucune formation trouvée' : 'Aucune formation'}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedLevel !== 'all' || selectedStatus !== 'all' ? 'Essayez de modifier vos critères de recherche.' : 'Aucune formation disponible pour le moment.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {programNames.map((name) => {
              const group = formationGroups[name];
              const latest = group[0];
              return (
                <div
                  key={name}
                  onClick={() => setSelectedProgramName(name)}
                  className="bg-card rounded-2xl shadow-sm border-2 border-primary/20 hover:shadow-lg hover:border-primary/40 transition-all duration-200 cursor-pointer group overflow-hidden"
                >
                  <div className="h-2" style={{ backgroundColor: latest?.color || '#8B5CF6' }} />
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {latest?.level && (
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${getLevelColor(latest.level)}`}>
                          {latest.level}
                        </span>
                      )}
                      <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                        {group.length} promotion{group.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1 line-clamp-2">{name}</h3>
                    {latest?.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{latest.description}</p>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground/70 flex-shrink-0" />
                        <span>{latest?.duration || 0}h de formation</span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5 mr-1.5 text-muted-foreground/70 flex-shrink-0" />
                        <span>{latest?.formation_modules?.length || 0} module{(latest?.formation_modules?.length || 0) > 1 ? 's' : ''}</span>
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
        )}
      </div>

      {participantsFormationId && (
        <FormationParticipantsModal
          isOpen={showParticipantsModal}
          onClose={() => { setShowParticipantsModal(false); setParticipantsFormationId(null); }}
          formationId={participantsFormationId}
          formationTitle={participantsFormationTitle}
        />
      )}
    </div>
  );
};

export default Formations;
