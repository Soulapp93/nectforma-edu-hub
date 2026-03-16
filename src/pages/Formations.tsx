import React, { useState } from 'react';
import { Search, Grid3x3, List, GraduationCap, Clock, Calendar, BookOpen, Users, Eye } from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui/card';
import FormationParticipantsModal from '@/components/administration/FormationParticipantsModal';

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
  const navigate = useNavigate();

  const { formations, loading, error, refetch } = useFormations();

  const levels = ['BAC+1', 'BAC+2', 'BAC+3', 'BAC+4', 'BAC+5'];

  const filteredFormations = (formations || []).filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || f.level === selectedLevel;
    const matchesStatus = selectedStatus === 'all' || f.status === selectedStatus;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const isNetworkError = error?.toLowerCase().includes('load failed') || 
                         error?.toLowerCase().includes('failed to fetch');

  if (loading) {
    return <div className="p-8"><LoadingState message="Chargement des formations..." /></div>;
  }

  if (error) {
    return <div className="p-8"><ErrorState title="Erreur de chargement" message={error} onRetry={refetch} isNetworkError={isNetworkError} /></div>;
  }

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
            <div className="flex items-center bg-muted rounded-xl p-1 border border-primary/10">
              <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="h-8 px-3 rounded-lg">
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="h-8 px-3 rounded-lg">
                <List className="h-4 w-4" />
              </Button>
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

        {/* Formations Grid */}
        {filteredFormations.length === 0 ? (
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
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {filteredFormations.map((formation) => (
              <Card
                key={formation.id}
                className="hover:shadow-lg hover:border-primary/40 transition-all duration-200 overflow-hidden"
              >
                <div className="h-2" style={{ backgroundColor: formation.color || '#8B5CF6' }} />
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getLevelColor(formation.level)}`}>
                      {formation.level}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(formation.status)}`}>
                      {formation.status}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 line-clamp-2">{formation.title}</h3>

                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                      Du {new Date(formation.start_date).toLocaleDateString('fr-FR')} au {new Date(formation.end_date).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                      {formation.duration}h de formation
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                      {formation.formation_modules?.length || 0} module{(formation.formation_modules?.length || 0) > 1 ? 's' : ''}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setParticipantsFormationId(formation.id);
                        setParticipantsFormationTitle(formation.title);
                        setShowParticipantsModal(true);
                      }}
                    >
                      <Users className="h-3.5 w-3.5 mr-1" />
                      ({formation.max_students || 0})
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs"
                      onClick={() => navigate(`/formations/${formation.id}`)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Détail
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl overflow-hidden border border-border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary/5 border-b border-primary/10">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-sm font-medium text-primary/80">Formation</th>
                    <th className="px-6 py-3.5 text-left text-sm font-medium text-primary/80">Niveau</th>
                    <th className="px-6 py-3.5 text-left text-sm font-medium text-primary/80">Statut</th>
                    <th className="px-6 py-3.5 text-left text-sm font-medium text-primary/80">Durée</th>
                    <th className="px-6 py-3.5 text-left text-sm font-medium text-primary/80">Modules</th>
                    <th className="px-6 py-3.5 text-left text-sm font-medium text-primary/80">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredFormations.map((formation) => (
                    <tr key={formation.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-10 rounded-full" style={{ backgroundColor: formation.color || '#8B5CF6' }} />
                          <div>
                            <div className="font-medium text-foreground">{formation.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(formation.start_date).toLocaleDateString('fr-FR')} - {new Date(formation.end_date).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getLevelColor(formation.level)}`}>{formation.level}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(formation.status)}`}>{formation.status}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">{formation.duration}h</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{formation.formation_modules?.length || 0}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              setParticipantsFormationId(formation.id);
                              setParticipantsFormationTitle(formation.title);
                              setShowParticipantsModal(true);
                            }}
                          >
                            <Users className="h-3.5 w-3.5 mr-1" />
                            ({formation.max_students || 0})
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs"
                            onClick={() => navigate(`/formations/${formation.id}`)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Détail
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Participants Modal */}
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
