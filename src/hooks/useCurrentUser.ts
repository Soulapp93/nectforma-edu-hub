import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useCurrentUser = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        setUserId(null);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUserId(session?.user?.id || null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { userId, loading };
};