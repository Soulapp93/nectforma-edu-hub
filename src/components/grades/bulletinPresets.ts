import {
  type BulletinElement,
  type TableColumnConfig,
  type TableStyleConfig,
  DEFAULT_HEADER_ELEMENTS,
  DEFAULT_BODY_ELEMENTS,
  DEFAULT_FOOTER_ELEMENTS,
  DEFAULT_TABLE_COLUMNS,
  DEFAULT_TABLE_STYLE,
} from './BulletinLayoutEditor';

export interface BulletinPreset {
  id: string;
  name: string;
  description: string;
  category: 'BTS' | 'Master' | 'BAC PRO' | 'Semestre' | 'Trimestre' | 'Personnalisé';
  // Visual preview metadata
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  // Layout
  headerElements: BulletinElement[];
  bodyElements: BulletinElement[];
  footerElements: BulletinElement[];
  tableColumns: TableColumnConfig[];
  tableStyle: TableStyleConfig;
  // CC / Exam columns (for legacy renderer)
  ccColumns: string[];
  examColumns: string[];
  showExamSection: boolean;
}

// Helper: column subset
const cols = (keys: string[]): TableColumnConfig[] => DEFAULT_TABLE_COLUMNS.map((c) => ({
  ...c,
  visible: keys.includes(c.key),
}));

// Helper: customize style
const styleOf = (over: Partial<TableStyleConfig>): TableStyleConfig => ({ ...DEFAULT_TABLE_STYLE, ...over });

export const BULLETIN_PRESETS: BulletinPreset[] = [
  // ============================================================================
  // BTS - 2 blocks (CC + Examen Blanc)
  // ============================================================================
  {
    id: 'preset-bts',
    name: 'BTS — Bulletin BTS',
    description: 'Modèle BTS avec contrôle continu + examen blanc, points, total et décision Admis/Non admis',
    category: 'BTS',
    primaryColor: '#1a1a2e',
    accentColor: '#c8a94e',
    fontFamily: 'Georgia',
    headerElements: DEFAULT_HEADER_ELEMENTS,
    bodyElements: DEFAULT_BODY_ELEMENTS,
    footerElements: DEFAULT_FOOTER_ELEMENTS,
    tableColumns: cols(['module', 'coefficient', 'cc', 'exam', 'points', 'moyenne', 'status', 'appreciation']),
    tableStyle: styleOf({ headerBg: '#1a1a2e', headerTextColor: '#ffffff', rowAltBg: '#f1f5f9' }),
    ccColumns: ['moyenne_stagiaire', 'moyenne_classe', 'appreciation'],
    examColumns: ['notes', 'coefficient', 'points', 'appreciation'],
    showExamSection: true,
  },
  // ============================================================================
  // Master
  // ============================================================================
  {
    id: 'preset-master',
    name: 'Master — Bulletin Master',
    description: 'Modèle Master avec crédits ECTS, mention, rang, décision finale',
    category: 'Master',
    primaryColor: '#1e3a8a',
    accentColor: '#dc2626',
    fontFamily: 'Inter',
    headerElements: DEFAULT_HEADER_ELEMENTS,
    bodyElements: DEFAULT_BODY_ELEMENTS,
    footerElements: DEFAULT_FOOTER_ELEMENTS,
    tableColumns: cols(['module', 'coefficient', 'cc', 'ds', 'exam', 'moyenne', 'credits', 'status']),
    tableStyle: styleOf({ headerBg: '#1e3a8a', headerTextColor: '#ffffff', borderRadius: 6 }),
    ccColumns: ['moyenne_stagiaire', 'moyenne_classe', 'appreciation'],
    examColumns: ['notes', 'coefficient', 'points'],
    showExamSection: true,
  },
  // ============================================================================
  // BAC PRO
  // ============================================================================
  {
    id: 'preset-bac-pro',
    name: 'BAC PRO — Bulletin BAC Pro',
    description: 'Modèle BAC Pro avec compétences, contrôle continu, soutenance, attestation',
    category: 'BAC PRO',
    primaryColor: '#0d9488',
    accentColor: '#f59e0b',
    fontFamily: 'Inter',
    headerElements: DEFAULT_HEADER_ELEMENTS,
    bodyElements: DEFAULT_BODY_ELEMENTS,
    footerElements: DEFAULT_FOOTER_ELEMENTS,
    tableColumns: cols(['module', 'coefficient', 'cc', 'oral', 'moyenne', 'appreciation']),
    tableStyle: styleOf({ headerBg: '#0d9488', headerTextColor: '#ffffff', rowAltBg: '#ecfeff' }),
    ccColumns: ['moyenne_stagiaire', 'appreciation'],
    examColumns: ['notes', 'coefficient', 'points', 'appreciation'],
    showExamSection: false,
  },
  // ============================================================================
  // Semestre simple
  // ============================================================================
  {
    id: 'preset-semestre',
    name: 'Semestre — Bulletin semestriel classique',
    description: 'Modèle simple : matière, CC, moyenne, statut. Idéal pour formations courtes',
    category: 'Semestre',
    primaryColor: '#3b82f6',
    accentColor: '#22c55e',
    fontFamily: 'Inter',
    headerElements: DEFAULT_HEADER_ELEMENTS,
    bodyElements: DEFAULT_BODY_ELEMENTS,
    footerElements: DEFAULT_FOOTER_ELEMENTS,
    tableColumns: cols(['module', 'coefficient', 'cc', 'moyenne', 'status']),
    tableStyle: styleOf({ headerBg: '#3b82f6', headerTextColor: '#ffffff' }),
    ccColumns: ['moyenne_stagiaire', 'moyenne_classe', 'appreciation'],
    examColumns: ['notes', 'coefficient', 'points'],
    showExamSection: false,
  },
  // ============================================================================
  // Trimestre (collège/lycée)
  // ============================================================================
  {
    id: 'preset-trimestre',
    name: 'Trimestre — Bulletin trimestriel',
    description: 'Modèle trimestre avec moyenne, moyenne classe, appréciation enseignant',
    category: 'Trimestre',
    primaryColor: '#7c3aed',
    accentColor: '#ec4899',
    fontFamily: 'Inter',
    headerElements: DEFAULT_HEADER_ELEMENTS,
    bodyElements: DEFAULT_BODY_ELEMENTS,
    footerElements: DEFAULT_FOOTER_ELEMENTS,
    tableColumns: cols(['module', 'coefficient', 'cc', 'ds', 'moyenne', 'appreciation']),
    tableStyle: styleOf({ headerBg: '#7c3aed', headerTextColor: '#ffffff', rowAltBg: '#faf5ff' }),
    ccColumns: ['moyenne_stagiaire', 'moyenne_classe', 'appreciation'],
    examColumns: ['notes', 'coefficient', 'points'],
    showExamSection: true,
  },
  // ============================================================================
  // Personnalisé (vide, à construire)
  // ============================================================================
  {
    id: 'preset-blank',
    name: 'Personnalisé — Démarrer de zéro',
    description: 'Démarre avec une mise en page minimale à construire entièrement',
    category: 'Personnalisé',
    primaryColor: '#3b82f6',
    accentColor: '#06b6d4',
    fontFamily: 'Inter',
    headerElements: DEFAULT_HEADER_ELEMENTS,
    bodyElements: DEFAULT_BODY_ELEMENTS,
    footerElements: DEFAULT_FOOTER_ELEMENTS,
    tableColumns: cols(['module', 'coefficient', 'moyenne']),
    tableStyle: DEFAULT_TABLE_STYLE,
    ccColumns: ['moyenne_stagiaire'],
    examColumns: ['notes'],
    showExamSection: false,
  },
];

export const findPresetById = (id: string): BulletinPreset | undefined =>
  BULLETIN_PRESETS.find((p) => p.id === id);
