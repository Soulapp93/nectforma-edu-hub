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
        // Essayer en parallèle les deux tables pour déterminer le rôle
        const [tutorResult, userResult] = await Promise.all([
          supabase
            .from('tutors')
            .select('id, first_name, last_name')
            .eq('id', uid)
            .maybeSingle(),
          supabase
            .from('users')
            .select('role, first_name, last_name')
            .eq('id', uid)
            .maybeSingle()
        ]);
        
        if (!mounted) return;
        
        // Vérifier d'abord si c'est un tuteur (priorité)
        if (!tutorResult.error && tutorResult.data) {
          console.log('Utilisateur identifié comme Tuteur:', tutorResult.data);
          setUserRole('Tuteur');
          return;
        }
        
        // Sinon, utiliser le rôle de la table users
        if (!userResult.error && userResult.data?.role) {
          console.log('Utilisateur identifié depuis users:', userResult.data);
          setUserRole(userResult.data.role);
          return;
        }
        
        // Aucun rôle trouvé
        console.log('Aucun rôle trouvé pour:', uid);
        setUserRole(null);
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
        console.log('fetchUserRelations - userId:', userId, 'userRole:', userRole);
        
        // Pour les tuteurs, récupérer depuis la table tutors
        if (userRole === 'Tuteur') {
          console.log('Récupération des données tuteur...');
          const { data: tutorData, error: tutorError } = await supabase
            .from('tutors')
            .select('*')
            .eq('id', userId)
            .single();

          if (!mounted) return;

          if (tutorError) {
            console.error('Erreur lors de la récupération des infos tuteur:', tutorError);
            setUserInfo(null);
          } else {
            console.log('Données tuteur récupérées:', tutorData);
            // Formater les données tuteur pour être compatibles avec userInfo
            setUserInfo({
              id: tutorData.id,
              first_name: tutorData.first_name,
              last_name: tutorData.last_name,
              email: tutorData.email,
              phone: tutorData.phone,
              profile_photo_url: tutorData.profile_photo_url,
              establishment_id: tutorData.establishment_id,
              role: 'Tuteur'
            });
          }

          // Chercher l'apprenti du tuteur
          const { data: studentData, error: studentError } = await supabase
            .from('tutor_students_view')
            .select('*')
            .eq('tutor_id', userId)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

          if (!mounted) return;
          
          console.log('Données apprenti:', studentData, studentError);

          if (!studentError && studentData) {
            setRelationInfo({
              type: 'student',
              name: `${studentData.student_first_name} ${studentData.student_last_name}`,
              formation: studentData.formation_title
            });
          }
        } else {
          // Pour les autres rôles, récupérer depuis la table users
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
