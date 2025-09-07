import { useState, useEffect } from 'react';
import { scheduleService, ScheduleSlot } from '@/services/scheduleService';
import { useCurrentUser } from './useCurrentUser';
import { useUserFormations } from './useUserFormations';

export const useUserSchedules = () => {
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { userId, userRole } = useCurrentUser();
  const { userFormations } = useUserFormations();

  console.log('useUserSchedules - Current user:', { userId, userRole });
  console.log('useUserSchedules - User formations:', userFormations);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);

      let data: ScheduleSlot[] = [];

      console.log('fetchSchedules - Starting with:', { userId, userRole, userFormations });

      // Pour les tests, on affiche tous les emplois du temps publiés
      // En production, on devrait vérifier les formations assignées
      data = await scheduleService.getAllPublishedSchedules();
      
      console.log('fetchSchedules - Data fetched:', data);

      setSchedules(data || []);
    } catch (err) {
      console.error('fetchSchedules - Error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des emplois du temps');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  return {
    schedules,
    loading,
    error,
    refetch: fetchSchedules
  };
};