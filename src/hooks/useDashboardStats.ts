import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFormations } from './useFormations';

export interface DashboardStats {
  studentsCount: number;
  instructorsCount: number;
  formationsCount: number;
  weeklyScheduledCourses: number;
  weeklyHours: number;
  monthlyHours: number;
  yearlyHours: number;
  attendanceRate: number;
  textBookMissingEntries: number;
  pendingAttendanceSheets: number;
}

export const useDashboardStats = (selectedFormationId?: string) => {
  const [stats, setStats] = useState<DashboardStats>({
    studentsCount: 0,
    instructorsCount: 0,
    formationsCount: 0,
    weeklyScheduledCourses: 0,
    weeklyHours: 0,
    monthlyHours: 0,
    yearlyHours: 0,
    attendanceRate: 0,
    textBookMissingEntries: 0,
    pendingAttendanceSheets: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { formations } = useFormations();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Dates pour les filtres
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31);

      // Compter les étudiants
      let studentsCount = 0;
      
      if (selectedFormationId) {
        const { count } = await supabase
          .from('user_formation_assignments')
          .select('user_id', { count: 'exact', head: true })
          .eq('formation_id', selectedFormationId);
        studentsCount = count || 0;
      } else {
        const { count } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'Étudiant');
        studentsCount = count || 0;
      }

      // Compter les formateurs
      const { count: instructorsCount } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'Formateur');

      // Compter les formations
      let formationsCount = 0;
      
      if (selectedFormationId) {
        const { count } = await supabase
          .from('formations')
          .select('id', { count: 'exact', head: true })
          .eq('id', selectedFormationId);
        formationsCount = count || 0;
      } else {
        const { count } = await supabase
          .from('formations')
          .select('id', { count: 'exact', head: true });
        formationsCount = count || 0;
      }

      // Cours planifiés cette semaine
      let weeklyScheduledCourses = 0;
      
      if (selectedFormationId) {
        const { count } = await supabase
          .from('schedule_slots')
          .select('id, schedules!inner(formation_id)', { count: 'exact', head: true })
          .eq('schedules.formation_id', selectedFormationId)
          .gte('date', startOfWeek.toISOString().split('T')[0])
          .lte('date', endOfWeek.toISOString().split('T')[0]);
        weeklyScheduledCourses = count || 0;
      } else {
        const { count } = await supabase
          .from('schedule_slots')
          .select('id', { count: 'exact', head: true })
          .gte('date', startOfWeek.toISOString().split('T')[0])
          .lte('date', endOfWeek.toISOString().split('T')[0]);
        weeklyScheduledCourses = count || 0;
      }

      // Heures de cours (semaine, mois, année)
      const getHoursForPeriod = async (startDate: Date, endDate: Date) => {
        let query = supabase
          .from('schedule_slots')
          .select('start_time, end_time')
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0]);

        if (selectedFormationId) {
          query = supabase
            .from('schedule_slots')
            .select(`
              start_time, 
              end_time,
              schedules!inner(formation_id)
            `)
            .eq('schedules.formation_id', selectedFormationId)
            .gte('date', startDate.toISOString().split('T')[0])
            .lte('date', endDate.toISOString().split('T')[0]);
        }

        const { data } = await query;
        
        if (!data) return 0;

        return data.reduce((total, slot) => {
          const start = new Date(`1970-01-01T${slot.start_time}`);
          const end = new Date(`1970-01-01T${slot.end_time}`);
          const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          return total + duration;
        }, 0);
      };

      const [weeklyHours, monthlyHours, yearlyHours] = await Promise.all([
        getHoursForPeriod(startOfWeek, endOfWeek),
        getHoursForPeriod(startOfMonth, endOfMonth),
        getHoursForPeriod(startOfYear, endOfYear),
      ]);

      // Taux de présence
      let attendanceQuery = supabase
        .from('attendance_signatures')
        .select('present, attendance_sheets!inner(formation_id)')
        .gte('signed_at', startOfMonth.toISOString());

      if (selectedFormationId) {
        attendanceQuery = attendanceQuery
          .eq('attendance_sheets.formation_id', selectedFormationId);
      }

      const { data: attendanceData } = await attendanceQuery;
      
      let attendanceRate = 0;
      if (attendanceData && attendanceData.length > 0) {
        const presentCount = attendanceData.filter(sig => sig.present).length;
        attendanceRate = Math.round((presentCount / attendanceData.length) * 100);
      }

      // Entrées de cahier de textes manquantes (estimation basée sur les créneaux sans entrées)
      let textBookQuery = supabase
        .from('schedule_slots')
        .select(`
          id,
          date,
          schedules!inner(formation_id)
        `)
        .lt('date', now.toISOString().split('T')[0]);

      if (selectedFormationId) {
        textBookQuery = textBookQuery
          .eq('schedules.formation_id', selectedFormationId);
      }

      const { data: scheduleSlots } = await textBookQuery;
      
      let textBookEntriesQuery = supabase
        .from('text_book_entries')
        .select('id, date, text_books!inner(formation_id)');

      if (selectedFormationId) {
        textBookEntriesQuery = textBookEntriesQuery
          .eq('text_books.formation_id', selectedFormationId);
      }

      const { data: textBookEntries } = await textBookEntriesQuery;

      const textBookMissingEntries = Math.max(0, 
        (scheduleSlots?.length || 0) - (textBookEntries?.length || 0)
      );

      // Feuilles d'émargement à traiter
      let pendingQuery = supabase
        .from('attendance_sheets')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'En attente de validation');

      if (selectedFormationId) {
        pendingQuery = pendingQuery.eq('formation_id', selectedFormationId);
      }

      const { count: pendingAttendanceSheets } = await pendingQuery;

      setStats({
        studentsCount: studentsCount || 0,
        instructorsCount: instructorsCount || 0,
        formationsCount: formationsCount || 0,
        weeklyScheduledCourses: weeklyScheduledCourses || 0,
        weeklyHours: Math.round(weeklyHours),
        monthlyHours: Math.round(monthlyHours),
        yearlyHours: Math.round(yearlyHours),
        attendanceRate,
        textBookMissingEntries,
        pendingAttendanceSheets: pendingAttendanceSheets || 0,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedFormationId, formations]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};