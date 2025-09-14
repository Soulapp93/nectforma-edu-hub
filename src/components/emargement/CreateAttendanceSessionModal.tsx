import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, FileText, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { scheduleService, ScheduleSlot } from '@/services/scheduleService';
import { toast } from 'sonner';
import GeneratedAttendanceSheet from './GeneratedAttendanceSheet';

interface CreateAttendanceSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  formationId: string;
  formationTitle: string;
  formationColor: string;
}

const CreateAttendanceSessionModal: React.FC<CreateAttendanceSessionModalProps> = ({
  isOpen,
  onClose,
  formationId,
  formationTitle,
  formationColor
}) => {
  const [todaysSchedules, setTodaysSchedules] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [generatingSheet, setGeneratingSheet] = useState(false);
  const [showAttendanceSheet, setShowAttendanceSheet] = useState(false);
  const [attendanceSessionData, setAttendanceSessionData] = useState<any>(null);

  // Récupérer les cours du jour pour cette formation
  useEffect(() => {
    const fetchTodaysSchedules = async () => {
      if (!isOpen) return;
      
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        
        // Récupérer tous les créneaux publiés
        const allSchedules = await scheduleService.getAllPublishedSchedules();
        
        // Filtrer pour aujourd'hui
        const todaysSlots = allSchedules.filter(slot => {
          return slot.date === today;
        });
        
        setTodaysSchedules(todaysSlots);
      } catch (error) {
        console.error('Erreur lors du chargement des cours:', error);
        toast.error('Erreur lors du chargement des cours du jour');
      } finally {
        setLoading(false);
      }
    };

    fetchTodaysSchedules();
  }, [isOpen, formationId]);

  const generateAttendanceSheet = async (slot: ScheduleSlot) => {
    setGeneratingSheet(true);
    try {
      // Simuler la génération de la feuille d'émargement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Préparer les données de la session
      const sessionData = {
        formationTitle,
        moduleTitle: slot.formation_modules?.title || 'Module',
        date: slot.date,
        startTime: formatTime(slot.start_time),
        endTime: formatTime(slot.end_time),
        room: slot.room,
        instructor: slot.users ? `${slot.users.first_name} ${slot.users.last_name}` : 'Formateur',
        formationColor
      };
      
      setAttendanceSessionData(sessionData);
      setShowAttendanceSheet(true);
      
      toast.success('Feuille d\'émargement générée avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la génération de la feuille');
    } finally {
      setGeneratingSheet(false);
    }
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Afficher seulement HH:MM
  };

  if (showAttendanceSheet && attendanceSessionData) {
    return (
      <GeneratedAttendanceSheet
        sessionData={attendanceSessionData}
        onClose={() => {
          setShowAttendanceSheet(false);
          onClose();
        }}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Créer une session d'émargement - {formationTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-lg">Chargement des cours du jour...</div>
            </div>
          ) : todaysSchedules.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun cours programmé aujourd'hui
              </h3>
              <p className="text-gray-600">
                Il n'y a pas de cours programmé pour cette formation aujourd'hui.
              </p>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-600">
                Sélectionnez le cours pour lequel vous souhaitez créer une session d'émargement :
              </div>
              
              <div className="space-y-3">
                {todaysSchedules.map((slot) => (
                  <Card 
                    key={slot.id} 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedSlot?.id === slot.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold"
                            style={{ backgroundColor: formationColor }}
                          >
                            <Clock className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {slot.formation_modules?.title || 'Module'}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                              </div>
                              {slot.room && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>Salle {slot.room}</span>
                                </div>
                              )}
                              {slot.users && (
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  <span>{slot.users.first_name} {slot.users.last_name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {format(new Date(), 'PPP', { locale: fr })}
                          </Badge>
                          {selectedSlot?.id === slot.id && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedSlot && (
                <div className="border-t pt-4">
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium mb-2">Aperçu de la feuille d'émargement</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Formation:</strong> {formationTitle}</div>
                      <div><strong>Module:</strong> {selectedSlot.formation_modules?.title}</div>
                      <div><strong>Date:</strong> {format(new Date(), 'PPP', { locale: fr })}</div>
                      <div><strong>Horaire:</strong> {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}</div>
                      {selectedSlot.room && (
                        <div><strong>Salle:</strong> {selectedSlot.room}</div>
                      )}
                      {selectedSlot.users && (
                        <div><strong>Formateur:</strong> {selectedSlot.users.first_name} {selectedSlot.users.last_name}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => generateAttendanceSheet(selectedSlot)}
                      disabled={generatingSheet}
                      className="flex-1"
                    >
                      {generatingSheet ? (
                        'Génération en cours...'
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Générer la feuille d'émargement
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAttendanceSessionModal;