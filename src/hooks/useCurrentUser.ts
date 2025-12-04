import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useCurrentUser = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Nettoyer toute ancienne session démo au démarrage
    sessionStorage.removeItem('demo_user');
    
    const fetchUserRole = async (uid: string) => {
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', uid)
          .single();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Erreur lors de la récupération du rôle:', error);
          setUserRole(null);
        } else {
          setUserRole(userData?.role || null);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du rôle:', error);
        if (mounted) setUserRole(null);
      }
    };

    const getCurrentUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session?.user?.id) {
          setUserId(session.user.id);
          await fetchUserRole(session.user.id);
        } else {
          setUserId(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        if (mounted) {
          setUserId(null);
          setUserRole(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        if (session?.user?.id) {
          setUserId(session.user.id);
          // Déférer le fetch pour éviter les deadlocks
          setTimeout(() => {
            if (mounted) {
              fetchUserRole(session.user.id).finally(() => {
                if (mounted) setLoading(false);
              });
            }
          }, 0);
        } else {
          setUserId(null);
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    getCurrentUser();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { userId, userRole, loading };
};

// Créer un hook pour récupérer les informations utilisateur avec tuteur/apprenti
export const useUserWithRelations = () => {
  const { userId, userRole, loading: userLoading } = useCurrentUser();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [relationInfo, setRelationInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const fetchUserRelations = async () => {
      if (!userId) {
        if (mounted) {
          setUserInfo(null);
          setRelationInfo(null);
          setLoading(false);
        }
        return;
      }

      try {
        // Récupérer les informations de base de l'utilisateur
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (!mounted) return;

        if (userError) {
          console.error('Erreur lors de la récupération des infos utilisateur:', userError);
          setUserInfo(null);
        } else {
          setUserInfo(userData);
        }

        // Si c'est un étudiant, chercher son tuteur
        if (userRole === 'Étudiant') {
          const { data: tutorData, error: tutorError } = await supabase
            .from('tutor_students_view')
            .select('*')
            .eq('student_id', userId)
            .eq('is_active', true)
            .maybeSingle();

          if (!mounted) return;

          if (!tutorError && tutorData) {
            setRelationInfo({
              type: 'tutor',
              name: `${tutorData.tutor_first_name} ${tutorData.tutor_last_name}`,
              company: tutorData.company_name,
              position: tutorData.position
            });
          }
        }

        // Si c'est un tuteur, chercher ses apprentis
        if (userRole === 'Tuteur') {
          const { data: studentData, error: studentError } = await supabase
            .from('tutor_students_view')
            .select('*')
            .eq('tutor_id', userId)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

          if (!mounted) return;

          if (!studentError && studentData) {
            setRelationInfo({
              type: 'student',
              name: `${studentData.student_first_name} ${studentData.student_last_name}`,
              formation: studentData.formation_title
            });
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des relations:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUserRelations();
    
    return () => {
      mounted = false;
    };
  }, [userId, userRole]);

  return { userInfo, relationInfo, loading: loading || userLoading };
};
