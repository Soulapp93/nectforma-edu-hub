
import { supabase } from '@/integrations/supabase/client';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
export const fileUploadService = {
  async uploadFile(file: File, bucket: string = 'module-files', userId?: string): Promise<string> {
    try {
      logger.log('Uploading file:', file.name, 'to bucket:', bucket);
      
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      let fileName: string;
      
      if (bucket === 'avatars' && userId) {
        // Pour les avatars, utiliser la structure userId/filename avec timestamp pour cache-busting
        fileName = `${userId}/avatar_${Date.now()}.${fileExt}`;
      } else {
        fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      }
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '0', // Pas de cache pour les avatars
          upsert: true,
          contentType: file.type
        });

      if (error) {
        logger.error('Upload error:', error);
        throw new Error(`Erreur de téléchargement: ${error.message}`);
      }
      
      logger.log('File uploaded successfully:', data);
      
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);
      
      // Ajouter un timestamp pour éviter le cache du navigateur
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;
      
      logger.log('Public URL:', urlWithCacheBust);
      return urlWithCacheBust;
    } catch (error) {
      logger.error('File upload service error:', error);
      throw error;
    }
  },

  async deleteFile(filePath: string, bucket: string = 'module-files') {
    try {
      const fileName = this.getFileName(filePath);
      const { error } = await supabase.storage
        .from(bucket)
        .remove([fileName]);

      if (error) {
        logger.error('Delete error:', error);
        throw new Error(`Erreur de suppression: ${error.message}`);
      }
    } catch (error) {
      logger.error('File delete service error:', error);
      throw error;
    }
  },

  getFileName(url: string): string {
    if (!url) return 'fichier';
    // Supprimer les query params avant d'extraire le nom
    const urlWithoutParams = url.split('?')[0];
    const parts = urlWithoutParams.split('/');
    return parts[parts.length - 1] || 'fichier';
  }
};
