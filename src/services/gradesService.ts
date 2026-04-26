import { supabase } from '@/integrations/supabase/client';

// =====================================================
// TYPES
// =====================================================

export interface TeachingUnit {
  id: string;
  formation_id: string;
  title: string;
  code: string | null;
  coefficient: number;
  credits: number | null;
  order_index: number;
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
  is_composite?: boolean;
  combined_period_ids?: string[] | null;
  composite_config?: CompositeBulletinConfig | null;
}

export interface CompositeBlockConfig {
  period_id: string;
  render_mode: 'block' | 'merged';
  title?: string;
  /** Visible column keys: module, coefficient, cc, ds, exam, oral, tp, moyenne, moyenne_classe, points, credits, status, appreciation, rang */
  columns: string[];
  show_appreciation?: boolean;
  order_index: number;
}

export interface CompositeTotalConfig {
  enabled: boolean;
  label: string;
  /** Formula type: sum_points | average_avg | weighted_avg | custom */
  formula: 'sum_points' | 'average_avg' | 'weighted_avg' | 'custom';
  custom_expression?: string;
  threshold: number;
  admitted_label: string;
  rejected_label: string;
}

export interface CompositeBulletinConfig {
  blocks: CompositeBlockConfig[];
  total: CompositeTotalConfig;
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
        title, evaluation_type, scale, coefficient, evaluation_date, is_published, status,
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
// CALCULS DE MOYENNES
// =====================================================

export const calculateModuleAverage = (grades: Grade[], scale: number = 20): number | null => {
  const validGrades = grades.filter(g => 
    g.value !== null && !g.is_absent && !g.is_dispensed
  );
  if (validGrades.length === 0) return null;
  
  // Normaliser les notes cheating à 0
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
// DUPLICATE PERIOD WITH EVALUATIONS
// =====================================================

export const duplicatePeriodWithEvaluations = async (
  sourcePeriodId: string,
  newPeriodName: string,
  formationId: string
): Promise<EvaluationPeriod> => {
  const { data: sourcePeriod, error: periodError } = await supabase
    .from('evaluation_periods')
    .select('*')
    .eq('id', sourcePeriodId)
    .single();
  if (periodError || !sourcePeriod) throw new Error('Période source introuvable');

  const { data: allPeriods } = await supabase
    .from('evaluation_periods')
    .select('order_index')
    .eq('formation_id', formationId)
    .order('order_index', { ascending: false })
    .limit(1);
  const nextIndex = (allPeriods?.[0]?.order_index ?? 0) + 1;

  const { data: newPeriod, error: createError } = await supabase
    .from('evaluation_periods')
    .insert({
      formation_id: formationId,
      name: newPeriodName,
      period_type: (sourcePeriod as any).period_type,
      start_date: (sourcePeriod as any).start_date,
      end_date: (sourcePeriod as any).end_date,
      order_index: nextIndex,
      is_locked: false,
    } as any)
    .select()
    .single();
  if (createError || !newPeriod) throw createError || new Error('Erreur création période');

  const { data: sourceEvals, error: evalsError } = await supabase
    .from('evaluations')
    .select('*')
    .eq('period_id', sourcePeriodId);
  if (evalsError) throw evalsError;

  if (sourceEvals && sourceEvals.length > 0) {
    const newEvals = sourceEvals.map((ev: any) => ({
      module_id: ev.module_id,
      period_id: (newPeriod as any).id,
      instructor_id: ev.instructor_id,
      title: ev.title,
      description: ev.description,
      evaluation_type: ev.evaluation_type,
      scale: ev.scale,
      coefficient: ev.coefficient,
      status: 'brouillon',
      is_published: false,
    }));
    const { error: insertError } = await supabase.from('evaluations').insert(newEvals as any[]);
    if (insertError) throw insertError;
  }

  return newPeriod as unknown as EvaluationPeriod;
};

// =====================================================
// TRANSCRIPT TEMPLATES
// =====================================================

export interface TranscriptTemplateConfig {
  sections: { id: string; title: string; moduleIds: string[] }[];
  ccColumns: string[];
  examColumns: string[];
  showExamSection: boolean;
}

export interface TranscriptHeaderConfig {
  title: string;
  showLogo: boolean;
  showSession: boolean;
  subtitle: string;
}

export interface TranscriptFooterConfig {
  showAssiduity: boolean;
  customText: string;
  showSignature: boolean;
}

export interface TranscriptStyleConfig {
  primaryColor: string;
  fontFamily: string;
}

export interface TranscriptTemplate {
  id: string;
  name: string;
  description: string | null;
  establishment_id: string;
  template_type: string;
  is_default: boolean | null;
  is_active: boolean | null;
  columns_config: TranscriptTemplateConfig | null;
  header_config: TranscriptHeaderConfig | null;
  footer_config: TranscriptFooterConfig | null;
  style_config: TranscriptStyleConfig | null;
  created_at: string;
  updated_at: string;
}

export const getTranscriptTemplate = async (formationId: string): Promise<TranscriptTemplate | null> => {
  // First try to get template linked via grading_rules
  const { data: rules } = await supabase
    .from('grading_rules')
    .select('transcript_template_id')
    .eq('formation_id', formationId)
    .maybeSingle();

  if (rules?.transcript_template_id) {
    const { data, error } = await supabase
      .from('transcript_templates')
      .select('*')
      .eq('id', rules.transcript_template_id)
      .single();
    if (!error && data) return data as unknown as TranscriptTemplate;
  }

  return null;
};

export const upsertTranscriptTemplate = async (
  template: Partial<TranscriptTemplate> & { establishment_id: string; name: string }
): Promise<TranscriptTemplate> => {
  const payload = {
    ...template,
    columns_config: template.columns_config ? JSON.parse(JSON.stringify(template.columns_config)) : null,
    header_config: template.header_config ? JSON.parse(JSON.stringify(template.header_config)) : null,
    footer_config: template.footer_config ? JSON.parse(JSON.stringify(template.footer_config)) : null,
    style_config: template.style_config ? JSON.parse(JSON.stringify(template.style_config)) : null,
  };

  if (template.id) {
    const { data, error } = await supabase
      .from('transcript_templates')
      .update(payload as any)
      .eq('id', template.id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as TranscriptTemplate;
  } else {
    const { data, error } = await supabase
      .from('transcript_templates')
      .insert(payload as any)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as TranscriptTemplate;
  }
};

export const linkTemplateToFormation = async (formationId: string, templateId: string): Promise<void> => {
  const { error } = await supabase
    .from('grading_rules')
    .upsert({ formation_id: formationId, transcript_template_id: templateId } as any, { onConflict: 'formation_id' });
  if (error) throw error;
};

// =====================================================
// LABELS & HELPERS
// =====================================================

export const EVALUATION_TYPES = [
  { value: 'controle_continu', label: 'Contrôle continu (CC)', category: 'cc' },
  { value: 'devoir_surveille', label: 'Devoir surveillé (DS)', category: 'cc' },
  { value: 'projet', label: 'Projet', category: 'cc' },
  { value: 'oral', label: 'Oral', category: 'cc' },
  { value: 'tp', label: 'Travaux pratiques (TP)', category: 'cc' },
  { value: 'partiel', label: 'Partiel', category: 'exam' },
  { value: 'examen_blanc', label: 'Examen blanc (BTS)', category: 'exam_blanc' },
  { value: 'examen_final', label: 'Examen final', category: 'exam' },
  { value: 'rattrapage', label: 'Rattrapage', category: 'exam' },
  { value: 'stage', label: 'Stage / Rapport', category: 'cc' },
];

export const FORMATION_TYPES = [
  { value: 'ecole_sup', label: 'École supérieure' },
  { value: 'universite', label: 'Université' },
  { value: 'bts', label: 'BTS' },
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

// =====================================================
// ESTABLISHMENT SIGNATORIES (custom signers per establishment)
// =====================================================

export interface EstablishmentSignatory {
  id: string;
  establishment_id: string;
  role_label: string;
  name: string | null;
  signature_image: string | null;
  is_stamp: boolean;
  order_index: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const getEstablishmentSignatories = async (
  establishmentId: string
): Promise<EstablishmentSignatory[]> => {
  const { data, error } = await (supabase as any)
    .from('establishment_signatories')
    .select('*')
    .eq('establishment_id', establishmentId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return (data || []) as EstablishmentSignatory[];
};

export const upsertEstablishmentSignatory = async (
  payload: Partial<EstablishmentSignatory> & { establishment_id: string; role_label: string }
): Promise<EstablishmentSignatory> => {
  // Strip read-only / server-managed fields and undefineds
  const clean: any = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v === undefined) continue;
    if (k === 'created_at' || k === 'updated_at') continue;
    clean[k] = v;
  }

  if (clean.id) {
    const id = clean.id;
    delete clean.id; // never update PK
    const { data, error } = await (supabase as any)
      .from('establishment_signatories')
      .update(clean)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as EstablishmentSignatory;
  }
  const { data, error } = await (supabase as any)
    .from('establishment_signatories')
    .insert(clean)
    .select()
    .single();
  if (error) throw error;
  return data as EstablishmentSignatory;
};

export const deleteEstablishmentSignatory = async (id: string): Promise<void> => {
  const { error } = await (supabase as any)
    .from('establishment_signatories')
    .delete()
    .eq('id', id);
  if (error) throw error;
};
