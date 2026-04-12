import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Loader2, FileSpreadsheet, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';

interface NativeExcelViewerProps {
  fileUrl: string;
  fileName: string;
  onLoad: () => void;
  onError: (msg: string) => void;
}

interface CellStyle {
  bgColor?: string;
  fgColor?: string;
  bold?: boolean;
  italic?: boolean;
  fontSize?: number;
  hAlign?: string;
  vAlign?: string;
  borderBottom?: boolean;
  borderTop?: boolean;
  borderLeft?: boolean;
  borderRight?: boolean;
  wrap?: boolean;
}

const rgbToHex = (rgb: any): string | undefined => {
  if (!rgb) return undefined;
  if (typeof rgb === 'string') {
    if (rgb.startsWith('#')) return rgb;
    if (rgb.length === 6 || rgb.length === 8) return `#${rgb.slice(-6)}`;
  }
  if (rgb.rgb) return `#${rgb.rgb}`;
  return undefined;
};

const getCellStyle = (cell: any): CellStyle => {
  if (!cell?.s) return {};
  const s = cell.s;
  const style: CellStyle = {};

  if (s.fill) {
    const fg = s.fill.fgColor;
    if (fg) {
      style.bgColor = rgbToHex(fg) || (fg.theme !== undefined ? undefined : undefined);
      if (fg.rgb) style.bgColor = `#${fg.rgb.slice(-6)}`;
    }
  }

  if (s.font) {
    style.bold = s.font.bold;
    style.italic = s.font.italic;
    if (s.font.sz) style.fontSize = s.font.sz;
    if (s.font.color) {
      const c = s.font.color;
      if (c.rgb) style.fgColor = `#${c.rgb.slice(-6)}`;
    }
  }

  if (s.alignment) {
    style.hAlign = s.alignment.horizontal;
    style.vAlign = s.alignment.vertical;
    style.wrap = s.alignment.wrapText;
  }

  if (s.border) {
    style.borderBottom = !!s.border.bottom;
    style.borderTop = !!s.border.top;
    style.borderLeft = !!s.border.left;
    style.borderRight = !!s.border.right;
  }

  return style;
};

const NativeExcelViewer: React.FC<NativeExcelViewerProps> = ({
  fileUrl,
  fileName,
  onLoad,
  onError,
}) => {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [activeSheet, setActiveSheet] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const loadExcel = async () => {
      try {
        setLoading(true);
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const wb = XLSX.read(arrayBuffer, {
          type: 'array',
          cellStyles: true,
          cellDates: true,
          cellNF: true,
        });
        if (!cancelled) {
          setWorkbook(wb);
          setLoading(false);
          onLoad();
        }
      } catch (e: any) {
        if (!cancelled) {
          setLoading(false);
          onError(e.message || 'Erreur de chargement Excel');
        }
      }
    };
    loadExcel();
    return () => { cancelled = true; };
  }, [fileUrl]);

  const sheetNames = useMemo(() => workbook?.SheetNames || [], [workbook]);

  const { headers, rows, merges, colWidths } = useMemo(() => {
    if (!workbook || !sheetNames[activeSheet]) return { headers: [], rows: [], merges: [], colWidths: [] };
    const ws = workbook.Sheets[sheetNames[activeSheet]];
    const ref = ws['!ref'];
    if (!ref) return { headers: [], rows: [], merges: [], colWidths: [] };

    const range = XLSX.utils.decode_range(ref);
    const numCols = range.e.c - range.s.c + 1;
    const numRows = range.e.r - range.s.r + 1;

    // Column headers (A, B, C...)
    const hdrs: string[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      hdrs.push(XLSX.utils.encode_col(c));
    }

    // Rows with cell data
    const rws: Array<Array<{ value: string; style: CellStyle; merged?: boolean; colSpan?: number; rowSpan?: number }>> = [];
    const mergeMap = new Map<string, { colSpan: number; rowSpan: number }>();
    const mergedCells = new Set<string>();

    // Process merges
    const mgs = ws['!merges'] || [];
    for (const m of mgs) {
      const key = `${m.s.r}-${m.s.c}`;
      mergeMap.set(key, {
        colSpan: m.e.c - m.s.c + 1,
        rowSpan: m.e.r - m.s.r + 1,
      });
      for (let r = m.s.r; r <= m.e.r; r++) {
        for (let c = m.s.c; c <= m.e.c; c++) {
          if (r !== m.s.r || c !== m.s.c) {
            mergedCells.add(`${r}-${c}`);
          }
        }
      }
    }

    // Column widths
    const cws: number[] = [];
    const colInfo = ws['!cols'] || [];
    for (let c = 0; c < numCols; c++) {
      const w = colInfo[c + range.s.c]?.wpx || colInfo[c + range.s.c]?.wch ? (colInfo[c + range.s.c].wch! * 8) : 100;
      cws.push(Math.max(60, Math.min(w, 400)));
    }

    for (let r = range.s.r; r <= range.e.r; r++) {
      const row: typeof rws[0] = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        const cell = ws[cellRef];
        const key = `${r}-${c}`;

        if (mergedCells.has(key)) {
          row.push({ value: '', style: {}, merged: true });
          continue;
        }

        const merge = mergeMap.get(key);
        let value = '';
        if (cell) {
          if (cell.w) value = cell.w;
          else if (cell.v !== undefined) value = String(cell.v);
        }

        row.push({
          value,
          style: getCellStyle(cell),
          colSpan: merge?.colSpan,
          rowSpan: merge?.rowSpan,
        });
      }
      rws.push(row);
    }

    return { headers: hdrs, rows: rws, merges: mgs, colWidths: cws };
  }, [workbook, activeSheet, sheetNames]);

  // Highlight search
  const matchesSearch = useCallback((val: string) => {
    if (!searchTerm) return false;
    return val.toLowerCase().includes(searchTerm.toLowerCase());
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-sm text-muted-foreground">Chargement du fichier Excel...</p>
      </div>
    );
  }

  if (!workbook) return null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Sheet tabs + search */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-muted/40 border-b border-border overflow-x-auto shrink-0">
        {/* Sheet tabs */}
        <div className="flex items-center gap-0.5 flex-1 overflow-x-auto">
          {sheetNames.map((name, i) => (
            <button
              key={name}
              onClick={() => setActiveSheet(i)}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                i === activeSheet
                  ? 'bg-background text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
              data-testid={`sheet-tab-${i}`}
            >
              {name}
            </button>
          ))}
        </div>
        
        {/* Search toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0"
          onClick={() => setSearchOpen(!searchOpen)}
        >
          <Search className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="px-3 py-1.5 bg-muted/20 border-b border-border shrink-0">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher dans la feuille..."
            className="w-full max-w-sm px-3 py-1 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            autoFocus
            data-testid="excel-search"
          />
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto" ref={tableRef}>
        <table className="border-collapse min-w-full" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 40 }} />
            {colWidths.map((w, i) => (
              <col key={i} style={{ width: w }} />
            ))}
          </colgroup>
          {/* Column headers */}
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="bg-[#f0f0f0] border border-[#d0d0d0] text-[11px] text-center font-medium text-[#555] w-10 sticky left-0 z-20" />
              {headers.map((h, i) => (
                <th key={i} className="bg-[#f0f0f0] border border-[#d0d0d0] text-[11px] text-center font-medium text-[#555] px-1 py-0.5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {/* Row number */}
                <td className="bg-[#f0f0f0] border border-[#d0d0d0] text-[11px] text-center font-medium text-[#555] sticky left-0 z-[5] px-1 py-0">
                  {ri + 1}
                </td>
                {row.map((cell, ci) => {
                  if (cell.merged) return null;
                  const s = cell.style;
                  const highlight = matchesSearch(cell.value);
                  return (
                    <td
                      key={ci}
                      colSpan={cell.colSpan}
                      rowSpan={cell.rowSpan}
                      className="border border-[#e0e0e0] px-1.5 py-0.5 text-[12px] leading-tight overflow-hidden"
                      style={{
                        backgroundColor: highlight ? '#fff3cd' : s.bgColor || undefined,
                        color: s.fgColor || undefined,
                        fontWeight: s.bold ? 700 : undefined,
                        fontStyle: s.italic ? 'italic' : undefined,
                        fontSize: s.fontSize ? `${Math.min(s.fontSize, 16)}px` : '12px',
                        textAlign: (s.hAlign as any) || 'left',
                        verticalAlign: s.vAlign === 'center' ? 'middle' : s.vAlign === 'bottom' ? 'bottom' : 'top',
                        whiteSpace: s.wrap ? 'pre-wrap' : 'nowrap',
                        maxWidth: colWidths[ci] || 200,
                        borderBottom: s.borderBottom ? '1px solid #999' : undefined,
                        borderTop: s.borderTop ? '1px solid #999' : undefined,
                        borderLeft: s.borderLeft ? '1px solid #999' : undefined,
                        borderRight: s.borderRight ? '1px solid #999' : undefined,
                      }}
                      title={cell.value.length > 50 ? cell.value : undefined}
                    >
                      {cell.value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer status bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-muted/30 border-t border-border text-[11px] text-muted-foreground shrink-0">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
          <span>{sheetNames[activeSheet]}</span>
          <span>{rows.length} lignes × {headers.length} colonnes</span>
        </div>
        <div className="flex items-center gap-2">
          {sheetNames.length > 1 && (
            <>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setActiveSheet(Math.max(0, activeSheet - 1))} disabled={activeSheet === 0}>
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <span>{activeSheet + 1}/{sheetNames.length}</span>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setActiveSheet(Math.min(sheetNames.length - 1, activeSheet + 1))} disabled={activeSheet === sheetNames.length - 1}>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NativeExcelViewer;
