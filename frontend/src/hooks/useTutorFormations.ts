import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from './useCurrentUser';

export interface TutorFormation {
  formation_id: string;
  formation_title: string;
  formation_level: string;
  formation_description?: string;
  formation_start_date: string;
  formation_end_date: string;
  student_id: string;
  student_first_name: string;
  student_last_name: string;
  student_email: string;
}

export const useTutorFormations = () => {
  const { userId, userRole } = useCurrentUser();
  const [formations, setFormations] = useState<TutorFormation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTutorFormations = async () => {
    if (!userId || userRole !== 'Tuteur') {
      setFormations([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Récupérer les formations des apprentis du tuteur
      const { data, error } = await supabase
        .from('tutor_students_view')
        .select(`
          formation_id,
          formation_title,
          formation_level,
          student_id,
          student_first_name,
          student_last_name,
          student_email
        `)
        .eq('tutor_id', userId)
        .eq('is_active', true);
      
      if (error) throw error;

      // Récupérer les détails complets des formations
      const formationIds = [...new Set(data?.map(item => item.formation_id).filter(Boolean))];
      
      if (formationIds.length > 0) {
        const { data: formationDetails, error: formationError } = await supabase
          .from('formations')
          .select('id, description, start_date, end_date')
          .in('id', formationIds);

        if (formationError) throw formationError;

        // Combiner les données
        const enrichedData = data?.map(item => {
          const formationDetail = formationDetails?.find(f => f.id === item.formation_id);
          return {
            ...item,
            formation_description: formationDetail?.description,
            formation_start_date: formationDetail?.start_date,
            formation_end_date: formationDetail?.end_date
          };
        }) || [];

        setFormations(enrichedData);
      } else {
        setFormations([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des formations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutorFormations();
  }, [userId, userRole]);

  // Récupérer les formations uniques
  const getUniqueFormations = () => {
    const uniqueFormations = new Map();
    formations.forEach(formation => {
      if (!uniqueFormations.has(formation.formation_id)) {
        uniqueFormations.set(formation.formation_id, {
          ...formation,
          students: []
        });
      }
      uniqueFormations.get(formation.formation_id).students.push({
        id: formation.student_id,
        first_name: formation.student_first_name,
        last_name: formation.student_last_name,
        email: formation.student_email
      });
    });
    return Array.from(uniqueFormations.values());
  };

  return {
    formations,
    loading,
    error,
    getUniqueFormations,
    refetch: fetchTutorFormations
  };
};