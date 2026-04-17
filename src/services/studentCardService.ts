import { supabase } from '@/integrations/supabase/client';

// ===== Types =====
export interface CardElement {
  id: string;
  type: 'text' | 'variable' | 'image' | 'line' | 'rectangle' | 'qrcode' | 'barcode';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  face: 'recto' | 'verso';
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
    letterSpacing?: number;
    textTransform?: string;
  };
}

export interface CardTemplateData {
  elements: CardElement[];
  recto: { backgroundColor: string; backgroundImage?: string };
  verso: { backgroundColor: string; backgroundImage?: string };
}

export interface StudentCardTemplate {
  id: string;
  establishment_id: string;
  name: string;
  template_data: CardTemplateData;
  card_orientation: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentCard {
  id: string;
  student_id: string;
  formation_id: string;
  establishment_id: string;
  template_id: string | null;
  student_number: string;
  verification_code: string;
  valid_from: string;
  valid_until: string;
  status: 'active' | 'expired' | 'revoked';
  photo_url: string | null;
  created_at: string;
}

// ===== Variables dynamiques =====
export const CARD_VARIABLES = [
  { key: '{nom}', label: 'Nom', example: 'Dupont' },
  { key: '{prenom}', label: 'Prenom', example: 'Jean' },
  { key: '{nom_complet}', label: 'Nom complet', example: 'Jean Dupont' },
  { key: '{formation}', label: 'Formation', example: 'BTS Commerce' },
  { key: '{niveau}', label: 'Niveau', example: 'BAC+2' },
  { key: '{annee}', label: 'Annee academique', example: '2025-2026' },
  { key: '{numero_etudiant}', label: 'N etudiant', example: 'ETU-2026-0042' },
  { key: '{etablissement}', label: 'Etablissement', example: 'Nectforma Demo' },
  { key: '{date_naissance}', label: 'Date de naissance', example: '15/03/2002' },
  { key: '{validite_debut}', label: 'Debut validite', example: '01/09/2025' },
  { key: '{validite_fin}', label: 'Fin validite', example: '31/08/2026' },
  { key: '{statut}', label: 'Statut', example: 'Etudiant' },
  { key: '{qrcode}', label: 'QR Code verif.', example: '[QR]' },
];

// ===== Default card template (carte etudiant des metiers style) =====
const createDefaultElements = (): CardElement[] => [
  // ===== RECTO =====
  // Top band
  { id: 'r-1', type: 'rectangle', face: 'recto', x: 0, y: 0, width: 500, height: 50, content: '', styles: { backgroundColor: '#1a1a2e', borderWidth: 0, borderRadius: 0 } },
  { id: 'r-2', type: 'text', face: 'recto', x: 20, y: 12, width: 300, height: 28, content: '{etablissement}', styles: { fontSize: 14, fontWeight: '700', color: '#f59e0b', fontFamily: 'Helvetica', textTransform: 'uppercase', letterSpacing: 1 } },
  // CARTE ETUDIANT title
  { id: 'r-3', type: 'text', face: 'recto', x: 20, y: 60, width: 300, height: 24, content: 'CARTE ETUDIANT', styles: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', fontFamily: 'Helvetica', letterSpacing: 3, textTransform: 'uppercase' } },
  // Photo zone
  { id: 'r-4', type: 'image', face: 'recto', x: 20, y: 95, width: 100, height: 120, content: '{photo}', styles: { borderRadius: 6, borderColor: '#e2e8f0', borderWidth: 2 } },
  // Student info
  { id: 'r-5', type: 'variable', face: 'recto', x: 135, y: 95, width: 340, height: 22, content: '{nom_complet}', styles: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', fontFamily: 'Helvetica' } },
  { id: 'r-6', type: 'text', face: 'recto', x: 135, y: 120, width: 340, height: 16, content: 'Formation : {formation}', styles: { fontSize: 11, color: '#475569', fontFamily: 'Helvetica' } },
  { id: 'r-7', type: 'text', face: 'recto', x: 135, y: 139, width: 340, height: 16, content: 'Niveau : {niveau}', styles: { fontSize: 11, color: '#475569', fontFamily: 'Helvetica' } },
  { id: 'r-8', type: 'text', face: 'recto', x: 135, y: 158, width: 340, height: 16, content: 'N : {numero_etudiant}', styles: { fontSize: 11, fontWeight: '600', color: '#1a1a2e', fontFamily: 'Helvetica' } },
  { id: 'r-9', type: 'text', face: 'recto', x: 135, y: 177, width: 340, height: 16, content: 'Annee : {annee}', styles: { fontSize: 11, color: '#475569', fontFamily: 'Helvetica' } },
  { id: 'r-10', type: 'text', face: 'recto', x: 135, y: 196, width: 340, height: 14, content: 'Ne(e) le : {date_naissance}', styles: { fontSize: 10, color: '#64748b', fontFamily: 'Helvetica' } },
  // Validity band
  { id: 'r-11', type: 'rectangle', face: 'recto', x: 0, y: 225, width: 500, height: 30, content: '', styles: { backgroundColor: '#f1f5f9', borderWidth: 0, borderRadius: 0 } },
  { id: 'r-12', type: 'text', face: 'recto', x: 20, y: 231, width: 460, height: 18, content: 'Valide du {validite_debut} au {validite_fin}', styles: { fontSize: 10, color: '#64748b', fontFamily: 'Helvetica', textAlign: 'center' } },

  // ===== VERSO =====
  { id: 'v-1', type: 'rectangle', face: 'verso', x: 0, y: 0, width: 500, height: 50, content: '', styles: { backgroundColor: '#1a1a2e', borderWidth: 0, borderRadius: 0 } },
  { id: 'v-2', type: 'text', face: 'verso', x: 20, y: 15, width: 460, height: 22, content: 'CARTE D\'ETUDIANT DES METIERS', styles: { fontSize: 12, fontWeight: '700', color: '#f59e0b', fontFamily: 'Helvetica', textAlign: 'center', letterSpacing: 2 } },
  // QR Code
  { id: 'v-3', type: 'qrcode', face: 'verso', x: 175, y: 60, width: 110, height: 110, content: '{qrcode}', styles: {} },
  { id: 'v-4', type: 'text', face: 'verso', x: 50, y: 175, width: 400, height: 16, content: 'Scannez le QR code pour verifier cette carte', styles: { fontSize: 10, color: '#64748b', fontFamily: 'Helvetica', textAlign: 'center', fontStyle: 'italic' } },
  // Legal mentions
  { id: 'v-5', type: 'text', face: 'verso', x: 20, y: 200, width: 460, height: 50, content: 'Cette carte est strictement personnelle et incessible. Elle atteste de la qualite d\'etudiant du titulaire et doit etre presentee sur demande. En cas de perte, prevenir immediatement l\'etablissement.', styles: { fontSize: 8, color: '#94a3b8', fontFamily: 'Helvetica', textAlign: 'center' } },
];

export const CARD_PRESETS: { name: string; data: CardTemplateData }[] = [
  {
    name: 'Classique',
    data: { elements: createDefaultElements(), recto: { backgroundColor: '#ffffff' }, verso: { backgroundColor: '#ffffff' } },
  },
  {
    name: 'Moderne Sombre',
    data: {
      elements: createDefaultElements().map(el => {
        if (el.face === 'recto' && el.id === 'r-1') return { ...el, styles: { ...el.styles, backgroundColor: '#0f172a' } };
        if (el.face === 'verso' && el.id === 'v-1') return { ...el, styles: { ...el.styles, backgroundColor: '#0f172a' } };
        return el;
      }),
      recto: { backgroundColor: '#f8fafc' }, verso: { backgroundColor: '#f8fafc' },
    },
  },
  {
    name: 'Universitaire',
    data: {
      elements: createDefaultElements().map(el => {
        if (el.styles.backgroundColor === '#1a1a2e') return { ...el, styles: { ...el.styles, backgroundColor: '#1e3a5f' } };
        if (el.styles.color === '#f59e0b') return { ...el, styles: { ...el.styles, color: '#ffffff' } };
        if (el.styles.color === '#1a1a2e') return { ...el, styles: { ...el.styles, color: '#1e3a5f' } };
        return el;
      }),
      recto: { backgroundColor: '#ffffff' }, verso: { backgroundColor: '#f0f9ff' },
    },
  },
];

// ===== Service =====
export const studentCardService = {
  async getTemplates(establishmentId: string): Promise<StudentCardTemplate[]> {
    const { data, error } = await supabase.from('student_card_templates').select('*').eq('establishment_id', establishmentId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as StudentCardTemplate[];
  },

  async upsertTemplate(template: Partial<StudentCardTemplate> & { establishment_id: string }): Promise<StudentCardTemplate> {
    const payload = { ...template, template_data: template.template_data as any, updated_at: new Date().toISOString() };
    if (template.id) {
      const { data, error } = await supabase.from('student_card_templates').update(payload as any).eq('id', template.id).select().single();
      if (error) throw error;
      return data as unknown as StudentCardTemplate;
    }
    const { data, error } = await supabase.from('student_card_templates').insert(payload as any).select().single();
    if (error) throw error;
    return data as unknown as StudentCardTemplate;
  },

  async getCards(formationId: string): Promise<StudentCard[]> {
    const { data, error } = await supabase.from('student_cards').select('*').eq('formation_id', formationId).order('student_number');
    if (error) throw error;
    return (data || []) as unknown as StudentCard[];
  },

  async generateCard(params: { studentId: string; formationId: string; establishmentId: string; templateId: string; studentNumber: string; photoUrl?: string; validFrom?: string; validUntil?: string }): Promise<StudentCard> {
    const { data, error } = await supabase.from('student_cards').upsert({
      student_id: params.studentId,
      formation_id: params.formationId,
      establishment_id: params.establishmentId,
      template_id: params.templateId,
      student_number: params.studentNumber,
      photo_url: params.photoUrl || null,
      valid_from: params.validFrom || new Date().toISOString().split('T')[0],
      valid_until: params.validUntil || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      status: 'active',
    } as any, { onConflict: 'student_id,formation_id' }).select().single();
    if (error) throw error;
    return data as unknown as StudentCard;
  },

  async getCardByVerificationCode(code: string): Promise<any> {
    const { data, error } = await supabase
      .from('student_cards')
      .select('*, formations(title, level), establishments(name, logo_url)')
      .eq('verification_code', code)
      .single();
    if (error) return null;
    return data;
  },

  generateStudentNumber(establishmentPrefix: string, year: number, index: number): string {
    return `${establishmentPrefix}-${year}-${String(index).padStart(4, '0')}`;
  },

  resolveVariables(
    text: string,
    student: { first_name: string; last_name: string; email?: string; date_of_birth?: string },
    formation: { title: string; level?: string; academic_year?: string },
    establishment: { name: string },
    card: { student_number: string; valid_from: string; valid_until: string; verification_code: string },
    verifyBaseUrl: string
  ): string {
    const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '';
    return text
      .replace(/\{nom\}/g, student.last_name)
      .replace(/\{prenom\}/g, student.first_name)
      .replace(/\{nom_complet\}/g, `${student.first_name} ${student.last_name}`)
      .replace(/\{formation\}/g, formation.title)
      .replace(/\{niveau\}/g, formation.level || '')
      .replace(/\{annee\}/g, formation.academic_year || '')
      .replace(/\{numero_etudiant\}/g, card.student_number)
      .replace(/\{etablissement\}/g, establishment.name)
      .replace(/\{date_naissance\}/g, fmtDate(student.date_of_birth))
      .replace(/\{validite_debut\}/g, fmtDate(card.valid_from))
      .replace(/\{validite_fin\}/g, fmtDate(card.valid_until))
      .replace(/\{statut\}/g, 'Etudiant')
      .replace(/\{qrcode\}/g, `${verifyBaseUrl}/verify-card/${card.verification_code}`);
  },

  // Generate Google Wallet "Add to Wallet" URL (client-side JWT-less approach)
  generateGoogleWalletUrl(card: StudentCard, student: any, formation: any, establishment: any): string {
    const passObj = {
      iss: 'nectforma',
      aud: 'google',
      typ: 'savetowallet',
      payload: {
        genericObjects: [{
          id: `nectforma.${card.id}`,
          classId: 'nectforma.student_card',
          hexBackgroundColor: '#1a1a2e',
          logo: { sourceUri: { uri: establishment.logo_url || 'https://via.placeholder.com/100' } },
          cardTitle: { defaultValue: { language: 'fr', value: establishment.name || 'Carte Etudiant' } },
          subheader: { defaultValue: { language: 'fr', value: formation.title || '' } },
          header: { defaultValue: { language: 'fr', value: `${student.first_name} ${student.last_name}` } },
          barcode: { type: 'QR_CODE', value: `${window.location.origin}/verify-card/${card.verification_code}` },
          textModulesData: [
            { header: 'N ETUDIANT', body: card.student_number, id: 'num' },
            { header: 'VALIDITE', body: `${new Date(card.valid_from).toLocaleDateString('fr-FR')} - ${new Date(card.valid_until).toLocaleDateString('fr-FR')}`, id: 'validity' },
          ],
        }],
      },
    };
    // For a real implementation, this JWT must be signed server-side with a Google service account key.
    // For MVP, we generate a save link that opens the wallet with basic data
    return `https://pay.google.com/gp/v/save/${btoa(JSON.stringify(passObj))}`;
  },

  // Apple Wallet requires a .pkpass file generated server-side
  // For MVP, returns a placeholder that would need a backend endpoint
  getAppleWalletUrl(cardId: string): string {
    return `${window.location.origin}/api/wallet/apple/${cardId}`;
  },
};
