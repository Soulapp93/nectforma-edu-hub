import { supabase } from '@/integrations/supabase/client';

// ===== Types =====
export interface DiplomaElement {
  id: string;
  type: 'text' | 'variable' | 'image' | 'line' | 'rectangle' | 'signature_zone' | 'qr_code' | 'stamp' | 'signature_image';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  face?: 'recto' | 'verso';
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

export type DiplomaFormat = 'A4L' | 'A4P' | 'A3L' | 'custom';

export interface DiplomaTemplateData {
  elements: DiplomaElement[];
  backgroundColor: string;
  backgroundImage?: string;
  borderStyle?: 'none' | 'simple' | 'double' | 'ornate';
  borderColor?: string;
  borderWidth?: number;
  // --- New (2026-04-21) ---
  format?: DiplomaFormat;
  customWidth?: number;
  customHeight?: number;
  hasVerso?: boolean;
  backgroundColorVerso?: string;
  watermark?: {
    enabled: boolean;
    text: string;
    opacity: number;
    size: number;
    color: string;
    angle: number;
  };
}

// Page dimensions in px (at ~96dpi for display; scale-preserving for A4/A3 ratios)
export const FORMAT_DIMENSIONS: Record<DiplomaFormat, { w: number; h: number; label: string }> = {
  A4L:    { w: 842, h: 595, label: 'A4 Paysage (297×210mm)' },
  A4P:    { w: 595, h: 842, label: 'A4 Portrait (210×297mm)' },
  A3L:    { w: 1191, h: 842, label: 'A3 Paysage (420×297mm)' },
  custom: { w: 800, h: 600, label: 'Dimensions personnalisees' },
};

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
  diploma_number?: string | null;
  verification_code?: string | null;
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
  { key: '{code_verification}', label: 'Code de verification', example: 'DIP-2026-a1b2c3d4e5' },
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
    data: { elements: createDefaultElements(), backgroundColor: '#fffef7', borderStyle: 'double', borderColor: '#d4af37', borderWidth: 4, format: 'A4L', hasVerso: false },
  },
  {
    name: 'Moderne',
    data: {
      elements: createDefaultElements().map(el => ({
        ...el,
        styles: { ...el.styles, fontFamily: 'Helvetica', color: el.styles.color === '#1a1a2e' ? '#0f172a' : el.styles.color, backgroundColor: el.styles.backgroundColor === '#d4af37' ? '#3b82f6' : el.styles.backgroundColor },
      })),
      backgroundColor: '#ffffff', borderStyle: 'simple', borderColor: '#3b82f6', borderWidth: 3, format: 'A4L', hasVerso: false,
    },
  },
  {
    name: 'Elegant dore',
    data: {
      elements: createDefaultElements().map(el => ({
        ...el,
        styles: { ...el.styles, fontFamily: 'Palatino', color: el.styles.color === '#1a1a2e' ? '#78350f' : el.styles.color, backgroundColor: el.styles.backgroundColor === '#d4af37' ? '#b45309' : el.styles.backgroundColor },
      })),
      backgroundColor: '#fefce8', borderStyle: 'ornate', borderColor: '#b45309', borderWidth: 4, format: 'A4L', hasVerso: false,
      watermark: { enabled: true, text: 'DIPLOME OFFICIEL', opacity: 0.04, size: 60, color: '#b45309', angle: -30 },
    },
  },
  {
    name: 'Prestige violet',
    data: {
      elements: createDefaultElements().map(el => ({
        ...el,
        styles: { ...el.styles, fontFamily: 'Georgia', color: el.styles.color === '#1a1a2e' ? '#2d1b69' : el.styles.color, backgroundColor: el.styles.backgroundColor === '#d4af37' ? '#9333ea' : el.styles.backgroundColor },
      })),
      backgroundColor: '#faf5ff', borderStyle: 'ornate', borderColor: '#9333ea', borderWidth: 3, format: 'A4L', hasVerso: false,
    },
  },
  {
    name: 'Minimaliste',
    data: {
      elements: createDefaultElements().filter(el => el.type !== 'line').map(el => ({
        ...el,
        styles: { ...el.styles, fontFamily: 'Helvetica' },
      })),
      backgroundColor: '#ffffff', borderStyle: 'none', borderColor: '#e5e7eb', borderWidth: 0, format: 'A4L', hasVerso: false,
    },
  },
  {
    name: 'Corporate bleu',
    data: {
      elements: createDefaultElements().map(el => ({
        ...el,
        styles: { ...el.styles, fontFamily: 'Arial', color: el.styles.color === '#1a1a2e' ? '#0c4a6e' : el.styles.color, backgroundColor: el.styles.backgroundColor === '#d4af37' ? '#0369a1' : el.styles.backgroundColor },
      })),
      backgroundColor: '#f0f9ff', borderStyle: 'simple', borderColor: '#0369a1', borderWidth: 5, format: 'A4L', hasVerso: false,
    },
  },
  {
    name: 'Portrait academique',
    data: {
      elements: createDefaultElements(),
      backgroundColor: '#fffef7', borderStyle: 'double', borderColor: '#991b1b', borderWidth: 4, format: 'A4P', hasVerso: false,
    },
  },
  {
    name: 'A3 Ceremonie',
    data: {
      elements: createDefaultElements(),
      backgroundColor: '#fffbeb', borderStyle: 'ornate', borderColor: '#d4af37', borderWidth: 6, format: 'A3L', hasVerso: false,
    },
  },
  {
    name: 'Biface officiel',
    data: {
      elements: createDefaultElements(),
      backgroundColor: '#fffef7', borderStyle: 'double', borderColor: '#1f2937', borderWidth: 4, format: 'A4L',
      hasVerso: true, backgroundColorVerso: '#f9fafb',
      watermark: { enabled: true, text: 'AUTHENTIQUE', opacity: 0.05, size: 72, color: '#1f2937', angle: -25 },
    },
  },
  {
    name: 'Vert nature',
    data: {
      elements: createDefaultElements().map(el => ({
        ...el,
        styles: { ...el.styles, color: el.styles.color === '#1a1a2e' ? '#064e3b' : el.styles.color, backgroundColor: el.styles.backgroundColor === '#d4af37' ? '#059669' : el.styles.backgroundColor },
      })),
      backgroundColor: '#ecfdf5', borderStyle: 'simple', borderColor: '#059669', borderWidth: 4, format: 'A4L', hasVerso: false,
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
    diplomaNumber?: string,
    verificationCode?: string
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
      .replace(/\{numero_diplome\}/g, diplomaNumber || 'DIP-XXXX')
      .replace(/\{code_verification\}/g, verificationCode || '_____________');
  },

  // Generate a unique verification code for a new diploma (client-side; DB also enforces uniqueness)
  generateVerificationCode(): string {
    const year = new Date().getFullYear();
    const rand = Math.random().toString(36).slice(2, 12);
    return `DIP-${year}-${rand}`;
  },

  // Public RPC: verify a diploma by its code (used by the public /verify-diploma/:code route)
  async verifyByCode(code: string) {
    const { data, error } = await (supabase as any).rpc('verify_diploma_by_code', { p_code: code });
    if (error) throw error;
    return (data && data[0]) || null;
  },
};
