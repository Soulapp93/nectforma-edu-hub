import React from 'react';
import type { ResolvedBulletinConfig } from '@/types/bulletinConfig';
import type { EvaluationPeriod } from '@/services/gradesService';

interface Props {
  period: EvaluationPeriod;
  config: ResolvedBulletinConfig;
  studentFullName: string;
  studentMatricule: string;
  formationTitle: string;
  formationLevel?: string | null;
  academicYear: string;
  establishmentName: string;
  establishmentLogoUrl?: string | null;
  referenceNumber: string;
  establishmentAddress?: string | null;
}

/**
 * Shared header used by BTS Blanc and Combined bulletins.
 * Black & white minimalist design matching user's maquettes.
 */
const BulletinSharedHeader: React.FC<Props> = ({
  period,
  config,
  studentFullName,
  studentMatricule,
  formationTitle,
  formationLevel,
  academicYear,
  establishmentName,
  establishmentLogoUrl,
  referenceNumber,
  establishmentAddress,
}) => {
  const FONT = '"Times New Roman", Georgia, serif';
  const mainTitle = (config.text_config.main_title || 'RELEVÉ DE NOTES').toUpperCase();
  const [firstName, ...lastNameParts] = (studentFullName || '').split(' ');
  const lastName = lastNameParts.join(' ');

  return (
    <div style={{ fontFamily: FONT, color: '#000', background: '#fff' }}>
      {/* TOP STRIP */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, padding: '10px 12mm', borderBottom: '1px solid #000' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          {establishmentLogoUrl ? (
            <img src={establishmentLogoUrl} alt="" style={{ width: 58, height: 58, objectFit: 'contain' }} crossOrigin="anonymous" />
          ) : (
            <div style={{ width: 58, height: 58, border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, padding: 4, textAlign: 'center', lineHeight: 1.1 }}>LOGO</div>
          )}
          <div style={{ fontSize: 10 }}>
            <p style={{ fontWeight: 700, fontSize: 12, marginBottom: 2 }}>{establishmentName}</p>
            {establishmentAddress && <p style={{ color: '#333' }}>{establishmentAddress}</p>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 16, fontWeight: 800, letterSpacing: 1 }}>{mainTitle}</p>
          <p style={{ fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>{period.name}</p>
          <p style={{ fontSize: 9, marginTop: 4, color: '#555' }}>Réf : {referenceNumber}</p>
        </div>
      </div>

      {/* IDENTITY TABLE */}
      <table style={{ width: 'calc(100% - 24mm)', borderCollapse: 'collapse', fontSize: 10.5, border: '1px solid #000', margin: '10px 12mm' }}>
        <tbody>
          <tr>
            <IdCell label="NOM ÉTUDIANT" value={(lastName || studentFullName).toUpperCase()} />
            <IdCell label="FORMATION" value={formationTitle} />
            <IdCell label="NUMÉRO ÉTUDIANT" value={studentMatricule || '—'} last />
          </tr>
          <tr>
            <IdCell label="PRÉNOM ÉTUDIANT" value={firstName || '—'} />
            <IdCell label="ANNÉE" value={academicYear} />
            <IdCell label="NIVEAU" value={formationLevel || '—'} last />
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const IdCell: React.FC<{ label: string; value: React.ReactNode; last?: boolean }> = ({ label, value, last }) => (
  <td style={{ padding: '5px 8px', borderRight: last ? 'none' : '1px solid #000', borderBottom: '1px solid #000', verticalAlign: 'top', width: '33%' }}>
    <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: '#333' }}>{label}</p>
    <p style={{ fontSize: 10.5, fontWeight: 600, marginTop: 1 }}>{value}</p>
  </td>
);

export default BulletinSharedHeader;
