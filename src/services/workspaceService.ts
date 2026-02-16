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

export interface WorkspaceDocumentShare {
  id: string;
  document_id: string;
  shared_with_id: string;
  shared_by: string;
  permission: 'view' | 'edit';
  created_at: string;
}

export const workspaceService = {
  // Folders
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
    const cleanFolder: Record<string, any> = {};
    for (const [key, value] of Object.entries(folder)) {
      if (value !== undefined && value !== null) {
        cleanFolder[key] = value;
      }
    }
    const { data, error } = await db.from('workspace_folders').insert(cleanFolder).select().single();
    if (error) {
      console.error('Supabase createFolder error:', error);
      throw error;
    }
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

  // Documents
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

  async getSharedDocuments(userId: string): Promise<WorkspaceDocument[]> {
    // Get document IDs shared with this user
    const { data: shares, error: sharesError } = await db
      .from('workspace_document_shares')
      .select('document_id')
      .eq('shared_with_id', userId);
    if (sharesError) throw sharesError;
    if (!shares || shares.length === 0) return [];

    const docIds = shares.map((s: any) => s.document_id);
    const { data, error } = await db
      .from('workspace_documents')
      .select('*')
      .in('id', docIds)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []) as WorkspaceDocument[];
  },

  async createDocument(doc: Partial<WorkspaceDocument>): Promise<WorkspaceDocument> {
    // Remove null/undefined keys to let DB defaults apply
    const cleanDoc: Record<string, any> = {};
    for (const [key, value] of Object.entries(doc)) {
      if (value !== undefined && value !== null) {
        cleanDoc[key] = value;
      }
    }
    const { data, error } = await db.from('workspace_documents').insert(cleanDoc).select().single();
    if (error) {
      console.error('Supabase createDocument error:', error);
      throw error;
    }
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

  // Sharing
  async shareDocument(documentId: string, sharedWithId: string, sharedBy: string, permission: 'view' | 'edit' = 'edit'): Promise<WorkspaceDocumentShare> {
    // Update document is_shared flag
    await db.from('workspace_documents').update({ is_shared: true }).eq('id', documentId);

    const { data, error } = await db
      .from('workspace_document_shares')
      .insert({ document_id: documentId, shared_with_id: sharedWithId, shared_by: sharedBy, permission })
      .select()
      .single();
    if (error) throw error;
    return data as WorkspaceDocumentShare;
  },

  async getDocumentShares(documentId: string): Promise<WorkspaceDocumentShare[]> {
    const { data, error } = await db
      .from('workspace_document_shares')
      .select('*')
      .eq('document_id', documentId);
    if (error) throw error;
    return (data || []) as WorkspaceDocumentShare[];
  },

  async removeShare(shareId: string): Promise<void> {
    const { error } = await db.from('workspace_document_shares').delete().eq('id', shareId);
    if (error) throw error;
  },

  // Realtime subscription for a document
  subscribeToDocument(documentId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`workspace-doc-${documentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_documents',
          filter: `id=eq.${documentId}`,
        },
        callback
      )
      .subscribe();
    return channel;
  },
};
