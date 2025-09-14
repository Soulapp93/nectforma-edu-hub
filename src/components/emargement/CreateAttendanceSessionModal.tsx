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
import { demoDataService } from '@/services/demoDataService';
import { supabase } from '@/integrations/supabase/client';

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
  const [todaysSchedules, setTodaysSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [generatingSheet, setGeneratingSheet] = useState(false);
  const [showAttendanceSheet, setShowAttendanceSheet] = useState(false);
  const [attendanceSessionData, setAttendanceSessionData] = useState<any>(null);

  // Utiliser les données de démonstration pour les cours d'aujourd'hui
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      // Simuler un délai de chargement
      setTimeout(() => {
        const demoSchedules = demoDataService.getTodaySchedules();
        setTodaysSchedules(demoSchedules);
        setLoading(false);
      }, 500);
    }
  }, [isOpen]);

  const generateAttendanceSheet = async (slot: any) => {
    setGeneratingSheet(true);
    try {
      // Chercher ou créer un planning pour cette formation
      let { data: existingSchedule, error: scheduleError } = await supabase
        .from('schedules')
        .select('id')
        .eq('formation_id', formationId)
        .limit(1)
        .single();

      let scheduleId = existingSchedule?.id;

      // Si aucun planning n'existe, en créer un
      if (!scheduleId) {
        const { data: newSchedule, error: newScheduleError } = await supabase
          .from('schedules')
          .insert({
            formation_id: formationId,
            title: `Planning - ${formationTitle}`,
            academic_year: '2025-2026',
            status: 'Publié'
          })
          .select()
          .single();

        if (newScheduleError) throw newScheduleError;
        scheduleId = newSchedule.id;
      }

      // Créer un créneau d'horaire pour cette session
      const { data: scheduleSlot, error: slotError } = await supabase
        .from('schedule_slots')
        .insert({
          schedule_id: scheduleId,
          date: new Date().toISOString().split('T')[0],
          start_time: slot.start_time,
          end_time: slot.end_time,
          room: slot.room
        })
        .select()
        .single();

      if (slotError) throw slotError;

      // Créer la feuille d'émargement
      const { data, error } = await supabase
        .from('attendance_sheets')
        .insert({
          schedule_slot_id: scheduleSlot.id,
          formation_id: formationId,
          title: `${slot.formation_title} - ${slot.module_title}`,
          date: new Date().toISOString().split('T')[0],
          start_time: slot.start_time,
          end_time: slot.end_time,
          room: slot.room,
          status: 'En cours',
          is_open_for_signing: true,
          opened_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setAttendanceSessionData({ id: data.id });
        setShowAttendanceSheet(true);
        
        toast.success('Feuille d\'émargement générée avec succès !');
      }
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      toast.error(`Erreur lors de la génération: ${error.message}`);
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
        attendanceSheetId={attendanceSessionData.id}
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
                              {slot.module_title}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{slot.start_time} - {slot.end_time}</span>
                              </div>
                              {slot.room && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{slot.room}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{slot.instructor_name}</span>
                              </div>
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
                      <div><strong>Formation:</strong> {selectedSlot.formation_title}</div>
                      <div><strong>Module:</strong> {selectedSlot.module_title}</div>
                      <div><strong>Date:</strong> {format(new Date(), 'PPP', { locale: fr })}</div>
                      <div><strong>Horaire:</strong> {selectedSlot.start_time} - {selectedSlot.end_time}</div>
                      {selectedSlot.room && (
                        <div><strong>Salle:</strong> {selectedSlot.room}</div>
                      )}
                      <div><strong>Formateur:</strong> {selectedSlot.instructor_name}</div>
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