import { supabase } from '@/integrations/supabase/client';

// =====================================================
// TYPES
// =====================================================

export interface CompetencyBlock {
  id: string;
  formation_id: string;
  title: string;
  code: string | null;
  description: string | null;
  coefficient: number;
  order_index: number;
  is_validated_independently: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeachingUnit {
  id: string;
  formation_id: string;
  title: string;
  code: string | null;
  coefficient: number;
  credits: number | null;
  order_index: number;
  block_id: string | null;
}

export interface EvaluationPeriod {
  id: string;
  formation_id: string;
  name: string;
  period_type: string;
  start_date: string;
  end_date: string;
  order_index: number;
  is_locked: boolean;
  locked_at: string | null;
  locked_by: string | null;
}

export interface Evaluation {
  id: string;
  module_id: string;
  period_id: string | null;
  instructor_id: string;
  title: string;
  description: string | null;
  evaluation_date: string | null;
  evaluation_type: string;
  scale: number;
  scale_type: string;
  coefficient: number;
  status: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  // joined
  module_title?: string;
  period_name?: string;
  instructor_name?: string;
  formation_id?: string;
}

export interface Grade {
  id: string;
  evaluation_id: string;
  student_id: string;
  value: number | null;
  status: string;
  is_absent: boolean;
  is_excused: boolean;
  is_dispensed: boolean;
  is_cheating: boolean;
  internal_comment: string | null;
  created_at: string;
  updated_at: string;
  // joined
  student_name?: string;
  student_email?: string;
}

export interface GradingRules {
  id: string;
  formation_id: string;
  validation_threshold: number;
  allow_compensation: boolean;
  compensation_threshold: number | null;
  credits_system: string;
  credits_per_semester: number | null;
  mention_passable_threshold: number;
  mention_ab_threshold: number;
  mention_bien_threshold: number;
  mention_tb_threshold: number;
  compensation_mode: string;
  allow_inter_block_compensation: boolean;
  eliminatory_threshold: number | null;
  has_eliminatory_threshold: boolean;
  scale_id: string | null;
  transcript_template_id: string | null;
}

export interface GradingScale {
  id: string;
  establishment_id: string;
  name: string;
  scale_type: string; // 'numeric_20' | 'numeric_100' | 'letter_af' | 'competency' | 'custom'
  max_value: number;
  passing_value: number;
  scale_levels: ScaleLevel[];
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScaleLevel {
  label: string;
  min_value: number;
  max_value: number;
  color?: string;
  is_passing?: boolean;
}

export interface TranscriptTemplate {
  id: string;
  establishment_id: string;
  name: string;
  description: string | null;
  template_type: string; // 'standard' | 'bts' | 'licence' | 'custom'
  is_default: boolean;
  is_active: boolean;
  header_config: TranscriptHeaderConfig;
  columns_config: TranscriptColumnConfig[];
  footer_config: TranscriptFooterConfig;
  style_config: TranscriptStyleConfig;
  created_at: string;
  updated_at: string;
}

export interface TranscriptHeaderConfig {
  show_logo: boolean;
  show_establishment_name: boolean;
  show_establishment_address: boolean;
  show_formation_title: boolean;
  show_formation_level: boolean;
  show_period: boolean;
  show_student_info: boolean;
  custom_title: string;
  custom_subtitle: string;
}

export interface TranscriptColumnConfig {
  key: string; // 'module_name' | 'cc_average' | 'eb_average' | 'student_average' | 'class_average' | 'coefficient' | 'credits' | 'appreciation'
  label: string;
  enabled: boolean;
  width: string;
}

export interface TranscriptFooterConfig {
  show_decision: boolean;
  show_mention: boolean;
  show_general_average: boolean;
  show_class_average: boolean;
  show_signatures: boolean;
  show_jury_date: boolean;
  show_stamp: boolean;
  signature_labels: string[];
  custom_text: string;
}

export interface TranscriptStyleConfig {
  primary_color: string;
  font_family: string;
  header_bg_color: string;
  block_header_color: string;
  border_style: string;
  paper_size: string; // 'a4' | 'letter'
  orientation: string; // 'portrait' | 'landscape'
}

export interface Transcript {
  id: string;
  student_id: string;
  formation_id: string;
  period_id: string | null;
  general_average: number | null;
  validated_credits: number | null;
  total_credits: number | null;
  decision: string | null;
  mention: string | null;
  jury_date: string | null;
  jury_comment: string | null;
  pdf_url: string | null;
  is_published: boolean;
  published_at: string | null;
  generated_at: string | null;
  // joined
  student_name?: string;
  formation_title?: string;
  period_name?: string;
}

export interface TranscriptModule {
  id: string;
  transcript_id: string;
  module_id: string;
  teaching_unit_id: string | null;
  module_average: number | null;
  coefficient: number;
  credits_earned: number | null;
  credits_possible: number | null;
  is_validated: boolean;
  module_title?: string;
  ue_title?: string;
}

// =====================================================
// GRADING SCALES
// =====================================================

export const getGradingScales = async (establishmentId: string): Promise<GradingScale[]> => {
  const { data, error } = await supabase
    .from('grading_scales')
    .select('*')
    .eq('establishment_id', establishmentId)
    .eq('is_active', true)
    .order('created_at');
  if (error) throw error;
  return (data || []).map((d: any) => ({
    ...d,
    scale_levels: Array.isArray(d.scale_levels) ? d.scale_levels : [],
  })) as GradingScale[];
};

export const createGradingScale = async (scale: Partial<GradingScale>): Promise<GradingScale> => {
  const { data, error } = await supabase
    .from('grading_scales')
    .insert({
      ...scale,
      scale_levels: JSON.stringify(scale.scale_levels || []),
    } as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as GradingScale;
};

export const updateGradingScale = async (id: string, updates: Partial<GradingScale>): Promise<GradingScale> => {
  const payload: any = { ...updates };
  if (updates.scale_levels) payload.scale_levels = JSON.stringify(updates.scale_levels);
  const { data, error } = await supabase
    .from('grading_scales')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as GradingScale;
};

export const deleteGradingScale = async (id: string): Promise<void> => {
  const { error } = await supabase.from('grading_scales').delete().eq('id', id);
  if (error) throw error;
};

// =====================================================
// TRANSCRIPT TEMPLATES
// =====================================================

export const getTranscriptTemplates = async (establishmentId: string): Promise<TranscriptTemplate[]> => {
  const { data, error } = await supabase
    .from('transcript_templates')
    .select('*')
    .eq('establishment_id', establishmentId)
    .eq('is_active', true)
    .order('created_at');
  if (error) throw error;
  return (data || []).map((d: any) => ({
    ...d,
    header_config: d.header_config || getDefaultHeaderConfig(),
    columns_config: Array.isArray(d.columns_config) ? d.columns_config : getDefaultColumnsConfig(),
    footer_config: d.footer_config || getDefaultFooterConfig(),
    style_config: d.style_config || getDefaultStyleConfig(),
  })) as TranscriptTemplate[];
};

export const createTranscriptTemplate = async (template: Partial<TranscriptTemplate>): Promise<TranscriptTemplate> => {
  const { data, error } = await supabase
    .from('transcript_templates')
    .insert({
      ...template,
      columns_config: JSON.stringify(template.columns_config || getDefaultColumnsConfig()),
      header_config: JSON.stringify(template.header_config || getDefaultHeaderConfig()),
      footer_config: JSON.stringify(template.footer_config || getDefaultFooterConfig()),
      style_config: JSON.stringify(template.style_config || getDefaultStyleConfig()),
    } as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as TranscriptTemplate;
};

export const updateTranscriptTemplate = async (id: string, updates: Partial<TranscriptTemplate>): Promise<TranscriptTemplate> => {
  const payload: any = { ...updates };
  if (updates.columns_config) payload.columns_config = JSON.stringify(updates.columns_config);
  if (updates.header_config) payload.header_config = JSON.stringify(updates.header_config);
  if (updates.footer_config) payload.footer_config = JSON.stringify(updates.footer_config);
  if (updates.style_config) payload.style_config = JSON.stringify(updates.style_config);
  const { data, error } = await supabase
    .from('transcript_templates')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as TranscriptTemplate;
};

export const deleteTranscriptTemplate = async (id: string): Promise<void> => {
  const { error } = await supabase.from('transcript_templates').delete().eq('id', id);
  if (error) throw error;
};

// Default template configs
export const getDefaultHeaderConfig = (): TranscriptHeaderConfig => ({
  show_logo: true,
  show_establishment_name: true,
  show_establishment_address: true,
  show_formation_title: true,
  show_formation_level: true,
  show_period: true,
  show_student_info: true,
  custom_title: 'Bulletin de Formation',
  custom_subtitle: '',
});

export const getDefaultColumnsConfig = (): TranscriptColumnConfig[] => [
  { key: 'module_name', label: 'Matière', enabled: true, width: '30%' },
  { key: 'cc_average', label: 'CC', enabled: true, width: '12%' },
  { key: 'eb_average', label: 'Examen Blanc', enabled: true, width: '12%' },
  { key: 'student_average', label: 'Moy. Stagiaire', enabled: true, width: '14%' },
  { key: 'class_average', label: 'Moy. Classe', enabled: true, width: '14%' },
  { key: 'coefficient', label: 'Coef.', enabled: true, width: '8%' },
  { key: 'credits', label: 'Crédits', enabled: false, width: '8%' },
  { key: 'appreciation', label: 'Appréciation', enabled: false, width: '20%' },
];

export const getDefaultFooterConfig = (): TranscriptFooterConfig => ({
  show_decision: true,
  show_mention: true,
  show_general_average: true,
  show_class_average: true,
  show_signatures: true,
  show_jury_date: false,
  show_stamp: false,
  signature_labels: ['Le Directeur', 'Le Responsable Pédagogique'],
  custom_text: '',
});

export const getDefaultStyleConfig = (): TranscriptStyleConfig => ({
  primary_color: '#6b21a8',
  font_family: 'Segoe UI, Arial, sans-serif',
  header_bg_color: '#f9f5ff',
  block_header_color: '#ede9fe',
  border_style: 'solid',
  paper_size: 'a4',
  orientation: 'portrait',
});

// Pre-built templates
export const PRESET_TEMPLATES: { name: string; description: string; type: string; config: Partial<TranscriptTemplate> }[] = [
  {
    name: 'Standard CFA',
    description: 'Modèle classique pour CFA avec blocs de compétences, CC et examens blancs',
    type: 'standard',
    config: {
      template_type: 'standard',
      header_config: getDefaultHeaderConfig(),
      columns_config: getDefaultColumnsConfig(),
      footer_config: getDefaultFooterConfig(),
      style_config: getDefaultStyleConfig(),
    },
  },
  {
    name: 'Modèle BTS',
    description: 'Format BTS avec épreuves E1-E6, coefficient et moyenne pondérée',
    type: 'bts',
    config: {
      template_type: 'bts',
      header_config: { ...getDefaultHeaderConfig(), custom_title: 'Relevé de Notes - BTS' },
      columns_config: [
        { key: 'module_name', label: 'Épreuve', enabled: true, width: '35%' },
        { key: 'cc_average', label: 'CCF', enabled: true, width: '12%' },
        { key: 'eb_average', label: 'BN', enabled: true, width: '12%' },
        { key: 'student_average', label: 'Note', enabled: true, width: '12%' },
        { key: 'coefficient', label: 'Coef.', enabled: true, width: '8%' },
        { key: 'class_average', label: 'Moy. Classe', enabled: true, width: '12%' },
        { key: 'appreciation', label: 'Observation', enabled: true, width: '15%' },
      ],
      footer_config: { ...getDefaultFooterConfig(), show_jury_date: true, signature_labels: ['Le Président du Jury', 'Le Directeur'] },
      style_config: { ...getDefaultStyleConfig(), primary_color: '#1e3a8a' },
    },
  },
  {
    name: 'Licence / Master',
    description: 'Format universitaire avec UE, crédits ECTS et semestres',
    type: 'licence',
    config: {
      template_type: 'licence',
      header_config: { ...getDefaultHeaderConfig(), custom_title: 'Relevé de Notes Semestriel' },
      columns_config: [
        { key: 'module_name', label: 'Matière / UE', enabled: true, width: '30%' },
        { key: 'student_average', label: 'Note / 20', enabled: true, width: '15%' },
        { key: 'class_average', label: 'Moy. Promo', enabled: true, width: '15%' },
        { key: 'coefficient', label: 'Coef.', enabled: true, width: '10%' },
        { key: 'credits', label: 'ECTS', enabled: true, width: '10%' },
        { key: 'appreciation', label: 'Résultat', enabled: true, width: '15%' },
      ],
      footer_config: { ...getDefaultFooterConfig(), show_jury_date: true, show_stamp: true, signature_labels: ['Le Doyen', 'Le Responsable de Formation'] },
      style_config: { ...getDefaultStyleConfig(), primary_color: '#0f172a' },
    },
  },
  {
    name: 'Minimaliste',
    description: 'Format épuré avec uniquement les moyennes et décisions',
    type: 'minimal',
    config: {
      template_type: 'custom',
      header_config: { ...getDefaultHeaderConfig(), show_establishment_address: false },
      columns_config: [
        { key: 'module_name', label: 'Module', enabled: true, width: '40%' },
        { key: 'student_average', label: 'Note', enabled: true, width: '20%' },
        { key: 'class_average', label: 'Classe', enabled: true, width: '20%' },
        { key: 'coefficient', label: 'Coef.', enabled: true, width: '10%' },
      ],
      footer_config: { ...getDefaultFooterConfig(), show_signatures: false, show_mention: false },
      style_config: { ...getDefaultStyleConfig(), primary_color: '#374151' },
    },
  },
];

// =====================================================
// COMPETENCY BLOCKS
// =====================================================

export const getCompetencyBlocks = async (formationId: string): Promise<CompetencyBlock[]> => {
  const { data, error } = await supabase
    .from('competency_blocks')
    .select('*')
    .eq('formation_id', formationId)
    .order('order_index');
  if (error) throw error;
  return (data || []) as unknown as CompetencyBlock[];
};

export const createCompetencyBlock = async (block: Partial<CompetencyBlock>): Promise<CompetencyBlock> => {
  const { data, error } = await supabase
    .from('competency_blocks')
    .insert(block as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as CompetencyBlock;
};

export const updateCompetencyBlock = async (id: string, updates: Partial<CompetencyBlock>): Promise<CompetencyBlock> => {
  const { data, error } = await supabase
    .from('competency_blocks')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as CompetencyBlock;
};

export const deleteCompetencyBlock = async (id: string): Promise<void> => {
  const { error } = await supabase.from('competency_blocks').delete().eq('id', id);
  if (error) throw error;
};

// =====================================================
// EVALUATION PERIODS
// =====================================================

export const getEvaluationPeriods = async (formationId: string): Promise<EvaluationPeriod[]> => {
  const { data, error } = await supabase
    .from('evaluation_periods')
    .select('*')
    .eq('formation_id', formationId)
    .order('order_index');
  if (error) throw error;
  return (data || []) as unknown as EvaluationPeriod[];
};

export const createEvaluationPeriod = async (period: Partial<EvaluationPeriod>): Promise<EvaluationPeriod> => {
  const { data, error } = await supabase
    .from('evaluation_periods')
    .insert(period as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as EvaluationPeriod;
};

export const updateEvaluationPeriod = async (id: string, updates: Partial<EvaluationPeriod>): Promise<EvaluationPeriod> => {
  const { data, error } = await supabase
    .from('evaluation_periods')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as EvaluationPeriod;
};

export const deleteEvaluationPeriod = async (id: string): Promise<void> => {
  const { error } = await supabase.from('evaluation_periods').delete().eq('id', id);
  if (error) throw error;
};

export const togglePeriodLock = async (id: string, lock: boolean): Promise<void> => {
  const { error } = await supabase
    .from('evaluation_periods')
    .update({
      is_locked: lock,
      locked_at: lock ? new Date().toISOString() : null,
    } as any)
    .eq('id', id);
  if (error) throw error;
};

// =====================================================
// TEACHING UNITS
// =====================================================

export const getTeachingUnits = async (formationId: string): Promise<TeachingUnit[]> => {
  const { data, error } = await supabase
    .from('teaching_units')
    .select('*')
    .eq('formation_id', formationId)
    .order('order_index');
  if (error) throw error;
  return (data || []) as unknown as TeachingUnit[];
};

export const createTeachingUnit = async (unit: Partial<TeachingUnit>): Promise<TeachingUnit> => {
  const { data, error } = await supabase
    .from('teaching_units')
    .insert(unit as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as TeachingUnit;
};

export const updateTeachingUnit = async (id: string, updates: Partial<TeachingUnit>): Promise<TeachingUnit> => {
  const { data, error } = await supabase
    .from('teaching_units')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as TeachingUnit;
};

export const deleteTeachingUnit = async (id: string): Promise<void> => {
  const { error } = await supabase.from('teaching_units').delete().eq('id', id);
  if (error) throw error;
};

// =====================================================
// MODULE EVALUATION MODE
// =====================================================

export const updateModuleEvaluationMode = async (moduleId: string, evaluationMode: string): Promise<void> => {
  const { error } = await supabase
    .from('formation_modules')
    .update({ evaluation_mode: evaluationMode } as any)
    .eq('id', moduleId);
  if (error) throw error;
};

// =====================================================
// EVALUATIONS
// =====================================================

export const getEvaluations = async (formationId: string): Promise<Evaluation[]> => {
  const { data, error } = await supabase
    .from('evaluations')
    .select(`
      *,
      formation_modules!inner(title, formation_id),
      evaluation_periods(name)
    `)
    .eq('formation_modules.formation_id', formationId)
    .order('evaluation_date', { ascending: false });
  if (error) throw error;
  return (data || []).map((e: any) => ({
    ...e,
    module_title: e.formation_modules?.title,
    formation_id: e.formation_modules?.formation_id,
    period_name: e.evaluation_periods?.name,
  })) as unknown as Evaluation[];
};

export const getEvaluationsByModule = async (moduleId: string): Promise<Evaluation[]> => {
  const { data, error } = await supabase
    .from('evaluations')
    .select('*, evaluation_periods(name)')
    .eq('module_id', moduleId)
    .order('evaluation_date', { ascending: false });
  if (error) throw error;
  return (data || []).map((e: any) => ({
    ...e,
    period_name: e.evaluation_periods?.name,
  })) as unknown as Evaluation[];
};

export const getEvaluationsByInstructor = async (instructorId: string): Promise<Evaluation[]> => {
  const { data, error } = await supabase
    .from('evaluations')
    .select(`
      *,
      formation_modules(title, formation_id),
      evaluation_periods(name)
    `)
    .eq('instructor_id', instructorId)
    .order('evaluation_date', { ascending: false });
  if (error) throw error;
  return (data || []).map((e: any) => ({
    ...e,
    module_title: e.formation_modules?.title,
    formation_id: e.formation_modules?.formation_id,
    period_name: e.evaluation_periods?.name,
  })) as unknown as Evaluation[];
};

export const createEvaluation = async (evaluation: Partial<Evaluation>): Promise<Evaluation> => {
  const { data, error } = await supabase
    .from('evaluations')
    .insert(evaluation as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Evaluation;
};

export const updateEvaluation = async (id: string, updates: Partial<Evaluation>): Promise<Evaluation> => {
  const { data, error } = await supabase
    .from('evaluations')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Evaluation;
};

export const deleteEvaluation = async (id: string): Promise<void> => {
  const { error } = await supabase.from('evaluations').delete().eq('id', id);
  if (error) throw error;
};

// =====================================================
// GRADES
// =====================================================

export const getGradesByEvaluation = async (evaluationId: string): Promise<Grade[]> => {
  const { data, error } = await supabase
    .from('grades')
    .select('*')
    .eq('evaluation_id', evaluationId)
    .order('created_at');
  if (error) throw error;
  return (data || []) as unknown as Grade[];
};

export const getGradesByStudent = async (studentId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('grades')
    .select(`
      *,
      evaluations(
        title, evaluation_type, scale, scale_type, coefficient, evaluation_date, is_published, status,
        formation_modules(title, formation_id, coefficient),
        evaluation_periods(name)
      )
    `)
    .eq('student_id', studentId);
  if (error) throw error;
  return data || [];
};

export const upsertGrade = async (grade: Partial<Grade>): Promise<Grade> => {
  const { data, error } = await supabase
    .from('grades')
    .upsert(grade as any, { onConflict: 'evaluation_id,student_id' })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Grade;
};

export const upsertGrades = async (grades: Partial<Grade>[]): Promise<Grade[]> => {
  const { data, error } = await supabase
    .from('grades')
    .upsert(grades as any[], { onConflict: 'evaluation_id,student_id' })
    .select();
  if (error) throw error;
  return (data || []) as unknown as Grade[];
};

export const saveGradeHistory = async (history: {
  grade_id: string;
  old_value: number | null;
  new_value: number | null;
  old_status?: string;
  new_status?: string;
  changed_by: string;
  change_reason?: string;
}): Promise<void> => {
  const { error } = await supabase
    .from('grade_history')
    .insert(history as any);
  if (error) throw error;
};

// =====================================================
// GRADING RULES
// =====================================================

export const getGradingRules = async (formationId: string): Promise<GradingRules | null> => {
  const { data, error } = await supabase
    .from('grading_rules')
    .select('*')
    .eq('formation_id', formationId)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as GradingRules | null;
};

export const upsertGradingRules = async (rules: Partial<GradingRules>): Promise<GradingRules> => {
  const { data, error } = await supabase
    .from('grading_rules')
    .upsert(rules as any, { onConflict: 'formation_id' })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as GradingRules;
};

// =====================================================
// TRANSCRIPTS
// =====================================================

export const getTranscripts = async (formationId: string, periodId?: string): Promise<Transcript[]> => {
  let query = supabase
    .from('transcripts')
    .select('*, evaluation_periods(name)')
    .eq('formation_id', formationId)
    .order('created_at', { ascending: false });
  if (periodId) query = query.eq('period_id', periodId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((t: any) => ({
    ...t,
    period_name: t.evaluation_periods?.name,
  })) as unknown as Transcript[];
};

export const getStudentTranscripts = async (studentId: string): Promise<Transcript[]> => {
  const { data, error } = await supabase
    .from('transcripts')
    .select('*, evaluation_periods(name), formations(title)')
    .eq('student_id', studentId)
    .eq('is_published', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((t: any) => ({
    ...t,
    period_name: t.evaluation_periods?.name,
    formation_title: t.formations?.title,
  })) as unknown as Transcript[];
};

export const getTranscriptModules = async (transcriptId: string): Promise<TranscriptModule[]> => {
  const { data, error } = await supabase
    .from('transcript_modules')
    .select('*, formation_modules(title), teaching_units(title)')
    .eq('transcript_id', transcriptId);
  if (error) throw error;
  return (data || []).map((tm: any) => ({
    ...tm,
    module_title: tm.formation_modules?.title,
    ue_title: tm.teaching_units?.title,
  })) as unknown as TranscriptModule[];
};

export const createTranscript = async (transcript: Partial<Transcript>): Promise<Transcript> => {
  const { data, error } = await supabase
    .from('transcripts')
    .insert({ ...transcript, generated_at: new Date().toISOString() } as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Transcript;
};

export const updateTranscript = async (id: string, updates: Partial<Transcript>): Promise<Transcript> => {
  const { data, error } = await supabase
    .from('transcripts')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Transcript;
};

export const createTranscriptModules = async (modules: Partial<TranscriptModule>[]): Promise<void> => {
  const { error } = await supabase
    .from('transcript_modules')
    .insert(modules as any[]);
  if (error) throw error;
};

// =====================================================
// SCALE CONVERSION & DISPLAY
// =====================================================

/**
 * Convert a numeric /20 value to the target scale display
 */
export const formatGradeValue = (
  value: number | null,
  scaleType: string = 'numeric_20',
  maxValue: number = 20,
  scaleLevels: ScaleLevel[] = []
): string => {
  if (value === null || value === undefined) return '—';

  switch (scaleType) {
    case 'numeric_20':
      return value.toFixed(2);
    case 'numeric_100':
      return ((value / 20) * 100).toFixed(1);
    case 'letter_af': {
      const pct = (value / 20) * 100;
      if (pct >= 90) return 'A';
      if (pct >= 80) return 'B';
      if (pct >= 70) return 'C';
      if (pct >= 60) return 'D';
      if (pct >= 50) return 'E';
      return 'F';
    }
    case 'competency': {
      const pct = (value / 20) * 100;
      if (pct >= 75) return 'Acquis';
      if (pct >= 50) return 'En cours d\'acquisition';
      return 'Non acquis';
    }
    case 'custom': {
      if (scaleLevels.length > 0) {
        const level = scaleLevels.find(l => value >= l.min_value && value <= l.max_value);
        return level ? level.label : value.toFixed(2);
      }
      return ((value / 20) * maxValue).toFixed(2);
    }
    default:
      return value.toFixed(2);
  }
};

/**
 * Convert a user-entered value in a given scale to /20 for storage
 */
export const convertToBase20 = (value: number, scaleType: string, maxValue: number = 20): number => {
  switch (scaleType) {
    case 'numeric_20':
      return value;
    case 'numeric_100':
      return (value / 100) * 20;
    case 'custom':
      return (value / maxValue) * 20;
    default:
      return value;
  }
};

/**
 * Get input max value for a scale type
 */
export const getScaleMaxInput = (scaleType: string, maxValue: number = 20): number => {
  switch (scaleType) {
    case 'numeric_20': return 20;
    case 'numeric_100': return 100;
    case 'custom': return maxValue;
    default: return 20;
  }
};

/**
 * Check if scale uses numeric input
 */
export const isNumericScale = (scaleType: string): boolean => {
  return ['numeric_20', 'numeric_100', 'custom'].includes(scaleType);
};

// =====================================================
// CALCULS DE MOYENNES
// =====================================================

export const calculateModuleAverage = (grades: Grade[], scale: number = 20): number | null => {
  const validGrades = grades.filter(g => 
    g.value !== null && !g.is_absent && !g.is_dispensed
  );
  if (validGrades.length === 0) return null;
  
  const normalizedGrades = validGrades.map(g => ({
    ...g,
    value: g.is_cheating ? 0 : g.value!,
  }));
  
  const sum = normalizedGrades.reduce((acc, g) => acc + (g.value / scale * 20), 0);
  return Math.round((sum / normalizedGrades.length) * 100) / 100;
};

export const calculateWeightedAverage = (
  modules: { average: number | null; coefficient: number }[]
): number | null => {
  const valid = modules.filter(m => m.average !== null);
  if (valid.length === 0) return null;
  
  const totalCoeff = valid.reduce((acc, m) => acc + m.coefficient, 0);
  const weightedSum = valid.reduce((acc, m) => acc + (m.average! * m.coefficient), 0);
  
  return Math.round((weightedSum / totalCoeff) * 100) / 100;
};

export const isAboveEliminatoryThreshold = (
  average: number | null,
  rules: GradingRules
): boolean => {
  if (!rules.has_eliminatory_threshold || rules.eliminatory_threshold === null) return true;
  if (average === null) return true;
  return average >= rules.eliminatory_threshold;
};

export const calculateBlockAverage = (
  moduleAverages: { average: number | null; coefficient: number }[]
): number | null => {
  return calculateWeightedAverage(moduleAverages);
};

export const canCompensate = (
  moduleAverage: number | null,
  rules: GradingRules
): boolean => {
  if (!rules.allow_compensation) return false;
  if (moduleAverage === null) return false;
  if (rules.has_eliminatory_threshold && rules.eliminatory_threshold !== null) {
    if (moduleAverage < rules.eliminatory_threshold) return false;
  }
  if (rules.compensation_threshold !== null && moduleAverage < rules.compensation_threshold) return false;
  return true;
};

export const getMention = (average: number, rules: GradingRules): string | null => {
  if (average >= rules.mention_tb_threshold) return 'tres_bien';
  if (average >= rules.mention_bien_threshold) return 'bien';
  if (average >= rules.mention_ab_threshold) return 'assez_bien';
  if (average >= rules.mention_passable_threshold) return 'passable';
  return null;
};

export const getDecision = (average: number, rules: GradingRules): string => {
  if (average >= rules.validation_threshold) return 'admis';
  if (rules.allow_compensation && rules.compensation_threshold && average >= rules.compensation_threshold) return 'rattrapage';
  return 'ajourne';
};

// =====================================================
// LABELS & HELPERS
// =====================================================

export const EVALUATION_TYPES = [
  { value: 'controle_continu', label: 'Contrôle continu' },
  { value: 'examen_blanc', label: 'Examen blanc' },
  { value: 'examen_final', label: 'Examen final' },
  { value: 'rattrapage', label: 'Rattrapage' },
  { value: 'projet', label: 'Projet' },
  { value: 'oral', label: 'Oral' },
  { value: 'tp', label: 'Travaux pratiques' },
];

export const EVALUATION_STATUSES = [
  { value: 'brouillon', label: 'Brouillon', color: 'bg-muted text-muted-foreground' },
  { value: 'ouvert', label: 'Ouvert à la saisie', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'cloture', label: 'Clôturé', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  { value: 'diffuse', label: 'Diffusé', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
];

export const PERIOD_TYPES = [
  { value: 'semestre', label: 'Semestre' },
  { value: 'trimestre', label: 'Trimestre' },
  { value: 'annee', label: 'Année' },
  { value: 'bloc', label: 'Bloc de compétences' },
  { value: 'custom', label: 'Personnalisé' },
];

export const EVALUATION_MODES = [
  { value: 'cc_only', label: 'Contrôle continu uniquement' },
  { value: 'exam_only', label: 'Examen blanc uniquement' },
  { value: 'both', label: 'CC + Examen blanc' },
];

export const COMPENSATION_MODES = [
  { value: 'none', label: 'Aucune compensation' },
  { value: 'intra_block', label: 'Compensation intra-bloc (entre modules d\'un même bloc)' },
  { value: 'inter_block', label: 'Compensation inter-blocs (entre blocs)' },
  { value: 'both', label: 'Compensation intra et inter-blocs' },
];

export const SCALE_TYPES = [
  { value: 'numeric_20', label: 'Numérique / 20', description: 'Barème classique français sur 20 points' },
  { value: 'numeric_100', label: 'Numérique / 100', description: 'Pourcentage sur 100 points' },
  { value: 'letter_af', label: 'Lettres A - F', description: 'Échelle de lettres (A = excellent, F = insuffisant)' },
  { value: 'competency', label: 'Acquis / Non acquis', description: 'Évaluation par compétences (Acquis, En cours, Non acquis)' },
  { value: 'custom', label: 'Personnalisé', description: 'Échelle définie par l\'établissement' },
];

export const TEMPLATE_TYPES = [
  { value: 'standard', label: 'Standard CFA' },
  { value: 'bts', label: 'BTS' },
  { value: 'licence', label: 'Licence / Master' },
  { value: 'custom', label: 'Personnalisé' },
];

export const DECISIONS = [
  { value: 'admis', label: 'Admis', color: 'text-green-600' },
  { value: 'ajourne', label: 'Ajourné', color: 'text-red-600' },
  { value: 'rattrapage', label: 'Rattrapage', color: 'text-amber-600' },
  { value: 'en_cours', label: 'En cours', color: 'text-blue-600' },
];

export const MENTIONS = [
  { value: 'tres_bien', label: 'Très bien' },
  { value: 'bien', label: 'Bien' },
  { value: 'assez_bien', label: 'Assez bien' },
  { value: 'passable', label: 'Passable' },
];

export const CREDITS_SYSTEMS = [
  { value: 'none', label: 'Aucun' },
  { value: 'ects', label: 'ECTS' },
  { value: 'internal', label: 'Crédits internes' },
];
