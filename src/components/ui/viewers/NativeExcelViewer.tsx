import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Loader2, FileSpreadsheet, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';

interface NativeExcelViewerProps {
  fileUrl: string;
  fileName: string;
  onLoad: () => void;
  onError: (msg: string) => void;
}

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
  const contentRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

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
          cellHTML: true,
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

  // Generate HTML from current sheet using SheetJS native rendering
  const sheetHtml = useMemo(() => {
    if (!workbook || !sheetNames[activeSheet]) return '';
    const ws = workbook.Sheets[sheetNames[activeSheet]];
    // Use sheet_to_html which preserves merges, basic structure
    let html = XLSX.utils.sheet_to_html(ws, { id: 'excel-table', editable: false });
    return html;
  }, [workbook, activeSheet, sheetNames]);

  // Sheet info for status bar
  const sheetInfo = useMemo(() => {
    if (!workbook || !sheetNames[activeSheet]) return { rows: 0, cols: 0 };
    const ws = workbook.Sheets[sheetNames[activeSheet]];
    const ref = ws['!ref'];
    if (!ref) return { rows: 0, cols: 0 };
    const range = XLSX.utils.decode_range(ref);
    return {
      rows: range.e.r - range.s.r + 1,
      cols: range.e.c - range.s.c + 1,
    };
  }, [workbook, activeSheet, sheetNames]);

  // Highlight search matches in the rendered HTML
  useEffect(() => {
    if (!contentRef.current || !searchTerm) return;
    // Remove previous highlights
    const table = contentRef.current.querySelector('#excel-table');
    if (!table) return;
    const cells = table.querySelectorAll('td');
    cells.forEach(cell => {
      cell.style.removeProperty('outline');
      cell.style.removeProperty('outline-offset');
    });
    if (searchTerm.length < 2) return;
    const term = searchTerm.toLowerCase();
    let firstMatch: HTMLElement | null = null;
    cells.forEach(cell => {
      if (cell.textContent?.toLowerCase().includes(term)) {
        cell.style.outline = '2px solid #f59e0b';
        cell.style.outlineOffset = '-1px';
        if (!firstMatch) firstMatch = cell as HTMLElement;
      }
    });
    if (firstMatch) {
      firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchTerm, sheetHtml]);

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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      {/* Sheet tabs + search */}
      <div className="flex items-center gap-1 px-1 py-1 bg-[#f1f1f1] border-b border-[#d4d4d4] shrink-0">
        {/* Sheet tabs - scrollable */}
        <div ref={tabsRef} className="flex items-center gap-0 flex-1 overflow-x-auto scrollbar-thin">
          {sheetNames.map((name, i) => (
            <button
              key={name}
              onClick={() => setActiveSheet(i)}
              className={`px-3 py-1.5 text-[11px] font-medium whitespace-nowrap border transition-colors ${
                i === activeSheet
                  ? 'bg-white text-[#217346] border-[#d4d4d4] border-b-white -mb-px relative z-10'
                  : 'bg-[#e7e7e7] text-[#555] border-transparent hover:bg-[#ddd]'
              }`}
              data-testid={`sheet-tab-${i}`}
            >
              {name}
            </button>
          ))}
        </div>
        {/* Search */}
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => setSearchOpen(!searchOpen)}>
          <Search className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="px-3 py-1.5 bg-[#f8f8f8] border-b border-[#d4d4d4] shrink-0">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher dans la feuille..."
            className="w-full max-w-sm px-3 py-1 text-sm border border-[#ccc] rounded bg-white focus:outline-none focus:border-[#217346]"
            autoFocus
            data-testid="excel-search"
          />
        </div>
      )}

      {/* Excel content - native HTML render */}
      <div
        ref={contentRef}
        className="flex-1 overflow-auto bg-white excel-native-viewer"
        dangerouslySetInnerHTML={{ __html: sheetHtml }}
      />

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#217346] text-white text-[11px] shrink-0">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          <span>{sheetNames[activeSheet]}</span>
          <span className="opacity-70">{sheetInfo.rows} lignes × {sheetInfo.cols} colonnes</span>
        </div>
        {sheetNames.length > 1 && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-white hover:bg-white/20" onClick={() => setActiveSheet(Math.max(0, activeSheet - 1))} disabled={activeSheet === 0}>
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span>{activeSheet + 1}/{sheetNames.length}</span>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-white hover:bg-white/20" onClick={() => setActiveSheet(Math.min(sheetNames.length - 1, activeSheet + 1))} disabled={activeSheet === sheetNames.length - 1}>
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Styles for the native Excel HTML */}
      <style>{`
        .excel-native-viewer table {
          border-collapse: collapse;
          font-family: Calibri, Arial, sans-serif;
          font-size: 11px;
          white-space: nowrap;
        }
        .excel-native-viewer td, .excel-native-viewer th {
          border: 1px solid #d4d4d4;
          padding: 2px 6px;
          min-width: 64px;
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          vertical-align: bottom;
          height: 20px;
        }
        .excel-native-viewer tr:first-child td,
        .excel-native-viewer tr:first-child th {
          font-weight: normal;
        }
        .excel-native-viewer td[style*="background"],
        .excel-native-viewer td[bgcolor] {
          /* Preserve background colors from SheetJS */
        }
        .excel-native-viewer td:empty {
          min-width: 64px;
        }
      `}</style>
    </div>
  );
};

export default NativeExcelViewer;
