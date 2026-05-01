import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { resolveConfigForPeriod } from '@/services/bulletinConfigService';
import {
  computeStudentPeriodBulletin,
  pickMention,
} from '@/services/bulletinClientCalculator';
import {
  aggregateCombinedAverage,
  type CombinedPeriodConfig,
} from '@/services/combinedPeriodService';
import { DEFAULT_CONFIG, type ResolvedBulletinConfig } from '@/types/bulletinConfig';
import type { EvaluationPeriod } from '@/services/gradesService';

interface Props {
  combinedPeriod: EvaluationPeriod;
  combinedConfig: ResolvedBulletinConfig;
  sourcePeriods: EvaluationPeriod[];
  studentId: string;
  studentFullName: string;
  studentMatricule: string;
  studentDateOfBirth?: string | null;
  formationId: string;
  formationTitle: string;
  formationLevel?: string | null;
  academicYear: string;
  establishmentName: string;
  establishmentLogoUrl?: string | null;
  establishmentAddress?: string | null;
  establishmentPhone?: string | null;
  establishmentWebsite?: string | null;
  referenceNumber: string;
  signatories: any[];
  absenceStats?: { absences: number; lates: number; excused: number };
  instructorsByModuleId?: Map<string, string[]>;
}

// ─── Display columns: map evaluation_type → 4 visible columns ───
const TYPE_TO_COLUMN: Record<string, 'cc' | 'ds' | 'exam' | 'oral'> = {
  controle_continu: 'cc',
  projet: 'cc',
  tp: 'cc',
  autre: 'cc',
  devoir_surveille: 'ds',
  partiel: 'ds',
  partiels: 'ds',
  examen_final: 'exam',
  examen_blanc: 'exam',
  bts_blanc: 'exam',
  rattrapage: 'exam',
  oral: 'oral',
  soutenance: 'oral',
  stage: 'oral',
};

// Average several per-type values into one display column value
const colValue = (typeAverages: Record<string, number | null>, col: 'cc' | 'ds' | 'exam' | 'oral'): number | null => {
  const values: number[] = [];
  for (const [t, v] of Object.entries(typeAverages)) {
    if (v === null) continue;
    if (TYPE_TO_COLUMN[t] === col) values.push(v);
  }
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
};

const fmt = (v: number | null): string => (v === null ? '—' : v.toFixed(v === Math.floor(v) ? 0 : 2));

interface PeriodResult {
  period: EvaluationPeriod;
  config: ResolvedBulletinConfig;
  rows: Array<{
    moduleId: string;
    moduleTitle: string;
    coefficient: number;
    cc: number | null;
    ds: number | null;
    exam: number | null;
    oral: number | null;
    moy: number | null;
    eliminated: boolean;
  }>;
  general_average: number | null;
  mention: string | null;
  decision: string;
  admitted: boolean | null;
  rank: number | null;
  totalStudents: number | null;
}

const CombinedBulletinRenderer: React.FC<Props> = ({
  combinedPeriod,
  combinedConfig,
  sourcePeriods,
  studentId,
  studentFullName,
  studentMatricule,
  formationId,
  formationTitle,
  formationLevel,
  academicYear,
  establishmentName,
  establishmentLogoUrl,
  signatories,
}) => {
  const compositeConfig: CombinedPeriodConfig = (combinedPeriod.composite_config as any) || {
    calculation_rule: 'simple_average',
  };

  // Visual tokens (from combined period's own config)
  const INK = combinedConfig.design_config.primary_color || '#1a2654';
  const GOLD = combinedConfig.design_config.accent_color || '#c8a94e';
  const OK = combinedConfig.design_config.success_color || '#16a34a';
  const KO = combinedConfig.design_config.error_color || '#dc2626';
  const FONT = combinedConfig.design_config.font_family
    ? `"${combinedConfig.design_config.font_family}", Arial, sans-serif`
    : '"Inter", "Helvetica Neue", Arial, sans-serif';

  // ─── Load shared data ────────────────────────────────────
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

  // Total students for rank
  const { data: roster = [] } = useQuery({
    queryKey: ['combined-roster', formationId],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_formation_students', { formation_id_param: formationId });
      return (data || []) as any[];
    },
    enabled: !!formationId,
  });

  // ─── Compute per-period results ─────────────────────────
  const sourceResultsQ = useQuery<PeriodResult[]>({
    queryKey: ['combined-source-results', combinedPeriod.id, studentId, modules.length, roster.length],
    queryFn: async () => {
      if (modules.length === 0) return [];
      const moduleIds = modules.map((m: any) => m.id);
      const out: PeriodResult[] = [];

      for (const sp of sourcePeriods) {
        let cfg: ResolvedBulletinConfig = DEFAULT_CONFIG;
        try { cfg = await resolveConfigForPeriod(sp.id); } catch { /* keep default */ }

        const includedTypes = cfg.sources_config?.included_types || [];
        let evalQ = supabase
          .from('evaluations')
          .select('id, module_id, period_id, evaluation_type, scale')
          .in('module_id', moduleIds)
          .eq('period_id', sp.id);
        if (includedTypes.length > 0) evalQ = evalQ.in('evaluation_type', includedTypes);
        const { data: evals } = await evalQ;
        const evalIds = (evals || []).map((e: any) => e.id);

        // Load grades for all roster students (for class rank in this period)
        const studentIds = roster.map((s: any) => s.user_id);
        let allGrades: any[] = [];
        if (evalIds.length > 0 && studentIds.length > 0) {
          const { data } = await supabase
            .from('grades')
            .select('evaluation_id, student_id, value, is_absent, is_excused, is_dispensed, is_cheating')
            .in('evaluation_id', evalIds)
            .in('student_id', studentIds);
          allGrades = data || [];
        }

        // Compute current student
        const computed = computeStudentPeriodBulletin({
          studentId, config: cfg, modules: modules as any, evaluations: (evals || []) as any, grades: allGrades as any,
        });

        // Compute all students for rank
        const allAvgs: Array<{ studentId: string; avg: number | null }> = roster.map((s: any) => ({
          studentId: s.user_id,
          avg: computeStudentPeriodBulletin({
            studentId: s.user_id, config: cfg, modules: modules as any, evaluations: (evals || []) as any, grades: allGrades as any,
          }).general_average,
        }));
        const sorted = allAvgs.filter((x) => x.avg !== null).sort((a, b) => (b.avg || 0) - (a.avg || 0));
        const rankIdx = sorted.findIndex((x) => x.studentId === studentId);
        const rank = rankIdx >= 0 ? rankIdx + 1 : null;

        out.push({
          period: sp,
          config: cfg,
          rows: computed.modules.map((m) => ({
            moduleId: m.module_id,
            moduleTitle: m.module_title,
            coefficient: m.coefficient,
            cc: colValue(m.type_averages, 'cc'),
            ds: colValue(m.type_averages, 'ds'),
            exam: colValue(m.type_averages, 'exam'),
            oral: colValue(m.type_averages, 'oral'),
            moy: m.module_average,
            eliminated: m.eliminated,
          })),
          general_average: computed.general_average,
          mention: computed.mention,
          decision: computed.decision,
          admitted: computed.admitted,
          rank,
          totalStudents: roster.length || null,
        });
      }
      return out;
    },
    enabled: modules.length > 0 && sourcePeriods.length > 0,
  });

  const sourceResults = sourceResultsQ.data || [];

  // ─── Aggregate combined average ──────────────────────────
  const perPeriodAvg: Record<string, number | null> = {};
  for (const r of sourceResults) perPeriodAvg[r.period.id] = r.general_average;
  const combinedAverage = aggregateCombinedAverage(perPeriodAvg, compositeConfig);

  const admissionThreshold = combinedConfig.decision_rules?.admission_threshold ?? 10;
  const combinedAdmitted: boolean | null =
    combinedAverage === null ? null : combinedAverage >= admissionThreshold;
  const combinedDecisionLabel =
    combinedAdmitted === null ? (combinedConfig.decision_rules?.pending_label || 'EN COURS')
    : combinedAdmitted ? (combinedConfig.decision_rules?.admitted_label || 'ADMIS(E)')
    : (combinedConfig.decision_rules?.not_admitted_label || 'NON ADMIS(E)');
  const combinedMention = pickMention(combinedConfig, combinedAverage);

  const ruleLabel: Record<string, string> = {
    simple_average: 'Simple',
    weighted_average: 'Pondérée',
    weighted_by_coefficient: 'Par coefficient',
  };

  // For weighted display: each period's contribution
  const weights = compositeConfig.weights || {};
  const totalWeight = sourceResults.reduce((s, r) => s + (weights[r.period.id] ?? 1), 0) || 1;

  const finalLabel =
    compositeConfig.custom_label
    || combinedConfig.text_config.main_title
    || combinedPeriod.name;

  if (sourceResultsQ.isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: INK }} /></div>;
  }

  // Different colored table headers per period (cycle through 2 tones)
  const PERIOD_COLORS = [INK, '#1d4ed8', '#7c3aed', '#0891b2'];

  return (
    <div
      className="bg-white mx-auto"
      style={{
        maxWidth: '210mm',
        fontFamily: FONT,
        color: INK,
        border: `1px solid ${INK}`,
        borderRadius: 14,
        overflow: 'hidden',
      }}
      data-testid="combined-bulletin"
    >
      {/* ════════════════════════════════════════════════════ */}
      {/* HEADER : navy + gold accent line                     */}
      {/* ════════════════════════════════════════════════════ */}
      <div style={{ background: INK, color: '#fff', padding: '14px 18px', position: 'relative' }}>
        <div className="flex items-start justify-between gap-4">
          {/* Left: logo + name */}
          <div className="flex items-center gap-3">
            {establishmentLogoUrl ? (
              <img src={establishmentLogoUrl} alt="" style={{ height: 50, width: 50, borderRadius: 8, objectFit: 'contain', background: '#fff' }} crossOrigin="anonymous" />
            ) : (
              <div style={{ height: 50, width: 50, borderRadius: 8, background: GOLD, color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800 }}>
                {establishmentName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1 }}>{establishmentName}</p>
              <p style={{ fontSize: 10, opacity: 0.85, marginTop: 2 }}>
                Bulletin Annuel · {academicYear}
              </p>
            </div>
          </div>

          {/* Right: gold pill BULLETIN COMBINÉ */}
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                display: 'inline-block',
                background: GOLD,
                color: INK,
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: 1.5,
              }}
            >
              BULLETIN COMBINÉ
            </div>
            <p style={{ fontSize: 10, opacity: 0.85, marginTop: 4, fontStyle: 'italic' }}>
              {finalLabel}
            </p>
            <p style={{ fontSize: 9, opacity: 0.7 }}>
              {sourceResults.map((r) => r.period.name).join(' + ')}
            </p>
          </div>
        </div>
      </div>

      {/* Gold accent line */}
      <div style={{ height: 3, background: GOLD }} />

      {/* ════════════════════════════════════════════════════ */}
      {/* STUDENT IDENTITY ROW (5 cols)                         */}
      {/* ════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-5" style={{ background: '#f5f6fa', padding: '12px 18px', fontSize: 11 }}>
        <IdCell label="Nom & prénoms" value={studentFullName} />
        <IdCell label="Matricule" value={studentMatricule || '—'} />
        <IdCell label="Filière" value={formationTitle} />
        <IdCell label="Niveau" value={formationLevel || '—'} />
        <IdCell label="Année" value={academicYear} />
      </div>

      {/* ════════════════════════════════════════════════════ */}
      {/* PER-PERIOD COMPACT BLOCKS                             */}
      {/* ════════════════════════════════════════════════════ */}
      <div style={{ padding: '14px 18px' }}>
        {sourceResults.map((pr, idx) => {
          const headerColor = PERIOD_COLORS[idx % PERIOD_COLORS.length];
          const w = weights[pr.period.id] ?? 1;
          const weightPct =
            compositeConfig.calculation_rule === 'weighted_average'
              ? Math.round((w / totalWeight) * 100)
              : compositeConfig.calculation_rule === 'simple_average'
                ? Math.round((1 / sourceResults.length) * 100)
                : null;

          return (
            <div key={pr.period.id} style={{ marginBottom: idx === sourceResults.length - 1 ? 0 : 14 }} data-testid={`combined-source-bulletin-${idx}`}>
              {/* Period banner */}
              <div
                className="flex items-center justify-between"
                style={{
                  background: '#f1f3f8',
                  borderLeft: `5px solid ${headerColor}`,
                  padding: '8px 12px',
                  borderRadius: 4,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    style={{
                      background: headerColor,
                      color: '#fff',
                      padding: '4px 12px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.3,
                    }}
                  >
                    {pr.period.name}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{academicYear}</span>
                  {weightPct !== null && (
                    <span style={{ fontSize: 11, color: '#475569' }}>
                      Poids : <strong style={{ color: INK }}>{weightPct}%</strong>
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span style={{ fontSize: 18, fontWeight: 800, color: pr.general_average !== null && pr.general_average >= 10 ? INK : KO }}>
                    {fmt(pr.general_average)}
                  </span>
                  <span style={{ fontSize: 11, opacity: 0.7 }}>/20</span>
                  {pr.mention && <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 4 }}>{pr.mention}</span>}
                </div>
              </div>

              {/* Subjects table */}
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 11,
                  marginTop: 4,
                }}
              >
                <thead>
                  <tr style={{ background: headerColor, color: '#fff' }}>
                    <th style={th({ width: '32%', textAlign: 'left' })}>Matière</th>
                    <th style={th({ width: '10%' })}>CC</th>
                    <th style={th({ width: '10%' })}>DS</th>
                    <th style={th({ width: '14%' })}>Exam Final</th>
                    <th style={th({ width: '12%' })}>Oral/Sout.</th>
                    <th style={th({ width: '10%' })}>Moy.</th>
                    <th style={th({ width: '12%' })}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {pr.rows.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 14, textAlign: 'center', fontStyle: 'italic', color: '#64748b', background: '#fafafa' }}>Aucune donnée saisie pour cette période.</td></tr>
                  ) : pr.rows.map((row, i) => {
                    const validated = row.moy !== null && row.moy >= admissionThreshold && !row.eliminated;
                    const moyColor = row.moy === null ? '#94a3b8' : row.moy >= 14 ? OK : row.moy >= 10 ? '#1d4ed8' : KO;
                    return (
                      <tr key={row.moduleId} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                        <td style={{ ...td(), fontWeight: 600 }}>{row.moduleTitle}</td>
                        <td style={td({ textAlign: 'center', color: '#475569' })}>{row.cc !== null ? Math.round(row.cc) : '–'}</td>
                        <td style={td({ textAlign: 'center', color: '#475569' })}>{row.ds !== null ? Math.round(row.ds) : '–'}</td>
                        <td style={td({ textAlign: 'center', color: '#475569' })}>{row.exam !== null ? Math.round(row.exam) : '–'}</td>
                        <td style={td({ textAlign: 'center', color: '#7c3aed' })}>{row.oral !== null ? Math.round(row.oral) : '–'}</td>
                        <td style={{ ...td({ textAlign: 'center' }), fontWeight: 800, color: moyColor }}>{fmt(row.moy)}</td>
                        <td style={td({ textAlign: 'center' })}>
                          <span
                            style={{
                              fontSize: 10,
                              padding: '2px 8px',
                              borderRadius: 999,
                              background: validated ? '#dcfce7' : row.moy === null ? '#f1f5f9' : '#fee2e2',
                              color: validated ? '#15803d' : row.moy === null ? '#64748b' : '#b91c1c',
                              fontWeight: 600,
                            }}
                          >
                            {validated ? 'Validé' : row.moy === null ? '—' : 'Ajourné'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Period footer: rank + period avg + decision */}
              <div
                className="flex items-center justify-between"
                style={{
                  borderTop: `1px dashed #cbd5e1`,
                  fontSize: 11,
                  padding: '6px 4px',
                }}
              >
                <span style={{ color: '#64748b' }}>
                  Rang période : <strong style={{ color: INK }}>{pr.rank ? `${pr.rank}${pr.rank === 1 ? 'er' : 'ème'}` : '—'}{pr.totalStudents ? `/${pr.totalStudents}` : ''}</strong>
                </span>
                <span style={{ fontSize: 12, color: headerColor, fontWeight: 700 }}>
                  Moy. {pr.period.name} : {fmt(pr.general_average)}/20
                </span>
                <span
                  style={{
                    color: pr.admitted === true ? OK : pr.admitted === false ? KO : GOLD,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                  }}
                >
                  {pr.decision}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════ */}
      {/* FINAL RESULT CARD                                     */}
      {/* ════════════════════════════════════════════════════ */}
      <div style={{ padding: '0 18px 18px' }}>
        <div
          style={{
            border: `1.5px solid ${INK}`,
            borderRadius: 12,
            background: '#fbfbfd',
            overflow: 'hidden',
          }}
          data-testid="combined-final-section"
        >
          {/* Title */}
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${INK}22`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: INK, display: 'inline-block' }} />
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>
              Résultat combiné — {finalLabel}
            </p>
          </div>

          {/* 4 columns: Moyenne, Mention, Règle, Décision */}
          <div className="grid grid-cols-4" style={{ padding: '14px 0' }}>
            <Stat label="Moy. combinée" value={
              <span>
                <span style={{ fontSize: 30, fontWeight: 800, color: INK }}>{fmt(combinedAverage)}</span>
                <span style={{ fontSize: 13, color: '#64748b', marginLeft: 4 }}>/20</span>
              </span>
            } />
            <Stat label="Mention" value={
              <span style={{ fontSize: 18, fontWeight: 700, color: INK }}>{combinedMention || '—'}</span>
            } divider />
            <Stat label="Règle" value={
              <span style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>{ruleLabel[compositeConfig.calculation_rule] || compositeConfig.calculation_rule}</span>
            } divider />
            <Stat label="Décision finale" value={
              <span style={{ fontSize: 18, fontWeight: 800, color: combinedAdmitted === true ? OK : combinedAdmitted === false ? KO : GOLD, letterSpacing: 0.8 }}>
                {combinedDecisionLabel}
              </span>
            } divider />
          </div>

          {/* Calculation breakdown chips */}
          {combinedAverage !== null && (
            <div className="flex flex-wrap items-center justify-center gap-2" style={{ padding: '10px 14px', borderTop: `1px solid ${INK}22`, background: '#fff' }}>
              {sourceResults.map((pr) => {
                const w = compositeConfig.calculation_rule === 'weighted_average' ? (weights[pr.period.id] ?? 1) / totalWeight : 1 / sourceResults.length;
                const contrib = pr.general_average !== null ? Math.round(pr.general_average * w * 100) / 100 : null;
                return (
                  <span
                    key={pr.period.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#f1f5f9',
                      padding: '5px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: 999, background: INK }} />
                    <strong>{pr.period.name}</strong>
                    <span style={{ color: '#64748b' }}>{fmt(pr.general_average)}/20 × {Math.round(w * 100)}%</span>
                    <span style={{ color: '#475569' }}>= <strong style={{ color: INK }}>{fmt(contrib)}</strong></span>
                  </span>
                );
              })}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: INK,
                  color: '#fff',
                  padding: '5px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                = {fmt(combinedAverage)}/20
              </span>
            </div>
          )}

          {/* Signatures */}
          {signatories.length > 0 && (
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${Math.min(signatories.length, 4)}, 1fr)`,
                gap: 16,
                padding: '14px 16px',
                borderTop: `1px solid ${INK}22`,
                background: '#fff',
              }}
            >
              {signatories.slice(0, 4).map((s: any) => (
                <div key={s.id} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{s.role_label}</p>
                  <div style={{ height: 40, borderBottom: `1px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {s.signature_image && <img src={s.signature_image} alt="" style={{ maxHeight: 36, objectFit: 'contain' }} crossOrigin="anonymous" />}
                  </div>
                  {s.name && !s.is_stamp && <p style={{ fontSize: 10, fontWeight: 600, marginTop: 3 }}>{s.name}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Helpers ──────────────────────────────────────────
const IdCell: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 }}>
      {label}
    </p>
    <p style={{ fontSize: 12, fontWeight: 700 }}>{value}</p>
  </div>
);

const Stat: React.FC<{ label: string; value: React.ReactNode; divider?: boolean }> = ({ label, value, divider }) => (
  <div style={{ textAlign: 'center', padding: '4px 8px', borderLeft: divider ? '1px solid #e2e8f0' : 'none' }}>
    <p style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
      {label}
    </p>
    <div>{value}</div>
  </div>
);

const th = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  padding: '8px 8px',
  fontSize: 10,
  fontWeight: 700,
  textAlign: 'center',
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  ...extra,
});

const td = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  padding: '6px 8px',
  borderBottom: '1px solid #f1f5f9',
  ...extra,
});

export default CombinedBulletinRenderer;
