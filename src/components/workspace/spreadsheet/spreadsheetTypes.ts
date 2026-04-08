import { ChartType } from '../SpreadsheetChart';
import { SheetData } from '@/utils/spreadsheetFormulas';

export interface SpreadsheetProps {
  document: import('@/services/workspaceService').WorkspaceDocument;
  onSave: (doc: import('@/services/workspaceService').WorkspaceDocument) => Promise<void>;
  onClose: () => void;
}

export interface SheetTab {
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

export interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  dataRange: string;
  labelsRange: string;
  colors: string[];
}

export interface HistoryEntry {
  sheets: SheetTab[];
  activeSheet: number;
}

export const DEFAULT_ROWS = 100;
export const DEFAULT_COLS = 26;
export const DEFAULT_COL_WIDTH = 100;
export const DEFAULT_ROW_HEIGHT = 25;
export const MIN_COL_WIDTH = 40;
export const MIN_ROW_HEIGHT = 20;
export const ROW_HEADER_WIDTH = 46;

export const CELL_COLORS = [
  'transparent', '#ffffff', '#f3f4f6', '#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3', '#f3e8ff',
  '#fee2e2', '#e0e7ff', '#cffafe', '#fef9c3', '#d1fae5', '#fbcfe8', '#c7d2fe', '#fecaca',
  '#bfdbfe', '#bbf7d0', '#fde68a', '#c4b5fd', '#f9a8d4', '#99f6e4', '#fed7aa', '#a5b4fc'
];

export const TEXT_COLORS = [
  '#000000', '#374151', '#6b7280', '#dc2626', '#ea580c', '#d97706', '#16a34a', '#059669',
  '#0891b2', '#2563eb', '#4f46e5', '#7c3aed', '#9333ea', '#db2777', '#e11d48', '#ffffff'
];

export const FONT_FAMILIES = [
  'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  'Trebuchet MS', 'Impact', 'Comic Sans MS', 'Lucida Console', 'Tahoma', 'Garamond'
];

export const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

export const NUMBER_FORMATS = [
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

export const createEmptySheet = (name: string): SheetTab => ({
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
