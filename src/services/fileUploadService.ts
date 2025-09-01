
import { supabase } from '@/integrations/supabase/client';

export const fileUploadService = {
  async uploadFile(file: File, bucket: string = 'module-files'): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    return publicUrl;
  },

  async deleteFile(filePath: string, bucket: string = 'module-files') {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;
  },

  getFileName(url: string): string {
    return url.split('/').pop() || 'fichier';
  }
};
