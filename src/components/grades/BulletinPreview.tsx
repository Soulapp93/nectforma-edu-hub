import React from 'react';
import type { ResolvedBulletinConfig } from '@/types/bulletinConfig';

interface Props {
  config: ResolvedBulletinConfig;
  periodName?: string;
  formationTitle?: string;
}

/**
 * Ultra-light live preview of the bulletin shown alongside the Configuration hub.
 *
 * It renders a simplified, scaled-down (≈30 %) representation of the bulletin so
 * the user gets visual feedback while editing the configuration — without paying
 * the cost of mounting the full SimpleBulletinTemplate (which runs Supabase queries).
 *
 * The preview reflects:
 *   • primary / accent colours
 *   • table header background & text colour
 *   • main font family
 *   • visible columns
 *   • signatories count
 *
 * Phase 3 (full visual editor) will replace this with a real interactive WYSIWYG.
 */
const BulletinPreview: React.FC<Props> = ({ config, periodName, formationTitle }) => {
  const primary = config.design_config?.primary_color || '#1e40af';
  const accent = config.design_config?.accent_color || '#f59e0b';
  const font = config.design_config?.font_family || 'Arial, Helvetica, sans-serif';
  const headerBg = config.design_config?.table_header_bg || '#E0E0E0';
  const headerColor = config.design_config?.table_header_color || '#000';

  const cols = (config.layout_config?.table_columns || []).filter((c: any) => c.visible !== false);
  const colCount = cols.length || 5;
  const sigCount = (config.signatories || []).length || 1;

  const sampleRows = [
    { matiere: 'Marketing', coef: 3, moy: '14.5' },
    { matiere: 'Communication', coef: 2, moy: '12.0' },
    { matiere: 'Anglais', coef: 1, moy: '15.0' },
  ];

  return (
    <div
      data-testid="bulletin-live-preview"
      className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden"
      style={{ fontFamily: font }}
    >
      {/* Page paper effect */}
      <div className="bg-white p-4 text-[8px] text-black" style={{ aspectRatio: '210 / 297' }}>
        {/* Header strip */}
        <div className="flex items-center justify-between mb-2 pb-2 border-b" style={{ borderColor: '#000' }}>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded" style={{ background: primary }} />
            <div>
              <div className="font-bold" style={{ fontSize: 8 }}>Établissement</div>
              <div className="text-[6px] text-gray-500">123 Rue Example</div>
            </div>
          </div>
          <div className="text-[6px] uppercase tracking-wide font-semibold">{periodName || 'Semestre 1'}</div>
          <div className="text-right">
            <div className="font-bold uppercase" style={{ fontSize: 8, letterSpacing: 0.4 }}>Relevé de notes</div>
            <div className="text-[6px] text-gray-500">2024-2025</div>
          </div>
        </div>

        {/* Identity */}
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          <div className="border border-black p-1">
            <div className="text-[5px] text-gray-500">NOM ETUDIANT</div>
            <div className="font-semibold text-[7px]">DUPONT</div>
          </div>
          <div className="border border-black p-1">
            <div className="text-[5px] text-gray-500">FORMATION</div>
            <div className="font-semibold text-[7px] truncate">{formationTitle || 'Master'}</div>
          </div>
        </div>

        {/* Table */}
        <table className="w-full border-collapse" style={{ fontSize: 5.5 }}>
          <thead>
            <tr>
              {Array.from({ length: Math.min(colCount, 6) }).map((_, i) => (
                <th
                  key={i}
                  className="border border-black px-1 py-0.5 font-bold text-[5px] uppercase"
                  style={{ background: headerBg, color: headerColor }}
                >
                  {cols[i]?.label || ['Matière', 'Coef', 'Moy', 'Promo', 'Apprec'][i] || `Col ${i + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((r, i) => (
              <tr key={i}>
                <td className="border border-black px-1 py-0.5 text-[6px] uppercase">{r.matiere}</td>
                <td className="border border-black px-1 py-0.5 text-[6px] text-center">{r.coef}</td>
                <td className="border border-black px-1 py-0.5 text-[6px] text-center font-bold">{r.moy}</td>
                {Math.min(colCount, 6) > 3 && <td className="border border-black px-1 py-0.5 text-[6px] text-center">12.0</td>}
                {Math.min(colCount, 6) > 4 && <td className="border border-black px-1 py-0.5 text-[6px] italic">Bien</td>}
                {Math.min(colCount, 6) > 5 && <td className="border border-black px-1 py-0.5 text-[6px] text-center">A</td>}
              </tr>
            ))}
            {/* Footer total row */}
            <tr style={{ background: '#fafafa' }}>
              <td className="border border-black px-1 py-0.5 text-[6px] font-bold uppercase" colSpan={2}>Moyenne</td>
              <td
                className="border border-black px-1 py-0.5 text-[7px] text-center font-bold"
                style={{ color: accent }}
              >
                13.83
              </td>
              {Math.min(colCount, 6) > 3 && <td className="border border-black px-1 py-0.5 text-[6px] text-center">12.30</td>}
              {Math.min(colCount, 6) > 4 && <td className="border border-black px-1 py-0.5 text-[6px] text-center font-bold">ADMIS</td>}
              {Math.min(colCount, 6) > 5 && <td className="border border-black px-1 py-0.5"></td>}
            </tr>
          </tbody>
        </table>

        {/* Bottom 3 boxes */}
        <div className="grid grid-cols-3 mt-2" style={{ minHeight: 30 }}>
          <div className="border border-black p-1">
            <div className="text-[5px] font-bold">ASSIDUITE</div>
            <div className="text-[5px] text-gray-500 mt-0.5">0 absences</div>
          </div>
          <div className="border-y border-r border-black p-1">
            <div className="text-[5px] font-bold">APPRECIATION</div>
          </div>
          <div className="border-y border-r border-black p-1 text-center">
            <div className="text-[5px] font-bold">DIRECTEUR</div>
            <div className="flex justify-center gap-0.5 mt-1">
              {Array.from({ length: Math.min(sigCount, 3) }).map((_, i) => (
                <div key={i} className="w-2 h-1.5 rounded-sm" style={{ background: primary, opacity: 0.4 }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulletinPreview;
