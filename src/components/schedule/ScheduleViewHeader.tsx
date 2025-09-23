import React from 'react';
import { Calendar, Clock, Users, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Badge } from '@/components/ui/badge';

interface ScheduleViewHeaderProps {
  currentDate: Date;
  weekInfo: { start: string; end: string };
  viewMode: string;
  schedulesCount: number;
}

export const ScheduleViewHeader: React.FC<ScheduleViewHeaderProps> = ({
  currentDate,
  weekInfo,
  viewMode,
  schedulesCount
}) => {
  const { userRole } = useCurrentUser();

  const getRoleDescription = () => {
    switch (userRole) {
      case 'Étudiant':
        return 'Vos cours et formations';
      case 'Formateur':
      case 'Tuteur':
        return 'Vos créneaux d\'enseignement';
      case 'Admin':
      case 'AdminPrincipal':
        return 'Tous les emplois du temps';
      default:
        return 'Emploi du temps';
    }
  };

  const getRoleIcon = () => {
    switch (userRole) {
      case 'Étudiant':
        return BookOpen;
      case 'Formateur':
      case 'Tuteur':
        return Users;
      case 'Admin':
      case 'AdminPrincipal':
        return Calendar;
      default:
        return Clock;
    }
  };

  const Icon = getRoleIcon();

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
              <Icon className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Emploi du Temps</h1>
              <p className="text-muted-foreground">
                {getRoleDescription()} • {' '}
                {viewMode === 'month' 
                  ? format(currentDate, 'MMMM yyyy', { locale: fr })
                  : `Semaine du ${weekInfo.start} au ${weekInfo.end}`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="px-3 py-1">
              <Clock className="h-3 w-3 mr-1" />
              {schedulesCount} cours
            </Badge>
            {userRole && (
              <Badge 
                variant="secondary" 
                className="px-3 py-1"
              >
                {userRole}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};