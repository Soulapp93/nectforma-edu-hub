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

// ===== French flag SVG as data URI =====
export const FRENCH_FLAG_SVG = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 60"><rect width="30" height="60" fill="#002395"/><rect x="30" width="30" height="60" fill="#fff"/><rect x="60" width="30" height="60" fill="#ED2939"/></svg>')}`;

// Helper to build elements for a portrait card (320x500)
const W = 320;
const H = 500;

type EF = (id: string) => CardElement;

// Builder helpers
const rect = (id: string, face: 'recto'|'verso', x: number, y: number, w: number, h: number, bg: string, r = 0): CardElement =>
  ({ id, type: 'rectangle', face, x, y, width: w, height: h, content: '', styles: { backgroundColor: bg, borderWidth: 0, borderRadius: r } });
const txt = (id: string, face: 'recto'|'verso', x: number, y: number, w: number, h: number, content: string, s: CardElement['styles']): CardElement =>
  ({ id, type: 'text', face, x, y, width: w, height: h, content, styles: { fontFamily: 'Helvetica', ...s } });
const vari = (id: string, face: 'recto'|'verso', x: number, y: number, w: number, h: number, content: string, s: CardElement['styles']): CardElement =>
  ({ id, type: 'variable', face, x, y, width: w, height: h, content, styles: { fontFamily: 'Helvetica', ...s } });
const img = (id: string, face: 'recto'|'verso', x: number, y: number, w: number, h: number, content: string, s: CardElement['styles'] = {}): CardElement =>
  ({ id, type: 'image', face, x, y, width: w, height: h, content, styles: s });
const qr = (id: string, face: 'recto'|'verso', x: number, y: number, sz: number): CardElement =>
  ({ id, type: 'qrcode', face, x, y, width: sz, height: sz, content: '{qrcode}', styles: {} });

// Shared verso elements generator
const versoBase = (prefix: string, headerBg: string, headerColor: string, bodyBg: string, textColor: string, accentColor: string): CardElement[] => [
  rect(`${prefix}v1`, 'verso', 0, 0, W, 60, headerBg),
  txt(`${prefix}v2`, 'verso', 15, 18, W-30, 24, 'CARTE D\'ETUDIANT', { fontSize: 14, fontWeight: '700', color: headerColor, textAlign: 'center', letterSpacing: 2, textTransform: 'uppercase' }),
  // Advantages section
  txt(`${prefix}v3`, 'verso', 15, 75, W-30, 18, 'AVANTAGES', { fontSize: 11, fontWeight: '700', color: accentColor, letterSpacing: 1 }),
  txt(`${prefix}v4`, 'verso', 20, 98, 130, 14, 'Transports', { fontSize: 9, color: textColor }),
  txt(`${prefix}v5`, 'verso', 170, 98, 130, 14, 'Culture', { fontSize: 9, color: textColor }),
  txt(`${prefix}v6`, 'verso', 20, 116, 130, 14, 'Sport', { fontSize: 9, color: textColor }),
  txt(`${prefix}v7`, 'verso', 170, 116, 130, 14, 'Reductions', { fontSize: 9, color: textColor }),
  txt(`${prefix}v8`, 'verso', 20, 134, 130, 14, 'Et bien plus', { fontSize: 9, color: textColor, fontStyle: 'italic' }),
  // Establishment info
  rect(`${prefix}v9`, 'verso', 0, 160, W, 1, accentColor),
  txt(`${prefix}v10`, 'verso', 15, 170, W-30, 16, 'ETABLISSEMENT DE FORMATION', { fontSize: 9, fontWeight: '700', color: accentColor }),
  vari(`${prefix}v11`, 'verso', 15, 190, W-30, 16, '{etablissement}', { fontSize: 11, fontWeight: '600', color: textColor }),
  // QR & verification
  qr(`${prefix}v12`, 'verso', 15, 220, 100),
  txt(`${prefix}v13`, 'verso', 125, 225, W-145, 14, 'N de carte', { fontSize: 8, color: accentColor, fontWeight: '600' }),
  vari(`${prefix}v14`, 'verso', 125, 242, W-145, 16, '{numero_etudiant}', { fontSize: 12, fontWeight: '700', color: textColor }),
  txt(`${prefix}v15`, 'verso', 125, 262, W-145, 40, 'Scannez ce QR code pour verifier l\'authenticite de la carte.', { fontSize: 8, color: '#94a3b8' }),
  // Legal mention
  rect(`${prefix}v16`, 'verso', 0, 320, W, 1, accentColor),
  txt(`${prefix}v17`, 'verso', 15, 330, W-30, 60, 'Cette carte est strictement personnelle et incessible. Elle est valable pour l\'annee scolaire en cours. En cas de perte ou de vol, cette carte doit etre immediatement declaree a l\'etablissement. Carte non cessible. Toute utilisation frauduleuse est passible de poursuites.', { fontSize: 7, color: '#94a3b8', textAlign: 'center' }),
];

// ===== 10 PRESETS =====
export const CARD_PRESETS: { name: string; data: CardTemplateData }[] = [
  // 1. CLASSIQUE - Blue/white, professional
  {
    name: '1. Classique',
    data: {
      recto: { backgroundColor: '#ffffff' }, verso: { backgroundColor: '#ffffff' },
      elements: [
        rect('c1r1', 'recto', 0, 0, W, 65, '#1e3a5f'),
        img('c1r2', 'recto', 12, 10, 28, 28, FRENCH_FLAG_SVG, { borderRadius: 2 }),
        txt('c1r3', 'recto', 48, 10, 260, 18, '{etablissement}', { fontSize: 13, fontWeight: '700', color: '#ffffff', textTransform: 'uppercase' }),
        txt('c1r4', 'recto', 48, 32, 260, 16, 'Organisme de formation', { fontSize: 9, color: '#93c5fd' }),
        txt('c1r5', 'recto', 15, 78, 200, 22, 'CARTE ETUDIANT', { fontSize: 16, fontWeight: '700', color: '#1e3a5f', letterSpacing: 2 }),
        txt('c1r6', 'recto', 15, 100, 200, 16, '{annee}', { fontSize: 12, color: '#1e3a5f', fontWeight: '600' }),
        img('c1r7', 'recto', 15, 125, 120, 150, '{photo}', { borderRadius: 8, borderColor: '#cbd5e1', borderWidth: 2 }),
        txt('c1r8', 'recto', 148, 128, 160, 12, 'Nom', { fontSize: 8, color: '#94a3b8' }),
        vari('c1r9', 'recto', 148, 141, 160, 18, '{nom}', { fontSize: 14, fontWeight: '700', color: '#1e3a5f' }),
        txt('c1r10', 'recto', 148, 164, 160, 12, 'Prenom', { fontSize: 8, color: '#94a3b8' }),
        vari('c1r11', 'recto', 148, 177, 160, 16, '{prenom}', { fontSize: 13, fontWeight: '600', color: '#334155' }),
        txt('c1r12', 'recto', 148, 200, 160, 12, 'Date de naissance', { fontSize: 8, color: '#94a3b8' }),
        txt('c1r13', 'recto', 148, 213, 160, 14, '{date_naissance}', { fontSize: 11, fontWeight: '600', color: '#334155' }),
        txt('c1r14', 'recto', 148, 236, 160, 12, 'Formation', { fontSize: 8, color: '#94a3b8' }),
        txt('c1r15', 'recto', 148, 249, 160, 14, '{formation}', { fontSize: 10, fontWeight: '600', color: '#334155' }),
        rect('c1r16', 'recto', 0, 290, W, 60, '#1e3a5f'),
        txt('c1r17', 'recto', 15, 296, 150, 12, 'N etudiant', { fontSize: 8, color: '#93c5fd' }),
        txt('c1r18', 'recto', 15, 310, 150, 16, '{numero_etudiant}', { fontSize: 11, fontWeight: '700', color: '#ffffff' }),
        txt('c1r19', 'recto', 170, 296, 140, 12, 'Validite', { fontSize: 8, color: '#93c5fd', textAlign: 'right' }),
        txt('c1r20', 'recto', 170, 310, 140, 16, '{validite_debut} - {validite_fin}', { fontSize: 9, fontWeight: '600', color: '#ffffff', textAlign: 'right' }),
        txt('c1r21', 'recto', 10, 332, W-20, 14, 'Cette carte justifie du statut d\'etudiant.', { fontSize: 7, color: '#93c5fd', textAlign: 'center' }),
        ...versoBase('c1', '#1e3a5f', '#ffffff', '#ffffff', '#334155', '#1e3a5f'),
      ],
    },
  },
  // 2. MODERNE - Teal gradient, fresh
  {
    name: '2. Moderne',
    data: {
      recto: { backgroundColor: '#ffffff' }, verso: { backgroundColor: '#f0fdfa' },
      elements: [
        rect('c2r1', 'recto', 0, 0, W, 65, '#0d9488'),
        txt('c2r3', 'recto', 15, 10, 290, 18, '{etablissement}', { fontSize: 13, fontWeight: '700', color: '#ffffff', textTransform: 'uppercase' }),
        txt('c2r4', 'recto', 15, 32, 290, 16, 'CARTE ETUDIANT {annee}', { fontSize: 11, color: '#ccfbf1', fontWeight: '600' }),
        img('c2r7', 'recto', 15, 78, 120, 150, '{photo}', { borderRadius: 8, borderColor: '#99f6e4', borderWidth: 3 }),
        txt('c2r8', 'recto', 148, 80, 160, 12, 'Nom', { fontSize: 8, color: '#94a3b8' }),
        vari('c2r9', 'recto', 148, 93, 160, 18, '{nom}', { fontSize: 14, fontWeight: '700', color: '#134e4a' }),
        txt('c2r10', 'recto', 148, 116, 160, 12, 'Prenom', { fontSize: 8, color: '#94a3b8' }),
        vari('c2r11', 'recto', 148, 129, 160, 16, '{prenom}', { fontSize: 13, fontWeight: '600', color: '#334155' }),
        txt('c2r12', 'recto', 148, 155, 160, 14, '{formation}', { fontSize: 10, fontWeight: '600', color: '#0d9488' }),
        txt('c2r13', 'recto', 148, 175, 160, 14, '{niveau}', { fontSize: 10, color: '#475569' }),
        txt('c2r14', 'recto', 148, 195, 160, 14, 'Statut : Etudiant', { fontSize: 9, color: '#64748b' }),
        txt('c2r15', 'recto', 148, 215, 160, 12, '{date_naissance}', { fontSize: 9, color: '#64748b' }),
        rect('c2r16', 'recto', 0, 245, W, 50, '#f0fdfa'),
        txt('c2r17', 'recto', 15, 250, 150, 12, '{numero_etudiant}', { fontSize: 10, fontWeight: '700', color: '#0d9488' }),
        txt('c2r18', 'recto', 15, 268, 295, 14, 'Valide du {validite_debut} au {validite_fin}', { fontSize: 9, color: '#64748b' }),
        ...versoBase('c2', '#0d9488', '#ffffff', '#f0fdfa', '#334155', '#0d9488'),
      ],
    },
  },
  // 3. PREMIUM - Black/gold
  {
    name: '3. Premium',
    data: {
      recto: { backgroundColor: '#fafaf9' }, verso: { backgroundColor: '#1c1917' },
      elements: [
        rect('c3r1', 'recto', 0, 0, W, 65, '#1c1917'),
        txt('c3r2', 'recto', 15, 10, 290, 18, '{etablissement}', { fontSize: 13, fontWeight: '700', color: '#d4af37', textTransform: 'uppercase', letterSpacing: 1 }),
        txt('c3r3', 'recto', 15, 32, 290, 18, 'CARTE ETUDIANT {annee}', { fontSize: 11, fontWeight: '600', color: '#a8a29e' }),
        img('c3r7', 'recto', 15, 78, 120, 150, '{photo}', { borderRadius: 8, borderColor: '#d4af37', borderWidth: 2 }),
        vari('c3r9', 'recto', 148, 85, 160, 18, '{nom_complet}', { fontSize: 15, fontWeight: '700', color: '#1c1917' }),
        txt('c3r12', 'recto', 148, 110, 160, 14, '{formation}', { fontSize: 10, fontWeight: '600', color: '#78716c' }),
        txt('c3r13', 'recto', 148, 130, 160, 14, '{niveau}', { fontSize: 10, color: '#78716c' }),
        txt('c3r14', 'recto', 148, 155, 160, 14, 'Ne(e) le {date_naissance}', { fontSize: 9, color: '#a8a29e' }),
        txt('c3r15', 'recto', 148, 180, 160, 16, '{numero_etudiant}', { fontSize: 11, fontWeight: '700', color: '#d4af37' }),
        rect('c3r16', 'recto', 0, 245, W, 55, '#1c1917'),
        txt('c3r17', 'recto', 15, 255, 290, 16, 'Valide {validite_debut} — {validite_fin}', { fontSize: 9, fontWeight: '600', color: '#d4af37', textAlign: 'center' }),
        txt('c3r18', 'recto', 15, 275, 290, 12, 'Cette carte justifie du statut d\'etudiant.', { fontSize: 7, color: '#a8a29e', textAlign: 'center' }),
        ...versoBase('c3', '#1c1917', '#d4af37', '#1c1917', '#d6d3d1', '#d4af37'),
      ],
    },
  },
  // 4. ECOLOGIQUE - Green/nature
  {
    name: '4. Ecologique',
    data: {
      recto: { backgroundColor: '#f0fdf4' }, verso: { backgroundColor: '#f0fdf4' },
      elements: [
        rect('c4r1', 'recto', 0, 0, W, 65, '#166534'),
        txt('c4r2', 'recto', 15, 10, 290, 18, '{etablissement}', { fontSize: 13, fontWeight: '700', color: '#ffffff', textTransform: 'uppercase' }),
        txt('c4r3', 'recto', 15, 32, 290, 18, 'ECO-RESPONSABLE', { fontSize: 9, color: '#86efac', letterSpacing: 2 }),
        txt('c4r5', 'recto', 15, 78, 200, 22, 'CARTE ETUDIANT', { fontSize: 15, fontWeight: '700', color: '#166534', letterSpacing: 2 }),
        txt('c4r6', 'recto', 15, 100, 200, 16, '{annee}', { fontSize: 11, color: '#166534' }),
        img('c4r7', 'recto', 15, 125, 115, 145, '{photo}', { borderRadius: 8, borderColor: '#86efac', borderWidth: 3 }),
        vari('c4r9', 'recto', 145, 130, 160, 18, '{nom_complet}', { fontSize: 14, fontWeight: '700', color: '#166534' }),
        txt('c4r12', 'recto', 145, 155, 160, 14, '{formation}', { fontSize: 10, fontWeight: '600', color: '#475569' }),
        txt('c4r13', 'recto', 145, 175, 160, 14, '{niveau}', { fontSize: 10, color: '#475569' }),
        txt('c4r14', 'recto', 145, 200, 160, 14, '{date_naissance}', { fontSize: 9, color: '#64748b' }),
        txt('c4r15', 'recto', 145, 225, 160, 14, '{numero_etudiant}', { fontSize: 10, fontWeight: '700', color: '#166534' }),
        rect('c4r16', 'recto', 0, 285, W, 35, '#dcfce7'),
        txt('c4r17', 'recto', 15, 292, 290, 16, 'Valide du {validite_debut} au {validite_fin}', { fontSize: 9, color: '#166534', textAlign: 'center' }),
        ...versoBase('c4', '#166534', '#ffffff', '#f0fdf4', '#334155', '#166534'),
      ],
    },
  },
  // 5. TECHNOLOGIQUE - Purple/blue tech
  {
    name: '5. Technologique',
    data: {
      recto: { backgroundColor: '#f5f3ff' }, verso: { backgroundColor: '#1e1b4b' },
      elements: [
        rect('c5r1', 'recto', 0, 0, W, 65, '#4338ca'),
        txt('c5r2', 'recto', 15, 10, 290, 18, 'DIGITAL CFA', { fontSize: 13, fontWeight: '700', color: '#ffffff', letterSpacing: 2 }),
        txt('c5r3', 'recto', 15, 32, 290, 18, 'CARTE ETUDIANT {annee}', { fontSize: 11, color: '#c4b5fd', fontWeight: '600' }),
        img('c5r7', 'recto', 15, 78, 120, 150, '{photo}', { borderRadius: 8, borderColor: '#818cf8', borderWidth: 3 }),
        vari('c5r9', 'recto', 148, 85, 160, 18, '{nom_complet}', { fontSize: 14, fontWeight: '700', color: '#312e81' }),
        txt('c5r12', 'recto', 148, 110, 160, 14, '{formation}', { fontSize: 10, fontWeight: '600', color: '#6366f1' }),
        txt('c5r13', 'recto', 148, 130, 160, 14, '{niveau}', { fontSize: 10, color: '#475569' }),
        txt('c5r14', 'recto', 148, 155, 160, 14, '{date_naissance}', { fontSize: 9, color: '#64748b' }),
        txt('c5r15', 'recto', 148, 180, 160, 16, '{numero_etudiant}', { fontSize: 11, fontWeight: '700', color: '#4338ca' }),
        rect('c5r16', 'recto', 0, 250, W, 50, '#4338ca'),
        txt('c5r17', 'recto', 15, 258, 290, 16, 'Valide {validite_debut} — {validite_fin}', { fontSize: 9, color: '#c4b5fd', textAlign: 'center' }),
        txt('c5r18', 'recto', 15, 278, 290, 12, '{etablissement}', { fontSize: 8, color: '#ffffff', textAlign: 'center' }),
        ...versoBase('c5', '#4338ca', '#ffffff', '#1e1b4b', '#e0e7ff', '#818cf8'),
      ],
    },
  },
  // 6. MINIMALISTE - Clean white
  {
    name: '6. Minimaliste',
    data: {
      recto: { backgroundColor: '#ffffff' }, verso: { backgroundColor: '#fafafa' },
      elements: [
        rect('c6r1', 'recto', 0, 0, W, 4, '#334155'),
        txt('c6r2', 'recto', 15, 18, 290, 18, '{etablissement}', { fontSize: 12, fontWeight: '600', color: '#334155' }),
        txt('c6r5', 'recto', 15, 48, 200, 22, 'CARTE ETUDIANT', { fontSize: 14, fontWeight: '700', color: '#0f172a', letterSpacing: 3 }),
        txt('c6r6', 'recto', 15, 70, 200, 16, '{annee}', { fontSize: 11, color: '#64748b' }),
        img('c6r7', 'recto', 15, 95, 110, 140, '{photo}', { borderRadius: 6 }),
        vari('c6r9', 'recto', 140, 100, 165, 18, '{nom_complet}', { fontSize: 14, fontWeight: '700', color: '#0f172a' }),
        txt('c6r12', 'recto', 140, 125, 165, 14, '{formation}', { fontSize: 10, color: '#475569' }),
        txt('c6r13', 'recto', 140, 145, 165, 14, '{niveau}', { fontSize: 10, color: '#64748b' }),
        txt('c6r14', 'recto', 140, 170, 165, 14, '{date_naissance}', { fontSize: 9, color: '#94a3b8' }),
        txt('c6r15', 'recto', 140, 200, 165, 14, '{numero_etudiant}', { fontSize: 10, fontWeight: '600', color: '#334155' }),
        rect('c6r16', 'recto', 15, 250, 290, 1, '#e2e8f0'),
        txt('c6r17', 'recto', 15, 260, 290, 16, 'Valide du {validite_debut} au {validite_fin}', { fontSize: 9, color: '#94a3b8', textAlign: 'center' }),
        ...versoBase('c6', '#334155', '#ffffff', '#fafafa', '#475569', '#334155'),
      ],
    },
  },
  // 7. COLORE - Gradient pink/purple
  {
    name: '7. Colore',
    data: {
      recto: { backgroundColor: '#fdf2f8' }, verso: { backgroundColor: '#fdf2f8' },
      elements: [
        rect('c7r1', 'recto', 0, 0, W, 65, '#be185d'),
        txt('c7r2', 'recto', 15, 10, 290, 18, '{etablissement}', { fontSize: 13, fontWeight: '700', color: '#ffffff', textTransform: 'uppercase' }),
        txt('c7r3', 'recto', 15, 32, 290, 18, 'CARTE ETUDIANT {annee}', { fontSize: 11, color: '#fbcfe8', fontWeight: '600' }),
        img('c7r7', 'recto', 15, 78, 120, 150, '{photo}', { borderRadius: 12, borderColor: '#f472b6', borderWidth: 3 }),
        vari('c7r9', 'recto', 148, 85, 160, 18, '{nom_complet}', { fontSize: 14, fontWeight: '700', color: '#831843' }),
        txt('c7r12', 'recto', 148, 110, 160, 14, '{formation}', { fontSize: 10, fontWeight: '600', color: '#be185d' }),
        txt('c7r13', 'recto', 148, 130, 160, 14, '{niveau}', { fontSize: 10, color: '#475569' }),
        txt('c7r14', 'recto', 148, 155, 160, 14, '{date_naissance}', { fontSize: 9, color: '#64748b' }),
        txt('c7r15', 'recto', 148, 185, 160, 16, '{numero_etudiant}', { fontSize: 11, fontWeight: '700', color: '#be185d' }),
        rect('c7r16', 'recto', 0, 250, W, 50, '#be185d'),
        txt('c7r17', 'recto', 15, 260, 290, 16, 'Valide {validite_debut} — {validite_fin}', { fontSize: 9, color: '#fbcfe8', textAlign: 'center' }),
        ...versoBase('c7', '#be185d', '#ffffff', '#fdf2f8', '#475569', '#be185d'),
      ],
    },
  },
  // 8. INSTITUTIONNEL - Navy, official
  {
    name: '8. Institutionnel',
    data: {
      recto: { backgroundColor: '#ffffff' }, verso: { backgroundColor: '#f8fafc' },
      elements: [
        rect('c8r1', 'recto', 0, 0, W, 80, '#1e293b'),
        img('c8r2', 'recto', 12, 8, 24, 24, FRENCH_FLAG_SVG, { borderRadius: 2 }),
        txt('c8r3', 'recto', 12, 36, 140, 14, 'REPUBLIQUE', { fontSize: 9, fontWeight: '700', color: '#ffffff' }),
        txt('c8r4', 'recto', 12, 50, 140, 14, 'FRANCAISE', { fontSize: 9, fontWeight: '700', color: '#ffffff' }),
        txt('c8r5', 'recto', 12, 64, 140, 12, 'Liberte Egalite Fraternite', { fontSize: 7, color: '#94a3b8', fontStyle: 'italic' }),
        txt('c8r6', 'recto', 165, 10, 145, 22, 'CARTE', { fontSize: 20, fontWeight: '700', color: '#ffffff', textAlign: 'right' }),
        txt('c8r7', 'recto', 165, 34, 145, 18, 'ETUDIANT', { fontSize: 16, fontWeight: '700', color: '#ffffff', textAlign: 'right' }),
        txt('c8r8', 'recto', 165, 54, 145, 14, 'DES METIERS', { fontSize: 10, color: '#94a3b8', textAlign: 'right' }),
        img('c8r9', 'recto', 15, 95, 120, 150, '{photo}', { borderRadius: 6, borderColor: '#cbd5e1', borderWidth: 2 }),
        txt('c8r10', 'recto', 148, 98, 160, 12, 'Nom', { fontSize: 8, color: '#ef4444' }),
        vari('c8r11', 'recto', 148, 111, 160, 18, '{nom}', { fontSize: 14, fontWeight: '700', color: '#1e293b' }),
        txt('c8r12', 'recto', 148, 134, 160, 12, 'Prenom', { fontSize: 8, color: '#ef4444' }),
        vari('c8r13', 'recto', 148, 147, 160, 16, '{prenom}', { fontSize: 13, fontWeight: '600', color: '#334155' }),
        txt('c8r14', 'recto', 148, 170, 160, 12, 'Date de naissance', { fontSize: 8, color: '#ef4444' }),
        txt('c8r15', 'recto', 148, 183, 160, 14, '{date_naissance}', { fontSize: 11, fontWeight: '600', color: '#334155' }),
        txt('c8r16', 'recto', 148, 206, 160, 12, 'Statut', { fontSize: 8, color: '#ef4444' }),
        txt('c8r17', 'recto', 148, 219, 160, 14, 'Etudiant', { fontSize: 11, fontWeight: '600', color: '#334155' }),
        txt('c8r18', 'recto', 15, 260, 290, 14, '{formation}', { fontSize: 10, fontWeight: '600', color: '#1e293b' }),
        txt('c8r19', 'recto', 15, 278, 130, 14, '{annee}', { fontSize: 11, fontWeight: '700', color: '#1e293b' }),
        txt('c8r20', 'recto', 155, 278, 155, 14, '{validite_debut} au {validite_fin}', { fontSize: 9, color: '#64748b', textAlign: 'right' }),
        rect('c8r21', 'recto', 0, 300, W, 30, '#1e293b'),
        txt('c8r22', 'recto', 10, 305, 300, 18, 'Cette carte justifie du statut d\'etudiant des metiers.', { fontSize: 7, color: '#94a3b8', textAlign: 'center', textTransform: 'uppercase' }),
        ...versoBase('c8', '#1e293b', '#ffffff', '#f8fafc', '#334155', '#1e293b'),
      ],
    },
  },
  // 9. SPORTIF - Red/black dynamic
  {
    name: '9. Sportif',
    data: {
      recto: { backgroundColor: '#fef2f2' }, verso: { backgroundColor: '#1c1917' },
      elements: [
        rect('c9r1', 'recto', 0, 0, W, 65, '#b91c1c'),
        txt('c9r2', 'recto', 15, 10, 290, 18, '{etablissement}', { fontSize: 13, fontWeight: '700', color: '#ffffff', textTransform: 'uppercase', letterSpacing: 1 }),
        txt('c9r3', 'recto', 15, 32, 290, 18, 'CARTE ETUDIANT {annee}', { fontSize: 11, color: '#fecaca', fontWeight: '600' }),
        img('c9r7', 'recto', 15, 78, 120, 150, '{photo}', { borderRadius: 8, borderColor: '#f87171', borderWidth: 3 }),
        vari('c9r9', 'recto', 148, 85, 160, 18, '{nom_complet}', { fontSize: 14, fontWeight: '700', color: '#991b1b' }),
        txt('c9r12', 'recto', 148, 110, 160, 14, '{formation}', { fontSize: 10, fontWeight: '600', color: '#b91c1c' }),
        txt('c9r13', 'recto', 148, 130, 160, 14, '{niveau}', { fontSize: 10, color: '#475569' }),
        txt('c9r14', 'recto', 148, 155, 160, 14, '{date_naissance}', { fontSize: 9, color: '#64748b' }),
        txt('c9r15', 'recto', 148, 185, 160, 16, '{numero_etudiant}', { fontSize: 11, fontWeight: '700', color: '#b91c1c' }),
        rect('c9r16', 'recto', 0, 250, W, 50, '#b91c1c'),
        txt('c9r17', 'recto', 15, 260, 290, 16, 'Valide {validite_debut} — {validite_fin}', { fontSize: 9, color: '#fecaca', textAlign: 'center' }),
        ...versoBase('c9', '#b91c1c', '#ffffff', '#1c1917', '#d6d3d1', '#f87171'),
      ],
    },
  },
  // 10. ARTISTIQUE - Pastel/creative
  {
    name: '10. Artistique',
    data: {
      recto: { backgroundColor: '#faf5ff' }, verso: { backgroundColor: '#faf5ff' },
      elements: [
        rect('c10r1', 'recto', 0, 0, W, 65, '#7c3aed'),
        txt('c10r2', 'recto', 15, 10, 290, 18, '{etablissement}', { fontSize: 13, fontWeight: '700', color: '#ffffff', textTransform: 'uppercase' }),
        txt('c10r3', 'recto', 15, 32, 290, 18, 'CARTE ETUDIANT {annee}', { fontSize: 11, color: '#ddd6fe', fontWeight: '600' }),
        img('c10r7', 'recto', 15, 78, 120, 150, '{photo}', { borderRadius: 60, borderColor: '#a78bfa', borderWidth: 3 }),
        vari('c10r9', 'recto', 148, 85, 160, 18, '{nom_complet}', { fontSize: 14, fontWeight: '700', color: '#5b21b6' }),
        txt('c10r12', 'recto', 148, 110, 160, 14, '{formation}', { fontSize: 10, fontWeight: '600', color: '#7c3aed' }),
        txt('c10r13', 'recto', 148, 130, 160, 14, '{niveau}', { fontSize: 10, color: '#475569' }),
        txt('c10r14', 'recto', 148, 155, 160, 14, '{date_naissance}', { fontSize: 9, color: '#64748b' }),
        txt('c10r15', 'recto', 148, 185, 160, 16, '{numero_etudiant}', { fontSize: 11, fontWeight: '700', color: '#7c3aed' }),
        rect('c10r16', 'recto', 0, 250, W, 50, '#7c3aed'),
        txt('c10r17', 'recto', 15, 260, 290, 16, 'Valide {validite_debut} — {validite_fin}', { fontSize: 9, color: '#ddd6fe', textAlign: 'center' }),
        ...versoBase('c10', '#7c3aed', '#ffffff', '#faf5ff', '#475569', '#7c3aed'),
      ],
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
