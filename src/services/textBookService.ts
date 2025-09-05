import { supabase } from '@/integrations/supabase/client';

export interface TextBook {
  id: string;
  formation_id: string;
  academic_year: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  formations?: {
    title: string;
    color?: string;
  };
}

export interface TextBookEntry {
  id: string;
  text_book_id: string;
  date: string;
  start_time: string;
  end_time: string;
  subject_matter: string;
  content?: string;
  homework?: string;
  instructor_id?: string;
  created_at: string;
  updated_at: string;
}

export const textBookService = {
  async createTextBook(data: { formation_id: string; academic_year: string; created_by?: string }) {
    console.log('Création de cahier de texte:', data);
    
    const { data: textBook, error } = await supabase
      .from('text_books')
      .insert([data])
      .select(`
        *,
        formations (
          title,
          color
        )
      `)
      .single();

    if (error) {
      console.error('Erreur lors de la création du cahier de texte:', error);
      throw new Error(`Erreur lors de la création du cahier de texte: ${error.message}`);
    }

    console.log('Cahier de texte créé:', textBook);
    return textBook;
  },

  async getTextBooks() {
    console.log('Récupération des cahiers de texte...');
    
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
      console.error('Erreur lors de la récupération des cahiers de texte:', error);
      throw new Error(`Erreur lors de la récupération des cahiers de texte: ${error.message}`);
    }

    console.log('Cahiers de texte récupérés:', data);
    return data;
  },

  async getTextBookByFormationId(formationId: string) {
    console.log('Récupération du cahier de texte pour la formation:', formationId);
    
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
      console.error('Erreur lors de la récupération du cahier de texte:', error);
      throw new Error(`Erreur lors de la récupération du cahier de texte: ${error.message}`);
    }

    console.log('Cahier de texte récupéré:', data);
    return data;
  },

  async getTextBookEntries(textBookId: string) {
    console.log('Récupération des entrées du cahier de texte:', textBookId);
    
    const { data, error } = await supabase
      .from('text_book_entries')
      .select('*')
      .eq('text_book_id', textBookId)
      .order('date', { ascending: false })
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des entrées:', error);
      throw new Error(`Erreur lors de la récupération des entrées: ${error.message}`);
    }

    console.log('Entrées récupérées:', data);
    return data;
  },

  async createTextBookEntry(data: Omit<TextBookEntry, 'id' | 'created_at' | 'updated_at'>) {
    console.log('Création d\'entrée de cahier de texte:', data);
    
    const { data: entry, error } = await supabase
      .from('text_book_entries')
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de l\'entrée:', error);
      throw new Error(`Erreur lors de la création de l'entrée: ${error.message}`);
    }

    console.log('Entrée créée:', entry);
    return entry;
  }
};