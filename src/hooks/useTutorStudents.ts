import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TutorStudent {
  student_id: string;
  student_first_name: string;
  student_last_name: string;
  student_email: string;
  contract_type?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  is_active?: boolean;
  formation_title?: string;
  formation_level?: string;
}

export const useTutorStudents = () => {
  const [tutorStudents, setTutorStudents] = useState<Record<string, TutorStudent[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTutorStudents = async () => {
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
          users!tutor_student_assignments_student_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq('is_active', true);

      if (fetchError) throw fetchError;
      if (!data) {
        setTutorStudents({});
        return;
      }

      const studentsByTutor: Record<string, TutorStudent[]> = {};
      const seen = new Set<string>();

      for (const row of data) {
        const user = row.users as { first_name: string; last_name: string; email: string } | null;
        if (!user) continue;

        const key = `${row.tutor_id}-${row.student_id}`;
        if (seen.has(key)) continue;
        seen.add(key);

        if (!studentsByTutor[row.tutor_id]) studentsByTutor[row.tutor_id] = [];
        studentsByTutor[row.tutor_id].push({
          student_id: row.student_id,
          student_first_name: user.first_name,
          student_last_name: user.last_name,
          student_email: user.email,
          is_active: row.is_active,
        });
      }

      setTutorStudents(studentsByTutor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des étudiants');
    } finally {
      setLoading(false);
    }
  };

  const getTutorStudents = (tutorId: string): TutorStudent[] => {
    return tutorStudents[tutorId] || [];
  };

  useEffect(() => {
    fetchTutorStudents();
  }, []);

  return {
    tutorStudents,
    loading,
    error,
    getTutorStudents,
    refetch: fetchTutorStudents,
  };
};
