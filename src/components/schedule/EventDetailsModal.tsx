import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar, Clock, MapPin, User, Book,
  Edit, Trash2, Ban, RotateCcw, AlertTriangle, Sparkle, Building2,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface ScheduleEvent {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  instructor: string;
  room: string;
  formation: string;
  color: string;
  description?: string;
  // New fields (2026-04-20)
  slotKind?: 'course' | 'event';
  eventType?: string | null;
  eventLabel?: string | null;
  eventScope?: 'formation' | 'establishment';
  isCancelled?: boolean;
  cancellationReason?: string | null;
  allDay?: boolean;
}

interface EventDetailsModalProps {
  event: ScheduleEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (event: ScheduleEvent) => void;
  onDelete?: (eventId: string) => void;
  onDuplicate?: (event: ScheduleEvent) => void;
  onCancel?: (eventId: string, reason: string) => Promise<void> | void;
  onRestore?: (eventId: string) => Promise<void> | void;
  canEdit?: boolean;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event, isOpen, onClose, onEdit, onDelete, onCancel, onRestore, canEdit = false,
}) => {
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  if (!event) return null;

  const formatTime = (time: string) => time.split(':').slice(0, 2).join(':');
  const isEvent = event.slotKind === 'event';
  const isCancelled = !!event.isCancelled;

  const handleCancelConfirm = async () => {
    if (!cancelReason.trim()) return;
    setCancelling(true);
    try {
      if (onCancel) await onCancel(event.id, cancelReason.trim());
      setShowCancelForm(false);
      setCancelReason('');
      onClose();
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" data-testid="event-details-modal">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 flex-wrap">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: event.color || 'hsl(var(--primary))' }}
            />
            <span className={`text-xl font-semibold ${isCancelled ? 'line-through text-muted-foreground' : ''}`}>
              {event.title}
            </span>
            {isEvent && (
              <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 gap-1">
                <Sparkle className="h-3 w-3" />
                Événement
              </Badge>
            )}
            {isCancelled && (
              <Badge className="bg-red-500/15 text-red-700 border-red-500/30 gap-1" data-testid="cancelled-badge">
                <Ban className="h-3 w-3" />
                Annulé
              </Badge>
            )}
            {isEvent && event.eventScope === 'establishment' && (
              <Badge variant="outline" className="gap-1">
                <Building2 className="h-3 w-3" />
                Établissement
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cancel banner */}
          {isCancelled && event.cancellationReason && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-red-700 mb-0.5">Motif d'annulation</p>
                <p className="text-sm text-red-900/90">{event.cancellationReason}</p>
              </div>
            </div>
          )}

          {/* Date et heure */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Date</p>
                <p className="text-sm font-medium">
                  {format(event.date, 'EEEE d MMMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Horaire</p>
                <p className="text-sm font-medium">
                  {event.allDay
                    ? 'Journée entière'
                    : `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`}
                </p>
              </div>
            </div>
          </div>

          {/* Details (only for courses) */}
          {!isEvent && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Détails du cours</h3>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">Formateur</p>
                      <p className="text-sm font-medium truncate">{event.instructor}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">Salle</p>
                      <p className="text-sm font-medium truncate">{event.room}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Book className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">Formation</p>
                      <p className="text-sm font-medium">{event.formation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {event.description && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Commentaire</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
              </div>
            </>
          )}

          {/* Cancel form (inline) */}
          {showCancelForm && (
            <>
              <Separator />
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Motif d'annulation *</label>
                <Textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ex: Formateur absent, salle indisponible..."
                  rows={3}
                  className="resize-none text-sm"
                  data-testid="cancel-reason-input"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => { setShowCancelForm(false); setCancelReason(''); }}>
                    Retour
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCancelConfirm}
                    disabled={!cancelReason.trim() || cancelling}
                    data-testid="confirm-cancel-btn"
                  >
                    {cancelling ? 'Annulation...' : 'Confirmer'}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          {canEdit && !showCancelForm && (onEdit || onDelete || onCancel || onRestore) && (
            <>
              <Separator />
              <div className="flex flex-wrap gap-2 pt-2">
                {onEdit && !isCancelled && (
                  <Button
                    onClick={() => { onEdit(event); onClose(); }}
                    className="flex-1 min-w-[120px]"
                    variant="default"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                )}

                {!isEvent && !isCancelled && onCancel && (
                  <Button
                    onClick={() => setShowCancelForm(true)}
                    variant="outline"
                    className="flex-1 min-w-[120px] border-red-500/40 text-red-600 hover:bg-red-500/10"
                    data-testid="cancel-course-btn"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Annuler le cours
                  </Button>
                )}

                {isCancelled && onRestore && (
                  <Button
                    onClick={async () => { await onRestore(event.id); onClose(); }}
                    variant="outline"
                    className="flex-1 min-w-[120px] border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10"
                    data-testid="restore-course-btn"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Réactiver
                  </Button>
                )}

                {onDelete && (
                  <Button
                    onClick={() => {
                      if (window.confirm('Êtes-vous sûr de vouloir supprimer définitivement ?')) {
                        onDelete(event.id); onClose();
                      }
                    }}
                    variant="destructive"
                    className="flex-1 min-w-[120px]"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
