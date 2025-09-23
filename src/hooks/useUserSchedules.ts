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

  const fetchSchedules = async () => {
    if (!userId || !userRole) {
      setSchedules([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let data: ScheduleSlot[] = [];

      if (userRole === 'Étudiant') {
        // Pour les étudiants : récupérer les emplois du temps des formations auxquelles ils sont inscrits
        const formationIds = userFormations?.map(f => f.id) || [];
        if (formationIds.length > 0) {
          data = await scheduleService.getStudentSchedules(formationIds);
        } else {
          // Si pas de formations trouvées, afficher tous les emplois du temps publiés (fallback)
          data = await scheduleService.getAllPublishedSchedules();
        }
      } else if (userRole === 'Formateur' || userRole === 'Tuteur') {
        // Pour les formateurs/tuteurs : récupérer tous les cours auxquels ils sont assignés
        data = await scheduleService.getInstructorSchedules(userId);
      } else if (userRole === 'Admin' || userRole === 'AdminPrincipal') {
        // Pour les administrateurs : voir tous les emplois du temps publiés
        data = await scheduleService.getAllPublishedSchedules();
      }

      setSchedules(data || []);
    } catch (err) {
      console.error('fetchSchedules - Error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des emplois du temps');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && userRole) {
      fetchSchedules();
    }
  }, [userId, userRole, userFormations]);

  return {
    schedules,
    loading,
    error,
    refetch: fetchSchedules
  };
};