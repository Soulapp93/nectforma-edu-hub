// =============================================================
// compute-bulletin Edge Function
// =============================================================
// Server-side calculation engine for school transcripts (bulletins).
// Consumes the per-period `bulletin_configurations` (cascade-resolved)
// and produces fully-computed module averages + general averages +
// class statistics + decisions + mentions for one or many students.
//
// Inputs:
//   { formation_id, period_id, student_ids? }
//
// Outputs:
//   {
//     config: ResolvedBulletinConfig,
//     source_periods: [...],
//     modules: [{ id, title, coefficient, ... }],
//     bulletins: [{
//       student_id, student_name,
//       modules: [{ module_id, module_average, type_averages, eliminated, appreciation }],
//       general_average, mention, decision, admitted,
//       class_stats: { general_average, rank }
//     }]
//   }
// =============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  requireAuthenticatedUser,
  createSupabaseAdmin,
  authErrorResponse,
  AuthError,
} from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Types (mirror src/types/bulletinConfig.ts) ────────────
type ResolvedConfig = {
  sources_config: any;
  calculation_rules: any;
  layout_config: any;
  design_config: any;
  text_config: any;
  signatures_config: any;
  decision_rules: any;
  source_chain?: any[];
};

interface ComputeRequest {
  formation_id: string;
  period_id: string;
  student_ids?: string[];
}

// ─── Calculation helpers ─────────────────────────────────────
function roundTo(n: number, decimals: number): number {
  const m = Math.pow(10, decimals);
  return Math.round(n * m) / m;
}

function avg(arr: number[]): number | null {
  const f = arr.filter((v) => typeof v === "number" && !Number.isNaN(v));
  if (f.length === 0) return null;
  return f.reduce((a, b) => a + b, 0) / f.length;
}

/**
 * Pick the appreciation text for a grade based on config ranges.
 */
function pickAppreciation(cfg: ResolvedConfig, grade: number | null): string {
  if (grade === null || grade === undefined) return "";
  const ranges: Array<{ min: number; max: number; text: string }> =
    cfg.text_config?.appreciation_ranges || [];
  for (const r of ranges) {
    if (grade >= r.min && grade < r.max) return r.text;
    if (grade === 20 && r.max === 20) return r.text;
  }
  return "";
}

/**
 * Pick the mention label for a general average.
 */
function pickMention(cfg: ResolvedConfig, avg: number | null): string | null {
  if (avg === null) return null;
  const mentions: Array<{ label: string; threshold: number }> =
    cfg.decision_rules?.mentions || [];
  const sorted = [...mentions].sort((a, b) => b.threshold - a.threshold);
  for (const m of sorted) {
    if (avg >= m.threshold) return m.label;
  }
  return null;
}

/**
 * Combine grades per evaluation_type using the configured combination_mode.
 *
 * @param typeBuckets map of evaluation_type -> array of grade values (already on /20)
 * @param sources sources_config block
 * @returns combined module average (/20) or null
 */
function combineTypes(
  typeBuckets: Record<string, number[]>,
  sources: any,
): number | null {
  const includedTypes: string[] = sources?.included_types || [];
  const mode: string = sources?.combination_mode || "weighted_average";
  const weights: Record<string, number> = sources?.type_weights || {};

  // Collect per-type means in the configured order
  const typeAvgs: Array<{ type: string; mean: number; weight: number }> = [];
  for (const t of includedTypes) {
    const grades = typeBuckets[t] || [];
    const m = avg(grades);
    if (m === null) continue;
    typeAvgs.push({ type: t, mean: m, weight: weights[t] ?? 1 });
  }

  if (typeAvgs.length === 0) return null;

  if (mode === "weighted_average") {
    const totalWeight = typeAvgs.reduce((s, x) => s + x.weight, 0);
    if (totalWeight === 0) return null;
    return typeAvgs.reduce((s, x) => s + x.mean * x.weight, 0) / totalWeight;
  }
  if (mode === "max") {
    return Math.max(...typeAvgs.map((x) => x.mean));
  }
  if (mode === "min") {
    return Math.min(...typeAvgs.map((x) => x.mean));
  }
  if (mode === "replacement") {
    // The later type in `included_types` replaces earlier ones — keep last
    return typeAvgs[typeAvgs.length - 1].mean;
  }
  return null;
}

// ─── Main handler ────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createSupabaseAdmin();
    const user = await requireAuthenticatedUser(req, supabaseAdmin);

    // Parse body
    const body = (await req.json()) as ComputeRequest;
    const { formation_id, period_id, student_ids } = body || ({} as ComputeRequest);
    if (!formation_id || !period_id) {
      throw new AuthError("formation_id et period_id requis", 400);
    }

    // ── Authorization: admin/staff of establishment OR student of formation ──
    const { data: formation } = await supabaseAdmin
      .from("formations")
      .select("id, title, establishment_id, duration_years, semesters_count, formation_type")
      .eq("id", formation_id)
      .maybeSingle();
    if (!formation) throw new AuthError("Formation introuvable", 404);

    const isStaff =
      user.isSuperAdmin ||
      (user.establishmentId === formation.establishment_id &&
        ["Admin", "AdminPrincipal", "Formateur"].includes(user.role || ""));

    if (!isStaff) {
      // Must be a student assigned to this formation, and only request own data
      const { data: assigned } = await supabaseAdmin
        .from("user_formation_assignments")
        .select("user_id")
        .eq("formation_id", formation_id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!assigned) throw new AuthError("Accès refusé", 403);
      if (student_ids && student_ids.length > 0 && !student_ids.includes(user.id)) {
        throw new AuthError("Un étudiant ne peut consulter que son propre bulletin", 403);
      }
    }

    // ── 1. Resolve bulletin configuration ─────────────────────
    const { data: cfgRows, error: cfgErr } = await supabaseAdmin.rpc(
      "resolve_bulletin_config",
      { period_id_param: period_id },
    );
    if (cfgErr) throw new Error(`resolve_bulletin_config: ${cfgErr.message}`);
    const cfg: ResolvedConfig = (Array.isArray(cfgRows) ? cfgRows[0] : cfgRows) || {
      sources_config: {},
      calculation_rules: {},
      layout_config: {},
      design_config: {},
      text_config: {},
      signatures_config: {},
      decision_rules: {},
    };

    // ── 2. Determine source periods (which periods feed this bulletin) ──
    const periodScope: string = cfg.sources_config?.period_scope || "current";
    const customPeriodIds: string[] = cfg.sources_config?.custom_period_ids || [];

    const { data: allPeriods } = await supabaseAdmin
      .from("evaluation_periods")
      .select("id, name, period_type, order_index")
      .eq("formation_id", formation_id)
      .order("order_index");

    const currentPeriod = (allPeriods || []).find((p: any) => p.id === period_id);
    let sourcePeriodIds: string[] = [period_id];

    if (periodScope === "all_up_to_current" && currentPeriod) {
      sourcePeriodIds = (allPeriods || [])
        .filter((p: any) => p.order_index <= currentPeriod.order_index)
        .map((p: any) => p.id);
    } else if (periodScope === "custom") {
      sourcePeriodIds = Array.from(new Set([...customPeriodIds, period_id]));
    }

    const sourcePeriodsInfo = (allPeriods || []).filter((p: any) =>
      sourcePeriodIds.includes(p.id),
    );

    // ── 3. Load modules + teaching units ─────────────────────
    const { data: modules } = await supabaseAdmin
      .from("formation_modules")
      .select("id, title, coefficient, order_index, teaching_unit_id, semester, credits")
      .eq("formation_id", formation_id)
      .order("order_index");

    const { data: teachingUnits } = await supabaseAdmin
      .from("teaching_units")
      .select("id, title, code, coefficient, credits, order_index")
      .eq("formation_id", formation_id)
      .order("order_index");

    // ── 4. Load students ─────────────────────────────────────
    const { data: rosterRaw } = await supabaseAdmin.rpc("get_formation_students", {
      formation_id_param: formation_id,
    });
    let students = (rosterRaw || []) as any[];
    if (student_ids && student_ids.length > 0) {
      students = students.filter((s: any) => student_ids.includes(s.user_id));
    }
    if (!isStaff) {
      students = students.filter((s: any) => s.user_id === user.id);
    }

    // ── 5. Load evaluations (filtered by source periods + included types) ──
    const includedTypes: string[] = cfg.sources_config?.included_types || [];
    let evalQuery = supabaseAdmin
      .from("evaluations")
      .select("id, module_id, period_id, evaluation_type, scale, coefficient");
    const moduleIds = (modules || []).map((m: any) => m.id);
    if (moduleIds.length > 0) evalQuery = evalQuery.in("module_id", moduleIds);
    if (sourcePeriodIds.length > 0) evalQuery = evalQuery.in("period_id", sourcePeriodIds);
    if (includedTypes.length > 0) evalQuery = evalQuery.in("evaluation_type", includedTypes);
    const { data: evaluations } = await evalQuery;

    // ── 6. Load grades for these evaluations × students ──
    const evalIds = (evaluations || []).map((e: any) => e.id);
    const studentIds = students.map((s: any) => s.user_id);
    let grades: any[] = [];
    if (evalIds.length > 0 && studentIds.length > 0) {
      const { data: g } = await supabaseAdmin
        .from("grades")
        .select("evaluation_id, student_id, value, is_absent, is_excused, is_dispensed, is_cheating")
        .in("evaluation_id", evalIds)
        .in("student_id", studentIds);
      grades = g || [];
    }

    // Index grades: evalId -> studentId -> grade
    const gradesByEvalStudent = new Map<string, Map<string, any>>();
    for (const g of grades) {
      const m = gradesByEvalStudent.get(g.evaluation_id) || new Map<string, any>();
      m.set(g.student_id, g);
      gradesByEvalStudent.set(g.evaluation_id, m);
    }

    // ── 7. Per-student calculation ─────────────────────────────
    const decimals = cfg.calculation_rules?.rounding_decimals ?? 2;
    const scale = cfg.calculation_rules?.scale ?? 20;
    const elimThreshold: number | null =
      cfg.calculation_rules?.eliminatory_note_threshold ?? null;
    const compensationAllowed = cfg.calculation_rules?.compensation_allowed !== false;
    const compensationScope: string =
      cfg.calculation_rules?.compensation_scope || "all";
    const generalMethod: string =
      cfg.calculation_rules?.general_average_method || "weighted_by_module_coefficient";
    const admissionThreshold: number =
      cfg.decision_rules?.admission_threshold ?? 10;

    interface ModuleResult {
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

    interface StudentBulletin {
      student_id: string;
      student_name: string;
      student_email: string;
      modules: ModuleResult[];
      general_average: number | null;
      ue_averages: Array<{ id: string; title: string; average: number | null; coefficient: number; credits: number | null }>;
      mention: string | null;
      decision: string;
      admitted: boolean | null;
      eliminated: boolean;
      validated_credits: number;
      total_credits: number;
      class_general_average: number | null;
      class_rank: number | null;
    }

    /**
     * Compute one (student × module) result.
     */
    const computeStudentModule = (
      studentId: string,
      mod: any,
    ): ModuleResult => {
      const modEvals = (evaluations || []).filter((e: any) => e.module_id === mod.id);

      // Group student grades by evaluation_type, normalized to /20
      const typeBuckets: Record<string, number[]> = {};
      let hasEliminatory = false;
      for (const ev of modEvals) {
        const m = gradesByEvalStudent.get(ev.id);
        const gr = m?.get(studentId);
        if (!gr) continue;
        if (gr.is_absent || gr.is_dispensed) continue;
        if (gr.value === null || gr.value === undefined) continue;
        // Cheating → 0
        const raw: number = gr.is_cheating ? 0 : Number(gr.value);
        if (Number.isNaN(raw)) continue;
        const evScale = ev.scale || 20;
        const normalized = (raw / evScale) * scale;
        if (elimThreshold !== null && normalized < elimThreshold) {
          hasEliminatory = true;
        }
        const type = ev.evaluation_type;
        (typeBuckets[type] ||= []).push(normalized);
      }

      // Per-type means (rounded to display)
      const typeAverages: Record<string, number | null> = {};
      for (const t of Object.keys(typeBuckets)) {
        const m = avg(typeBuckets[t]);
        typeAverages[t] = m !== null ? roundTo(m, decimals) : null;
      }

      // Combine into module average via configured combination_mode
      const combined = combineTypes(typeBuckets, cfg.sources_config);
      const moduleAverage = combined !== null ? roundTo(combined, decimals) : null;

      return {
        module_id: mod.id,
        module_title: mod.title,
        coefficient: mod.coefficient || 1,
        teaching_unit_id: mod.teaching_unit_id,
        type_averages: typeAverages,
        module_average: moduleAverage,
        eliminated: hasEliminatory,
        appreciation: pickAppreciation(cfg, moduleAverage),
        class_min: null,
        class_max: null,
        class_average: null,
      };
    };

    // First pass: compute every (student × module) result
    const studentResults = new Map<string, ModuleResult[]>();
    for (const s of students) {
      const mods = (modules || []).map((m: any) => computeStudentModule(s.user_id, m));
      studentResults.set(s.user_id, mods);
    }

    // Class statistics per module (min/max/avg)
    for (const mod of (modules || []) as any[]) {
      const allAvgs: number[] = [];
      for (const s of students) {
        const r = studentResults.get(s.user_id)!.find((x) => x.module_id === mod.id);
        if (r?.module_average !== null && r?.module_average !== undefined) {
          allAvgs.push(r.module_average);
        }
      }
      const cAvg = avg(allAvgs);
      const cMin = allAvgs.length ? Math.min(...allAvgs) : null;
      const cMax = allAvgs.length ? Math.max(...allAvgs) : null;
      for (const s of students) {
        const r = studentResults.get(s.user_id)!.find((x) => x.module_id === mod.id);
        if (r) {
          r.class_min = cMin !== null ? roundTo(cMin, decimals) : null;
          r.class_max = cMax !== null ? roundTo(cMax, decimals) : null;
          r.class_average = cAvg !== null ? roundTo(cAvg, decimals) : null;
        }
      }
    }

    // Compute general average + decisions per student
    const bulletins: StudentBulletin[] = students.map((s: any) => {
      const mods = studentResults.get(s.user_id) || [];

      // ── UE averages (regroupement par teaching_unit) ──
      const ueMap = new Map<
        string,
        { id: string; title: string; coefficient: number; credits: number | null; mods: ModuleResult[] }
      >();
      for (const m of mods) {
        const ueId = m.teaching_unit_id || "_ungrouped";
        const ue = (teachingUnits || []).find((u: any) => u.id === ueId);
        const entry = ueMap.get(ueId) || {
          id: ueId,
          title: ue?.title || "Matières",
          coefficient: ue?.coefficient || 0,
          credits: ue?.credits ?? null,
          mods: [],
        };
        entry.mods.push(m);
        ueMap.set(ueId, entry);
      }
      const ueAverages = Array.from(ueMap.values()).map((u) => {
        const valid = u.mods.filter((m) => m.module_average !== null);
        const totalCoef = valid.reduce((acc, m) => acc + (m.coefficient || 0), 0);
        const sumPts = valid.reduce(
          (acc, m) => acc + (m.module_average || 0) * (m.coefficient || 0),
          0,
        );
        const ueAvg = totalCoef > 0 ? roundTo(sumPts / totalCoef, decimals) : null;
        return { id: u.id, title: u.title, average: ueAvg, coefficient: u.coefficient, credits: u.credits };
      });

      // ── General average (according to method) ──
      let generalAvg: number | null = null;
      if (generalMethod === "weighted_by_module_coefficient") {
        const valid = mods.filter((m) => m.module_average !== null);
        const totalCoef = valid.reduce((acc, m) => acc + (m.coefficient || 0), 0);
        const sumPts = valid.reduce(
          (acc, m) => acc + (m.module_average || 0) * (m.coefficient || 0),
          0,
        );
        generalAvg = totalCoef > 0 ? roundTo(sumPts / totalCoef, decimals) : null;
      } else if (generalMethod === "weighted_by_ects") {
        const valid = mods.filter((m) => m.module_average !== null);
        const sumCredits = valid.reduce((acc, m) => {
          const credits = ((modules || []).find((x: any) => x.id === m.module_id) as any)?.credits || 0;
          return acc + credits;
        }, 0);
        const sumPts = valid.reduce((acc, m) => {
          const credits = ((modules || []).find((x: any) => x.id === m.module_id) as any)?.credits || 0;
          return acc + (m.module_average || 0) * credits;
        }, 0);
        generalAvg = sumCredits > 0 ? roundTo(sumPts / sumCredits, decimals) : null;
      } else if (generalMethod === "average_of_teaching_units") {
        const valid = ueAverages.filter((u) => u.average !== null);
        const totalCoef = valid.reduce((acc, u) => acc + (u.coefficient || 1), 0);
        const sumPts = valid.reduce(
          (acc, u) => acc + (u.average || 0) * (u.coefficient || 1),
          0,
        );
        generalAvg = totalCoef > 0 ? roundTo(sumPts / totalCoef, decimals) : null;
      }

      // ── Eliminatory check ──
      const hasElim = mods.some((m) => m.eliminated);

      // ── Decision: admis / non admis ──
      let admitted: boolean | null = null;
      let admittedLabel = cfg.decision_rules?.admitted_label || "ADMIS(E)";
      let notAdmittedLabel = cfg.decision_rules?.not_admitted_label || "NON ADMIS(E)";
      let pendingLabel = cfg.decision_rules?.pending_label || "EN COURS";

      if (generalAvg === null) {
        admitted = null;
      } else if (hasElim) {
        admitted = false;
      } else if (!compensationAllowed) {
        // Every module must be ≥ admissionThreshold
        const allValid = mods
          .filter((m) => m.module_average !== null)
          .every((m) => (m.module_average || 0) >= admissionThreshold);
        admitted = allValid && generalAvg >= admissionThreshold;
      } else if (compensationScope === "teaching_unit_only") {
        // Each UE must individually be ≥ admissionThreshold
        const allUeValid = ueAverages
          .filter((u) => u.average !== null)
          .every((u) => (u.average || 0) >= admissionThreshold);
        admitted = allUeValid && generalAvg >= admissionThreshold;
      } else {
        // compensation_scope = 'all'
        admitted = generalAvg >= admissionThreshold;
      }

      const decisionLabel =
        admitted === null ? pendingLabel : admitted ? admittedLabel : notAdmittedLabel;

      // ── Validated credits ──
      let validatedCredits = 0;
      let totalCredits = 0;
      for (const m of mods) {
        const credits = ((modules || []).find((x: any) => x.id === m.module_id) as any)?.credits || 0;
        totalCredits += credits;
        if (m.module_average !== null && m.module_average >= admissionThreshold && !m.eliminated) {
          validatedCredits += credits;
        }
      }

      return {
        student_id: s.user_id,
        student_name: `${s.last_name || ""} ${s.first_name || ""}`.trim(),
        student_email: s.email || "",
        modules: mods,
        general_average: generalAvg,
        ue_averages: ueAverages,
        mention: pickMention(cfg, generalAvg),
        decision: decisionLabel,
        admitted,
        eliminated: hasElim,
        validated_credits: validatedCredits,
        total_credits: totalCredits,
        class_general_average: null,
        class_rank: null,
      };
    });

    // Class general average + rank
    const classGenAvgs = bulletins
      .map((b) => b.general_average)
      .filter((v): v is number => v !== null);
    const classGenAvg = avg(classGenAvgs);
    const sortedByGen = [...bulletins]
      .filter((b) => b.general_average !== null)
      .sort((a, b) => (b.general_average || 0) - (a.general_average || 0));
    for (const b of bulletins) {
      b.class_general_average = classGenAvg !== null ? roundTo(classGenAvg, decimals) : null;
      const idx = sortedByGen.findIndex((x) => x.student_id === b.student_id);
      b.class_rank = idx >= 0 ? idx + 1 : null;
    }

    return new Response(
      JSON.stringify({
        success: true,
        config: cfg,
        formation: {
          id: formation.id,
          title: formation.title,
          formation_type: formation.formation_type,
        },
        period: currentPeriod,
        source_periods: sourcePeriodsInfo,
        modules: modules || [],
        teaching_units: teachingUnits || [],
        bulletins,
        meta: {
          total_students: bulletins.length,
          source_period_count: sourcePeriodIds.length,
          included_types: includedTypes,
          combination_mode: cfg.sources_config?.combination_mode || "weighted_average",
          general_average_method: generalMethod,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return authErrorResponse(e, corsHeaders);
  }
});
