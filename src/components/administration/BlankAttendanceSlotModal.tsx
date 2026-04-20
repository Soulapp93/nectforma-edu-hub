import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Download, MapPin, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { scheduleService, ScheduleSlot } from '@/services/scheduleService';
import { pdfExportService } from '@/services/pdfExportService';
import { format, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface Formation {
  id: string;
  title: string;
  level: string;
  start_date: string;
  end_date: string;
}

interface BlankAttendanceSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  formations: Formation[];
}

const BlankAttendanceSlotModal: React.FC<BlankAttendanceSlotModalProps> = ({
  isOpen,
  onClose,
  formations
}) => {
  const [selectedFormationId, setSelectedFormationId] = useState<string>('');
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFormationId('');
      setSlots([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedFormationId) {
      fetchSlotsForFormation(selectedFormationId);
    } else {
      setSlots([]);
    }
  }, [selectedFormationId]);

  const fetchSlotsForFormation = async (formationId: string) => {
    try {
      setLoadingSlots(true);
      // Find schedules for this formation
      const { data: schedules, error: schedError } = await supabase
        .from('schedules')
        .select('id')
        .eq('formation_id', formationId);

      if (schedError) throw schedError;
      if (!schedules || schedules.length === 0) {
        setSlots([]);
        return;
      }

      // Fetch all slots for these schedules
      const scheduleIds = schedules.map(s => s.id);
      const { data: slotsData, error: slotsError } = await supabase
        .from('schedule_slots')
        .select(`
          *,
          formation_modules(title),
          users!schedule_slots_instructor_id_fkey(first_name, last_name),
          schedules!inner(id, formation_id, title, formations(title, color, level))
        `)
        .in('schedule_id', scheduleIds)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (slotsError) throw slotsError;
      setSlots((slotsData || []) as ScheduleSlot[]);
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error('Erreur lors du chargement des créneaux');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleGenerateBlankPDF = async (slot: ScheduleSlot) => {
    try {
      setGeneratingPdf(slot.id);
      
      const formation = formations.find(f => f.id === selectedFormationId);
      const formationTitle = (slot.schedules?.formations as any)?.title || formation?.title || '';
      const formationLevel = (slot.schedules?.formations as any)?.level || formation?.level || '';

      // Build a fake AttendanceSheet object for the PDF export
      const fakeSheet: any = {
        id: slot.id,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        room: slot.room || '',
        formation_id: selectedFormationId,
        instructor_id: slot.instructor_id || null,
        schedule_slot_id: slot.id,
        formations: { title: formationTitle, level: formationLevel },
        schedule_slots: { formation_modules: slot.formation_modules },
        instructor: slot.users ? { first_name: slot.users.first_name, last_name: slot.users.last_name } : null,
        session_type: slot.session_type || 'encadree',
      };

      await pdfExportService.exportBlankAttendanceSheet(fakeSheet);
      toast.success('Feuille d\'émargement vierge générée');
    } catch (error) {
      console.error('Error generating blank PDF:', error);
      toast.error('Erreur lors de la génération');
    } finally {
      setGeneratingPdf(null);
    }
  };

  const today = startOfDay(new Date());

  const isPast = (date: string) => isBefore(new Date(date), today);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Générer une feuille d'émargement vierge
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Formation selector */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Choisir une formation</label>
            <Select value={selectedFormationId} onValueChange={setSelectedFormationId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une formation..." />
              </SelectTrigger>
              <SelectContent>
                {formations.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Slots list */}
          {selectedFormationId && (
            <div>
              <p className="text-sm font-medium mb-2">Créneaux disponibles</p>
              {loadingSlots ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucun créneau trouvé pour cette formation
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {slots.map(slot => {
                    const past = isPast(slot.date);
                    return (
                      <div
                        key={slot.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          past ? 'bg-muted/50 border-border/50' : 'bg-card border-border hover:bg-accent/10'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">
                              {format(new Date(slot.date), 'EEEE dd MMMM yyyy', { locale: fr })}
                            </span>
                            {past ? (
                              <Badge variant="secondary" className="text-xs">Passé</Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">À venir</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                            </span>
                            {slot.formation_modules?.title && (
                              <span className="font-medium text-foreground/70">
                                {slot.formation_modules.title}
                              </span>
                            )}
                            {slot.room && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {slot.room}
                              </span>
                            )}
                            {slot.users && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {slot.users.first_name} {slot.users.last_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateBlankPDF(slot)}
                          disabled={generatingPdf === slot.id}
                          className="ml-2 shrink-0"
                        >
                          {generatingPdf === slot.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-1" />
                              Générer
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlankAttendanceSlotModal;
