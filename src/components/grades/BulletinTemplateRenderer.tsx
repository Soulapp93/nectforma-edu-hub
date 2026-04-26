import React from 'react';
import {
  type BulletinElement,
  type TableColumnConfig,
  type TableStyleConfig,
  CANVAS_W,
  HEADER_H,
  BODY_H,
  FOOTER_H,
  evaluateFormula,
} from './BulletinLayoutEditor';

// ============================================================================
// Types
// ============================================================================

export interface BulletinRenderData {
  // Student
  nom_complet: string;
  prenom: string;
  nom: string;
  date_naissance?: string;
  numero_etudiant: string;
  // Formation / period
  formation: string;
  niveau: string;
  annee_academique: string;
  periode: string;
  // Establishment
  etablissement: string;
  adresse_etablissement?: string;
  // Results
  moyenne_generale: string;
  rang: string;
  mention: string;
  decision: string;
  credits_acquis: string;
  // Misc
  numero_bulletin: string;
  date_emission: string;
  code_verification: string;
}

export interface BulletinTableRow {
  module: string;
  coefficient: number | string;
  cc?: number | string | null;
  ds?: number | string | null;
  exam?: number | string | null;
  oral?: number | string | null;
  tp?: number | string | null;
  moyenne: number | string;
  points?: number | string;
  credits?: number | string;
  status?: string;
  appreciation?: string;
}

export interface Signatory {
  id: string;
  role_label: string;
  name: string | null;
  signature_image: string | null;
  is_stamp: boolean;
}

interface Props {
  headerElements: BulletinElement[];
  bodyElements: BulletinElement[];
  footerElements: BulletinElement[];
  tableColumns: TableColumnConfig[];
  tableStyle: TableStyleConfig;
  data: BulletinRenderData;
  rows: BulletinTableRow[];
  establishmentLogo?: string | null;
  signatories?: Signatory[];
  scale?: number;
}

// ============================================================================
// Variable interpolation
// ============================================================================

const interpolate = (s: string, data: BulletinRenderData): string => {
  if (!s) return '';
  return s.replace(/\{(\w+)\}/g, (m, k) => {
    const v = (data as any)[k];
    return v !== undefined && v !== null ? String(v) : m;
  });
};

const fmtNum = (v: any): string => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'number') return v.toFixed(2);
  return String(v);
};

// ============================================================================
// Element rendering
// ============================================================================

const renderElement = (
  el: BulletinElement,
  data: BulletinRenderData,
  establishmentLogo: string | null | undefined,
  signatories: Signatory[],
): React.ReactNode => {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: el.x, top: el.y, width: el.width, height: el.height,
    fontSize: el.styles.fontSize,
    fontFamily: el.styles.fontFamily,
    fontWeight: el.styles.fontWeight as any,
    fontStyle: el.styles.fontStyle as any,
    textAlign: el.styles.textAlign as any,
    color: el.styles.color,
    backgroundColor: el.styles.backgroundColor,
    borderColor: el.styles.borderColor,
    borderWidth: el.styles.borderWidth,
    borderStyle: el.styles.borderWidth ? 'solid' : 'none',
    borderRadius: el.styles.borderRadius,
    opacity: el.styles.opacity,
    textDecoration: el.styles.textDecoration,
    letterSpacing: el.styles.letterSpacing,
    lineHeight: el.styles.lineHeight,
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    display: 'flex',
    alignItems: el.type === 'text' || el.type === 'variable' ? 'center' : 'stretch',
    justifyContent:
      el.styles.textAlign === 'center' ? 'center'
      : el.styles.textAlign === 'right' ? 'flex-end'
      : 'flex-start',
    padding: el.type === 'text' || el.type === 'variable' ? '0 4px' : 0,
  };

  const content = interpolate(el.content || '', data);

  let inner: React.ReactNode = null;

  if (el.type === 'text' || el.type === 'variable') {
    inner = <span style={{ width: '100%', textAlign: el.styles.textAlign as any }}>{content}</span>;
  } else if (el.type === 'logo') {
    inner = establishmentLogo ? (
      <img src={establishmentLogo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} crossOrigin="anonymous" />
    ) : (
      <div style={{ width: '100%', height: '100%', background: '#1e40af', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, borderRadius: el.styles.borderRadius }}>
        LOGO
      </div>
    );
  } else if (el.type === 'image') {
    inner = (
      <div style={{ width: '100%', height: '100%', background: '#f1f5f9', borderRadius: el.styles.borderRadius }} />
    );
  } else if (el.type === 'line') {
    inner = <div style={{ width: '100%', height: '100%', background: el.styles.backgroundColor || '#cbd5e1' }} />;
  } else if (el.type === 'qr_code') {
    // Simple visual placeholder (real QR could be react-qr-code)
    inner = (
      <div style={{ width: '100%', height: '100%', background: '#fff', border: '1px solid #cbd5e1', display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(8, 1fr)', padding: 2 }}>
        {Array.from({ length: 64 }).map((_, i) => {
          const filled = (i * 13 + 7) % 3 !== 0;
          return <div key={i} style={{ background: filled ? '#1f2937' : '#fff' }} />;
        })}
      </div>
    );
  } else if (el.type === 'signatures_block') {
    const sigs = (signatories && signatories.length > 0) ? signatories : [];
    inner = (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'stretch', justifyContent: 'space-around', gap: 12, padding: '0 8px' }}>
        {sigs.map((s) => (
          <div key={s.id} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', textAlign: 'center' }}>
            <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.role_label}</div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              {s.signature_image ? (
                <img src={s.signature_image} alt="" style={{ maxHeight: 48, maxWidth: '100%', objectFit: 'contain' }} crossOrigin="anonymous" />
              ) : (
                <span style={{ fontSize: 9, color: '#cbd5e1', fontStyle: 'italic' }}>— signature —</span>
              )}
            </div>
            <div style={{ borderTop: '1px solid #cbd5e1', width: '100%', marginTop: 4 }} />
            {s.name && !s.is_stamp ? <div style={{ fontSize: 9, fontWeight: 600, marginTop: 2 }}>{s.name}</div> : null}
            {s.is_stamp ? <div style={{ fontSize: 8, fontStyle: 'italic', marginTop: 2, color: '#d97706' }}>Cachet</div> : null}
          </div>
        ))}
      </div>
    );
  } else if (el.type === 'appreciation_block') {
    inner = (
      <div style={{ width: '100%', height: '100%', padding: 10, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, color: '#92400e' }}>Appréciation générale</div>
        <p style={{ fontSize: 10, color: '#475569', fontStyle: 'italic', marginTop: 4, lineHeight: 1.4 }}>
          {data.mention === 'Très Bien' || data.mention === 'TB' ? 'Excellent semestre. L\'étudiant a brillamment réussi à toutes les épreuves.'
            : data.mention === 'Bien' ? 'Bon semestre. L\'étudiant fait preuve de sérieux et d\'application.'
            : data.mention === 'Assez Bien' || data.mention === 'AB' ? 'Semestre satisfaisant. Quelques efforts supplémentaires sont à fournir.'
            : 'L\'étudiant doit redoubler d\'efforts pour atteindre les objectifs fixés.'}
        </p>
      </div>
    );
  } else if (el.type === 'mention_block') {
    inner = (
      <div style={{ width: '100%', height: '100%', padding: 10, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, color: '#1e40af' }}>Mention & Rang</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a8a', marginTop: 4 }}>{data.mention}</div>
        <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>Rang : {data.rang}</div>
      </div>
    );
  } else if (el.type === 'assiduity_block') {
    inner = (
      <div style={{ width: '100%', height: '100%', padding: 10, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, color: '#15803d' }}>Assiduité</div>
        <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Absences :</span><span style={{ fontWeight: 600 }}>—</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Retards :</span><span style={{ fontWeight: 600 }}>—</span></div>
        </div>
      </div>
    );
  } else if (el.type === 'ects_block') {
    inner = (
      <div style={{ width: '100%', height: '100%', padding: 10, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, color: '#7e22ce' }}>Crédits ECTS</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#581c87', marginTop: 4 }}>{data.credits_acquis}</div>
      </div>
    );
  }

  return <div key={el.id} style={baseStyle}>{inner}</div>;
};

// ============================================================================
// Main renderer
// ============================================================================

const BulletinTemplateRenderer: React.FC<Props> = ({
  headerElements,
  bodyElements,
  footerElements,
  tableColumns,
  tableStyle,
  data,
  rows,
  establishmentLogo,
  signatories = [],
  scale = 1,
}) => {
  const visibleCols = tableColumns.filter((c) => c.visible);

  const cellValue = (col: TableColumnConfig, row: BulletinTableRow): React.ReactNode => {
    if (col.key === 'custom_static') {
      return col.staticValue ?? '—';
    }
    if (col.key === 'custom_formula') {
      const rowVals: Record<string, number | null | undefined> = {
        cc: typeof row.cc === 'number' ? row.cc : (row.cc ? parseFloat(String(row.cc)) : null),
        ds: typeof row.ds === 'number' ? row.ds : (row.ds ? parseFloat(String(row.ds)) : null),
        exam: typeof row.exam === 'number' ? row.exam : (row.exam ? parseFloat(String(row.exam)) : null),
        oral: typeof row.oral === 'number' ? row.oral : (row.oral ? parseFloat(String(row.oral)) : null),
        tp: typeof row.tp === 'number' ? row.tp : (row.tp ? parseFloat(String(row.tp)) : null),
        moyenne: typeof row.moyenne === 'number' ? row.moyenne : (row.moyenne ? parseFloat(String(row.moyenne)) : null),
        coefficient: typeof row.coefficient === 'number' ? row.coefficient : parseFloat(String(row.coefficient)),
        points: typeof row.points === 'number' ? row.points : (row.points ? parseFloat(String(row.points)) : null),
        credits: typeof row.credits === 'number' ? row.credits : (row.credits ? parseFloat(String(row.credits)) : null),
      };
      const r = evaluateFormula(col.formula || '', rowVals);
      return r !== null ? r.toFixed(col.decimals ?? 2) + (col.suffix || '') : '—';
    }
    switch (col.key) {
      case 'module': return row.module;
      case 'coefficient': return row.coefficient;
      case 'cc': return fmtNum(row.cc);
      case 'ds': return fmtNum(row.ds);
      case 'exam': return fmtNum(row.exam);
      case 'oral': return fmtNum(row.oral);
      case 'tp': return fmtNum(row.tp);
      case 'moyenne': {
        const v = typeof row.moyenne === 'number' ? row.moyenne : parseFloat(String(row.moyenne));
        return <strong style={{ color: !isNaN(v) && v >= 10 ? undefined : '#dc2626' }}>{fmtNum(row.moyenne)}</strong>;
      }
      case 'points': return fmtNum(row.points);
      case 'credits': return row.credits ?? '—';
      case 'status': {
        const s = row.status || '';
        const ok = /val/i.test(s);
        return <span style={{ color: ok ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: tableStyle.fontSize - 1 }}>{s || '—'}</span>;
      }
      case 'appreciation': return <span style={{ fontStyle: 'italic', fontSize: tableStyle.fontSize - 1 }}>{row.appreciation || '—'}</span>;
      default: return '—';
    }
  };

  return (
    <div
      style={{
        width: CANVAS_W,
        background: '#ffffff',
        fontFamily: 'Inter',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
      data-testid="bulletin-template-render"
    >
      {/* HEADER */}
      <div style={{ position: 'relative', height: HEADER_H }}>
        {headerElements.map((el) => renderElement(el, data, establishmentLogo, signatories))}
      </div>

      {/* TABLE */}
      <div style={{ padding: '12px 24px' }}>
        <div style={{ overflow: 'hidden', borderRadius: tableStyle.borderRadius, border: `1px solid ${tableStyle.borderColor}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: tableStyle.fontSize }}>
            <thead>
              <tr style={{ background: tableStyle.headerBg, color: tableStyle.headerTextColor, height: tableStyle.rowHeight }}>
                {visibleCols.map((c) => (
                  <th
                    key={c.id}
                    style={{
                      padding: '0 8px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontSize: Math.max(9, tableStyle.fontSize - 2),
                      letterSpacing: 0.5,
                      textAlign: c.align as any,
                      width: c.width ? `${c.width}%` : undefined,
                    }}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={visibleCols.length} style={{ padding: 12, textAlign: 'center', color: '#94a3b8' }}>Aucune note saisie</td></tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={i} style={{
                    background: i % 2 === 0 ? tableStyle.rowBg : tableStyle.rowAltBg,
                    color: tableStyle.rowTextColor,
                    height: tableStyle.rowHeight,
                  }}>
                    {visibleCols.map((c) => (
                      <td key={c.id} style={{
                        padding: '0 8px',
                        textAlign: c.align as any,
                        borderTop: `1px solid ${tableStyle.borderColor}`,
                        background: c.bgColor || undefined,
                        color: c.textColor || undefined,
                        fontWeight: c.fontWeight as any,
                      }}>
                        {cellValue(c, row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BODY */}
      <div style={{ position: 'relative', height: BODY_H }}>
        {bodyElements.map((el) => renderElement(el, data, establishmentLogo, signatories))}
      </div>

      {/* FOOTER */}
      <div style={{ position: 'relative', height: FOOTER_H }}>
        {footerElements.map((el) => renderElement(el, data, establishmentLogo, signatories))}
      </div>
    </div>
  );
};

export default BulletinTemplateRenderer;
