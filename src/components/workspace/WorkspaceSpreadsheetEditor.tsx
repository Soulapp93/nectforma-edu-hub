import React, { useState, useCallback, useRef, useEffect } from 'react';
import { WorkspaceDocument, workspaceService } from '@/services/workspaceService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  ArrowLeft, Save, Plus, Trash2, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  PaintBucket, Type, Download, Undo2, Redo2
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface Props {
  document: WorkspaceDocument;
  onSave: (doc: WorkspaceDocument) => Promise<void>;
  onClose: () => void;
}

interface CellData {
  value: string;
  formula?: string;
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  bgColor?: string;
  textColor?: string;
}

type SheetData = Record<string, CellData>;

const DEFAULT_ROWS = 50;
const DEFAULT_COLS = 26;

const colLetter = (i: number) => String.fromCharCode(65 + i);
const cellKey = (row: number, col: number) => `${colLetter(col)}${row + 1}`;

const parseCellRef = (ref: string): [number, number] | null => {
  const match = ref.match(/^([A-Z])(\d+)$/);
  if (!match) return null;
  return [parseInt(match[2]) - 1, match[1].charCodeAt(0) - 65];
};

const evaluateFormula = (formula: string, data: SheetData, visited: Set<string> = new Set()): string => {
  if (!formula.startsWith('=')) return formula;
  const expr = formula.substring(1).toUpperCase().trim();

  // SUM(A1:A5)
  const sumMatch = expr.match(/^SUM\(([A-Z]\d+):([A-Z]\d+)\)$/);
  if (sumMatch) {
    const start = parseCellRef(sumMatch[1]);
    const end = parseCellRef(sumMatch[2]);
    if (!start || !end) return '#ERROR';
    let sum = 0;
    for (let r = Math.min(start[0], end[0]); r <= Math.max(start[0], end[0]); r++) {
      for (let c = Math.min(start[1], end[1]); c <= Math.max(start[1], end[1]); c++) {
        const key = cellKey(r, c);
        const val = getCellValue(key, data, visited);
        const num = parseFloat(val);
        if (!isNaN(num)) sum += num;
      }
    }
    return sum.toString();
  }

  // AVERAGE(A1:A5)
  const avgMatch = expr.match(/^AVERAGE\(([A-Z]\d+):([A-Z]\d+)\)$/);
  if (avgMatch) {
    const start = parseCellRef(avgMatch[1]);
    const end = parseCellRef(avgMatch[2]);
    if (!start || !end) return '#ERROR';
    let sum = 0, count = 0;
    for (let r = Math.min(start[0], end[0]); r <= Math.max(start[0], end[0]); r++) {
      for (let c = Math.min(start[1], end[1]); c <= Math.max(start[1], end[1]); c++) {
        const key = cellKey(r, c);
        const val = getCellValue(key, data, visited);
        const num = parseFloat(val);
        if (!isNaN(num)) { sum += num; count++; }
      }
    }
    return count > 0 ? (sum / count).toFixed(2) : '0';
  }

  // COUNT(A1:A5)
  const countMatch = expr.match(/^COUNT\(([A-Z]\d+):([A-Z]\d+)\)$/);
  if (countMatch) {
    const start = parseCellRef(countMatch[1]);
    const end = parseCellRef(countMatch[2]);
    if (!start || !end) return '#ERROR';
    let count = 0;
    for (let r = Math.min(start[0], end[0]); r <= Math.max(start[0], end[0]); r++) {
      for (let c = Math.min(start[1], end[1]); c <= Math.max(start[1], end[1]); c++) {
        const key = cellKey(r, c);
        const val = getCellValue(key, data, visited);
        if (val.trim() !== '') count++;
      }
    }
    return count.toString();
  }

  // Simple cell reference =A1
  const refMatch = expr.match(/^([A-Z]\d+)$/);
  if (refMatch) {
    return getCellValue(refMatch[1], data, visited);
  }

  // Simple arithmetic with cell refs: =A1+B1, =A1*2
  try {
    const replaced = expr.replace(/[A-Z]\d+/g, (ref) => {
      const val = getCellValue(ref, data, visited);
      const num = parseFloat(val);
      return isNaN(num) ? '0' : num.toString();
    });
    // eslint-disable-next-line no-eval
    const result = new Function(`return ${replaced}`)();
    return typeof result === 'number' ? (Number.isInteger(result) ? result.toString() : result.toFixed(2)) : String(result);
  } catch {
    return '#ERROR';
  }
};

const getCellValue = (key: string, data: SheetData, visited: Set<string> = new Set()): string => {
  if (visited.has(key)) return '#CIRC';
  visited.add(key);
  const cell = data[key];
  if (!cell) return '';
  if (cell.formula) return evaluateFormula(cell.formula, data, visited);
  return cell.value || '';
};

const CELL_COLORS = ['#ffffff', '#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3', '#f3e8ff', '#fee2e2', '#e0e7ff'];
const TEXT_COLORS = ['#000000', '#dc2626', '#16a34a', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#6b7280'];

const WorkspaceSpreadsheetEditor: React.FC<Props> = ({ document: doc, onSave, onClose }) => {
  const { userId } = useCurrentUser();
  const [title, setTitle] = useState(doc.title);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<SheetData>(() => doc.content?.cells || {});
  const [numRows, setNumRows] = useState(() => doc.content?.numRows || DEFAULT_ROWS);
  const [numCols, setNumCols] = useState(() => doc.content?.numCols || DEFAULT_COLS);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [formulaBarValue, setFormulaBarValue] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: string; end: string } | null>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const updateCell = useCallback((key: string, updates: Partial<CellData>) => {
    setData(prev => {
      const existing = prev[key] || { value: '' };
      return { ...prev, [key]: { ...existing, ...updates } };
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave({
        ...doc,
        title,
        content: { cells: data, numRows, numCols },
        last_edited_by: userId || null,
      });
      toast.success('Tableur sauvegardé');
    } catch {
      toast.error('Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  }, [doc, title, data, numRows, numCols, onSave, userId]);

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(handleSave, 3000);
  }, [handleSave]);

  useEffect(() => () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); }, []);

  const handleCellClick = (key: string) => {
    setSelectedCell(key);
    const cell = data[key];
    setFormulaBarValue(cell?.formula || cell?.value || '');
  };

  const handleCellDoubleClick = (key: string) => {
    setEditingCell(key);
    const cell = data[key];
    setEditValue(cell?.formula || cell?.value || '');
  };

  const commitEdit = (key: string) => {
    const value = editValue;
    if (value.startsWith('=')) {
      updateCell(key, { formula: value, value: '' });
    } else {
      updateCell(key, { value, formula: undefined });
    }
    setEditingCell(null);
    setEditValue('');
    scheduleAutoSave();
  };

  const handleFormulaBarChange = (value: string) => {
    setFormulaBarValue(value);
    if (selectedCell) {
      if (value.startsWith('=')) {
        updateCell(selectedCell, { formula: value, value: '' });
      } else {
        updateCell(selectedCell, { value, formula: undefined });
      }
      scheduleAutoSave();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, key: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit(key);
      // Move down
      const ref = parseCellRef(key);
      if (ref) {
        const nextKey = cellKey(ref[0] + 1, ref[1]);
        setSelectedCell(nextKey);
        const cell = data[nextKey];
        setFormulaBarValue(cell?.formula || cell?.value || '');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commitEdit(key);
      const ref = parseCellRef(key);
      if (ref) {
        const nextKey = cellKey(ref[0], ref[1] + 1);
        setSelectedCell(nextKey);
        const cell = data[nextKey];
        setFormulaBarValue(cell?.formula || cell?.value || '');
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const toggleBold = () => {
    if (!selectedCell) return;
    const cell = data[selectedCell] || { value: '' };
    updateCell(selectedCell, { bold: !cell.bold });
    scheduleAutoSave();
  };

  const toggleItalic = () => {
    if (!selectedCell) return;
    const cell = data[selectedCell] || { value: '' };
    updateCell(selectedCell, { italic: !cell.italic });
    scheduleAutoSave();
  };

  const setAlign = (align: 'left' | 'center' | 'right') => {
    if (!selectedCell) return;
    updateCell(selectedCell, { align });
    scheduleAutoSave();
  };

  const setBgColor = (color: string) => {
    if (!selectedCell) return;
    updateCell(selectedCell, { bgColor: color });
    scheduleAutoSave();
  };

  const setTextColor = (color: string) => {
    if (!selectedCell) return;
    updateCell(selectedCell, { textColor: color });
    scheduleAutoSave();
  };

  const exportCSV = () => {
    const rows: string[][] = [];
    for (let r = 0; r < numRows; r++) {
      const row: string[] = [];
      for (let c = 0; c < numCols; c++) {
        const key = cellKey(r, c);
        row.push(getCellValue(key, data));
      }
      rows.push(row);
    }
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedCellData = selectedCell ? data[selectedCell] : null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="max-w-md border-none shadow-none text-lg font-semibold focus-visible:ring-0 px-1"
          placeholder="Titre du tableur"
        />
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground hidden sm:block">
          {saving ? 'Sauvegarde...' : 'Auto-sauvegarde activée'}
        </span>
        <Button size="sm" variant="outline" onClick={exportCSV} className="gap-1.5">
          <Download className="h-4 w-4" /> CSV
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
          <Save className="h-4 w-4" /> Sauvegarder
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-1.5 border-b bg-card/50 overflow-x-auto">
        <button onClick={toggleBold} className={`p-1.5 rounded-md transition-colors ${selectedCellData?.bold ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`} title="Gras">
          <Bold className="h-4 w-4" />
        </button>
        <button onClick={toggleItalic} className={`p-1.5 rounded-md transition-colors ${selectedCellData?.italic ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`} title="Italique">
          <Italic className="h-4 w-4" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button onClick={() => setAlign('left')} className={`p-1.5 rounded-md transition-colors ${selectedCellData?.align === 'left' || !selectedCellData?.align ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>
          <AlignLeft className="h-4 w-4" />
        </button>
        <button onClick={() => setAlign('center')} className={`p-1.5 rounded-md transition-colors ${selectedCellData?.align === 'center' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>
          <AlignCenter className="h-4 w-4" />
        </button>
        <button onClick={() => setAlign('right')} className={`p-1.5 rounded-md transition-colors ${selectedCellData?.align === 'right' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>
          <AlignRight className="h-4 w-4" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-md hover:bg-muted" title="Couleur de fond">
              <PaintBucket className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <div className="grid grid-cols-4 gap-1 p-2">
              {CELL_COLORS.map(c => (
                <button key={c} onClick={() => setBgColor(c)} className="w-6 h-6 rounded border border-border" style={{ backgroundColor: c }} />
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-md hover:bg-muted" title="Couleur du texte">
              <Type className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <div className="grid grid-cols-4 gap-1 p-2">
              {TEXT_COLORS.map(c => (
                <button key={c} onClick={() => setTextColor(c)} className="w-6 h-6 rounded-full border border-border" style={{ backgroundColor: c }} />
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-5 bg-border mx-1" />
        <Button size="sm" variant="ghost" onClick={() => setNumRows(r => r + 10)} className="text-xs gap-1">
          <Plus className="h-3 w-3" /> Lignes
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setNumCols(c => Math.min(c + 1, 26))} className="text-xs gap-1">
          <Plus className="h-3 w-3" /> Colonnes
        </Button>
      </div>

      {/* Formula bar */}
      <div className="flex items-center gap-2 px-4 py-1 border-b bg-card/30">
        <span className="text-xs font-mono bg-muted px-2 py-1 rounded min-w-[3rem] text-center">
          {selectedCell || ''}
        </span>
        <span className="text-xs text-muted-foreground">fx</span>
        <input
          value={formulaBarValue}
          onChange={e => handleFormulaBarChange(e.target.value)}
          className="flex-1 text-sm border-none bg-transparent outline-none font-mono"
          placeholder="Entrez une valeur ou une formule (=SUM, =AVERAGE, =COUNT)"
        />
      </div>

      {/* Spreadsheet grid */}
      <div ref={tableRef} className="flex-1 overflow-auto">
        <table className="border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="w-12 min-w-[3rem] bg-muted border border-border text-xs font-medium text-center sticky left-0 z-20" />
              {Array.from({ length: numCols }, (_, c) => (
                <th key={c} className="w-28 min-w-[7rem] bg-muted border border-border text-xs font-medium text-center py-1">
                  {colLetter(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: numRows }, (_, r) => (
              <tr key={r}>
                <td className="bg-muted border border-border text-xs text-center font-medium text-muted-foreground sticky left-0 z-10 py-0.5">
                  {r + 1}
                </td>
                {Array.from({ length: numCols }, (_, c) => {
                  const key = cellKey(r, c);
                  const cell = data[key];
                  const isSelected = selectedCell === key;
                  const isEditing = editingCell === key;
                  const displayValue = getCellValue(key, data);

                  return (
                    <td
                      key={c}
                      className={`border border-border p-0 relative transition-colors ${isSelected ? 'ring-2 ring-primary ring-inset' : 'hover:bg-muted/30'}`}
                      style={{
                        backgroundColor: cell?.bgColor || undefined,
                      }}
                      onClick={() => handleCellClick(key)}
                      onDoubleClick={() => handleCellDoubleClick(key)}
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => commitEdit(key)}
                          onKeyDown={e => handleKeyDown(e, key)}
                          className="w-full h-full px-1.5 py-0.5 text-sm outline-none bg-white border-none font-mono"
                          style={{ minHeight: '24px' }}
                        />
                      ) : (
                        <div
                          className="px-1.5 py-0.5 text-sm truncate select-none"
                          style={{
                            fontWeight: cell?.bold ? 'bold' : undefined,
                            fontStyle: cell?.italic ? 'italic' : undefined,
                            textAlign: cell?.align || 'left',
                            color: cell?.textColor || undefined,
                            minHeight: '24px',
                          }}
                        >
                          {displayValue}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkspaceSpreadsheetEditor;
