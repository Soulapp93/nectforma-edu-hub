import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, FileText, CheckCircle, QrCode, Link2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import QRAttendanceManager from './QRAttendanceManager';
import LinkAttendanceSetup from './LinkAttendanceSetup';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface CreateAttendanceSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  formationId: string;
  formationTitle: string;
  formationColor: string;
}

type SessionMode = 'qr' | 'link' | null;

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
  const [showQRManager, setShowQRManager] = useState(false);
  const [showLinkSetup, setShowLinkSetup] = useState(false);
  const [attendanceSessionData, setAttendanceSessionData] = useState<any>(null);
  const [sessionMode, setSessionMode] = useState<SessionMode>(null);
  const { userId, loading: userLoading, userRole } = useCurrentUser();

  useEffect(() => {
    const fetchTodaySchedules = async () => {
      if (isOpen && formationId) {
        setLoading(true);
        try {
          const today = new Date().toISOString().split('T')[0];
          const { data: scheduleSlots, error } = await supabase
            .from('schedule_slots')
            .select(`
              *,
              formation_modules(title),
              users(first_name, last_name),
              schedules!inner(
                id,
                formation_id,
                title,
                formations(title, color)
              )
            `)
            .eq('schedules.formation_id', formationId)
            .eq('date', today)
            .order('start_time', { ascending: true });

          if (error) throw error;
          setTodaysSchedules(scheduleSlots || []);
        } catch (error) {
          console.error('Erreur chargement emploi du temps:', error);
          toast.error('Erreur lors du chargement des cours');
        } finally {
          setLoading(false);
        }
      }
    };

    if (isOpen) {
      fetchTodaySchedules();
      // Reset state when opening
      setSelectedSlot(null);
      setSessionMode(null);
      setShowQRManager(false);
      setShowLinkSetup(false);
      setAttendanceSessionData(null);
    }
  }, [isOpen, formationId]);

  const getOrCreateAttendanceSheet = async (slot: any): Promise<any> => {
    if (!userId || userLoading) {
      toast.error('Utilisateur non identifié. Veuillez vous reconnecter.');
      return null;
    }

    const scheduleSlotId = slot.id;

    // Check if sheet already exists
    const { data: existingSheet, error: checkError } = await supabase
      .from('attendance_sheets')
      .select('*, formations(title, color)')
      .eq('schedule_slot_id', scheduleSlotId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingSheet) {
      return existingSheet;
    }

    // Create new sheet
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);
    const moduleTitle = slot.formation_modules?.title || 'Module non défini';
    const formationTitleFromSlot = slot.schedules?.formations?.title || formationTitle;

    const attendanceData: any = {
      schedule_slot_id: scheduleSlotId,
      formation_id: formationId,
      title: `${formationTitleFromSlot} - ${moduleTitle}`,
      date: slot.date || new Date().toISOString().split('T')[0],
      start_time: slot.start_time,
      end_time: slot.end_time,
      room: slot.room,
      status: 'En cours',
      is_open_for_signing: true,
      opened_at: new Date().toISOString(),
    };

    if (isValidUUID) {
      attendanceData.instructor_id = userId;
    }

    const { data, error } = await supabase
      .from('attendance_sheets')
      .insert(attendanceData)
      .select('*, formations(title, color)')
      .single();

    if (error) {
      if (error.code === '23505') {
        // Duplicate — re-fetch
        const { data: refetched } = await supabase
          .from('attendance_sheets')
          .select('*, formations(title, color)')
          .eq('schedule_slot_id', scheduleSlotId)
          .single();
        return refetched;
      }
      throw error;
    }

    return data;
  };

  const handleModeSelect = async (mode: SessionMode) => {
    if (!selectedSlot) return;
    setSessionMode(mode);
    setGeneratingSheet(true);

    try {
      const sheet = await getOrCreateAttendanceSheet(selectedSlot);
      if (!sheet) return;

      setAttendanceSessionData(sheet);

      if (mode === 'qr') {
        setShowQRManager(true);
      } else if (mode === 'link') {
        setShowLinkSetup(true);
      }
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      toast.error(`Erreur: ${error.message}`);
      setSessionMode(null);
    } finally {
      setGeneratingSheet(false);
    }
  };

  // Show QR Manager view
  if (showQRManager && attendanceSessionData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Gestion de l'émargement - {formationTitle}
            </DialogTitle>
          </DialogHeader>
          <QRAttendanceManager
            attendanceSheet={attendanceSessionData}
            instructorId={attendanceSessionData.instructor_id || userId || ''}
            onUpdate={() => console.log('Session updated')}
          />
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose}>Fermer</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show Link Setup view
  if (showLinkSetup && attendanceSessionData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              Envoi des liens d'émargement - {formationTitle}
            </DialogTitle>
          </DialogHeader>
          <LinkAttendanceSetup
            attendanceSheet={attendanceSessionData}
            formationId={formationId}
            isAdmin={userRole === 'Admin' || userRole === 'AdminPrincipal'}
            onBack={() => {
              setShowLinkSetup(false);
              setSessionMode(null);
            }}
            onLinksGenerated={() => {
              // Switch to QR manager for live tracking
              setShowLinkSetup(false);
              setShowQRManager(true);
            }}
          />
        </DialogContent>
      </Dialog>
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
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Aucun cours programmé aujourd'hui
              </h3>
              <p className="text-muted-foreground">
                Il n'y a pas de cours programmé pour cette formation aujourd'hui.
              </p>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                Sélectionnez le cours pour lequel vous souhaitez créer une session d'émargement :
              </div>

              <div className="space-y-3">
                {todaysSchedules.map((slot) => {
                  const moduleTitle = slot.formation_modules?.title || 'Module non défini';
                  const instructorName = slot.users
                    ? `${slot.users.first_name} ${slot.users.last_name}`
                    : 'Formateur non assigné';

                  return (
                    <Card
                      key={slot.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedSlot?.id === slot.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => {
                        setSelectedSlot(slot);
                        setSessionMode(null);
                      }}
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
                              <h4 className="font-semibold text-foreground">{moduleTitle}</h4>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    {slot.start_time.substring(0, 5)} -{' '}
                                    {slot.end_time.substring(0, 5)}
                                  </span>
                                </div>
                                {slot.room && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{slot.room}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  <span>{instructorName}</span>
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
                  );
                })}
              </div>

              {/* Mode selection after slot is selected */}
              {selectedSlot && (
                <div className="border-t pt-4 space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium mb-2 text-foreground">Aperçu de la session</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        <strong>Module:</strong>{' '}
                        {selectedSlot.formation_modules?.title || 'Module non défini'}
                      </div>
                      <div>
                        <strong>Horaire:</strong>{' '}
                        {selectedSlot.start_time.substring(0, 5)} -{' '}
                        {selectedSlot.end_time.substring(0, 5)}
                      </div>
                      {selectedSlot.room && (
                        <div>
                          <strong>Salle:</strong> {selectedSlot.room}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-sm font-medium text-foreground">
                    Choisissez le mode d'émargement :
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {/* QR Code mode */}
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        sessionMode === 'qr' ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => !generatingSheet && handleModeSelect('qr')}
                    >
                      <CardContent className="p-4 text-center space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                          <QrCode className="w-6 h-6 text-primary" />
                        </div>
                        <h4 className="font-semibold text-sm text-foreground">QR Code</h4>
                        <p className="text-xs text-muted-foreground">
                          Les étudiants scannent un QR code en classe
                        </p>
                      </CardContent>
                    </Card>

                    {/* Link mode */}
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        sessionMode === 'link' ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => !generatingSheet && handleModeSelect('link')}
                    >
                      <CardContent className="p-4 text-center space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
                          <Link2 className="w-6 h-6 text-accent-foreground" />
                        </div>
                        <h4 className="font-semibold text-sm text-foreground">
                          Lien d'émargement
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Envoyez un lien unique à chaque étudiant
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {generatingSheet && (
                    <div className="text-center py-2 text-sm text-muted-foreground">
                      Création de la session...
                    </div>
                  )}

                  <Button variant="outline" onClick={onClose} className="w-full">
                    Annuler
                  </Button>
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
