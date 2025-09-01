
import { supabase } from '@/integrations/supabase/client';

export interface ModuleDocument {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  document_type: 'article' | 'support' | 'reference' | 'autre';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const moduleDocumentService = {
  async getModuleDocuments(moduleId: string) {
    const { data, error } = await supabase
      .from('module_documents')
      .select('*')
      .eq('module_id', moduleId)
      .order('created_at');
    
    if (error) throw error;
    return data;
  },

  async createDocument(document: Omit<ModuleDocument, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('module_documents')
      .insert(document)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteDocument(id: string) {
    const { error } = await supabase
      .from('module_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
