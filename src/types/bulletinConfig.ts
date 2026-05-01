/**
 * Bulletin configuration types — mirrors the JSONB blocks of the
 * `bulletin_configurations` table. Each block is intentionally loose (optional
 * fields) because a period config can override only a subset of the parent's
 * fields — the resolution cascade handles merging.
 */

// ─── 1. Sources (which evaluations enter the bulletin) ──────────
export type EvaluationTypeKey =
  | 'controle_continu'
  | 'devoir_surveille'
  | 'partiel'
  | 'examen_blanc'
  | 'examen_final'
  | 'bts_blanc'
  | 'rattrapage'
  | 'stage'
  | 'oral'
  | 'tp'
  | 'projet'
  | 'autre';

export type CombinationMode =
  | 'weighted_average'   // sum(note * weight) / sum(weight)
  | 'replacement'         // the later evaluation replaces earlier ones
  | 'max'                 // take the best
  | 'min';                // take the worst

export interface SourcesConfig {
  included_types?: EvaluationTypeKey[];
  combination_mode?: CombinationMode;
  type_weights?: Partial<Record<EvaluationTypeKey, number>>;
  // Scoping: which periods' grades feed this bulletin
  // - 'current'      → only grades in the current period
  // - 'current+named' → current period + named additional periods (used for
  //                     "BTS blanc" which combines CC of the semester +
  //                     notes of the BTS blanc period)
  period_scope?: 'current' | 'all_up_to_current' | 'custom';
  custom_period_ids?: string[];
}

// ─── 2. Calculation rules ────────────────────────────────────────
export type ModuleAverageMethod =
  | 'weighted_by_coefficient'
  | 'simple_average'
  | 'weighted_custom';

export type GeneralAverageMethod =
  | 'weighted_by_module_coefficient'
  | 'weighted_by_ects'
  | 'average_of_teaching_units';

export type CompensationScope =
  | 'all'                  // across modules
  | 'teaching_unit_only'
  | 'none';

export interface CalculationRules {
  module_average_method?: ModuleAverageMethod;
  general_average_method?: GeneralAverageMethod;
  compensation_allowed?: boolean;
  compensation_scope?: CompensationScope;
  auto_rattrapage_threshold?: number | null;
  eliminatory_note_threshold?: number | null;
  scale?: number;
  rounding_decimals?: number;
}

// ─── 3. Layout ───────────────────────────────────────────────────
export type BulletinSectionKey =
  | 'header'
  | 'student_identity'
  | 'grades_table'
  | 'general_average'
  | 'class_rank'
  | 'attendance'
  | 'general_appreciation'
  | 'decision'
  | 'signatures'
  | 'legal_notice';

export type TableColumnKey =
  | 'module'
  | 'instructor'
  | 'average'
  | 'cc_average'
  | 'exam_average'
  | 'coefficient'
  | 'ects_credits'
  | 'appreciation'
  | 'class_min'
  | 'class_max'
  | 'class_average';

export interface LayoutConfig {
  sections?: Partial<Record<BulletinSectionKey, boolean>>;
  table_columns?: TableColumnKey[];
  group_by_teaching_unit?: boolean;
}

// ─── 4. Design ───────────────────────────────────────────────────
export interface DesignConfig {
  primary_color?: string;
  accent_color?: string;
  success_color?: string;
  error_color?: string;
  font_family?: string;
  page_format?: 'A4' | 'A3' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  logo_position?: 'left' | 'center' | 'right';
  watermark_enabled?: boolean;
  watermark_text?: string;
  qr_code_enabled?: boolean;
  qr_code_position?: 'bottom_right' | 'bottom_left' | 'top_right' | 'top_left';
}

// ─── 5. Texts ────────────────────────────────────────────────────
export interface AppreciationRange {
  min: number;
  max: number;
  text: string;
}

export interface TextConfig {
  main_title?: string;
  subtitle?: string;
  appreciation_ranges?: AppreciationRange[];
  legal_notice?: string;
}

// ─── 6. Signatures ───────────────────────────────────────────────
export interface SignatoryConfig {
  id?: string;
  role_label: string;
  required?: boolean;
  order?: number;
  user_id?: string;      // optional link to a staff member
}

export interface SignaturesConfig {
  signatories?: SignatoryConfig[];
  stamp_enabled?: boolean;
  stamp_position?: 'left' | 'center' | 'right';
  electronic_signature?: boolean;
}

// ─── 7. Decision rules ───────────────────────────────────────────
export interface MentionConfig {
  label: string;
  threshold: number;
}

export interface DecisionRules {
  admission_threshold?: number;
  mentions?: MentionConfig[];
  admitted_label?: string;
  not_admitted_label?: string;
  pending_label?: string;
}

// ─── Root entity ─────────────────────────────────────────────────
export interface BulletinConfiguration {
  id: string;
  establishment_id: string | null;
  formation_id: string | null;
  period_id: string | null;
  name: string;
  description: string | null;
  is_system_template: boolean;
  is_active: boolean;
  sources_config: SourcesConfig;
  calculation_rules: CalculationRules;
  layout_config: LayoutConfig;
  design_config: DesignConfig;
  text_config: TextConfig;
  signatures_config: SignaturesConfig;
  decision_rules: DecisionRules;
  created_at: string;
  updated_at: string;
}

export interface ResolvedBulletinConfig {
  sources_config: SourcesConfig;
  calculation_rules: CalculationRules;
  layout_config: LayoutConfig;
  design_config: DesignConfig;
  text_config: TextConfig;
  signatures_config: SignaturesConfig;
  decision_rules: DecisionRules;
  source_chain: Array<{ level: string; id: string; name: string }>;
}

/**
 * Defaults used when a field is missing from all levels of the cascade.
 * Kept in sync with the seed in the migration.
 */
export const DEFAULT_CONFIG: ResolvedBulletinConfig = {
  sources_config: {
    included_types: ['controle_continu', 'devoir_surveille', 'projet', 'oral', 'tp', 'examen_blanc', 'examen_final', 'partiels', 'partiel', 'rattrapage', 'soutenance', 'autre'],
    combination_mode: 'weighted_average',
    period_scope: 'current',
  },
  calculation_rules: {
    module_average_method: 'weighted_by_coefficient',
    general_average_method: 'weighted_by_module_coefficient',
    compensation_allowed: true,
    auto_rattrapage_threshold: 10,
    eliminatory_note_threshold: null,
    scale: 20,
    rounding_decimals: 2,
  },
  layout_config: {
    sections: {
      header: true,
      student_identity: true,
      grades_table: true,
      general_average: true,
      class_rank: true,
      attendance: true,
      general_appreciation: true,
      decision: true,
      signatures: true,
      legal_notice: true,
    },
    table_columns: ['module', 'instructor', 'average', 'coefficient', 'appreciation'],
    group_by_teaching_unit: false,
  },
  design_config: {
    primary_color: '#1a1a2e',
    accent_color: '#c8a94e',
    success_color: '#16a34a',
    error_color: '#dc2626',
    font_family: 'Times New Roman',
    page_format: 'A4',
    orientation: 'portrait',
    logo_position: 'left',
  },
  text_config: {
    main_title: 'BULLETIN DE NOTES',
    appreciation_ranges: [
      { min: 16, max: 20, text: 'Excellent.' },
      { min: 14, max: 16, text: 'Bien.' },
      { min: 12, max: 14, text: 'Assez bien.' },
      { min: 10, max: 12, text: 'Passable.' },
      { min: 0, max: 10, text: 'Insuffisant.' },
    ],
    legal_notice: 'Document officiel certifie authentique.',
  },
  signatures_config: {
    signatories: [
      { role_label: 'Directeur pedagogique', required: true, order: 1 },
    ],
    stamp_enabled: true,
    stamp_position: 'center',
  },
  decision_rules: {
    admission_threshold: 10,
    mentions: [
      { label: 'Tres bien', threshold: 16 },
      { label: 'Bien', threshold: 14 },
      { label: 'Assez bien', threshold: 12 },
      { label: 'Passable', threshold: 10 },
    ],
    admitted_label: 'ADMIS(E)',
    not_admitted_label: 'NON ADMIS(E)',
    pending_label: 'EN COURS',
  },
  source_chain: [],
};
