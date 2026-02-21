import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { WorkspaceDocument, workspaceService } from '@/services/workspaceService';
import { fileImportService } from '@/services/fileImportService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Save, Plus, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  PaintBucket, Type, Download, Undo2, Redo2, BarChart3, Trash2, Copy, Clipboard,
  Scissors, Search, FileSpreadsheet, ChevronDown, Merge, SplitSquareHorizontal,
  Lock, Unlock, Filter, SortAsc, SortDesc, WrapText, Grid3X3, Eye, EyeOff,
  PlusCircle, MinusCircle, ArrowUpDown, Columns, Rows, MoreHorizontal, X, Upload,
  Strikethrough, MessageSquare, List, Palette, ArrowDownUp, Replace, Square,
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  RotateCcw, IndentIncrease, IndentDecrease, Share2, Users, Printer,
  Maximize2, Minimize2, CheckSquare, Link, ZoomIn, ZoomOut, Eraser,
  Table, BarChart, Hash, Sigma, FunctionSquare, HelpCircle, Settings,
} from 'lucide-react';
import ShareDocumentModal from './ShareDocumentModal';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import {
  SheetData, CellData, cellKey, colLetter, parseCellRef, getCellValue,
  evaluateFormula, evaluateConditionalFormat, FORMULA_LIST, FORMULA_CATEGORIES,
  DataValidation, ConditionalFormatRule
} from '@/utils/spreadsheetFormulas';
import SpreadsheetChart, { ChartType } from './SpreadsheetChart';

interface Props {
  document: WorkspaceDocument;
  onSave: (doc: WorkspaceDocument) => Promise<void>;
  onClose: () => void;
}

interface SheetTab {
  id: string;
  name: string;
  data: SheetData;
  numRows: number;
  numCols: number;
  frozenRows: number;
  frozenCols: number;
  colWidths: Record<number, number>;
  rowHeights: Record<number, number>;
  hiddenRows: Set<number>;
  hiddenCols: Set<number>;
}

interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  dataRange: string;
  labelsRange: string;
  colors: string[];
}

interface HistoryEntry {
  sheets: SheetTab[];
  activeSheet: number;
}

const DEFAULT_ROWS = 100;
const DEFAULT_COLS = 26;
const DEFAULT_COL_WIDTH = 100;
const DEFAULT_ROW_HEIGHT = 25;
const MIN_COL_WIDTH = 40;
const MIN_ROW_HEIGHT = 20;
const ROW_HEADER_WIDTH = 46;

const CELL_COLORS = [
  'transparent', '#ffffff', '#f3f4f6', '#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3', '#f3e8ff',
  '#fee2e2', '#e0e7ff', '#cffafe', '#fef9c3', '#d1fae5', '#fbcfe8', '#c7d2fe', '#fecaca',
  '#bfdbfe', '#bbf7d0', '#fde68a', '#c4b5fd', '#f9a8d4', '#99f6e4', '#fed7aa', '#a5b4fc'
];

const TEXT_COLORS = [
  '#000000', '#374151', '#6b7280', '#dc2626', '#ea580c', '#d97706', '#16a34a', '#059669',
  '#0891b2', '#2563eb', '#4f46e5', '#7c3aed', '#9333ea', '#db2777', '#e11d48', '#ffffff'
];

const FONT_FAMILIES = [
  'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  'Trebuchet MS', 'Impact', 'Comic Sans MS', 'Lucida Console', 'Tahoma', 'Garamond'
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

const NUMBER_FORMATS = [
  { label: 'Normal', value: '' },
  { label: 'Nombre', value: '#,##0' },
  { label: 'Décimal', value: '#,##0.00' },
  { label: 'Devise €', value: '€#,##0.00' },
  { label: 'Devise $', value: '$#,##0.00' },
  { label: 'Pourcentage', value: '0%' },
  { label: 'Pourcentage .00', value: '0.00%' },
  { label: 'Date', value: 'dd/mm/yyyy' },
  { label: 'Scientifique', value: '0.00E+0' },
];

const createEmptySheet = (name: string): SheetTab => ({
  id: crypto.randomUUID(),
  name,
  data: {},
  numRows: DEFAULT_ROWS,
  numCols: DEFAULT_COLS,
  frozenRows: 0,
  frozenCols: 0,
  colWidths: {},
  rowHeights: {},
  hiddenRows: new Set(),
  hiddenCols: new Set(),
});

const WorkspaceSpreadsheetEditor: React.FC<Props> = ({ document: doc, onSave, onClose }) => {
  const { userId } = useCurrentUser();

  // --- State ---
  const [title, setTitle] = useState(doc.title);
  const [saving, setSaving] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const isOwner = doc.owner_id === userId;
  const [sheets, setSheets] = useState<SheetTab[]>(() => {
    if (doc.content?.sheets) {
      return doc.content.sheets.map((s: any) => ({
        ...s,
        hiddenRows: new Set(s.hiddenRows || []),
        hiddenCols: new Set(s.hiddenCols || []),
      }));
    }
    const sheet = createEmptySheet('Feuille 1');
    if (doc.content?.cells) {
      sheet.data = doc.content.cells;
      sheet.numRows = doc.content.numRows || DEFAULT_ROWS;
      sheet.numCols = doc.content.numCols || DEFAULT_COLS;
    }
    return [sheet];
  });
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  const [selectedCell, setSelectedCell] = useState<string | null>('A1');
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [formulaBarValue, setFormulaBarValue] = useState('');
  const [selectionStart, setSelectionStart] = useState<string | null>('A1');
  const [selectionEnd, setSelectionEnd] = useState<string | null>('A1');
  const [isSelecting, setIsSelecting] = useState(false);
  const [clipboard, setClipboard] = useState<{ data: Record<string, CellData>; startRow: number; startCol: number; rows: number; cols: number } | null>(null);
  const [clipboardMode, setClipboardMode] = useState<'copy' | 'cut'>('copy');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [charts, setCharts] = useState<ChartConfig[]>(doc.content?.charts || []);
  const [showChartPanel, setShowChartPanel] = useState(false);
  const [showFormulaHelper, setShowFormulaHelper] = useState(false);
  const [formulaSuggestions, setFormulaSuggestions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; row: number; col: number } | null>(null);
  const [editingSheetName, setEditingSheetName] = useState<number | null>(null);
  const [resizingCol, setResizingCol] = useState<number | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  const [resizingRow, setResizingRow] = useState<number | null>(null);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [resizeStartHeight, setResizeStartHeight] = useState(0);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [replaceText, setReplaceText] = useState('');
  const [showConditionalFormat, setShowConditionalFormat] = useState(false);
  const [showDataValidation, setShowDataValidation] = useState(false);
  const [commentCell, setCommentCell] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<number, string>>({});
  const [showFilterDropdown, setShowFilterDropdown] = useState<number | null>(null);
  const [autoFillStart, setAutoFillStart] = useState<string | null>(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFillEnd, setAutoFillEnd] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showGridLines, setShowGridLines] = useState(true);

  // Conditional format panel state
  const [cfType, setCfType] = useState<'greaterThan' | 'lessThan' | 'equal' | 'between' | 'text' | 'blank' | 'notBlank'>('greaterThan');
  const [cfValue, setCfValue] = useState('');
  const [cfValue2, setCfValue2] = useState('');
  const [cfBgColor, setCfBgColor] = useState('#dcfce7');
  const [cfTextColor, setCfTextColor] = useState('#000000');

  // Data validation panel state
  const [dvType, setDvType] = useState<'list' | 'number' | 'text'>('list');
  const [dvValues, setDvValues] = useState('');
  const [dvMin, setDvMin] = useState('');
  const [dvMax, setDvMax] = useState('');

  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const formulaInputRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [importingFile, setImportingFile] = useState(false);

  const sheet = sheets[activeSheetIdx];
  const data = sheet?.data || {};

  // --- History ---
  const pushHistory = useCallback(() => {
    const entry: HistoryEntry = {
      sheets: sheets.map(s => ({ ...s, hiddenRows: new Set(s.hiddenRows), hiddenCols: new Set(s.hiddenCols) })),
      activeSheet: activeSheetIdx,
    };
    setHistory(prev => [...prev.slice(0, historyIdx + 1), entry].slice(-50));
    setHistoryIdx(prev => prev + 1);
  }, [sheets, activeSheetIdx, historyIdx]);

  const undo = useCallback(() => {
    if (historyIdx < 0) return;
    const entry = history[historyIdx];
    if (entry) {
      setSheets(entry.sheets);
      setActiveSheetIdx(entry.activeSheet);
      setHistoryIdx(prev => prev - 1);
    }
  }, [history, historyIdx]);

  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1) return;
    const entry = history[historyIdx + 2];
    if (entry) {
      setSheets(entry.sheets);
      setActiveSheetIdx(entry.activeSheet);
      setHistoryIdx(prev => prev + 1);
    }
  }, [history, historyIdx]);

  // --- Update helpers ---
  const updateSheetData = useCallback((key: string, updates: Partial<CellData>) => {
    setSheets(prev => prev.map((s, i) => {
      if (i !== activeSheetIdx) return s;
      const existing = s.data[key] || { value: '' };
      return { ...s, data: { ...s.data, [key]: { ...existing, ...updates } } };
    }));
  }, [activeSheetIdx]);

  const updateSheet = useCallback((updates: Partial<SheetTab>) => {
    setSheets(prev => prev.map((s, i) => i === activeSheetIdx ? { ...s, ...updates } : s));
  }, [activeSheetIdx]);

  // --- Save ---
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const sheetsToSave = sheets.map(s => ({
        ...s,
        hiddenRows: Array.from(s.hiddenRows),
        hiddenCols: Array.from(s.hiddenCols),
      }));
      await onSave({
        ...doc,
        title,
        content: { sheets: sheetsToSave, charts },
        last_edited_by: userId || null,
      });
      toast.success('Tableur sauvegardé');
    } catch {
      toast.error('Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  }, [doc, title, sheets, charts, onSave, userId]);

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(handleSave, 3000);
  }, [handleSave]);

  useEffect(() => () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); }, []);

  // --- Cell interactions ---
  const isEditingFormula = editingCell !== null && editValue.startsWith('=');

  // Extract cell references from formula for visual highlighting
  const formulaReferencedCells = useMemo(() => {
    if (!isEditingFormula) return new Set<string>();
    const refs = new Set<string>();
    const matches = editValue.matchAll(/\b([A-Z]+\d+)\b/g);
    for (const m of matches) {
      refs.add(m[1]);
    }
    return refs;
  }, [isEditingFormula, editValue]);

  const handleCellClick = (key: string, e: React.MouseEvent) => {
    // Excel-like: if editing a formula, clicking another cell inserts the cell reference
    if (isEditingFormula && key !== editingCell) {
      e.preventDefault();
      e.stopPropagation();
      const lastChar = editValue.slice(-1);
      const isAfterOperator = ['+', '-', '*', '/', '(', ',', '=', '>', '<', '&', '^', ' '].includes(lastChar);
      let newVal: string;
      if (isAfterOperator) {
        newVal = editValue + key;
      } else {
        const refPattern = /[A-Z]+\d+$/;
        const match = editValue.match(refPattern);
        if (match) {
          newVal = editValue.slice(0, -match[0].length) + key;
        } else {
          newVal = editValue + key;
        }
      }
      setEditValue(newVal);
      setFormulaBarValue(newVal);
      if (editingCell) {
        updateSheetData(editingCell, { formula: newVal, value: '' });
      }
      setTimeout(() => formulaInputRef.current?.focus(), 0);
      return;
    }

    if (e.shiftKey && selectedCell) {
      setSelectionEnd(key);
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl+Click: just move active cell without clearing selection
      setSelectedCell(key);
    } else {
      setSelectedCell(key);
      setSelectionStart(key);
      setSelectionEnd(key);
    }
    const cell = data[key];
    setFormulaBarValue(cell?.formula || cell?.value || '');
    setEditingCell(null);
  };

  const handleCellDoubleClick = (key: string) => {
    setEditingCell(key);
    const cell = data[key];
    setEditValue(cell?.formula || cell?.value || '');
  };

  const commitEdit = (key: string) => {
    pushHistory();
    if (editValue.startsWith('=')) {
      updateSheetData(key, { formula: editValue, value: '' });
    } else {
      updateSheetData(key, { value: editValue, formula: undefined });
    }
    setEditingCell(null);
    setEditValue('');
    scheduleAutoSave();
  };

  const handleFormulaBarChange = (value: string) => {
    setFormulaBarValue(value);
    if (value.startsWith('=')) {
      const partial = value.substring(1).toUpperCase();
      const lastFunc = partial.match(/([A-Z_]+)$/);
      if (lastFunc) {
        setFormulaSuggestions(FORMULA_LIST.filter(f => f.startsWith(lastFunc[1])).slice(0, 8));
        setShowFormulaHelper(true);
      } else {
        setShowFormulaHelper(false);
      }
      if (selectedCell && editingCell !== selectedCell) {
        setEditingCell(selectedCell);
      }
      setEditValue(value);
    } else {
      setShowFormulaHelper(false);
      setEditValue(value);
    }
    if (selectedCell) {
      if (value.startsWith('=')) {
        updateSheetData(selectedCell, { formula: value, value: '' });
      } else {
        updateSheetData(selectedCell, { value, formula: undefined });
      }
      scheduleAutoSave();
    }
  };

  const insertFormulaSuggestion = (formula: string) => {
    const newVal = '=' + formula + '(';
    setFormulaBarValue(newVal);
    if (selectedCell) {
      updateSheetData(selectedCell, { formula: newVal, value: '' });
    }
    setShowFormulaHelper(false);
    formulaInputRef.current?.focus();
  };

  // --- Keyboard ---
  const handleCellKeyDown = (e: React.KeyboardEvent, key: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit(key);
      const ref = parseCellRef(key);
      if (ref) {
        const nextKey = cellKey(ref[0] + 1, ref[1]);
        setSelectedCell(nextKey);
        setSelectionStart(nextKey);
        setSelectionEnd(nextKey);
        const cell = data[nextKey];
        setFormulaBarValue(cell?.formula || cell?.value || '');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commitEdit(key);
      const ref = parseCellRef(key);
      if (ref) {
        const nextKey = cellKey(ref[0], ref[1] + (e.shiftKey ? -1 : 1));
        setSelectedCell(nextKey);
        setSelectionStart(nextKey);
        setSelectionEnd(nextKey);
        const cell = data[nextKey];
        setFormulaBarValue(cell?.formula || cell?.value || '');
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
      if (selectedCell) {
        const cell = data[selectedCell];
        setFormulaBarValue(cell?.formula || cell?.value || '');
      }
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && editingCell && editValue.startsWith('=')) {
        e.preventDefault();
        commitEdit(editingCell);
        const ref = parseCellRef(editingCell);
        if (ref) {
          const nextKey = cellKey(ref[0] + 1, ref[1]);
          setSelectedCell(nextKey);
          setSelectionStart(nextKey);
          setSelectionEnd(nextKey);
          const cell = data[nextKey];
          setFormulaBarValue(cell?.formula || cell?.value || '');
        }
        return;
      }
      if (e.key === 'Escape' && editingCell) {
        setEditingCell(null);
        setEditValue('');
        if (selectedCell) {
          const cell = data[selectedCell];
          setFormulaBarValue(cell?.formula || cell?.value || '');
        }
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); undo(); }
        if (e.key === 'y') { e.preventDefault(); redo(); }
        if (e.key === 'c') handleCopy();
        if (e.key === 'x') handleCut();
        if (e.key === 'v') { e.preventDefault(); handlePaste(); }
        if (e.key === 'f') { e.preventDefault(); setShowSearch(true); }
        if (e.key === 'b' && selectedCell) { e.preventDefault(); toggleFormat('bold'); }
        if (e.key === 'i' && selectedCell) { e.preventDefault(); toggleFormat('italic'); }
        if (e.key === 'u' && selectedCell) { e.preventDefault(); toggleFormat('underline'); }
        if (e.key === '\\' && selectedCell) { e.preventDefault(); clearFormatting(); }
        if (e.key === 'h') { e.preventDefault(); setShowSearch(true); setShowFindReplace(true); }
        if (e.key === 'a' && !editingCell) {
          e.preventDefault();
          // Select all
          setSelectionStart(cellKey(0, 0));
          setSelectionEnd(cellKey(sheet.numRows - 1, sheet.numCols - 1));
          setSelectedCell('A1');
        }
      }
      if (e.key === 'Delete' && selectedCell && !editingCell) {
        pushHistory();
        const b = getSelectionBounds();
        if (b) {
          for (let r = b.r1; r <= b.r2; r++) {
            for (let c = b.c1; c <= b.c2; c++) {
              updateSheetData(cellKey(r, c), { value: '', formula: undefined });
            }
          }
        } else {
          updateSheetData(selectedCell, { value: '', formula: undefined });
        }
        scheduleAutoSave();
      }
      // F2 to edit
      if (e.key === 'F2' && selectedCell && !editingCell) {
        e.preventDefault();
        handleCellDoubleClick(selectedCell);
      }
      // Arrow keys navigation
      if (!editingCell && selectedCell && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const ref = parseCellRef(selectedCell);
        if (!ref) return;
        let [r, c] = ref;
        if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
        if (e.key === 'ArrowDown') r = Math.min(sheet.numRows - 1, r + 1);
        if (e.key === 'ArrowLeft') c = Math.max(0, c - 1);
        if (e.key === 'ArrowRight') c = Math.min(sheet.numCols - 1, c + 1);
        const newKey = cellKey(r, c);
        if (e.shiftKey) {
          // Extend selection
          setSelectionEnd(newKey);
        } else {
          setSelectedCell(newKey);
          setSelectionStart(newKey);
          setSelectionEnd(newKey);
        }
        const cell = data[newKey];
        setFormulaBarValue(cell?.formula || cell?.value || '');

        // Scroll into view
        const cellEl = tableRef.current?.querySelector(`[data-cell="${newKey}"]`);
        cellEl?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
      // Start typing to enter edit mode
      if (!editingCell && selectedCell && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setEditingCell(selectedCell);
        setEditValue(e.key);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedCell, editingCell, editValue, undo, redo, data, sheet]);

  // --- Selection range ---
  const getSelectionBounds = useCallback(() => {
    if (!selectionStart || !selectionEnd) return null;
    const s = parseCellRef(selectionStart);
    const e = parseCellRef(selectionEnd);
    if (!s || !e) return null;
    return {
      r1: Math.min(s[0], e[0]), r2: Math.max(s[0], e[0]),
      c1: Math.min(s[1], e[1]), c2: Math.max(s[1], e[1]),
    };
  }, [selectionStart, selectionEnd]);

  const isInSelection = (row: number, col: number) => {
    const b = getSelectionBounds();
    if (!b) return selectedCell === cellKey(row, col);
    return row >= b.r1 && row <= b.r2 && col >= b.c1 && col <= b.c2;
  };

  // --- Selection info for status bar ---
  const selectionStats = useMemo(() => {
    const b = getSelectionBounds();
    if (!b) {
      if (selectedCell) {
        const val = getCellValue(selectedCell, data);
        const num = parseFloat(val);
        if (!isNaN(num) && val.trim()) {
          return { sum: num, average: num, count: 1, numCount: 1 };
        }
        return { sum: 0, average: 0, count: val.trim() ? 1 : 0, numCount: 0 };
      }
      return null;
    }
    let sum = 0, count = 0, numCount = 0;
    for (let r = b.r1; r <= b.r2; r++) {
      for (let c = b.c1; c <= b.c2; c++) {
        const val = getCellValue(cellKey(r, c), data);
        if (val.trim()) {
          count++;
          const num = parseFloat(val);
          if (!isNaN(num)) {
            sum += num;
            numCount++;
          }
        }
      }
    }
    return {
      sum,
      average: numCount > 0 ? sum / numCount : 0,
      count,
      numCount,
      min: (() => {
        let min = Infinity;
        for (let r = b.r1; r <= b.r2; r++) {
          for (let c = b.c1; c <= b.c2; c++) {
            const n = parseFloat(getCellValue(cellKey(r, c), data));
            if (!isNaN(n) && n < min) min = n;
          }
        }
        return min === Infinity ? 0 : min;
      })(),
      max: (() => {
        let max = -Infinity;
        for (let r = b.r1; r <= b.r2; r++) {
          for (let c = b.c1; c <= b.c2; c++) {
            const n = parseFloat(getCellValue(cellKey(r, c), data));
            if (!isNaN(n) && n > max) max = n;
          }
        }
        return max === -Infinity ? 0 : max;
      })(),
    };
  }, [getSelectionBounds, selectedCell, data]);

  // Selection range label for display (e.g., "A1:C5")
  const selectionLabel = useMemo(() => {
    const b = getSelectionBounds();
    if (!b) return selectedCell || '';
    if (b.r1 === b.r2 && b.c1 === b.c2) return cellKey(b.r1, b.c1);
    return `${cellKey(b.r1, b.c1)}:${cellKey(b.r2, b.c2)}`;
  }, [getSelectionBounds, selectedCell]);

  // --- Clipboard ---
  const handleCopy = () => {
    const b = getSelectionBounds();
    if (!b) return;
    const copied: Record<string, CellData> = {};
    for (let r = b.r1; r <= b.r2; r++) {
      for (let c = b.c1; c <= b.c2; c++) {
        const key = cellKey(r, c);
        if (data[key]) copied[key] = { ...data[key] };
      }
    }
    setClipboard({ data: copied, startRow: b.r1, startCol: b.c1, rows: b.r2 - b.r1 + 1, cols: b.c2 - b.c1 + 1 });
    setClipboardMode('copy');
  };

  const handleCut = () => {
    handleCopy();
    setClipboardMode('cut');
  };

  const handlePaste = () => {
    if (!clipboard || !selectedCell) return;
    pushHistory();
    const ref = parseCellRef(selectedCell);
    if (!ref) return;
    Object.entries(clipboard.data).forEach(([key, cellData]) => {
      const origRef = parseCellRef(key);
      if (!origRef) return;
      const newR = ref[0] + (origRef[0] - clipboard.startRow);
      const newC = ref[1] + (origRef[1] - clipboard.startCol);
      const newKey = cellKey(newR, newC);
      updateSheetData(newKey, { ...cellData });
    });
    if (clipboardMode === 'cut') {
      Object.keys(clipboard.data).forEach(key => {
        updateSheetData(key, { value: '', formula: undefined });
      });
      setClipboard(null);
    }
    scheduleAutoSave();
  };

  // --- Formatting ---
  const toggleFormat = (format: 'bold' | 'italic' | 'underline') => {
    const b = getSelectionBounds();
    if (!b) {
      if (!selectedCell) return;
      pushHistory();
      const cell = data[selectedCell] || { value: '' };
      updateSheetData(selectedCell, { [format]: !cell[format] });
      scheduleAutoSave();
      return;
    }
    pushHistory();
    for (let r = b.r1; r <= b.r2; r++) {
      for (let c = b.c1; c <= b.c2; c++) {
        const key = cellKey(r, c);
        const cell = data[key] || { value: '' };
        updateSheetData(key, { [format]: !cell[format] });
      }
    }
    scheduleAutoSave();
  };

  const setAlignForSelection = (align: 'left' | 'center' | 'right') => {
    pushHistory();
    const b = getSelectionBounds();
    if (!b && selectedCell) {
      updateSheetData(selectedCell, { align });
    } else if (b) {
      for (let r = b.r1; r <= b.r2; r++) {
        for (let c = b.c1; c <= b.c2; c++) {
          updateSheetData(cellKey(r, c), { align });
        }
      }
    }
    scheduleAutoSave();
  };

  const setColorForSelection = (type: 'bgColor' | 'textColor', color: string) => {
    pushHistory();
    const b = getSelectionBounds();
    if (!b && selectedCell) {
      updateSheetData(selectedCell, { [type]: color === 'transparent' ? undefined : color });
    } else if (b) {
      for (let r = b.r1; r <= b.r2; r++) {
        for (let c = b.c1; c <= b.c2; c++) {
          updateSheetData(cellKey(r, c), { [type]: color === 'transparent' ? undefined : color });
        }
      }
    }
    scheduleAutoSave();
  };

  const setFontForSelection = (prop: 'fontSize' | 'fontFamily', value: number | string) => {
    pushHistory();
    const b = getSelectionBounds();
    if (!b && selectedCell) {
      updateSheetData(selectedCell, { [prop]: value });
    } else if (b) {
      for (let r = b.r1; r <= b.r2; r++) {
        for (let c = b.c1; c <= b.c2; c++) {
          updateSheetData(cellKey(r, c), { [prop]: value });
        }
      }
    }
    scheduleAutoSave();
  };

  const setNumberFormat = (fmt: string) => {
    pushHistory();
    const b = getSelectionBounds();
    const apply = (key: string) => updateSheetData(key, { numberFormat: fmt || undefined });
    if (!b && selectedCell) apply(selectedCell);
    else if (b) {
      for (let r = b.r1; r <= b.r2; r++) {
        for (let c = b.c1; c <= b.c2; c++) apply(cellKey(r, c));
      }
    }
    scheduleAutoSave();
  };

  const toggleWrap = () => {
    if (!selectedCell) return;
    pushHistory();
    const cell = data[selectedCell] || { value: '' };
    updateSheetData(selectedCell, { wrap: !cell.wrap });
    scheduleAutoSave();
  };

  // --- Merge cells ---
  const mergeCells = () => {
    const b = getSelectionBounds();
    if (!b || (b.r1 === b.r2 && b.c1 === b.c2)) return;
    pushHistory();
    const parentKey = cellKey(b.r1, b.c1);
    let combined = '';
    for (let r = b.r1; r <= b.r2; r++) {
      for (let c = b.c1; c <= b.c2; c++) {
        const key = cellKey(r, c);
        const val = getCellValue(key, data);
        if (val) combined += (combined ? ' ' : '') + val;
        if (key !== parentKey) {
          updateSheetData(key, { value: '', formula: undefined, mergedParent: parentKey });
        }
      }
    }
    updateSheetData(parentKey, {
      value: combined || data[parentKey]?.value || '',
      merged: { rows: b.r2 - b.r1 + 1, cols: b.c2 - b.c1 + 1 }
    });
    scheduleAutoSave();
  };

  const unmergeCells = () => {
    if (!selectedCell) return;
    const cell = data[selectedCell];
    if (!cell?.merged) return;
    pushHistory();
    const ref = parseCellRef(selectedCell);
    if (!ref) return;
    for (let r = ref[0]; r < ref[0] + cell.merged.rows; r++) {
      for (let c = ref[1]; c < ref[1] + cell.merged.cols; c++) {
        const key = cellKey(r, c);
        updateSheetData(key, { mergedParent: undefined, merged: undefined });
      }
    }
    scheduleAutoSave();
  };

  // --- Freeze panes ---
  const freezeAtSelection = () => {
    if (!selectedCell) return;
    const ref = parseCellRef(selectedCell);
    if (!ref) return;
    updateSheet({ frozenRows: ref[0], frozenCols: ref[1] });
  };

  const unfreezeAll = () => {
    updateSheet({ frozenRows: 0, frozenCols: 0 });
  };

  // --- Row/Col operations ---
  const insertRow = (at: number) => {
    pushHistory();
    const newData: SheetData = {};
    Object.entries(data).forEach(([key, val]) => {
      const ref = parseCellRef(key);
      if (!ref) return;
      if (ref[0] >= at) {
        newData[cellKey(ref[0] + 1, ref[1])] = val;
      } else {
        newData[key] = val;
      }
    });
    setSheets(prev => prev.map((s, i) => i === activeSheetIdx ? { ...s, data: newData, numRows: s.numRows + 1 } : s));
    scheduleAutoSave();
  };

  const deleteRow = (at: number) => {
    pushHistory();
    const newData: SheetData = {};
    Object.entries(data).forEach(([key, val]) => {
      const ref = parseCellRef(key);
      if (!ref) return;
      if (ref[0] === at) return;
      if (ref[0] > at) {
        newData[cellKey(ref[0] - 1, ref[1])] = val;
      } else {
        newData[key] = val;
      }
    });
    setSheets(prev => prev.map((s, i) => i === activeSheetIdx ? { ...s, data: newData, numRows: Math.max(1, s.numRows - 1) } : s));
    scheduleAutoSave();
  };

  const insertCol = (at: number) => {
    pushHistory();
    const newData: SheetData = {};
    Object.entries(data).forEach(([key, val]) => {
      const ref = parseCellRef(key);
      if (!ref) return;
      if (ref[1] >= at) {
        newData[cellKey(ref[0], ref[1] + 1)] = val;
      } else {
        newData[key] = val;
      }
    });
    setSheets(prev => prev.map((s, i) => i === activeSheetIdx ? { ...s, data: newData, numCols: s.numCols + 1 } : s));
    scheduleAutoSave();
  };

  const deleteCol = (at: number) => {
    pushHistory();
    const newData: SheetData = {};
    Object.entries(data).forEach(([key, val]) => {
      const ref = parseCellRef(key);
      if (!ref) return;
      if (ref[1] === at) return;
      if (ref[1] > at) {
        newData[cellKey(ref[0], ref[1] - 1)] = val;
      } else {
        newData[key] = val;
      }
    });
    setSheets(prev => prev.map((s, i) => i === activeSheetIdx ? { ...s, data: newData, numCols: Math.max(1, s.numCols - 1) } : s));
    scheduleAutoSave();
  };

  // --- Sort ---
  const sortColumn = (col: number, asc: boolean) => {
    pushHistory();
    const rows: { row: number; val: string }[] = [];
    for (let r = 0; r < sheet.numRows; r++) {
      rows.push({ row: r, val: getCellValue(cellKey(r, col), data) });
    }
    rows.sort((a, b) => {
      const na = parseFloat(a.val), nb = parseFloat(b.val);
      if (!isNaN(na) && !isNaN(nb)) return asc ? na - nb : nb - na;
      return asc ? a.val.localeCompare(b.val) : b.val.localeCompare(a.val);
    });
    const newData: SheetData = {};
    rows.forEach((item, newRow) => {
      for (let c = 0; c < sheet.numCols; c++) {
        const oldKey = cellKey(item.row, c);
        const newKey = cellKey(newRow, c);
        if (data[oldKey]) newData[newKey] = { ...data[oldKey] };
      }
    });
    setSheets(prev => prev.map((s, i) => i === activeSheetIdx ? { ...s, data: newData } : s));
    scheduleAutoSave();
  };

  // --- Find & Replace ---
  const findAndReplace = (findAll: boolean = false) => {
    if (!searchTerm) return;
    pushHistory();
    let count = 0;
    const newData = { ...data };
    Object.entries(newData).forEach(([key, cell]) => {
      if (!cell) return;
      const val = cell.value || '';
      if (val.includes(searchTerm)) {
        if (findAll || (selectedCell === key)) {
          newData[key] = { ...cell, value: val.split(searchTerm).join(replaceText) };
          count++;
        }
      }
    });
    if (count > 0) {
      setSheets(prev => prev.map((s, i) => i === activeSheetIdx ? { ...s, data: newData } : s));
      toast.success(`${count} remplacement(s) effectué(s)`);
      scheduleAutoSave();
    } else {
      toast.info('Aucune correspondance trouvée');
    }
  };

  // --- Strikethrough ---
  const toggleStrikethrough = () => {
    const b = getSelectionBounds();
    if (!b && selectedCell) {
      pushHistory();
      const cell = data[selectedCell] || { value: '' };
      updateSheetData(selectedCell, { strikethrough: !cell.strikethrough });
      scheduleAutoSave();
      return;
    }
    if (b) {
      pushHistory();
      for (let r = b.r1; r <= b.r2; r++) {
        for (let c = b.c1; c <= b.c2; c++) {
          const key = cellKey(r, c);
          const cell = data[key] || { value: '' };
          updateSheetData(key, { strikethrough: !cell.strikethrough });
        }
      }
      scheduleAutoSave();
    }
  };

  // --- Clear formatting ---
  const clearFormatting = () => {
    const b = getSelectionBounds();
    pushHistory();
    const clear = (key: string) => {
      updateSheetData(key, {
        bold: undefined, italic: undefined, underline: undefined, strikethrough: undefined,
        bgColor: undefined, textColor: undefined, fontSize: undefined, fontFamily: undefined,
        numberFormat: undefined, border: undefined, indent: undefined, rotation: undefined,
        verticalAlign: undefined, wrap: undefined, conditionalFormats: undefined,
      });
    };
    if (b) {
      for (let r = b.r1; r <= b.r2; r++) for (let c = b.c1; c <= b.c2; c++) clear(cellKey(r, c));
    } else if (selectedCell) clear(selectedCell);
    scheduleAutoSave();
    toast.success('Mise en forme effacée');
  };

  // --- Checkbox toggle ---
  const toggleCheckbox = () => {
    if (!selectedCell) return;
    pushHistory();
    const cell = data[selectedCell];
    const currentVal = cell?.value?.toLowerCase();
    updateSheetData(selectedCell, { value: currentVal === 'true' || currentVal === '☑' ? '☐' : '☑' });
    scheduleAutoSave();
  };

  const insertCheckbox = () => {
    const b = getSelectionBounds();
    pushHistory();
    const insert = (key: string) => updateSheetData(key, { value: '☐' });
    if (b) {
      for (let r = b.r1; r <= b.r2; r++) for (let c = b.c1; c <= b.c2; c++) insert(cellKey(r, c));
    } else if (selectedCell) insert(selectedCell);
    scheduleAutoSave();
  };

  // --- Print ---
  const handlePrint = () => {
    window.print();
  };

  // --- Fullscreen ---
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // --- Column statistics ---
  const showColumnStats = () => {
    if (!selectedCell) return;
    const ref = parseCellRef(selectedCell);
    if (!ref) return;
    const col = ref[1];
    const nums: number[] = [];
    let count = 0;
    for (let r = 0; r < sheet.numRows; r++) {
      const val = getCellValue(cellKey(r, col), data);
      if (val.trim()) {
        count++;
        const n = parseFloat(val);
        if (!isNaN(n)) nums.push(n);
      }
    }
    if (nums.length === 0) {
      toast.info(`Colonne ${colLetter(col)} : ${count} valeurs (aucune numérique)`);
      return;
    }
    const sum = nums.reduce((a, b) => a + b, 0);
    const avg = sum / nums.length;
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    toast.info(
      `Colonne ${colLetter(col)} : ${count} valeurs, ${nums.length} nombres\nSomme: ${sum.toLocaleString('fr-FR')}, Moy: ${avg.toFixed(2)}, Min: ${min}, Max: ${max}`,
      { duration: 6000 }
    );
  };

  // --- Borders ---
  const setBordersForSelection = (borderStyle: 'all' | 'outer' | 'none' | 'top' | 'bottom' | 'left' | 'right') => {
    const b = getSelectionBounds();
    if (!b && selectedCell) {
      pushHistory();
      const bdr = borderStyle === 'none' ? {} : borderStyle === 'all'
        ? { top: '1px solid #9ca3af', right: '1px solid #9ca3af', bottom: '1px solid #9ca3af', left: '1px solid #9ca3af' }
        : { [borderStyle]: '1px solid #9ca3af' };
      updateSheetData(selectedCell, { border: bdr as any });
      scheduleAutoSave();
      return;
    }
    if (!b) return;
    pushHistory();
    for (let r = b.r1; r <= b.r2; r++) {
      for (let c = b.c1; c <= b.c2; c++) {
        const key = cellKey(r, c);
        let bdr: any = {};
        if (borderStyle === 'none') {
          bdr = {};
        } else if (borderStyle === 'all') {
          bdr = { top: '1px solid #9ca3af', right: '1px solid #9ca3af', bottom: '1px solid #9ca3af', left: '1px solid #9ca3af' };
        } else if (borderStyle === 'outer') {
          bdr = {};
          if (r === b.r1) bdr.top = '2px solid #374151';
          if (r === b.r2) bdr.bottom = '2px solid #374151';
          if (c === b.c1) bdr.left = '2px solid #374151';
          if (c === b.c2) bdr.right = '2px solid #374151';
        } else {
          bdr = { [borderStyle]: '1px solid #9ca3af' };
        }
        updateSheetData(key, { border: bdr });
      }
    }
    scheduleAutoSave();
  };

  // --- Comments ---
  const addComment = (key: string, comment: string) => {
    pushHistory();
    updateSheetData(key, { comment: comment || undefined });
    setCommentCell(null);
    setCommentText('');
    scheduleAutoSave();
  };

  // --- Conditional formatting ---
  const applyConditionalFormat = () => {
    const b = getSelectionBounds();
    if (!b && !selectedCell) return;
    pushHistory();
    const rule: ConditionalFormatRule = {
      id: crypto.randomUUID(),
      type: cfType,
      value: cfValue,
      value2: cfValue2,
      bgColor: cfBgColor,
      textColor: cfTextColor,
    };
    const applyTo = (key: string) => {
      const cell = data[key] || { value: '' };
      const existing = cell.conditionalFormats || [];
      updateSheetData(key, { conditionalFormats: [...existing, rule] });
    };
    if (b) {
      for (let r = b.r1; r <= b.r2; r++) {
        for (let c = b.c1; c <= b.c2; c++) applyTo(cellKey(r, c));
      }
    } else if (selectedCell) {
      applyTo(selectedCell);
    }
    setShowConditionalFormat(false);
    scheduleAutoSave();
    toast.success('Mise en forme conditionnelle appliquée');
  };

  const clearConditionalFormats = () => {
    const b = getSelectionBounds();
    if (!b && selectedCell) {
      pushHistory();
      updateSheetData(selectedCell, { conditionalFormats: undefined });
      scheduleAutoSave();
      return;
    }
    if (b) {
      pushHistory();
      for (let r = b.r1; r <= b.r2; r++) {
        for (let c = b.c1; c <= b.c2; c++) updateSheetData(cellKey(r, c), { conditionalFormats: undefined });
      }
      scheduleAutoSave();
    }
  };

  // --- Data validation ---
  const applyDataValidation = () => {
    const b = getSelectionBounds();
    if (!b && !selectedCell) return;
    pushHistory();
    const validation: DataValidation = {
      type: dvType,
      values: dvType === 'list' ? dvValues.split(',').map(v => v.trim()) : undefined,
      min: dvType === 'number' && dvMin ? parseFloat(dvMin) : undefined,
      max: dvType === 'number' && dvMax ? parseFloat(dvMax) : undefined,
      allowBlank: true,
    };
    const applyTo = (key: string) => updateSheetData(key, { validation });
    if (b) {
      for (let r = b.r1; r <= b.r2; r++) {
        for (let c = b.c1; c <= b.c2; c++) applyTo(cellKey(r, c));
      }
    } else if (selectedCell) applyTo(selectedCell);
    setShowDataValidation(false);
    scheduleAutoSave();
    toast.success('Validation de données appliquée');
  };

  const clearDataValidation = () => {
    const b = getSelectionBounds();
    if (!b && selectedCell) { pushHistory(); updateSheetData(selectedCell, { validation: undefined }); scheduleAutoSave(); return; }
    if (b) {
      pushHistory();
      for (let r = b.r1; r <= b.r2; r++) for (let c = b.c1; c <= b.c2; c++) updateSheetData(cellKey(r, c), { validation: undefined });
      scheduleAutoSave();
    }
  };

  // --- Column filters ---
  const toggleFilter = (col: number) => {
    setShowFilterDropdown(showFilterDropdown === col ? null : col);
  };

  const applyFilter = (col: number, filterValue: string) => {
    if (filterValue === '') {
      setActiveFilters(prev => { const n = { ...prev }; delete n[col]; return n; });
    } else {
      setActiveFilters(prev => ({ ...prev, [col]: filterValue }));
    }
    setShowFilterDropdown(null);
  };

  const getColumnUniqueValues = (col: number): string[] => {
    const values = new Set<string>();
    for (let r = 1; r < sheet.numRows; r++) {
      const val = getCellValue(cellKey(r, col), data);
      if (val.trim()) values.add(val);
    }
    return Array.from(values).sort();
  };

  const isRowFiltered = (row: number): boolean => {
    if (Object.keys(activeFilters).length === 0) return false;
    if (row === 0) return false;
    for (const [col, filterValue] of Object.entries(activeFilters)) {
      const cellVal = getCellValue(cellKey(row, parseInt(col)), data);
      if (cellVal !== filterValue) return true;
    }
    return false;
  };

  // --- Auto-fill ---
  const handleAutoFillStart = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAutoFillStart(key);
    setAutoFillEnd(key);
    setIsAutoFilling(true);
  };

  const handleAutoFillMove = (key: string) => {
    if (isAutoFilling) setAutoFillEnd(key);
  };

  const handleAutoFillEnd = () => {
    if (!autoFillStart || !autoFillEnd || autoFillStart === autoFillEnd) {
      setIsAutoFilling(false);
      return;
    }
    const startRef = parseCellRef(autoFillStart);
    const endRef = parseCellRef(autoFillEnd);
    if (!startRef || !endRef) { setIsAutoFilling(false); return; }

    pushHistory();
    const srcCell = data[autoFillStart] || { value: '' };
    const srcVal = getCellValue(autoFillStart, data);
    const srcNum = parseFloat(srcVal);

    const isNumber = !isNaN(srcNum);
    for (let r = startRef[0] + 1; r <= endRef[0]; r++) {
      const key = cellKey(r, startRef[1]);
      if (isNumber) {
        updateSheetData(key, { ...srcCell, value: (srcNum + (r - startRef[0])).toString(), formula: undefined });
      } else {
        updateSheetData(key, { ...srcCell });
      }
    }
    for (let c = startRef[1] + 1; c <= endRef[1]; c++) {
      const key = cellKey(startRef[0], c);
      if (isNumber) {
        updateSheetData(key, { ...srcCell, value: (srcNum + (c - startRef[1])).toString(), formula: undefined });
      } else {
        updateSheetData(key, { ...srcCell });
      }
    }
    setAutoFillStart(null);
    setAutoFillEnd(null);
    setIsAutoFilling(false);
    scheduleAutoSave();
  };

  // --- Vertical align ---
  const setVerticalAlignForSelection = (align: 'top' | 'middle' | 'bottom') => {
    pushHistory();
    const b = getSelectionBounds();
    if (!b && selectedCell) updateSheetData(selectedCell, { verticalAlign: align });
    else if (b) {
      for (let r = b.r1; r <= b.r2; r++) for (let c = b.c1; c <= b.c2; c++) updateSheetData(cellKey(r, c), { verticalAlign: align });
    }
    scheduleAutoSave();
  };

  // --- Indent ---
  const changeIndent = (delta: number) => {
    if (!selectedCell) return;
    pushHistory();
    const cell = data[selectedCell] || { value: '' };
    updateSheetData(selectedCell, { indent: Math.max(0, (cell.indent || 0) + delta) });
    scheduleAutoSave();
  };

  // --- Select column/row ---
  const handleSelectColumn = (col: number) => {
    setSelectionStart(cellKey(0, col));
    setSelectionEnd(cellKey(sheet.numRows - 1, col));
    setSelectedCell(cellKey(0, col));
    setFormulaBarValue('');
    setEditingCell(null);
  };

  const handleSelectRow = (row: number) => {
    setSelectionStart(cellKey(row, 0));
    setSelectionEnd(cellKey(row, sheet.numCols - 1));
    setSelectedCell(cellKey(row, 0));
    setFormulaBarValue('');
    setEditingCell(null);
  };

  const handleSelectAll = () => {
    setSelectionStart(cellKey(0, 0));
    setSelectionEnd(cellKey(sheet.numRows - 1, sheet.numCols - 1));
    setSelectedCell('A1');
  };

  // --- Charts ---
  const createChart = () => {
    const b = getSelectionBounds();
    const newChart: ChartConfig = {
      id: crypto.randomUUID(),
      type: 'bar',
      title: 'Graphique ' + (charts.length + 1),
      dataRange: b ? `${cellKey(b.r1, b.c1)}:${cellKey(b.r2, b.c2)}` : 'A1:A10',
      labelsRange: '',
      colors: [],
    };
    setCharts(prev => [...prev, newChart]);
    setShowChartPanel(true);
    scheduleAutoSave();
  };

  const getChartData = (config: ChartConfig) => {
    const rm = config.dataRange.match(/^([A-Z]+\d+):([A-Z]+\d+)$/);
    if (!rm) return [];
    const start = parseCellRef(rm[1]); const end = parseCellRef(rm[2]);
    if (!start || !end) return [];
    const chartData: { label: string; value: number; value2?: number }[] = [];
    const hasTwoCols = end[1] > start[1];
    for (let r = start[0]; r <= end[0]; r++) {
      const label = getCellValue(cellKey(r, start[1]), data) || `Row ${r + 1}`;
      const value = parseFloat(getCellValue(cellKey(r, hasTwoCols ? start[1] + 1 : start[1]), data)) || 0;
      const entry: any = { label, value };
      if (end[1] >= start[1] + 2) {
        entry.value2 = parseFloat(getCellValue(cellKey(r, start[1] + 2), data)) || 0;
      }
      chartData.push(entry);
    }
    return chartData;
  };

  // --- Sheets tab ---
  const addSheet = () => {
    const newSheet = createEmptySheet(`Feuille ${sheets.length + 1}`);
    setSheets(prev => [...prev, newSheet]);
    setActiveSheetIdx(sheets.length);
  };

  const renameSheet = (idx: number, name: string) => {
    setSheets(prev => prev.map((s, i) => i === idx ? { ...s, name } : s));
  };

  const deleteSheet = (idx: number) => {
    if (sheets.length <= 1) return;
    setSheets(prev => prev.filter((_, i) => i !== idx));
    if (activeSheetIdx >= idx && activeSheetIdx > 0) setActiveSheetIdx(prev => prev - 1);
  };

  // --- Export ---
  const exportCSV = () => {
    const rows: string[][] = [];
    for (let r = 0; r < sheet.numRows; r++) {
      const row: string[] = [];
      for (let c = 0; c < sheet.numCols; c++) {
        row.push(getCellValue(cellKey(r, c), data));
      }
      rows.push(row);
    }
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${title}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportXlsx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportingFile(true);
    try {
      const result = await fileImportService.importXlsx(file);
      const importedSheets = result.sheets.map(s => ({
        ...s,
        hiddenRows: new Set<number>(s.hiddenRows || []),
        hiddenCols: new Set<number>(s.hiddenCols || []),
      }));
      setSheets(importedSheets);
      setActiveSheetIdx(0);
      scheduleAutoSave();
      toast.success(`"${file.name}" importé avec succès`);
    } catch (err: any) {
      toast.error(`Erreur d'import: ${err?.message || 'Erreur'}`);
    } finally {
      setImportingFile(false);
      if (importFileRef.current) importFileRef.current.value = '';
    }
  };

  // --- Format display value ---
  const formatDisplayValue = (value: string, format?: string) => {
    if (!format || !value) return value;
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    if (format.includes('€')) return num.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
    if (format.includes('$')) return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    if (format.includes('%')) return (num * 100).toFixed(format.includes('.00') ? 2 : 0) + '%';
    if (format === '#,##0') return Math.round(num).toLocaleString('fr-FR');
    if (format === '#,##0.00') return num.toLocaleString('fr-FR', { minimumFractionDigits: 2 });
    if (format.includes('E')) return num.toExponential(2);
    return value;
  };

  // --- Column resize ---
  const handleColResizeStart = (col: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingCol(col);
    setResizeStartX(e.clientX);
    setResizeStartWidth(sheet.colWidths[col] || DEFAULT_COL_WIDTH);
  };

  useEffect(() => {
    if (resizingCol === null) return;
    const onMove = (e: MouseEvent) => {
      const diff = e.clientX - resizeStartX;
      const newWidth = Math.max(MIN_COL_WIDTH, resizeStartWidth + diff);
      updateSheet({ colWidths: { ...sheet.colWidths, [resizingCol]: newWidth } });
    };
    const onUp = () => setResizingCol(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [resizingCol, resizeStartX, resizeStartWidth]);

  // --- Row resize ---
  const handleRowResizeStart = (row: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingRow(row);
    setResizeStartY(e.clientY);
    setResizeStartHeight(sheet.rowHeights[row] || DEFAULT_ROW_HEIGHT);
  };

  useEffect(() => {
    if (resizingRow === null) return;
    const onMove = (e: MouseEvent) => {
      const diff = e.clientY - resizeStartY;
      const newHeight = Math.max(MIN_ROW_HEIGHT, resizeStartHeight + diff);
      updateSheet({ rowHeights: { ...sheet.rowHeights, [resizingRow]: newHeight } });
    };
    const onUp = () => setResizingRow(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [resizingRow, resizeStartY, resizeStartHeight]);

  // --- Context menu ---
  const handleContextMenu = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, row, col });
  };

  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  // --- Mouse selection ---
  const handleMouseDown = (key: string, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (isAutoFilling) return;

    if (e.shiftKey) {
      // Extend selection
      setSelectionEnd(key);
      return;
    }

    setIsSelecting(true);
    setSelectionStart(key);
    setSelectionEnd(key);
    setSelectedCell(key);
    const cell = data[key];
    setFormulaBarValue(cell?.formula || cell?.value || '');
  };

  const handleMouseEnter = (key: string) => {
    if (isSelecting && !isAutoFilling) setSelectionEnd(key);
    if (isAutoFilling) handleAutoFillMove(key);
  };

  useEffect(() => {
    const onUp = () => {
      if (isAutoFilling) handleAutoFillEnd();
      setIsSelecting(false);
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [isAutoFilling, autoFillStart, autoFillEnd]);

  const selectedCellData = selectedCell ? data[selectedCell] : null;

  // --- Edge detection for selection rectangle ---
  const getSelectionEdge = (row: number, col: number) => {
    const b = getSelectionBounds();
    if (!b) return { isTop: false, isBottom: false, isLeft: false, isRight: false };
    if (!(row >= b.r1 && row <= b.r2 && col >= b.c1 && col <= b.c2)) {
      return { isTop: false, isBottom: false, isLeft: false, isRight: false };
    }
    return {
      isTop: row === b.r1,
      isBottom: row === b.r2,
      isLeft: col === b.c1,
      isRight: col === b.c2,
    };
  };

  // Is column header in selection
  const isColInSelection = (col: number) => {
    const b = getSelectionBounds();
    if (!b) {
      if (!selectedCell) return false;
      const ref = parseCellRef(selectedCell);
      return ref ? ref[1] === col : false;
    }
    return col >= b.c1 && col <= b.c2;
  };

  // Is row header in selection
  const isRowInSelection = (row: number) => {
    const b = getSelectionBounds();
    if (!b) {
      if (!selectedCell) return false;
      const ref = parseCellRef(selectedCell);
      return ref ? ref[0] === row : false;
    }
    return row >= b.r1 && row <= b.r2;
  };

  // --- Render ---
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background select-none" onClick={() => setContextMenu(null)}>
      <input ref={importFileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportXlsx} />
      
      {/* Top bar - Excel green theme */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b" style={{ backgroundColor: '#217346' }}>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-white hover:bg-white/20">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1">
          <FileSpreadsheet className="h-4 w-4 text-white" />
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="max-w-[200px] border-none shadow-none text-sm font-semibold focus-visible:ring-0 px-1 h-8 bg-transparent text-white placeholder:text-white/60"
            placeholder="Titre"
          />
        </div>
        <div className="flex-1" />
        {isOwner && (
          <Button size="sm" variant="ghost" onClick={() => setShowShareModal(true)} className="gap-1 h-7 text-xs text-white hover:bg-white/20">
            <Share2 className="h-3 w-3" /> Partager
          </Button>
        )}
        {doc.is_shared && (
          <Badge variant="secondary" className="gap-1 text-xs h-6 bg-white/20 text-white border-0">
            <Users className="h-3 w-3" /> Partagé
          </Badge>
        )}
        <span className="text-xs text-white/70 hidden sm:block">
          {saving ? 'Sauvegarde...' : '✓ Auto'}
        </span>
        <Button size="sm" variant="ghost" onClick={() => importFileRef.current?.click()} disabled={importingFile} className="gap-1 h-7 text-xs text-white hover:bg-white/20">
          <Upload className="h-3 w-3" /> {importingFile ? 'Import...' : 'Importer'}
        </Button>
        <Button size="sm" variant="ghost" onClick={exportCSV} className="gap-1 h-7 text-xs text-white hover:bg-white/20">
          <Download className="h-3 w-3" /> CSV
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1 h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0">
          <Save className="h-3 w-3" /> Sauver
        </Button>
      </div>

      {/* Google Sheets-style Menu Bar */}
      <div className="flex items-center gap-0 px-1 border-b bg-card/95 flex-shrink-0" style={{ height: 28 }}>
        {/* Fichier */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="px-2.5 py-1 text-xs rounded hover:bg-muted transition-colors">Fichier</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[220px]">
            <DropdownMenuItem onClick={addSheet}><Plus className="h-3.5 w-3.5 mr-2" /> Nouvelle feuille</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => importFileRef.current?.click()}>
              <Upload className="h-3.5 w-3.5 mr-2" /> Importer
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><Download className="h-3.5 w-3.5 mr-2" /> Télécharger</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={exportCSV}>Fichier CSV (.csv)</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            {isOwner && (
              <DropdownMenuItem onClick={() => setShowShareModal(true)}>
                <Share2 className="h-3.5 w-3.5 mr-2" /> Partager
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              const nameEl = window.prompt('Renommer le classeur :', title);
              if (nameEl) setTitle(nameEl);
            }}>
              <Type className="h-3.5 w-3.5 mr-2" /> Renommer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5 mr-2" /> Imprimer
              <span className="ml-auto text-muted-foreground text-[10px]">Ctrl+P</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Édition */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="px-2.5 py-1 text-xs rounded hover:bg-muted transition-colors">Édition</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[220px]">
            <DropdownMenuItem onClick={undo}>
              <Undo2 className="h-3.5 w-3.5 mr-2" /> Annuler
              <span className="ml-auto text-muted-foreground text-[10px]">Ctrl+Z</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={redo}>
              <Redo2 className="h-3.5 w-3.5 mr-2" /> Rétablir
              <span className="ml-auto text-muted-foreground text-[10px]">Ctrl+Y</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCut}>
              <Scissors className="h-3.5 w-3.5 mr-2" /> Couper
              <span className="ml-auto text-muted-foreground text-[10px]">Ctrl+X</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopy}>
              <Copy className="h-3.5 w-3.5 mr-2" /> Copier
              <span className="ml-auto text-muted-foreground text-[10px]">Ctrl+C</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePaste}>
              <Clipboard className="h-3.5 w-3.5 mr-2" /> Coller
              <span className="ml-auto text-muted-foreground text-[10px]">Ctrl+V</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setShowSearch(true); setShowFindReplace(false); }}>
              <Search className="h-3.5 w-3.5 mr-2" /> Rechercher
              <span className="ml-auto text-muted-foreground text-[10px]">Ctrl+F</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setShowSearch(true); setShowFindReplace(true); }}>
              <Replace className="h-3.5 w-3.5 mr-2" /> Rechercher et remplacer
              <span className="ml-auto text-muted-foreground text-[10px]">Ctrl+H</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSelectAll}>
              <Grid3X3 className="h-3.5 w-3.5 mr-2" /> Tout sélectionner
              <span className="ml-auto text-muted-foreground text-[10px]">Ctrl+A</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              if (selectedCell) {
                pushHistory();
                updateSheetData(selectedCell, { value: '', formula: undefined });
                scheduleAutoSave();
              }
            }}>
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Supprimer le contenu
              <span className="ml-auto text-muted-foreground text-[10px]">Suppr</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Affichage */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="px-2.5 py-1 text-xs rounded hover:bg-muted transition-colors">Affichage</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[220px]">
            <DropdownMenuItem onClick={() => setShowGridLines(!showGridLines)}>
              {showGridLines ? <Eye className="h-3.5 w-3.5 mr-2" /> : <EyeOff className="h-3.5 w-3.5 mr-2" />}
              {showGridLines ? 'Masquer la grille' : 'Afficher la grille'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><Lock className="h-3.5 w-3.5 mr-2" /> Figer</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={freezeAtSelection}>Figer jusqu'à la cellule sélectionnée</DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateSheet({ frozenRows: 1, frozenCols: 0 })}>Figer 1 ligne</DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateSheet({ frozenRows: 2, frozenCols: 0 })}>Figer 2 lignes</DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateSheet({ frozenRows: 0, frozenCols: 1 })}>Figer 1 colonne</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={unfreezeAll}><Unlock className="h-3.5 w-3.5 mr-2" /> Défiger tout</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><ZoomIn className="h-3.5 w-3.5 mr-2" /> Zoom ({zoomLevel}%)</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {[50, 75, 90, 100, 110, 125, 150, 200].map(z => (
                  <DropdownMenuItem key={z} onClick={() => setZoomLevel(z)}>
                    {z}% {z === zoomLevel && '✓'}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5 mr-2" /> : <Maximize2 className="h-3.5 w-3.5 mr-2" />}
              {isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowFormulaHelper(!showFormulaHelper)}>
              <FunctionSquare className="h-3.5 w-3.5 mr-2" /> {showFormulaHelper ? 'Masquer' : 'Afficher'} l'aide formules
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Insertion */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="px-2.5 py-1 text-xs rounded hover:bg-muted transition-colors">Insertion</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[250px]">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><Rows className="h-3.5 w-3.5 mr-2" /> Lignes</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => { const ref = parseCellRef(selectedCell || 'A1'); if (ref) insertRow(ref[0]); }}>
                  Insérer une ligne au-dessus
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { const ref = parseCellRef(selectedCell || 'A1'); if (ref) insertRow(ref[0] + 1); }}>
                  Insérer une ligne en-dessous
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><Columns className="h-3.5 w-3.5 mr-2" /> Colonnes</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => { const ref = parseCellRef(selectedCell || 'A1'); if (ref) insertCol(ref[1]); }}>
                  Insérer une colonne à gauche
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { const ref = parseCellRef(selectedCell || 'A1'); if (ref) insertCol(ref[1] + 1); }}>
                  Insérer une colonne à droite
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem onClick={addSheet}><Plus className="h-3.5 w-3.5 mr-2" /> Feuille</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={createChart}><BarChart3 className="h-3.5 w-3.5 mr-2" /> Graphique</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><FunctionSquare className="h-3.5 w-3.5 mr-2" /> Fonction</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto">
                {Object.entries(FORMULA_CATEGORIES).map(([cat, formulas]) => (
                  <DropdownMenuSub key={cat}>
                    <DropdownMenuSubTrigger className="text-xs">{cat}</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="max-h-[250px] overflow-y-auto">
                      {formulas.map(f => (
                        <DropdownMenuItem key={f} onClick={() => {
                          if (selectedCell) {
                            setEditingCell(selectedCell);
                            const val = `=${f}(`;
                            setEditValue(val);
                            setFormulaBarValue(val);
                            updateSheetData(selectedCell, { formula: val, value: '' });
                          }
                        }} className="text-xs font-mono">{f}</DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={insertCheckbox}><CheckSquare className="h-3.5 w-3.5 mr-2" /> Case à cocher</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowDataValidation(true)}><List className="h-3.5 w-3.5 mr-2" /> Liste déroulante</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              if (selectedCell) { setCommentCell(selectedCell); setCommentText(data[selectedCell]?.comment || ''); }
            }}>
              <MessageSquare className="h-3.5 w-3.5 mr-2" /> Commentaire
              <span className="ml-auto text-muted-foreground text-[10px]">Ctrl+Alt+M</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Format */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="px-2.5 py-1 text-xs rounded hover:bg-muted transition-colors">Format</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[250px]">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><Hash className="h-3.5 w-3.5 mr-2" /> Nombre</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {NUMBER_FORMATS.map(f => (
                  <DropdownMenuItem key={f.value || 'none'} onClick={() => setNumberFormat(f.value)}>
                    {f.label} {selectedCellData?.numberFormat === f.value && '✓'}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><Bold className="h-3.5 w-3.5 mr-2" /> Texte</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => toggleFormat('bold')}>
                  <Bold className="h-3.5 w-3.5 mr-2" /> Gras
                  <span className="ml-auto text-muted-foreground text-[10px]">Ctrl+B</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleFormat('italic')}>
                  <Italic className="h-3.5 w-3.5 mr-2" /> Italique
                  <span className="ml-auto text-muted-foreground text-[10px]">Ctrl+I</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleFormat('underline')}>
                  <Underline className="h-3.5 w-3.5 mr-2" /> Souligné
                  <span className="ml-auto text-muted-foreground text-[10px]">Ctrl+U</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleStrikethrough}>
                  <Strikethrough className="h-3.5 w-3.5 mr-2" /> Barré
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><AlignLeft className="h-3.5 w-3.5 mr-2" /> Alignement</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setAlignForSelection('left')}><AlignLeft className="h-3.5 w-3.5 mr-2" /> Gauche</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAlignForSelection('center')}><AlignCenter className="h-3.5 w-3.5 mr-2" /> Centré</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAlignForSelection('right')}><AlignRight className="h-3.5 w-3.5 mr-2" /> Droite</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setVerticalAlignForSelection('top')}><AlignVerticalJustifyStart className="h-3.5 w-3.5 mr-2" /> Haut</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setVerticalAlignForSelection('middle')}><AlignVerticalJustifyCenter className="h-3.5 w-3.5 mr-2" /> Milieu</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setVerticalAlignForSelection('bottom')}><AlignVerticalJustifyEnd className="h-3.5 w-3.5 mr-2" /> Bas</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem onClick={toggleWrap}>
              <WrapText className="h-3.5 w-3.5 mr-2" /> Retour automatique à la ligne
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><Type className="h-3.5 w-3.5 mr-2" /> Taille de la police</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-[250px] overflow-y-auto">
                {FONT_SIZES.map(s => (
                  <DropdownMenuItem key={s} onClick={() => setFontForSelection('fontSize', s)}>
                    {s} {selectedCellData?.fontSize === s && '✓'}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><Merge className="h-3.5 w-3.5 mr-2" /> Fusionner les cellules</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={mergeCells}><Merge className="h-3.5 w-3.5 mr-2" /> Fusionner</DropdownMenuItem>
                <DropdownMenuItem onClick={unmergeCells}><SplitSquareHorizontal className="h-3.5 w-3.5 mr-2" /> Défusionner</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowConditionalFormat(true)}>
              <Palette className="h-3.5 w-3.5 mr-2" /> Mise en forme conditionnelle
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={clearFormatting}>
              <Eraser className="h-3.5 w-3.5 mr-2" /> Effacer la mise en forme
              <span className="ml-auto text-muted-foreground text-[10px]">Ctrl+\</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Données */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="px-2.5 py-1 text-xs rounded hover:bg-muted transition-colors">Données</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[250px]">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><SortAsc className="h-3.5 w-3.5 mr-2" /> Trier une feuille</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => {
                  const ref = parseCellRef(selectedCell || 'A1');
                  if (ref) sortColumn(ref[1], true);
                }}>
                  <SortAsc className="h-3.5 w-3.5 mr-2" /> Trier A → Z
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const ref = parseCellRef(selectedCell || 'A1');
                  if (ref) sortColumn(ref[1], false);
                }}>
                  <SortDesc className="h-3.5 w-3.5 mr-2" /> Trier Z → A
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              if (Object.keys(activeFilters).length > 0) {
                setActiveFilters({});
                toast.success('Filtres supprimés');
              } else {
                toast.info('Cliquez sur les en-têtes de colonnes pour filtrer');
              }
            }}>
              <Filter className="h-3.5 w-3.5 mr-2" /> {Object.keys(activeFilters).length > 0 ? 'Supprimer les filtres' : 'Créer un filtre'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowDataValidation(true)}>
              <List className="h-3.5 w-3.5 mr-2" /> Validation des données
            </DropdownMenuItem>
            <DropdownMenuItem onClick={showColumnStats}>
              <BarChart className="h-3.5 w-3.5 mr-2" /> Statistiques de colonne
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Outils */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="px-2.5 py-1 text-xs rounded hover:bg-muted transition-colors">Outils</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[200px]">
            <DropdownMenuItem onClick={() => updateSheet({ numRows: sheet.numRows + 20 })}>
              <Plus className="h-3.5 w-3.5 mr-2" /> Ajouter 20 lignes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateSheet({ numCols: Math.min(sheet.numCols + 5, 52) })}>
              <Plus className="h-3.5 w-3.5 mr-2" /> Ajouter 5 colonnes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowFormulaHelper(!showFormulaHelper)}>
              <FunctionSquare className="h-3.5 w-3.5 mr-2" /> Aide formules ({FORMULA_LIST.length})
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Aide */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="px-2.5 py-1 text-xs rounded hover:bg-muted transition-colors">Aide</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[200px]">
            <DropdownMenuItem onClick={() => setShowFormulaHelper(true)}>
              <HelpCircle className="h-3.5 w-3.5 mr-2" /> Liste des formules ({FORMULA_LIST.length})
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toast.info('Raccourcis clavier :\n• Ctrl+B: Gras\n• Ctrl+I: Italique\n• Ctrl+U: Souligné\n• Ctrl+Z: Annuler\n• Ctrl+Y: Rétablir\n• Ctrl+F: Rechercher\n• Ctrl+A: Tout sélectionner\n• F2: Modifier la cellule\n• Tab: Cellule suivante\n• Suppr: Effacer', { duration: 8000 })}>
              <Settings className="h-3.5 w-3.5 mr-2" /> Raccourcis clavier
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1" />
        
        {/* Zoom control in menu bar */}
        <div className="flex items-center gap-1 mr-2">
          <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} className="p-1 rounded hover:bg-muted">
            <ZoomOut className="h-3 w-3 text-muted-foreground" />
          </button>
          <span className="text-[10px] text-muted-foreground w-8 text-center">{zoomLevel}%</span>
          <button onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))} className="p-1 rounded hover:bg-muted">
            <ZoomIn className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Main toolbar - Excel ribbon style */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b bg-card/95 overflow-x-auto flex-shrink-0">
        {/* Undo/Redo */}
        <button onClick={undo} className="p-1.5 rounded hover:bg-muted" title="Annuler (Ctrl+Z)"><Undo2 className="h-3.5 w-3.5" /></button>
        <button onClick={redo} className="p-1.5 rounded hover:bg-muted" title="Rétablir (Ctrl+Y)"><Redo2 className="h-3.5 w-3.5" /></button>
        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Font family */}
        <Select value={selectedCellData?.fontFamily || 'Arial'} onValueChange={v => setFontForSelection('fontFamily', v)}>
          <SelectTrigger className="h-7 w-24 text-xs border-muted shadow-none"><SelectValue /></SelectTrigger>
          <SelectContent>{FONT_FAMILIES.map(f => <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>)}</SelectContent>
        </Select>

        {/* Font size */}
        <Select value={String(selectedCellData?.fontSize || 11)} onValueChange={v => setFontForSelection('fontSize', parseInt(v))}>
          <SelectTrigger className="h-7 w-14 text-xs border-muted shadow-none"><SelectValue /></SelectTrigger>
          <SelectContent>{FONT_SIZES.map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Bold, Italic, Underline, Strikethrough */}
        <button onClick={() => toggleFormat('bold')} className={`p-1.5 rounded ${selectedCellData?.bold ? 'bg-primary/15 text-primary' : 'hover:bg-muted'}`} title="Gras (Ctrl+B)">
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => toggleFormat('italic')} className={`p-1.5 rounded ${selectedCellData?.italic ? 'bg-primary/15 text-primary' : 'hover:bg-muted'}`} title="Italique (Ctrl+I)">
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => toggleFormat('underline')} className={`p-1.5 rounded ${selectedCellData?.underline ? 'bg-primary/15 text-primary' : 'hover:bg-muted'}`} title="Souligné (Ctrl+U)">
          <Underline className="h-3.5 w-3.5" />
        </button>
        <button onClick={toggleStrikethrough} className={`p-1.5 rounded ${selectedCellData?.strikethrough ? 'bg-primary/15 text-primary' : 'hover:bg-muted'}`} title="Barré">
          <Strikethrough className="h-3.5 w-3.5" />
        </button>
        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Alignment */}
        <button onClick={() => setAlignForSelection('left')} className={`p-1.5 rounded ${(!selectedCellData?.align || selectedCellData?.align === 'left') ? 'bg-primary/15 text-primary' : 'hover:bg-muted'}`}>
          <AlignLeft className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => setAlignForSelection('center')} className={`p-1.5 rounded ${selectedCellData?.align === 'center' ? 'bg-primary/15 text-primary' : 'hover:bg-muted'}`}>
          <AlignCenter className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => setAlignForSelection('right')} className={`p-1.5 rounded ${selectedCellData?.align === 'right' ? 'bg-primary/15 text-primary' : 'hover:bg-muted'}`}>
          <AlignRight className="h-3.5 w-3.5" />
        </button>

        {/* Vertical align */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded hover:bg-muted" title="Alignement vertical">
              <AlignVerticalJustifyCenter className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setVerticalAlignForSelection('top')}><AlignVerticalJustifyStart className="h-3.5 w-3.5 mr-2" /> Haut</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setVerticalAlignForSelection('middle')}><AlignVerticalJustifyCenter className="h-3.5 w-3.5 mr-2" /> Milieu</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setVerticalAlignForSelection('bottom')}><AlignVerticalJustifyEnd className="h-3.5 w-3.5 mr-2" /> Bas</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Indent */}
        <button onClick={() => changeIndent(1)} className="p-1.5 rounded hover:bg-muted" title="Augmenter le retrait">
          <IndentIncrease className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => changeIndent(-1)} className="p-1.5 rounded hover:bg-muted" title="Diminuer le retrait">
          <IndentDecrease className="h-3.5 w-3.5" />
        </button>
        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Colors */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded hover:bg-muted" title="Couleur de fond">
              <PaintBucket className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <div className="grid grid-cols-6 gap-1 p-2">
              {CELL_COLORS.map(c => (
                <button key={c} onClick={() => setColorForSelection('bgColor', c)} className="w-5 h-5 rounded border border-border hover:scale-110 transition-transform" style={{ backgroundColor: c === 'transparent' ? '#fff' : c }}>
                  {c === 'transparent' && <X className="h-3 w-3 text-muted-foreground mx-auto" />}
                </button>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded hover:bg-muted" title="Couleur du texte">
              <Type className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <div className="grid grid-cols-4 gap-1 p-2">
              {TEXT_COLORS.map(c => (
                <button key={c} onClick={() => setColorForSelection('textColor', c)} className="w-5 h-5 rounded-full border border-border hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Borders */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded hover:bg-muted" title="Bordures">
              <Square className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setBordersForSelection('all')}>
              <Grid3X3 className="h-3.5 w-3.5 mr-2" /> Toutes les bordures
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBordersForSelection('outer')}>
              <Square className="h-3.5 w-3.5 mr-2" /> Bordure extérieure
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setBordersForSelection('top')}>Bordure supérieure</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBordersForSelection('bottom')}>Bordure inférieure</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBordersForSelection('left')}>Bordure gauche</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBordersForSelection('right')}>Bordure droite</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setBordersForSelection('none')}>
              <X className="h-3.5 w-3.5 mr-2" /> Supprimer les bordures
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Number format */}
        <Select value={selectedCellData?.numberFormat || ''} onValueChange={setNumberFormat}>
          <SelectTrigger className="h-7 w-28 text-xs border-muted shadow-none"><SelectValue placeholder="Format" /></SelectTrigger>
          <SelectContent>{NUMBER_FORMATS.map(f => <SelectItem key={f.value} value={f.value || 'none'}>{f.label}</SelectItem>)}</SelectContent>
        </Select>
        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Wrap */}
        <button onClick={toggleWrap} className={`p-1.5 rounded ${selectedCellData?.wrap ? 'bg-primary/15 text-primary' : 'hover:bg-muted'}`} title="Retour à la ligne">
          <WrapText className="h-3.5 w-3.5" />
        </button>

        {/* Merge */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded hover:bg-muted" title="Fusionner"><Merge className="h-3.5 w-3.5" /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={mergeCells}><Merge className="h-3.5 w-3.5 mr-2" /> Fusionner</DropdownMenuItem>
            <DropdownMenuItem onClick={unmergeCells}><SplitSquareHorizontal className="h-3.5 w-3.5 mr-2" /> Défusionner</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Freeze */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded hover:bg-muted" title="Figer les volets"><Lock className="h-3.5 w-3.5" /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={freezeAtSelection}><Lock className="h-3.5 w-3.5 mr-2" /> Figer ici</DropdownMenuItem>
            <DropdownMenuItem onClick={unfreezeAll}><Unlock className="h-3.5 w-3.5 mr-2" /> Défiger tout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Conditional formatting */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded hover:bg-muted" title="Mise en forme conditionnelle">
              <Palette className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setShowConditionalFormat(true)}>
              <Palette className="h-3.5 w-3.5 mr-2" /> Nouvelle règle...
            </DropdownMenuItem>
            <DropdownMenuItem onClick={clearConditionalFormats}>
              <X className="h-3.5 w-3.5 mr-2" /> Effacer les règles
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Data validation */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded hover:bg-muted" title="Validation de données">
              <List className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setShowDataValidation(true)}>
              <List className="h-3.5 w-3.5 mr-2" /> Configurer...
            </DropdownMenuItem>
            <DropdownMenuItem onClick={clearDataValidation}>
              <X className="h-3.5 w-3.5 mr-2" /> Supprimer validation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filter */}
        <button
          onClick={() => {
            if (Object.keys(activeFilters).length > 0) {
              setActiveFilters({});
              toast.success('Filtres supprimés');
            } else {
              toast.info('Cliquez sur les en-têtes de colonnes pour filtrer');
            }
          }}
          className={`p-1.5 rounded ${Object.keys(activeFilters).length > 0 ? 'bg-primary/15 text-primary' : 'hover:bg-muted'}`}
          title="Filtres"
        >
          <Filter className="h-3.5 w-3.5" />
        </button>

        {/* Chart */}
        <button onClick={createChart} className="p-1.5 rounded hover:bg-muted" title="Insérer un graphique">
          <BarChart3 className="h-3.5 w-3.5" />
        </button>

        {/* Search / Find & Replace */}
        <button onClick={() => { setShowSearch(!showSearch); setShowFindReplace(false); }} className="p-1.5 rounded hover:bg-muted" title="Rechercher (Ctrl+F)">
          <Search className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => { setShowFindReplace(!showFindReplace); setShowSearch(true); }} className="p-1.5 rounded hover:bg-muted" title="Rechercher et remplacer">
          <Replace className="h-3.5 w-3.5" />
        </button>

        {/* Comment */}
        <button
          onClick={() => {
            if (selectedCell) {
              setCommentCell(selectedCell);
              setCommentText(data[selectedCell]?.comment || '');
            }
          }}
          className={`p-1.5 rounded ${selectedCellData?.comment ? 'bg-primary/15 text-primary' : 'hover:bg-muted'}`}
          title="Commentaire"
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </button>

        {/* More */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded hover:bg-muted"><MoreHorizontal className="h-3.5 w-3.5" /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => updateSheet({ numRows: sheet.numRows + 20 })}><Plus className="h-3.5 w-3.5 mr-2" /> Ajouter 20 lignes</DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateSheet({ numCols: Math.min(sheet.numCols + 5, 52) })}><Plus className="h-3.5 w-3.5 mr-2" /> Ajouter 5 colonnes</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowFormulaHelper(!showFormulaHelper)}>
              <FileSpreadsheet className="h-3.5 w-3.5 mr-2" /> Aide formules ({FORMULA_LIST.length})
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search & Replace bar */}
      {showSearch && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/30 flex-wrap">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher..." className="h-7 text-xs max-w-[200px]" autoFocus />
          {showFindReplace && (
            <>
              <Replace className="h-3.5 w-3.5 text-muted-foreground" />
              <Input value={replaceText} onChange={e => setReplaceText(e.target.value)} placeholder="Remplacer par..." className="h-7 text-xs max-w-[200px]" />
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => findAndReplace(false)}>Remplacer</Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => findAndReplace(true)}>Tout remplacer</Button>
            </>
          )}
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowFindReplace(!showFindReplace)}>
            {showFindReplace ? 'Masquer' : 'Remplacer'}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setShowSearch(false); setShowFindReplace(false); setSearchTerm(''); setReplaceText(''); }}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Conditional Format Panel */}
      {showConditionalFormat && (
        <div className="border-b bg-card/80 p-3 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold">Mise en forme conditionnelle :</span>
          <Select value={cfType} onValueChange={(v: any) => setCfType(v)}>
            <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="greaterThan">Supérieur à</SelectItem>
              <SelectItem value="lessThan">Inférieur à</SelectItem>
              <SelectItem value="equal">Égal à</SelectItem>
              <SelectItem value="between">Entre</SelectItem>
              <SelectItem value="text">Contient le texte</SelectItem>
              <SelectItem value="blank">Est vide</SelectItem>
              <SelectItem value="notBlank">N'est pas vide</SelectItem>
            </SelectContent>
          </Select>
          {!['blank', 'notBlank'].includes(cfType) && (
            <Input value={cfValue} onChange={e => setCfValue(e.target.value)} placeholder="Valeur" className="h-7 w-24 text-xs" />
          )}
          {cfType === 'between' && (
            <Input value={cfValue2} onChange={e => setCfValue2(e.target.value)} placeholder="Valeur 2" className="h-7 w-24 text-xs" />
          )}
          <div className="flex items-center gap-1">
            <span className="text-[10px]">Fond:</span>
            <input type="color" value={cfBgColor} onChange={e => setCfBgColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
            <span className="text-[10px]">Texte:</span>
            <input type="color" value={cfTextColor} onChange={e => setCfTextColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
          </div>
          <Button size="sm" className="h-7 text-xs" onClick={applyConditionalFormat}>Appliquer</Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowConditionalFormat(false)}><X className="h-3 w-3" /></Button>
        </div>
      )}

      {/* Data Validation Panel */}
      {showDataValidation && (
        <div className="border-b bg-card/80 p-3 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold">Validation :</span>
          <Select value={dvType} onValueChange={(v: any) => setDvType(v)}>
            <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="list">Liste déroulante</SelectItem>
              <SelectItem value="number">Nombre</SelectItem>
              <SelectItem value="text">Texte</SelectItem>
            </SelectContent>
          </Select>
          {dvType === 'list' && (
            <Input value={dvValues} onChange={e => setDvValues(e.target.value)} placeholder="Option1, Option2, Option3" className="h-7 w-64 text-xs" />
          )}
          {dvType === 'number' && (
            <>
              <Input value={dvMin} onChange={e => setDvMin(e.target.value)} placeholder="Min" className="h-7 w-20 text-xs" />
              <Input value={dvMax} onChange={e => setDvMax(e.target.value)} placeholder="Max" className="h-7 w-20 text-xs" />
            </>
          )}
          <Button size="sm" className="h-7 text-xs" onClick={applyDataValidation}>Appliquer</Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowDataValidation(false)}><X className="h-3 w-3" /></Button>
        </div>
      )}

      {/* Comment popover */}
      {commentCell && (
        <div className="border-b bg-card/80 p-3 flex items-center gap-3">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold">Commentaire ({commentCell}) :</span>
          <Input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Ajouter un commentaire..." className="h-7 text-xs flex-1 max-w-sm" />
          <Button size="sm" className="h-7 text-xs" onClick={() => addComment(commentCell, commentText)}>Enregistrer</Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCommentCell(null)}><X className="h-3 w-3" /></Button>
        </div>
      )}

      {/* Formula bar - Excel style */}
      <div className="flex items-center border-b bg-background relative" style={{ height: 28 }}>
        {/* Name Box */}
        <div 
          className="flex items-center justify-center text-xs font-medium border-r px-1"
          style={{ width: 80, minWidth: 80, height: '100%', backgroundColor: '#f3f4f6' }}
        >
          <span className="font-mono text-foreground">{selectionLabel}</span>
        </div>
        <div className="flex items-center px-2 border-r" style={{ height: '100%' }}>
          <span className="text-xs text-muted-foreground font-bold italic">fx</span>
        </div>
        <input
          ref={formulaInputRef}
          data-formula-bar="true"
          value={editingCell ? editValue : formulaBarValue}
          onChange={e => {
            if (editingCell) {
              setEditValue(e.target.value);
              setFormulaBarValue(e.target.value);
              if (e.target.value.startsWith('=')) {
                updateSheetData(editingCell, { formula: e.target.value, value: '' });
              } else {
                updateSheetData(editingCell, { value: e.target.value, formula: undefined });
              }
              scheduleAutoSave();
            } else {
              handleFormulaBarChange(e.target.value);
            }
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && selectedCell) {
              e.preventDefault();
              if (editingCell) {
                commitEdit(editingCell);
              } else if (formulaBarValue) {
                pushHistory();
                if (formulaBarValue.startsWith('=')) {
                  updateSheetData(selectedCell, { formula: formulaBarValue, value: '' });
                } else {
                  updateSheetData(selectedCell, { value: formulaBarValue, formula: undefined });
                }
                scheduleAutoSave();
              }
              const ref = parseCellRef(selectedCell);
              if (ref) {
                const nextKey = cellKey(ref[0] + 1, ref[1]);
                setSelectedCell(nextKey);
                setSelectionStart(nextKey);
                setSelectionEnd(nextKey);
                const cell = data[nextKey];
                setFormulaBarValue(cell?.formula || cell?.value || '');
              }
            } else if (e.key === 'Escape') {
              setEditingCell(null);
              if (selectedCell) {
                const cell = data[selectedCell];
                setFormulaBarValue(cell?.formula || cell?.value || '');
                setEditValue('');
              }
            }
          }}
          onFocus={() => {
            if (selectedCell && !editingCell) {
              setEditingCell(selectedCell);
              setEditValue(formulaBarValue);
            }
          }}
          className={`flex-1 text-xs border-none bg-transparent outline-none font-mono text-foreground px-2 ${isEditingFormula ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''}`}
          style={{ height: '100%' }}
          placeholder="Valeur ou formule (=SUM, =VLOOKUP, =IF...)"
        />
        {showFormulaHelper && formulaSuggestions.length > 0 && (
          <div className="absolute top-full left-20 z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[200px]">
            {formulaSuggestions.map(f => (
              <button key={f} onClick={() => insertFormulaSuggestion(f)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted font-mono">
                {f}()
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Formula helper panel */}
      {showFormulaHelper && !formulaSuggestions.length && (
        <div className="border-b bg-card/50 p-3 max-h-48 overflow-y-auto">
          <h4 className="text-xs font-semibold mb-2">📋 Formules disponibles ({FORMULA_LIST.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {Object.entries(FORMULA_CATEGORIES).map(([cat, fns]) => (
              <div key={cat}>
                <div className="text-[10px] font-semibold text-muted-foreground mb-1">{cat}</div>
                <div className="flex flex-wrap gap-1">
                  {fns.map(f => (
                    <button key={f} onClick={() => insertFormulaSuggestion(f)} className="text-[10px] bg-muted hover:bg-primary/10 hover:text-primary px-1.5 py-0.5 rounded font-mono transition-colors">
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Spreadsheet grid */}
        <div ref={tableRef} className="flex-1 overflow-auto" style={{ cursor: resizingCol !== null || resizingRow !== null ? (resizingCol !== null ? 'col-resize' : 'row-resize') : undefined }}>
          <table className="border-collapse" style={{ tableLayout: 'fixed', transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined, transformOrigin: 'top left' }}>
            <thead className="sticky top-0 z-10">
              <tr>
                {/* Select all button (top-left corner) */}
                <th 
                  className="border border-[#c0c0c0] text-[10px] font-normal text-center cursor-pointer hover:bg-[#d0d0d0] transition-colors"
                  style={{ width: ROW_HEADER_WIDTH, minWidth: ROW_HEADER_WIDTH, backgroundColor: '#e6e6e6', position: 'sticky', left: 0, zIndex: 30 }}
                  onClick={handleSelectAll}
                />
                {Array.from({ length: sheet.numCols }, (_, c) => {
                  if (sheet.hiddenCols.has(c)) return null;
                  const w = sheet.colWidths[c] || DEFAULT_COL_WIDTH;
                  const inSel = isColInSelection(c);
                  return (
                    <th
                      key={c}
                      className={`border border-[#c0c0c0] text-[11px] font-normal text-center py-0 relative group cursor-pointer transition-colors`}
                      style={{ 
                        width: w, minWidth: w, height: 22,
                        backgroundColor: inSel ? '#b8cfe5' : '#e6e6e6',
                        color: inSel ? '#000' : '#333',
                        fontWeight: inSel ? 600 : 400,
                      }}
                      onClick={() => handleSelectColumn(c)}
                    >
                      <div className="flex items-center justify-center gap-0.5">
                        {colLetter(c)}
                        {activeFilters[c] !== undefined && <Filter className="h-2.5 w-2.5 text-primary" />}
                      </div>
                      {/* Column resize handle */}
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500/50"
                        onMouseDown={e => handleColResizeStart(c, e)}
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: sheet.numRows }, (_, r) => {
                if (sheet.hiddenRows.has(r)) return null;
                if (isRowFiltered(r)) return null;
                const rh = sheet.rowHeights[r] || DEFAULT_ROW_HEIGHT;
                const inRowSel = isRowInSelection(r);
                return (
                  <tr key={r}>
                    {/* Row header */}
                    <td
                      className={`border border-[#c0c0c0] text-[11px] text-center font-normal relative group cursor-pointer transition-colors`}
                      style={{ 
                        width: ROW_HEADER_WIDTH, minWidth: ROW_HEADER_WIDTH, height: rh,
                        backgroundColor: inRowSel ? '#b8cfe5' : '#e6e6e6',
                        color: inRowSel ? '#000' : '#333',
                        fontWeight: inRowSel ? 600 : 400,
                        position: 'sticky', left: 0, zIndex: 10,
                      }}
                      onClick={() => handleSelectRow(r)}
                      onContextMenu={e => handleContextMenu(e, r, -1)}
                    >
                      {r + 1}
                      {/* Row resize handle */}
                      <div
                        className="absolute left-0 right-0 bottom-0 h-1 cursor-row-resize hover:bg-blue-500/50"
                        onMouseDown={e => handleRowResizeStart(r, e)}
                      />
                    </td>
                    {/* Data cells */}
                    {Array.from({ length: sheet.numCols }, (_, c) => {
                      if (sheet.hiddenCols.has(c)) return null;
                      const key = cellKey(r, c);
                      const cell = data[key];

                      // Skip merged child cells
                      if (cell?.mergedParent && cell.mergedParent !== key) return null;

                      const isSelected = selectedCell === key;
                      const isEditing = editingCell === key;
                      const inSel = isInSelection(r, c);
                      const displayValue = getCellValue(key, data);
                      const formattedValue = formatDisplayValue(displayValue, cell?.numberFormat);
                      const isSearchMatch = searchTerm && displayValue.toLowerCase().includes(searchTerm.toLowerCase());
                      const colW = sheet.colWidths[c] || DEFAULT_COL_WIDTH;
                      const isFormulaRef = formulaReferencedCells.has(key);
                      const edge = getSelectionEdge(r, c);
                      const hasComment = !!cell?.comment;

                      // Conditional formatting
                      let cfStyle: React.CSSProperties = {};
                      if (cell?.conditionalFormats) {
                        const cfResult = evaluateConditionalFormat(displayValue, cell.conditionalFormats);
                        if (cfResult) {
                          if (cfResult.bgColor) cfStyle.backgroundColor = cfResult.bgColor;
                          if (cfResult.textColor) cfStyle.color = cfResult.textColor;
                        }
                      }

                      // Cell border styles from data
                      const borderStyles: React.CSSProperties = {};
                      if (cell?.border) {
                        if (cell.border.top) borderStyles.borderTop = cell.border.top;
                        if (cell.border.right) borderStyles.borderRight = cell.border.right;
                        if (cell.border.bottom) borderStyles.borderBottom = cell.border.bottom;
                        if (cell.border.left) borderStyles.borderLeft = cell.border.left;
                      }

                      // Selection border (Excel-style blue dashed rectangle)
                      const selBorder: React.CSSProperties = {};
                      if (inSel && !isSelected) {
                        if (edge.isTop) selBorder.borderTop = '2px solid #2563eb';
                        if (edge.isBottom) selBorder.borderBottom = '2px solid #2563eb';
                        if (edge.isLeft) selBorder.borderLeft = '2px solid #2563eb';
                        if (edge.isRight) selBorder.borderRight = '2px solid #2563eb';
                      }

                      return (
                        <td
                          key={c}
                          data-cell={key}
                          className={`p-0 relative ${isEditing ? '' : 'cursor-cell'}`}
                          style={{
                            width: colW,
                            minWidth: colW,
                            height: rh,
                            backgroundColor: isFormulaRef ? '#e8f0fe' : inSel && !isSelected ? 'rgba(37, 99, 235, 0.08)' : cell?.bgColor || '#ffffff',
                            border: isSelected ? '2px solid #217346' : showGridLines ? '1px solid #d4d4d4' : '1px solid transparent',
                            ...borderStyles,
                            ...selBorder,
                            ...cfStyle,
                            outline: isSelected ? '1px solid #217346' : 'none',
                            outlineOffset: '-1px',
                            boxShadow: isSearchMatch ? 'inset 0 0 0 2px #facc15' : isFormulaRef ? 'inset 0 0 0 1px #3b82f6' : undefined,
                          }}
                          colSpan={cell?.merged?.cols || 1}
                          rowSpan={cell?.merged?.rows || 1}
                          onMouseDown={e => handleMouseDown(key, e)}
                          onMouseEnter={() => handleMouseEnter(key)}
                          onClick={e => handleCellClick(key, e)}
                          onDoubleClick={() => handleCellDoubleClick(key)}
                          onContextMenu={e => handleContextMenu(e, r, c)}
                        >
                          {/* Comment indicator */}
                          {hasComment && (
                            <div 
                              className="absolute top-0 right-0 w-0 h-0" 
                              style={{ borderLeft: '6px solid transparent', borderTop: '6px solid #ef4444' }}
                              title={cell?.comment}
                            />
                          )}

                          {isEditing ? (
                            <input
                              autoFocus
                              value={editValue}
                              onChange={e => {
                                setEditValue(e.target.value);
                                setFormulaBarValue(e.target.value);
                              }}
                              onBlur={(e) => {
                                if (!isEditingFormula && !e.relatedTarget?.closest?.('[data-formula-bar]')) {
                                  commitEdit(key);
                                }
                              }}
                              onKeyDown={e => handleCellKeyDown(e, key)}
                              className="w-full h-full px-1 py-0 text-xs outline-none bg-white dark:bg-background border-none"
                              style={{ 
                                minHeight: rh, 
                                fontFamily: cell?.fontFamily || 'Arial',
                                fontSize: cell?.fontSize ? `${cell.fontSize}px` : '12px',
                              }}
                            />
                          ) : cell?.validation?.type === 'list' ? (
                            <select
                              value={displayValue}
                              onChange={e => {
                                pushHistory();
                                updateSheetData(key, { value: e.target.value, formula: undefined });
                                scheduleAutoSave();
                              }}
                              className="w-full h-full px-1 text-xs outline-none bg-transparent border-none cursor-pointer"
                              style={{
                                fontWeight: cell?.bold ? 'bold' : undefined,
                                fontStyle: cell?.italic ? 'italic' : undefined,
                                textAlign: cell?.align || 'left',
                                color: cell?.textColor || undefined,
                                fontFamily: cell?.fontFamily || 'Arial',
                                fontSize: cell?.fontSize ? `${cell.fontSize}px` : '12px',
                              }}
                            >
                              <option value="">--</option>
                              {cell.validation.values?.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                          ) : (
                            <div
                              className="px-1 text-xs select-none"
                              style={{
                                fontWeight: cell?.bold ? 'bold' : undefined,
                                fontStyle: cell?.italic ? 'italic' : undefined,
                                textDecoration: [
                                  cell?.underline ? 'underline' : '',
                                  cell?.strikethrough ? 'line-through' : '',
                                ].filter(Boolean).join(' ') || undefined,
                                textAlign: cell?.align || 'left',
                                color: cfStyle.color || cell?.textColor || undefined,
                                fontFamily: cell?.fontFamily || 'Arial',
                                fontSize: cell?.fontSize ? `${cell.fontSize}px` : '12px',
                                lineHeight: `${rh - 2}px`,
                                height: rh - 2,
                                whiteSpace: cell?.wrap ? 'pre-wrap' : 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                paddingLeft: cell?.indent ? `${cell.indent * 12}px` : undefined,
                                verticalAlign: cell?.verticalAlign || 'middle',
                                display: 'flex',
                                alignItems: cell?.verticalAlign === 'top' ? 'flex-start' : cell?.verticalAlign === 'bottom' ? 'flex-end' : 'center',
                              }}
                            >
                              {(formattedValue === '☐' || formattedValue === '☑') ? (
                                <span 
                                  className="cursor-pointer text-base leading-none"
                                  onClick={(e) => { e.stopPropagation(); pushHistory(); updateSheetData(key, { value: formattedValue === '☐' ? '☑' : '☐' }); scheduleAutoSave(); }}
                                >
                                  {formattedValue}
                                </span>
                              ) : formattedValue}
                            </div>
                          )}

                          {/* Auto-fill handle (bottom-right corner of selected cell) */}
                          {isSelected && !isEditing && (
                            <div
                              className="absolute bottom-0 right-0 w-[7px] h-[7px] cursor-crosshair z-20"
                              style={{ backgroundColor: '#217346', border: '1px solid white', transform: 'translate(50%, 50%)' }}
                              onMouseDown={e => handleAutoFillStart(key, e)}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Charts panel */}
        {showChartPanel && charts.length > 0 && (
          <div className="w-96 border-l bg-card overflow-y-auto p-3 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">📊 Graphiques</h3>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowChartPanel(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            {charts.map((chart, idx) => (
              <div key={chart.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-muted-foreground">Plage:</span>
                  <Input
                    value={chart.dataRange}
                    onChange={e => {
                      const updated = [...charts];
                      updated[idx] = { ...chart, dataRange: e.target.value };
                      setCharts(updated);
                    }}
                    className="h-6 text-xs font-mono flex-1"
                    placeholder="A1:B10"
                  />
                </div>
                <SpreadsheetChart
                  config={chart}
                  data={getChartData(chart)}
                  onRemove={() => setCharts(prev => prev.filter((_, i) => i !== idx))}
                  onUpdate={updates => {
                    const updated = [...charts];
                    updated[idx] = { ...chart, ...updates };
                    setCharts(updated);
                  }}
                />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={createChart} className="w-full gap-1 text-xs">
              <Plus className="h-3 w-3" /> Nouveau graphique
            </Button>
          </div>
        )}
      </div>

      {/* Bottom area: sheet tabs + status bar */}
      <div className="flex items-center border-t" style={{ backgroundColor: '#e6e6e6', height: 28 }}>
        {/* Sheet tabs */}
        <div className="flex items-center gap-0 overflow-x-auto flex-1">
          <button onClick={addSheet} className="px-2 py-1 hover:bg-[#d0d0d0] transition-colors border-r border-[#c0c0c0]" title="Nouvelle feuille">
            <Plus className="h-3.5 w-3.5 text-[#555]" />
          </button>
          {sheets.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center gap-1 px-3 py-1 text-xs cursor-pointer border-r border-[#c0c0c0] transition-colors whitespace-nowrap ${
                i === activeSheetIdx 
                  ? 'bg-white font-medium text-foreground border-t-2 border-t-[#217346]' 
                  : 'hover:bg-[#d0d0d0] text-[#555]'
              }`}
              onClick={() => setActiveSheetIdx(i)}
              onDoubleClick={() => setEditingSheetName(i)}
            >
              {editingSheetName === i ? (
                <input
                  value={s.name}
                  onChange={e => renameSheet(i, e.target.value)}
                  onBlur={() => setEditingSheetName(null)}
                  onKeyDown={e => e.key === 'Enter' && setEditingSheetName(null)}
                  className="w-20 text-xs bg-transparent outline-none border-b border-primary"
                  autoFocus
                />
              ) : (
                <span>{s.name}</span>
              )}
              {sheets.length > 1 && (
                <button
                  onClick={e => { e.stopPropagation(); deleteSheet(i); }}
                  className="hover:text-destructive ml-1 opacity-50 hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Status bar - Excel style with Sum/Average/Count */}
        <div className="flex items-center gap-3 px-3 text-[11px] text-[#555] border-l border-[#c0c0c0] flex-shrink-0">
          {selectionStats && selectionStats.numCount > 0 && (
            <>
              <span>Moyenne : <strong>{selectionStats.average.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</strong></span>
              <span>Nombre : <strong>{selectionStats.count}</strong></span>
              <span>Somme : <strong>{selectionStats.sum.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</strong></span>
              {selectionStats.min !== undefined && selectionStats.numCount > 1 && (
                <>
                  <span>Min : <strong>{selectionStats.min.toLocaleString('fr-FR')}</strong></span>
                  <span>Max : <strong>{selectionStats.max?.toLocaleString('fr-FR')}</strong></span>
                </>
              )}
            </>
          )}
          {(!selectionStats || selectionStats.numCount === 0) && (
            <span>{sheet.numRows} × {sheet.numCols} • {Object.keys(data).length} cellules</span>
          )}
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[200px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2" onClick={() => { handleCopy(); setContextMenu(null); }}>
            <Copy className="h-3 w-3" /> Copier <span className="ml-auto text-muted-foreground">Ctrl+C</span>
          </button>
          <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2" onClick={() => { handleCut(); setContextMenu(null); }}>
            <Scissors className="h-3 w-3" /> Couper <span className="ml-auto text-muted-foreground">Ctrl+X</span>
          </button>
          <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2" onClick={() => { handlePaste(); setContextMenu(null); }}>
            <Clipboard className="h-3 w-3" /> Coller <span className="ml-auto text-muted-foreground">Ctrl+V</span>
          </button>
          <div className="h-px bg-border my-1" />
          <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2" onClick={() => { insertRow(contextMenu.row); setContextMenu(null); }}>
            <PlusCircle className="h-3 w-3" /> Insérer une ligne au-dessus
          </button>
          <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2" onClick={() => { insertRow(contextMenu.row + 1); setContextMenu(null); }}>
            <PlusCircle className="h-3 w-3" /> Insérer une ligne en-dessous
          </button>
          <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2 text-destructive" onClick={() => { deleteRow(contextMenu.row); setContextMenu(null); }}>
            <MinusCircle className="h-3 w-3" /> Supprimer la ligne
          </button>
          <div className="h-px bg-border my-1" />
          {contextMenu.col >= 0 && (
            <>
              <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2" onClick={() => { insertCol(contextMenu.col); setContextMenu(null); }}>
                <PlusCircle className="h-3 w-3" /> Insérer colonne à gauche
              </button>
              <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2" onClick={() => { insertCol(contextMenu.col + 1); setContextMenu(null); }}>
                <PlusCircle className="h-3 w-3" /> Insérer colonne à droite
              </button>
              <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2 text-destructive" onClick={() => { deleteCol(contextMenu.col); setContextMenu(null); }}>
                <MinusCircle className="h-3 w-3" /> Supprimer la colonne
              </button>
              <div className="h-px bg-border my-1" />
              <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2" onClick={() => { sortColumn(contextMenu.col, true); setContextMenu(null); }}>
                <SortAsc className="h-3 w-3" /> Trier A → Z
              </button>
              <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2" onClick={() => { sortColumn(contextMenu.col, false); setContextMenu(null); }}>
                <SortDesc className="h-3 w-3" /> Trier Z → A
              </button>
            </>
          )}
        </div>
      )}
      {userId && <ShareDocumentModal open={showShareModal} onOpenChange={setShowShareModal} documentId={doc.id} userId={userId} />}
    </div>
  );
};

export default WorkspaceSpreadsheetEditor;
