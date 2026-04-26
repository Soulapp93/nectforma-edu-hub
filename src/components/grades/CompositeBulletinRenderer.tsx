import React from 'react';
import type { CompositeBulletinConfig } from '@/services/gradesService';

export interface CompositeBlockRow {
  module: string;
  coefficient: number;
  cc?: number | null;
  ds?: number | null;
  exam?: number | null;
  oral?: number | null;
  tp?: number | null;
  moyenne?: number | null;
  moyenne_classe?: number | null;
  points?: number | null;
  credits?: number | string | null;
  status?: string;
  appreciation?: string;
  rang?: string | number;
}

export interface CompositeBlockData {
  period_id: string;
  title: string;
  render_mode: 'block' | 'merged';
  columns: string[];
  rows: CompositeBlockRow[];
  /** Optional summary line (e.g. "Moyenne Générale") at end of block */
  summary?: { label: string; value: string };
}

export interface CompositeRenderProps {
  config: CompositeBulletinConfig;
  blocks: CompositeBlockData[];
  /** Final total row computed from config + blocks */
  totalValue?: number | null;
  primaryColor?: string;
}

const COL_LABELS: Record<string, string> = {
  module: 'Matière',
  coefficient: 'C.',
  cc: 'CC',
  ds: 'DS',
  exam: 'Examen',
  oral: 'Oral',
  tp: 'TP',
  moyenne: 'Moyenne du stagiaire',
  moyenne_classe: 'Moyenne de classe',
  points: 'Points',
  credits: 'ECTS',
  status: 'Statut',
  appreciation: 'Appréciations',
  rang: 'Rang',
};

const COL_ALIGN: Record<string, 'left' | 'center' | 'right'> = {
  module: 'left',
  appreciation: 'left',
  status: 'center',
};

const fmtNum = (v: any): string => {
  if (v === null || v === undefined || v === '') return '';
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  if (isNaN(n)) return String(v);
  return n.toFixed(2);
};

const renderCell = (key: string, row: CompositeBlockRow): React.ReactNode => {
  switch (key) {
    case 'module': return row.module;
    case 'coefficient': return row.coefficient ?? '';
    case 'cc': return fmtNum(row.cc);
    case 'ds': return fmtNum(row.ds);
    case 'exam': return fmtNum(row.exam);
    case 'oral': return fmtNum(row.oral);
    case 'tp': return fmtNum(row.tp);
    case 'moyenne': return <strong>{fmtNum(row.moyenne)}</strong>;
    case 'moyenne_classe': return fmtNum(row.moyenne_classe);
    case 'points': return fmtNum(row.points);
    case 'credits': return row.credits ?? '';
    case 'status': return row.status || '';
    case 'appreciation': return <span className="italic">{row.appreciation || ''}</span>;
    case 'rang': return row.rang ?? '';
    default: return '';
  }
};

const Block: React.FC<{ block: CompositeBlockData; primaryColor: string }> = ({ block, primaryColor }) => {
  const cols = block.columns;
  return (
    <div className="mb-3" data-testid={`composite-block-${block.period_id}`}>
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr style={{ backgroundColor: primaryColor, color: '#fff' }}>
            <th colSpan={cols.length} className="p-2 text-center font-bold uppercase tracking-wider text-[12px]" style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
              {block.title}
            </th>
          </tr>
          <tr style={{ backgroundColor: `${primaryColor}cc`, color: '#fff' }}>
            {cols.map((c) => (
              <th
                key={c}
                className="p-1.5 text-[10px] font-semibold uppercase border"
                style={{
                  borderColor: 'rgba(255,255,255,0.15)',
                  textAlign: (COL_ALIGN[c] || 'center') as any,
                  width: c === 'module' ? '32%' : c === 'appreciation' ? '36%' : undefined,
                }}
              >
                {COL_LABELS[c] || c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.length === 0 ? (
            <tr>
              <td colSpan={cols.length} className="p-3 text-center text-muted-foreground italic">Aucune donnée</td>
            </tr>
          ) : block.rows.map((row, i) => (
            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
              {cols.map((c) => (
                <td
                  key={c}
                  className="p-1.5 border"
                  style={{
                    borderColor: '#cbd5e1',
                    textAlign: (COL_ALIGN[c] || 'center') as any,
                  }}
                >
                  {renderCell(c, row)}
                </td>
              ))}
            </tr>
          ))}
          {block.summary && (
            <tr style={{ backgroundColor: `${primaryColor}22` }}>
              <td colSpan={Math.max(1, cols.length - 1)} className="p-2 border text-right font-bold" style={{ borderColor: '#cbd5e1' }}>
                {block.summary.label}
              </td>
              <td className="p-2 border text-center font-bold" style={{ borderColor: '#cbd5e1', color: primaryColor }}>
                {block.summary.value}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const MergedView: React.FC<{ blocks: CompositeBlockData[]; primaryColor: string }> = ({ blocks, primaryColor }) => {
  // Get all unique modules across all merged blocks
  const moduleNames = Array.from(new Set(blocks.flatMap((b) => b.rows.map((r) => r.module))));
  return (
    <div className="mb-3" data-testid="composite-merged-block">
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr style={{ backgroundColor: primaryColor, color: '#fff' }}>
            <th rowSpan={2} className="p-2 text-left text-[10px] font-semibold uppercase border" style={{ borderColor: 'rgba(255,255,255,0.15)', width: '28%' }}>
              Matière
            </th>
            {blocks.map((b) => (
              <th key={b.period_id} colSpan={b.columns.length - 1} className="p-2 text-center font-bold uppercase border" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                {b.title}
              </th>
            ))}
          </tr>
          <tr style={{ backgroundColor: `${primaryColor}cc`, color: '#fff' }}>
            {blocks.flatMap((b) => b.columns.filter((c) => c !== 'module').map((c) => (
              <th key={`${b.period_id}-${c}`} className="p-1.5 text-[9px] font-semibold uppercase border" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                {COL_LABELS[c] || c}
              </th>
            )))}
          </tr>
        </thead>
        <tbody>
          {moduleNames.map((modName, i) => (
            <tr key={modName} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
              <td className="p-1.5 border" style={{ borderColor: '#cbd5e1' }}>{modName}</td>
              {blocks.flatMap((b) => {
                const row = b.rows.find((r) => r.module === modName);
                return b.columns.filter((c) => c !== 'module').map((c) => (
                  <td key={`${b.period_id}-${c}`} className="p-1.5 border text-center" style={{ borderColor: '#cbd5e1' }}>
                    {row ? renderCell(c, row) : ''}
                  </td>
                ));
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CompositeBulletinRenderer: React.FC<CompositeRenderProps> = ({ config, blocks, totalValue, primaryColor = '#1a1a2e' }) => {
  const orderedBlocks = [...blocks].sort((a, b) => {
    const ai = config.blocks.find((bb) => bb.period_id === a.period_id)?.order_index ?? 0;
    const bi = config.blocks.find((bb) => bb.period_id === b.period_id)?.order_index ?? 0;
    return ai - bi;
  });

  const separateBlocks = orderedBlocks.filter((b) => b.render_mode === 'block');
  const mergedBlocks = orderedBlocks.filter((b) => b.render_mode === 'merged');

  const total = config.total;
  const isAdmitted = totalValue !== null && totalValue !== undefined && totalValue >= total.threshold;

  return (
    <div className="composite-bulletin px-6 pb-4" data-testid="composite-bulletin-renderer">
      {/* Render separate blocks first */}
      {separateBlocks.map((b) => (
        <Block key={b.period_id} block={b} primaryColor={primaryColor} />
      ))}

      {/* Then merged view (single combined table) */}
      {mergedBlocks.length > 0 && <MergedView blocks={mergedBlocks} primaryColor={primaryColor} />}

      {/* TOTAL & DECISION */}
      {total.enabled && (
        <div className="mt-4 flex flex-col sm:flex-row gap-2" data-testid="composite-total-decision">
          <div className="flex-1 flex items-center justify-between p-3 rounded border-2" style={{ borderColor: primaryColor, backgroundColor: `${primaryColor}10` }}>
            <span className="font-bold text-[12px] uppercase tracking-wider" style={{ color: primaryColor }}>{total.label}</span>
            <span className="font-bold text-lg" style={{ color: primaryColor }}>
              {totalValue !== null && totalValue !== undefined ? totalValue.toFixed(2) : '—'}
            </span>
          </div>
          <div
            className="flex-1 flex items-center justify-center p-3 rounded border-2 font-bold uppercase tracking-wider"
            style={{
              borderColor: isAdmitted ? '#16a34a' : '#dc2626',
              backgroundColor: isAdmitted ? '#f0fdf4' : '#fef2f2',
              color: isAdmitted ? '#15803d' : '#dc2626',
            }}
            data-testid="composite-decision"
          >
            {isAdmitted ? total.admitted_label : total.rejected_label}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompositeBulletinRenderer;
