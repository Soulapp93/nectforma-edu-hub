/**
 * Combined evaluation periods service.
 *
 * A "combined period" aggregates the bulletins of 2+ source periods (e.g.
 * Semestre 1 + Semestre 2 → "Année complète"). It is rendered as a
 * vertical stack of each source period's bulletin (with its own config)
 * plus a final summary section governed by the combined period's own
 * `bulletin_configurations` entry.
 */
import { supabase } from '@/integrations/supabase/client';
import type { EvaluationPeriod } from './gradesService';

export type CombinedCalculationRule =
  | 'simple_average'              // mean of the periods' general averages
  | 'weighted_average'            // weighted by per-period weights
  | 'weighted_by_coefficient';    // sum(module_avg × coef) across all periods / sum(coefs)

export interface CombinedPeriodConfig {
  calculation_rule: CombinedCalculationRule;
  /** Weight per source period (only used when calculation_rule = 'weighted_average') */
  weights?: Record<string, number>;
  /** Custom label for the final aggregated section (defaults to period name) */
  custom_label?: string;
}

export interface CombinedPeriodInput {
  formation_id: string;
  name: string;
  start_date: string;
  end_date: string;
  combined_period_ids: string[];
  config: CombinedPeriodConfig;
}

/**
 * Create a new combined period. The order_index is auto-set after the
 * highest existing period for this formation.
 */
export async function createCombinedPeriod(input: CombinedPeriodInput): Promise<EvaluationPeriod> {
  // Compute next order_index
  const { data: existing } = await supabase
    .from('evaluation_periods')
    .select('order_index')
    .eq('formation_id', input.formation_id)
    .order('order_index', { ascending: false })
    .limit(1);
  const nextOrder = ((existing?.[0]?.order_index as number) || 0) + 1;

  const { data, error } = await (supabase as any)
    .from('evaluation_periods')
    .insert({
      formation_id: input.formation_id,
      name: input.name,
      period_type: 'combined',
      start_date: input.start_date,
      end_date: input.end_date,
      order_index: nextOrder,
      is_composite: true,
      combined_period_ids: input.combined_period_ids,
      composite_config: input.config,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as EvaluationPeriod;
}

/**
 * Update an existing combined period (label, dates, sources, calculation rule).
 */
export async function updateCombinedPeriod(
  id: string,
  patch: Partial<{
    name: string;
    start_date: string;
    end_date: string;
    combined_period_ids: string[];
    config: CombinedPeriodConfig;
  }>,
): Promise<EvaluationPeriod> {
  const updateData: any = {};
  if (patch.name !== undefined) updateData.name = patch.name;
  if (patch.start_date !== undefined) updateData.start_date = patch.start_date;
  if (patch.end_date !== undefined) updateData.end_date = patch.end_date;
  if (patch.combined_period_ids !== undefined) updateData.combined_period_ids = patch.combined_period_ids;
  if (patch.config !== undefined) updateData.composite_config = patch.config;

  const { data, error } = await (supabase as any)
    .from('evaluation_periods')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as EvaluationPeriod;
}

/**
 * Resolve the source periods of a combined period via the SQL helper.
 * Falls back to a direct query if the helper RPC isn't available
 * (e.g. migration not yet applied in production).
 */
export async function getCombinedSourcePeriods(combinedPeriodId: string): Promise<EvaluationPeriod[]> {
  const { data, error } = await supabase.rpc('get_combined_source_periods', {
    combined_period_id: combinedPeriodId,
  });
  if (!error && data) return data as unknown as EvaluationPeriod[];

  // Fallback: read combined_period_ids directly + fetch periods
  const { data: parent } = await supabase
    .from('evaluation_periods')
    .select('combined_period_ids')
    .eq('id', combinedPeriodId)
    .maybeSingle();
  const ids = ((parent as any)?.combined_period_ids || []) as string[];
  if (ids.length === 0) return [];
  const { data: rows } = await supabase
    .from('evaluation_periods')
    .select('*')
    .in('id', ids)
    .order('order_index');
  return (rows || []) as unknown as EvaluationPeriod[];
}

/**
 * Aggregate per-period general averages into a single combined average,
 * according to the calculation_rule of the combined period.
 *
 * @param perPeriodAvg map of source_period_id → general_average (or null)
 * @param config combined period's calculation config
 * @returns aggregated average (or null if no usable data)
 */
export function aggregateCombinedAverage(
  perPeriodAvg: Record<string, number | null>,
  config: CombinedPeriodConfig,
): number | null {
  const entries = Object.entries(perPeriodAvg).filter(([, v]) => v !== null) as Array<[string, number]>;
  if (entries.length === 0) return null;

  if (config.calculation_rule === 'simple_average') {
    const sum = entries.reduce((acc, [, v]) => acc + v, 0);
    return Math.round((sum / entries.length) * 100) / 100;
  }
  if (config.calculation_rule === 'weighted_average') {
    const w = config.weights || {};
    const totalWeight = entries.reduce((s, [pid]) => s + (w[pid] ?? 1), 0);
    if (totalWeight === 0) return null;
    const sumWeighted = entries.reduce((s, [pid, v]) => s + v * (w[pid] ?? 1), 0);
    return Math.round((sumWeighted / totalWeight) * 100) / 100;
  }
  // weighted_by_coefficient is computed at module-level upstream — fallback to simple avg
  const sum = entries.reduce((acc, [, v]) => acc + v, 0);
  return Math.round((sum / entries.length) * 100) / 100;
}
