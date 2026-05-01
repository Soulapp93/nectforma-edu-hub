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
}

/**
 * Shared header used by Simple, Combined and BTS Blanc bulletins so that
 * all three templates have an identical visual identity (only the body
 * changes between them).
 *
 * Layout:
 *   • Navy strip with logo + establishment name (left) and gold pill + ref (right)
 *   • Gold accent line
 *   • 5-column identity strip (light grey)
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
}) => {
  const INK = config.design_config.primary_color || '#1a2654';
  const GOLD = config.design_config.accent_color || '#c8a94e';
  const FONT = config.design_config.font_family
    ? `"${config.design_config.font_family}", Arial, sans-serif`
    : '"Inter", "Helvetica Neue", Arial, sans-serif';
  const mainTitle = config.text_config.main_title || 'BULLETIN';

  return (
    <div style={{ fontFamily: FONT, color: INK }}>
      {/* Navy strip */}
      <div style={{ background: INK, color: '#fff', padding: '14px 18px', position: 'relative', zIndex: 1 }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {establishmentLogoUrl ? (
              <img
                src={establishmentLogoUrl}
                alt=""
                style={{ height: 50, width: 50, borderRadius: 8, objectFit: 'contain', background: '#fff' }}
                crossOrigin="anonymous"
              />
            ) : (
              <div
                style={{
                  height: 50, width: 50, borderRadius: 8, background: GOLD, color: INK,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 800,
                }}
              >
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
            <div
              style={{
                display: 'inline-block',
                background: GOLD, color: INK,
                padding: '6px 14px', borderRadius: 6,
                fontSize: 13, fontWeight: 800, letterSpacing: 1.5,
              }}
            >
              {mainTitle.toUpperCase()}
            </div>
            <p style={{ fontSize: 10, opacity: 0.85, marginTop: 4, fontStyle: 'italic' }}>{period.name}</p>
            <p style={{ fontSize: 9, opacity: 0.7 }}>Réf : {referenceNumber}</p>
          </div>
        </div>
      </div>

      {/* Gold accent */}
      <div style={{ height: 3, background: GOLD, position: 'relative', zIndex: 1 }} />

      {/* Identity strip */}
      <div
        className="grid grid-cols-5"
        style={{ background: '#f5f6fa', padding: '12px 18px', fontSize: 11, position: 'relative', zIndex: 1 }}
      >
        <IdCell label="Nom & prénoms" value={studentFullName} />
        <IdCell label="Matricule" value={studentMatricule || '—'} />
        <IdCell label="Filière" value={formationTitle} />
        <IdCell label="Niveau" value={formationLevel || '—'} />
        <IdCell label="Année" value={academicYear} />
      </div>
    </div>
  );
};

const IdCell: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p
      style={{
        fontSize: 9, fontWeight: 700, color: '#64748b',
        textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2,
      }}
    >
      {label}
    </p>
    <p style={{ fontSize: 12, fontWeight: 700 }}>{value}</p>
  </div>
);

export default BulletinSharedHeader;
