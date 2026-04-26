import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Type, Image as ImageIcon, Variable, Minus, Square,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Copy, Trash2, ChevronUp, ChevronDown, Move, FileText, PenTool, QrCode,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface TableColumnConfig {
  id: string;
  key: 'module' | 'coefficient' | 'cc' | 'ds' | 'exam' | 'oral' | 'tp' | 'moyenne' | 'points' | 'credits' | 'rang' | 'status' | 'appreciation' | 'custom_static' | 'custom_formula';
  label: string;
  visible: boolean;
  align?: 'left' | 'center' | 'right';
  width?: number; // 0-100 percent or px
  // Phase 2 — Custom columns
  staticValue?: string;          // for key === 'custom_static'
  formula?: string;              // for key === 'custom_formula' — e.g. "{cc} * 0.4 + {exam} * 0.6"
  decimals?: number;             // round formula result
  suffix?: string;               // e.g. "/20", "%", " pts"
  // Phase 2 — Per-column styling
  bgColor?: string;
  textColor?: string;
  fontWeight?: '400' | '600' | '700';
  isHighlight?: boolean;         // visually emphasize this column
}

export interface TableStyleConfig {
  headerBg: string;
  headerTextColor: string;
  rowBg: string;
  rowAltBg: string;
  rowTextColor: string;
  borderColor: string;
  borderRadius: number;
  fontSize: number;
  rowHeight: number;
}

export const DEFAULT_TABLE_COLUMNS: TableColumnConfig[] = [
  { id: 'col-module', key: 'module', label: 'Matière', visible: true, align: 'left', width: 30 },
  { id: 'col-coef', key: 'coefficient', label: 'Coef.', visible: true, align: 'center', width: 8 },
  { id: 'col-cc', key: 'cc', label: 'CC', visible: true, align: 'center', width: 8 },
  { id: 'col-ds', key: 'ds', label: 'DS', visible: true, align: 'center', width: 8 },
  { id: 'col-exam', key: 'exam', label: 'Examen', visible: true, align: 'center', width: 10 },
  { id: 'col-oral', key: 'oral', label: 'Oral', visible: false, align: 'center', width: 8 },
  { id: 'col-tp', key: 'tp', label: 'TP', visible: false, align: 'center', width: 8 },
  { id: 'col-moy', key: 'moyenne', label: 'Moyenne', visible: true, align: 'center', width: 10 },
  { id: 'col-points', key: 'points', label: 'Points', visible: false, align: 'center', width: 8 },
  { id: 'col-credits', key: 'credits', label: 'Crédits', visible: false, align: 'center', width: 8 },
  { id: 'col-status', key: 'status', label: 'Statut', visible: true, align: 'center', width: 10 },
  { id: 'col-appr', key: 'appreciation', label: 'Appréciation', visible: false, align: 'left', width: 18 },
];

export const DEFAULT_TABLE_STYLE: TableStyleConfig = {
  headerBg: '#1e40af',
  headerTextColor: '#ffffff',
  rowBg: '#ffffff',
  rowAltBg: '#f8fafc',
  rowTextColor: '#1a1a2e',
  borderColor: '#e2e8f0',
  borderRadius: 8,
  fontSize: 11,
  rowHeight: 36,
};

export type BulletinElementType =
  | 'text'
  | 'variable'
  | 'image'
  | 'logo'
  | 'line'
  | 'rectangle'
  | 'qr_code'
  | 'signatures_block'
  | 'appreciation_block'
  | 'assiduity_block'
  | 'mention_block'
  | 'ects_block';

export interface BulletinElement {
  id: string;
  type: BulletinElementType;
  zone: 'header' | 'body' | 'footer';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  styles: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    textAlign?: string;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    opacity?: number;
    textDecoration?: string;
    letterSpacing?: number;
    lineHeight?: number;
  };
}

export const BULLETIN_VARIABLES = [
  { key: '{nom_complet}', label: "Nom complet de l'étudiant", example: 'Marie Dubois' },
  { key: '{prenom}', label: 'Prénom', example: 'Marie' },
  { key: '{nom}', label: 'Nom', example: 'Dubois' },
  { key: '{date_naissance}', label: 'Date de naissance', example: '15/03/2002' },
  { key: '{numero_etudiant}', label: 'Numéro étudiant', example: 'ETU-0042' },
  { key: '{formation}', label: 'Formation', example: 'BTS Tourisme' },
  { key: '{niveau}', label: 'Niveau', example: 'BAC+2' },
  { key: '{annee_academique}', label: 'Année académique', example: '2025-2026' },
  { key: '{periode}', label: "Période / Semestre", example: 'Semestre 1' },
  { key: '{etablissement}', label: "Nom de l'établissement", example: 'Nectforma' },
  { key: '{adresse_etablissement}', label: 'Adresse établissement', example: '12 rue de Paris' },
  { key: '{moyenne_generale}', label: 'Moyenne générale', example: '14.25' },
  { key: '{rang}', label: 'Rang dans la promotion', example: '3 / 28' },
  { key: '{mention}', label: 'Mention', example: 'Bien' },
  { key: '{decision}', label: 'Décision du jury', example: 'Admis' },
  { key: '{credits_acquis}', label: 'Crédits ECTS acquis', example: '28 / 30' },
  { key: '{numero_bulletin}', label: 'N° de référence', example: 'BLT-2026-0042' },
  { key: '{date_emission}', label: "Date d'émission", example: '15/04/2026' },
  { key: '{code_verification}', label: 'Code QR de vérification', example: 'BLT-2026-a1b2' },
];

// Canvas dimensions matching A4 portrait at 96 DPI (595 wide; we use 560 for inner)
export const CANVAS_W = 720;
export const HEADER_H = 200;
export const BODY_H = 280;
export const FOOTER_H = 220;

// ============================================================================
// Default elements
// ============================================================================

let nextId = 100;
const genId = () => `bel-${++nextId}-${Date.now().toString(36)}`;

export const DEFAULT_HEADER_ELEMENTS: BulletinElement[] = [
  {
    id: 'def-h-1', type: 'logo', zone: 'header',
    x: 24, y: 20, width: 64, height: 64,
    content: 'logo', styles: { borderRadius: 8 },
  },
  {
    id: 'def-h-2', type: 'text', zone: 'header',
    x: 100, y: 22, width: 380, height: 26, content: '{etablissement}',
    styles: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', fontFamily: 'Inter', textAlign: 'left' },
  },
  {
    id: 'def-h-3', type: 'text', zone: 'header',
    x: 100, y: 50, width: 380, height: 18, content: 'École Supérieure Privée',
    styles: { fontSize: 11, color: '#64748b', fontFamily: 'Inter', textAlign: 'left' },
  },
  {
    id: 'def-h-4', type: 'rectangle', zone: 'header',
    x: 530, y: 22, width: 170, height: 50, content: '',
    styles: { backgroundColor: '#1e40af', borderRadius: 6 },
  },
  {
    id: 'def-h-5', type: 'text', zone: 'header',
    x: 530, y: 30, width: 170, height: 20, content: 'BULLETIN DE NOTES',
    styles: { fontSize: 11, fontWeight: '700', color: '#ffffff', fontFamily: 'Inter', textAlign: 'center', letterSpacing: 1 },
  },
  {
    id: 'def-h-6', type: 'text', zone: 'header',
    x: 530, y: 50, width: 170, height: 16, content: '{periode}',
    styles: { fontSize: 10, color: '#fef9c3', fontFamily: 'Inter', textAlign: 'center' },
  },
  {
    id: 'def-h-7', type: 'line', zone: 'header',
    x: 24, y: 100, width: 676, height: 2, content: '',
    styles: { backgroundColor: '#e2e8f0' },
  },
  {
    id: 'def-h-8', type: 'text', zone: 'header',
    x: 24, y: 115, width: 200, height: 16, content: 'ÉTUDIANT',
    styles: { fontSize: 9, fontWeight: '700', color: '#94a3b8', fontFamily: 'Inter', textAlign: 'left', letterSpacing: 1 },
  },
  {
    id: 'def-h-9', type: 'variable', zone: 'header',
    x: 24, y: 132, width: 300, height: 24, content: '{nom_complet}',
    styles: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', fontFamily: 'Inter', textAlign: 'left' },
  },
  {
    id: 'def-h-10', type: 'text', zone: 'header',
    x: 24, y: 158, width: 380, height: 16, content: 'N° {numero_etudiant} · {formation}',
    styles: { fontSize: 11, color: '#64748b', fontFamily: 'Inter', textAlign: 'left' },
  },
  {
    id: 'def-h-11', type: 'text', zone: 'header',
    x: 480, y: 115, width: 220, height: 16, content: 'PÉRIODE',
    styles: { fontSize: 9, fontWeight: '700', color: '#94a3b8', fontFamily: 'Inter', textAlign: 'right', letterSpacing: 1 },
  },
  {
    id: 'def-h-12', type: 'variable', zone: 'header',
    x: 480, y: 132, width: 220, height: 24, content: '{periode}',
    styles: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', fontFamily: 'Inter', textAlign: 'right' },
  },
  {
    id: 'def-h-13', type: 'text', zone: 'header',
    x: 480, y: 158, width: 220, height: 16, content: '{annee_academique}',
    styles: { fontSize: 11, color: '#64748b', fontFamily: 'Inter', textAlign: 'right' },
  },
];

export const DEFAULT_FOOTER_ELEMENTS: BulletinElement[] = [
  {
    id: 'def-f-1', type: 'rectangle', zone: 'footer',
    x: 24, y: 0, width: 676, height: 60, content: '',
    styles: { backgroundColor: '#fef3c7', borderRadius: 8, borderColor: '#fbbf24', borderWidth: 1 },
  },
  {
    id: 'def-f-2', type: 'text', zone: 'footer',
    x: 36, y: 12, width: 250, height: 16, content: 'MOYENNE GÉNÉRALE',
    styles: { fontSize: 9, fontWeight: '700', color: '#92400e', fontFamily: 'Inter', textAlign: 'left', letterSpacing: 1 },
  },
  {
    id: 'def-f-3', type: 'variable', zone: 'footer',
    x: 36, y: 28, width: 200, height: 28, content: '{moyenne_generale}',
    styles: { fontSize: 22, fontWeight: '700', color: '#1a1a2e', fontFamily: 'Inter', textAlign: 'left' },
  },
  {
    id: 'def-f-4', type: 'text', zone: 'footer',
    x: 250, y: 18, width: 200, height: 30, content: 'Mention : {mention}\nRang : {rang}',
    styles: { fontSize: 11, color: '#92400e', fontFamily: 'Inter', textAlign: 'left', lineHeight: 1.4 },
  },
  {
    id: 'def-f-5', type: 'text', zone: 'footer',
    x: 470, y: 12, width: 220, height: 16, content: 'DÉCISION',
    styles: { fontSize: 9, fontWeight: '700', color: '#92400e', fontFamily: 'Inter', textAlign: 'right', letterSpacing: 1 },
  },
  {
    id: 'def-f-6', type: 'variable', zone: 'footer',
    x: 470, y: 28, width: 220, height: 28, content: '{decision}',
    styles: { fontSize: 22, fontWeight: '700', color: '#15803d', fontFamily: 'Inter', textAlign: 'right' },
  },
  {
    id: 'def-f-7', type: 'signatures_block', zone: 'footer',
    x: 24, y: 80, width: 676, height: 100, content: '',
    styles: {},
  },
  {
    id: 'def-f-8', type: 'text', zone: 'footer',
    x: 24, y: 195, width: 676, height: 14, content: 'Document officiel · {etablissement} · Réf : {numero_bulletin} · Émis le {date_emission}',
    styles: { fontSize: 8, color: '#94a3b8', fontFamily: 'Inter', textAlign: 'center', fontStyle: 'italic' },
  },
];

export const DEFAULT_BODY_ELEMENTS: BulletinElement[] = [
  {
    id: 'def-b-1', type: 'appreciation_block', zone: 'body',
    x: 24, y: 12, width: 440, height: 90, content: '',
    styles: { backgroundColor: '#fffbeb', borderRadius: 8, borderColor: '#fbbf24', borderWidth: 1 },
  },
  {
    id: 'def-b-2', type: 'mention_block', zone: 'body',
    x: 478, y: 12, width: 222, height: 90, content: '',
    styles: { backgroundColor: '#eff6ff', borderRadius: 8, borderColor: '#3b82f6', borderWidth: 1 },
  },
  {
    id: 'def-b-3', type: 'assiduity_block', zone: 'body',
    x: 24, y: 116, width: 336, height: 80, content: '',
    styles: { backgroundColor: '#f0fdf4', borderRadius: 8, borderColor: '#22c55e', borderWidth: 1 },
  },
  {
    id: 'def-b-4', type: 'ects_block', zone: 'body',
    x: 372, y: 116, width: 328, height: 80, content: '',
    styles: { backgroundColor: '#faf5ff', borderRadius: 8, borderColor: '#a855f7', borderWidth: 1 },
  },
  {
    id: 'def-b-5', type: 'text', zone: 'body',
    x: 24, y: 210, width: 676, height: 50, content: 'L\'étudiant a fait preuve de sérieux et d\'application tout au long de cette période. Les progrès enregistrés sont encourageants. Nous l\'invitons à maintenir cet effort constant.',
    styles: { fontSize: 10, color: '#475569', fontFamily: 'Inter', textAlign: 'justify', fontStyle: 'italic', lineHeight: 1.5 },
  },
];

// ============================================================================
// Element creation defaults (for "Add" buttons)
// ============================================================================

const TYPE_DEFAULTS: Record<BulletinElementType, Partial<BulletinElement>> = {
  text: {
    width: 200, height: 24, content: 'Texte',
    styles: { fontSize: 12, color: '#1a1a2e', fontFamily: 'Inter', textAlign: 'left' },
  },
  variable: {
    width: 220, height: 26, content: '{nom_complet}',
    styles: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', fontFamily: 'Inter', textAlign: 'left' },
  },
  image: { width: 80, height: 60, content: '', styles: { borderRadius: 4 } },
  logo: { width: 64, height: 64, content: 'logo', styles: { borderRadius: 8 } },
  line: { width: 300, height: 2, content: '', styles: { backgroundColor: '#cbd5e1' } },
  rectangle: { width: 200, height: 80, content: '', styles: { backgroundColor: '#f1f5f9', borderRadius: 6, borderColor: '#cbd5e1', borderWidth: 1 } },
  qr_code: { width: 70, height: 70, content: '{code_verification}', styles: {} },
  signatures_block: { width: 600, height: 100, content: '', styles: {} },
  appreciation_block: { width: 400, height: 90, content: '', styles: { backgroundColor: '#fffbeb', borderRadius: 8, borderColor: '#fbbf24', borderWidth: 1 } },
  assiduity_block: { width: 320, height: 80, content: '', styles: { backgroundColor: '#f0fdf4', borderRadius: 8, borderColor: '#22c55e', borderWidth: 1 } },
  mention_block: { width: 220, height: 90, content: '', styles: { backgroundColor: '#eff6ff', borderRadius: 8, borderColor: '#3b82f6', borderWidth: 1 } },
  ects_block: { width: 320, height: 80, content: '', styles: { backgroundColor: '#faf5ff', borderRadius: 8, borderColor: '#a855f7', borderWidth: 1 } },
};

// ============================================================================
// Component
// ============================================================================

interface Props {
  headerElements: BulletinElement[];
  bodyElements: BulletinElement[];
  footerElements: BulletinElement[];
  tableColumns: TableColumnConfig[];
  tableStyle: TableStyleConfig;
  onChange: (header: BulletinElement[], body: BulletinElement[], footer: BulletinElement[]) => void;
  onTableColumnsChange: (cols: TableColumnConfig[]) => void;
  onTableStyleChange: (style: TableStyleConfig) => void;
  primaryColor?: string;
  accentColor?: string;
  establishmentLogo?: string | null;
  establishmentName?: string;
  signatoriesPreview?: Array<{ id: string; role_label: string; name: string | null; signature_image: string | null; is_stamp: boolean }>;
}

const BulletinLayoutEditor: React.FC<Props> = ({
  headerElements,
  bodyElements,
  footerElements,
  tableColumns,
  tableStyle,
  onChange,
  onTableColumnsChange,
  onTableStyleChange,
  primaryColor = '#1e40af',
  accentColor = '#f59e0b',
  establishmentLogo,
  establishmentName,
  signatoriesPreview = [],
}) => {
  const [activeZone, setActiveZone] = useState<'header' | 'body' | 'footer' | 'table' | 'preview'>('header');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offX: number; offY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; startW: number; startH: number; startX: number; startY: number } | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const elements =
    activeZone === 'header' ? headerElements
    : activeZone === 'body' ? bodyElements
    : activeZone === 'footer' ? footerElements
    : [];

  const setElements = useCallback((next: BulletinElement[]) => {
    if (activeZone === 'header') onChange(next, bodyElements, footerElements);
    else if (activeZone === 'body') onChange(headerElements, next, footerElements);
    else if (activeZone === 'footer') onChange(headerElements, bodyElements, next);
  }, [activeZone, headerElements, bodyElements, footerElements, onChange]);

  const canvasH =
    activeZone === 'header' ? HEADER_H
    : activeZone === 'body' ? BODY_H
    : activeZone === 'footer' ? FOOTER_H
    : 0;
  const canvasRef =
    activeZone === 'header' ? headerRef
    : activeZone === 'body' ? bodyRef
    : footerRef;

  const updateElement = useCallback((id: string, updates: Partial<BulletinElement>) => {
    setElements(elements.map((el) => (el.id === id ? { ...el, ...updates } : el)));
  }, [elements, setElements]);

  const updateStyle = useCallback((id: string, styles: Partial<BulletinElement['styles']>) => {
    setElements(elements.map((el) => (el.id === id ? { ...el, styles: { ...el.styles, ...styles } } : el)));
  }, [elements, setElements]);

  const addElement = useCallback((type: BulletinElementType) => {
    const d = TYPE_DEFAULTS[type] || {};
    const newEl: BulletinElement = {
      id: genId(),
      type,
      zone: activeZone,
      x: 50, y: 30, width: 200, height: 30, content: '',
      styles: {},
      ...d,
    } as BulletinElement;
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  }, [activeZone, elements, setElements]);

  const removeElement = useCallback((id: string) => {
    setElements(elements.filter((el) => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [elements, selectedId, setElements]);

  const duplicateElement = useCallback((id: string) => {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    const newEl = { ...el, id: genId(), x: Math.min(el.x + 16, CANVAS_W - el.width), y: el.y + 8 };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  }, [elements, setElements]);

  const moveLayer = useCallback((id: string, dir: 'up' | 'down') => {
    const idx = elements.findIndex((e) => e.id === id);
    if (idx < 0) return;
    const arr = [...elements];
    const swap = dir === 'up' ? idx + 1 : idx - 1;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    setElements(arr);
  }, [elements, setElements]);

  // Drag handling
  const handleMouseDown = useCallback((e: React.MouseEvent, elId: string) => {
    e.stopPropagation();
    const el = elements.find((x) => x.id === elId);
    if (!el) return;
    setSelectedId(elId);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragging({ id: elId, offX: e.clientX - rect.left - el.x, offY: e.clientY - rect.top - el.y });
  }, [elements, canvasRef]);

  const handleResizeStart = useCallback((e: React.MouseEvent, elId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const el = elements.find((x) => x.id === elId);
    if (!el) return;
    setResizing({ id: elId, startW: el.width, startH: el.height, startX: e.clientX, startY: e.clientY });
  }, [elements]);

  useEffect(() => {
    if (!dragging && !resizing) return;
    const move = (e: MouseEvent) => {
      if (dragging) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        let nx = e.clientX - rect.left - dragging.offX;
        let ny = e.clientY - rect.top - dragging.offY;
        nx = Math.max(0, Math.min(nx, CANVAS_W - 20));
        ny = Math.max(0, Math.min(ny, canvasH - 10));
        updateElement(dragging.id, { x: Math.round(nx), y: Math.round(ny) });
      }
      if (resizing) {
        const dx = e.clientX - resizing.startX;
        const dy = e.clientY - resizing.startY;
        updateElement(resizing.id, {
          width: Math.max(20, Math.round(resizing.startW + dx)),
          height: Math.max(8, Math.round(resizing.startH + dy)),
        });
      }
    };
    const up = () => { setDragging(null); setResizing(null); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [dragging, resizing, canvasRef, canvasH, updateElement]);

  const selected = elements.find((el) => el.id === selectedId) || null;

  return (
    <div className="space-y-4">
      <div key={activeZone} className={(activeZone === 'header' || activeZone === 'body' || activeZone === 'footer') ? 'grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4' : 'space-y-4'}>
      {/* ====== LEFT : Canvas ====== */}
      <div className="space-y-3">
        {/* Zone tabs */}
        <Tabs value={activeZone} onValueChange={(v) => { setActiveZone(v as any); setSelectedId(null); }}>
          <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
            <TabsTrigger value="header" className="gap-2 px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-3.5 w-3.5" /> En-tête
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2 px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="zone-table">
              <Move className="h-3.5 w-3.5" /> Tableau de notes
            </TabsTrigger>
            <TabsTrigger value="body" className="gap-2 px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Move className="h-3.5 w-3.5" /> Corps du bulletin
            </TabsTrigger>
            <TabsTrigger value="footer" className="gap-2 px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <PenTool className="h-3.5 w-3.5" /> Pied de page
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2 px-3 py-1.5 text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-white" data-testid="zone-preview">
              <FileText className="h-3.5 w-3.5" /> Aperçu complet
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeZone === 'table' ? (
          <TableEditor
            key="table-editor"
            columns={tableColumns}
            style={tableStyle}
            onColumnsChange={onTableColumnsChange}
            onStyleChange={onTableStyleChange}
          />
        ) : activeZone === 'preview' ? (
          <FullPreview
            key="full-preview"
            headerElements={headerElements}
            bodyElements={bodyElements}
            footerElements={footerElements}
            tableColumns={tableColumns}
            tableStyle={tableStyle}
            primaryColor={primaryColor}
            accentColor={accentColor}
            establishmentLogo={establishmentLogo}
            establishmentName={establishmentName}
            signatoriesPreview={signatoriesPreview}
          />
        ) : (
        <Card key="canvas-zone" className="rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            {/* Tools bar */}
            <div className="flex flex-wrap items-center gap-1.5 p-3 bg-muted/30 border-b border-border">
              <span className="text-[11px] uppercase font-semibold tracking-wider text-muted-foreground mr-1">Insérer :</span>
              {[
                { t: 'text' as const, l: 'Texte', icon: Type },
                { t: 'variable' as const, l: 'Variable', icon: Variable },
                { t: 'logo' as const, l: 'Logo', icon: ImageIcon },
                { t: 'image' as const, l: 'Image', icon: ImageIcon },
                { t: 'line' as const, l: 'Trait', icon: Minus },
                { t: 'rectangle' as const, l: 'Forme', icon: Square },
                { t: 'qr_code' as const, l: 'QR Code', icon: QrCode },
              ].map((b) => {
                const Icon = b.icon;
                return (
                  <Button
                    key={b.t} size="sm" variant="outline"
                    onClick={() => addElement(b.t)}
                    className="h-7 text-[11px] gap-1 px-2"
                    data-testid={`add-element-${b.t}`}
                  >
                    <Icon className="h-3 w-3" /> {b.l}
                  </Button>
                );
              })}
              {activeZone === 'body' && (
                <>
                  <div className="w-px h-5 bg-border mx-1" />
                  <Button size="sm" variant="outline" onClick={() => addElement('appreciation_block')} className="h-7 text-[11px] gap-1 px-2" data-testid="add-element-appreciation">
                    <FileText className="h-3 w-3" /> Appréciation
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addElement('mention_block')} className="h-7 text-[11px] gap-1 px-2" data-testid="add-element-mention">
                    <FileText className="h-3 w-3" /> Mention/Rang
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addElement('assiduity_block')} className="h-7 text-[11px] gap-1 px-2" data-testid="add-element-assiduity">
                    <FileText className="h-3 w-3" /> Assiduité
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addElement('ects_block')} className="h-7 text-[11px] gap-1 px-2" data-testid="add-element-ects">
                    <FileText className="h-3 w-3" /> Crédits ECTS
                  </Button>
                </>
              )}
              {activeZone === 'footer' && (
                <Button
                  size="sm" variant="outline"
                  onClick={() => addElement('signatures_block')}
                  className="h-7 text-[11px] gap-1 px-2 ml-1"
                  data-testid="add-element-signatures"
                >
                  <PenTool className="h-3 w-3" /> Bloc signatures
                </Button>
              )}
            </div>

            {/* Canvas */}
            <div className="p-6 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-x-auto">
              <div
                ref={canvasRef}
                className="relative bg-white shadow-lg"
                style={{ width: CANVAS_W, height: canvasH, fontFamily: 'Inter' }}
                onClick={() => setSelectedId(null)}
                data-testid="bulletin-canvas"
              >
                {/* Render elements */}
                {elements.map((el) => (
                  <RenderedElement
                    key={el.id}
                    el={el}
                    selected={selectedId === el.id}
                    primaryColor={primaryColor}
                    accentColor={accentColor}
                    establishmentLogo={establishmentLogo}
                    signatoriesPreview={signatoriesPreview}
                    onMouseDown={(e) => handleMouseDown(e, el.id)}
                    onResizeStart={(e) => handleResizeStart(e, el.id)}
                  />
                ))}

                {/* Placeholder labels around the canvas */}
                {activeZone === 'header' && (
                  <div className="absolute -bottom-7 left-0 right-0 text-center text-[10px] text-muted-foreground italic">
                    ↓ Tableau de notes (généré automatiquement) ↓
                  </div>
                )}
                {activeZone === 'body' && (
                  <>
                    <div className="absolute -top-7 left-0 right-0 text-center text-[10px] text-muted-foreground italic">
                      ↑ Tableau de notes (généré automatiquement) ↑
                    </div>
                    <div className="absolute -bottom-7 left-0 right-0 text-center text-[10px] text-muted-foreground italic">
                      ↓ Pied de page ↓
                    </div>
                  </>
                )}
                {activeZone === 'footer' && (
                  <div className="absolute -top-7 left-0 right-0 text-center text-[10px] text-muted-foreground italic">
                    ↑ Corps du bulletin ↑
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        )}
      </div>

      {/* ====== RIGHT : Properties panel ====== */}
      {(activeZone === 'header' || activeZone === 'body' || activeZone === 'footer') && (
      <Card className="rounded-2xl self-start sticky top-4">
        <CardContent className="p-4 space-y-3">
          {selected ? (
            <PropertiesPanel
              element={selected}
              onUpdate={(updates) => updateElement(selected.id, updates)}
              onUpdateStyle={(s) => updateStyle(selected.id, s)}
              onDelete={() => removeElement(selected.id)}
              onDuplicate={() => duplicateElement(selected.id)}
              onLayerUp={() => moveLayer(selected.id, 'up')}
              onLayerDown={() => moveLayer(selected.id, 'down')}
            />
          ) : (
            <VariablesHelper />
          )}
        </CardContent>
      </Card>
      )}
      </div>
    </div>
  );
};

// ============================================================================
// Element renderer (inside canvas, with selection / drag handles)
// ============================================================================

const RenderedElement: React.FC<{
  el: BulletinElement;
  selected: boolean;
  primaryColor: string;
  accentColor: string;
  establishmentLogo?: string | null;
  signatoriesPreview: Array<{ id: string; role_label: string; name: string | null; signature_image: string | null; is_stamp: boolean }>;
  onMouseDown: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent) => void;
}> = ({ el, selected, primaryColor, accentColor, establishmentLogo, signatoriesPreview, onMouseDown, onResizeStart }) => {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: el.x, top: el.y, width: el.width, height: el.height,
    cursor: 'move',
    outline: selected ? `2px solid ${accentColor}` : 'none',
    outlineOffset: 2,
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
    userSelect: 'none',
  };

  let inner: React.ReactNode = null;

  if (el.type === 'text' || el.type === 'variable') {
    inner = <span style={{ width: '100%', textAlign: el.styles.textAlign as any }}>{el.content || (el.type === 'variable' ? '{variable}' : 'Texte')}</span>;
  } else if (el.type === 'logo') {
    if (establishmentLogo) {
      inner = <img src={establishmentLogo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
    } else {
      inner = (
        <div className="w-full h-full flex items-center justify-center text-[10px]" style={{ background: primaryColor, color: '#fff', borderRadius: el.styles.borderRadius }}>
          LOGO
        </div>
      );
    }
  } else if (el.type === 'image') {
    inner = (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-[10px] italic" style={{ borderRadius: el.styles.borderRadius }}>
        Image
      </div>
    );
  } else if (el.type === 'line') {
    inner = <div style={{ width: '100%', height: '100%', background: el.styles.backgroundColor || '#cbd5e1' }} />;
  } else if (el.type === 'rectangle') {
    inner = null; // Just background
  } else if (el.type === 'qr_code') {
    inner = (
      <div className="w-full h-full bg-white border border-slate-300 grid grid-cols-5 grid-rows-5 gap-px p-1">
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} className={Math.random() > 0.45 ? 'bg-slate-900' : 'bg-white'} />
        ))}
      </div>
    );
  } else if (el.type === 'signatures_block') {
    const sigs = signatoriesPreview.length > 0 ? signatoriesPreview : [
      { id: 'p1', role_label: 'Responsable', name: 'À configurer', signature_image: null, is_stamp: false },
    ];
    inner = (
      <div className="w-full h-full flex items-stretch justify-around gap-3 px-2">
        {sigs.map((s) => (
          <div key={s.id} className="flex-1 min-w-0 flex flex-col items-center justify-end text-center">
            <div className="text-[8px] uppercase tracking-wider text-slate-500 truncate w-full">{s.role_label}</div>
            <div className="flex-1 flex items-center justify-center w-full">
              {s.signature_image ? (
                <img src={s.signature_image} alt="" className="max-h-12 max-w-full object-contain" />
              ) : (
                <span className="text-[9px] text-slate-300 italic">— signature —</span>
              )}
            </div>
            <div className="border-t border-slate-300 w-full mt-1" />
            {s.name && !s.is_stamp ? <div className="text-[9px] font-semibold mt-0.5 truncate w-full">{s.name}</div> : null}
            {s.is_stamp ? <div className="text-[8px] italic mt-0.5 text-amber-600">Cachet</div> : null}
          </div>
        ))}
      </div>
    );
  } else if (el.type === 'appreciation_block') {
    inner = (
      <div className="w-full h-full p-2.5 flex flex-col">
        <div className="text-[9px] uppercase tracking-wider font-bold text-amber-700">Appréciation générale</div>
        <p className="text-[10px] italic text-slate-700 mt-1 leading-snug overflow-hidden">
          Élève sérieux et appliqué. Bonne participation et résultats encourageants.
        </p>
      </div>
    );
  } else if (el.type === 'mention_block') {
    inner = (
      <div className="w-full h-full p-2.5 flex flex-col">
        <div className="text-[9px] uppercase tracking-wider font-bold text-blue-700">Mention & Rang</div>
        <div className="text-base font-bold text-blue-900 mt-1">Bien</div>
        <div className="text-[10px] text-slate-600 mt-0.5">Rang : 3 / 28</div>
      </div>
    );
  } else if (el.type === 'assiduity_block') {
    inner = (
      <div className="w-full h-full p-2.5 flex flex-col">
        <div className="text-[9px] uppercase tracking-wider font-bold text-emerald-700">Assiduité</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1.5 text-[10px] text-slate-700">
          <span>Absences :</span><span className="font-semibold text-right">2 j</span>
          <span>Retards :</span><span className="font-semibold text-right">1</span>
          <span>Justifiées :</span><span className="font-semibold text-right">100%</span>
        </div>
      </div>
    );
  } else if (el.type === 'ects_block') {
    inner = (
      <div className="w-full h-full p-2.5 flex flex-col">
        <div className="text-[9px] uppercase tracking-wider font-bold text-purple-700">Crédits ECTS</div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xl font-bold text-purple-900">28</span>
          <span className="text-[11px] text-slate-500">/ 30 crédits</span>
        </div>
        <div className="w-full bg-purple-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
          <div className="h-full bg-purple-500" style={{ width: '93%' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={baseStyle} onMouseDown={onMouseDown} onClick={(e) => e.stopPropagation()} data-testid={`canvas-element-${el.id}`}>
      {inner}
      {selected && (
        <>
          {/* Resize handle */}
          <div
            onMouseDown={onResizeStart}
            className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize"
            style={{ background: accentColor, transform: 'translate(50%, 50%)', borderRadius: 2 }}
          />
        </>
      )}
    </div>
  );
};

// ============================================================================
// Properties panel
// ============================================================================

const FONTS = ['Inter', 'Segoe UI', 'Georgia', 'Times New Roman', 'Helvetica', 'Courier New'];

const PropertiesPanel: React.FC<{
  element: BulletinElement;
  onUpdate: (u: Partial<BulletinElement>) => void;
  onUpdateStyle: (s: Partial<BulletinElement['styles']>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onLayerUp: () => void;
  onLayerDown: () => void;
}> = ({ element, onUpdate, onUpdateStyle, onDelete, onDuplicate, onLayerUp, onLayerDown }) => {
  const isTextual = element.type === 'text' || element.type === 'variable';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b pb-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-primary">{labelOf(element.type)}</h4>
        <div className="flex items-center gap-0.5">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onLayerUp} title="Avancer">
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onLayerDown} title="Reculer">
            <ChevronDown className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onDuplicate} title="Dupliquer">
            <Copy className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={onDelete} title="Supprimer">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {(element.type === 'text' || element.type === 'variable') && (
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Contenu</Label>
          <textarea
            value={element.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            rows={2}
            className="w-full text-xs border border-border rounded-md px-2 py-1.5 resize-y bg-background"
            data-testid="prop-content"
          />
        </div>
      )}

      {/* Position & size */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">X</Label>
          <Input type="number" value={element.x} onChange={(e) => onUpdate({ x: parseInt(e.target.value) || 0 })} className="h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Y</Label>
          <Input type="number" value={element.y} onChange={(e) => onUpdate({ y: parseInt(e.target.value) || 0 })} className="h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Largeur</Label>
          <Input type="number" value={element.width} onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 10 })} className="h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Hauteur</Label>
          <Input type="number" value={element.height} onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 8 })} className="h-7 text-xs" />
        </div>
      </div>

      {/* Text props */}
      {isTextual && (
        <>
          <div className="grid grid-cols-[1fr_60px] gap-2 items-end">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Police</Label>
              <select
                value={element.styles.fontFamily || 'Inter'}
                onChange={(e) => onUpdateStyle({ fontFamily: e.target.value })}
                className="w-full h-7 text-xs border border-border rounded-md bg-background px-1"
              >
                {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Taille</Label>
              <Input type="number" value={element.styles.fontSize || 12} onChange={(e) => onUpdateStyle({ fontSize: parseInt(e.target.value) || 12 })} className="h-7 text-xs" />
            </div>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            <Button size="sm" variant={element.styles.fontWeight === '700' ? 'default' : 'outline'} className="h-7 w-7 p-0"
              onClick={() => onUpdateStyle({ fontWeight: element.styles.fontWeight === '700' ? '400' : '700' })}>
              <Bold className="h-3 w-3" />
            </Button>
            <Button size="sm" variant={element.styles.fontStyle === 'italic' ? 'default' : 'outline'} className="h-7 w-7 p-0"
              onClick={() => onUpdateStyle({ fontStyle: element.styles.fontStyle === 'italic' ? 'normal' : 'italic' })}>
              <Italic className="h-3 w-3" />
            </Button>
            <Button size="sm" variant={element.styles.textDecoration === 'underline' ? 'default' : 'outline'} className="h-7 w-7 p-0"
              onClick={() => onUpdateStyle({ textDecoration: element.styles.textDecoration === 'underline' ? 'none' : 'underline' })}>
              <Underline className="h-3 w-3" />
            </Button>
            <div className="w-px h-5 bg-border mx-0.5" />
            {[
              { v: 'left', I: AlignLeft },
              { v: 'center', I: AlignCenter },
              { v: 'right', I: AlignRight },
            ].map(({ v, I }) => (
              <Button key={v} size="sm" variant={element.styles.textAlign === v ? 'default' : 'outline'} className="h-7 w-7 p-0"
                onClick={() => onUpdateStyle({ textAlign: v })}>
                <I className="h-3 w-3" />
              </Button>
            ))}
          </div>

          <ColorRow label="Couleur texte" value={element.styles.color || '#1a1a2e'} onChange={(v) => onUpdateStyle({ color: v })} />
        </>
      )}

      {/* Background for non-textual */}
      {(element.type === 'rectangle' || element.type === 'line' || element.type === 'logo' || element.type === 'image') && (
        <ColorRow label="Couleur de fond" value={element.styles.backgroundColor || '#ffffff'} onChange={(v) => onUpdateStyle({ backgroundColor: v })} />
      )}

      {(element.type === 'rectangle' || element.type === 'logo' || element.type === 'image') && (
        <>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Coins arrondis ({element.styles.borderRadius || 0}px)</Label>
            <Slider value={[element.styles.borderRadius || 0]} max={40} step={1}
              onValueChange={([v]) => onUpdateStyle({ borderRadius: v })} className="mt-1" />
          </div>
          <ColorRow label="Bordure" value={element.styles.borderColor || '#cbd5e1'} onChange={(v) => onUpdateStyle({ borderColor: v })} />
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Épaisseur bordure ({element.styles.borderWidth || 0}px)</Label>
            <Slider value={[element.styles.borderWidth || 0]} max={10} step={1}
              onValueChange={([v]) => onUpdateStyle({ borderWidth: v })} className="mt-1" />
          </div>
        </>
      )}

      {/* Opacity */}
      <div>
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Opacité ({Math.round((element.styles.opacity ?? 1) * 100)}%)</Label>
        <Slider value={[(element.styles.opacity ?? 1) * 100]} max={100} step={5}
          onValueChange={([v]) => onUpdateStyle({ opacity: v / 100 })} className="mt-1" />
      </div>
    </div>
  );
};

// Color picker row
const ColorRow: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div>
    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
    <div className="flex items-center gap-2 mt-1">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-7 w-10 rounded cursor-pointer border border-border" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-7 text-xs flex-1 font-mono" />
    </div>
  </div>
);

// Variables helper
const VariablesHelper: React.FC = () => (
  <div className="space-y-3">
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-1 flex items-center gap-2">
        <Move className="h-3.5 w-3.5" /> Astuces
      </h4>
      <ul className="text-[11px] text-muted-foreground space-y-1 leading-relaxed">
        <li>• Cliquez sur un élément pour l'éditer</li>
        <li>• Glissez pour déplacer</li>
        <li>• Coin inférieur droit pour redimensionner</li>
        <li>• "Insérer" pour ajouter un élément</li>
      </ul>
    </div>
    <div className="border-t pt-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-2">
        <Variable className="h-3.5 w-3.5" /> Variables disponibles
      </h4>
      <p className="text-[10px] text-muted-foreground mb-2">Utilisez ces clés dans vos textes/variables :</p>
      <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
        {BULLETIN_VARIABLES.map((v) => (
          <div key={v.key} className="flex items-start gap-2 text-[10px] p-1.5 rounded hover:bg-muted/50 cursor-pointer"
            onClick={() => navigator.clipboard?.writeText(v.key)}
            title="Cliquer pour copier"
          >
            <code className="bg-primary/10 text-primary px-1 py-0.5 rounded font-mono shrink-0">{v.key}</code>
            <span className="text-muted-foreground">{v.label}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const labelOf = (t: BulletinElementType) => ({
  text: 'Texte',
  variable: 'Variable',
  image: 'Image',
  logo: 'Logo',
  line: 'Ligne',
  rectangle: 'Forme',
  qr_code: 'QR Code',
  signatures_block: 'Bloc signatures',
  appreciation_block: 'Appréciation générale',
  assiduity_block: 'Bloc assiduité',
  mention_block: 'Mention & Rang',
  ects_block: 'Crédits ECTS',
}[t]);

// ============================================================================
// Formula evaluator — safe arithmetic on cell values
// Supports: + - * / ( ) numeric literals and {column_key} references
// ============================================================================
export const evaluateFormula = (
  formula: string,
  rowValues: Record<string, number | null | undefined>
): number | null => {
  if (!formula) return null;
  try {
    // Replace {key} with the value
    let expr = formula.replace(/\{(\w+)\}/g, (_m, k) => {
      const v = rowValues[k];
      if (v === null || v === undefined || v === '' || (typeof v === 'number' && isNaN(v))) return '0';
      return String(v);
    });
    // Whitelist: only digits, dots, +-*/(), spaces
    if (!/^[0-9.+\-*/()\s]+$/.test(expr)) return null;
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${expr});`)();
    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
};

// ============================================================================
// TABLE EDITOR — column visibility, labels, order, table styling
// ============================================================================
const TableEditor: React.FC<{
  columns: TableColumnConfig[];
  style: TableStyleConfig;
  onColumnsChange: (cols: TableColumnConfig[]) => void;
  onStyleChange: (style: TableStyleConfig) => void;
}> = ({ columns, style, onColumnsChange, onStyleChange }) => {
  const moveCol = (idx: number, dir: -1 | 1) => {
    const next = [...columns];
    const tgt = idx + dir;
    if (tgt < 0 || tgt >= next.length) return;
    [next[idx], next[tgt]] = [next[tgt], next[idx]];
    onColumnsChange(next);
  };
  const updateCol = (idx: number, updates: Partial<TableColumnConfig>) => {
    const next = [...columns];
    next[idx] = { ...next[idx], ...updates };
    onColumnsChange(next);
  };

  const addCustomColumn = (kind: 'static' | 'formula') => {
    const id = `col-custom-${Date.now()}`;
    const col: TableColumnConfig = kind === 'static' ? {
      id, key: 'custom_static', label: 'Nouvelle colonne', visible: true, align: 'center', width: 10,
      staticValue: '—',
    } : {
      id, key: 'custom_formula', label: 'Calcul', visible: true, align: 'center', width: 12,
      formula: '{cc} * 0.4 + {exam} * 0.6',
      decimals: 2,
    };
    onColumnsChange([...columns, col]);
  };
  const removeCol = (idx: number) => {
    onColumnsChange(columns.filter((_, i) => i !== idx));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* LEFT — Columns */}
      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <Move className="h-4 w-4" /> Colonnes du tableau
            </h3>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 px-2" onClick={() => addCustomColumn('static')} data-testid="add-custom-static">
                <Plus className="h-3 w-3" /> Statique
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 px-2" onClick={() => addCustomColumn('formula')} data-testid="add-custom-formula">
                <Plus className="h-3 w-3" /> Formule
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mb-4">
            Cochez, renommez, réorganisez. <strong>Statique</strong> = valeur fixe, <strong>Formule</strong> = calcul dérivé d'autres colonnes.
          </p>

          <div className="space-y-2">
            {columns.map((col, idx) => {
              const isCustom = col.key === 'custom_static' || col.key === 'custom_formula';
              return (
              <div
                key={col.id}
                className={`p-2 rounded-lg border ${col.visible ? 'bg-primary/5 border-primary/30' : 'bg-muted/30 border-border opacity-60'}`}
                data-testid={`table-col-${col.key}`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={col.visible}
                    onChange={(e) => updateCol(idx, { visible: e.target.checked })}
                    className="h-4 w-4 accent-primary"
                  />
                  <Input
                    value={col.label}
                    onChange={(e) => updateCol(idx, { label: e.target.value })}
                    className="h-7 text-xs flex-1"
                    data-testid={`table-col-label-${col.key}`}
                  />
                  <select
                    value={col.align || 'left'}
                    onChange={(e) => updateCol(idx, { align: e.target.value as any })}
                    className="h-7 text-xs border border-border rounded-md bg-background px-1"
                  >
                    <option value="left">←</option>
                    <option value="center">↔</option>
                    <option value="right">→</option>
                  </select>
                  <Input
                    type="number" min={4} max={50} value={col.width || 10}
                    onChange={(e) => updateCol(idx, { width: parseInt(e.target.value) || 10 })}
                    className="h-7 text-xs w-14"
                    title="Largeur (%)"
                  />
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" disabled={idx === 0} onClick={() => moveCol(idx, -1)}>
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" disabled={idx === columns.length - 1} onClick={() => moveCol(idx, 1)}>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  {isCustom && (
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10" onClick={() => removeCol(idx)} title="Supprimer cette colonne">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Per-column extras */}
                {col.key === 'custom_static' && (
                  <div className="mt-2 grid grid-cols-[80px_1fr] gap-2 items-center">
                    <Label className="text-[10px] text-muted-foreground">Valeur fixe</Label>
                    <Input value={col.staticValue || ''} onChange={(e) => updateCol(idx, { staticValue: e.target.value })} className="h-7 text-xs" placeholder="Ex: Acquis" />
                  </div>
                )}
                {col.key === 'custom_formula' && (
                  <div className="mt-2 space-y-1.5">
                    <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
                      <Label className="text-[10px] text-muted-foreground">Formule</Label>
                      <Input
                        value={col.formula || ''}
                        onChange={(e) => updateCol(idx, { formula: e.target.value })}
                        className="h-7 text-xs font-mono"
                        placeholder="{cc} * 0.4 + {exam} * 0.6"
                        data-testid={`formula-input-${col.id}`}
                      />
                    </div>
                    <div className="grid grid-cols-[80px_60px_1fr] gap-2 items-center">
                      <Label className="text-[10px] text-muted-foreground">Décimales</Label>
                      <Input type="number" min={0} max={4} value={col.decimals ?? 2} onChange={(e) => updateCol(idx, { decimals: parseInt(e.target.value) || 0 })} className="h-7 text-xs" />
                      <Input value={col.suffix || ''} onChange={(e) => updateCol(idx, { suffix: e.target.value })} className="h-7 text-xs" placeholder="Suffixe (ex: /20)" />
                    </div>
                    <p className="text-[9px] text-muted-foreground italic">Variables disponibles : {`{cc}`}, {`{ds}`}, {`{exam}`}, {`{oral}`}, {`{tp}`}, {`{coefficient}`}, {`{moyenne}`}, {`{points}`}, {`{credits}`}</p>
                  </div>
                )}

                {/* Per-column styling */}
                <div className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                  <div>
                    <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">Fond colonne</Label>
                    <input type="color" value={col.bgColor || '#ffffff'} onChange={(e) => updateCol(idx, { bgColor: e.target.value })} className="h-7 w-full rounded cursor-pointer border border-border" />
                  </div>
                  <div>
                    <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">Texte colonne</Label>
                    <input type="color" value={col.textColor || '#1a1a2e'} onChange={(e) => updateCol(idx, { textColor: e.target.value })} className="h-7 w-full rounded cursor-pointer border border-border" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant={col.fontWeight === '700' ? 'default' : 'outline'}
                      className="h-7 w-7 p-0"
                      onClick={() => updateCol(idx, { fontWeight: col.fontWeight === '700' ? '400' : '700' })}
                      title="Gras"
                    >
                      <Bold className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant={col.isHighlight ? 'default' : 'outline'}
                      className="h-7 w-7 p-0"
                      onClick={() => updateCol(idx, { isHighlight: !col.isHighlight })}
                      title="Mise en évidence"
                    >
                      ★
                    </Button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        </CardContent>
      </Card>

      {/* RIGHT — Style */}
      <Card className="rounded-2xl">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-bold text-primary flex items-center gap-2">
            <Square className="h-4 w-4" /> Apparence du tableau
          </h3>

          <ColorRow label="Fond de l'en-tête" value={style.headerBg} onChange={(v) => onStyleChange({ ...style, headerBg: v })} />
          <ColorRow label="Texte de l'en-tête" value={style.headerTextColor} onChange={(v) => onStyleChange({ ...style, headerTextColor: v })} />
          <ColorRow label="Fond des lignes" value={style.rowBg} onChange={(v) => onStyleChange({ ...style, rowBg: v })} />
          <ColorRow label="Fond lignes alternées" value={style.rowAltBg} onChange={(v) => onStyleChange({ ...style, rowAltBg: v })} />
          <ColorRow label="Texte des lignes" value={style.rowTextColor} onChange={(v) => onStyleChange({ ...style, rowTextColor: v })} />
          <ColorRow label="Couleur bordures" value={style.borderColor} onChange={(v) => onStyleChange({ ...style, borderColor: v })} />

          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Coins arrondis ({style.borderRadius}px)</Label>
            <Slider value={[style.borderRadius]} max={20} step={1}
              onValueChange={([v]) => onStyleChange({ ...style, borderRadius: v })} className="mt-1" />
          </div>

          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Taille du texte ({style.fontSize}px)</Label>
            <Slider value={[style.fontSize]} min={8} max={16} step={1}
              onValueChange={([v]) => onStyleChange({ ...style, fontSize: v })} className="mt-1" />
          </div>

          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Hauteur des lignes ({style.rowHeight}px)</Label>
            <Slider value={[style.rowHeight]} min={24} max={60} step={2}
              onValueChange={([v]) => onStyleChange({ ...style, rowHeight: v })} className="mt-1" />
          </div>

          {/* Mini live preview */}
          <div className="border rounded-lg overflow-hidden mt-2" style={{ borderColor: style.borderColor, borderRadius: style.borderRadius }}>
            <table className="w-full" style={{ fontSize: style.fontSize }}>
              <thead>
                <tr style={{ background: style.headerBg, color: style.headerTextColor }}>
                  {columns.filter((c) => c.visible).slice(0, 5).map((c) => (
                    <th key={c.id} className="px-2 py-1.5 font-semibold text-[10px]" style={{ textAlign: c.align as any }}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { mod: 'Mathématiques', cc: '14', exam: '15', moy: '14.5' },
                  { mod: 'Anglais', cc: '12', exam: '13', moy: '12.5' },
                ].map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? style.rowBg : style.rowAltBg, color: style.rowTextColor, height: style.rowHeight }}>
                    {columns.filter((c) => c.visible).slice(0, 5).map((c) => (
                      <td key={c.id} className="px-2" style={{ textAlign: c.align as any, borderTop: `1px solid ${style.borderColor}` }}>
                        {c.key === 'module' ? row.mod : c.key === 'cc' ? row.cc : c.key === 'exam' ? row.exam : c.key === 'moyenne' ? row.moy : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================================
// FULL PREVIEW — header + table + body + footer (interpolated mock data)
// ============================================================================
const FullPreview: React.FC<{
  headerElements: BulletinElement[];
  bodyElements: BulletinElement[];
  footerElements: BulletinElement[];
  tableColumns: TableColumnConfig[];
  tableStyle: TableStyleConfig;
  primaryColor: string;
  accentColor: string;
  establishmentLogo?: string | null;
  establishmentName?: string;
  signatoriesPreview: Array<{ id: string; role_label: string; name: string | null; signature_image: string | null; is_stamp: boolean }>;
}> = ({
  headerElements, bodyElements, footerElements, tableColumns, tableStyle,
  primaryColor, accentColor, establishmentLogo, establishmentName, signatoriesPreview,
}) => {
  const mockData: Record<string, string> = {
    nom_complet: 'Marie Dubois',
    prenom: 'Marie', nom: 'Dubois',
    date_naissance: '15/03/2002',
    numero_etudiant: 'ETU-0042',
    formation: 'Master Digital Marketing 2026',
    niveau: 'BAC+1',
    annee_academique: '2026-2027',
    periode: 'Semestre 1',
    etablissement: establishmentName || 'Nectforma',
    adresse_etablissement: '12 rue de Paris',
    moyenne_generale: '14.25',
    rang: '3 / 28',
    mention: 'Bien',
    decision: 'Admis',
    credits_acquis: '28 / 30',
    numero_bulletin: 'BLT-2026-0042',
    date_emission: '15/04/2026',
    code_verification: 'BLT-2026-a1b2',
  };
  const interpolate = (s: string) => s.replace(/\{(\w+)\}/g, (m, k) => mockData[k] ?? m);

  const mockRows = [
    { mod: 'Marketing Digital', cc: '15', ds: '14', exam: '16', oral: '15', tp: '14', moy: '15.20', coef: '3', points: '45.6', credits: '6', status: 'Validé', appr: 'Très bon travail' },
    { mod: 'Stratégie de Marque', cc: '13', ds: '12', exam: '14', oral: '13', tp: '13', moy: '13.10', coef: '2', points: '26.2', credits: '4', status: 'Validé', appr: 'Solide' },
    { mod: 'Anglais des Affaires', cc: '14', ds: '15', exam: '13', oral: '16', tp: '—', moy: '14.50', coef: '2', points: '29.0', credits: '4', status: 'Validé', appr: 'Bonne progression' },
    { mod: 'Analyse de Données', cc: '11', ds: '10', exam: '12', oral: '—', tp: '12', moy: '11.25', coef: '3', points: '33.7', credits: '5', status: 'Validé', appr: 'À consolider' },
    { mod: 'Gestion de Projet', cc: '16', ds: '15', exam: '17', oral: '15', tp: '15', moy: '15.80', coef: '2', points: '31.6', credits: '4', status: 'Validé', appr: 'Excellent' },
  ];

  const visibleCols = tableColumns.filter((c) => c.visible);

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6 bg-slate-100 dark:bg-slate-800 flex justify-center">
        <div className="bg-white shadow-2xl" style={{ width: CANVAS_W, fontFamily: 'Inter' }}>
          {/* HEADER */}
          <div className="relative" style={{ height: HEADER_H }}>
            {headerElements.map((el) => (
              <RenderedElement
                key={el.id} el={{ ...el, content: interpolate(el.content) }} selected={false}
                primaryColor={primaryColor} accentColor={accentColor}
                establishmentLogo={establishmentLogo} signatoriesPreview={signatoriesPreview}
                onMouseDown={() => {}} onResizeStart={() => {}}
              />
            ))}
          </div>

          {/* TABLE */}
          <div className="px-6 py-3">
            <div className="overflow-hidden" style={{ borderRadius: tableStyle.borderRadius, border: `1px solid ${tableStyle.borderColor}` }}>
              <table className="w-full" style={{ fontSize: tableStyle.fontSize }}>
                <thead>
                  <tr style={{ background: tableStyle.headerBg, color: tableStyle.headerTextColor, height: tableStyle.rowHeight }}>
                    {visibleCols.map((c) => (
                      <th key={c.id} className="px-2 font-semibold uppercase text-[10px]" style={{ textAlign: c.align as any, width: `${c.width}%` }}>
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockRows.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? tableStyle.rowBg : tableStyle.rowAltBg, color: tableStyle.rowTextColor, height: tableStyle.rowHeight }}>
                      {visibleCols.map((c) => {
                        const baseTd: React.CSSProperties = {
                          textAlign: c.align as any,
                          borderTop: `1px solid ${tableStyle.borderColor}`,
                          background: c.bgColor || undefined,
                          color: c.textColor || undefined,
                          fontWeight: c.fontWeight as any,
                          padding: '0 8px',
                        };
                        const rowVals: Record<string, number | null> = {
                          cc: parseFloat(row.cc) || null,
                          ds: parseFloat(row.ds) || null,
                          exam: parseFloat(row.exam) || null,
                          oral: parseFloat(row.oral) || null,
                          tp: row.tp === '—' ? null : parseFloat(row.tp) || null,
                          moyenne: parseFloat(row.moy) || null,
                          coefficient: parseFloat(row.coef) || null,
                          points: parseFloat(row.points) || null,
                          credits: parseFloat(row.credits) || null,
                        };
                        let cellContent: React.ReactNode = '—';
                        if (c.key === 'custom_static') {
                          cellContent = c.staticValue ?? '—';
                        } else if (c.key === 'custom_formula') {
                          const r = evaluateFormula(c.formula || '', rowVals);
                          cellContent = r !== null ? r.toFixed(c.decimals ?? 2) + (c.suffix || '') : '—';
                        } else {
                          cellContent = c.key === 'module' ? row.mod
                            : c.key === 'coefficient' ? row.coef
                            : c.key === 'cc' ? row.cc
                            : c.key === 'ds' ? row.ds
                            : c.key === 'exam' ? row.exam
                            : c.key === 'oral' ? row.oral
                            : c.key === 'tp' ? row.tp
                            : c.key === 'moyenne' ? <strong>{row.moy}</strong>
                            : c.key === 'points' ? row.points
                            : c.key === 'credits' ? row.credits
                            : c.key === 'status' ? <span className="text-emerald-600 font-semibold text-[10px]">{row.status}</span>
                            : c.key === 'appreciation' ? <span className="italic text-[10px]">{row.appr}</span>
                            : '—';
                        }
                        return <td key={c.id} style={baseTd}>{cellContent}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* BODY */}
          <div className="relative" style={{ height: BODY_H }}>
            {bodyElements.map((el) => (
              <RenderedElement
                key={el.id} el={{ ...el, content: interpolate(el.content) }} selected={false}
                primaryColor={primaryColor} accentColor={accentColor}
                establishmentLogo={establishmentLogo} signatoriesPreview={signatoriesPreview}
                onMouseDown={() => {}} onResizeStart={() => {}}
              />
            ))}
          </div>

          {/* FOOTER */}
          <div className="relative" style={{ height: FOOTER_H }}>
            {footerElements.map((el) => (
              <RenderedElement
                key={el.id} el={{ ...el, content: interpolate(el.content) }} selected={false}
                primaryColor={primaryColor} accentColor={accentColor}
                establishmentLogo={establishmentLogo} signatoriesPreview={signatoriesPreview}
                onMouseDown={() => {}} onResizeStart={() => {}}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulletinLayoutEditor;
