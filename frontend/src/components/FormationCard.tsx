
import React from 'react';
import { Users, BookOpen, User, Clock } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';

interface FormationCardProps {
  id: number;
  title: string;
  level: string;
  students: number;
  modules: number;
  instructor: string;
  status: 'Actif' | 'Inactif' | 'Brouillon';
  color: string;
  description?: string;
  duration?: string;
  maxStudents?: string;
}

const FormationCard: React.FC<FormationCardProps> = ({
  title,
  level,
  students,
  modules,
  instructor,
  status,
  color,
  description,
  duration,
  maxStudents
}) => {
  return (
    <div className="course-card rounded-xl overflow-hidden floating-card">
      <div className="h-32 relative" style={{ backgroundColor: color }}>
        <div className="absolute top-4 right-4">
          <StatusBadge status={status} type="formation" />
        </div>
        <div className="absolute bottom-4 left-4 text-primary-foreground">
          <h3 className="font-semibold text-lg mb-1">{level}</h3>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="font-semibold text-foreground mb-2 text-lg">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{description}</p>
        )}
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-2" />
            {students} étudiant{students > 1 ? 's' : ''} inscrit{students > 1 ? 's' : ''}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4 mr-2" />
            {modules} module{modules > 1 ? 's' : ''}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <User className="h-4 w-4 mr-2" />
            {instructor}
          </div>
          {duration && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-2" />
              {duration}h de formation
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button className="text-primary hover:text-primary/80 text-sm font-medium transition-colors">
            Voir détails
          </button>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-xs border border-border rounded-lg hover:bg-muted transition-colors">
              Modifier
            </button>
            <button className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              Gérer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormationCard;
