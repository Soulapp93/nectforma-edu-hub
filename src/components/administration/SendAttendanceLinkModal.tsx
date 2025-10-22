import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { Send, Calendar, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { attendanceService } from '@/services/attendanceService';

interface SendAttendanceLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ScheduleSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  room: string;
  formation_modules: {
    title: string;
  };
  schedules: {
    formation_id: string;
  };
}

interface Formation {
  id: string;
  title: string;
  level: string;
}

const SendAttendanceLinkModal: React.FC<SendAttendanceLinkModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [selectedFormationId, setSelectedFormationId] = useState<string>('');
  const [todaySlots, setTodaySlots] = useState<ScheduleSlot[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFormations();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedFormationId) {
      loadTodaySlots();
    } else {
      setTodaySlots([]);
      setSelectedSlots([]);
    }
  }, [selectedFormationId]);

  const loadFormations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('formations')
        .select('id, title, level')
        .eq('status', 'Actif')
        .order('title');

      if (error) throw error;
      setFormations(data || []);
    } catch (error) {
      console.error('Error loading formations:', error);
      toast.error('Erreur lors du chargement des formations');
    } finally {
      setLoading(false);
    }
  };

  const loadTodaySlots = async () => {
    try {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('schedule_slots')
        .select(`
          id,
          date,
          start_time,
          end_time,
          room,
          formation_modules (title),
          schedules!inner (formation_id)
        `)
        .eq('schedules.formation_id', selectedFormationId)
        .eq('date', today)
        .order('start_time');

      if (error) throw error;
      setTodaySlots(data || []);
      setSelectedSlots([]);
    } catch (error) {
      console.error('Error loading today slots:', error);
      toast.error('Erreur lors du chargement des créneaux');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotToggle = (slotId: string) => {
    setSelectedSlots(prev =>
      prev.includes(slotId)
        ? prev.filter(id => id !== slotId)
        : [...prev, slotId]
    );
  };

  const handleSendLinks = async () => {
    if (selectedSlots.length === 0) {
      toast.error('Veuillez sélectionner au moins un créneau');
      return;
    }

    try {
      setSending(true);

      // Pour chaque créneau sélectionné, créer une feuille d'émargement et envoyer le lien
      for (const slotId of selectedSlots) {
        const slot = todaySlots.find(s => s.id === slotId);
        if (!slot) continue;

        // Vérifier si une feuille d'émargement existe déjà pour ce créneau
        const { data: existingSheet, error: checkError } = await supabase
          .from('attendance_sheets')
          .select('id, signature_link_token, signature_link_expires_at')
          .eq('schedule_slot_id', slotId)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking existing sheet:', checkError);
          continue;
        }

        let sheetId: string;
        let token: string;
        let expiresAt: string;

        if (existingSheet) {
          // Feuille existante - générer un nouveau token si nécessaire
          sheetId = existingSheet.id;
          
          if (existingSheet.signature_link_token && 
              existingSheet.signature_link_expires_at && 
              new Date(existingSheet.signature_link_expires_at) > new Date()) {
            // Token valide existant
            token = existingSheet.signature_link_token;
            expiresAt = existingSheet.signature_link_expires_at;
          } else {
            // Générer un nouveau token
            const result = await attendanceService.generateSignatureToken(sheetId);
            token = result.token;
            expiresAt = result.expiresAt;
          }
        } else {
          // Créer une nouvelle feuille d'émargement
          const { data: newSheet, error: createError } = await supabase
            .from('attendance_sheets')
            .insert({
              schedule_slot_id: slotId,
              formation_id: selectedFormationId,
              date: slot.date,
              start_time: slot.start_time,
              end_time: slot.end_time,
              room: slot.room,
              title: slot.formation_modules?.title || 'Cours',
              session_type: 'autonomie',
              status: 'En attente'
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating sheet:', createError);
            continue;
          }

          sheetId = newSheet.id;

          // Générer le token
          const result = await attendanceService.generateSignatureToken(sheetId);
          token = result.token;
          expiresAt = result.expiresAt;
        }

        // Récupérer les étudiants de la formation
        const { data: students, error: studentsError } = await supabase
          .from('user_formation_assignments')
          .select('user_id')
          .eq('formation_id', selectedFormationId);

        if (studentsError) {
          console.error('Error fetching students:', studentsError);
          continue;
        }

        const studentIds = students.map(s => s.user_id);

        // Envoyer le lien aux étudiants
        await attendanceService.sendSignatureLink(sheetId, studentIds);
      }

      toast.success(`Liens envoyés pour ${selectedSlots.length} créneau(x)`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error sending links:', error);
      toast.error('Erreur lors de l\'envoi des liens');
    } finally {
      setSending(false);
    }
  };

  const selectedFormation = formations.find(f => f.id === selectedFormationId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Envoyer un lien d'émargement</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sélection de la formation */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Formation</label>
            <Select value={selectedFormationId} onValueChange={setSelectedFormationId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une formation" />
              </SelectTrigger>
              <SelectContent>
                {formations.map((formation) => (
                  <SelectItem key={formation.id} value={formation.id}>
                    {formation.title} - {formation.level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Information sur la formation sélectionnée */}
          {selectedFormation && (
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">{selectedFormation.title}</h3>
              <p className="text-sm text-muted-foreground">
                Niveau: {selectedFormation.level}
              </p>
            </div>
          )}

          {/* Liste des créneaux du jour */}
          {selectedFormationId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Créneaux du jour ({format(new Date(), 'dd/MM/yyyy', { locale: fr })})
              </label>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : todaySlots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun créneau aujourd'hui pour cette formation
                </div>
              ) : (
                <div className="space-y-2">
                  {todaySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedSlots.includes(slot.id)}
                        onCheckedChange={() => handleSlotToggle(slot.id)}
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{slot.formation_modules?.title}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {slot.start_time} - {slot.end_time}
                          </span>
                          {slot.room && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {slot.room}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Information importante */}
          {selectedSlots.length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm">
              <p className="text-blue-600 dark:text-blue-400">
                <strong>Important :</strong> Le lien sera envoyé à tous les étudiants de la formation 
                via une notification dans l'application. Ils auront 24 heures pour signer. 
                La feuille sera automatiquement envoyée pour validation administrative après expiration du délai.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              onClick={handleSendLinks} 
              disabled={selectedSlots.length === 0 || sending}
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer ({selectedSlots.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendAttendanceLinkModal;
