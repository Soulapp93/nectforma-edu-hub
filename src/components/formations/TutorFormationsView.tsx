import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  GraduationCap,
  Eye,
  Clock,
  Grid3x3,
  List
} from 'lucide-react';
import { useTutorFormations } from '@/hooks/useTutorFormations';
import { useNavigate } from 'react-router-dom';

export const TutorFormationsView: React.FC = () => {
  const { loading, error, getUniqueFormations } = useTutorFormations();
  const navigate = useNavigate();
  const formations = getUniqueFormations();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (formations.length === 0) {
    return (
      <div className="text-center py-12">
        <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Aucune formation trouvée</h3>
        <p className="text-muted-foreground">
          Vous n'avez actuellement aucun apprenti assigné à des formations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec toggle vue */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Formations de mes apprentis</h2>
          <p className="text-muted-foreground text-sm">
            Suivez les formations de vos apprentis et accédez aux détails
          </p>
        </div>
        
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

      {/* Vue Grille */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formations.map((formation) => (
            <Card 
              key={formation.formation_id} 
              className="hover:shadow-md transition-shadow overflow-hidden"
              style={{ borderTopColor: formation.formation_color || '#8B5CF6', borderTopWidth: '4px' }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge 
                        variant="outline"
                        style={{ borderColor: formation.formation_color, color: formation.formation_color }}
                      >
                        {formation.formation_level}
                      </Badge>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Actif
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">
                      {formation.formation_title}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {formation.formation_description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {formation.formation_description}
                  </p>
                )}
                
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Du {new Date(formation.formation_start_date).toLocaleDateString('fr-FR')} au {new Date(formation.formation_end_date).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formation.formation_duration}h de formation</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {formation.modules_count || 0} module{(formation.modules_count || 0) > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Liste des apprentis */}
                <div className="space-y-2 pt-2 border-t">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Mes apprentis :
                  </h4>
                  <div className="space-y-1">
                    {formation.students.map((student: any) => (
                      <div key={student.id} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        {student.first_name} {student.last_name}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => navigate(`/formations/${formation.formation_id}`)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Détail
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Vue Liste */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Niveau</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Formation</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Dates</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Durée</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Modules</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Apprentis</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {formations.map((formation, index) => (
                  <tr 
                    key={formation.formation_id} 
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    <td className="px-6 py-4">
                      <Badge 
                        variant="outline"
                        className="font-medium"
                        style={{ borderColor: formation.formation_color, color: formation.formation_color }}
                      >
                        {formation.formation_level}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{formation.formation_title}</div>
                        {formation.formation_description && (
                          <div className="text-sm text-gray-600 line-clamp-1 mt-1">
                            {formation.formation_description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-gray-900">
                          Du {new Date(formation.formation_start_date).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-gray-600">
                          au {new Date(formation.formation_end_date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{formation.formation_duration}h</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">
                        {formation.modules_count || 0} module{(formation.modules_count || 0) > 1 ? 's' : ''}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {formation.students.map((s: any) => `${s.first_name} ${s.last_name}`).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => navigate(`/formations/${formation.formation_id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Détail
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
