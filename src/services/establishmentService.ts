
import { supabase } from '@/integrations/supabase/client';

export interface Establishment {
  id: string;
  name: string;
  email?: string;
  type?: string;
  address?: string;
  phone?: string;
  website?: string;
}

export const establishmentService = {
  async getFirstEstablishment() {
    const { data, error } = await supabase
      .from('establishments')
      .select('*')
      .limit(1)
      .single();
    
    if (error) {
      console.error('Erreur lors de la récupération de l\'établissement:', error);
      throw error;
    }
    
    return data;
  },

  async createDefaultEstablishment() {
    const { data, error } = await supabase
      .from('establishments')
      .insert({
        name: 'Établissement par défaut',
        email: 'contact@etablissement.com',
        type: 'Centre de formation',
        address: 'Adresse non spécifiée',
        phone: 'Téléphone non spécifié',
        website: 'Site web non spécifié'
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de l\'établissement par défaut:', error);
      throw error;
    }

    return data;
  },

  async getOrCreateDefaultEstablishment() {
    try {
      // Essayer de récupérer le premier établissement
      return await this.getFirstEstablishment();
    } catch (error) {
      console.log('Aucun établissement trouvé, création d\'un établissement par défaut...');
      // Si aucun établissement n'existe, en créer un
      return await this.createDefaultEstablishment();
    }
  }
};
