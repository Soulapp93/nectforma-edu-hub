import { supabase } from '@/integrations/supabase/client';

export interface DigitalSafeFolder {
  id: string;
  name: string;
  parent_folder_id?: string;
  user_id: string;
  establishment_id: string;
  created_at: string;
  updated_at: string;
}

export interface DigitalSafeFile {
  id: string;
  name: string;
  original_name: string;
  file_path: string;
  file_url: string;
  file_size: number;
  content_type: string;
  folder_id?: string;
  user_id: string;
  establishment_id: string;
  is_shared: boolean;
  shared_with_users?: string[];
  shared_with_roles?: string[];
  created_at: string;
  updated_at: string;
}

export const digitalSafeService = {
  async getFolders(parentId?: string) {
    console.log('Récupération des dossiers...');
    
    let query = supabase
      .from('digital_safe_folders')
      .select('*')
      .order('name');

    if (parentId) {
      query = query.eq('parent_folder_id', parentId);
    } else {
      query = query.is('parent_folder_id', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des dossiers:', error);
      throw new Error(`Erreur lors de la récupération des dossiers: ${error.message}`);
    }

    return data;
  },

  async createFolder(name: string, parentId?: string) {
    console.log('Création du dossier:', name);
    
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('Utilisateur non authentifié');

    const { data: userProfile } = await supabase
      .from('users')
      .select('establishment_id')
      .eq('id', currentUser.user.id)
      .single();

    if (!userProfile) throw new Error('Profil utilisateur non trouvé');

    const { data, error } = await supabase
      .from('digital_safe_folders')
      .insert([{
        name,
        parent_folder_id: parentId || null,
        user_id: currentUser.user.id,
        establishment_id: userProfile.establishment_id
      }])
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création du dossier:', error);
      throw new Error(`Erreur lors de la création du dossier: ${error.message}`);
    }

    return data;
  },

  async getFiles(folderId?: string) {
    console.log('Récupération des fichiers...');
    
    let query = supabase
      .from('digital_safe_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (folderId) {
      query = query.eq('folder_id', folderId);
    } else {
      query = query.is('folder_id', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des fichiers:', error);
      throw new Error(`Erreur lors de la récupération des fichiers: ${error.message}`);
    }

    return data;
  },

  async uploadFiles(files: File[], folderId?: string) {
    console.log('Upload de fichiers:', files.length, 'fichiers');
    
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('Utilisateur non authentifié');

    const { data: userProfile } = await supabase
      .from('users')
      .select('establishment_id')
      .eq('id', currentUser.user.id)
      .single();

    if (!userProfile) throw new Error('Profil utilisateur non trouvé');

    const uploadedFiles: DigitalSafeFile[] = [];
    
    for (const file of files) {
      try {
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `${currentUser.user.id}/${fileName}`;
        
        // Upload vers le storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('coffre-fort-files')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Erreur upload storage:', uploadError);
          throw new Error(`Erreur upload: ${uploadError.message}`);
        }

        // Obtenir l'URL du fichier
        const { data: { publicUrl } } = supabase.storage
          .from('coffre-fort-files')
          .getPublicUrl(filePath);

        // Sauvegarder les métadonnées en base
        const { data: fileData, error: dbError } = await supabase
          .from('digital_safe_files')
          .insert([{
            name: fileName,
            original_name: file.name,
            file_path: filePath,
            file_url: publicUrl,
            file_size: file.size,
            content_type: file.type || 'application/octet-stream',
            folder_id: folderId || null,
            user_id: currentUser.user.id,
            establishment_id: userProfile.establishment_id,
            is_shared: false
          }])
          .select()
          .single();

        if (dbError) {
          console.error('Erreur sauvegarde DB:', dbError);
          throw new Error(`Erreur sauvegarde: ${dbError.message}`);
        }

        uploadedFiles.push(fileData);
      } catch (error) {
        console.error('Erreur upload fichier:', file.name, error);
        throw error;
      }
    }

    return uploadedFiles;
  },

  async deleteFile(fileId: string) {
    console.log('Suppression du fichier:', fileId);
    
    // Récupérer les infos du fichier
    const { data: file, error: fetchError } = await supabase
      .from('digital_safe_files')
      .select('file_path')
      .eq('id', fileId)
      .single();

    if (fetchError || !file) {
      throw new Error('Fichier non trouvé');
    }

    // Supprimer du storage
    const { error: storageError } = await supabase.storage
      .from('coffre-fort-files')
      .remove([file.file_path]);

    if (storageError) {
      console.error('Erreur suppression storage:', storageError);
    }

    // Supprimer de la base
    const { error: dbError } = await supabase
      .from('digital_safe_files')
      .delete()
      .eq('id', fileId);

    if (dbError) {
      console.error('Erreur suppression DB:', dbError);
      throw new Error(`Erreur lors de la suppression: ${dbError.message}`);
    }
  },

  async deleteFolder(folderId: string) {
    console.log('Suppression du dossier:', folderId);
    
    const { error } = await supabase
      .from('digital_safe_folders')
      .delete()
      .eq('id', folderId);

    if (error) {
      console.error('Erreur suppression dossier:', error);
      throw new Error(`Erreur lors de la suppression du dossier: ${error.message}`);
    }
  },

  async shareFile(fileId: string, userIds: string[], roles: string[]) {
    console.log('Partage du fichier:', fileId);
    
    const { error } = await supabase
      .from('digital_safe_files')
      .update({
        is_shared: true,
        shared_with_users: userIds,
        shared_with_roles: roles
      })
      .eq('id', fileId);

    if (error) {
      console.error('Erreur partage fichier:', error);
      throw new Error(`Erreur lors du partage: ${error.message}`);
    }

    // Créer les permissions individuelles
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('Utilisateur non authentifié');

    const permissions = [];
    
    for (const userId of userIds) {
      permissions.push({
        file_id: fileId,
        user_id: userId,
        permission_type: 'view',
        granted_by: currentUser.user.id
      });
    }

    for (const role of roles) {
      permissions.push({
        file_id: fileId,
        role,
        permission_type: 'view',
        granted_by: currentUser.user.id
      });
    }

    if (permissions.length > 0) {
      const { error: permissionError } = await supabase
        .from('digital_safe_file_permissions')
        .insert(permissions);

      if (permissionError) {
        console.error('Erreur création permissions:', permissionError);
        throw new Error(`Erreur lors de la création des permissions: ${permissionError.message}`);
      }
    }
  },

  async downloadFile(fileUrl: string, fileName: string) {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Erreur de téléchargement');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      throw new Error('Erreur lors du téléchargement du fichier');
    }
  },

  async getStorageInfo() {
    console.log('Récupération des infos de stockage...');
    
    const { data: files, error } = await supabase
      .from('digital_safe_files')
      .select('file_size');

    if (error) {
      console.error('Erreur récupération storage info:', error);
      return { used: 0, total: 3000 * 1024 * 1024 }; // 3GB par défaut
    }

    const usedBytes = files?.reduce((total, file) => total + (file.file_size || 0), 0) || 0;
    const totalBytes = 3000 * 1024 * 1024; // 3GB pour le plan Basic

    return {
      used: usedBytes,
      total: totalBytes
    };
  }
};