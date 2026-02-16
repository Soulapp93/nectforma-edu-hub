import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

export interface WorkspaceFolder {
  id: string;
  name: string;
  parent_id: string | null;
  owner_id: string;
  owner_type: 'user' | 'establishment';
  establishment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceDocument {
  id: string;
  title: string;
  document_type: 'text' | 'spreadsheet' | 'presentation' | 'visual';
  content: any;
  folder_id: string | null;
  owner_id: string;
  owner_type: 'user' | 'establishment';
  establishment_id: string | null;
  is_shared: boolean;
  last_edited_by: string | null;
  created_at: string;
  updated_at: string;
}

export const workspaceService = {
  // Folders - simplified: always user-owned
  async getFolders(ownerId: string): Promise<WorkspaceFolder[]> {
    const { data, error } = await db
      .from('workspace_folders')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('owner_type', 'user')
      .order('name');
    if (error) throw error;
    return (data || []) as WorkspaceFolder[];
  },

  async createFolder(folder: Partial<WorkspaceFolder>): Promise<WorkspaceFolder> {
    const { data, error } = await db.from('workspace_folders').insert(folder).select().single();
    if (error) throw error;
    return data as WorkspaceFolder;
  },

  async deleteFolder(id: string): Promise<void> {
    const { error } = await db.from('workspace_folders').delete().eq('id', id);
    if (error) throw error;
  },

  async renameFolder(id: string, name: string): Promise<void> {
    const { error } = await db.from('workspace_folders').update({ name }).eq('id', id);
    if (error) throw error;
  },

  // Documents - simplified: always user-owned
  async getDocuments(ownerId: string, folderId?: string | null): Promise<WorkspaceDocument[]> {
    let query = db
      .from('workspace_documents')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('owner_type', 'user');
    if (folderId === null) {
      query = query.is('folder_id', null);
    } else if (folderId) {
      query = query.eq('folder_id', folderId);
    }
    const { data, error } = await query.order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []) as WorkspaceDocument[];
  },

  async createDocument(doc: Partial<WorkspaceDocument>): Promise<WorkspaceDocument> {
    const { data, error } = await db.from('workspace_documents').insert(doc).select().single();
    if (error) throw error;
    return data as WorkspaceDocument;
  },

  async updateDocument(id: string, updates: Partial<WorkspaceDocument>): Promise<WorkspaceDocument> {
    const { data, error } = await db.from('workspace_documents').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as WorkspaceDocument;
  },

  async deleteDocument(id: string): Promise<void> {
    const { error } = await db.from('workspace_documents').delete().eq('id', id);
    if (error) throw error;
  },

  async getDocument(id: string): Promise<WorkspaceDocument> {
    const { data, error } = await db.from('workspace_documents').select('*').eq('id', id).single();
    if (error) throw error;
    return data as WorkspaceDocument;
  },
};
