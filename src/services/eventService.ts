import { supabase } from "@/integrations/supabase/client";

export interface Event {
  id: string;
  establishment_id: string;
  title: string;
  description?: string;
  start_date: string;
  start_time: string;
  end_date?: string;
  end_time?: string;
  location?: string;
  category: string;
  max_participants?: number;
  image_url?: string;
  status: 'Ouvert' | 'Bientôt complet' | 'Complet' | 'Annulé';
  created_by?: string;
  created_at: string;
  updated_at: string;
  registered_count?: number;
  available_spots?: number;
  is_registered?: boolean;
}

export interface CreateEventData {
  title: string;
  description?: string;
  start_date: string;
  start_time: string;
  end_date?: string;
  end_time?: string;
  location?: string;
  category: string;
  max_participants?: number;
  image_url?: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: string;
  status: 'Confirmée' | 'En attente' | 'Annulée';
}

export const eventService = {
  async getEvents() {
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select(`
          *,
          event_registrations!inner(count)
        `)
        .order('start_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      // Obtenir l'utilisateur actuel pour vérifier les inscriptions
      const { data: { user } } = await supabase.auth.getUser();

      // Enrichir avec les statistiques et les inscriptions de l'utilisateur
      const enrichedEvents = await Promise.all(
        (events || []).map(async (event) => {
          // Obtenir les statistiques
          const { data: stats } = await supabase
            .rpc('get_event_stats', { event_id_param: event.id });

          const registered_count = stats?.[0]?.registered_count || 0;
          const available_spots = stats?.[0]?.available_spots || 0;

          // Vérifier si l'utilisateur est inscrit
          let is_registered = false;
          if (user) {
            const { data: registration } = await supabase
              .from('event_registrations')
              .select('id')
              .eq('event_id', event.id)
              .eq('user_id', user.id)
              .eq('status', 'Confirmée')
              .single();
            is_registered = !!registration;
          }

          // Déterminer le statut automatique
          let status = event.status;
          if (status === 'Ouvert' && event.max_participants > 0) {
            if (registered_count >= event.max_participants) {
              status = 'Complet';
            } else if (registered_count >= event.max_participants * 0.8) {
              status = 'Bientôt complet';
            }
          }

          return {
            ...event,
            registered_count,
            available_spots,
            is_registered,
            status
          };
        })
      );

      return enrichedEvents;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  async getEventById(eventId: string) {
    try {
      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;

      // Enrichir avec les statistiques
      const { data: stats } = await supabase
        .rpc('get_event_stats', { event_id_param: eventId });

      const registered_count = stats?.[0]?.registered_count || 0;
      const available_spots = stats?.[0]?.available_spots || 0;

      // Vérifier si l'utilisateur est inscrit
      const { data: { user } } = await supabase.auth.getUser();
      let is_registered = false;
      if (user) {
        const { data: registration } = await supabase
          .from('event_registrations')
          .select('id')
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .eq('status', 'Confirmée')
          .single();
        is_registered = !!registration;
      }

      return {
        ...event,
        registered_count,
        available_spots,
        is_registered
      };
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  },

  async createEvent(eventData: CreateEventData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Obtenir l'establishment_id de l'utilisateur
      const { data: userData } = await supabase
        .from('users')
        .select('establishment_id')
        .eq('id', user.id)
        .single();

      if (!userData?.establishment_id) {
        throw new Error('User establishment not found');
      }

      const { data: event, error } = await supabase
        .from('events')
        .insert({
          ...eventData,
          establishment_id: userData.establishment_id,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return event;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  async updateEvent(eventId: string, eventData: Partial<CreateEventData>) {
    try {
      const { data: event, error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;
      return event;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  async deleteEvent(eventId: string) {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },

  async registerForEvent(eventId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Vérifier d'abord si l'événement est disponible
      const event = await this.getEventById(eventId);
      if (!event) throw new Error('Event not found');

      if (event.max_participants > 0 && event.registered_count >= event.max_participants) {
        throw new Error('Event is full');
      }

      const { data: registration, error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: user.id,
          status: 'Confirmée'
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('Already registered for this event');
        }
        throw error;
      }

      return registration;
    } catch (error) {
      console.error('Error registering for event:', error);
      throw error;
    }
  },

  async unregisterFromEvent(eventId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error unregistering from event:', error);
      throw error;
    }
  },

  async getEventRegistrations(eventId: string) {
    try {
      const { data: registrations, error } = await supabase
        .from('event_registrations')
        .select(`
          *,
          users (
            first_name,
            last_name,
            email
          )
        `)
        .eq('event_id', eventId)
        .eq('status', 'Confirmée')
        .order('registered_at', { ascending: true });

      if (error) throw error;
      return registrations || [];
    } catch (error) {
      console.error('Error fetching event registrations:', error);
      throw error;
    }
  }
};