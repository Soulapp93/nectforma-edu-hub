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
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      let data: ScheduleSlot[] = [];

      if (userRole === 'Étudiant') {
        // Get formations assigned to the student
        const studentFormations = userFormations.filter(uf => uf.user_id === userId);
        const formationIds = studentFormations.map(uf => uf.formation_id);
        data = await scheduleService.getStudentSchedules(formationIds);
      } else if (userRole === 'Formateur') {
        // Get all slots where the user is the instructor
        data = await scheduleService.getInstructorSchedules(userId);
      }

      setSchedules(data || []);
    } catch (err) {
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