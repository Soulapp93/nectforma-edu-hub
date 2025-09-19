import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useCurrentUser = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        // Vérifier d'abord s'il y a un utilisateur démo en session
        const demoUser = sessionStorage.getItem('demo_user');
        if (demoUser) {
          const userData = JSON.parse(demoUser);
          // Convertir les IDs démo en UUIDs valides
          let userId = userData.id;
          if (userId === 'demo-adminprincipal') {
            userId = '00000000-0000-4000-8000-000000000001'; // UUID valide pour admin démo
          } else if (userId === 'demo-student') {
            userId = '00000000-0000-4000-8000-000000000002'; // UUID valide pour étudiant démo
          } else if (userId === 'demo-formateur' || userId === 'demo-instructor') {
            userId = '00000000-0000-4000-8000-000000000003'; // UUID valide pour formateur démo
          } else if (typeof userId === 'string' && !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
            // Générer un UUID valide basé sur l'ID original
            userId = '00000000-0000-4000-8000-' + userData.id.replace(/[^a-f0-9]/gi, '').padEnd(12, '0').substr(0, 12);
          }
          setUserId(userId);
          setUserRole(userData.role);
          setLoading(false);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          setUserId(user.id);
          
          // Récupérer les informations de l'utilisateur depuis la table users
          const { data: userData, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error('Erreur lors de la récupération du rôle:', error);
            setUserRole(null);
          } else {
            setUserRole(userData?.role || null);
          }
        } else {
          setUserId(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        setUserId(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Nettoyer la session démo si une vraie session arrive
        if (session?.user?.id) {
          sessionStorage.removeItem('demo_user');
          setUserId(session.user.id);
          
          // Récupérer les informations de l'utilisateur
          const { data: userData, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (!error && userData) {
            setUserRole(userData.role);
          }
        } else {
          // Vérifier s'il y a encore un utilisateur démo
          const demoUser = sessionStorage.getItem('demo_user');
          if (demoUser) {
            const userData = JSON.parse(demoUser);
            // Convertir les IDs démo en UUIDs valides
            let userId = userData.id;
            if (userId === 'demo-adminprincipal') {
              userId = '00000000-0000-4000-8000-000000000001'; // UUID valide pour admin démo
            } else if (userId === 'demo-student') {
              userId = '00000000-0000-4000-8000-000000000002'; // UUID valide pour étudiant démo
            } else if (userId === 'demo-formateur' || userId === 'demo-instructor') {
              userId = '00000000-0000-4000-8000-000000000003'; // UUID valide pour formateur démo
            } else if (typeof userId === 'string' && !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
              // Générer un UUID valide basé sur l'ID original
              userId = '00000000-0000-4000-8000-' + userData.id.replace(/[^a-f0-9]/gi, '').padEnd(12, '0').substr(0, 12);
            }
            setUserId(userId);
            setUserRole(userData.role);
          } else {
            setUserId(null);
            setUserRole(null);
          }
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { userId, userRole, loading };
};

// Créer un hook pour récupérer les informations utilisateur avec tuteur/apprenti
export const useUserWithRelations = () => {
  const { userId, userRole, loading } = useCurrentUser();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [relationInfo, setRelationInfo] = useState<any>(null);

  useEffect(() => {
    const fetchUserRelations = async () => {
      if (!userId) return;

      try {
        // Récupérer les informations de base de l'utilisateur
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (userError) throw userError;
        setUserInfo(userData);

        // Si c'est un étudiant, chercher son tuteur
        if (userRole === 'Étudiant') {
          const { data: tutorData, error: tutorError } = await supabase
            .from('tutor_students_view')
            .select('*')
            .eq('student_id', userId)
            .eq('is_active', true)
            .single();

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
        // Note: Un tuteur peut avoir plusieurs apprentis, on prend le premier actif pour l'affichage
        if (userRole === 'Tuteur') {
          const { data: studentData, error: studentError } = await supabase
            .from('tutor_students_view')
            .select('*')
            .eq('tutor_id', userId)
            .eq('is_active', true)
            .limit(1)
            .single();

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
      }
    };

    fetchUserRelations();
  }, [userId, userRole]);

  return { userInfo, relationInfo, loading };
};