/**
 * Service for bulletin configuration CRUD + cascade resolution.
 *
 * Cascade order:
 *   system template → establishment → formation → period
 * (child overrides parent — handled in DB function `resolve_bulletin_config`)
 */
import { supabase } from '@/integrations/supabase/client';
import {
  DEFAULT_CONFIG,
  type BulletinConfiguration,
  type ResolvedBulletinConfig,
} from '@/types/bulletinConfig';

type ConfigScope =
  | { level: 'establishment'; establishmentId: string }
  | { level: 'formation'; formationId: string }
  | { level: 'period'; periodId: string };

/**
 * List all system templates available (BTS France, Licence, …).
 */
export async function listSystemTemplates(): Promise<BulletinConfiguration[]> {
  const { data, error } = await supabase
    .from('bulletin_configurations')
    .select('*')
    .eq('is_system_template', true)
    .order('name');
  if (error) throw error;
  return (data || []) as any;
}

/**
 * Get the raw config (without cascade) for a given scope. Returns null if
 * none is defined at that level.
 */
export async function getConfigByScope(scope: ConfigScope): Promise<BulletinConfiguration | null> {
  const q = (supabase as any).from('bulletin_configurations').select('*').eq('is_active', true);
  let promise;
  if (scope.level === 'period') {
    promise = q.eq('period_id', scope.periodId).is('formation_id', null).is('establishment_id', null).maybeSingle();
  } else if (scope.level === 'formation') {
    promise = q.eq('formation_id', scope.formationId).is('period_id', null).maybeSingle();
  } else {
    promise = q.eq('establishment_id', scope.establishmentId).is('formation_id', null).is('period_id', null).maybeSingle();
  }
  const { data, error } = await promise;
  if (error) throw error;
  return data as any;
}

/**
 * Resolve the full configuration for a given period (with cascade merge).
 * Always returns a usable config, falling back to DEFAULT_CONFIG for
 * any missing field.
 */
export async function resolveConfigForPeriod(periodId: string): Promise<ResolvedBulletinConfig> {
  const { data, error } = await supabase.rpc('resolve_bulletin_config', { period_id_param: periodId });
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('[bulletinConfigService] resolve_bulletin_config failed, using defaults:', error.message);
    return DEFAULT_CONFIG;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return DEFAULT_CONFIG;
  return {
    sources_config: { ...DEFAULT_CONFIG.sources_config, ...(row.sources_config || {}) },
    calculation_rules: { ...DEFAULT_CONFIG.calculation_rules, ...(row.calculation_rules || {}) },
    layout_config: {
      ...DEFAULT_CONFIG.layout_config,
      ...(row.layout_config || {}),
      sections: { ...DEFAULT_CONFIG.layout_config.sections, ...((row.layout_config || {}).sections || {}) },
    },
    design_config: { ...DEFAULT_CONFIG.design_config, ...(row.design_config || {}) },
    text_config: { ...DEFAULT_CONFIG.text_config, ...(row.text_config || {}) },
    signatures_config: { ...DEFAULT_CONFIG.signatures_config, ...(row.signatures_config || {}) },
    decision_rules: { ...DEFAULT_CONFIG.decision_rules, ...(row.decision_rules || {}) },
    source_chain: row.source_chain || [],
  };
}

/**
 * Upsert the bulletin configuration for a given scope.
 * If an existing config already exists for that exact scope, it is updated.
 */
export async function upsertConfig(
  scope: ConfigScope,
  patch: Partial<Omit<BulletinConfiguration, 'id' | 'created_at' | 'updated_at'>>,
): Promise<BulletinConfiguration> {
  const existing = await getConfigByScope(scope);

  if (existing) {
    const { data, error } = await (supabase as any)
      .from('bulletin_configurations')
      .update(patch)
      .eq('id', existing.id)
      .select('*')
      .single();
    if (error) throw error;
    return data as any;
  }

  // Insert new
  const insertPayload: any = {
    is_system_template: false,
    is_active: true,
    ...patch,
  };
  if (scope.level === 'period') insertPayload.period_id = scope.periodId;
  else if (scope.level === 'formation') insertPayload.formation_id = scope.formationId;
  else insertPayload.establishment_id = scope.establishmentId;

  if (!insertPayload.name) insertPayload.name = `Configuration ${scope.level}`;

  const { data, error } = await (supabase as any)
    .from('bulletin_configurations')
    .insert(insertPayload)
    .select('*')
    .single();
  if (error) throw error;
  return data as any;
}

/**
 * Clone a system template into a writable config at the given scope.
 * Useful for the "Choose a template at first use" onboarding step.
 */
export async function cloneTemplateToScope(
  templateId: string,
  scope: ConfigScope,
  customName?: string,
): Promise<BulletinConfiguration> {
  const { data: template, error: errT } = await (supabase as any)
    .from('bulletin_configurations')
    .select('*')
    .eq('id', templateId)
    .eq('is_system_template', true)
    .single();
  if (errT || !template) throw errT || new Error('Template introuvable');

  return upsertConfig(scope, {
    name: customName || `Copie de ${template.name}`,
    description: template.description,
    sources_config: template.sources_config,
    calculation_rules: template.calculation_rules,
    layout_config: template.layout_config,
    design_config: template.design_config,
    text_config: template.text_config,
    signatures_config: template.signatures_config,
    decision_rules: template.decision_rules,
  });
}

/**
 * Delete a config (e.g. to revert a period to its parent's config).
 */
export async function deleteConfig(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('bulletin_configurations')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/**
 * Pick the appropriate appreciation text for a given grade, based on the
 * config's appreciation_ranges.
 */
export function pickAppreciationForGrade(
  config: ResolvedBulletinConfig,
  grade: number | null,
): string {
  if (grade === null || grade === undefined) return '';
  const ranges = config.text_config.appreciation_ranges || [];
  for (const r of ranges) {
    if (grade >= r.min && grade < r.max) return r.text;
    if (grade === 20 && r.max === 20) return r.text;
  }
  return '';
}

/**
 * Pick the mention label for a given general average.
 */
export function pickMentionForAverage(
  config: ResolvedBulletinConfig,
  avg: number | null,
): string | null {
  if (avg === null || avg === undefined) return null;
  const mentions = config.decision_rules.mentions || [];
  // mentions are sorted high→low so we find the first threshold met
  const sorted = [...mentions].sort((a, b) => b.threshold - a.threshold);
  for (const m of sorted) {
    if (avg >= m.threshold) return m.label;
  }
  return null;
}

/**
 * Compute the decision label ("ADMIS(E)" / "NON ADMIS(E)" / "EN COURS") for
 * a given general average, honoring the configured admission threshold.
 */
export function pickDecisionForAverage(
  config: ResolvedBulletinConfig,
  avg: number | null,
): { admitted: boolean | null; label: string } {
  if (avg === null || avg === undefined) {
    return { admitted: null, label: config.decision_rules.pending_label || 'EN COURS' };
  }
  const threshold = config.decision_rules.admission_threshold ?? 10;
  if (avg >= threshold) {
    return { admitted: true, label: config.decision_rules.admitted_label || 'ADMIS(E)' };
  }
  return { admitted: false, label: config.decision_rules.not_admitted_label || 'NON ADMIS(E)' };
}
