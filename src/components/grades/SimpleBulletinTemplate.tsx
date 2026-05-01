import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  computeStudentPeriodBulletin,
} from '@/services/bulletinClientCalculator';
import type { ResolvedBulletinConfig } from '@/types/bulletinConfig';
import type { EvaluationPeriod } from '@/services/gradesService';

// Same column mapping as combined renderer
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

interface Props {
  period: EvaluationPeriod;
  config: ResolvedBulletinConfig;
  studentId: string;
  studentFullName: string;
  studentMatricule: string;
  formationId: string;
  formationTitle: string;
  formationLevel?: string | null;
  academicYear: string;
  establishmentName: string;
  establishmentLogoUrl?: string | null;
  referenceNumber: string;
  signatories: any[];
  /** Optional pre-computed instructor names per module (display only) */
  instructorsByModuleId?: Map<string, string[]>;
}

/**
 * Single-period bulletin rendered in the same compact, one-page style
 * used by the combined bulletin. Fully driven by the period's own
 * `bulletin_configurations` (colors, font, texts, signatures, sections).
 */
const SimpleBulletinTemplate: React.FC<Props> = ({
  period,
  config,
  studentId,
  studentFullName,
  studentMatricule,
  formationId,
  formationTitle,
  formationLevel,
  academicYear,
  establishmentName,
  establishmentLogoUrl,
  referenceNumber,
  signatories,
}) => {
  // Visual tokens (entirely from the resolved config)
  const INK = config.design_config.primary_color || '#1a2654';
  const GOLD = config.design_config.accent_color || '#c8a94e';
  const OK = config.design_config.success_color || '#16a34a';
  const KO = config.design_config.error_color || '#dc2626';
  const FONT = config.design_config.font_family
    ? `"${config.design_config.font_family}", Arial, sans-serif`
    : '"Inter", "Helvetica Neue", Arial, sans-serif';
  const sections = config.layout_config.sections || {};

  // ─── Load modules ────────────────────────────────────────
  const { data: modules = [] } = useQuery({
    queryKey: ['simple-bulletin-modules', formationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('formation_modules')
        .select('id, title, coefficient, order_index, teaching_unit_id, semester, credits')
        .eq('formation_id', formationId)
        .order('order_index');
      return (data || []) as any[];
    },
  });

  // ─── Load roster for class rank ─────────────────────────
  const { data: roster = [] } = useQuery({
    queryKey: ['simple-bulletin-roster', formationId],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_formation_students', { formation_id_param: formationId });
      return (data || []) as any[];
    },
    enabled: !!formationId,
  });

  // ─── Compute student bulletin for this single period ──
  const computedQ = useQuery({
    queryKey: ['simple-bulletin-compute', period.id, studentId, modules.length, roster.length, JSON.stringify(config.sources_config), JSON.stringify(config.calculation_rules)],
    queryFn: async () => {
      if (modules.length === 0) return null;
      const moduleIds = modules.map((m: any) => m.id);
      const includedTypes = config.sources_config?.included_types || [];

      let evalQ = supabase
        .from('evaluations')
        .select('id, module_id, period_id, evaluation_type, scale')
        .in('module_id', moduleIds)
        .eq('period_id', period.id);
      if (includedTypes.length > 0) evalQ = evalQ.in('evaluation_type', includedTypes);
      const { data: evals } = await evalQ;
      const evalIds = (evals || []).map((e: any) => e.id);

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

      const computed = computeStudentPeriodBulletin({
        studentId, config, modules: modules as any, evaluations: (evals || []) as any, grades: allGrades as any,
      });

      // Class rank
      const allAvgs = roster.map((s: any) => ({
        studentId: s.user_id,
        avg: computeStudentPeriodBulletin({
          studentId: s.user_id, config, modules: modules as any, evaluations: (evals || []) as any, grades: allGrades as any,
        }).general_average,
      }));
      const sorted = allAvgs.filter((x: any) => x.avg !== null).sort((a: any, b: any) => (b.avg || 0) - (a.avg || 0));
      const rankIdx = sorted.findIndex((x: any) => x.studentId === studentId);
      const rank = rankIdx >= 0 ? rankIdx + 1 : null;

      return {
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
      };
    },
    enabled: modules.length > 0,
  });

  const result = computedQ.data;
  const admissionThreshold = config.decision_rules?.admission_threshold ?? 10;

  if (computedQ.isLoading || !result) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: INK }} /></div>;
  }

  const mainTitle = config.text_config.main_title || 'BULLETIN';

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
        position: 'relative',
      }}
      data-testid="simple-bulletin"
    >
      {/* Watermark */}
      {config.design_config.watermark_enabled && config.design_config.watermark_text && (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            fontSize: 64,
            fontWeight: 900,
            letterSpacing: 8,
            color: INK,
            opacity: 0.05,
            transform: 'rotate(-22deg)',
            zIndex: 0,
          }}
        >
          {config.design_config.watermark_text}
        </span>
      )}

      {/* HEADER */}
      <div style={{ background: INK, color: '#fff', padding: '14px 18px', position: 'relative', zIndex: 1 }}>
        <div className="flex items-start justify-between gap-4">
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
                {period.name} · {academicYear}
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-block', background: GOLD, color: INK, padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 800, letterSpacing: 1.5 }}>
              {mainTitle.toUpperCase()}
            </div>
            <p style={{ fontSize: 10, opacity: 0.85, marginTop: 4, fontStyle: 'italic' }}>{period.name}</p>
            <p style={{ fontSize: 9, opacity: 0.7 }}>Réf : {referenceNumber}</p>
          </div>
        </div>
      </div>

      {/* Gold accent line */}
      <div style={{ height: 3, background: GOLD, position: 'relative', zIndex: 1 }} />

      {/* IDENTITY */}
      <div className="grid grid-cols-5" style={{ background: '#f5f6fa', padding: '12px 18px', fontSize: 11, position: 'relative', zIndex: 1 }}>
        <IdCell label="Nom & prénoms" value={studentFullName} />
        <IdCell label="Matricule" value={studentMatricule || '—'} />
        <IdCell label="Filière" value={formationTitle} />
        <IdCell label="Niveau" value={formationLevel || '—'} />
        <IdCell label="Année" value={academicYear} />
      </div>

      {/* PERIOD BLOCK */}
      <div style={{ padding: '14px 18px', position: 'relative', zIndex: 1 }}>
        <div
          className="flex items-center justify-between"
          style={{ background: '#f1f3f8', borderLeft: `5px solid ${INK}`, padding: '8px 12px', borderRadius: 4 }}
        >
          <div className="flex items-center gap-3">
            <span style={{ background: INK, color: '#fff', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}>
              {period.name}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600 }}>{academicYear}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span style={{ fontSize: 18, fontWeight: 800, color: result.general_average !== null && result.general_average >= admissionThreshold ? INK : KO }}>
              {fmt(result.general_average)}
            </span>
            <span style={{ fontSize: 11, opacity: 0.7 }}>/20</span>
            {result.mention && <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 4 }}>{result.mention}</span>}
          </div>
        </div>

        {/* Subjects table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginTop: 4 }}>
          <thead>
            <tr style={{ background: INK, color: '#fff' }}>
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
            {result.rows.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 14, textAlign: 'center', fontStyle: 'italic', color: '#64748b', background: '#fafafa' }}>Aucune donnée saisie pour cette période.</td></tr>
            ) : result.rows.map((row, i) => {
              const validated = row.moy !== null && row.moy >= admissionThreshold && !row.eliminated;
              const moyColor = row.moy === null ? '#94a3b8' : row.moy >= 14 ? OK : row.moy >= admissionThreshold ? '#1d4ed8' : KO;
              return (
                <tr key={row.moduleId} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                  <td style={{ ...td(), fontWeight: 600 }}>{row.moduleTitle}</td>
                  <td style={td({ textAlign: 'center', color: '#475569' })}>{row.cc !== null ? Math.round(row.cc) : '–'}</td>
                  <td style={td({ textAlign: 'center', color: '#475569' })}>{row.ds !== null ? Math.round(row.ds) : '–'}</td>
                  <td style={td({ textAlign: 'center', color: '#475569' })}>{row.exam !== null ? Math.round(row.exam) : '–'}</td>
                  <td style={td({ textAlign: 'center', color: '#7c3aed' })}>{row.oral !== null ? Math.round(row.oral) : '–'}</td>
                  <td style={{ ...td({ textAlign: 'center' }), fontWeight: 800, color: moyColor }}>{fmt(row.moy)}</td>
                  <td style={td({ textAlign: 'center' })}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: validated ? '#dcfce7' : row.moy === null ? '#f1f5f9' : '#fee2e2', color: validated ? '#15803d' : row.moy === null ? '#64748b' : '#b91c1c', fontWeight: 600 }}>
                      {validated ? 'Validé' : row.moy === null ? '—' : 'Ajourné'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer: rank + average + decision */}
        <div className="flex items-center justify-between" style={{ borderTop: `1px dashed #cbd5e1`, fontSize: 11, padding: '6px 4px' }}>
          <span style={{ color: '#64748b' }}>
            Rang période : <strong style={{ color: INK }}>{result.rank ? `${result.rank}${result.rank === 1 ? 'er' : 'ème'}` : '—'}{result.totalStudents ? `/${result.totalStudents}` : ''}</strong>
          </span>
          <span style={{ fontSize: 12, color: INK, fontWeight: 700 }}>
            Moyenne : {fmt(result.general_average)}/20
          </span>
          <span style={{ color: result.admitted === true ? OK : result.admitted === false ? KO : GOLD, fontWeight: 700, letterSpacing: 0.5 }}>
            {result.decision}
          </span>
        </div>
      </div>

      {/* SIGNATURES */}
      {sections.signatures !== false && signatories.length > 0 && (
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${Math.min(signatories.length, 4)}, 1fr)`,
            gap: 16,
            padding: '14px 18px',
            borderTop: `1px solid ${INK}22`,
            position: 'relative',
            zIndex: 1,
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

      {/* LEGAL NOTICE */}
      {sections.legal_notice !== false && (
        <div style={{ borderTop: `1px solid ${INK}22`, padding: '6px 16px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 9, color: '#64748b' }}>
            Document officiel — {establishmentName} — Réf : {referenceNumber} —{' '}
            {config.text_config.legal_notice || 'Bulletin certifié authentique.'}
          </p>
        </div>
      )}
    </div>
  );
};

const IdCell: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 }}>
      {label}
    </p>
    <p style={{ fontSize: 12, fontWeight: 700 }}>{value}</p>
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

export default SimpleBulletinTemplate;
