import React from 'react';
import A4FitWrapper from './A4FitWrapper';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { resolveConfigForPeriod } from '@/services/bulletinConfigService';
import {
  computeStudentPeriodBulletin,
  pickMention,
} from '@/services/bulletinClientCalculator';
import { aggregateCombinedAverage, type CombinedPeriodConfig } from '@/services/combinedPeriodService';
import { getStudentAttendanceForRanges, type DateRange } from '@/services/periodAttendanceService';
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
    classAverage: number | null;
    appreciation: string | null;
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
  studentDateOfBirth,
  formationId,
  formationTitle,
  formationLevel,
  academicYear,
  establishmentName,
  establishmentLogoUrl,
  establishmentAddress,
  signatories,
  instructorsByModuleId,
}) => {
  const compositeConfig: CombinedPeriodConfig = (combinedPeriod.composite_config as any) || {
    calculation_rule: 'simple_average',
  };

  // Visual tokens: strict B&W palette matching user's maquettes
  const INK = '#000';
  void combinedConfig.design_config;

  // ─── Load shared data ────────────────────────────────────
  const { data: modules = [] } = useQuery({
    queryKey: ['combined-bulletin-modules', formationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('formation_modules')
        .select('id, title, coefficient, order_index, semester, credits')
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

        // Compute all students for rank + class averages per module
        const allBulletins = roster.map((s: any) => ({
          studentId: s.user_id,
          bulletin: computeStudentPeriodBulletin({
            studentId: s.user_id, config: cfg, modules: modules as any, evaluations: (evals || []) as any, grades: allGrades as any,
          }),
        }));
        const classAvgByModule = new Map<string, number | null>();
        for (const mod of modules as any[]) {
          const vals: number[] = [];
          for (const o of allBulletins) {
            const mm = o.bulletin.modules.find((m) => m.module_id === mod.id);
            if (mm?.module_average !== null && mm?.module_average !== undefined) vals.push(mm.module_average);
          }
          classAvgByModule.set(mod.id, vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : null);
        }
        const allAvgs = allBulletins.map((o) => ({ studentId: o.studentId, avg: o.bulletin.general_average }));
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
            classAverage: classAvgByModule.get(m.module_id) ?? null,
            appreciation: m.appreciation,
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

  // Split sources by type — BTS Blanc periods are rendered in a SEPARATE block (no global combined moyenne)
  const matieresResults = sourceResults.filter((pr) => pr.period.period_type !== 'bts_blanc');
  const btsBlancResults = sourceResults.filter((pr) => pr.period.period_type === 'bts_blanc');
  const hasBtsBlanc = btsBlancResults.length > 0;
  const hasMatieres = matieresResults.length > 0;
  const isDualBlockMode = hasBtsBlanc && hasMatieres;

  // Block 1 — Matières (non-BTS-Blanc) rows
  const matieresRows = matieresResults.flatMap((pr) =>
    pr.rows.map((r) => ({ ...r, periodId: pr.period.id, periodName: pr.period.name }))
  );
  const matieresTotalCoef = matieresRows.reduce((s, r) => s + r.coefficient, 0);
  const matieresAvg = (() => {
    let w = 0, c = 0;
    for (const r of matieresRows) if (r.moy !== null) { w += r.moy * r.coefficient; c += r.coefficient; }
    return c > 0 ? Math.round((w / c) * 100) / 100 : null;
  })();
  const matieresClassAvg = (() => {
    let w = 0, c = 0;
    for (const r of matieresRows) if (r.classAverage !== null) { w += r.classAverage * r.coefficient; c += r.coefficient; }
    return c > 0 ? Math.round((w / c) * 100) / 100 : null;
  })();

  // Block 2 — BTS Blanc rows (épreuves)
  const btsBlancRows = btsBlancResults.flatMap((pr) =>
    pr.rows.map((r) => ({ ...r, periodId: pr.period.id, periodName: pr.period.name }))
  );
  const btsTotalCoef = btsBlancRows.reduce((s, r) => s + r.coefficient, 0);
  const btsTotalPoints = (() => {
    let p = 0;
    for (const r of btsBlancRows) if (r.moy !== null) p += r.moy * r.coefficient;
    return Math.round(p * 100) / 100;
  })();
  const btsMoyenne = btsTotalCoef > 0 ? Math.round((btsTotalPoints / btsTotalCoef) * 100) / 100 : null;
  // BTS validation in France: 220 points threshold (= moyenne 10/20 with coef total of 22)
  const BTS_THRESHOLD_POINTS = 220;
  const btsAdmitted: boolean | null = btsBlancRows.length === 0 ? null : (btsTotalPoints >= BTS_THRESHOLD_POINTS);

  // Legacy single-flat-table aggregation (when NO BTS Blanc source)
  const allRows = matieresRows; // same as matieresRows when no BTS Blanc
  const combinedTotalCoef = matieresTotalCoef;
  const combinedClassAverage = matieresClassAvg;
  const combinedAverageFromModules = matieresAvg;
  const perPeriodAvg: Record<string, number | null> = {};
  for (const r of sourceResults) perPeriodAvg[r.period.id] = r.general_average;
  const combinedAverage = combinedAverageFromModules ?? aggregateCombinedAverage(perPeriodAvg, compositeConfig);

  // Attendance aggregated over ALL source period date ranges
  const attendanceQ = useQuery({
    queryKey: ['combined-attendance', studentId, formationId, sourcePeriods.map((p) => p.id).join(',')],
    queryFn: async () => {
      const ranges: DateRange[] = [];
      for (const sp of sourcePeriods) {
        if (sp.start_date && sp.end_date) ranges.push({ start: sp.start_date, end: sp.end_date });
      }
      return getStudentAttendanceForRanges(studentId, formationId, ranges);
    },
    enabled: !!studentId && !!formationId && sourcePeriods.length > 0,
  });
  const combinedAttendance = attendanceQ.data;

  const admissionThreshold = combinedConfig.decision_rules?.admission_threshold ?? 10;
  const combinedAdmitted: boolean | null =
    combinedAverage === null ? null : combinedAverage >= admissionThreshold;
  const combinedDecisionLabel =
    combinedAdmitted === null ? (combinedConfig.decision_rules?.pending_label || 'EN COURS')
    : combinedAdmitted ? (combinedConfig.decision_rules?.admitted_label || 'ADMIS(E)')
    : (combinedConfig.decision_rules?.not_admitted_label || 'NON ADMIS(E)');
  void pickMention; void compositeConfig.custom_label; void combinedConfig.text_config;
  if (sourceResultsQ.isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: INK }} /></div>;
  }

  void formationLevel;
  const FONT_SANS = 'Arial, Helvetica, sans-serif';
  const BORDER = '1px solid #000';
  const [firstName, ...lastNameParts] = (studentFullName || '').split(' ');
  const lastName = lastNameParts.join(' ');

  return (
    <A4FitWrapper testId="combined-bulletin" fontFamily={FONT_SANS}>
      {/* ═══ HEADER — identical to Simple + BTS Blanc ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, marginBottom: 10, alignItems: 'center' }}>
        <div style={{ fontSize: 10, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {establishmentLogoUrl && (
              <img src={establishmentLogoUrl} alt="" style={{ height: 36, objectFit: 'contain' }} crossOrigin="anonymous" />
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: 11 }}>{establishmentName}</div>
              {establishmentAddress && <div style={{ fontSize: 9, marginTop: 2 }}>{establishmentAddress}</div>}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 11, textAlign: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{combinedPeriod.name}</div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.5 }}>RELEVE DE NOTES</div>
          <div style={{ fontSize: 9, marginTop: 2 }}>Année académique {academicYear}</div>
        </div>
      </div>

      {/* ═══ 2 IDENTITY BOXES ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10, marginBottom: 10 }}>
        <div style={{ border: BORDER, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <IdBoxRow label="NOM ETUDIANT" value={(lastName || studentFullName || '').toUpperCase()} />
            <IdBoxRow label="PRENOM ETUDIANT" value={firstName || ''} />
            <IdBoxRow label="DATE DE NAISSANCE" value={studentDateOfBirth ? (new Date(studentDateOfBirth).toLocaleDateString('fr-FR')) : ''} last />
          </div>
          <div style={{ borderLeft: BORDER }}>
            <IdBoxRow label="FORMATION" value={formationTitle || ''} />
            <IdBoxRow label="ANNEE" value={academicYear || ''} last />
          </div>
        </div>
        <div style={{ border: BORDER }}>
          <IdBoxRow label="NUMERO ETUDIANT" value={studentMatricule || ''} />
          <IdBoxRow label="NUMERO CE" value={''} />
          <IdBoxRow label="NUMERO INE" value={''} last />
        </div>
      </div>

      {/* ═══ BODY ═══ */}
      {isDualBlockMode || (hasBtsBlanc && !hasMatieres) ? (
        <>
          {/* BLOCK 1 — Matières (only when there are non-BTS-Blanc sources) */}
          {hasMatieres && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT_SANS, marginBottom: 8 }} data-testid="combined-matieres-table">
              <colgroup>
                <col style={{ width: '24%' }} /><col style={{ width: '14%' }} /><col style={{ width: '10%' }} /><col style={{ width: '11%' }} /><col style={{ width: '11%' }} /><col style={{ width: '30%' }} />
              </colgroup>
              <tbody>
                <tr>
                  <th colSpan={6} style={{ border: BORDER, background: '#000', color: '#fff', padding: '5px 6px', fontSize: 10, fontWeight: 700, textAlign: 'center', letterSpacing: 0.5 }}>MOYENNES DES MATIERES</th>
                </tr>
                <tr>
                  <th style={{ border: BORDER, padding: '6px 6px', fontSize: 10, fontWeight: 700, textAlign: 'left', paddingLeft: 8, background: '#E0E0E0', textTransform: 'uppercase', color: '#000' }} rowSpan={2}>MATIERES</th>
                  <th style={{ border: BORDER, padding: '6px 6px', fontSize: 10, fontWeight: 700, textAlign: 'center', background: '#E0E0E0', textTransform: 'uppercase', color: '#000' }} rowSpan={2}>FORMATEUR</th>
                  <th style={{ border: BORDER, padding: '6px 6px', fontSize: 10, fontWeight: 700, textAlign: 'center', background: '#E0E0E0', textTransform: 'uppercase', color: '#000' }} rowSpan={2}>COEFFICIENT</th>
                  <th style={{ border: BORDER, padding: '6px 6px', fontSize: 10, fontWeight: 700, textAlign: 'center', background: '#E0E0E0', textTransform: 'uppercase', color: '#000' }} colSpan={2}>MOYENNE</th>
                  <th style={{ border: BORDER, padding: '6px 6px', fontSize: 10, fontWeight: 700, textAlign: 'center', background: '#E0E0E0', textTransform: 'uppercase', color: '#000' }} rowSpan={2}>APPRECIATION</th>
                </tr>
                <tr>
                  <th style={{ border: BORDER, padding: '6px 6px', fontSize: 8.5, fontWeight: 700, textAlign: 'center', background: '#E0E0E0', textTransform: 'uppercase', color: '#000' }}>MOYENNE DE L'ETUDIANT</th>
                  <th style={{ border: BORDER, padding: '6px 6px', fontSize: 8.5, fontWeight: 700, textAlign: 'center', background: '#E0E0E0', textTransform: 'uppercase', color: '#000' }}>MOYENNE DE LA PROMO</th>
                </tr>
                {matieresRows.length === 0 ? (
                  <tr><td colSpan={6} style={{ border: BORDER, padding: 14, textAlign: 'center', fontStyle: 'italic', color: '#000', background: '#fff' }}>Aucune donnée saisie.</td></tr>
                ) : matieresRows.map((row, idx) => {
                  const ins = instructorsByModuleId?.get(row.moduleId) || [];
                  return (
                    <tr key={`m-${row.periodId}-${row.moduleId}-${idx}`} data-testid={`combined-matieres-row-${row.moduleId}`}>
                      <td style={{ border: BORDER, padding: '5px 6px', fontSize: 10, color: '#000', fontWeight: 500, textTransform: 'uppercase', verticalAlign: 'top' }}>{row.moduleTitle}</td>
                      <td style={{ border: BORDER, padding: '5px 6px', fontSize: 9, color: '#000', textAlign: 'center', verticalAlign: 'top' }}>{ins.length > 0 ? ins.join(', ') : ''}</td>
                      <td style={{ border: BORDER, padding: '5px 6px', fontSize: 9, color: '#000', textAlign: 'center', verticalAlign: 'top' }}>{row.coefficient}</td>
                      <td style={{ border: BORDER, padding: '5px 6px', fontSize: 11, color: '#000', textAlign: 'center', fontWeight: 700, verticalAlign: 'top' }}>{fmt(row.moy)}</td>
                      <td style={{ border: BORDER, padding: '5px 6px', fontSize: 11, color: '#000', textAlign: 'center', fontWeight: 500, verticalAlign: 'top' }}>{fmt(row.classAverage)}</td>
                      <td style={{ border: BORDER, padding: '5px 6px', fontSize: 9, color: '#000', fontStyle: 'italic', verticalAlign: 'top' }}>{row.appreciation || ''}</td>
                    </tr>
                  );
                })}
                {/* Footer matières */}
                <tr>
                  <th style={{ border: BORDER, padding: '6px 6px', fontSize: 10, fontWeight: 700, textAlign: 'center', background: '#E0E0E0', textTransform: 'uppercase', color: '#000' }} colSpan={2}>MOYENNE GENERALE</th>
                  <td style={{ border: BORDER, padding: '6px 6px', fontSize: 9, textAlign: 'center', fontWeight: 700, background: '#fff', color: '#000' }}>{matieresTotalCoef}</td>
                  <td style={{ border: BORDER, padding: '6px 6px', fontSize: 12, textAlign: 'center', fontWeight: 700, background: '#fff', color: '#000' }}>{fmt(matieresAvg)}</td>
                  <td style={{ border: BORDER, padding: '6px 6px', fontSize: 11, textAlign: 'center', fontWeight: 500, background: '#fff', color: '#000' }}>{fmt(matieresClassAvg)}</td>
                  <td style={{ border: BORDER, padding: '6px 6px', fontSize: 9, background: '#fff', color: '#000', fontStyle: 'italic' }}></td>
                </tr>
              </tbody>
            </table>
          )}

          {/* BLOCK 2 — BTS Blanc */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT_SANS }} data-testid="combined-bts-blanc-table">
            <colgroup>
              <col style={{ width: '34%' }} /><col style={{ width: '12%' }} /><col style={{ width: '12%' }} /><col style={{ width: '14%' }} /><col style={{ width: '28%' }} />
            </colgroup>
            <tbody>
              <tr>
                <th colSpan={5} style={{ border: BORDER, background: '#000', color: '#fff', padding: '5px 6px', fontSize: 10, fontWeight: 700, textAlign: 'center', letterSpacing: 0.5 }}>BTS BLANC</th>
              </tr>
              <tr>
                <th style={{ border: BORDER, padding: '6px 6px', fontSize: 10, fontWeight: 700, textAlign: 'left', paddingLeft: 8, background: '#E0E0E0', textTransform: 'uppercase', color: '#000' }}>EPREUVES</th>
                <th style={{ border: BORDER, padding: '6px 6px', fontSize: 10, fontWeight: 700, textAlign: 'center', background: '#E0E0E0', textTransform: 'uppercase', color: '#000' }}>NOTES</th>
                <th style={{ border: BORDER, padding: '6px 6px', fontSize: 10, fontWeight: 700, textAlign: 'center', background: '#E0E0E0', textTransform: 'uppercase', color: '#000' }}>COEFFICIENT</th>
                <th style={{ border: BORDER, padding: '6px 6px', fontSize: 10, fontWeight: 700, textAlign: 'center', background: '#E0E0E0', textTransform: 'uppercase', color: '#000' }}>TOTAL DES POINTS</th>
                <th style={{ border: BORDER, padding: '6px 6px', fontSize: 10, fontWeight: 700, textAlign: 'center', background: '#E0E0E0', textTransform: 'uppercase', color: '#000' }}>APPRECIATION</th>
              </tr>
              {btsBlancRows.length === 0 ? (
                <tr><td colSpan={5} style={{ border: BORDER, padding: 14, textAlign: 'center', fontStyle: 'italic', color: '#000', background: '#fff' }}>Aucune donnée saisie.</td></tr>
              ) : btsBlancRows.map((row, idx) => {
                const points = row.moy !== null ? Math.round(row.moy * row.coefficient * 100) / 100 : null;
                return (
                  <tr key={`b-${row.periodId}-${row.moduleId}-${idx}`} data-testid={`combined-bts-row-${row.moduleId}`}>
                    <td style={{ border: BORDER, padding: '5px 6px', fontSize: 10, color: '#000', fontWeight: 500, textTransform: 'uppercase', verticalAlign: 'top' }}>{row.moduleTitle}</td>
                    <td style={{ border: BORDER, padding: '5px 6px', fontSize: 11, color: '#000', textAlign: 'center', fontWeight: 700, verticalAlign: 'top' }}>{fmt(row.moy)}</td>
                    <td style={{ border: BORDER, padding: '5px 6px', fontSize: 9, color: '#000', textAlign: 'center', verticalAlign: 'top' }}>{row.coefficient}</td>
                    <td style={{ border: BORDER, padding: '5px 6px', fontSize: 11, color: '#000', textAlign: 'center', fontWeight: 700, verticalAlign: 'top' }}>{fmt(points)}</td>
                    <td style={{ border: BORDER, padding: '5px 6px', fontSize: 9, color: '#000', fontStyle: 'italic', verticalAlign: 'top' }}>{row.appreciation || ''}</td>
                  </tr>
                );
              })}
              {/* Footer BTS Blanc: TOTAL spans EPREUVES+NOTES | totalCoef | totalPoints | MOYENNE + DECISION */}
              <tr>
                <th style={{ border: BORDER, padding: '6px 6px', fontSize: 10, fontWeight: 700, textAlign: 'center', background: '#E0E0E0', textTransform: 'uppercase', color: '#000' }} colSpan={2}>TOTAL</th>
                <td style={{ border: BORDER, padding: '6px 6px', fontSize: 9, textAlign: 'center', fontWeight: 700, background: '#fff', color: '#000' }}>{btsTotalCoef || ''}</td>
                <td style={{ border: BORDER, padding: '6px 6px', fontSize: 11, textAlign: 'center', fontWeight: 700, background: '#fff', color: '#000' }}>{fmt(btsTotalPoints)}</td>
                <td style={{ border: BORDER, padding: '6px 6px', fontSize: 9, background: '#fff', color: '#000', fontStyle: 'italic' }}></td>
              </tr>
              <tr>
                <th style={{ border: BORDER, padding: '6px 6px', fontSize: 10, fontWeight: 700, textAlign: 'center', background: '#E0E0E0', textTransform: 'uppercase', color: '#000' }} colSpan={2}>MOYENNE</th>
                <td colSpan={2} style={{ border: BORDER, padding: '6px 6px', fontSize: 12, textAlign: 'center', fontWeight: 700, background: '#fff', color: '#000' }}>{fmt(btsMoyenne)}</td>
                <td style={{ border: BORDER, padding: '6px 6px', fontSize: 10, textAlign: 'center', fontWeight: 700, background: '#fff', color: '#000' }}>
                  {btsAdmitted === true ? 'ADMIS' : btsAdmitted === false ? 'NON ADMIS' : ''}
                </td>
              </tr>
            </tbody>
          </table>
        </>
      ) : (
      /* ═══ SINGLE COMBINED TABLE — Simple bulletin layout (no BTS Blanc among sources) ═══ */
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT_SANS }} data-testid="combined-flat-table">
        <colgroup>
          <col style={{ width: '24%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '30%' }} />
        </colgroup>
        <tbody>
          {/* Header row: column titles */}
          <tr>
            <th style={{ border: BORDER, padding: '6px 6px', fontSize: 10, fontWeight: 700, textAlign: 'left', paddingLeft: 8, background: '#E0E0E0', textTransform: 'uppercase', color: '#000' }} rowSpan={2}>MATIERES</th>
            <th style={{ border: BORDER, padding: '6px 6px', fontSize: 10, fontWeight: 700, textAlign: 'center', background: '#E0E0E0', textTransform: 'uppercase', color: '#000' }} rowSpan={2}>FORMATEUR</th>
            <th style={{ border: BORDER, padding: '6px 6px', fontSize: 10, fontWeight: 700, textAlign: 'center', background: '#E0E0E0', textTransform: 'uppercase', color: '#000' }} rowSpan={2}>COEFFICIENT</th>
            <th style={{ border: BORDER, padding: '6px 6px', fontSize: 10, fontWeight: 700, textAlign: 'center', background: '#E0E0E0', textTransform: 'uppercase', color: '#000' }} colSpan={2}>MOYENNE</th>
            <th style={{ border: BORDER, padding: '6px 6px', fontSize: 10, fontWeight: 700, textAlign: 'center', background: '#E0E0E0', textTransform: 'uppercase', color: '#000' }} rowSpan={2}>APPRECIATION</th>
          </tr>
          <tr>
            <th style={{ border: BORDER, padding: '6px 6px', fontSize: 8.5, fontWeight: 700, textAlign: 'center', background: '#E0E0E0', textTransform: 'uppercase', color: '#000' }}>MOYENNE DE L'ETUDIANT</th>
            <th style={{ border: BORDER, padding: '6px 6px', fontSize: 8.5, fontWeight: 700, textAlign: 'center', background: '#E0E0E0', textTransform: 'uppercase', color: '#000' }}>MOYENNE DE LA PROMO</th>
          </tr>
          {allRows.length === 0 ? (
            <tr><td colSpan={6} style={{ border: BORDER, padding: 14, textAlign: 'center', fontStyle: 'italic', color: '#000', background: '#fff' }}>Aucune donnée saisie pour les périodes sélectionnées.</td></tr>
          ) : allRows.map((row, idx) => {
            const ins = instructorsByModuleId?.get(row.moduleId) || [];
            return (
              <tr key={`${row.periodId}-${row.moduleId}-${idx}`} data-testid={`combined-row-${row.periodId}-${row.moduleId}`}>
                <td style={{ border: BORDER, padding: '5px 6px', fontSize: 10, color: '#000', fontWeight: 500, textTransform: 'uppercase', verticalAlign: 'top' }}>{row.moduleTitle}</td>
                <td style={{ border: BORDER, padding: '5px 6px', fontSize: 9, color: '#000', textAlign: 'center', verticalAlign: 'top' }}>{ins.length > 0 ? ins.join(', ') : ''}</td>
                <td style={{ border: BORDER, padding: '5px 6px', fontSize: 9, color: '#000', textAlign: 'center', verticalAlign: 'top' }}>{row.coefficient}</td>
                <td style={{ border: BORDER, padding: '5px 6px', fontSize: 11, color: '#000', textAlign: 'center', fontWeight: 700, verticalAlign: 'top' }}>{fmt(row.moy)}</td>
                <td style={{ border: BORDER, padding: '5px 6px', fontSize: 11, color: '#000', textAlign: 'center', fontWeight: 500, verticalAlign: 'top' }}>{fmt(row.classAverage)}</td>
                <td style={{ border: BORDER, padding: '5px 6px', fontSize: 9, color: '#000', fontStyle: 'italic', verticalAlign: 'top' }}>{row.appreciation || ''}</td>
              </tr>
            );
          })}
          {/* Footer single row: MOYENNE GENERALE label spans MATIERES+FORMATEUR | totalCoef under COEFFICIENT | moy étudiant | moy promo | DECISION */}
          <tr>
            <th style={{ border: BORDER, padding: '6px 6px', fontSize: 10, fontWeight: 700, textAlign: 'center', background: '#E0E0E0', textTransform: 'uppercase', color: '#000' }} colSpan={2}>MOYENNE GENERALE</th>
            <td style={{ border: BORDER, padding: '6px 6px', fontSize: 9, textAlign: 'center', fontWeight: 700, background: '#fff', color: '#000' }}>{combinedTotalCoef}</td>
            <td style={{ border: BORDER, padding: '6px 6px', fontSize: 12, textAlign: 'center', fontWeight: 700, background: '#fff', color: '#000' }}>{fmt(combinedAverage)}</td>
            <td style={{ border: BORDER, padding: '6px 6px', fontSize: 11, textAlign: 'center', fontWeight: 500, background: '#fff', color: '#000' }}>{fmt(combinedClassAverage)}</td>
            <td style={{ border: BORDER, padding: '6px 6px', fontSize: 11, textAlign: 'center', fontWeight: 700, background: '#fff', color: '#000' }}>
              {combinedAdmitted === true ? 'ADMIS' : combinedAdmitted === false ? 'NON ADMIS' : combinedDecisionLabel}
            </td>
          </tr>
        </tbody>
      </table>
      )}

      {/* ═══ 3 BOTTOM BOXES (identical to Simple + BTS Blanc) ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', border: BORDER, marginTop: 10 }}>
        <div style={{ padding: 8, borderRight: BORDER, fontSize: 9 }} data-testid="attendance-strip">
          <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 6 }}>ASSIDUITE</div>
          <div style={{ marginBottom: 3 }}>ABSENCE JUSTIFIEES : {combinedAttendance ? (combinedAttendance.absences_total - combinedAttendance.absences_injustifiees) : ''}</div>
          <div style={{ marginBottom: 3 }}>ABSENCES INJUSTIFIEES : {combinedAttendance ? combinedAttendance.absences_injustifiees : ''}</div>
          <div style={{ marginBottom: 3 }}>RETARDS JUSTIFIES : 0</div>
          <div>RETARDS INJUSTIFIES : {combinedAttendance ? combinedAttendance.retards : ''}</div>
        </div>
        <div style={{ padding: 8, borderRight: BORDER, minHeight: 90 }}>
          <div style={{ fontWeight: 700, fontSize: 10 }}>APPRECIATION GENERALE :</div>
        </div>
        <div style={{ padding: 8, textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 10 }}>DIERECTEUR DE L'ETABLISSEMENT</div>
          <div style={{ fontStyle: 'italic', fontSize: 8, marginTop: 3 }}>(nom, prenom, signature et<br />cachet de letablissement)</div>
          {signatories.length > 0 && signatories[0].signature_image && (
            <img src={signatories[0].signature_image} alt="" style={{ maxHeight: 36, maxWidth: '100%', objectFit: 'contain', marginTop: 6 }} crossOrigin="anonymous" />
          )}
          {signatories.length > 0 && signatories[0].name && !signatories[0].is_stamp && (
            <div style={{ fontSize: 9, fontWeight: 600, marginTop: 4 }}>{signatories[0].name}</div>
          )}
        </div>
      </div>
    </A4FitWrapper>
  );
};

// ─── Helpers ──────────────────────────────────────────
const IdBoxRow: React.FC<{ label: string; value: React.ReactNode; last?: boolean }> = ({ label, value, last }) => (
  <div style={{ padding: '4px 6px', borderBottom: last ? 'none' : '1px solid #000', fontSize: 9 }}>
    <div style={{ fontSize: 8, color: '#000' }}>{label}</div>
    <div style={{ fontSize: 10, fontWeight: 600, minHeight: 12 }}>{value}</div>
  </div>
);

export default CombinedBulletinRenderer;
