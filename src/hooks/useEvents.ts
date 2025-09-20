import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService, CreateEventData } from '@/services/eventService';
import { toast } from 'sonner';

export const useEvents = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: eventService.getEvents,
  });
};

export const useEvent = (eventId: string) => {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventService.getEventById(eventId),
    enabled: !!eventId,
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventData: CreateEventData) => eventService.createEvent(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Événement créé avec succès');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la création de l\'événement');
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, eventData }: { eventId: string; eventData: Partial<CreateEventData> }) =>
      eventService.updateEvent(eventId, eventData),
    onSuccess: (updatedEvent, { eventId }) => {
      // Invalider toutes les queries des événements
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      
      // Forcer la mise à jour du cache avec les nouvelles données
      queryClient.setQueryData(['events'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((event: any) => 
          event.id === eventId ? updatedEvent : event
        );
      });
      
      queryClient.setQueryData(['event', eventId], updatedEvent);
      
      toast.success('Événement mis à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour de l\'événement');
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventService.deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Événement supprimé avec succès');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la suppression de l\'événement');
    },
  });
};

export const useRegisterForEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventService.registerForEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Inscription confirmée !');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de l\'inscription');
    },
  });
};

export const useUnregisterFromEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventService.unregisterFromEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Désinscription effectuée');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la désinscription');
    },
  });
};

export const useEventRegistrations = (eventId: string) => {
  return useQuery({
    queryKey: ['event-registrations', eventId],
    queryFn: () => eventService.getEventRegistrations(eventId),
    enabled: !!eventId,
  });
};