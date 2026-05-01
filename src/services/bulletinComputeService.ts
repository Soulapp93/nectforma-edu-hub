/**
 * Service to call the `compute-bulletin` Edge Function.
 *
 * Returns the fully-computed bulletins for one period (or all students in a
 * formation), honoring the cascade-resolved `bulletin_configurations`.
 */
import { supabase } from '@/integrations/supabase/client';
import type { ResolvedBulletinConfig } from '@/types/bulletinConfig';

export interface ComputedModuleResult {
  module_id: string;
  module_title: string;
  coefficient: number;
  teaching_unit_id: string | null;
  type_averages: Record<string, number | null>;
  module_average: number | null;
  eliminated: boolean;
  appreciation: string;
  class_min: number | null;
  class_max: number | null;
  class_average: number | null;
}

export interface ComputedUeAverage {
  id: string;
  title: string;
  average: number | null;
  coefficient: number;
  credits: number | null;
}

export interface ComputedStudentBulletin {
  student_id: string;
  student_name: string;
  student_email: string;
  modules: ComputedModuleResult[];
  general_average: number | null;
  ue_averages: ComputedUeAverage[];
  mention: string | null;
  decision: string;
  admitted: boolean | null;
  eliminated: boolean;
  validated_credits: number;
  total_credits: number;
  class_general_average: number | null;
  class_rank: number | null;
}

export interface ComputeBulletinResponse {
  success: true;
  config: ResolvedBulletinConfig;
  formation: { id: string; title: string; formation_type: string | null };
  period: { id: string; name: string; period_type: string; order_index: number } | null;
  source_periods: Array<{ id: string; name: string; period_type: string; order_index: number }>;
  modules: Array<{
    id: string;
    title: string;
    coefficient: number;
    order_index: number;
    teaching_unit_id: string | null;
    semester: number | null;
    credits: number | null;
  }>;
  teaching_units: Array<{ id: string; title: string; code: string | null; coefficient: number; credits: number | null; order_index: number }>;
  bulletins: ComputedStudentBulletin[];
  meta: {
    total_students: number;
    source_period_count: number;
    included_types: string[];
    combination_mode: string;
    general_average_method: string;
  };
}

/**
 * Invoke the compute-bulletin Edge Function with the user's JWT.
 */
export async function computeBulletins(input: {
  formation_id: string;
  period_id: string;
  student_ids?: string[];
}): Promise<ComputeBulletinResponse> {
  const { data, error } = await supabase.functions.invoke<ComputeBulletinResponse>(
    'compute-bulletin',
    { body: input },
  );
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[bulletinComputeService] compute-bulletin failed:', error);
    throw new Error(error.message || 'Erreur lors du calcul du bulletin');
  }
  if (!data) throw new Error('Aucune donnée retournée');
  return data;
}
