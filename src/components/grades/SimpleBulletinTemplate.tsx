import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { computeStudentPeriodBulletin } from '@/services/bulletinClientCalculator';
import { getStudentAttendanceForRanges, type DateRange } from '@/services/periodAttendanceService';
import { teachingUnitService, type TeachingUnit } from '@/services/teachingUnitService';
import type { ResolvedBulletinConfig } from '@/types/bulletinConfig';
import type { EvaluationPeriod } from '@/services/gradesService';

const fmt = (v: number | null): string => (v === null ? '' : v.toFixed(v === Math.floor(v) ? 0 : 2));

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
 * Simple period bulletin — pixel-perfect reproduction of the user's PDF maquette.
 * Layout:
 *   Top strip: [LOGO , NOM ET ADRESSE DE L'ETABLISSEMENT]   [bulletin semestre]   [RELEVE DE NOTES / TITRE]
 *   2 identity boxes side-by-side: [NOM/PRENOM/DATE DE NAISSANCE  +  FORMATION/ANNEE] | [NUMERO ETUDIANT/CE/INE]
 *   Table with columns:
 *     UNITE D'ENSEIGNEMENT 1 | FORMATEUR | COEFFICIENT | MOYENNE (→ MOY ETUDIANT + MOY PROMO per row) | APPRECIATION
 *     Next UE below (UNITE D'ENSEIGNEMENT 2) in same structure
 *   Bottom row header (grey): MOYENNE GENERALE / TOTAL COEFICIENT / MOYENNE GENERALE DE L'ETUDIANT / MOYENNE GENERALE DE LA PROMO / DECISION (ADIMIS OU NON ADMIS)
 *   3 boxes: ASSIDUITE | APPRECIATION GENERALE | DIERECTEUR DE L'ETABLISSEMENT
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
  void referenceNumber; void formationLevel; void config;
  const admissionThreshold = 10;
  const [firstName, ...lastNameParts] = (studentFullName || '').split(' ');
  const lastName = lastNameParts.join(' ');

  const { data: modules = [] } = useQuery({
    queryKey: ['simple-bulletin-modules', formationId],
    queryFn: async () => {
      const { data } = await supabase.from('formation_modules').select('id, title, coefficient, order_index, teaching_unit_id').eq('formation_id', formationId).order('order_index');
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
    queryKey: ['simple-bulletin-compute', period.id, studentId, modules.length, roster.length],
    queryFn: async () => {
      if (modules.length === 0) return null;
      const moduleIds = modules.map((m: any) => m.id);
      const { data: evals } = await supabase.from('evaluations').select('id, module_id, period_id, evaluation_type, scale').in('module_id', moduleIds).eq('period_id', period.id);
      const evalIds = (evals || []).map((e: any) => e.id);
      const studentIds = roster.map((s: any) => s.user_id);
      let allGrades: any[] = [];
      if (evalIds.length > 0 && studentIds.length > 0) {
        const { data } = await supabase.from('grades').select('evaluation_id, student_id, value, is_absent, is_excused, is_dispensed, is_cheating').in('evaluation_id', evalIds).in('student_id', studentIds);
        allGrades = data || [];
      }
      const mine = computeStudentPeriodBulletin({ studentId, config, modules: modules as any, evaluations: (evals || []) as any, grades: allGrades as any });
      const others = roster.map((s: any) => ({ studentId: s.user_id, bulletin: computeStudentPeriodBulletin({ studentId: s.user_id, config, modules: modules as any, evaluations: (evals || []) as any, grades: allGrades as any }) }));
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
        rows: mine.modules.map((m) => ({ moduleId: m.module_id, moduleTitle: m.module_title, coefficient: m.coefficient, individualAverage: m.module_average, classAverage: classAvgByModule.get(m.module_id) ?? null, appreciation: m.appreciation })),
        general_average: mine.general_average, class_general_average: classGeneral, decision: mine.decision, admitted: mine.admitted,
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
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}><div style={{ width: 28, height: 28, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>;
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
  const ueSections: Array<{ ue: TeachingUnit | null; rows: typeof result.rows; number: number }> = [];
  let ueCounter = 0;
  for (const ue of teachingUnits) {
    const rs = rowsByUE.get(ue.id);
    if (rs && rs.length > 0) { ueCounter += 1; ueSections.push({ ue, rows: rs, number: ueCounter }); }
  }
  const unassigned = rowsByUE.get('_unassigned') || [];
  if (unassigned.length > 0) ueSections.push({ ue: null, rows: unassigned, number: ueCounter + 1 });

  const totalCoef = result.rows.reduce((s, r) => s + r.coefficient, 0);
  const periodTitle = (period.name || '').toLowerCase();

  // ── Styles ────────────────────────────────────────────
  const FONT = 'Arial, Helvetica, sans-serif';
  const BORDER = '1px solid #000';
  const GREY = '#E0E0E0';

  const thCell: React.CSSProperties = { border: BORDER, padding: '6px 6px', fontSize: 10, fontWeight: 700, textAlign: 'center', background: GREY, textTransform: 'uppercase', color: '#000' };
  const tdCell: React.CSSProperties = { border: BORDER, padding: '6px 6px', fontSize: 9, color: '#000', verticalAlign: 'top', minHeight: 24 };

  return (
    <div style={{ background: '#fff', color: '#000', fontFamily: FONT, padding: '12mm', maxWidth: '210mm', margin: '0 auto' }} data-testid="simple-bulletin">
      {/* ═══ HEADER ROW ═══ */}
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
        <div style={{ fontSize: 10, textAlign: 'center' }}>bulletin semestre</div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.5, color: '#000' }}>RELEVE DE NOTES</div>
          <div style={{ fontSize: 9, marginTop: 2 }}>{periodTitle ? `( ${periodTitle} )` : '( semestre 1, 2 par exemple )'}</div>
        </div>
      </div>

      {/* ═══ 2 IDENTITY BOXES SIDE BY SIDE ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10, marginBottom: 10 }}>
        {/* LEFT identity box: NOM / PRENOM / DATE NAISSANCE | FORMATION / ANNEE */}
        <div style={{ border: BORDER, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <IdRow label="NOM ETUDIANT" value={(lastName || studentFullName || '').toUpperCase()} />
            <IdRow label="PRENOM ETUDIANT" value={firstName || ''} />
            <IdRow label="DATE DE NAISSANCE" value={studentDateOfBirth ? formatDate(studentDateOfBirth) : ''} last />
          </div>
          <div style={{ borderLeft: BORDER }}>
            <IdRow label="FORMATION" value={formationTitle || ''} />
            <IdRow label="ANNEE" value={academicYear || ''} last />
          </div>
        </div>
        {/* RIGHT identity box: NUMERO ETUDIANT / CE / INE */}
        <div style={{ border: BORDER }}>
          <IdRow label="NUMERO ETUDIANT" value={studentNumber || studentMatricule || ''} />
          <IdRow label="NUMERO CE" value={studentNumeroCE || ''} />
          <IdRow label="NUMERO INE" value={studentNumeroINE || ''} last />
        </div>
      </div>

      {/* ═══ GRADES TABLE ═══ */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT }}>
        <colgroup>
          <col style={{ width: '24%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '30%' }} />
        </colgroup>
        <tbody>
          {ueSections.length === 0 ? (
            <tr><td colSpan={6} style={{ ...tdCell, textAlign: 'center', fontStyle: 'italic', padding: 14 }}>Aucune donnée saisie pour cette période.</td></tr>
          ) : ueSections.map(({ ue, rows, number }) => {
            // UE weighted averages
            let w = 0, c = 0, wp = 0, cp = 0;
            for (const r of rows) {
              if (r.individualAverage !== null) { w += r.individualAverage * r.coefficient; c += r.coefficient; }
              if (r.classAverage !== null) { wp += r.classAverage * r.coefficient; cp += r.coefficient; }
            }
            const ueAvg = c > 0 ? Math.round((w / c) * 100) / 100 : null;
            const ueAvgPromo = cp > 0 ? Math.round((wp / cp) * 100) / 100 : null;
            const key = ue?.id || '_unassigned';
            return (
              <React.Fragment key={key}>
                {/* UE header row — first cell grey with UNITE D'ENSEIGNEMENT N, other cells are normal column headers */}
                <tr data-testid={`bulletin-ue-header-${key}`}>
                  <th style={{ ...thCell, textAlign: 'left', paddingLeft: 8 }}>
                    UNITE D'ENSEIGNEMENT {number}
                    {ue?.title ? <div style={{ fontSize: 8, fontWeight: 400, marginTop: 2, textTransform: 'none' }}>{ue.title}</div> : null}
                  </th>
                  <th style={thCell}>FORMATEUR</th>
                  <th style={thCell}>COEFFICIENT</th>
                  <th style={thCell} colSpan={2}>MOYENNE</th>
                  <th style={thCell}>APPRECIATION</th>
                </tr>
                {/* Matières rows - MOYENNE cell is split into "MOYENNE DE L'ETUDIANT" + "MOYENNE DE LA PROMO" */}
                {rows.map((row) => {
                  const instructors = instructorsByModuleId?.get(row.moduleId) || [];
                  return (
                    <tr key={row.moduleId} data-testid={`bulletin-row-${row.moduleId}`}>
                      <td style={{ ...tdCell, textTransform: 'uppercase', fontWeight: 500 }}>{row.moduleTitle}</td>
                      <td style={{ ...tdCell, textAlign: 'center' }}>{instructors.length > 0 ? instructors.join(', ') : ''}</td>
                      <td style={{ ...tdCell, textAlign: 'center' }}>{row.coefficient}</td>
                      <td style={{ ...tdCell, textAlign: 'center' }}>
                        <div style={{ fontSize: 7, color: '#000', fontStyle: 'italic' }}>MOYENNE DE L'ETUDIANT</div>
                        <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>{fmt(row.individualAverage)}</div>
                      </td>
                      <td style={{ ...tdCell, textAlign: 'center' }}>
                        <div style={{ fontSize: 7, color: '#000', fontStyle: 'italic' }}>MOYENNE DE LA PROMO</div>
                        <div style={{ fontSize: 11, fontWeight: 500, marginTop: 2 }}>{fmt(row.classAverage)}</div>
                      </td>
                      <td style={{ ...tdCell, fontStyle: 'italic' }}>{row.appreciation || ''}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
          {/* Footer grey header row: MOYENNE GENERALE | TOTAL COEFICIENT | MOYENNE GENERALE DE L'ETUDIANT | MOYENNE GENERALE DE LA PROMO | DECISION */}
          <tr>
            <th style={thCell}>MOYENNE GENERALE</th>
            <th style={thCell} colSpan={2}>TOTAL COEFICIENT</th>
            <th style={thCell}>MOYENNE GENERALE DE L'ETUDIANT</th>
            <th style={thCell}>MOYENNE GENERALE DE LA PROMO</th>
            <th style={thCell}>DECISION (ADIMIS OU NON ADMIS)</th>
          </tr>
          <tr>
            <td style={{ ...tdCell, height: 28 }}></td>
            <td style={{ ...tdCell, textAlign: 'center', fontWeight: 700 }} colSpan={2}>{totalCoef}</td>
            <td style={{ ...tdCell, textAlign: 'center', fontWeight: 700, fontSize: 12 }}>{fmt(result.general_average)}</td>
            <td style={{ ...tdCell, textAlign: 'center', fontWeight: 500, fontSize: 11 }}>{fmt(result.class_general_average)}</td>
            <td style={{ ...tdCell, textAlign: 'center', fontWeight: 700 }}>
              {result.admitted === true ? 'ADMIS' : result.admitted === false ? 'NON ADMIS' : ''}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ═══ 3 BOTTOM BOXES: ASSIDUITE | APPRECIATION GENERALE | DIERECTEUR ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', border: BORDER, marginTop: 10 }}>
        {/* ASSIDUITE */}
        <div style={{ padding: 8, borderRight: BORDER, fontSize: 9 }} data-testid="attendance-strip">
          <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 6 }}>ASSIDUITE</div>
          <div style={{ marginBottom: 3 }}>ABSENCE JUSTIFIEES : {attendance ? (attendance.absences_total - attendance.absences_injustifiees) : ''}</div>
          <div style={{ marginBottom: 3 }}>ABSENCES INJUSTIFIEES : {attendance ? attendance.absences_injustifiees : ''}</div>
          <div style={{ marginBottom: 3 }}>RETARDS JUSTIFIES : 0</div>
          <div>RETARDS INJUSTIFIES : {attendance ? attendance.retards : ''}</div>
        </div>
        {/* APPRECIATION GENERALE */}
        <div style={{ padding: 8, borderRight: BORDER, minHeight: 90 }}>
          <div style={{ fontWeight: 700, fontSize: 10 }}>APPRECIATION GENERALE :</div>
        </div>
        {/* DIERECTEUR */}
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

const IdRow: React.FC<{ label: string; value: React.ReactNode; last?: boolean }> = ({ label, value, last }) => (
  <div style={{ padding: '4px 6px', borderBottom: last ? 'none' : '1px solid #000', fontSize: 9 }}>
    <div style={{ fontSize: 8, color: '#000' }}>{label}</div>
    <div style={{ fontSize: 10, fontWeight: 600, minHeight: 12 }}>{value}</div>
  </div>
);

const formatDate = (iso: string): string => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR');
  } catch { return iso; }
};

export default SimpleBulletinTemplate;
