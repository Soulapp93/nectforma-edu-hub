import React from 'react';
import { Calendar, Clock, MapPin, User, Book, Plus, Edit, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScheduleSlot } from '@/services/scheduleService';
import { isAutonomieSlot, isEventSlot, getEventLabel } from '@/utils/slotDisplay';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  slots: ScheduleSlot[];
  isEditMode: boolean;
  onSlotClick: (slot: ScheduleSlot) => void;
  onEditSlot: (slot: ScheduleSlot) => void;
  onDuplicateSlot: (slot: ScheduleSlot) => void;
  onDeleteSlot: (slot: ScheduleSlot) => void;
}

export const ScheduleListView: React.FC<Props> = ({
  slots,
  isEditMode,
  onSlotClick,
  onEditSlot,
  onDuplicateSlot,
  onDeleteSlot,
}) => {
  const allSlots = [...slots].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    return a.start_time.localeCompare(b.start_time);
  });

  return (
    <div className="container mx-auto px-6 py-8">
      <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 via-muted/50 to-accent/10">
          <div className="grid grid-cols-6 gap-4 text-sm font-semibold text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" /><span>Date</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" /><span>Horaire</span>
            </div>
            <div className="flex items-center space-x-2">
              <Book className="h-4 w-4" /><span>Module</span>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" /><span>Formateur</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" /><span>Salle</span>
            </div>
            <div>Actions</div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-2 p-4">
            {allSlots.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-muted-foreground mb-2">Aucun creneau</h3>
                <p className="text-muted-foreground">Commencez par ajouter des creneaux a votre emploi du temps</p>
              </div>
            ) : (
              allSlots.map((slot) => (
                <TooltipProvider key={slot.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="grid grid-cols-6 gap-4 items-center p-4 rounded-lg cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all duration-200 text-white"
                        style={{ backgroundColor: slot.color || '#8B5CF6' }}
                        onClick={() => onSlotClick(slot)}
                      >
                        <div>
                          <div className="font-medium text-white text-sm">
                            {format(new Date(slot.date), 'dd/MM/yyyy', { locale: fr })}
                          </div>
                          <div className="text-xs text-white/80">
                            {format(new Date(slot.date), 'EEEE', { locale: fr })}
                          </div>
                        </div>
                        <div>
                          {isEventSlot(slot) ? (
                            <span className="text-sm text-white/70"> </span>
                          ) : (
                            <div className="bg-white/20 text-white border-white/30 rounded px-2 py-1 text-xs font-medium inline-block">
                              {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white text-sm">
                            {getEventLabel(slot) || (isAutonomieSlot(slot) ? 'AUTONOMIE' : (slot.formation_modules?.title || 'Module non defini'))}
                          </div>
                          {slot.notes && <div className="text-xs text-white/80 mt-1">{slot.notes}</div>}
                        </div>
                        <div>
                          {isEventSlot(slot) || isAutonomieSlot(slot) ? (
                            <span className="text-sm text-white/70"> </span>
                          ) : (
                            <span className="text-sm text-white">
                              {slot.users?.first_name && slot.users?.last_name
                                ? `${slot.users.first_name} ${slot.users.last_name}` : 'Non assigne'}
                            </span>
                          )}
                        </div>
                        <div>
                          {isEventSlot(slot) || isAutonomieSlot(slot) ? (
                            <span className="text-sm text-white/70"> </span>
                          ) : (
                            <span className="text-sm text-white">{slot.room || 'Non definie'}</span>
                          )}
                        </div>
                        {isEditMode && (
                          <div>
                            <div className="flex items-center space-x-1">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-white/80 hover:text-white hover:bg-white/20"
                                onClick={(e) => { e.stopPropagation(); onEditSlot(slot); }} title="Modifier">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-white/80 hover:text-white hover:bg-white/20"
                                onClick={(e) => { e.stopPropagation(); onDuplicateSlot(slot); }} title="Dupliquer">
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-white/80 hover:text-white hover:bg-white/20"
                                onClick={(e) => { e.stopPropagation(); onDeleteSlot(slot); }} title="Supprimer">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <div className="space-y-1">
                        <p className="font-semibold">{getEventLabel(slot) || (isAutonomieSlot(slot) ? 'AUTONOMIE' : (slot.formation_modules?.title || 'Module non defini'))}</p>
                        {!isEventSlot(slot) && (
                          <p className="text-xs">{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</p>
                        )}
                        {!isEventSlot(slot) && !isAutonomieSlot(slot) && (
                          <>
                            <p className="text-xs">{slot.users?.first_name} {slot.users?.last_name}</p>
                            <p className="text-xs">Salle: {slot.room}</p>
                          </>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
