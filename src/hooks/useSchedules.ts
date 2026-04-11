import { useState, useEffect } from 'react';
import { scheduleService, Schedule } from '@/services/scheduleService';
import { supabase } from '@/integrations/supabase/client';

export const useSchedules = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await scheduleService.getSchedules();
      setSchedules(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des emplois du temps');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // Synchronisation en temps réel avec Supabase
  useEffect(() => {
    let schedulesSubscription: ReturnType<typeof supabase.channel> | null = null;
    let slotsSubscription: ReturnType<typeof supabase.channel> | null = null;
    
    try {
      schedulesSubscription = supabase
        .channel(`admin_schedules_changes-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => fetchSchedules())
        .subscribe();

      slotsSubscription = supabase
        .channel(`admin_slots_changes-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_slots' }, () => fetchSchedules())
        .subscribe();
    } catch (err) {
      console.warn('Schedules realtime subscription failed (non-critical):', err);
    }

    return () => {
      if (schedulesSubscription) supabase.removeChannel(schedulesSubscription);
      if (slotsSubscription) supabase.removeChannel(slotsSubscription);
    };
  }, []);

  return {
    schedules,
    loading,
    error,
    refetch: fetchSchedules
  };
};