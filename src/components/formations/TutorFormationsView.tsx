import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  GraduationCap,
  Eye
} from 'lucide-react';
import { useTutorFormations } from '@/hooks/useTutorFormations';
import { useNavigate } from 'react-router-dom';

export const TutorFormationsView: React.FC = () => {
  const { loading, error, getUniqueFormations } = useTutorFormations();
  const navigate = useNavigate();
  const formations = getUniqueFormations();

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Formations de mes apprentis</h2>
          <p className="text-muted-foreground">
            Suivez les formations de vos apprentis et accédez aux détails
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {formations.map((formation) => (
          <Card key={formation.formation_id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">
                    {formation.formation_title}
                  </CardTitle>
                  <Badge variant="secondary" className="mb-2">
                    {formation.formation_level}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {formation.formation_description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {formation.formation_description}
                </p>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  Du {new Date(formation.formation_start_date).toLocaleDateString('fr-FR')} 
                  au {new Date(formation.formation_end_date).toLocaleDateString('fr-FR')}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>
                  {formation.students.length} apprenti{formation.students.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Liste des apprentis */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Mes apprentis :</h4>
                <div className="space-y-1">
                  {formation.students.map((student: any) => (
                    <div key={student.id} className="text-xs text-muted-foreground flex items-center gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      {student.first_name} {student.last_name}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/formations/${formation.formation_id}`)}
                  className="flex-1 gap-1"
                >
                  <Eye className="h-3 w-3" />
                  Voir détails
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};