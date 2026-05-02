import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  computeStudentPeriodBulletin,
} from '@/services/bulletinClientCalculator';
import { getStudentAttendanceForRanges, type DateRange } from '@/services/periodAttendanceService';
import { teachingUnitService, type TeachingUnit } from '@/services/teachingUnitService';
import type { ResolvedBulletinConfig } from '@/types/bulletinConfig';
import type { EvaluationPeriod } from '@/services/gradesService';

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
  instructorsByModuleId?: Map<string, string[]>;
  /** Source periods when `period` is a combined one — used for attendance ranges. */
  sourcePeriods?: EvaluationPeriod[];
}

/**
 * Single-period bulletin.
 *
 * Columns: Matière | Coef | Moy. individuelle | Moy. promotion | Appréciation.
 * Footer : Moyenne générale (individuelle + promo) + Assiduité (retards,
 * absences injustifiées) sur la plage de dates de la période.
 *
 * For combined periods, attendance ranges are concatenated (sum of S1 + S2 …).
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
  sourcePeriods,
}) => {
  const INK = config.design_config.primary_color || '#1a2654';
  const GOLD = config.design_config.accent_color || '#c8a94e';
  const OK = config.design_config.success_color || '#16a34a';
  const KO = config.design_config.error_color || '#dc2626';
  const FONT = config.design_config.font_family
    ? `"${config.design_config.font_family}", Arial, sans-serif`
    : '"Inter", "Helvetica Neue", Arial, sans-serif';
  const sections = config.layout_config.sections || {};
  const admissionThreshold = config.decision_rules?.admission_threshold ?? 10;

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

  // ─── Load UEs for grouping ──────────────────────────────
  const { data: teachingUnits = [] } = useQuery<TeachingUnit[]>({
    queryKey: ['simple-bulletin-ues', formationId],
    queryFn: () => teachingUnitService.listForFormation(formationId),
    enabled: !!formationId,
  });

  // ─── Load roster for class stats + rank ─────────────────
  const { data: roster = [] } = useQuery({
    queryKey: ['simple-bulletin-roster', formationId],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_formation_students', { formation_id_param: formationId });
      return (data || []) as any[];
    },
    enabled: !!formationId,
  });

  // ─── Compute student bulletin + class averages per module ──
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

      // Own bulletin
      const mine = computeStudentPeriodBulletin({
        studentId, config, modules: modules as any, evaluations: (evals || []) as any, grades: allGrades as any,
      });

      // Compute ALL students' bulletins to derive class stats + rank
      const others = roster.map((s: any) => ({
        studentId: s.user_id,
        bulletin: computeStudentPeriodBulletin({
          studentId: s.user_id, config, modules: modules as any, evaluations: (evals || []) as any, grades: allGrades as any,
        }),
      }));

      // Class average per module
      const classAvgByModule = new Map<string, number | null>();
      for (const mod of modules) {
        const vals: number[] = [];
        for (const o of others) {
          const mm = o.bulletin.modules.find((m) => m.module_id === mod.id);
          if (mm?.module_average !== null && mm?.module_average !== undefined) vals.push(mm.module_average);
        }
        classAvgByModule.set(mod.id, vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : null);
      }

      // Class general average
      const allGen = others.map((o) => o.bulletin.general_average).filter((v): v is number => v !== null);
      const classGeneral = allGen.length ? Math.round((allGen.reduce((a, b) => a + b, 0) / allGen.length) * 100) / 100 : null;

      // Rank
      const sorted = others.filter((o) => o.bulletin.general_average !== null).sort((a, b) => (b.bulletin.general_average || 0) - (a.bulletin.general_average || 0));
      const rankIdx = sorted.findIndex((x) => x.studentId === studentId);
      const rank = rankIdx >= 0 ? rankIdx + 1 : null;

      return {
        rows: mine.modules.map((m) => ({
          moduleId: m.module_id,
          moduleTitle: m.module_title,
          coefficient: m.coefficient,
          individualAverage: m.module_average,
          classAverage: classAvgByModule.get(m.module_id) ?? null,
          appreciation: m.appreciation,
          eliminated: m.eliminated,
        })),
        general_average: mine.general_average,
        class_general_average: classGeneral,
        mention: mine.mention,
        decision: mine.decision,
        admitted: mine.admitted,
        rank,
        totalStudents: roster.length || null,
      };
    },
    enabled: modules.length > 0,
  });

  // ─── Attendance — range = current period's (start_date..end_date),
  //    or all source periods' ranges for a combined period ───────────
  const attendanceQ = useQuery({
    queryKey: ['simple-bulletin-attendance', period.id, studentId, sourcePeriods?.map((p) => p.id).join(',') || ''],
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

  const result = computedQ.data;
  const attendance = attendanceQ.data;

  if (computedQ.isLoading || !result) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: INK }} /></div>;
  }

  // ─── Group rows by UE ─────────────────────────────────
  // Each row → the UE of its module (via teaching_unit_id)
  const moduleToUEId = new Map<string, string | null>();
  for (const mod of modules as any[]) {
    moduleToUEId.set(mod.id, mod.teaching_unit_id || null);
  }
  const rowsByUE = new Map<string, typeof result.rows>();
  for (const row of result.rows) {
    const k = moduleToUEId.get(row.moduleId) || '_unassigned';
    const arr = rowsByUE.get(k) || [];
    arr.push(row);
    rowsByUE.set(k, arr);
  }
  // Ordered sections: known UEs first (by UE order_index), then unassigned
  const ueSections: Array<{ ue: TeachingUnit | null; rows: typeof result.rows }> = [];
  for (const ue of teachingUnits) {
    const rs = rowsByUE.get(ue.id);
    if (rs && rs.length > 0) ueSections.push({ ue, rows: rs });
  }
  const unassignedRows = rowsByUE.get('_unassigned') || [];
  if (unassignedRows.length > 0) ueSections.push({ ue: null, rows: unassignedRows });

  // Per-UE weighted averages (individual & class) based on matière coefficients
  const ueSubtotals = new Map<string, { individual: number | null; classAvg: number | null; totalCoef: number }>();
  for (const { ue, rows } of ueSections) {
    const key = ue?.id || '_unassigned';
    let wIndiv = 0, coefIndiv = 0;
    let wClass = 0, coefClass = 0;
    for (const r of rows) {
      if (r.individualAverage !== null) { wIndiv += r.individualAverage * r.coefficient; coefIndiv += r.coefficient; }
      if (r.classAverage !== null) { wClass += r.classAverage * r.coefficient; coefClass += r.coefficient; }
    }
    ueSubtotals.set(key, {
      individual: coefIndiv > 0 ? Math.round((wIndiv / coefIndiv) * 100) / 100 : null,
      classAvg: coefClass > 0 ? Math.round((wClass / coefClass) * 100) / 100 : null,
      totalCoef: rows.reduce((sum, r) => sum + r.coefficient, 0),
    });
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
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', fontSize: 64, fontWeight: 900, letterSpacing: 8, color: INK, opacity: 0.05,
            transform: 'rotate(-22deg)', zIndex: 0,
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

        {/* Subjects table — NEW COLUMNS : Matière | Coef | Moy. ind. | Moy. promo | Appréciation */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginTop: 4 }}>
          <thead>
            <tr style={{ background: INK, color: '#fff' }}>
              <th style={th({ width: '34%', textAlign: 'left' })}>Matière</th>
              <th style={th({ width: '9%' })}>Coef.</th>
              <th style={th({ width: '14%' })}>Moy. indiv.</th>
              <th style={th({ width: '14%' })}>Moy. promo</th>
              <th style={th({ width: '29%', textAlign: 'left' })}>Appréciation</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 14, textAlign: 'center', fontStyle: 'italic', color: '#64748b', background: '#fafafa' }}>Aucune donnée saisie pour cette période.</td></tr>
            ) : ueSections.map(({ ue, rows }) => {
              const key = ue?.id || '_unassigned';
              const sub = ueSubtotals.get(key);
              const ueIndiv = sub?.individual ?? null;
              const ueClass = sub?.classAvg ?? null;
              const ueColor = ueIndiv === null ? '#94a3b8' : ueIndiv >= 14 ? OK : ueIndiv >= admissionThreshold ? '#1d4ed8' : KO;
              return (
                <React.Fragment key={key}>
                  {/* UE header row */}
                  <tr style={{ background: `${INK}0d` }} data-testid={`bulletin-ue-header-${key}`}>
                    <td
                      colSpan={5}
                      style={{
                        padding: '6px 8px',
                        fontSize: 10.5,
                        fontWeight: 800,
                        color: INK,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        borderTop: `1px solid ${INK}30`,
                        borderBottom: `1px solid ${INK}22`,
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {ue?.code && (
                          <span style={{ background: INK, color: '#fff', padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>
                            {ue.code}
                          </span>
                        )}
                        <span>{ue ? ue.title : 'Matières non rattachées'}</span>
                        {ue?.credits != null && (
                          <span style={{ color: '#64748b', fontWeight: 600, fontSize: 9, letterSpacing: 0.3 }}>· {ue.credits} ECTS</span>
                        )}
                        <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 9, letterSpacing: 0.3 }}>· {rows.length} matière{rows.length > 1 ? 's' : ''}</span>
                      </span>
                    </td>
                  </tr>
                  {/* Matières rows of this UE */}
                  {rows.map((row, i) => {
                    const moy = row.individualAverage;
                    const moyColor = moy === null ? '#94a3b8' : moy >= 14 ? OK : moy >= admissionThreshold ? '#1d4ed8' : KO;
                    return (
                      <tr key={row.moduleId} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                        <td style={{ ...td(), fontWeight: 600, paddingLeft: 18 }}>{row.moduleTitle}</td>
                        <td style={td({ textAlign: 'center', fontWeight: 600, color: '#475569' })}>{row.coefficient}</td>
                        <td style={{ ...td({ textAlign: 'center' }), fontWeight: 800, color: moyColor }}>{fmt(moy)}</td>
                        <td style={td({ textAlign: 'center', color: '#475569' })}>{fmt(row.classAverage)}</td>
                        <td style={td({ fontStyle: 'italic', color: '#1e293b' })}>{row.appreciation || '—'}</td>
                      </tr>
                    );
                  })}
                  {/* UE subtotal row */}
                  <tr style={{ background: `${GOLD}1a` }} data-testid={`bulletin-ue-subtotal-${key}`}>
                    <td
                      style={{
                        ...td({ padding: '6px 8px', textAlign: 'right' }),
                        fontWeight: 700,
                        fontSize: 10,
                        color: INK,
                        textTransform: 'uppercase',
                        letterSpacing: 0.4,
                      }}
                    >
                      Moyenne {ue?.code ? `${ue.code} ` : ''}
                    </td>
                    <td style={{ ...td({ textAlign: 'center', padding: '6px 8px' }), fontWeight: 700, fontSize: 10, color: '#475569' }}>
                      {sub?.totalCoef ?? ''}
                    </td>
                    <td style={{ ...td({ textAlign: 'center', padding: '6px 8px' }), fontWeight: 800, fontSize: 11.5, color: ueColor }}>
                      {fmt(ueIndiv)}
                    </td>
                    <td style={{ ...td({ textAlign: 'center', padding: '6px 8px' }), fontWeight: 700, fontSize: 11, color: '#475569' }}>
                      {fmt(ueClass)}
                    </td>
                    <td style={{ ...td({ padding: '6px 8px' }), fontStyle: 'italic', fontSize: 10, color: '#64748b' }}>
                      {ueIndiv === null ? '—' : ueIndiv >= admissionThreshold ? 'UE validée' : 'UE non validée'}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
          {/* Totals row : general average */}
          <tfoot>
            <tr style={{ background: `${INK}12`, fontWeight: 700 }}>
              <td style={{ ...td({ padding: '9px 8px', textAlign: 'right' }), fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 }} colSpan={2}>
                Moyenne générale
              </td>
              <td style={{ ...td({ padding: '9px 8px', textAlign: 'center' }), fontSize: 14, fontWeight: 800, color: result.general_average !== null && result.general_average >= admissionThreshold ? INK : KO }}>
                {fmt(result.general_average)}/20
              </td>
              <td style={{ ...td({ padding: '9px 8px', textAlign: 'center' }), fontSize: 13, color: '#475569' }}>
                {fmt(result.class_general_average)}/20
              </td>
              <td style={{ ...td({ padding: '9px 8px', textAlign: 'right' }) }}>
                <span style={{ fontSize: 11, color: result.admitted === true ? OK : result.admitted === false ? KO : GOLD, fontWeight: 700, letterSpacing: 0.5 }}>
                  {result.decision}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Rang + Assiduité strip */}
        <div
          className="grid grid-cols-3"
          style={{ marginTop: 10, border: `1px solid ${INK}22`, borderRadius: 6, overflow: 'hidden' }}
          data-testid="attendance-strip"
        >
          <MetaCell label="Rang période" value={result.rank ? `${result.rank}${result.rank === 1 ? 'er' : 'ème'}${result.totalStudents ? ` / ${result.totalStudents}` : ''}` : '—'} />
          <MetaCell
            label="Retards"
            value={attendance ? String(attendance.retards) : '—'}
            divider
            hint={(period as any).is_composite ? 'cumul périodes sources' : 'sur la période'}
          />
          <MetaCell
            label="Absences injustifiées"
            value={attendance ? String(attendance.absences_injustifiees) : '—'}
            divider
            hint={attendance ? `${attendance.absences_total} abs. totales · ${attendance.total_sheets} séances` : undefined}
          />
        </div>
      </div>

      {/* SIGNATURES */}
      {sections.signatures !== false && signatories.length > 0 && (
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${Math.min(signatories.length, 4)}, 1fr)`,
            gap: 16, padding: '14px 18px',
            borderTop: `1px solid ${INK}22`,
            position: 'relative', zIndex: 1,
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
    <p style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 }}>{label}</p>
    <p style={{ fontSize: 12, fontWeight: 700 }}>{value}</p>
  </div>
);

const MetaCell: React.FC<{ label: string; value: React.ReactNode; divider?: boolean; hint?: string }> = ({ label, value, divider, hint }) => (
  <div style={{ padding: '8px 12px', borderLeft: divider ? '1px solid #e2e8f0' : 'none', textAlign: 'center' }}>
    <p style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 }}>{label}</p>
    <p style={{ fontSize: 15, fontWeight: 800 }}>{value}</p>
    {hint && <p style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>{hint}</p>}
  </div>
);

const th = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  padding: '8px 8px', fontSize: 10, fontWeight: 700, textAlign: 'center', letterSpacing: 0.5, textTransform: 'uppercase', ...extra,
});

const td = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  padding: '7px 8px', borderBottom: '1px solid #f1f5f9', ...extra,
});

export default SimpleBulletinTemplate;
