import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { resolveConfigForPeriod } from '@/services/bulletinConfigService';
import {
  computeStudentPeriodBulletin,
  pickMention,
} from '@/services/bulletinClientCalculator';
import { aggregateCombinedAverage, type CombinedPeriodConfig } from '@/services/combinedPeriodService';
import { teachingUnitService, type TeachingUnit } from '@/services/teachingUnitService';
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
  signatories,
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
        .select('id, title, coefficient, order_index, teaching_unit_id, semester, credits')
        .eq('formation_id', formationId)
        .order('order_index');
      return (data || []) as any[];
    },
  });

  // ─── Load UEs (for grouping in subjects table) ───────────
  const { data: teachingUnits = [] } = useQuery<TeachingUnit[]>({
    queryKey: ['combined-bulletin-ues', formationId],
    queryFn: () => teachingUnitService.listForFormation(formationId),
    enabled: !!formationId,
  });

  const moduleToUE = React.useMemo(() => {
    const m = new Map<string, string | null>();
    for (const mod of modules as any[]) m.set(mod.id, mod.teaching_unit_id || null);
    return m;
  }, [modules]);

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

  void referenceNumber;
  const FONT_SANS = 'Arial, Helvetica, sans-serif';
  const BORDER = '1px solid #000';
  const PERIOD_COLORS = [INK, INK, INK, INK];
  const [firstName, ...lastNameParts] = (studentFullName || '').split(' ');
  const lastName = lastNameParts.join(' ');

  return (
    <div
      style={{
        background: '#fff',
        color: '#000',
        fontFamily: FONT_SANS,
        padding: '12mm',
        maxWidth: '210mm',
        margin: '0 auto',
      }}
      data-testid="combined-bulletin"
    >
      {/* ═══ HEADER — identical to Simple + BTS Blanc ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, marginBottom: 10, alignItems: 'center' }}>
        <div style={{ fontSize: 10, textAlign: 'left' }}>
          {establishmentLogoUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={establishmentLogoUrl} alt="" style={{ height: 36, objectFit: 'contain' }} crossOrigin="anonymous" />
              <div>
                <div style={{ fontWeight: 600, fontSize: 10 }}>{establishmentName}</div>
                {establishmentAddress && <div style={{ fontSize: 9 }}>{establishmentAddress}</div>}
              </div>
            </div>
          ) : (
            <span>LOGO , NOM ET ADRESSE DE L'ETABLISSEMENT</span>
          )}
        </div>
        <div style={{ fontSize: 10, textAlign: 'center' }}>bulletin combiné</div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.5 }}>RELEVE DE NOTES</div>
          <div style={{ fontSize: 9, marginTop: 2 }}>( {finalLabel} )</div>
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

      {/* ═══ BODY: PER-PERIOD TABLES (keeps existing aggregation logic) ═══ */}
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
            <div key={pr.period.id} style={{ marginBottom: idx === sourceResults.length - 1 ? 14 : 18 }} data-testid={`combined-source-bulletin-${idx}`}>
              {/* Period banner — B&W grey */}
              <div style={{
                background: '#E0E0E0',
                padding: '6px 10px',
                border: '1px solid #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 11,
              }}>
                <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {pr.period.name}
                  {weightPct !== null && <span style={{ fontWeight: 400, marginLeft: 10 }}>— Poids : {weightPct}%</span>}
                </span>
                <span style={{ fontWeight: 700 }}>
                  Moy. : {fmt(pr.general_average)}/20
                </span>
              </div>

              {/* Subjects table — B&W strict */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, fontFamily: FONT_SANS, marginTop: -1 }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #000', padding: '6px', background: '#E0E0E0', color: '#000', fontSize: 10, fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', width: '32%' }}>Matière</th>
                    <th style={{ border: '1px solid #000', padding: '6px', background: '#E0E0E0', color: '#000', fontSize: 10, fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', width: '10%' }}>CC</th>
                    <th style={{ border: '1px solid #000', padding: '6px', background: '#E0E0E0', color: '#000', fontSize: 10, fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', width: '10%' }}>DS</th>
                    <th style={{ border: '1px solid #000', padding: '6px', background: '#E0E0E0', color: '#000', fontSize: 10, fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', width: '14%' }}>Exam Final</th>
                    <th style={{ border: '1px solid #000', padding: '6px', background: '#E0E0E0', color: '#000', fontSize: 10, fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', width: '12%' }}>Oral</th>
                    <th style={{ border: '1px solid #000', padding: '6px', background: '#E0E0E0', color: '#000', fontSize: 10, fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', width: '10%' }}>Moy.</th>
                    <th style={{ border: '1px solid #000', padding: '6px', background: '#E0E0E0', color: '#000', fontSize: 10, fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', width: '12%' }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {pr.rows.length === 0 ? (
                    <tr><td colSpan={7} style={{ border: '1px solid #000', padding: 14, textAlign: 'center', fontStyle: 'italic', color: '#000', background: '#fff' }}>Aucune donnée saisie pour cette période.</td></tr>
                  ) : (() => {
                    const sections: Array<{ ue: TeachingUnit | null; rows: typeof pr.rows }> = [];
                    const map = new Map<string, typeof pr.rows>();
                    for (const r of pr.rows) {
                      const k = moduleToUE.get(r.moduleId) || '_unassigned';
                      const arr = map.get(k) || [];
                      arr.push(r);
                      map.set(k, arr);
                    }
                    for (const ue of teachingUnits) {
                      const rs = map.get(ue.id);
                      if (rs && rs.length > 0) sections.push({ ue, rows: rs });
                    }
                    const un = map.get('_unassigned') || [];
                    if (un.length > 0) sections.push({ ue: null, rows: un });

                    return sections.map(({ ue, rows: ueRows }, ueIdx) => {
                      let w = 0, c = 0;
                      let totalCoef = 0;
                      for (const r of ueRows) {
                        if (r.moy !== null) { w += r.moy * r.coefficient; c += r.coefficient; }
                        totalCoef += r.coefficient;
                      }
                      const ueAvg = c > 0 ? Math.round((w / c) * 100) / 100 : null;
                      const key = ue?.id || '_unassigned';
                      return (
                        <React.Fragment key={key}>
                          <tr data-testid={`combined-ue-header-${pr.period.id}-${key}`}>
                            <td colSpan={7} style={{
                              border: '1px solid #000',
                              background: '#E0E0E0',
                              padding: '5px 8px',
                              fontSize: 9.5,
                              fontWeight: 700,
                              color: '#000',
                              textTransform: 'uppercase',
                              letterSpacing: 0.5,
                            }}>
                              UNITE D'ENSEIGNEMENT {ueIdx + 1}{ue?.title ? ` — ${ue.title.toUpperCase()}` : ''}
                            </td>
                          </tr>
                          {ueRows.map((row) => {
                            const validated = row.moy !== null && row.moy >= admissionThreshold && !row.eliminated;
                            return (
                              <tr key={row.moduleId}>
                                <td style={{ border: '1px solid #000', padding: '5px 6px', fontSize: 10, color: '#000', fontWeight: 500, textTransform: 'uppercase' }}>{row.moduleTitle}</td>
                                <td style={{ border: '1px solid #000', padding: '5px 6px', fontSize: 10, color: '#000', textAlign: 'center' }}>{row.cc !== null ? Math.round(row.cc) : ''}</td>
                                <td style={{ border: '1px solid #000', padding: '5px 6px', fontSize: 10, color: '#000', textAlign: 'center' }}>{row.ds !== null ? Math.round(row.ds) : ''}</td>
                                <td style={{ border: '1px solid #000', padding: '5px 6px', fontSize: 10, color: '#000', textAlign: 'center' }}>{row.exam !== null ? Math.round(row.exam) : ''}</td>
                                <td style={{ border: '1px solid #000', padding: '5px 6px', fontSize: 10, color: '#000', textAlign: 'center' }}>{row.oral !== null ? Math.round(row.oral) : ''}</td>
                                <td style={{ border: '1px solid #000', padding: '5px 6px', fontSize: 11, color: '#000', textAlign: 'center', fontWeight: 700 }}>{fmt(row.moy)}</td>
                                <td style={{ border: '1px solid #000', padding: '5px 6px', fontSize: 9, color: '#000', textAlign: 'center' }}>
                                  {validated ? 'Validé' : row.moy === null ? '' : 'Ajourné'}
                                </td>
                              </tr>
                            );
                          })}
                          <tr data-testid={`combined-ue-subtotal-${pr.period.id}-${key}`}>
                            <td colSpan={5} style={{ border: '1px solid #000', background: '#fff', padding: '5px 8px', fontSize: 9.5, fontWeight: 700, color: '#000', textAlign: 'right', textTransform: 'uppercase' }}>
                              Moyenne {ue?.code ? `${ue.code} ` : ''}(coef. {totalCoef})
                            </td>
                            <td style={{ border: '1px solid #000', background: '#fff', padding: '5px 6px', fontSize: 11, fontWeight: 700, color: '#000', textAlign: 'center' }}>
                              {fmt(ueAvg)}
                            </td>
                            <td style={{ border: '1px solid #000', background: '#fff', padding: '5px 6px', fontSize: 9, color: '#000', textAlign: 'center', fontStyle: 'italic' }}>
                              {ueAvg === null ? '' : ueAvg >= admissionThreshold ? 'UE validée' : 'UE non validée'}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {/* ═══ FINAL SUMMARY FOOTER ROW (same structure as Simple bulletin) ═══ */}
      <div style={{ padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT_SANS }} data-testid="combined-final-section">
          <tbody>
            <tr>
              <th style={{ border: '1px solid #000', padding: '6px', background: '#E0E0E0', color: '#000', fontSize: 10, fontWeight: 700, textAlign: 'center', textTransform: 'uppercase' }}>MOYENNE GENERALE COMBINEE</th>
              <th style={{ border: '1px solid #000', padding: '6px', background: '#E0E0E0', color: '#000', fontSize: 10, fontWeight: 700, textAlign: 'center', textTransform: 'uppercase' }}>MENTION</th>
              <th style={{ border: '1px solid #000', padding: '6px', background: '#E0E0E0', color: '#000', fontSize: 10, fontWeight: 700, textAlign: 'center', textTransform: 'uppercase' }}>REGLE DE CALCUL</th>
              <th style={{ border: '1px solid #000', padding: '6px', background: '#E0E0E0', color: '#000', fontSize: 10, fontWeight: 700, textAlign: 'center', textTransform: 'uppercase' }}>DECISION (ADIMIS OU NON ADMIS)</th>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px 6px', fontSize: 14, color: '#000', textAlign: 'center', fontWeight: 700 }}>{fmt(combinedAverage)}/20</td>
              <td style={{ border: '1px solid #000', padding: '8px 6px', fontSize: 11, color: '#000', textAlign: 'center', fontWeight: 600 }}>{combinedMention || ''}</td>
              <td style={{ border: '1px solid #000', padding: '8px 6px', fontSize: 10, color: '#000', textAlign: 'center' }}>{ruleLabel[compositeConfig.calculation_rule] || compositeConfig.calculation_rule}</td>
              <td style={{ border: '1px solid #000', padding: '8px 6px', fontSize: 11, color: '#000', textAlign: 'center', fontWeight: 700 }}>
                {combinedAdmitted === true ? 'ADMIS' : combinedAdmitted === false ? 'NON ADMIS' : combinedDecisionLabel}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

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
    </div>
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
