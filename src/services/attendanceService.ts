import { supabase } from '@/integrations/supabase/client';

export interface AttendanceSheet {
  id: string;
  schedule_slot_id: string;
  formation_id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  instructor_id?: string;
  room?: string;
  status: string;
  generated_at: string;
  created_at: string;
  updated_at: string;
  formations?: {
    title: string;
    level: string;
  } | null;
  instructor?: {
    first_name: string;
    last_name: string;
  } | null;
  signatures?: AttendanceSignature[];
}

export interface AttendanceSignature {
  id: string;
  attendance_sheet_id: string;
  user_id: string;
  user_type: 'student' | 'instructor';
  signature_data?: string;
  signed_at: string;
  present: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export const attendanceService = {
  // Générer automatiquement les feuilles d'émargement depuis les créneaux d'emploi du temps
  async generateAttendanceSheets() {
    try {
      // Récupérer les créneaux pour aujourd'hui et demain qui n'ont pas encore de feuille
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const { data: slots, error: slotsError } = await supabase
        .from('schedule_slots')
        .select(`
          *,
          schedules!inner(
            formation_id,
            formations(title, level)
          )
        `)
        .gte('date', new Date().toISOString().split('T')[0])
        .lte('date', tomorrow.toISOString().split('T')[0]);

      if (slotsError) throw slotsError;

      // Vérifier quels créneaux ont déjà une feuille d'émargement
      const { data: existingSheets, error: existingError } = await supabase
        .from('attendance_sheets')
        .select('schedule_slot_id');

      if (existingError) throw existingError;

      const existingSlotIds = existingSheets?.map(sheet => sheet.schedule_slot_id) || [];
      
      // Filtrer les créneaux sans feuille d'émargement
      const slotsNeedingSheets = slots?.filter(slot => 
        !existingSlotIds.includes(slot.id)
      ) || [];

      // Créer les feuilles d'émargement manquantes
      const newSheets = slotsNeedingSheets.map(slot => ({
        schedule_slot_id: slot.id,
        formation_id: slot.schedules.formation_id,
        title: `${slot.schedules.formations.title} - Feuille d'émargement`,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        instructor_id: slot.instructor_id,
        room: slot.room,
        status: 'En attente'
      }));

      if (newSheets.length > 0) {
        const { data, error } = await supabase
          .from('attendance_sheets')
          .insert(newSheets)
          .select();

        if (error) throw error;
        return data;
      }

      return [];
    } catch (error) {
      console.error('Error generating attendance sheets:', error);
      throw error;
    }
  },

  // Récupérer toutes les feuilles d'émargement
  async getAttendanceSheets() {
    try {
      const { data, error } = await supabase
        .from('attendance_sheets')
        .select(`
          *,
          formations!formation_id(title, level),
          users:instructor_id(first_name, last_name),
          attendance_signatures(
            *,
            users(first_name, last_name, email)
          )
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      return (data as any) || [];
    } catch (error) {
      console.error('Error fetching attendance sheets:', error);
      throw error;
    }
  },

  // Récupérer les feuilles d'émargement par formation
  async getAttendanceSheetsByFormation(formationId: string) {
    try {
      const { data, error } = await supabase
        .from('attendance_sheets')
        .select(`
          *,
          formations!formation_id(title, level),
          users:instructor_id(first_name, last_name),
          attendance_signatures(
            *,
            users(first_name, last_name, email)
          )
        `)
        .eq('formation_id', formationId)
        .order('date', { ascending: false });

      if (error) throw error;
      return (data as any) || [];
    } catch (error) {
      console.error('Error fetching attendance sheets by formation:', error);
      throw error;
    }
  },

  // Récupérer les feuilles d'émargement du jour pour un utilisateur
  async getTodaysAttendanceForUser(userId: string, userRole: string) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from('attendance_sheets')
        .select(`
          *,
          formations!formation_id(title, level),
          users:instructor_id(first_name, last_name),
          attendance_signatures!left(
            id,
            user_id,
            signature_data,
            signed_at,
            present
          )
        `)
        .eq('date', today);

      // Si c'est un formateur, filtrer par instructor_id
      if (userRole === 'Formateur') {
        query = query.eq('instructor_id', userId);
      } else {
        // Si c'est un étudiant, filtrer par les formations auxquelles il est inscrit
        const { data: userFormations } = await supabase
          .from('user_formation_assignments')
          .select('formation_id')
          .eq('user_id', userId);

        if (userFormations && userFormations.length > 0) {
          const formationIds = userFormations.map(uf => uf.formation_id);
          query = query.in('formation_id', formationIds);
        }
      }

      const { data, error } = await query.order('start_time');

      if (error) throw error;
      return (data as any) || [];
    } catch (error) {
      console.error('Error fetching today attendance for user:', error);
      throw error;
    }
  },

  // Signer une feuille d'émargement
  async signAttendanceSheet(attendanceSheetId: string, userId: string, userType: 'student' | 'instructor', signatureData?: string) {
    try {
      // Vérifier si l'utilisateur a déjà signé
      const { data: existing } = await supabase
        .from('attendance_signatures')
        .select('id')
        .eq('attendance_sheet_id', attendanceSheetId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        throw new Error('Vous avez déjà signé cette feuille d\'émargement');
      }

      // Créer la signature
      const { data, error } = await supabase
        .from('attendance_signatures')
        .insert({
          attendance_sheet_id: attendanceSheetId,
          user_id: userId,
          user_type: userType,
          signature_data: signatureData,
          present: true
        })
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour le statut de la feuille d'émargement si nécessaire
      await supabase
        .from('attendance_sheets')
        .update({ status: 'En cours' })
        .eq('id', attendanceSheetId)
        .eq('status', 'En attente');

      return data;
    } catch (error) {
      console.error('Error signing attendance sheet:', error);
      throw error;
    }
  },

  // Vérifier si un utilisateur a signé une feuille d'émargement
  async hasUserSigned(attendanceSheetId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('attendance_signatures')
        .select('id')
        .eq('attendance_sheet_id', attendanceSheetId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking if user has signed:', error);
      return false;
    }
  },

  // Mettre à jour le statut d'une feuille d'émargement
  async updateAttendanceSheetStatus(attendanceSheetId: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('attendance_sheets')
        .update({ status })
        .eq('id', attendanceSheetId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating attendance sheet status:', error);
      throw error;
    }
  }
};