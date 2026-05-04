import { supabase } from '@/integrations/supabase/client';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
export interface TextBook {
  id: string;
  formation_id: string;
  title: string;
  description?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Computed property for compatibility
  academic_year?: string;
  formations?: {
    title: string;
    color?: string;
  };
}

export interface TextBookEntry {
  id: string;
  text_book_id: string;
  date: string;
  content: string;
  objectives?: string;
  homework?: string;
  schedule_slot_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  start_time?: string;
  end_time?: string;
  subject_matter?: string;
  instructor_id?: string;
  files?: TextBookEntryFile[];
  instructor?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface TextBookEntryFile {
  id: string;
  entry_id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  created_at?: string;
}

export const textBookService = {
  async createTextBook(data: { formation_id: string; title: string; description?: string; created_by?: string }) {
    logger.log('Création de cahier de texte:', data);
    
    const { data: textBook, error } = await supabase
      .from('text_books')
      .insert([{
        formation_id: data.formation_id,
        title: data.title,
        description: data.description,
        created_by: data.created_by
      }])
      .select(`
        *,
        formations (
          title,
          color
        )
      `)
      .single();

    if (error) {
      logger.error('Erreur lors de la création du cahier de texte:', error);
      throw new Error(`Erreur lors de la création du cahier de texte: ${error.message}`);
    }

    logger.log('Cahier de texte créé:', textBook);
    return textBook;
  },

  async getTextBooks() {
    logger.log('Récupération des cahiers de texte...');
    
    const { data, error } = await supabase
      .from('text_books')
      .select(`
        *,
        formations (
          title,
          color
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Erreur lors de la récupération des cahiers de texte:', error);
      throw new Error(`Erreur lors de la récupération des cahiers de texte: ${error.message}`);
    }

    logger.log('Cahiers de texte récupérés:', data);
    return data;
  },

  async getTextBookByFormationId(formationId: string) {
    logger.log('Récupération du cahier de texte pour la formation:', formationId);
    
    const { data, error } = await supabase
      .from('text_books')
      .select(`
        *,
        formations (
          title,
          color
        )
      `)
      .eq('formation_id', formationId)
      .single();

    if (error) {
      logger.error('Erreur lors de la récupération du cahier de texte:', error);
      throw new Error(`Erreur lors de la récupération du cahier de texte: ${error.message}`);
    }

    logger.log('Cahier de texte récupéré:', data);
    return data;
  },

  async getTextBookEntries(textBookId: string) {
    logger.log('Récupération des entrées du cahier de texte:', textBookId);
    
    const { data, error } = await supabase
      .from('text_book_entries')
      .select('*')
      .eq('text_book_id', textBookId)
      .order('date', { ascending: false });

    if (error) {
      logger.error('Erreur lors de la récupération des entrées:', error);
      throw new Error(`Erreur lors de la récupération des entrées: ${error.message}`);
    }

    // Fetch files and instructor info for each entry
    const entriesWithData = await Promise.all((data || []).map(async (entry) => {
      const files = await this.getEntryFiles(entry.id);
      
      // Fetch instructor info if instructor_id exists
      let instructor = null;
      if (entry.instructor_id) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .eq('id', entry.instructor_id)
          .single();
        instructor = userData;
      }
      
      return { ...entry, files, instructor };
    }));

    logger.log('Entrées récupérées avec fichiers et formateurs:', entriesWithData);
    return entriesWithData;
  },

  async createTextBookEntry(data: { 
    text_book_id: string; 
    date: string; 
    content?: string; 
    objectives?: string; 
    homework?: string; 
    schedule_slot_id?: string; 
    created_by?: string;
    start_time?: string;
    end_time?: string;
    subject_matter?: string;
    instructor_id?: string;
  }) {
    logger.log('Création d\'entrée de cahier de texte:', data);
    
    const { data: entry, error } = await (supabase
      .from('text_book_entries') as any)
      .insert([{
        text_book_id: data.text_book_id,
        date: data.date,
        content: data.content || '',
        objectives: data.objectives,
        homework: data.homework,
        schedule_slot_id: data.schedule_slot_id,
        created_by: data.created_by,
        start_time: data.start_time,
        end_time: data.end_time,
        subject_matter: data.subject_matter,
        instructor_id: data.instructor_id
      }])
      .select()
      .single();

    if (error) {
      logger.error('Erreur lors de la création de l\'entrée:', error);
      throw new Error(`Erreur lors de la création de l'entrée: ${error.message}`);
    }

    logger.log('Entrée créée:', entry);
    return entry;
  },

  async updateTextBookEntry(entryId: string, data: Partial<{ 
    date: string; 
    content: string; 
    objectives?: string; 
    homework?: string; 
    schedule_slot_id?: string;
    start_time?: string;
    end_time?: string;
    subject_matter?: string;
    instructor_id?: string;
  }>) {
    logger.log('Modification d\'entrée de cahier de texte:', entryId, data);
    
    const { data: entry, error } = await (supabase
      .from('text_book_entries') as any)
      .update(data)
      .eq('id', entryId)
      .select()
      .single();

    if (error) {
      logger.error('Erreur lors de la modification de l\'entrée:', error);
      throw new Error(`Erreur lors de la modification de l'entrée: ${error.message}`);
    }

    logger.log('Entrée modifiée:', entry);
    return entry;
  },

  async uploadEntryFiles(entryId: string, files: File[]): Promise<TextBookEntryFile[]> {
    logger.log('Upload de fichiers pour l\'entrée:', entryId, 'Nombre de fichiers:', files.length);
    const uploadedFiles: TextBookEntryFile[] = [];

    for (const file of files) {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`;
      const filePath = `text-book-entries/${entryId}/${fileName}`;

      logger.log('Upload du fichier:', file.name, 'vers:', filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('module-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        logger.error('Erreur upload fichier:', uploadError);
        continue;
      }

      logger.log('Fichier uploadé avec succès:', uploadData);

      const { data: { publicUrl } } = supabase.storage
        .from('module-files')
        .getPublicUrl(filePath);

      logger.log('URL publique:', publicUrl);

      const { data: fileData, error: insertError } = await (supabase
        .from('text_book_entry_files') as any)
        .insert({
          entry_id: entryId,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size
        })
        .select()
        .single();

      if (insertError) {
        logger.error('Erreur insertion fichier en BDD:', insertError);
      } else if (fileData) {
        logger.log('Fichier enregistré en BDD:', fileData);
        uploadedFiles.push(fileData);
      }
    }

    logger.log('Total fichiers uploadés:', uploadedFiles.length);
    return uploadedFiles;
  },

  async deleteEntryFile(fileId: string): Promise<void> {
    logger.log('Suppression du fichier:', fileId);
    
    const { error } = await (supabase
      .from('text_book_entry_files') as any)
      .delete()
      .eq('id', fileId);

    if (error) {
      logger.error('Erreur lors de la suppression du fichier:', error);
      throw new Error(`Erreur lors de la suppression du fichier: ${error.message}`);
    }
  },

  async getEntryFiles(entryId: string): Promise<TextBookEntryFile[]> {
    const { data, error } = await (supabase
      .from('text_book_entry_files') as any)
      .select('*')
      .eq('entry_id', entryId);

    if (error) {
      logger.error('Erreur lors de la récupération des fichiers:', error);
      return [];
    }

    return data || [];
  },

  async deleteTextBookEntry(entryId: string) {
    logger.log('Suppression d\'entrée de cahier de texte:', entryId);
    
    const { error } = await supabase
      .from('text_book_entries')
      .delete()
      .eq('id', entryId);

    if (error) {
      logger.error('Erreur lors de la suppression de l\'entrée:', error);
      throw new Error(`Erreur lors de la suppression de l'entrée: ${error.message}`);
    }

    logger.log('Entrée supprimée avec succès');
  },

  async archiveTextBook(textBookId: string) {
    logger.log('Archivage du cahier de texte:', textBookId);
    
    // Pour l'instant, nous simulons l'archivage
    // En production, vous devriez ajouter un champ status ou archived dans la table
    const { error } = await supabase
      .from('text_books')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', textBookId);

    if (error) {
      logger.error('Erreur lors de l\'archivage:', error);
      throw new Error(`Erreur lors de l'archivage: ${error.message}`);
    }

    logger.log('Cahier de texte archivé avec succès');
  }
};