import React from 'react';

/**
 * OfficialBulletinTemplate
 * ------------------------
 * Standard French higher-education (écoles supérieures) bulletin layout:
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │ [Logo]  Établissement        |  BULLETIN — Semestre X    │
 *   │         Adresse              |  Année académique         │
 *   ├─────────────────────────────────────────────────────────┤
 *   │ Étudiant (nom/prénom/matricule/né le)   Formation        │
 *   ├─────────────────────────────────────────────────────────┤
 *   │ Module (formateur) | Moyenne | Coef. | Appréciation      │
 *   │ ...                                                      │
 *   ├─────────────────────────────────────────────────────────┤
 *   │ Assiduité  |  Moyenne gén.  |  Décision  |  Appréciation  │
 *   ├─────────────────────────────────────────────────────────┤
 *   │           Cachet + signatures                            │
 *   └─────────────────────────────────────────────────────────┘
 */

export interface BulletinModuleRow {
  moduleId: string;
  moduleName: string;
  instructorNames: string[];
  average: number | null;
  coefficient: number;
  appreciation: string;
}

export interface BulletinSignatory {
  id: string;
  role_label: string;
  name?: string;
  signature_image?: string | null;
  is_stamp?: boolean;
}

export interface OfficialBulletinData {
  // Establishment
  establishmentName: string;
  establishmentLogoUrl?: string | null;
  establishmentAddress?: string | null;
  establishmentPhone?: string | null;
  establishmentWebsite?: string | null;

  // Student
  studentFullName: string;
  studentMatricule: string;
  studentDateOfBirth?: string | null;

  // Formation & period
  formationTitle: string;
  formationLevel?: string | null;
  academicYear: string;
  periodTitle: string; // e.g. "Semestre 1", "Examen final", etc.

  // Body
  rows: BulletinModuleRow[];
  generalAverage: number | null;
  classGeneralAverage?: number | null;
  rank?: number | null;
  totalStudents?: number | null;
  mention?: string | null;

  // Footer
  absenceCount: number;
  lateCount: number;
  excusedAbsenceCount?: number;
  admitted: boolean | null; // true = admis, false = non admis, null = en cours
  generalAppreciation: string;
  signatories: BulletinSignatory[];

  // Reference
  referenceNumber: string;
}

interface Props {
  data: OfficialBulletinData;
}

/**
 * Format a date as dd/MM/yyyy, safe for missing values.
 */
const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR');
  } catch {
    return '—';
  }
};

const INK = '#1a1a2e'; // deep navy
const BORDER = '#000000'; // sharp black for official look
const SOFT = '#64748b';
const ACCENT = '#c8a94e'; // gold accent

const OfficialBulletinTemplate: React.FC<Props> = ({ data }) => {
  const {
    establishmentName,
    establishmentLogoUrl,
    establishmentAddress,
    establishmentPhone,
    establishmentWebsite,
    studentFullName,
    studentMatricule,
    studentDateOfBirth,
    formationTitle,
    formationLevel,
    academicYear,
    periodTitle,
    rows,
    generalAverage,
    classGeneralAverage,
    rank,
    totalStudents,
    mention,
    absenceCount,
    lateCount,
    excusedAbsenceCount,
    admitted,
    generalAppreciation,
    signatories,
    referenceNumber,
  } = data;

  const admittedLabel = admitted === true ? 'ADMIS(E)' : admitted === false ? 'NON ADMIS(E)' : 'EN COURS';
  const admittedColor = admitted === true ? '#16a34a' : admitted === false ? '#dc2626' : ACCENT;

  return (
    <div
      className="bg-white mx-auto"
      style={{
        maxWidth: '210mm',
        fontFamily: '"Times New Roman", Georgia, serif',
        color: INK,
        border: `2px solid ${BORDER}`,
      }}
      data-testid="official-bulletin"
    >
      {/* ════════════════════════════════════════════════════════ */}
      {/* ENTÊTE : établissement (gauche) + titre bulletin (droite) */}
      {/* ════════════════════════════════════════════════════════ */}
      <div
        className="flex items-start justify-between"
        style={{ borderBottom: `2px solid ${BORDER}`, padding: '12px 16px' }}
      >
        <div className="flex items-start gap-3" style={{ flex: 1 }}>
          {establishmentLogoUrl ? (
            <img
              src={establishmentLogoUrl}
              alt=""
              style={{ height: 56, width: 56, objectFit: 'contain' }}
              crossOrigin="anonymous"
            />
          ) : (
            <div
              style={{
                height: 56,
                width: 56,
                borderRadius: 6,
                backgroundColor: INK,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {establishmentName.charAt(0)}
            </div>
          )}
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{establishmentName}</p>
            {establishmentAddress && (
              <p style={{ fontSize: 10, color: SOFT, marginTop: 2 }}>{establishmentAddress}</p>
            )}
            {(establishmentPhone || establishmentWebsite) && (
              <p style={{ fontSize: 10, color: SOFT }}>
                {establishmentPhone && <>Tél : {establishmentPhone}</>}
                {establishmentPhone && establishmentWebsite && ' • '}
                {establishmentWebsite}
              </p>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 1,
              textDecoration: 'underline',
            }}
          >
            BULLETIN DE NOTES
          </p>
          <p style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{periodTitle}</p>
          <p style={{ fontSize: 10, color: SOFT, marginTop: 4 }}>Année académique : {academicYear}</p>
          <p style={{ fontSize: 9, color: SOFT }}>Réf : {referenceNumber}</p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* INFOS ÉTUDIANT & FORMATION (2 colonnes)                   */}
      {/* ════════════════════════════════════════════════════════ */}
      <div
        className="grid grid-cols-2"
        style={{ borderBottom: `2px solid ${BORDER}`, fontSize: 11 }}
      >
        <div style={{ padding: '10px 16px', borderRight: `1px solid ${BORDER}` }}>
          <Row label="Nom & prénoms" value={studentFullName} strong />
          <Row label="Matricule" value={studentMatricule} />
          <Row label="Né(e) le" value={formatDate(studentDateOfBirth)} />
        </div>
        <div style={{ padding: '10px 16px' }}>
          <Row label="Formation" value={formationTitle} strong />
          {formationLevel && <Row label="Niveau" value={formationLevel} />}
          <Row label="Année académique" value={academicYear} />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* CORPS : tableau 4 colonnes                                */}
      {/* Module (formateur) | Moyenne | Coef. | Appréciation       */}
      {/* ════════════════════════════════════════════════════════ */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 11,
          borderBottom: `2px solid ${BORDER}`,
        }}
      >
        <thead>
          <tr style={{ backgroundColor: INK, color: '#fff' }}>
            <th style={ths({ width: '44%', textAlign: 'left' })}>Matière / Module</th>
            <th style={ths({ width: '13%' })}>Moyenne /20</th>
            <th style={ths({ width: '10%' })}>Coef.</th>
            <th style={ths({ width: '33%', textAlign: 'left' })}>Appréciation</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ padding: 18, textAlign: 'center', color: SOFT, fontStyle: 'italic' }}>
                Aucun module défini pour cette période.
              </td>
            </tr>
          ) : (
            rows.map((r, idx) => (
              <tr key={r.moduleId} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={tds({ textAlign: 'left' })}>
                  <div style={{ fontWeight: 600 }}>{r.moduleName}</div>
                  {r.instructorNames.length > 0 && (
                    <div style={{ fontSize: 9, color: SOFT, fontStyle: 'italic', marginTop: 2 }}>
                      {r.instructorNames.join(' · ')}
                    </div>
                  )}
                </td>
                <td
                  style={{
                    ...tds({ textAlign: 'center' }),
                    fontWeight: 700,
                    color: r.average === null ? SOFT : r.average >= 10 ? '#16a34a' : '#dc2626',
                  }}
                >
                  {r.average !== null ? r.average.toFixed(2) : '—'}
                </td>
                <td style={tds({ textAlign: 'center' })}>{r.coefficient}</td>
                <td style={{ ...tds({ textAlign: 'left' }), fontStyle: 'italic', color: SOFT }}>
                  {r.appreciation || '—'}
                </td>
              </tr>
            ))
          )}
          {/* Total row */}
          {rows.length > 0 && (
            <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 700 }}>
              <td style={tds({ textAlign: 'right', fontWeight: 700 })}>MOYENNE GÉNÉRALE</td>
              <td
                style={{
                  ...tds({ textAlign: 'center' }),
                  fontSize: 14,
                  fontWeight: 700,
                  color: generalAverage !== null && generalAverage >= 10 ? '#16a34a' : '#dc2626',
                }}
              >
                {generalAverage !== null ? generalAverage.toFixed(2) : '—'}
              </td>
              <td style={tds({ textAlign: 'center' })}>
                {rows.reduce((s, r) => s + (r.coefficient || 0), 0)}
              </td>
              <td style={tds({ textAlign: 'left' })}>
                {mention || ''}
                {rank && totalStudents && ` — Rang : ${rank}/${totalStudents}`}
                {classGeneralAverage !== null && classGeneralAverage !== undefined && (
                  <span style={{ color: SOFT, fontStyle: 'italic' }}> (classe : {classGeneralAverage.toFixed(2)})</span>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ════════════════════════════════════════════════════════ */}
      {/* PIED : assiduité, décision, appréciation générale          */}
      {/* ════════════════════════════════════════════════════════ */}
      <div
        className="grid grid-cols-3"
        style={{ borderBottom: `2px solid ${BORDER}`, fontSize: 11 }}
      >
        {/* Assiduité */}
        <div style={{ padding: '10px 14px', borderRight: `1px solid ${BORDER}` }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            Assiduité
          </p>
          <p style={{ fontSize: 11 }}>
            Absences : <strong>{absenceCount}</strong>
            {excusedAbsenceCount !== undefined && excusedAbsenceCount > 0 && (
              <span style={{ color: SOFT }}> (dont {excusedAbsenceCount} justifiée(s))</span>
            )}
          </p>
          <p style={{ fontSize: 11 }}>
            Retards : <strong>{lateCount}</strong>
          </p>
        </div>

        {/* Décision */}
        <div
          style={{
            padding: '10px 14px',
            borderRight: `1px solid ${BORDER}`,
            textAlign: 'center',
            backgroundColor: admitted === true ? '#f0fdf4' : admitted === false ? '#fef2f2' : '#fffbeb',
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            Décision
          </p>
          <p
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: admittedColor,
              letterSpacing: 1,
            }}
          >
            {admittedLabel}
          </p>
        </div>

        {/* Appréciation générale */}
        <div style={{ padding: '10px 14px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            Appréciation générale
          </p>
          <p style={{ fontSize: 11, fontStyle: 'italic', color: SOFT }}>{generalAppreciation || '—'}</p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* SIGNATURES & CACHET                                       */}
      {/* ════════════════════════════════════════════════════════ */}
      {signatories.length > 0 && (
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${Math.min(signatories.length, 4)}, 1fr)`,
            gap: 16,
            padding: '18px 16px',
          }}
        >
          {signatories.map((s) => (
            <div key={s.id} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 4 }}>{s.role_label}</p>
              <div
                style={{
                  height: 60,
                  borderBottom: `1px solid ${INK}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {s.signature_image && (
                  <img
                    src={s.signature_image}
                    alt={s.role_label}
                    style={{ maxHeight: 56, maxWidth: '100%', objectFit: 'contain' }}
                    crossOrigin="anonymous"
                  />
                )}
              </div>
              {s.name && !s.is_stamp ? (
                <p style={{ fontSize: 10, fontWeight: 600, marginTop: 3 }}>{s.name}</p>
              ) : s.is_stamp ? (
                <p style={{ fontSize: 9, fontStyle: 'italic', color: SOFT, marginTop: 3 }}>
                  Cachet officiel
                </p>
              ) : (
                <p style={{ fontSize: 9, fontStyle: 'italic', color: SOFT, marginTop: 3 }}>Signature</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* FOOTER : mention document officiel                        */}
      {/* ════════════════════════════════════════════════════════ */}
      <div style={{ borderTop: `1px solid ${BORDER}`, padding: '6px 16px', textAlign: 'center' }}>
        <p style={{ fontSize: 9, color: SOFT }}>
          Document officiel — {establishmentName} — Réf : {referenceNumber} — Ce bulletin est certifié authentique.
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const Row: React.FC<{ label: string; value: React.ReactNode; strong?: boolean }> = ({ label, value, strong }) => (
  <div style={{ display: 'flex', marginBottom: 2 }}>
    <span style={{ fontSize: 10, color: SOFT, fontWeight: 600, minWidth: 110 }}>{label} :</span>
    <span style={{ fontSize: strong ? 12 : 11, fontWeight: strong ? 700 : 500 }}>{value}</span>
  </div>
);

const ths = (extra: React.CSSProperties): React.CSSProperties => ({
  padding: '8px 10px',
  fontSize: 11,
  fontWeight: 600,
  textAlign: 'center',
  border: `1px solid ${BORDER}`,
  ...extra,
});

const tds = (extra: React.CSSProperties): React.CSSProperties => ({
  padding: '6px 10px',
  border: `1px solid ${BORDER}`,
  ...extra,
});

export default OfficialBulletinTemplate;
