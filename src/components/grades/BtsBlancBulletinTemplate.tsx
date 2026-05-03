import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { computeStudentPeriodBulletin } from '@/services/bulletinClientCalculator';
import { getStudentAttendanceForRanges, type DateRange } from '@/services/periodAttendanceService';
import BulletinSharedHeader from './BulletinSharedHeader';
import type { ResolvedBulletinConfig } from '@/types/bulletinConfig';
import type { EvaluationPeriod } from '@/services/gradesService';

const fmt2 = (v: number | null): string => (v === null ? '0,00' : v.toFixed(2).replace('.', ','));

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
  /** Source periods if combined (used for assiduity ranges) */
  sourcePeriods?: EvaluationPeriod[];
  /** Admission threshold in TOTAL POINTS (default 220, like real BTS blanc) */
  totalAdmissionThreshold?: number;
}

/**
 * BTS Blanc bulletin template.
 *
 * Layout (matches the official spreadsheet template):
 *   • Left block:  Examen Blanc | Notes | C. | Points
 *   • Right block: Appréciation générale + ASSIDUITÉ box
 *   • Footer:      TOTAL (Admis si > ou = X) ___ <total>  |  ADMIS / NON ADMIS
 */
const BtsBlancBulletinTemplate: React.FC<Props> = ({
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
  sourcePeriods,
  totalAdmissionThreshold = 220,
}) => {
  const INK = config.design_config.primary_color || '#1a2654';
  const ROW_BG = '#cfe7f5';        // light cyan band like the screenshot
  const ROW_BG_ALT = '#e6f3fa';
  const HEADER_BG = '#82b9d8';      // medium blue header
  const TOTAL_BG = '#5b9ec5';
  const FONT = config.design_config.font_family
    ? `"${config.design_config.font_family}", Arial, sans-serif`
    : '"Times New Roman", Georgia, serif';
  const sections = config.layout_config.sections || {};

  // ─── Modules ────────────────────────────────────────────
  // For BTS Blanc, load period_modules WITH exam_part (écrit/oral).
  // Each module may appear twice (écrit + oral) with its own coefficient.
  const { data: modules = [] } = useQuery({
    queryKey: ['bts-bulletin-modules', formationId, period.id],
    queryFn: async () => {
      // 1) Try period_modules join with exam_part
      const { data: pm } = await supabase
        .from('period_modules')
        .select('module_id, coefficient, exam_part, formation_modules!inner(id, title, order_index)')
        .eq('period_id', period.id);

      if (pm && pm.length > 0) {
        return pm
          .map((row: any) => ({
            id: row.formation_modules.id,
            title: row.formation_modules.title,
            order_index: row.formation_modules.order_index,
            coefficient: row.coefficient || 1,
            exam_part: row.exam_part || null, // 'ecrit' | 'oral' | null
          }))
          .sort((a, b) => {
            // Écrit first, oral second, then by order_index
            const partOrder = (p: string | null) => (p === 'ecrit' ? 0 : p === 'oral' ? 1 : 2);
            const pa = partOrder(a.exam_part);
            const pb = partOrder(b.exam_part);
            if (pa !== pb) return pa - pb;
            return (a.order_index || 0) - (b.order_index || 0);
          });
      }

      // 2) Fallback to formation modules (no exam_part)
      const { data } = await supabase
        .from('formation_modules')
        .select('id, title, coefficient, order_index')
        .eq('formation_id', formationId)
        .order('order_index');
      return ((data || []) as any[]).map((m) => ({ ...m, exam_part: null }));
    },
  });

  // ─── Compute student bulletin ─────────────────────────
  const computedQ = useQuery({
    queryKey: ['bts-bulletin-compute', period.id, studentId, modules.length, JSON.stringify(config.calculation_rules)],
    queryFn: async () => {
      if (modules.length === 0) return null;
      const moduleIds = modules.map((m: any) => m.id);
      let evalQ = supabase
        .from('evaluations')
        .select('id, module_id, period_id, evaluation_type, scale')
        .in('module_id', moduleIds)
        .eq('period_id', period.id);
      const { data: evals } = await evalQ;
      const evalIds = (evals || []).map((e: any) => e.id);

      let allGrades: any[] = [];
      if (evalIds.length > 0) {
        const { data } = await supabase
          .from('grades')
          .select('evaluation_id, student_id, value, is_absent, is_excused, is_dispensed, is_cheating')
          .in('evaluation_id', evalIds)
          .eq('student_id', studentId);
        allGrades = data || [];
      }

      return computeStudentPeriodBulletin({
        studentId,
        config,
        modules: modules as any,
        evaluations: (evals || []) as any,
        grades: allGrades as any,
      });
    },
    enabled: modules.length > 0,
  });

  // ─── Attendance (current period + cumulative academic-year-to-date) ──
  // "Retards ce semestre" = current period range
  // "Retards au total"    = academic year up to end of current period
  const periodAttQ = useQuery({
    queryKey: ['bts-bulletin-att-period', period.id, studentId, sourcePeriods?.map((p) => p.id).join(',') || ''],
    queryFn: async () => {
      const ranges: DateRange[] = [];
      if ((period as any).is_composite && sourcePeriods && sourcePeriods.length > 0) {
        for (const sp of sourcePeriods) {
          if (sp.start_date && sp.end_date) ranges.push({ start: sp.start_date, end: sp.end_date });
        }
      } else if (period.start_date && period.end_date) {
        ranges.push({ start: period.start_date, end: period.end_date });
      }
      return getStudentAttendanceForRanges(studentId, formationId, ranges);
    },
    enabled: !!studentId && !!formationId,
  });

  const totalAttQ = useQuery({
    queryKey: ['bts-bulletin-att-total', formationId, studentId, period.id],
    queryFn: async () => {
      // From start of academic year (Sept 1 of academic year start) to end of current period
      const yearStartGuess = academicYear ? `${academicYear.split('-')[0]}-09-01` : null;
      const end = period.end_date || new Date().toISOString().split('T')[0];
      const start = yearStartGuess && yearStartGuess <= end ? yearStartGuess : end;
      return getStudentAttendanceForRanges(studentId, formationId, [{ start, end }]);
    },
    enabled: !!studentId && !!formationId,
  });

  const result = computedQ.data;
  const periodAtt = periodAttQ.data;
  const totalAtt = totalAttQ.data;

  if (computedQ.isLoading || !result) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: INK }} /></div>;
  }

  // ─── Compute total POINTS = Σ (note × coefficient) ───
  let totalPoints = 0;
  for (const m of result.modules) {
    if (m.module_average !== null && m.module_average !== undefined) {
      totalPoints += m.module_average * (m.coefficient || 0);
    }
  }
  totalPoints = Math.round(totalPoints * 100) / 100;

  const admitted = totalPoints >= totalAdmissionThreshold;

  // Title formatter: try to extract a leading "E1 - " / "E21 - " code from
  // the module title. If none, just return the title as-is.
  const formatTitle = (mod: any): string => mod.title || '';

  // Mention text from config (overridden via template_id system templates)
  const generalAppreciation = result.modules.length > 0
    ? (result.modules.map((m) => m.appreciation).filter(Boolean).slice(0, 3).join(' • ') || '')
    : '';

  return (
    <div
      className="bg-white mx-auto"
      style={{
        maxWidth: '210mm',
        fontFamily: FONT,
        color: '#000',
        border: `1px solid ${INK}`,
        borderRadius: 14,
        overflow: 'hidden',
      }}
      data-testid="bts-blanc-bulletin"
    >
      {/* Shared header (identical to Simple + Combined bulletins) */}
      <BulletinSharedHeader
        period={period}
        config={config}
        studentFullName={studentFullName}
        studentMatricule={studentMatricule}
        formationTitle={formationTitle}
        formationLevel={formationLevel}
        academicYear={academicYear}
        establishmentName={establishmentName}
        establishmentLogoUrl={establishmentLogoUrl}
        referenceNumber={referenceNumber}
      />

      {/* MAIN GRID: left table + right appreciation+attendance */}
      <div className="grid" style={{ gridTemplateColumns: '1.65fr 1fr', borderTop: `1px solid ${INK}` }}>
        {/* ─── LEFT : EPREUVES table (matches user's BTS blanc model) ─── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, borderRight: `1px solid ${INK}` }}>
          <thead>
            <tr style={{ background: HEADER_BG, color: '#000' }}>
              <th style={th({ borderRight: `1px solid ${INK}`, textAlign: 'center' })}>ÉPREUVES</th>
              <th style={th({ borderRight: `1px solid ${INK}`, width: 60, textAlign: 'center' })}>NOTES</th>
              <th style={th({ borderRight: `1px solid ${INK}`, width: 70, textAlign: 'center' })}>COEFFICIENT</th>
              <th style={th({ borderRight: `1px solid ${INK}`, width: 60, textAlign: 'center' })}>POINTS</th>
              <th style={th({ width: 140, textAlign: 'center' })}>APPRÉCIATION</th>
            </tr>
          </thead>
          <tbody>
            {modules.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 14, textAlign: 'center', fontStyle: 'italic', color: '#64748b' }}>Aucun module configuré.</td></tr>
            ) : modules.map((mod: any, i: number) => {
              const computed = result.modules.find((m) => m.module_id === mod.id);
              const note = computed?.module_average ?? null;
              const coef = mod.coefficient || 0;
              const points = note !== null ? Math.round(note * coef * 100) / 100 : null;
              const isHighlighted = i % 2 === 0;
              const partLabel = mod.exam_part === 'ecrit' ? '(écrit)' : mod.exam_part === 'oral' ? '(oral)' : '';
              return (
                <tr key={`${mod.id}-${mod.exam_part || 'main'}`} style={{ background: isHighlighted ? ROW_BG : ROW_BG_ALT }} data-testid={`bts-row-${mod.exam_part || 'main'}-${mod.id}`}>
                  <td style={td({ borderRight: `1px solid ${INK}`, fontSize: 11.5 })}>
                    <span style={{ fontWeight: 600 }}>{formatTitle(mod)}</span>
                    {partLabel && (
                      <span style={{
                        marginLeft: 6, fontSize: 10, fontStyle: 'italic',
                        color: mod.exam_part === 'ecrit' ? '#1e40af' : '#7e22ce',
                        fontWeight: 700,
                      }}>
                        {partLabel}
                      </span>
                    )}
                  </td>
                  <td style={td({ borderRight: `1px solid ${INK}`, textAlign: 'center', fontWeight: 600 })}>{fmt2(note)}</td>
                  <td style={td({ borderRight: `1px solid ${INK}`, textAlign: 'center', fontWeight: 700 })}>{coef || '—'}</td>
                  <td style={td({ borderRight: `1px solid ${INK}`, textAlign: 'center', fontWeight: 700 })}>{fmt2(points)}</td>
                  <td style={td({ fontSize: 10.5, fontStyle: 'italic', color: '#1e293b' })}>{computed?.appreciation || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ─── RIGHT : appreciation + assiduity ─── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: HEADER_BG, color: '#000', padding: '7px 12px', textAlign: 'center', borderBottom: `1px solid ${INK}` }}>
            <strong style={{ fontSize: 12 }}>Appréciation générale</strong>
          </div>
          <div style={{ flex: 1, minHeight: 120, padding: '10px 12px', fontSize: 11, fontStyle: 'italic', borderBottom: `1px solid ${INK}` }}>
            {generalAppreciation || '\u00A0'}
          </div>
          <div
            style={{ padding: '8px 12px', fontSize: 11, lineHeight: 1.55 }}
            data-testid="attendance-strip"
          >
            <p style={{ fontWeight: 800, marginBottom: 4, textDecoration: 'underline' }}>ASSIDUITE :</p>
            <p>- Retards ce semestre : <strong>{periodAtt ? periodAtt.retards : '...'}</strong></p>
            <p>- Retards au total : <strong>{totalAtt ? totalAtt.retards : '...'}</strong></p>
            <p>- Absences ce semestre : <strong>{periodAtt ? periodAtt.absences_injustifiees : '...'}</strong></p>
            <p>- Absences au total : <strong>{totalAtt ? totalAtt.absences_injustifiees : '...'}</strong></p>
            <p>- Absences restantes à rattraper : <strong>{periodAtt ? Math.max(0, periodAtt.absences_total - periodAtt.absences_injustifiees) : '...'}</strong></p>
          </div>
        </div>
      </div>

      {/* TOTAL ROW */}
      <div className="grid" style={{ gridTemplateColumns: '1.65fr 1fr', borderTop: `2px solid ${INK}` }}>
        <div style={{ background: TOTAL_BG, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}>
          <span style={{ fontSize: 14, fontWeight: 800 }}>
            TOTAL (Admis si &gt; ou = {totalAdmissionThreshold})
          </span>
          <span style={{ fontSize: 16, fontWeight: 800, background: '#fff', color: '#000', padding: '3px 16px', borderRadius: 3 }}>
            {fmt2(totalPoints)}
          </span>
        </div>
        <div
          style={{
            background: INK,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: 1.5,
            padding: '8px 12px',
          }}
        >
          {admitted ? 'ADMIS' : 'NON ADMIS'}
        </div>
      </div>

      {/* Optional footer: signatures + legal notice */}
      {sections.signatures !== false && signatories.length > 0 && (
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${Math.min(signatories.length, 4)}, 1fr)`,
            gap: 16, padding: '12px 16px', borderTop: `1px solid ${INK}22`,
          }}
        >
          {signatories.slice(0, 4).map((s: any) => (
            <div key={s.id} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4 }}>{s.role_label}</p>
              <div style={{ height: 36, borderBottom: `1px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.signature_image && <img src={s.signature_image} alt="" style={{ maxHeight: 32, objectFit: 'contain' }} crossOrigin="anonymous" />}
              </div>
              {s.name && !s.is_stamp && <p style={{ fontSize: 10, fontWeight: 600, marginTop: 2 }}>{s.name}</p>}
            </div>
          ))}
        </div>
      )}

      {sections.legal_notice !== false && (
        <div style={{ padding: '5px 12px', textAlign: 'center', fontSize: 9, color: '#475569', borderTop: `1px solid ${INK}22` }}>
          Document officiel — {establishmentName} — Réf {referenceNumber} —{' '}
          {config.text_config.legal_notice || 'Bulletin BTS Blanc certifié authentique. Le total est admis si ≥ ' + totalAdmissionThreshold + ' points.'}
        </div>
      )}
    </div>
  );
};

const th = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  padding: '8px 6px',
  fontSize: 12,
  fontWeight: 700,
  borderBottom: '2px solid #1f4e79',
  ...extra,
});

const td = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  padding: '6px 8px',
  borderBottom: '1px solid #94c2db',
  ...extra,
});

export default BtsBlancBulletinTemplate;
