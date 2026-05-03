import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { computeStudentPeriodBulletin } from '@/services/bulletinClientCalculator';
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
  sourcePeriods?: EvaluationPeriod[];
  studentDateOfBirth?: string | null;
  studentNumber?: string | null;
  studentNumeroCE?: string | null;
  studentNumeroINE?: string | null;
  establishmentAddress?: string | null;
}

/**
 * Simple period bulletin (S1, S2, …).
 *
 * Black & white minimalist layout matching user's maquette :
 *   Header  : LOGO / NOM / ADRESSE  ·  RELEVÉ DE NOTES (title)
 *   Identity: NOM / PRÉNOM / DATE NAISSANCE  ·  FORMATION / ANNÉE / N° ÉTUDIANT / N° CE / N° INE
 *   Table   : UE rows + matières grouped by UE with columns
 *             FORMATEUR | COEFFICIENT | MOYENNE DE L'ÉTUDIANT | MOYENNE DE LA PROMO | APPRÉCIATION
 *   Footer  : MOYENNE GÉNÉRALE | TOTAL COEFFICIENT | MOY. ÉTUDIANT | MOY. PROMO | DÉCISION
 *   Bottom  : ASSIDUITÉ  ·  APPRÉCIATION GÉNÉRALE  ·  DIRECTEUR DE L'ÉTABLISSEMENT
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
  instructorsByModuleId,
  sourcePeriods,
  studentDateOfBirth,
  studentNumber,
  studentNumeroCE,
  studentNumeroINE,
  establishmentAddress,
}) => {
  const admissionThreshold = config.decision_rules?.admission_threshold ?? 10;

  const [firstName, ...lastNameParts] = (studentFullName || '').split(' ');
  const lastName = lastNameParts.join(' ');

  // ── Data ───────────────────────────────────────────────
  const { data: modules = [] } = useQuery({
    queryKey: ['simple-bulletin-modules', formationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('formation_modules')
        .select('id, title, coefficient, order_index, teaching_unit_id')
        .eq('formation_id', formationId)
        .order('order_index');
      return (data || []) as any[];
    },
  });

  const { data: teachingUnits = [] } = useQuery<TeachingUnit[]>({
    queryKey: ['simple-bulletin-ues', formationId],
    queryFn: () => teachingUnitService.listForFormation(formationId),
    enabled: !!formationId,
  });

  const { data: roster = [] } = useQuery({
    queryKey: ['simple-bulletin-roster', formationId],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_formation_students', { formation_id_param: formationId });
      return (data || []) as any[];
    },
    enabled: !!formationId,
  });

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
      const mine = computeStudentPeriodBulletin({ studentId, config, modules: modules as any, evaluations: (evals || []) as any, grades: allGrades as any });
      const others = roster.map((s: any) => ({
        studentId: s.user_id,
        bulletin: computeStudentPeriodBulletin({ studentId: s.user_id, config, modules: modules as any, evaluations: (evals || []) as any, grades: allGrades as any }),
      }));
      const classAvgByModule = new Map<string, number | null>();
      for (const mod of modules) {
        const vals: number[] = [];
        for (const o of others) {
          const mm = o.bulletin.modules.find((m) => m.module_id === mod.id);
          if (mm?.module_average !== null && mm?.module_average !== undefined) vals.push(mm.module_average);
        }
        classAvgByModule.set(mod.id, vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : null);
      }
      const allGen = others.map((o) => o.bulletin.general_average).filter((v): v is number => v !== null);
      const classGeneral = allGen.length ? Math.round((allGen.reduce((a, b) => a + b, 0) / allGen.length) * 100) / 100 : null;
      return {
        rows: mine.modules.map((m) => ({
          moduleId: m.module_id,
          moduleTitle: m.module_title,
          coefficient: m.coefficient,
          individualAverage: m.module_average,
          classAverage: classAvgByModule.get(m.module_id) ?? null,
          appreciation: m.appreciation,
        })),
        general_average: mine.general_average,
        class_general_average: classGeneral,
        decision: mine.decision,
        admitted: mine.admitted,
      };
    },
    enabled: modules.length > 0,
  });

  const attendanceQ = useQuery({
    queryKey: ['simple-bulletin-attendance', period.id, studentId, sourcePeriods?.map((p) => p.id).join(',') || ''],
    queryFn: async () => {
      const ranges: DateRange[] = [];
      if ((period as any).is_composite && sourcePeriods && sourcePeriods.length > 0) {
        for (const sp of sourcePeriods) if (sp.start_date && sp.end_date) ranges.push({ start: sp.start_date, end: sp.end_date });
      } else if (period.start_date && period.end_date) ranges.push({ start: period.start_date, end: period.end_date });
      return getStudentAttendanceForRanges(studentId, formationId, ranges);
    },
    enabled: !!studentId && !!formationId,
  });

  const result = computedQ.data;
  const attendance = attendanceQ.data;

  if (computedQ.isLoading || !result) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" /></div>;
  }

  // Group rows by UE
  const moduleToUEId = new Map<string, string | null>();
  for (const mod of modules as any[]) moduleToUEId.set(mod.id, mod.teaching_unit_id || null);
  const rowsByUE = new Map<string, typeof result.rows>();
  for (const row of result.rows) {
    const k = moduleToUEId.get(row.moduleId) || '_unassigned';
    const arr = rowsByUE.get(k) || [];
    arr.push(row);
    rowsByUE.set(k, arr);
  }
  const ueSections: Array<{ ue: TeachingUnit | null; rows: typeof result.rows }> = [];
  for (const ue of teachingUnits) {
    const rs = rowsByUE.get(ue.id);
    if (rs && rs.length > 0) ueSections.push({ ue, rows: rs });
  }
  const unassigned = rowsByUE.get('_unassigned') || [];
  if (unassigned.length > 0) ueSections.push({ ue: null, rows: unassigned });

  // Total coefficient
  const totalCoef = result.rows.reduce((s, r) => s + r.coefficient, 0);

  const title = (period.name || 'RELEVÉ').toUpperCase();

  return (
    <div
      className="bg-white mx-auto"
      style={{
        maxWidth: '210mm',
        fontFamily: '"Times New Roman", Georgia, serif',
        color: '#000',
        border: '1px solid #000',
        padding: '14mm 12mm',
      }}
      data-testid="simple-bulletin"
    >
      {/* HEADER */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, borderBottom: '1px solid #000', paddingBottom: 10, marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          {establishmentLogoUrl ? (
            <img src={establishmentLogoUrl} alt="" style={{ width: 58, height: 58, objectFit: 'contain' }} crossOrigin="anonymous" />
          ) : (
            <div style={{ width: 58, height: 58, border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, padding: 4, textAlign: 'center', lineHeight: 1.1 }}>
              LOGO
            </div>
          )}
          <div style={{ fontSize: 10 }}>
            <p style={{ fontWeight: 700, fontSize: 12, marginBottom: 2 }}>{establishmentName}</p>
            {establishmentAddress && <p style={{ color: '#333' }}>{establishmentAddress}</p>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 16, fontWeight: 800, letterSpacing: 1 }}>RELEVÉ DE NOTES</p>
          <p style={{ fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>{title}</p>
          <p style={{ fontSize: 9, marginTop: 4, color: '#555' }}>Réf : {referenceNumber}</p>
        </div>
      </div>

      {/* IDENTITY */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5, border: '1px solid #000', marginBottom: 10 }}>
        <tbody>
          <tr>
            <IdCell label="NOM ÉTUDIANT" value={(lastName || studentFullName).toUpperCase()} />
            <IdCell label="FORMATION" value={formationTitle} />
            <IdCell label="NUMÉRO ÉTUDIANT" value={studentNumber || studentMatricule || '—'} last />
          </tr>
          <tr>
            <IdCell label="PRÉNOM ÉTUDIANT" value={firstName || '—'} />
            <IdCell label="ANNÉE" value={academicYear} />
            <IdCell label="NUMÉRO CE" value={studentNumeroCE || '—'} last />
          </tr>
          <tr>
            <IdCell label="DATE DE NAISSANCE" value={studentDateOfBirth ? formatDate(studentDateOfBirth) : '—'} />
            <IdCell label="NIVEAU" value={formationLevel || '—'} />
            <IdCell label="NUMÉRO INE" value={studentNumeroINE || '—'} last />
          </tr>
        </tbody>
      </table>

      {/* GRADES TABLE */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, border: '1px solid #000' }}>
        <thead>
          <tr style={{ background: '#e8e8e8' }}>
            <th style={th({ width: '22%', borderRight: '1px solid #000' })} rowSpan={2}>UNITÉ D'ENSEIGNEMENT / MATIÈRE</th>
            <th style={th({ width: '14%', borderRight: '1px solid #000' })} rowSpan={2}>FORMATEUR</th>
            <th style={th({ width: '9%', borderRight: '1px solid #000' })} rowSpan={2}>COEFFICIENT</th>
            <th style={th({ width: '20%', borderRight: '1px solid #000' })} colSpan={2}>MOYENNE</th>
            <th style={th({ width: '35%' })} rowSpan={2}>APPRÉCIATION</th>
          </tr>
          <tr style={{ background: '#e8e8e8' }}>
            <th style={th({ borderRight: '1px solid #000', borderTop: '1px solid #000', fontSize: 9 })}>MOYENNE DE L'ÉTUDIANT</th>
            <th style={th({ borderRight: '1px solid #000', borderTop: '1px solid #000', fontSize: 9 })}>MOYENNE DE LA PROMO</th>
          </tr>
        </thead>
        <tbody>
          {ueSections.length === 0 ? (
            <tr><td colSpan={6} style={{ padding: 14, textAlign: 'center', fontStyle: 'italic' }}>Aucune donnée saisie pour cette période.</td></tr>
          ) : ueSections.map(({ ue, rows }, ueIdx) => {
            const key = ue?.id || '_unassigned';
            let w = 0, c = 0, wp = 0, cp = 0;
            for (const r of rows) {
              if (r.individualAverage !== null) { w += r.individualAverage * r.coefficient; c += r.coefficient; }
              if (r.classAverage !== null) { wp += r.classAverage * r.coefficient; cp += r.coefficient; }
            }
            const ueAvg = c > 0 ? Math.round((w / c) * 100) / 100 : null;
            const ueAvgPromo = cp > 0 ? Math.round((wp / cp) * 100) / 100 : null;
            const ueTotalCoef = rows.reduce((s, r) => s + r.coefficient, 0);
            return (
              <React.Fragment key={key}>
                {/* UE label row (spans the whole width) */}
                <tr style={{ background: '#f0f0f0' }} data-testid={`bulletin-ue-header-${key}`}>
                  <td colSpan={6} style={{ padding: '5px 8px', fontWeight: 800, fontSize: 10.5, letterSpacing: 0.6, borderTop: ueIdx > 0 ? '1px solid #000' : 'none', borderBottom: '1px solid #000' }}>
                    {ue ? `UNITÉ D'ENSEIGNEMENT — ${ue.title.toUpperCase()}${ue.code ? ` (${ue.code})` : ''}` : 'MATIÈRES NON RATTACHÉES'}
                  </td>
                </tr>
                {/* Matières of this UE */}
                {rows.map((row) => {
                  const instructors = instructorsByModuleId?.get(row.moduleId) || [];
                  return (
                    <tr key={row.moduleId} data-testid={`bulletin-row-${row.moduleId}`}>
                      <td style={td({ borderRight: '1px solid #000', paddingLeft: 18, fontWeight: 600 })}>{row.moduleTitle}</td>
                      <td style={td({ borderRight: '1px solid #000', fontSize: 9.5 })}>{instructors.length > 0 ? instructors.join(', ') : '—'}</td>
                      <td style={td({ borderRight: '1px solid #000', textAlign: 'center', fontWeight: 600 })}>{row.coefficient}</td>
                      <td style={td({ borderRight: '1px solid #000', textAlign: 'center', fontWeight: 700 })}>{fmt(row.individualAverage)}</td>
                      <td style={td({ borderRight: '1px solid #000', textAlign: 'center' })}>{fmt(row.classAverage)}</td>
                      <td style={td({ fontStyle: 'italic', fontSize: 9.5 })}>{row.appreciation || '—'}</td>
                    </tr>
                  );
                })}
                {/* UE subtotal row */}
                <tr style={{ background: '#fafafa' }} data-testid={`bulletin-ue-subtotal-${key}`}>
                  <td style={{ ...td({ borderRight: '1px solid #000', padding: '5px 8px', textAlign: 'right' }), fontWeight: 700, fontSize: 9.5, textTransform: 'uppercase' }} colSpan={2}>
                    Moyenne {ue?.code || 'UE'}
                  </td>
                  <td style={{ ...td({ borderRight: '1px solid #000', textAlign: 'center' }), fontWeight: 700 }}>{ueTotalCoef}</td>
                  <td style={{ ...td({ borderRight: '1px solid #000', textAlign: 'center' }), fontWeight: 800 }}>{fmt(ueAvg)}</td>
                  <td style={{ ...td({ borderRight: '1px solid #000', textAlign: 'center' }), fontWeight: 700 }}>{fmt(ueAvgPromo)}</td>
                  <td style={td({ fontSize: 9, fontStyle: 'italic' })}>{ueAvg === null ? '—' : ueAvg >= admissionThreshold ? 'UE validée' : 'UE non validée'}</td>
                </tr>
              </React.Fragment>
            );
          })}
          {/* General footer row */}
          <tr style={{ background: '#e8e8e8' }}>
            <td style={{ ...td({ borderRight: '1px solid #000', borderTop: '1px solid #000', padding: '7px 8px' }), fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              MOYENNE GÉNÉRALE
            </td>
            <td style={{ ...td({ borderRight: '1px solid #000', borderTop: '1px solid #000' }), fontWeight: 700, fontSize: 9, textAlign: 'center' }}>
              TOTAL COEFFICIENT
            </td>
            <td style={{ ...td({ borderRight: '1px solid #000', borderTop: '1px solid #000' }), fontWeight: 700, textAlign: 'center' }}>
              {totalCoef}
            </td>
            <td style={{ ...td({ borderRight: '1px solid #000', borderTop: '1px solid #000' }), fontWeight: 800, textAlign: 'center', fontSize: 12 }}>
              {fmt(result.general_average)}/20
            </td>
            <td style={{ ...td({ borderRight: '1px solid #000', borderTop: '1px solid #000' }), fontWeight: 700, textAlign: 'center' }}>
              {fmt(result.class_general_average)}/20
            </td>
            <td style={{ ...td({ borderTop: '1px solid #000', padding: '7px 8px' }), fontWeight: 800, textAlign: 'center', textTransform: 'uppercase' }}>
              {result.admitted === true ? 'ADMIS' : result.admitted === false ? 'NON ADMIS' : result.decision || '—'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* BOTTOM : ASSIDUITÉ / APPRÉCIATION / DIRECTEUR */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 1fr', gap: 0, marginTop: 10, border: '1px solid #000' }}>
        {/* ASSIDUITÉ */}
        <div style={{ padding: 8, borderRight: '1px solid #000' }} data-testid="attendance-strip">
          <p style={{ fontWeight: 800, fontSize: 10, letterSpacing: 0.6, marginBottom: 5 }}>ASSIDUITÉ</p>
          <p style={{ fontSize: 9.5, marginBottom: 2 }}>ABSENCES JUSTIFIÉES : <strong>{attendance ? (attendance.absences_total - attendance.absences_injustifiees) : '—'}</strong></p>
          <p style={{ fontSize: 9.5, marginBottom: 2 }}>ABSENCES INJUSTIFIÉES : <strong>{attendance ? attendance.absences_injustifiees : '—'}</strong></p>
          <p style={{ fontSize: 9.5, marginBottom: 2 }}>RETARDS JUSTIFIÉS : <strong>0</strong></p>
          <p style={{ fontSize: 9.5 }}>RETARDS INJUSTIFIÉS : <strong>{attendance ? attendance.retards : '—'}</strong></p>
        </div>
        {/* APPRÉCIATION GÉNÉRALE */}
        <div style={{ padding: 8, borderRight: '1px solid #000', minHeight: 80 }}>
          <p style={{ fontWeight: 800, fontSize: 10, letterSpacing: 0.6, marginBottom: 5 }}>APPRÉCIATION GÉNÉRALE :</p>
          <p style={{ fontSize: 9.5, fontStyle: 'italic' }}>&nbsp;</p>
        </div>
        {/* DIRECTEUR */}
        <div style={{ padding: 8 }}>
          <p style={{ fontWeight: 800, fontSize: 10, letterSpacing: 0.6, marginBottom: 3 }}>DIRECTEUR DE L'ÉTABLISSEMENT</p>
          <p style={{ fontSize: 8.5, color: '#555', fontStyle: 'italic', marginBottom: 6 }}>(nom, prénom, signature et cachet de l'établissement)</p>
          {signatories.length > 0 && signatories[0].signature_image && (
            <img src={signatories[0].signature_image} alt="" style={{ maxHeight: 40, maxWidth: '100%', objectFit: 'contain' }} crossOrigin="anonymous" />
          )}
          {signatories.length > 0 && signatories[0].name && !signatories[0].is_stamp && (
            <p style={{ fontSize: 9.5, fontWeight: 600, marginTop: 4 }}>{signatories[0].name}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const IdCell: React.FC<{ label: string; value: React.ReactNode; last?: boolean }> = ({ label, value, last }) => (
  <td style={{ padding: '5px 8px', borderRight: last ? 'none' : '1px solid #000', borderBottom: '1px solid #000', verticalAlign: 'top', width: '33%' }}>
    <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: '#333' }}>{label}</p>
    <p style={{ fontSize: 10.5, fontWeight: 600, marginTop: 1 }}>{value}</p>
  </td>
);

const th = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  padding: '6px 6px',
  fontSize: 9.5,
  fontWeight: 800,
  textAlign: 'center',
  letterSpacing: 0.3,
  borderBottom: '1px solid #000',
  ...extra,
});
const td = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  padding: '5px 6px',
  fontSize: 10,
  borderBottom: '1px solid #ccc',
  verticalAlign: 'top',
  ...extra,
});

const formatDate = (iso: string): string => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR');
  } catch { return iso; }
};

export default SimpleBulletinTemplate;
