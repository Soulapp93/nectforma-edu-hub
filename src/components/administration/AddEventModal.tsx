import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { Switch } from '@/components/ui/switch';
import {
  CalendarDays, Palmtree, Lock, Flag, DoorOpen, BookOpen,
  FileText, GraduationCap, FileCheck, RefreshCw, Sparkles, Sparkle,
} from 'lucide-react';
import { scheduleService, EventType, EVENT_TYPE_META } from '@/services/scheduleService';
import { toast } from 'sonner';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  scheduleId: string;
  defaultDate?: string | null;
}

const ICONS: Record<string, React.ComponentType<any>> = {
  Palmtree, Lock, Flag, DoorOpen, BookOpen,
  FileText, GraduationCap, FileCheck, RefreshCw, Sparkles,
};

const TYPE_ORDER: EventType[] = [
  'holiday', 'closed', 'public_holiday', 'open_day', 'autonomy',
  'mock_exam', 'final_exam', 'midterm', 'makeup', 'custom',
];

const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen, onClose, onSuccess, scheduleId, defaultDate,
}) => {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<EventType>('holiday');
  const [customLabel, setCustomLabel] = useState('');
  const [scope, setScope] = useState<'formation' | 'establishment'>('formation');
  const [allDay, setAllDay] = useState(true);
  const [startDate, setStartDate] = useState(defaultDate || '');
  const [endDate, setEndDate] = useState(defaultDate || '');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (defaultDate) {
      setStartDate(defaultDate);
      setEndDate(defaultDate);
    }
  }, [defaultDate]);

  const reset = () => {
    setType('holiday');
    setCustomLabel('');
    setScope('formation');
    setAllDay(true);
    setStartDate('');
    setEndDate('');
    setStartTime('09:00');
    setEndTime('17:00');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) { toast.error('Date de début requise'); return; }
    if (!endDate) { toast.error('Date de fin requise'); return; }
    if (endDate < startDate) { toast.error('Date de fin ≥ date de début'); return; }
    if (!allDay && startTime >= endTime) { toast.error("L'heure de fin doit être postérieure à l'heure de début"); return; }
    if (type === 'custom' && !customLabel.trim()) { toast.error('Libellé requis pour un événement "Autre"'); return; }

    setLoading(true);
    try {
      await scheduleService.createScheduleEvent({
        schedule_id: scheduleId,
        event_type: type,
        event_label: type === 'custom' ? customLabel.trim() : EVENT_TYPE_META[type].label,
        event_scope: scope,
        date: startDate,
        end_date: endDate,
        start_time: allDay ? undefined : startTime,
        end_time: allDay ? undefined : endTime,
        all_day: allDay,
        color: EVENT_TYPE_META[type].color,
        notes: notes.trim() || undefined,
      });
      toast.success('Événement ajouté');
      reset();
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'ajout de l'événement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-hidden p-0" data-testid="add-event-modal">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Sparkle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg sm:text-xl font-bold text-white">Ajouter un événement</DialogTitle>
              <p className="text-white/80 text-xs sm:text-sm mt-0.5 truncate">
                Congés, fériés, examens, portes ouvertes...
              </p>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <div className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Type grid */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Type d'événement *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
                  {TYPE_ORDER.map((t) => {
                    const meta = EVENT_TYPE_META[t];
                    const Icon = ICONS[meta.icon] || Sparkles;
                    const active = type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        data-testid={`event-type-${t}`}
                        className={`p-2.5 sm:p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 min-h-[72px] sm:min-h-[84px] ${
                          active ? 'border-foreground shadow-md scale-[1.02]' : 'border-border hover:border-foreground/40 bg-card'
                        }`}
                        style={active ? { backgroundColor: `${meta.color}15`, borderColor: meta.color } : undefined}
                      >
                        <div
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${meta.color}20` }}
                        >
                          <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" style={{ color: meta.color }} />
                        </div>
                        <span className="text-[10px] sm:text-xs font-semibold text-center leading-tight">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom label */}
              {type === 'custom' && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Libellé personnalisé *</Label>
                  <Input
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    placeholder="Ex: Journée team building, Réunion pédagogique..."
                    className="h-11 bg-card"
                    data-testid="event-custom-label"
                  />
                </div>
              )}

              {/* Scope */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Portée *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setScope('formation')}
                    data-testid="event-scope-formation"
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      scope === 'formation' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 bg-card'
                    }`}
                  >
                    <p className="text-sm font-semibold">Cette formation</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Visible uniquement dans ce planning</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScope('establishment')}
                    data-testid="event-scope-establishment"
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      scope === 'establishment' ? 'border-amber-500 bg-amber-500/10' : 'border-border hover:border-amber-500/50 bg-card'
                    }`}
                  >
                    <p className="text-sm font-semibold">Tout l'établissement</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Visible sur tous les plannings</p>
                  </button>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Période *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <span className="text-xs text-muted-foreground">Du</span>
                    <DatePicker id="event-start-date" value={startDate} onChange={setStartDate} placeholder="Date de début" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs text-muted-foreground">Au</span>
                    <DatePicker id="event-end-date" value={endDate} onChange={setEndDate} placeholder="Date de fin" />
                  </div>
                </div>
              </div>

              {/* All day switch */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                <div>
                  <p className="text-sm font-semibold">Journée entière</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Désactivez pour préciser les horaires</p>
                </div>
                <Switch checked={allDay} onCheckedChange={setAllDay} data-testid="event-allday-switch" />
              </div>

              {/* Hours (if not all-day) */}
              {!allDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <span className="text-xs text-muted-foreground">Début</span>
                    <TimePicker id="event-start-time" value={startTime} onChange={setStartTime} placeholder="09:00" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs text-muted-foreground">Fin</span>
                    <TimePicker id="event-end-time" value={endTime} onChange={setEndTime} placeholder="17:00" />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Commentaire (optionnel)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informations complémentaires..."
                  rows={2}
                  className="bg-card resize-none text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={onClose} className="h-11 px-6 rounded-full">
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 px-6 rounded-full text-white shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${EVENT_TYPE_META[type].color}, ${EVENT_TYPE_META[type].color}dd)` }}
                  data-testid="event-submit-btn"
                >
                  {loading ? 'Ajout...' : "Ajouter l'événement"}
                </Button>
              </div>
            </form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AddEventModal;
