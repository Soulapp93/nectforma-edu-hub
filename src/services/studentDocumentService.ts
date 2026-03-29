import { supabase } from '@/integrations/supabase/client';

export type StudentDocumentType = 'certificat_scolarite' | 'certificat_inscription' | 'diplome' | 'bulletin_notes' | 'contrat' | 'convention_stage' | 'attestation' | 'releve_notes' | 'autre';
export type DocumentStatus = 'draft' | 'validated' | 'archived';

export interface StudentDocument {
  id: string;
  student_id: string;
  establishment_id: string;
  promotion_id: string | null;
  document_type: StudentDocumentType;
  title: string;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  academic_year: string | null;
  status: DocumentStatus;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
}

export const documentTypeLabels: Record<StudentDocumentType, string> = {
  certificat_scolarite: 'Certificat de scolarité',
  certificat_inscription: "Certificat d'inscription",
  diplome: 'Diplôme',
  bulletin_notes: 'Bulletin de notes',
  contrat: 'Contrat',
  convention_stage: 'Convention de stage',
  attestation: 'Attestation',
  releve_notes: 'Relevé de notes',
  autre: 'Autre',
};

export const documentStatusLabels: Record<DocumentStatus, string> = {
  draft: 'Brouillon',
  validated: 'Validé',
  archived: 'Archivé',
};

export const studentDocumentService = {
  async getByStudent(studentId: string): Promise<StudentDocument[]> {
    const { data, error } = await supabase
      .from('student_documents')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as StudentDocument[];
  },

  async getByPromotion(promotionId: string): Promise<StudentDocument[]> {
    const { data, error } = await supabase
      .from('student_documents')
      .select('*')
      .eq('promotion_id', promotionId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as StudentDocument[];
  },

  async create(doc: Omit<StudentDocument, 'id' | 'created_at' | 'updated_at' | 'validated_by' | 'validated_at'>): Promise<StudentDocument> {
    const { data, error } = await supabase
      .from('student_documents')
      .insert(doc as any)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as StudentDocument;
  },

  async update(id: string, updates: Partial<StudentDocument>): Promise<StudentDocument> {
    const { data, error } = await supabase
      .from('student_documents')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as StudentDocument;
  },

  async validate(id: string, validatedBy: string): Promise<StudentDocument> {
    return this.update(id, { status: 'validated' as any, validated_by: validatedBy, validated_at: new Date().toISOString() } as any);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('student_documents').delete().eq('id', id);
    if (error) throw error;
  },

  async uploadFile(file: File, establishmentId: string, studentId: string): Promise<string> {
    const ext = file.name.split('.').pop();
    const path = `${establishmentId}/${studentId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('student-documents').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('student-documents').getPublicUrl(path);
    return data.publicUrl;
  },
};
