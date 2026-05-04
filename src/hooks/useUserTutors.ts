import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserTutor {
  tutor_id: string;
  tutor_first_name: string;
  tutor_last_name: string;
  tutor_email: string;
  company_name: string;
  position?: string;
  contract_type?: string;
  contract_start_date?: string;
  contract_end_date?: string;
}

export const useUserTutors = () => {
  const [userTutors, setUserTutors] = useState<Record<string, UserTutor[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserTutors = async () => {
    try {
      setLoading(true);
      setError(null);

      // Single JOIN query instead of N+1 loop
      const { data, error: fetchError } = await supabase
        .from('tutor_student_assignments')
        .select(`
          tutor_id,
          student_id,
          is_active,
          tutors!tutor_student_assignments_tutor_id_fkey (
            first_name,
            last_name,
            email,
            company_name,
            position
          )
        `)
        .eq('is_active', true);

      if (fetchError) throw fetchError;
      if (!data) {
        setUserTutors({});
        return;
      }

      const tutorsByStudent: Record<string, UserTutor[]> = {};
      const seen = new Set<string>();

      for (const row of data) {
        const tutor = row.tutors as { first_name: string; last_name: string; email: string; company_name: string | null; position: string | null } | null;
        if (!tutor) continue;

        const key = `${row.student_id}-${row.tutor_id}`;
        if (seen.has(key)) continue;
        seen.add(key);

        if (!tutorsByStudent[row.student_id]) tutorsByStudent[row.student_id] = [];
        tutorsByStudent[row.student_id].push({
          tutor_id: row.tutor_id,
          tutor_first_name: tutor.first_name,
          tutor_last_name: tutor.last_name,
          tutor_email: tutor.email,
          company_name: tutor.company_name || '',
          position: tutor.position || undefined,
        });
      }

      setUserTutors(tutorsByStudent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des tuteurs');
    } finally {
      setLoading(false);
    }
  };

  const getUserTutors = (userId: string): UserTutor[] => {
    return userTutors[userId] || [];
  };

  useEffect(() => {
    fetchUserTutors();
  }, []);

  return {
    userTutors,
    loading,
    error,
    getUserTutors,
    refetch: fetchUserTutors,
  };
};
