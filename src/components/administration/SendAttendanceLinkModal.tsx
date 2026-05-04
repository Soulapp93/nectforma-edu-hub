import { logger } from '@/utils/logger';
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Send, Calendar, Clock, Users, UserX, AlertTriangle, ArrowLeft, GraduationCap, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { attendanceService } from '@/services/attendanceService';
import { Input } from '@/components/ui/input';

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
  instructor_id: string | null;
  formation_modules: {
    title: string;
  };
  schedules: {
    formation_id: string;
  };
  users?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface GroupedSlots {
  date: string;
  isPast: boolean;
  slots: ScheduleSlot[];
}

interface Formation {
  id: string;
  title: string;
  level: string;
  academic_year: string | null;
}

type Step = 'formations' | 'promotions' | 'slots';

const SendAttendanceLinkModal: React.FC<SendAttendanceLinkModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [step, setStep] = useState<Step>('formations');
  const [selectedProgramme, setSelectedProgramme] = useState<string>('');
  const [selectedFormationId, setSelectedFormationId] = useState<string>('');
  const [allSlots, setAllSlots] = useState<ScheduleSlot[]>([]);
  const [groupedSlots, setGroupedSlots] = useState<GroupedSlots[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [instructorAbsent, setInstructorAbsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');

  // Group formations by programme name
  const formationGroups = useMemo(() => {
    const groups: Record<string, Formation[]> = {};
    formations.forEach(f => {
      const name = f.title;
      if (!groups[name]) groups[name] = [];
      groups[name].push(f);
    });
    Object.values(groups).forEach(group => {
      group.sort((a, b) => (b.academic_year || '').localeCompare(a.academic_year || ''));
    });
    return groups;
  }, [formations]);

  const filteredProgrammes = useMemo(() => {
    const names = Object.keys(formationGroups);
    if (!search.trim()) return names;
    const s = search.toLowerCase();
    return names.filter(n => n.toLowerCase().includes(s));
  }, [formationGroups, search]);

  const promotions = useMemo(() => {
    return formationGroups[selectedProgramme] || [];
  }, [formationGroups, selectedProgramme]);

  useEffect(() => {
    if (isOpen) {
      loadFormations();
      setStep('formations');
      setSelectedProgramme('');
      setSelectedFormationId('');
      setSelectedSlots([]);
      setInstructorAbsent(false);
      setSearch('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedFormationId) {
      loadAllSlots();
    } else {
      setAllSlots([]);
      setGroupedSlots([]);
      setSelectedSlots([]);
    }
  }, [selectedFormationId]);

  const loadFormations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('formations')
        .select('id, title, level, academic_year')
        .eq('status', 'Actif')
        .order('title');

      if (error) throw error;
      setFormations(data || []);
    } catch (error) {
      logger.error('Error loading formations:', error);
      toast.error('Erreur lors du chargement des formations');
    } finally {
      setLoading(false);
    }
  };

  const loadAllSlots = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('schedule_slots')
        .select(`
          id,
          date,
          start_time,
          end_time,
          room,
          instructor_id,
          formation_modules (title),
          schedules!inner (formation_id),
          users:instructor_id (first_name, last_name)
        `)
        .eq('schedules.formation_id', selectedFormationId)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      const slots = data || [];
      setAllSlots(slots);
      
      const grouped = slots.reduce((acc: GroupedSlots[], slot) => {
        const existingGroup = acc.find(g => g.date === slot.date);
        const today = format(new Date(), 'yyyy-MM-dd');
        const isPast = slot.date < today;
        
        if (existingGroup) {
          existingGroup.slots.push(slot);
        } else {
          acc.push({ date: slot.date, isPast, slots: [slot] });
        }
        return acc;
      }, []);
      
      setGroupedSlots(grouped);
      setSelectedSlots([]);
    } catch (error) {
      logger.error('Error loading slots:', error);
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

      for (const slotId of selectedSlots) {
        const slot = allSlots.find(s => s.id === slotId);
        if (!slot) continue;

        const { data: existingSheet, error: checkError } = await supabase
          .from('attendance_sheets')
          .select('id, signature_link_token, signature_link_expires_at, instructor_id')
          .eq('schedule_slot_id', slotId)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          logger.error('Error checking existing sheet:', checkError);
          continue;
        }

        let sheetId: string;
        let token: string;
        let instructorId: string | null = slot.instructor_id;

        if (existingSheet) {
          sheetId = existingSheet.id;
          instructorId = existingSheet.instructor_id;
          
          await supabase
            .from('attendance_sheets')
            .update({ instructor_absent: instructorAbsent } as any)
            .eq('id', sheetId);
          
          if (existingSheet.signature_link_token && 
              existingSheet.signature_link_expires_at && 
              new Date(existingSheet.signature_link_expires_at) > new Date()) {
            token = existingSheet.signature_link_token;
          } else {
            const result = await attendanceService.generateSignatureToken(sheetId);
            token = result.token;
          }
        } else {
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
              status: 'En attente',
              instructor_id: slot.instructor_id,
              instructor_absent: instructorAbsent
            } as any)
            .select()
            .single();

          if (createError) {
            logger.error('Error creating sheet:', createError);
            continue;
          }

          sheetId = newSheet.id;
          instructorId = slot.instructor_id;
          const result = await attendanceService.generateSignatureToken(sheetId);
          token = result.token;
        }

        const { data: students, error: studentsError } = await supabase
          .from('user_formation_assignments')
          .select('user_id, users!inner(role)')
          .eq('formation_id', selectedFormationId)
          .eq('users.role', 'Étudiant');

        if (studentsError) {
          logger.error('Error fetching students:', studentsError);
          continue;
        }

        const studentIds = students.map(s => s.user_id);
        let recipientIds: string[] = [...studentIds];
        
        if (!instructorAbsent && instructorId) {
          recipientIds.push(instructorId);
        }

        await attendanceService.sendSignatureLink(sheetId, recipientIds);
      }

      const absentMsg = instructorAbsent ? ' (formateur absent)' : '';
      toast.success(`Liens envoyés pour ${selectedSlots.length} créneau(x)${absentMsg}`);
      onSuccess();
      onClose();
    } catch (error: any) {
      logger.error('Error sending links:', error);
      toast.error('Erreur lors de l\'envoi des liens');
    } finally {
      setSending(false);
    }
  };

  const handleProgrammeSelect = (name: string) => {
    setSelectedProgramme(name);
    setStep('promotions');
  };

  const handlePromotionSelect = (formation: Formation) => {
    setSelectedFormationId(formation.id);
    setStep('slots');
  };

  const handleBack = () => {
    if (step === 'slots') {
      setStep('promotions');
      setSelectedFormationId('');
      setSelectedSlots([]);
    } else if (step === 'promotions') {
      setStep('formations');
      setSelectedProgramme('');
    }
  };

  const selectedFormation = formations.find(f => f.id === selectedFormationId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Envoyer un lien d'émargement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Breadcrumb */}
          {step !== 'formations' && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Retour
              </Button>
              <span className="text-sm text-muted-foreground">
                {step === 'promotions' && `Programme : ${selectedProgramme}`}
                {step === 'slots' && selectedFormation && `${selectedFormation.title} — ${selectedFormation.academic_year || ''}`}
              </span>
            </div>
          )}

          {/* Step 1: Formations (programmes) */}
          {step === 'formations' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sélectionnez une formation</label>
                <Input
                  placeholder="Rechercher une formation..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filteredProgrammes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune formation trouvée
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredProgrammes.map(name => (
                    <button
                      key={name}
                      onClick={() => handleProgrammeSelect(name)}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formationGroups[name].length} promotion(s)
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Promotions */}
          {step === 'promotions' && (
            <div className="space-y-4">
              <label className="text-sm font-medium">Sélectionnez une promotion</label>
              {promotions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Aucune promotion</div>
              ) : (
                <div className="grid gap-3">
                  {promotions.map(promo => (
                    <button
                      key={promo.id}
                      onClick={() => handlePromotionSelect(promo)}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-secondary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">
                          {promo.title} — {promo.academic_year || 'N/A'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Niveau : {promo.level}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Slots */}
          {step === 'slots' && (
            <>
              {/* Selected formation info */}
              {selectedFormation && (
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold">{selectedFormation.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedFormation.academic_year || ''} • Niveau : {selectedFormation.level}
                  </p>
                </div>
              )}

              {/* Slots list */}
              <div className="space-y-4">
                <label className="text-sm font-medium">
                  Créneaux de la promotion
                </label>
                
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : groupedSlots.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun créneau trouvé pour cette promotion
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {groupedSlots.map((group) => (
                      <div key={group.date} className="space-y-2">
                        <div className="flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">
                            {format(new Date(group.date), 'EEEE dd MMMM yyyy', { locale: fr })}
                          </span>
                          {group.isPast ? (
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">Passé</span>
                          ) : (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">À venir</span>
                          )}
                        </div>
                        
                        <div className="space-y-2 pl-6 border-l-2 border-muted">
                          {group.slots.map((slot) => (
                            <div
                              key={slot.id}
                              className={`flex items-start space-x-3 p-3 border rounded-lg transition-colors ${
                                group.isPast ? 'bg-muted/30 hover:bg-muted/50' : 'hover:bg-muted/50'
                              }`}
                            >
                              <Checkbox
                                checked={selectedSlots.includes(slot.id)}
                                onCheckedChange={() => handleSlotToggle(slot.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">
                                  {slot.formation_modules?.title || 'Cours'}
                                </h4>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                  </span>
                                  {slot.room && (
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {slot.room}
                                    </span>
                                  )}
                                  {slot.users && (
                                    <span className="flex items-center gap-1 text-primary">
                                      <Users className="h-3 w-3" />
                                      {slot.users.first_name} {slot.users.last_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Instructor absent option */}
              {selectedSlots.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="instructor-absent" className="text-sm font-medium flex items-center gap-2">
                            <UserX className="h-4 w-4" />
                            Formateur absent
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Cochez cette option si le formateur est absent pour cette session
                          </p>
                        </div>
                        <Switch
                          id="instructor-absent"
                          checked={instructorAbsent}
                          onCheckedChange={setInstructorAbsent}
                        />
                      </div>
                      
                      {instructorAbsent && (
                        <div className="bg-amber-500/10 rounded-md p-3 text-xs text-amber-700 dark:text-amber-300">
                          <p className="font-medium mb-1">⚠️ Mode formateur absent activé :</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Le lien sera envoyé uniquement aux étudiants</li>
                            <li>Le formateur ne recevra pas de notification</li>
                            <li>La feuille sera générée avec la mention "Formateur absent"</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Info box */}
              {selectedSlots.length > 0 && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-sm">
                  <p className="text-primary">
                    <strong>Important :</strong> Le lien sera envoyé {instructorAbsent ? 'uniquement aux étudiants' : 'à tous les participants'} de la promotion via une notification. Ils auront 24 heures pour signer.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            {step === 'slots' && (
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
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendAttendanceLinkModal;
