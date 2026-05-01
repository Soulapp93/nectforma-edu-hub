/**
 * Client-side bulletin calculator (mirrors `compute-bulletin` Edge Function).
 *
 * Used when the Edge Function is unreachable AND for the combined-bulletin
 * renderer, which needs to compute per-source-period bulletins on the fly
 * before aggregating them.
 */
import type { ResolvedBulletinConfig, EvaluationTypeKey } from '@/types/bulletinConfig';

export interface MinimalEvaluation {
  id: string;
  module_id: string;
  period_id: string | null;
  evaluation_type: string;
  scale: number;
}

export interface MinimalGrade {
  evaluation_id: string;
  student_id: string;
  value: number | null;
  is_absent: boolean;
  is_excused: boolean;
  is_dispensed: boolean;
  is_cheating: boolean;
}

export interface MinimalModule {
  id: string;
  title: string;
  coefficient: number;
  teaching_unit_id?: string | null;
  credits?: number | null;
}

export interface ComputedModuleRow {
  module_id: string;
  module_title: string;
  coefficient: number;
  module_average: number | null;
  appreciation: string;
  eliminated: boolean;
}

export interface ComputedPeriodResult {
  general_average: number | null;
  modules: ComputedModuleRow[];
  mention: string | null;
  decision: string;
  admitted: boolean | null;
}

const roundTo = (n: number, d: number) => Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
const avg = (arr: number[]) => (arr.length === 0 ? null : arr.reduce((a, b) => a + b, 0) / arr.length);

/**
 * Pick the appreciation text for a grade.
 */
export function pickAppreciation(cfg: ResolvedBulletinConfig, grade: number | null): string {
  if (grade === null) return '';
  for (const r of cfg.text_config?.appreciation_ranges || []) {
    if (grade >= r.min && grade < r.max) return r.text;
    if (grade === 20 && r.max === 20) return r.text;
  }
  return '';
}

export function pickMention(cfg: ResolvedBulletinConfig, average: number | null): string | null {
  if (average === null) return null;
  const sorted = [...(cfg.decision_rules?.mentions || [])].sort((a, b) => b.threshold - a.threshold);
  for (const m of sorted) if (average >= m.threshold) return m.label;
  return null;
}

function combineTypes(buckets: Record<string, number[]>, sources: any): number | null {
  const includedTypes: string[] = sources?.included_types || [];
  const mode: string = sources?.combination_mode || 'weighted_average';
  const weights: Record<string, number> = sources?.type_weights || {};
  const typeAvgs: Array<{ mean: number; weight: number }> = [];
  for (const t of includedTypes) {
    const m = avg(buckets[t] || []);
    if (m === null) continue;
    typeAvgs.push({ mean: m, weight: weights[t] ?? 1 });
  }
  if (typeAvgs.length === 0) return null;
  if (mode === 'max') return Math.max(...typeAvgs.map((x) => x.mean));
  if (mode === 'min') return Math.min(...typeAvgs.map((x) => x.mean));
  if (mode === 'replacement') return typeAvgs[typeAvgs.length - 1].mean;
  // default weighted_average
  const tw = typeAvgs.reduce((s, x) => s + x.weight, 0);
  return tw === 0 ? null : typeAvgs.reduce((s, x) => s + x.mean * x.weight, 0) / tw;
}

/**
 * Compute one student's bulletin for a single period, given:
 *   - the period's resolved bulletin_configurations
 *   - the modules of the formation
 *   - the evaluations + grades (already filtered to this period)
 */
export function computeStudentPeriodBulletin(opts: {
  studentId: string;
  config: ResolvedBulletinConfig;
  modules: MinimalModule[];
  evaluations: MinimalEvaluation[];
  grades: MinimalGrade[];
}): ComputedPeriodResult {
  const { studentId, config, modules, evaluations, grades } = opts;
  const decimals = config.calculation_rules?.rounding_decimals ?? 2;
  const scale = config.calculation_rules?.scale ?? 20;
  const elim = config.calculation_rules?.eliminatory_note_threshold ?? null;
  const compensationAllowed = config.calculation_rules?.compensation_allowed !== false;
  const compensationScope = config.calculation_rules?.compensation_scope || 'all';
  const generalMethod = config.calculation_rules?.general_average_method || 'weighted_by_module_coefficient';
  const admissionThreshold = config.decision_rules?.admission_threshold ?? 10;
  const includedTypes = (config.sources_config?.included_types || []) as EvaluationTypeKey[];

  // Filter evaluations to included types only
  const filteredEvals = includedTypes.length > 0
    ? evaluations.filter((e) => includedTypes.includes(e.evaluation_type as EvaluationTypeKey))
    : evaluations;

  // Index grades: evalId → grade
  const gradesByEval = new Map<string, MinimalGrade>();
  for (const g of grades) {
    if (g.student_id !== studentId) continue;
    gradesByEval.set(g.evaluation_id, g);
  }

  const moduleResults: ComputedModuleRow[] = modules.map((mod) => {
    const modEvals = filteredEvals.filter((e) => e.module_id === mod.id);
    const buckets: Record<string, number[]> = {};
    let hasElim = false;
    for (const ev of modEvals) {
      const gr = gradesByEval.get(ev.id);
      if (!gr) continue;
      if (gr.is_absent || gr.is_dispensed) continue;
      if (gr.value === null || gr.value === undefined) continue;
      const raw = gr.is_cheating ? 0 : Number(gr.value);
      if (Number.isNaN(raw)) continue;
      const evScale = ev.scale || 20;
      const normalized = (raw / evScale) * scale;
      if (elim !== null && normalized < elim) hasElim = true;
      (buckets[ev.evaluation_type] ||= []).push(normalized);
    }
    const combined = combineTypes(buckets, config.sources_config);
    const moduleAverage = combined !== null ? roundTo(combined, decimals) : null;
    return {
      module_id: mod.id,
      module_title: mod.title,
      coefficient: mod.coefficient || 1,
      module_average: moduleAverage,
      appreciation: pickAppreciation(config, moduleAverage),
      eliminated: hasElim,
    };
  });

  // General average
  let generalAvg: number | null = null;
  const valid = moduleResults.filter((m) => m.module_average !== null);
  if (generalMethod === 'weighted_by_ects') {
    const sumCredits = valid.reduce((s, m) => {
      const c = (modules.find((x) => x.id === m.module_id) as any)?.credits || 0;
      return s + c;
    }, 0);
    const sumPts = valid.reduce((s, m) => {
      const c = (modules.find((x) => x.id === m.module_id) as any)?.credits || 0;
      return s + (m.module_average || 0) * c;
    }, 0);
    generalAvg = sumCredits > 0 ? roundTo(sumPts / sumCredits, decimals) : null;
  } else {
    const totalCoef = valid.reduce((s, m) => s + (m.coefficient || 0), 0);
    const sumPts = valid.reduce((s, m) => s + (m.module_average || 0) * (m.coefficient || 0), 0);
    generalAvg = totalCoef > 0 ? roundTo(sumPts / totalCoef, decimals) : null;
  }

  // Decision
  const hasElim = moduleResults.some((m) => m.eliminated);
  let admitted: boolean | null = null;
  if (generalAvg === null) admitted = null;
  else if (hasElim) admitted = false;
  else if (!compensationAllowed) {
    admitted = valid.every((m) => (m.module_average || 0) >= admissionThreshold) && generalAvg >= admissionThreshold;
  } else if (compensationScope === 'teaching_unit_only') {
    admitted = generalAvg >= admissionThreshold; // simplified: client doesn't have UE info
  } else {
    admitted = generalAvg >= admissionThreshold;
  }

  const decisionLabel =
    admitted === null ? (config.decision_rules?.pending_label || 'EN COURS')
    : admitted ? (config.decision_rules?.admitted_label || 'ADMIS(E)')
    : (config.decision_rules?.not_admitted_label || 'NON ADMIS(E)');

  return {
    general_average: generalAvg,
    modules: moduleResults,
    mention: pickMention(config, generalAvg),
    decision: decisionLabel,
    admitted,
  };
}
