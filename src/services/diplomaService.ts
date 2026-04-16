import { supabase } from '@/integrations/supabase/client';

// ===== Types =====
export interface DiplomaElement {
  id: string;
  type: 'text' | 'variable' | 'image' | 'line' | 'rectangle' | 'signature_zone';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  styles: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    textAlign?: string;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    opacity?: number;
    textDecoration?: string;
    letterSpacing?: number;
    lineHeight?: number;
  };
  locked?: boolean;
}

export interface DiplomaTemplateData {
  elements: DiplomaElement[];
  backgroundColor: string;
  backgroundImage?: string;
  borderStyle?: 'none' | 'simple' | 'double' | 'ornate';
  borderColor?: string;
  borderWidth?: number;
}

export interface DiplomaTemplate {
  id: string;
  establishment_id: string;
  name: string;
  template_data: DiplomaTemplateData;
  orientation: 'landscape' | 'portrait';
  page_format: string;
  background_url: string | null;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GeneratedDiploma {
  id: string;
  student_id: string;
  formation_id: string;
  template_id: string | null;
  transcript_id: string | null;
  establishment_id: string;
  pdf_url: string | null;
  status: 'generated' | 'printed' | 'delivered';
  generated_at: string;
  delivered_at: string | null;
  created_at: string;
}

// ===== Variables dynamiques =====
export const DIPLOMA_VARIABLES = [
  { key: '{nom_etudiant}', label: 'Nom de l\'etudiant', example: 'Jean Dupont' },
  { key: '{prenom_etudiant}', label: 'Prenom', example: 'Jean' },
  { key: '{nom_complet}', label: 'Nom complet', example: 'Jean Dupont' },
  { key: '{formation}', label: 'Nom de la formation', example: 'Master Digital Marketing' },
  { key: '{niveau}', label: 'Niveau', example: 'BAC+5' },
  { key: '{mention}', label: 'Mention', example: 'Bien' },
  { key: '{moyenne}', label: 'Moyenne generale', example: '14.50' },
  { key: '{date_jury}', label: 'Date du jury', example: '15 juin 2026' },
  { key: '{annee_academique}', label: 'Annee academique', example: '2025-2026' },
  { key: '{etablissement}', label: 'Nom de l\'etablissement', example: 'Nectforma Demo' },
  { key: '{date_delivrance}', label: 'Date de delivrance', example: '20 juillet 2026' },
  { key: '{numero_diplome}', label: 'Numero de diplome', example: 'DIP-2026-0042' },
];

// ===== Templates prédéfinis =====
const createDefaultElements = (): DiplomaElement[] => [
  { id: 'el-1', type: 'text', x: 50, y: 30, width: 700, height: 40, content: '{etablissement}', styles: { fontSize: 18, fontWeight: '600', textAlign: 'center', color: '#1a1a2e', fontFamily: 'Georgia' } },
  { id: 'el-2', type: 'line', x: 200, y: 80, width: 400, height: 2, content: '', styles: { backgroundColor: '#d4af37' } },
  { id: 'el-3', type: 'text', x: 50, y: 100, width: 700, height: 60, content: 'DIPLOME', styles: { fontSize: 42, fontWeight: '700', textAlign: 'center', color: '#1a1a2e', fontFamily: 'Georgia', letterSpacing: 8 } },
  { id: 'el-4', type: 'text', x: 50, y: 170, width: 700, height: 30, content: 'Decerne a', styles: { fontSize: 14, textAlign: 'center', color: '#666', fontFamily: 'Georgia', fontStyle: 'italic' } },
  { id: 'el-5', type: 'variable', x: 50, y: 200, width: 700, height: 50, content: '{nom_complet}', styles: { fontSize: 32, fontWeight: '700', textAlign: 'center', color: '#1a1a2e', fontFamily: 'Georgia' } },
  { id: 'el-6', type: 'text', x: 50, y: 260, width: 700, height: 25, content: 'Pour avoir satisfait aux epreuves de la formation', styles: { fontSize: 13, textAlign: 'center', color: '#666', fontFamily: 'Georgia' } },
  { id: 'el-7', type: 'variable', x: 50, y: 290, width: 700, height: 35, content: '{formation}', styles: { fontSize: 22, fontWeight: '600', textAlign: 'center', color: '#1a1a2e', fontFamily: 'Georgia' } },
  { id: 'el-8', type: 'text', x: 100, y: 340, width: 250, height: 22, content: 'Mention : {mention}', styles: { fontSize: 13, textAlign: 'left', color: '#444', fontFamily: 'Georgia' } },
  { id: 'el-9', type: 'text', x: 450, y: 340, width: 250, height: 22, content: 'Moyenne : {moyenne}/20', styles: { fontSize: 13, textAlign: 'right', color: '#444', fontFamily: 'Georgia' } },
  { id: 'el-10', type: 'text', x: 100, y: 365, width: 250, height: 22, content: 'Date du jury : {date_jury}', styles: { fontSize: 13, textAlign: 'left', color: '#444', fontFamily: 'Georgia' } },
  { id: 'el-11', type: 'text', x: 450, y: 365, width: 250, height: 22, content: 'N° : {numero_diplome}', styles: { fontSize: 13, textAlign: 'right', color: '#444', fontFamily: 'Georgia' } },
  { id: 'el-12', type: 'line', x: 200, y: 400, width: 400, height: 2, content: '', styles: { backgroundColor: '#d4af37' } },
  { id: 'el-13', type: 'signature_zone', x: 100, y: 420, width: 200, height: 70, content: 'Le Directeur', styles: { fontSize: 11, textAlign: 'center', color: '#444', fontFamily: 'Georgia' } },
  { id: 'el-14', type: 'signature_zone', x: 500, y: 420, width: 200, height: 70, content: 'Le President du Jury', styles: { fontSize: 11, textAlign: 'center', color: '#444', fontFamily: 'Georgia' } },
  { id: 'el-15', type: 'text', x: 250, y: 490, width: 300, height: 20, content: 'Fait a __________, le {date_delivrance}', styles: { fontSize: 11, textAlign: 'center', color: '#666', fontFamily: 'Georgia', fontStyle: 'italic' } },
];

export const PRESET_TEMPLATES: { name: string; data: DiplomaTemplateData }[] = [
  {
    name: 'Classique',
    data: { elements: createDefaultElements(), backgroundColor: '#fffef7', borderStyle: 'double', borderColor: '#d4af37', borderWidth: 4 },
  },
  {
    name: 'Moderne',
    data: {
      elements: createDefaultElements().map(el => ({
        ...el,
        styles: { ...el.styles, fontFamily: 'Helvetica', color: el.styles.color === '#1a1a2e' ? '#0f172a' : el.styles.color, backgroundColor: el.styles.backgroundColor === '#d4af37' ? '#3b82f6' : el.styles.backgroundColor },
      })),
      backgroundColor: '#ffffff', borderStyle: 'simple', borderColor: '#3b82f6', borderWidth: 3,
    },
  },
  {
    name: 'Elegant',
    data: {
      elements: createDefaultElements().map(el => ({
        ...el,
        styles: { ...el.styles, fontFamily: 'Palatino', color: el.styles.color === '#1a1a2e' ? '#2d1b69' : el.styles.color, backgroundColor: el.styles.backgroundColor === '#d4af37' ? '#9333ea' : el.styles.backgroundColor },
      })),
      backgroundColor: '#faf5ff', borderStyle: 'ornate', borderColor: '#9333ea', borderWidth: 3,
    },
  },
  {
    name: 'Minimaliste',
    data: {
      elements: createDefaultElements().filter(el => el.type !== 'line').map(el => ({
        ...el,
        styles: { ...el.styles, fontFamily: 'Helvetica' },
      })),
      backgroundColor: '#ffffff', borderStyle: 'none', borderColor: '#e5e7eb', borderWidth: 0,
    },
  },
];

// ===== Service =====
export const diplomaService = {
  // Templates
  async getTemplates(establishmentId: string): Promise<DiplomaTemplate[]> {
    const { data, error } = await supabase
      .from('diploma_templates')
      .select('*')
      .eq('establishment_id', establishmentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as DiplomaTemplate[];
  },

  async getTemplate(id: string): Promise<DiplomaTemplate | null> {
    const { data, error } = await supabase
      .from('diploma_templates')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as unknown as DiplomaTemplate;
  },

  async upsertTemplate(template: Partial<DiplomaTemplate> & { establishment_id: string }): Promise<DiplomaTemplate> {
    const payload = {
      ...template,
      template_data: template.template_data as any,
      updated_at: new Date().toISOString(),
    };
    if (template.id) {
      const { data, error } = await supabase
        .from('diploma_templates')
        .update(payload as any)
        .eq('id', template.id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as DiplomaTemplate;
    }
    const { data, error } = await supabase
      .from('diploma_templates')
      .insert(payload as any)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as DiplomaTemplate;
  },

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase.from('diploma_templates').delete().eq('id', id);
    if (error) throw error;
  },

  // Generated diplomas
  async getGeneratedDiplomas(formationId: string): Promise<GeneratedDiploma[]> {
    const { data, error } = await supabase
      .from('generated_diplomas')
      .select('*')
      .eq('formation_id', formationId)
      .order('generated_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as GeneratedDiploma[];
  },

  async upsertGeneratedDiploma(diploma: Partial<GeneratedDiploma>): Promise<GeneratedDiploma> {
    const { data, error } = await supabase
      .from('generated_diplomas')
      .upsert(diploma as any, { onConflict: 'student_id,formation_id' })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as GeneratedDiploma;
  },

  // Resolve variables for a specific student
  resolveVariables(
    text: string,
    student: { first_name: string; last_name: string },
    formation: { title: string; level?: string; academic_year?: string },
    establishment: { name: string },
    transcript?: { general_average?: number | null; decision?: string; mention?: string; jury_date?: string },
    diplomaNumber?: string
  ): string {
    const mentionLabels: Record<string, string> = { tres_bien: 'Tres bien', bien: 'Bien', assez_bien: 'Assez bien', passable: 'Passable' };
    const juryDate = transcript?.jury_date
      ? new Date(transcript.jury_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : '_______________';
    const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    return text
      .replace(/\{nom_etudiant\}/g, student.last_name)
      .replace(/\{prenom_etudiant\}/g, student.first_name)
      .replace(/\{nom_complet\}/g, `${student.first_name} ${student.last_name}`)
      .replace(/\{formation\}/g, formation.title)
      .replace(/\{niveau\}/g, formation.level || '')
      .replace(/\{mention\}/g, mentionLabels[transcript?.mention || ''] || transcript?.mention || '—')
      .replace(/\{moyenne\}/g, transcript?.general_average?.toFixed(2) || '—')
      .replace(/\{date_jury\}/g, juryDate)
      .replace(/\{annee_academique\}/g, formation.academic_year || '')
      .replace(/\{etablissement\}/g, establishment.name)
      .replace(/\{date_delivrance\}/g, today)
      .replace(/\{numero_diplome\}/g, diplomaNumber || 'DIP-XXXX');
  },
};
