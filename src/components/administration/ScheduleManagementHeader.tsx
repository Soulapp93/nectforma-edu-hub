import React from 'react';
import { Calendar, Clock, Users, BookOpen, Plus, FileSpreadsheet, CheckCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Schedule } from '@/services/scheduleService';

interface ScheduleManagementHeaderProps {
  currentDate: Date;
  weekInfo: { start: string; end: string };
  viewMode: string;
  selectedSchedule: Schedule | null;
  schedulesCount: number;
  slotsCount: number;
  onAddSlot: () => void;
  onImportExcel: () => void;
  onPublishSchedule?: () => void;
  onBackToList: () => void;
}

export const ScheduleManagementHeader: React.FC<ScheduleManagementHeaderProps> = ({
  currentDate,
  weekInfo,
  viewMode,
  selectedSchedule,
  schedulesCount,
  slotsCount,
  onAddSlot,
  onImportExcel,
  onPublishSchedule,
  onBackToList
}) => {
  const getTitle = () => {
    if (selectedSchedule) {
      return selectedSchedule.title;
    }
    return 'Gestion des Emplois du Temps';
  };

  const getSubtitle = () => {
    if (selectedSchedule) {
      return `${selectedSchedule.formations?.title || 'Formation'} • ${selectedSchedule.academic_year} • ${slotsCount} créneaux`;
    }
    return `Gestion et création des emplois du temps • ${schedulesCount} emplois du temps`;
  };

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
              <Calendar className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{getTitle()}</h1>
              <p className="text-muted-foreground">
                {getSubtitle()} • {' '}
                {viewMode === 'month' 
                  ? format(currentDate, 'MMMM yyyy', { locale: fr })
                  : `Semaine du ${weekInfo.start} au ${weekInfo.end}`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Badges informatifs */}
            <Badge variant="outline" className="px-3 py-1">
              <Clock className="h-3 w-3 mr-1" />
              {slotsCount} créneaux
            </Badge>
            
            {selectedSchedule && (
              <>
                <Badge 
                  variant="secondary" 
                  className={selectedSchedule.status === 'Publié' ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}
                >
                  {selectedSchedule.status}
                </Badge>

                {/* Boutons d'action pour un emploi du temps sélectionné */}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onBackToList}
                  className="hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Retour à la liste
                </Button>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onImportExcel}
                  className="hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Import Excel
                </Button>

                <Button 
                  onClick={onAddSlot}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un créneau
                </Button>

                {selectedSchedule.status === 'Brouillon' && onPublishSchedule && (
                  <Button 
                    onClick={onPublishSchedule}
                    size="sm"
                    disabled={slotsCount === 0}
                    variant="default"
                    className="bg-success hover:bg-success/90 hover:shadow-lg hover:shadow-success/25 transition-all duration-300"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Publier
                  </Button>
                )}

                {selectedSchedule.status === 'Publié' && (
                  <>
                    <Button 
                      onClick={() => {
                        // Forcer un rechargement des données et envoyer notifications
                        if (selectedSchedule) {
                          // Marquer comme modifié pour déclencher les notifications
                          onPublishSchedule && onPublishSchedule();
                        }
                      }}
                      size="sm"
                      variant="outline"
                      className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Enregistrer les modifications
                    </Button>
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Publié</span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};