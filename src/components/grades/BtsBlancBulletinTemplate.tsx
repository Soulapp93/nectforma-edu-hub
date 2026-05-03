import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { computeStudentPeriodBulletin } from '@/services/bulletinClientCalculator';
import { getStudentAttendanceForRanges, type DateRange } from '@/services/periodAttendanceService';
import type { ResolvedBulletinConfig } from '@/types/bulletinConfig';
import type { EvaluationPeriod } from '@/services/gradesService';

const fmt2 = (v: number | null): string => (v === null ? '' : v.toFixed(2));

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
  totalAdmissionThreshold?: number;
  studentDateOfBirth?: string | null;
  studentNumber?: string | null;
  studentNumeroCE?: string | null;
  studentNumeroINE?: string | null;
  establishmentAddress?: string | null;
}

/**
 * BTS Blanc bulletin — pixel-perfect reproduction of the user's PDF maquette.
 * Same header/identity/footer layout as SimpleBulletinTemplate, but:
 *   • Sub-title "BTS BLANC" under "RELEVE DE NOTES"
 *   • Table columns: EPREUVES | NOTES | COEFFICIENT | POINTS | APPRECIATION
 *   • Matière rows show "(ecrit)" or "oral" italic suffix
 *   • Footer row: total / TOTAL COEFFICIENT / total des points / (empty) / DECISION
 */
const BtsBlancBulletinTemplate: React.FC<Props> = ({
  period,
  config,
  studentId,
  studentFullName,
  studentMatricule,
  formationId,
  formationTitle,
  academicYear,
  establishmentName,
  establishmentLogoUrl,
  referenceNumber,
  signatories,
  totalAdmissionThreshold = 220,
  studentDateOfBirth,
  studentNumber,
  studentNumeroCE,
  studentNumeroINE,
  establishmentAddress,
}) => {
  void referenceNumber; void config;
  const [firstName, ...lastNameParts] = (studentFullName || '').split(' ');
  const lastName = lastNameParts.join(' ');

  // Load period_modules with exam_part (écrit / oral)
  const { data: modules = [] } = useQuery({
    queryKey: ['bts-bulletin-modules', formationId, period.id],
    queryFn: async () => {
      const { data: pm } = await supabase
        .from('period_modules')
        .select('module_id, coefficient, exam_part, formation_modules!inner(id, title, order_index)')
        .eq('period_id', period.id);
      if (pm && pm.length > 0) {
        return pm.map((r: any) => ({ id: r.formation_modules.id, title: r.formation_modules.title, order_index: r.formation_modules.order_index, coefficient: r.coefficient || 1, exam_part: r.exam_part || null }))
          .sort((a, b) => {
            const p = (x: string | null) => (x === 'ecrit' ? 0 : x === 'oral' ? 1 : 2);
            const d = p(a.exam_part) - p(b.exam_part);
            return d !== 0 ? d : (a.order_index || 0) - (b.order_index || 0);
          });
      }
      const { data } = await supabase.from('formation_modules').select('id, title, coefficient, order_index').eq('formation_id', formationId).order('order_index');
      return ((data || []) as any[]).map((m) => ({ ...m, exam_part: null }));
    },
  });

  const { data: roster = [] } = useQuery({
    queryKey: ['bts-bulletin-roster', formationId],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_formation_students', { formation_id_param: formationId });
      return (data || []) as any[];
    },
    enabled: !!formationId,
  });

  const computedQ = useQuery({
    queryKey: ['bts-bulletin-compute', period.id, studentId, modules.length, roster.length],
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
      return computeStudentPeriodBulletin({ studentId, config, modules: modules as any, evaluations: (evals || []) as any, grades: allGrades as any });
    },
    enabled: modules.length > 0,
  });

  const attendanceQ = useQuery({
    queryKey: ['bts-bulletin-attendance', period.id, studentId],
    queryFn: async () => {
      const ranges: DateRange[] = [];
      if (period.start_date && period.end_date) ranges.push({ start: period.start_date, end: period.end_date });
      return getStudentAttendanceForRanges(studentId, formationId, ranges);
    },
    enabled: !!studentId && !!formationId,
  });

  const result = computedQ.data;
  const attendance = attendanceQ.data;
  if (computedQ.isLoading || !result) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}><div style={{ width: 28, height: 28, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>;
  }

  // Totals
  let totalNotes = 0, totalCoef = 0, totalPoints = 0;
  for (const m of modules as any[]) {
    const c = result.modules.find((x) => x.module_id === m.id);
    const n = c?.module_average ?? null;
    totalCoef += m.coefficient || 0;
    if (n !== null) {
      totalNotes += n;
      totalPoints += n * (m.coefficient || 0);
    }
  }
  totalPoints = Math.round(totalPoints * 100) / 100;
  const admitted = totalPoints >= totalAdmissionThreshold;

  // ── Styles ────────────────────────────────────────────
  const FONT = 'Arial, Helvetica, sans-serif';
  const BORDER = '1px solid #000';
  const GREY = '#E0E0E0';
  const thCell: React.CSSProperties = { border: BORDER, padding: '6px 6px', fontSize: 10, fontWeight: 700, textAlign: 'center', background: GREY, textTransform: 'uppercase', color: '#000' };
  const tdCell: React.CSSProperties = { border: BORDER, padding: '6px 6px', fontSize: 9, color: '#000', verticalAlign: 'top', minHeight: 24 };

  return (
    <div style={{ background: '#fff', color: '#000', fontFamily: FONT, padding: '12mm', maxWidth: '210mm', margin: '0 auto' }} data-testid="bts-blanc-bulletin">
      {/* HEADER */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, marginBottom: 10, alignItems: 'center' }}>
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
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.5 }}>RELEVE DE NOTES</div>
          <div style={{ fontSize: 10, marginTop: 2 }}>BTS BLANC</div>
        </div>
      </div>

      {/* 2 IDENTITY BOXES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10, marginBottom: 10 }}>
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
        <div style={{ border: BORDER }}>
          <IdRow label="NUMERO ETUDIANT" value={studentNumber || studentMatricule || ''} />
          <IdRow label="NUMERO CE" value={studentNumeroCE || ''} />
          <IdRow label="NUMERO INE" value={studentNumeroINE || ''} last />
        </div>
      </div>

      {/* EPREUVES TABLE */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <colgroup>
          <col style={{ width: '30%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '33%' }} />
        </colgroup>
        <thead>
          <tr>
            <th style={thCell}>EPREUVES</th>
            <th style={thCell}>NOTES</th>
            <th style={thCell}>COEFFICIENT</th>
            <th style={thCell}>POINTS</th>
            <th style={thCell}>APPRECIATION</th>
          </tr>
        </thead>
        <tbody>
          {modules.length === 0 ? (
            <tr><td colSpan={5} style={{ ...tdCell, textAlign: 'center', fontStyle: 'italic', padding: 14 }}>Aucune épreuve configurée.</td></tr>
          ) : modules.map((mod: any) => {
            const computed = result.modules.find((m) => m.module_id === mod.id);
            const note = computed?.module_average ?? null;
            const coef = mod.coefficient || 0;
            const points = note !== null ? Math.round(note * coef * 100) / 100 : null;
            const partText = mod.exam_part === 'ecrit' ? '(ecrit)' : mod.exam_part === 'oral' ? 'oral' : '';
            return (
              <tr key={`${mod.id}-${mod.exam_part || 'main'}`} data-testid={`bts-row-${mod.exam_part || 'main'}-${mod.id}`}>
                <td style={{ ...tdCell, textTransform: 'uppercase', fontWeight: 500 }}>
                  {mod.title}
                  {partText && <div style={{ fontSize: 7, fontStyle: 'italic', textTransform: 'lowercase', marginTop: 1 }}>{partText}</div>}
                </td>
                <td style={{ ...tdCell, textAlign: 'center', fontWeight: 600 }}>{fmt2(note)}</td>
                <td style={{ ...tdCell, textAlign: 'center', fontWeight: 700 }}>{coef || ''}</td>
                <td style={{ ...tdCell, textAlign: 'center', fontWeight: 700 }}>{fmt2(points)}</td>
                <td style={{ ...tdCell, fontStyle: 'italic' }}>{computed?.appreciation || ''}</td>
              </tr>
            );
          })}
          {/* Footer totals row */}
          <tr>
            <th style={thCell}></th>
            <th style={thCell}>total</th>
            <th style={thCell}>TOTAL COEFFICIENT</th>
            <th style={thCell}>total des points</th>
            <th style={thCell}>DECISION (ADIMIS OU NON ADMIS)</th>
          </tr>
          <tr>
            <td style={{ ...tdCell, height: 28 }}></td>
            <td style={{ ...tdCell, textAlign: 'center', fontWeight: 700 }}>{fmt2(totalNotes)}</td>
            <td style={{ ...tdCell, textAlign: 'center', fontWeight: 700 }}>{totalCoef || ''}</td>
            <td style={{ ...tdCell, textAlign: 'center', fontWeight: 700, fontSize: 11 }}>{fmt2(totalPoints)}</td>
            <td style={{ ...tdCell, textAlign: 'center', fontWeight: 700 }}>{admitted ? 'ADMIS' : 'NON ADMIS'}</td>
          </tr>
        </tbody>
      </table>

      {/* 3 BOTTOM BOXES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', border: BORDER, marginTop: 10 }}>
        <div style={{ padding: 8, borderRight: BORDER, fontSize: 9 }}>
          <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 6 }}>ASSIDUITE</div>
          <div style={{ marginBottom: 3 }}>ABSENCE JUSTIFIEES : {attendance ? (attendance.absences_total - attendance.absences_injustifiees) : ''}</div>
          <div style={{ marginBottom: 3 }}>ABSENCES INJUSTIFIEES : {attendance ? attendance.absences_injustifiees : ''}</div>
          <div style={{ marginBottom: 3 }}>RETARDS JUSTIFIES : 0</div>
          <div>RETARDS INJUSTIFIES : {attendance ? attendance.retards : ''}</div>
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

export default BtsBlancBulletinTemplate;
