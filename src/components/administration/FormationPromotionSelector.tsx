import React, { useState, useMemo } from 'react';
import { ArrowLeft, Calendar, ChevronRight, Clock, BookOpen, GraduationCap, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface Formation {
  id: string;
  title: string;
  description?: string;
  level?: string;
  start_date: string;
  end_date: string;
  color?: string;
  duration?: number;
  academic_year?: string;
  status?: string;
  formation_modules?: any[];
  [key: string]: any;
}

interface FormationPromotionSelectorProps {
  formations: Formation[];
  loading: boolean;
  icon?: React.ElementType;
  title: string;
  onPromotionSelect: (formation: Formation) => void;
  headerActions?: React.ReactNode;
  emptyMessage?: string;
}

const getLevelColor = (level?: string) => {
  const colors: Record<string, string> = {
    'BAC+1': 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300',
    'BAC+2': 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
    'BAC+3': 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
    'BAC+4': 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300',
    'BAC+5': 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300'
  };
  return colors[level || ''] || 'bg-muted text-muted-foreground';
};

const FormationPromotionSelector: React.FC<FormationPromotionSelectorProps> = ({
  formations,
  loading,
  icon: Icon = GraduationCap,
  title,
  onPromotionSelect,
  headerActions,
  emptyMessage = 'Aucune formation disponible.'
}) => {
  const [selectedProgramName, setSelectedProgramName] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Group formations by title (programme name)
  const formationGroups = useMemo(() => {
    const groups: Record<string, Formation[]> = {};
    formations.forEach(f => {
      const name = f.title;
      if (!groups[name]) groups[name] = [];
      groups[name].push(f);
    });
    Object.values(groups).forEach(group => {
      group.sort((a, b) => (b.academic_year || '').localeCompare(a.academic_year || ''));
    });
    return groups;
  }, [formations]);

  const programNames = useMemo(() => Object.keys(formationGroups).sort(), [formationGroups]);

  const filteredPrograms = useMemo(() => {
    return programNames.filter(name => 
      name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [programNames, searchTerm]);

  const selectedGroupFormations = useMemo(() => {
    if (!selectedProgramName) return [];
    return formationGroups[selectedProgramName] || [];
  }, [selectedProgramName, formationGroups]);

  if (loading) {
    return <LoadingState message="Chargement..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-2xl shadow-lg border-2 border-primary/20">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              {selectedProgramName && (
                <button
                  onClick={() => setSelectedProgramName(null)}
                  className="p-2 hover:bg-muted rounded-xl transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-foreground" />
                </button>
              )}
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {selectedProgramName || title}
                </h2>
                {selectedProgramName && (
                  <p className="text-sm text-muted-foreground">
                    {selectedGroupFormations.length} promotion(s)
                  </p>
                )}
              </div>
            </div>
            {!selectedProgramName && headerActions}
          </div>

          {/* Search (only in programs view) */}
          {!selectedProgramName && programNames.length > 3 && (
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
          )}
        </div>
      </div>

      {/* Content */}
      {selectedProgramName ? (
        // Promotions view
        <div className="space-y-4">
          {selectedGroupFormations.length === 0 ? (
            <EmptyState icon={Calendar} title="Aucune promotion" description="Aucune promotion pour ce programme." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedGroupFormations.map((formation) => (
                <div
                  key={formation.id}
                  onClick={() => onPromotionSelect(formation)}
                  className="bg-card rounded-2xl shadow-sm border-2 border-primary/20 hover:shadow-lg hover:border-primary/40 transition-all duration-200 cursor-pointer group overflow-hidden"
                >
                  <div className="h-1.5 rounded-t-xl" style={{ backgroundColor: formation.color || '#8B5CF6' }} />
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {formation.academic_year && (
                        <Badge className="bg-primary text-primary-foreground text-xs px-2.5 py-0.5">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formation.academic_year}
                        </Badge>
                      )}
                      {formation.level && (
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${getLevelColor(formation.level)}`}>
                          {formation.level}
                        </span>
                      )}
                      <Badge variant="secondary" className="text-[10px]">{formation.status}</Badge>
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">{formation.title}</h3>
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground/70 flex-shrink-0" />
                        <span>Du {new Date(formation.start_date).toLocaleDateString('fr-FR')} au {new Date(formation.end_date).toLocaleDateString('fr-FR')}</span>
                      </div>
                      {formation.duration && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground/70 flex-shrink-0" />
                          <span>{formation.duration}h</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-end text-xs text-primary font-medium group-hover:translate-x-1 transition-transform">
                      Accéder <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Programs view
        <>
          {filteredPrograms.length === 0 ? (
            <EmptyState
              icon={Icon as any}
              title="Aucune formation"
              description={emptyMessage}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrograms.map((name) => {
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
        </>
      )}
    </div>
  );
};

export default FormationPromotionSelector;
