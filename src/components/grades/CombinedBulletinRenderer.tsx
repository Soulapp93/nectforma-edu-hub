import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import OfficialBulletinTemplate, { type OfficialBulletinData, type BulletinModuleRow } from './OfficialBulletinTemplate';
import { resolveConfigForPeriod } from '@/services/bulletinConfigService';
import {
  computeStudentPeriodBulletin,
  pickAppreciation,
} from '@/services/bulletinClientCalculator';
import {
  aggregateCombinedAverage,
  type CombinedPeriodConfig,
} from '@/services/combinedPeriodService';
import { DEFAULT_CONFIG, type ResolvedBulletinConfig } from '@/types/bulletinConfig';
import type { EvaluationPeriod } from '@/services/gradesService';

interface Props {
  combinedPeriod: EvaluationPeriod;
  /** Resolved config for the COMBINED period itself (controls the final summary section) */
  combinedConfig: ResolvedBulletinConfig;
  /** Source periods (already loaded by parent) */
  sourcePeriods: EvaluationPeriod[];
  /** Student to render the bulletin for */
  studentId: string;
  studentFullName: string;
  studentMatricule: string;
  studentDateOfBirth?: string | null;
  /** Formation context */
  formationId: string;
  formationTitle: string;
  formationLevel?: string | null;
  academicYear: string;
  /** Establishment context */
  establishmentName: string;
  establishmentLogoUrl?: string | null;
  establishmentAddress?: string | null;
  establishmentPhone?: string | null;
  establishmentWebsite?: string | null;
  /** Reference number for this bulletin */
  referenceNumber: string;
  /** Pre-fetched signatories (config-aware) */
  signatories: any[];
  /** Pre-fetched absence stats for this student */
  absenceStats?: { absences: number; lates: number; excused: number };
  /** Module instructors map (moduleId → list of instructor full names) */
  instructorsByModuleId?: Map<string, string[]>;
}

/**
 * Renders a combined bulletin: a vertical stack of each source period's
 * OfficialBulletinTemplate (with each one's own resolved config + grades)
 * followed by a final aggregated section governed by the combined period's
 * own config and `composite_config.calculation_rule`.
 */
const CombinedBulletinRenderer: React.FC<Props> = ({
  combinedPeriod,
  combinedConfig,
  sourcePeriods,
  studentId,
  studentFullName,
  studentMatricule,
  studentDateOfBirth,
  formationId,
  formationTitle,
  formationLevel,
  academicYear,
  establishmentName,
  establishmentLogoUrl,
  establishmentAddress,
  establishmentPhone,
  establishmentWebsite,
  referenceNumber,
  signatories,
  absenceStats,
  instructorsByModuleId,
}) => {
  const compositeConfig: CombinedPeriodConfig = (combinedPeriod.composite_config as any) || {
    calculation_rule: 'simple_average',
  };

  // ─── Fetch shared data: modules of the formation ────────────
  const { data: modules = [] } = useQuery({
    queryKey: ['combined-bulletin-modules', formationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('formation_modules')
        .select('id, title, coefficient, order_index, teaching_unit_id, semester, credits')
        .eq('formation_id', formationId)
        .order('order_index');
      return (data || []) as any[];
    },
  });

  // ─── For each source period: resolve config + load evaluations + grades + compute ──
  const sourceBulletinsQuery = useQuery({
    queryKey: ['combined-source-bulletins', combinedPeriod.id, studentId, modules.length],
    queryFn: async () => {
      if (modules.length === 0) return [];

      const moduleIds = modules.map((m: any) => m.id);
      const results: Array<{
        period: EvaluationPeriod;
        config: ResolvedBulletinConfig;
        bulletinData: OfficialBulletinData;
        generalAverage: number | null;
      }> = [];

      for (const sp of sourcePeriods) {
        // Resolve config for this source period
        let cfg: ResolvedBulletinConfig = DEFAULT_CONFIG;
        try {
          cfg = await resolveConfigForPeriod(sp.id);
        } catch {
          cfg = DEFAULT_CONFIG;
        }

        // Load evaluations of this period
        const includedTypes = cfg.sources_config?.included_types || [];
        let evalQ = supabase
          .from('evaluations')
          .select('id, module_id, period_id, evaluation_type, scale')
          .in('module_id', moduleIds)
          .eq('period_id', sp.id);
        if (includedTypes.length > 0) evalQ = evalQ.in('evaluation_type', includedTypes);
        const { data: evals } = await evalQ;

        // Load grades for this student for these evaluations
        const evalIds = (evals || []).map((e: any) => e.id);
        let grades: any[] = [];
        if (evalIds.length > 0) {
          const { data: g } = await supabase
            .from('grades')
            .select('evaluation_id, student_id, value, is_absent, is_excused, is_dispensed, is_cheating')
            .in('evaluation_id', evalIds)
            .eq('student_id', studentId);
          grades = g || [];
        }

        // Compute per-module averages for this student × this period
        const computed = computeStudentPeriodBulletin({
          studentId,
          config: cfg,
          modules: modules as any,
          evaluations: (evals || []) as any,
          grades: grades as any,
        });

        // Build the OfficialBulletinTemplate data for this period
        const rows: BulletinModuleRow[] = computed.modules.map((m) => ({
          moduleId: m.module_id,
          moduleName: m.module_title,
          instructorNames: instructorsByModuleId?.get(m.module_id) || [],
          average: m.module_average,
          coefficient: m.coefficient,
          appreciation: m.appreciation,
        }));

        const bulletinData: OfficialBulletinData = {
          establishmentName,
          establishmentLogoUrl: establishmentLogoUrl || undefined,
          establishmentAddress: establishmentAddress || undefined,
          establishmentPhone: establishmentPhone || undefined,
          establishmentWebsite: establishmentWebsite || undefined,
          studentFullName,
          studentMatricule,
          studentDateOfBirth,
          formationTitle,
          formationLevel,
          academicYear,
          periodTitle: sp.name,
          rows,
          generalAverage: computed.general_average,
          mention: computed.mention,
          absenceCount: absenceStats?.absences ?? 0,
          lateCount: absenceStats?.lates ?? 0,
          excusedAbsenceCount: absenceStats?.excused ?? 0,
          admitted: computed.admitted,
          generalAppreciation: pickAppreciation(cfg, computed.general_average),
          signatories: [],
          referenceNumber: `${referenceNumber}/${sp.name.substring(0, 4).toUpperCase()}`,
          mainTitle: cfg.text_config.main_title,
          legalNotice: cfg.text_config.legal_notice,
          decisionLabel: computed.decision,
          primaryColor: cfg.design_config.primary_color,
          accentColor: cfg.design_config.accent_color,
          successColor: cfg.design_config.success_color,
          errorColor: cfg.design_config.error_color,
          fontFamily: cfg.design_config.font_family,
          // Hide signatures + legal notice on each per-period block so they
          // appear only ONCE on the final summary section
          sectionsEnabled: { ...(cfg.layout_config.sections || {}), signatures: false, legal_notice: false },
        };

        results.push({
          period: sp,
          config: cfg,
          bulletinData,
          generalAverage: computed.general_average,
        });
      }

      return results;
    },
    enabled: modules.length > 0 && sourcePeriods.length > 0,
  });

  const sourceBulletins = sourceBulletinsQuery.data || [];

  // ─── Aggregate the combined average ─────────────────────────
  const perPeriodAverages: Record<string, number | null> = {};
  for (const sb of sourceBulletins) perPeriodAverages[sb.period.id] = sb.generalAverage;
  const combinedAverage = aggregateCombinedAverage(perPeriodAverages, compositeConfig);

  // Combined decision based on the COMBINED period's own config
  const admissionThreshold = combinedConfig.decision_rules?.admission_threshold ?? 10;
  let combinedAdmitted: boolean | null = null;
  if (combinedAverage !== null) combinedAdmitted = combinedAverage >= admissionThreshold;
  const combinedDecisionLabel =
    combinedAdmitted === null ? (combinedConfig.decision_rules?.pending_label || 'EN COURS')
    : combinedAdmitted ? (combinedConfig.decision_rules?.admitted_label || 'ADMIS(E)')
    : (combinedConfig.decision_rules?.not_admitted_label || 'NON ADMIS(E)');

  // Mention from combined config
  const sortedMentions = [...(combinedConfig.decision_rules?.mentions || [])].sort((a, b) => b.threshold - a.threshold);
  let combinedMention: string | null = null;
  if (combinedAverage !== null) {
    for (const m of sortedMentions) {
      if (combinedAverage >= m.threshold) { combinedMention = m.label; break; }
    }
  }

  // Color tokens for the final summary section
  const PRIMARY = combinedConfig.design_config.primary_color || '#7c3aed';
  const ACCENT = combinedConfig.design_config.accent_color || '#c8a94e';
  const OK = combinedConfig.design_config.success_color || '#16a34a';
  const KO = combinedConfig.design_config.error_color || '#dc2626';
  const FONT = combinedConfig.design_config.font_family || '"Times New Roman", Georgia, serif';
  const finalLabel = compositeConfig.custom_label || combinedConfig.text_config.main_title || combinedPeriod.name;

  if (sourceBulletinsQuery.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div data-testid="combined-bulletin">
      {/* ──────── Combined header banner ──────── */}
      <div
        className="mx-auto mb-4 px-4 py-3 text-center"
        style={{
          maxWidth: '210mm',
          background: `linear-gradient(135deg, ${PRIMARY} 0%, ${ACCENT} 200%)`,
          color: '#fff',
          fontFamily: FONT,
        }}
      >
        <p className="text-[10px] uppercase tracking-[3px] font-semibold opacity-80">Bulletin combiné</p>
        <p className="text-lg font-bold tracking-wide">{finalLabel}</p>
        <p className="text-[11px] opacity-90 mt-1">
          {sourceBulletins.length} périodes empilées · {studentFullName}
        </p>
      </div>

      {/* ──────── One bulletin per source period (vertical stack) ──────── */}
      <div className="space-y-6">
        {sourceBulletins.map((sb, idx) => (
          <div key={sb.period.id} data-testid={`combined-source-bulletin-${idx}`}>
            <div className="text-center mb-2">
              <span
                className="inline-block px-3 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  background: sb.config.design_config.primary_color || '#1a1a2e',
                  color: '#fff',
                }}
              >
                Bloc {idx + 1} / {sourceBulletins.length} — {sb.period.name}
              </span>
            </div>
            <OfficialBulletinTemplate data={sb.bulletinData} />
          </div>
        ))}
      </div>

      {/* ──────── Final aggregated section ──────── */}
      <div
        className="mx-auto mt-6 bg-white"
        style={{
          maxWidth: '210mm',
          fontFamily: FONT,
          color: PRIMARY,
          border: `2px solid ${PRIMARY}`,
        }}
        data-testid="combined-final-section"
      >
        {/* Header */}
        <div style={{ background: PRIMARY, color: '#fff', padding: '10px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>
            SYNTHÈSE — {finalLabel.toUpperCase()}
          </p>
          <p style={{ fontSize: 10, opacity: 0.85, marginTop: 2 }}>
            Règle de calcul : {compositeConfig.calculation_rule === 'simple_average'
              ? 'Moyenne simple des moyennes des périodes'
              : compositeConfig.calculation_rule === 'weighted_average'
                ? 'Moyenne pondérée des périodes'
                : 'Pondérée par coefficient des modules'}
          </p>
        </div>

        {/* Per-period summary table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: `${PRIMARY}15` }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `1px solid ${PRIMARY}33`, fontWeight: 700 }}>Période</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', borderBottom: `1px solid ${PRIMARY}33`, fontWeight: 700 }}>Moyenne</th>
              {compositeConfig.calculation_rule === 'weighted_average' && (
                <th style={{ padding: '8px 10px', textAlign: 'center', borderBottom: `1px solid ${PRIMARY}33`, fontWeight: 700 }}>Poids</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sourceBulletins.map((sb) => {
              const w = compositeConfig.weights?.[sb.period.id] ?? 1;
              return (
                <tr key={sb.period.id}>
                  <td style={{ padding: '6px 10px', borderBottom: `1px solid ${PRIMARY}22` }}>{sb.period.name}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'center', borderBottom: `1px solid ${PRIMARY}22`, fontWeight: 700, color: sb.generalAverage !== null && sb.generalAverage >= 10 ? OK : KO }}>
                    {sb.generalAverage !== null ? sb.generalAverage.toFixed(2) : '—'} / 20
                  </td>
                  {compositeConfig.calculation_rule === 'weighted_average' && (
                    <td style={{ padding: '6px 10px', textAlign: 'center', borderBottom: `1px solid ${PRIMARY}22`, fontWeight: 600 }}>
                      ×{w}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: `${PRIMARY}10`, fontWeight: 700 }}>
              <td style={{ padding: '10px 10px', textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5 }}>Moyenne combinée</td>
              <td style={{ padding: '10px 10px', textAlign: 'center', fontSize: 18, color: combinedAverage !== null && combinedAverage >= admissionThreshold ? OK : KO }}>
                {combinedAverage !== null ? combinedAverage.toFixed(2) : '—'} / 20
              </td>
              {compositeConfig.calculation_rule === 'weighted_average' && <td />}
            </tr>
          </tfoot>
        </table>

        {/* Decision strip */}
        <div className="grid grid-cols-2" style={{ borderTop: `2px solid ${PRIMARY}` }}>
          <div style={{ padding: '12px 16px', borderRight: `1px solid ${PRIMARY}33`, textAlign: 'center' }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Mention</p>
            <p style={{ fontSize: 14, fontWeight: 700 }}>{combinedMention || '—'}</p>
          </div>
          <div
            style={{
              padding: '12px 16px',
              textAlign: 'center',
              backgroundColor: combinedAdmitted === true ? '#f0fdf4' : combinedAdmitted === false ? '#fef2f2' : '#fffbeb',
            }}
          >
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Décision finale</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: combinedAdmitted === true ? OK : combinedAdmitted === false ? KO : ACCENT, letterSpacing: 1 }}>
              {combinedDecisionLabel}
            </p>
          </div>
        </div>

        {/* Signatures */}
        {signatories.length > 0 && (
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${Math.min(signatories.length, 4)}, 1fr)`,
              gap: 16,
              padding: '18px 16px',
              borderTop: `2px solid ${PRIMARY}`,
            }}
          >
            {signatories.map((s: any) => (
              <div key={s.id} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 4 }}>{s.role_label}</p>
                <div style={{ height: 50, borderBottom: `1px solid ${PRIMARY}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.signature_image && <img src={s.signature_image} alt="" style={{ maxHeight: 46, objectFit: 'contain' }} crossOrigin="anonymous" />}
                </div>
                {s.name && !s.is_stamp && <p style={{ fontSize: 10, fontWeight: 600, marginTop: 3 }}>{s.name}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Legal notice */}
        <div style={{ borderTop: `1px solid ${PRIMARY}33`, padding: '6px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 9, color: '#64748b' }}>
            Document officiel — {establishmentName} — Réf : {referenceNumber} —{' '}
            {combinedConfig.text_config.legal_notice || 'Bulletin combiné certifié authentique.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CombinedBulletinRenderer;
