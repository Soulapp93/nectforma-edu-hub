import { supabase } from "@/integrations/supabase/client";

export interface Event {
  id: string;
  establishment_id: string;
  title: string;
  description?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  formation_ids: string[];
  audiences: string[];
  file_urls: string[];
}

export interface CreateEventData {
  title: string;
  description?: string;
  formation_ids: string[];
  audiences: string[];
  file_urls: string[];
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
      // Mode démo : utiliser les événements du localStorage
      const demoEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
      
      // Trier par date de création (plus récent en premier)
      const sortedEvents = demoEvents.sort((a: Event, b: Event) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      return sortedEvents;
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  },

  async getEventById(eventId: string) {
    try {
      // Mode démo : chercher dans localStorage
      const demoEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
      const event = demoEvents.find((e: Event) => e.id === eventId);
      
      if (!event) {
        throw new Error('Event not found');
      }
      
      return event;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  },

  async createEvent(eventData: CreateEventData) {
    try {
      // Mode démo : gestion locale des événements
      const existingEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
      
      const newEvent: Event = {
        id: Date.now().toString(),
        establishment_id: 'demo-establishment',
        ...eventData,
        created_by: 'demo-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const updatedEvents = [...existingEvents, newEvent];
      localStorage.setItem('demo_events', JSON.stringify(updatedEvents));
      
      return newEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  async updateEvent(eventId: string, eventData: Partial<CreateEventData>) {
    try {
      // Mode démo : mise à jour locale
      const demoEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
      
      const eventIndex = demoEvents.findIndex((e: Event) => e.id === eventId);
      if (eventIndex === -1) {
        throw new Error('Event not found');
      }
      
      demoEvents[eventIndex] = {
        ...demoEvents[eventIndex],
        ...eventData,
        updated_at: new Date().toISOString()
      };
      
      localStorage.setItem('demo_events', JSON.stringify(demoEvents));
      return demoEvents[eventIndex];
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  async deleteEvent(eventId: string) {
    try {
      // Mode démo : suppression locale
      const demoEvents = JSON.parse(localStorage.getItem('demo_events') || '[]');
      
      const updatedEvents = demoEvents.filter((e: Event) => e.id !== eventId);
      localStorage.setItem('demo_events', JSON.stringify(updatedEvents));
      
      // Supprimer aussi les inscriptions liées
      const demoRegistrations = JSON.parse(localStorage.getItem('demo_event_registrations') || '[]');
      const updatedRegistrations = demoRegistrations.filter(
        (reg: EventRegistration) => reg.event_id !== eventId
      );
      localStorage.setItem('demo_event_registrations', JSON.stringify(updatedRegistrations));
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },

  async registerForEvent(eventId: string) {
    try {
      // Mode démo : gestion locale des inscriptions
      const demoRegistrations = JSON.parse(localStorage.getItem('demo_event_registrations') || '[]');
      
      // Vérifier si déjà inscrit
      const existingRegistration = demoRegistrations.find(
        (reg: EventRegistration) => reg.event_id === eventId && reg.user_id === 'demo-user'
      );
      
      if (existingRegistration) {
        throw new Error('Already registered for this event');
      }
      
      const newRegistration: EventRegistration = {
        id: Date.now().toString(),
        event_id: eventId,
        user_id: 'demo-user',
        registered_at: new Date().toISOString(),
        status: 'Confirmée'
      };
      
      const updatedRegistrations = [...demoRegistrations, newRegistration];
      localStorage.setItem('demo_event_registrations', JSON.stringify(updatedRegistrations));
      
      return newRegistration;
    } catch (error) {
      console.error('Error registering for event:', error);
      throw error;
    }
  },

  async unregisterFromEvent(eventId: string) {
    try {
      // Mode démo : suppression locale
      const demoRegistrations = JSON.parse(localStorage.getItem('demo_event_registrations') || '[]');
      
      const updatedRegistrations = demoRegistrations.filter(
        (reg: EventRegistration) => !(reg.event_id === eventId && reg.user_id === 'demo-user')
      );
      
      localStorage.setItem('demo_event_registrations', JSON.stringify(updatedRegistrations));
    } catch (error) {
      console.error('Error unregistering from event:', error);
      throw error;
    }
  },

  async getEventRegistrations(eventId: string) {
    try {
      // Mode démo : récupérer les inscriptions du localStorage
      const demoRegistrations = JSON.parse(localStorage.getItem('demo_event_registrations') || '[]');
      
      const eventRegistrations = demoRegistrations.filter(
        (reg: EventRegistration) => reg.event_id === eventId
      );
      
      // Simuler les informations utilisateur
      return eventRegistrations.map((reg: EventRegistration) => ({
        ...reg,
        users: {
          first_name: 'Démo',
          last_name: 'Utilisateur',
          email: 'demo@example.com'
        }
      }));
    } catch (error) {
      console.error('Error fetching event registrations:', error);
      return [];
    }
  }
};