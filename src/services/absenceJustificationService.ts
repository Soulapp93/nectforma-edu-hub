import { supabase } from '@/integrations/supabase/client';

export interface AbsenceJustification {
  id: string;
  signature_id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  comment?: string;
  status: 'pending' | 'validated' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_comment?: string;
  created_at: string;
  updated_at: string;
}

export const absenceJustificationService = {
  // Upload justificatif pour une absence
  async uploadJustification(
    signatureId: string,
    userId: string,
    file: File,
    comment?: string
  ) {
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `justifications/${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('student-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('student-documents')
        .getPublicUrl(filePath);

      // Create justification record
      const { data, error } = await supabase
        .from('absence_justifications' as any)
        .insert({
          signature_id: signatureId,
          user_id: userId,
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          comment: comment || null,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error uploading justification:', error);
      throw error;
    }
  },

  // Récupérer les justificatifs d'un utilisateur
  async getUserJustifications(userId: string) {
    try {
      const { data, error } = await supabase
        .from('absence_justifications' as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as AbsenceJustification[];
    } catch (error) {
      console.error('Error fetching user justifications:', error);
      throw error;
    }
  },

  // Récupérer les justificatifs en attente (pour admin)
  async getPendingJustifications() {
    try {
      const { data, error } = await supabase
        .from('absence_justifications' as any)
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as AbsenceJustification[];
    } catch (error) {
      console.error('Error fetching pending justifications:', error);
      throw error;
    }
  },

  // Compter les justificatifs en attente
  async getPendingCount() {
    try {
      const { count, error } = await supabase
        .from('absence_justifications' as any)
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error counting pending justifications:', error);
      return 0;
    }
  },

  // Valider ou rejeter un justificatif (admin)
  async reviewJustification(
    justificationId: string,
    adminUserId: string,
    decision: 'validated' | 'rejected',
    reviewComment?: string
  ) {
    try {
      const { data, error } = await supabase
        .from('absence_justifications' as any)
        .update({
          status: decision,
          reviewed_by: adminUserId,
          reviewed_at: new Date().toISOString(),
          review_comment: reviewComment || null
        })
        .eq('id', justificationId)
        .select()
        .single();

      if (error) throw error;

      // Si validé, mettre à jour le type d'absence
      if (decision === 'validated') {
        const justif = data as unknown as AbsenceJustification;
        await supabase
          .from('attendance_signatures')
          .update({ absence_reason_type: 'justifié' as any })
          .eq('id', justif.signature_id);
      }

      return data;
    } catch (error) {
      console.error('Error reviewing justification:', error);
      throw error;
    }
  },

  // Récupérer les détails complets d'une absence avec justificatif
  async getAbsenceDetails(signatureId: string) {
    try {
      const { data: signature, error: sigError } = await supabase
        .from('attendance_signatures')
        .select(`
          *,
          attendance_sheets(
            id, title, date, start_time, end_time,
            formations:formation_id(title, level)
          )
        `)
        .eq('id', signatureId)
        .single();

      if (sigError) throw sigError;

      // Get user info
      const { data: userInfo } = await supabase
        .from('users')
        .select('first_name, last_name, email, role')
        .eq('id', (signature as any).user_id)
        .single();

      // Get justification if exists
      const { data: justification } = await supabase
        .from('absence_justifications' as any)
        .select('*')
        .eq('signature_id', signatureId)
        .maybeSingle();

      return {
        signature,
        userInfo,
        justification: justification as unknown as AbsenceJustification | null
      };
    } catch (error) {
      console.error('Error fetching absence details:', error);
      throw error;
    }
  },

  // Vérifier si une absence a déjà un justificatif
  async hasJustification(signatureId: string) {
    try {
      const { data, error } = await supabase
        .from('absence_justifications' as any)
        .select('id, status')
        .eq('signature_id', signatureId)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as { id: string; status: string } | null;
    } catch (error) {
      console.error('Error checking justification:', error);
      return null;
    }
  }
};
