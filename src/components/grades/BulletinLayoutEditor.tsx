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

export type BulletinElementType =
  | 'text'
  | 'variable'
  | 'image'
  | 'logo'
  | 'line'
  | 'rectangle'
  | 'qr_code'
  | 'signatures_block';

export interface BulletinElement {
  id: string;
  type: BulletinElementType;
  zone: 'header' | 'footer';
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
};

// ============================================================================
// Component
// ============================================================================

interface Props {
  headerElements: BulletinElement[];
  footerElements: BulletinElement[];
  onChange: (header: BulletinElement[], footer: BulletinElement[]) => void;
  primaryColor?: string;
  accentColor?: string;
  establishmentLogo?: string | null;
  signatoriesPreview?: Array<{ id: string; role_label: string; name: string | null; signature_image: string | null; is_stamp: boolean }>;
}

const BulletinLayoutEditor: React.FC<Props> = ({
  headerElements,
  footerElements,
  onChange,
  primaryColor = '#1e40af',
  accentColor = '#f59e0b',
  establishmentLogo,
  signatoriesPreview = [],
}) => {
  const [activeZone, setActiveZone] = useState<'header' | 'footer'>('header');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offX: number; offY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; startW: number; startH: number; startX: number; startY: number } | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const elements = activeZone === 'header' ? headerElements : footerElements;
  const setElements = useCallback((next: BulletinElement[]) => {
    if (activeZone === 'header') onChange(next, footerElements);
    else onChange(headerElements, next);
  }, [activeZone, headerElements, footerElements, onChange]);

  const canvasH = activeZone === 'header' ? HEADER_H : FOOTER_H;
  const canvasRef = activeZone === 'header' ? headerRef : footerRef;

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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
      {/* ====== LEFT : Canvas ====== */}
      <div className="space-y-3">
        {/* Zone tabs */}
        <Tabs value={activeZone} onValueChange={(v) => { setActiveZone(v as any); setSelectedId(null); }}>
          <TabsList className="bg-muted/50 p-1 h-auto">
            <TabsTrigger value="header" className="gap-2 px-4 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-3.5 w-3.5" /> En-tête
            </TabsTrigger>
            <TabsTrigger value="footer" className="gap-2 px-4 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <PenTool className="h-3.5 w-3.5" /> Pied de page
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Card className="rounded-2xl overflow-hidden">
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

                {/* Placeholder for body table when on header preview */}
                {activeZone === 'header' && (
                  <div className="absolute -bottom-7 left-0 right-0 text-center text-[10px] text-muted-foreground italic">
                    ↓ Tableau de notes (généré automatiquement) ↓
                  </div>
                )}
                {activeZone === 'footer' && (
                  <div className="absolute -top-7 left-0 right-0 text-center text-[10px] text-muted-foreground italic">
                    ↑ Tableau de notes (généré automatiquement) ↑
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ====== RIGHT : Properties panel ====== */}
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
}[t]);

export default BulletinLayoutEditor;
