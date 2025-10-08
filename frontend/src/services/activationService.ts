
import { supabase } from '@/integrations/supabase/client';

export const activationService = {
  async createActivationToken(userId: string) {
    // Générer un token unique
    const token = crypto.randomUUID() + '-' + Date.now();
    
    const { data, error } = await supabase
      .from('user_activation_tokens')
      .insert([{
        user_id: userId,
        token: token
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async sendActivationEmail(email: string, token: string, firstName: string, lastName: string) {
    // Appeler l'edge function pour envoyer l'email
    const { data, error } = await supabase.functions.invoke('send-activation-email', {
      body: {
        email,
        token,
        firstName,
        lastName
      }
    });

    if (error) throw error;
    return data;
  }
};
