import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { virtualClassService, VirtualClass } from '@/services/virtualClassService';
import { useCurrentUser } from './useCurrentUser';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useVirtualClasses = () => {
  return useQuery({
    queryKey: ['virtual-classes'],
    queryFn: virtualClassService.getVirtualClasses,
  });
};

export const useVirtualClass = (id: string) => {
  return useQuery({
    queryKey: ['virtual-class', id],
    queryFn: () => virtualClassService.getVirtualClassById(id),
    enabled: !!id,
  });
};

export const useCreateVirtualClass = () => {
  const queryClient = useQueryClient();
  const { userId: currentUserId } = useCurrentUser();

  return useMutation({
    mutationFn: async (classData: any) => {
      // Récupérer l'établissement de l'utilisateur courant (requis par les politiques RLS)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('Utilisateur non authentifié');

      const { data: profile, error } = await supabase
        .from('users')
        .select('establishment_id')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !profile?.establishment_id) {
        throw error ?? new Error('Impossible de déterminer votre établissement');
      }

      return virtualClassService.createVirtualClass({
        ...classData,
        establishment_id: profile.establishment_id,
        created_by: currentUserId ?? user.id,
        current_participants: 0,
        status: 'Programmé',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['virtual-classes'] });
      toast.success('Classe virtuelle créée avec succès');
    },
    onError: (error) => {
      console.error('Error creating virtual class:', error);
      toast.error('Erreur lors de la création de la classe virtuelle');
    },
  });
};

export const useUpdateVirtualClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<VirtualClass> }) => {
      return virtualClassService.updateVirtualClass(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['virtual-classes'] });
      toast.success('Classe virtuelle mise à jour');
    },
    onError: (error) => {
      console.error('Error updating virtual class:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });
};

export const useDeleteVirtualClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: virtualClassService.deleteVirtualClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['virtual-classes'] });
      toast.success('Classe virtuelle supprimée');
    },
    onError: (error) => {
      console.error('Error deleting virtual class:', error);
      toast.error('Erreur lors de la suppression');
    },
  });
};

export const useJoinClass = () => {
  const queryClient = useQueryClient();
  const { userId: currentUserId } = useCurrentUser();

  return useMutation({
    mutationFn: (classId: string) => {
      if (!currentUserId) throw new Error('User not authenticated');
      return virtualClassService.joinClass(classId, currentUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['virtual-classes'] });
      toast.success('Vous avez rejoint la classe virtuelle');
    },
    onError: (error) => {
      console.error('Error joining class:', error);
      toast.error('Erreur lors de l\'inscription à la classe');
    },
  });
};

export const useInstructors = () => {
  return useQuery({
    queryKey: ['instructors'],
    queryFn: virtualClassService.getInstructors,
  });
};

export const useFormationsForSelect = () => {
  return useQuery({
    queryKey: ['formations-select'],
    queryFn: virtualClassService.getFormations,
  });
};