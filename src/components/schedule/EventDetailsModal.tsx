import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Book,
  Edit,
  Trash2,
  Copy
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
}

interface EventDetailsModalProps {
  event: ScheduleEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (event: ScheduleEvent) => void;
  onDelete?: (eventId: string) => void;
  onDuplicate?: (event: ScheduleEvent) => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onDuplicate
}) => {
  if (!event) return null;

  const handleEdit = () => {
    onEdit?.(event);
    onClose();
  };

  const handleDelete = () => {
    onDelete?.(event.id);
    onClose();
  };

  const handleDuplicate = () => {
    onDuplicate?.(event);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className={`w-4 h-4 ${event.color} rounded-full`} />
            <span>{event.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date et heure */}
          <div className="flex items-center space-x-3 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(event.date, 'EEEE d MMMM yyyy', { locale: fr })}</span>
          </div>

          <div className="flex items-center space-x-3 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{event.startTime} - {event.endTime}</span>
          </div>

          <Separator />

          {/* Informations */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Formateur: {event.instructor}</span>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>Salle: {event.room}</span>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <Book className="h-4 w-4 text-muted-foreground" />
              <span>Formation: {event.formation}</span>
            </div>
          </div>

          {event.description && (
            <>
              <Separator />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Description:</p>
                <p>{event.description}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex justify-between">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex items-center space-x-1"
              >
                <Edit className="h-3 w-3" />
                <span>Modifier</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDuplicate}
                className="flex items-center space-x-1"
              >
                <Copy className="h-3 w-3" />
                <span>Dupliquer</span>
              </Button>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="flex items-center space-x-1"
            >
              <Trash2 className="h-3 w-3" />
              <span>Supprimer</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};