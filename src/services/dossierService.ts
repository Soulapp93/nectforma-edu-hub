import { supabase } from '@/integrations/supabase/client';

export interface UserDocument {
  id: string;
  user_id: string;
  establishment_id: string;
  document_type: string;
  title: string;
  description?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  nationality?: string;
  status?: string;
  profile_photo_url?: string;
  created_at?: string;
}

export const dossierService = {
  async getEstablishmentUsers(establishmentId: string, role: 'Étudiant' | 'Formateur') {
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role, phone, date_of_birth, gender, address, city, postal_code, country, nationality, status, profile_photo_url, created_at')
      .eq('establishment_id', establishmentId)
      .eq('role', role)
      .order('last_name');
    if (error) throw error;
    return (data || []) as UserProfile[];
  },

  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role, phone, date_of_birth, gender, address, city, postal_code, country, nationality, status, profile_photo_url, created_at, establishment_id')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data as UserProfile & { establishment_id: string };
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);
    if (error) throw error;
  },

  async getUserFormations(userId: string) {
    const { data, error } = await supabase
      .from('user_formation_assignments')
      .select('formation_id, formations(id, title, level, start_date, end_date, formation_type)')
      .eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },

  async getUserTranscripts(userId: string) {
    const { data, error } = await supabase
      .from('transcripts')
      .select('id, formation_id, semester, academic_year, status, gpa, total_ects, created_at, formations(title)')
      .eq('student_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getUserStudentDocuments(userId: string) {
    const { data, error } = await supabase
      .from('student_documents')
      .select('*')
      .eq('student_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getUserContracts(userId: string) {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('employee_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getUserDocuments(userId: string) {
    const { data, error } = await supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as UserDocument[];
  },

  async uploadDocument(
    userId: string,
    establishmentId: string,
    file: File,
    documentType: string,
    title: string,
    description?: string
  ) {
    const filePath = `${establishmentId}/${userId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('user-documents')
      .upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('user-documents')
      .getPublicUrl(filePath);

    const { data: authData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('user_documents')
      .insert({
        user_id: userId,
        establishment_id: establishmentId,
        document_type: documentType,
        title,
        description,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        uploaded_by: authData.user?.id,
      })
      .select()
      .single();
    if (error) throw error;
    return data as UserDocument;
  },

  async deleteDocument(documentId: string) {
    const { error } = await supabase
      .from('user_documents')
      .delete()
      .eq('id', documentId);
    if (error) throw error;
  },

  async getFormateurModules(userId: string) {
    const { data, error } = await supabase
      .from('schedule_slots')
      .select('formation_modules(id, title)')
      .eq('instructor_id', userId);
    if (error) throw error;
    return data || [];
  },
};
