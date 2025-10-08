
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserFormationAssignment {
  id: string;
  user_id: string;
  formation_id: string;
  assigned_at: string;
  formation: {
    id: string;
    title: string;
    level: string;
  };
}

export const useUserFormations = () => {
  const [userFormations, setUserFormations] = useState<UserFormationAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserFormations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('user_formation_assignments')
        .select(`
          id,
          user_id,
          formation_id,
          assigned_at,
          formation:formations(id, title, level)
        `);
      
      if (error) throw error;
      setUserFormations(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des formations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserFormations();
  }, []);

  const getUserFormations = (userId: string) => {
    return userFormations.filter(assignment => assignment.user_id === userId);
  };

  return {
    userFormations,
    loading,
    error,
    getUserFormations,
    refetch: fetchUserFormations
  };
};
