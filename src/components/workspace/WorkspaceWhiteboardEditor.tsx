import React, { useState, useCallback, useRef, useEffect } from 'react';
import { WorkspaceDocument } from '@/services/workspaceService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft, Save, MousePointer, Pencil, Type, Square, Circle, Minus, Diamond,
  StickyNote, Trash2, Undo2, Redo2, ZoomIn, ZoomOut, Hand, Eraser,
  Share2, Users, Palette, Move, ArrowRight, Star, Triangle, Hexagon,
  Lock, Unlock, Copy, Layers, Grid3X3, Download, Image as ImageIcon
} from 'lucide-react';
import ShareDocumentModal from './ShareDocumentModal';

interface Props {
  document: WorkspaceDocument;
  onSave: (doc: WorkspaceDocument) => Promise<void>;
  onClose: () => void;
}

interface WhiteboardElement {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'diamond' | 'star' | 'line' | 'arrow' | 'text' | 'sticky' | 'freehand' | 'hexagon' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  content?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  fontSize?: number;
  fontWeight?: string;
  opacity?: number;
  zIndex?: number;
  locked?: boolean;
  points?: { x: number; y: number }[];
  stickyColor?: string;
  imageUrl?: string;
}

interface WhiteboardData {
  elements: WhiteboardElement[];
  background: string;
  gridVisible: boolean;
}

type Tool = 'select' | 'pan' | 'draw' | 'eraser' | 'rectangle' | 'circle' | 'triangle' | 'diamond' | 'star' | 'hexagon' | 'line' | 'arrow' | 'text' | 'sticky' | 'image';

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

const newId = () => Math.random().toString(36).slice(2, 10);

const STICKY_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#fed7aa', '#e9d5ff', '#fecaca', '#d9f99d'];

const EXTENDED_COLORS = [
  '#000000', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#ffffff',
  '#dc2626', '#ef4444', '#f87171', '#fca5a5',
  '#ea580c', '#f97316', '#fb923c', '#fdba74',
  '#ca8a04', '#eab308', '#facc15', '#fde047',
  '#16a34a', '#22c55e', '#4ade80', '#86efac',
  '#0891b2', '#06b6d4', '#22d3ee', '#67e8f9',
  '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd',
  '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd',
  '#c026d3', '#d946ef', '#e879f9', '#f0abfc',
  '#db2777', '#ec4899', '#f472b6', '#f9a8d4',
];

const BG_COLORS = ['#ffffff', '#f8fafc', '#f1f5f9', '#fafaf9', '#1e293b', '#0f172a', '#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3'];
const STROKE_WIDTHS = [1, 2, 3, 5, 8];

const RESIZE_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
const HANDLE_CURSORS: Record<ResizeHandle, string> = {
  nw: 'nwse-resize', n: 'ns-resize', ne: 'nesw-resize', e: 'ew-resize',
  se: 'nwse-resize', s: 'ns-resize', sw: 'nesw-resize', w: 'ew-resize',
};

const WorkspaceWhiteboardEditor: React.FC<Props> = ({ document: doc, onSave, onClose }) => {
  const { userId } = useCurrentUser();
  const [title, setTitle] = useState(doc.title);
  const [saving, setSaving] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const isOwner = doc.owner_id === userId;

  const [board, setBoard] = useState<WhiteboardData>(() => {
    const c = doc.content;
    if (c?.elements) return c as WhiteboardData;
    return { elements: [], background: '#ffffff', gridVisible: true };
  });

  const [tool, setTool] = useState<Tool>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; elX: number; elY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; handle: ResizeHandle; startX: number; startY: number; origX: number; origY: number; origW: number; origH: number } | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState<{ x: number; y: number }[]>([]);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawingShape, setDrawingShape] = useState<WhiteboardElement | null>(null);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentBgColor, setCurrentBgColor] = useState('#3b82f6');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [showGrid, setShowGrid] = useState(true);
  const [history, setHistory] = useState<WhiteboardData[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const canvasRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const pushHistory = useCallback((newBoard: WhiteboardData) => {
    setHistory(prev => [...prev.slice(0, historyIdx + 1), JSON.parse(JSON.stringify(newBoard))].slice(-50));
    setHistoryIdx(prev => prev + 1);
  }, [historyIdx]);

  const undo = useCallback(() => {
    if (historyIdx > 0) {
      setHistoryIdx(p => p - 1);
      setBoard(JSON.parse(JSON.stringify(history[historyIdx - 1])));
    }
  }, [history, historyIdx]);

  const redo = useCallback(() => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(p => p + 1);
      setBoard(JSON.parse(JSON.stringify(history[historyIdx + 1])));
    }
  }, [history, historyIdx]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave({ ...doc, title, content: board, last_edited_by: userId || null });
      toast.success('Tableau blanc sauvegardé');
    } catch { toast.error('Erreur de sauvegarde'); }
    finally { setSaving(false); }
  }, [doc, title, board, onSave, userId]);

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(handleSave, 3000);
  }, [handleSave]);

  useEffect(() => () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingTextId) return;
      if (e.key === 'Delete' && selectedId) { deleteElement(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedId) { e.preventDefault(); duplicateElement(); }
      if (e.key === 'v') setTool('select');
      if (e.key === 'h') setTool('pan');
      if (e.key === 'p') setTool('draw');
      if (e.key === 'r') setTool('rectangle');
      if (e.key === 'c') setTool('circle');
      if (e.key === 't') setTool('text');
      if (e.key === 'n') setTool('sticky');
      if (e.key === 'g') setShowGrid(p => !p);
      if (e.key === 'i') setTool('image');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, editingTextId, undo, redo]);

  const getCanvasCoords = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
    };
  };

  const addElement = (type: WhiteboardElement['type'], x: number, y: number, overrides?: Partial<WhiteboardElement>) => {
    const el: WhiteboardElement = {
      id: newId(), type, x, y,
      width: type === 'text' ? 200 : type === 'sticky' ? 200 : type === 'line' || type === 'arrow' ? 200 : type === 'image' ? 300 : 120,
      height: type === 'text' ? 40 : type === 'sticky' ? 200 : type === 'line' || type === 'arrow' ? 4 : type === 'image' ? 200 : 120,
      content: type === 'text' ? 'Texte' : type === 'sticky' ? '' : undefined,
      color: currentColor,
      backgroundColor: type === 'sticky' ? STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)] : ['rectangle', 'circle', 'triangle', 'diamond', 'star', 'hexagon'].includes(type) ? currentBgColor : undefined,
      borderColor: currentColor,
      borderWidth: strokeWidth,
      fontSize: type === 'text' ? 18 : type === 'sticky' ? 14 : undefined,
      opacity: 1,
      zIndex: board.elements.length,
      stickyColor: type === 'sticky' ? STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)] : undefined,
      ...overrides,
    };
    const newBoard = { ...board, elements: [...board.elements, el] };
    setBoard(newBoard);
    pushHistory(newBoard);
    setSelectedId(el.id);
    if (tool !== 'draw') setTool('select');
    scheduleAutoSave();
  };

  const updateElement = (id: string, updates: Partial<WhiteboardElement>) => {
    setBoard(prev => ({
      ...prev,
      elements: prev.elements.map(el => el.id === id ? { ...el, ...updates } : el)
    }));
    scheduleAutoSave();
  };

  const deleteElement = () => {
    if (!selectedId) return;
    const newBoard = { ...board, elements: board.elements.filter(e => e.id !== selectedId) };
    setBoard(newBoard);
    pushHistory(newBoard);
    setSelectedId(null);
    scheduleAutoSave();
  };

  const duplicateElement = () => {
    if (!selectedId) return;
    const el = board.elements.find(e => e.id === selectedId);
    if (!el) return;
    const dup = { ...el, id: newId(), x: el.x + 20, y: el.y + 20 };
    const newBoard = { ...board, elements: [...board.elements, dup] };
    setBoard(newBoard);
    pushHistory(newBoard);
    setSelectedId(dup.id);
    scheduleAutoSave();
  };

  // Image import handler
  const handleImageImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const maxW = 400;
        const ratio = img.width / img.height;
        const w = Math.min(img.width, maxW);
        const h = w / ratio;
        addElement('image', 100 + pan.x / zoom, 100 + pan.y / zoom, { imageUrl: dataUrl, width: w, height: h });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Resize logic
  const handleResizeStart = (e: React.MouseEvent, handle: ResizeHandle, el: WhiteboardElement) => {
    e.stopPropagation();
    e.preventDefault();
    const coords = getCanvasCoords(e);
    setResizing({
      id: el.id, handle,
      startX: coords.x, startY: coords.y,
      origX: el.x, origY: el.y, origW: el.width, origH: el.height,
    });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);

    if (tool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (tool === 'draw') {
      setDrawing(true);
      setDrawPoints([coords]);
      return;
    }

    if (tool === 'eraser') {
      const el = [...board.elements].reverse().find(el =>
        coords.x >= el.x && coords.x <= el.x + el.width &&
        coords.y >= el.y && coords.y <= el.y + el.height
      );
      if (el) {
        const newBoard = { ...board, elements: board.elements.filter(e => e.id !== el.id) };
        setBoard(newBoard);
        pushHistory(newBoard);
        scheduleAutoSave();
      }
      return;
    }

    if (['rectangle', 'circle', 'triangle', 'diamond', 'star', 'hexagon', 'line', 'arrow'].includes(tool)) {
      setDrawStart(coords);
      setDrawingShape({
        id: newId(), type: tool as WhiteboardElement['type'],
        x: coords.x, y: coords.y, width: 0, height: 0,
        backgroundColor: currentBgColor, borderColor: currentColor, borderWidth: strokeWidth,
        opacity: 1, zIndex: board.elements.length,
      });
      return;
    }

    if (tool === 'text') { addElement('text', coords.x, coords.y); return; }
    if (tool === 'sticky') { addElement('sticky', coords.x, coords.y); return; }
    if (tool === 'image') { imageInputRef.current?.click(); return; }

    // Select tool
    if (tool === 'select') {
      const el = [...board.elements].reverse().find(el =>
        coords.x >= el.x && coords.x <= el.x + el.width &&
        coords.y >= el.y && coords.y <= el.y + el.height
      );
      if (el && !el.locked) {
        setSelectedId(el.id);
        setDragging({ id: el.id, startX: coords.x, startY: coords.y, elX: el.x, elY: el.y });
      } else {
        setSelectedId(null);
        setEditingTextId(null);
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    const coords = getCanvasCoords(e);

    if (resizing) {
      const dx = coords.x - resizing.startX;
      const dy = coords.y - resizing.startY;
      let { origX, origY, origW, origH } = resizing;
      let newX = origX, newY = origY, newW = origW, newH = origH;

      const h = resizing.handle;
      if (h.includes('e')) { newW = Math.max(20, origW + dx); }
      if (h.includes('w')) { newW = Math.max(20, origW - dx); newX = origX + (origW - newW); }
      if (h.includes('s')) { newH = Math.max(20, origH + dy); }
      if (h.includes('n')) { newH = Math.max(20, origH - dy); newY = origY + (origH - newH); }

      updateElement(resizing.id, { x: newX, y: newY, width: newW, height: newH });
      return;
    }

    if (drawing && tool === 'draw') {
      setDrawPoints(prev => [...prev, coords]);
      return;
    }

    if (drawStart && drawingShape) {
      const w = coords.x - drawStart.x;
      const h = coords.y - drawStart.y;
      setDrawingShape(prev => prev ? {
        ...prev,
        x: w >= 0 ? drawStart.x : coords.x,
        y: h >= 0 ? drawStart.y : coords.y,
        width: Math.abs(w),
        height: Math.abs(h),
      } : null);
      return;
    }

    if (dragging) {
      const dx = coords.x - dragging.startX;
      const dy = coords.y - dragging.startY;
      updateElement(dragging.id, { x: dragging.elX + dx, y: dragging.elY + dy });
    }
  };

  const handleCanvasMouseUp = () => {
    if (isPanning) { setIsPanning(false); return; }

    if (resizing) {
      pushHistory(board);
      setResizing(null);
      return;
    }

    if (drawing && drawPoints.length > 1) {
      const minX = Math.min(...drawPoints.map(p => p.x));
      const minY = Math.min(...drawPoints.map(p => p.y));
      const maxX = Math.max(...drawPoints.map(p => p.x));
      const maxY = Math.max(...drawPoints.map(p => p.y));
      const el: WhiteboardElement = {
        id: newId(), type: 'freehand',
        x: minX, y: minY, width: maxX - minX || 1, height: maxY - minY || 1,
        points: drawPoints.map(p => ({ x: p.x - minX, y: p.y - minY })),
        color: currentColor, borderWidth: strokeWidth,
        opacity: 1, zIndex: board.elements.length,
      };
      const newBoard = { ...board, elements: [...board.elements, el] };
      setBoard(newBoard);
      pushHistory(newBoard);
      scheduleAutoSave();
    }
    setDrawing(false);
    setDrawPoints([]);

    if (drawingShape && drawingShape.width > 5 && drawingShape.height > 5) {
      const newBoard = { ...board, elements: [...board.elements, drawingShape] };
      setBoard(newBoard);
      pushHistory(newBoard);
      setSelectedId(drawingShape.id);
      scheduleAutoSave();
    }
    setDrawingShape(null);
    setDrawStart(null);

    if (dragging) {
      pushHistory(board);
      setDragging(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom(z => Math.max(0.1, Math.min(5, z - e.deltaY * 0.001)));
    } else {
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  };

  const selectedEl = selectedId ? board.elements.find(e => e.id === selectedId) : null;

  // Render resize handles for a selected element
  const renderResizeHandles = (el: WhiteboardElement) => {
    const size = 8;
    const half = size / 2;
    const positions: Record<ResizeHandle, { left: number; top: number }> = {
      nw: { left: -half, top: -half },
      n: { left: el.width / 2 - half, top: -half },
      ne: { left: el.width - half, top: -half },
      e: { left: el.width - half, top: el.height / 2 - half },
      se: { left: el.width - half, top: el.height - half },
      s: { left: el.width / 2 - half, top: el.height - half },
      sw: { left: -half, top: el.height - half },
      w: { left: -half, top: el.height / 2 - half },
    };

    return RESIZE_HANDLES.map(handle => (
      <div
        key={handle}
        onMouseDown={(e) => handleResizeStart(e, handle, el)}
        style={{
          position: 'absolute',
          left: positions[handle].left,
          top: positions[handle].top,
          width: size,
          height: size,
          backgroundColor: 'white',
          border: '2px solid hsl(var(--primary))',
          borderRadius: 2,
          cursor: HANDLE_CURSORS[handle],
          zIndex: 9999,
        }}
      />
    ));
  };

  const renderShape = (el: WhiteboardElement, isPreview = false) => {
    const style: React.CSSProperties = {
      position: 'absolute',
      left: el.x, top: el.y, width: el.width, height: el.height,
      opacity: el.opacity ?? 1,
      zIndex: el.zIndex ?? 0,
      transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    };

    const isSelected = !isPreview && selectedId === el.id;
    const outline = isSelected ? '2px solid hsl(var(--primary))' : 'none';

    const wrapWithResize = (content: React.ReactNode) => {
      if (!isSelected) return content;
      return (
        <div key={el.id} style={{ ...style, outline: 'none' }}>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Re-render inner content without absolute positioning */}
            {content}
            {renderResizeHandles(el)}
          </div>
        </div>
      );
    };

    switch (el.type) {
      case 'image':
        if (isSelected) {
          return (
            <div key={el.id} style={{ ...style, position: 'absolute' }}>
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <img src={el.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', outline, borderRadius: 4, cursor: 'move' }}
                  onClick={() => setSelectedId(el.id)} draggable={false} />
                {renderResizeHandles(el)}
              </div>
            </div>
          );
        }
        return (
          <img key={el.id} src={el.imageUrl} alt="" draggable={false}
            style={{ ...style, objectFit: 'contain', outline, borderRadius: 4, cursor: isPreview ? 'default' : 'move' }}
            onClick={() => !isPreview && setSelectedId(el.id)} />
        );

      case 'freehand': {
        if (!el.points || el.points.length < 2) return null;
        const d = el.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        return (
          <svg key={el.id} style={{ ...style, overflow: 'visible', pointerEvents: 'all' }}
            onClick={() => !isPreview && setSelectedId(el.id)}>
            <path d={d} fill="none" stroke={el.color || '#000'} strokeWidth={el.borderWidth || 2} strokeLinecap="round" strokeLinejoin="round" />
            {isSelected && <rect x="-2" y="-2" width={el.width + 4} height={el.height + 4} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />}
          </svg>
        );
      }
      case 'sticky':
        if (isSelected) {
          return (
            <div key={el.id} style={{ ...style, position: 'absolute' }}>
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <div style={{ width: '100%', height: '100%', backgroundColor: el.stickyColor || '#fef08a', outline, borderRadius: 4, boxShadow: '2px 4px 12px rgba(0,0,0,0.1)', padding: 12, cursor: 'move' }}
                  onClick={() => setSelectedId(el.id)}
                  onDoubleClick={() => setEditingTextId(el.id)}>
                  {editingTextId === el.id ? (
                    <textarea value={el.content || ''} autoFocus
                      onChange={e => updateElement(el.id, { content: e.target.value })}
                      onBlur={() => setEditingTextId(null)}
                      className="w-full h-full bg-transparent border-none outline-none resize-none"
                      style={{ fontSize: el.fontSize || 14, color: el.color || '#000' }} />
                  ) : (
                    <div style={{ fontSize: el.fontSize || 14, color: el.color || '#000', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {el.content || 'Double-cliquez pour écrire...'}
                    </div>
                  )}
                </div>
                {renderResizeHandles(el)}
              </div>
            </div>
          );
        }
        return (
          <div key={el.id} style={{ ...style, backgroundColor: el.stickyColor || '#fef08a', outline, borderRadius: 4, boxShadow: '2px 4px 12px rgba(0,0,0,0.1)', padding: 12, cursor: isPreview ? 'default' : 'move' }}
            onClick={() => !isPreview && setSelectedId(el.id)}
            onDoubleClick={() => !isPreview && setEditingTextId(el.id)}>
            {editingTextId === el.id ? (
              <textarea value={el.content || ''} autoFocus
                onChange={e => updateElement(el.id, { content: e.target.value })}
                onBlur={() => setEditingTextId(null)}
                className="w-full h-full bg-transparent border-none outline-none resize-none"
                style={{ fontSize: el.fontSize || 14, color: el.color || '#000' }} />
            ) : (
              <div style={{ fontSize: el.fontSize || 14, color: el.color || '#000', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {el.content || 'Double-cliquez pour écrire...'}
              </div>
            )}
          </div>
        );
      case 'text':
        if (isSelected) {
          return (
            <div key={el.id} style={{ ...style, position: 'absolute' }}>
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <div style={{ width: '100%', height: '100%', outline, cursor: 'move' }}
                  onClick={() => setSelectedId(el.id)}
                  onDoubleClick={() => setEditingTextId(el.id)}>
                  {editingTextId === el.id ? (
                    <input value={el.content || ''} autoFocus
                      onChange={e => updateElement(el.id, { content: e.target.value })}
                      onBlur={() => setEditingTextId(null)}
                      className="w-full bg-transparent border-none outline-none"
                      style={{ fontSize: el.fontSize || 18, fontWeight: el.fontWeight || 'normal', color: el.color || '#000' }} />
                  ) : (
                    <div style={{ fontSize: el.fontSize || 18, fontWeight: el.fontWeight || 'normal', color: el.color || '#000', whiteSpace: 'nowrap' }}>
                      {el.content || 'Texte'}
                    </div>
                  )}
                </div>
                {renderResizeHandles(el)}
              </div>
            </div>
          );
        }
        return (
          <div key={el.id} style={{ ...style, outline, cursor: isPreview ? 'default' : 'move' }}
            onClick={() => !isPreview && setSelectedId(el.id)}
            onDoubleClick={() => !isPreview && setEditingTextId(el.id)}>
            {editingTextId === el.id ? (
              <input value={el.content || ''} autoFocus
                onChange={e => updateElement(el.id, { content: e.target.value })}
                onBlur={() => setEditingTextId(null)}
                className="w-full bg-transparent border-none outline-none"
                style={{ fontSize: el.fontSize || 18, fontWeight: el.fontWeight || 'normal', color: el.color || '#000' }} />
            ) : (
              <div style={{ fontSize: el.fontSize || 18, fontWeight: el.fontWeight || 'normal', color: el.color || '#000', whiteSpace: 'nowrap' }}>
                {el.content || 'Texte'}
              </div>
            )}
          </div>
        );
      case 'rectangle':
        if (isSelected) {
          return (
            <div key={el.id} style={{ ...style, position: 'absolute' }}>
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <div style={{ width: '100%', height: '100%', backgroundColor: el.backgroundColor || '#3b82f6', border: `${el.borderWidth || 2}px solid ${el.borderColor || '#1e40af'}`, borderRadius: 4, outline, cursor: 'move' }}
                  onClick={() => setSelectedId(el.id)} />
                {renderResizeHandles(el)}
              </div>
            </div>
          );
        }
        return (
          <div key={el.id} style={{ ...style, backgroundColor: el.backgroundColor || '#3b82f6', border: `${el.borderWidth || 2}px solid ${el.borderColor || '#1e40af'}`, borderRadius: 4, outline, cursor: isPreview ? 'default' : 'move' }}
            onClick={() => !isPreview && setSelectedId(el.id)} />
        );
      case 'circle':
        if (isSelected) {
          return (
            <div key={el.id} style={{ ...style, position: 'absolute' }}>
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <div style={{ width: '100%', height: '100%', backgroundColor: el.backgroundColor || '#3b82f6', border: `${el.borderWidth || 2}px solid ${el.borderColor || '#1e40af'}`, borderRadius: '50%', outline, cursor: 'move' }}
                  onClick={() => setSelectedId(el.id)} />
                {renderResizeHandles(el)}
              </div>
            </div>
          );
        }
        return (
          <div key={el.id} style={{ ...style, backgroundColor: el.backgroundColor || '#3b82f6', border: `${el.borderWidth || 2}px solid ${el.borderColor || '#1e40af'}`, borderRadius: '50%', outline, cursor: isPreview ? 'default' : 'move' }}
            onClick={() => !isPreview && setSelectedId(el.id)} />
        );
      case 'triangle': {
        const svgContent = (
          <>
            <polygon points={`${el.width/2},0 ${el.width},${el.height} 0,${el.height}`}
              fill={el.backgroundColor || '#3b82f6'} stroke={el.borderColor || '#1e40af'} strokeWidth={el.borderWidth || 2} />
            {isSelected && <rect x="-2" y="-2" width={el.width + 4} height={el.height + 4} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />}
          </>
        );
        if (isSelected) {
          return (
            <div key={el.id} style={{ ...style, position: 'absolute' }}>
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <svg style={{ width: '100%', height: '100%', overflow: 'visible', cursor: 'move' }}
                  onClick={() => setSelectedId(el.id)}>
                  {svgContent}
                </svg>
                {renderResizeHandles(el)}
              </div>
            </div>
          );
        }
        return (
          <svg key={el.id} style={{ ...style, overflow: 'visible', cursor: isPreview ? 'default' : 'move' }}
            onClick={() => !isPreview && setSelectedId(el.id)}>
            {svgContent}
          </svg>
        );
      }
      case 'diamond': {
        const svgContent = (
          <>
            <polygon points={`${el.width/2},0 ${el.width},${el.height/2} ${el.width/2},${el.height} 0,${el.height/2}`}
              fill={el.backgroundColor || '#8b5cf6'} stroke={el.borderColor || '#6d28d9'} strokeWidth={el.borderWidth || 2} />
            {isSelected && <rect x="-2" y="-2" width={el.width + 4} height={el.height + 4} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />}
          </>
        );
        if (isSelected) {
          return (
            <div key={el.id} style={{ ...style, position: 'absolute' }}>
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <svg style={{ width: '100%', height: '100%', overflow: 'visible', cursor: 'move' }}
                  viewBox={`0 0 ${el.width} ${el.height}`}
                  onClick={() => setSelectedId(el.id)}>
                  {svgContent}
                </svg>
                {renderResizeHandles(el)}
              </div>
            </div>
          );
        }
        return (
          <svg key={el.id} style={{ ...style, overflow: 'visible', cursor: isPreview ? 'default' : 'move' }}
            onClick={() => !isPreview && setSelectedId(el.id)}>
            {svgContent}
          </svg>
        );
      }
      case 'star': {
        const starPoints = Array.from({ length: 10 }, (_, i) => {
          const angle = (Math.PI / 5) * i - Math.PI / 2;
          const r = i % 2 === 0 ? Math.min(el.width, el.height) / 2 : Math.min(el.width, el.height) / 4;
          return `${el.width/2 + r * Math.cos(angle)},${el.height/2 + r * Math.sin(angle)}`;
        }).join(' ');
        const svgContent = (
          <>
            <polygon points={starPoints} fill={el.backgroundColor || '#f59e0b'} stroke={el.borderColor || '#d97706'} strokeWidth={el.borderWidth || 2} />
            {isSelected && <rect x="-2" y="-2" width={el.width + 4} height={el.height + 4} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />}
          </>
        );
        if (isSelected) {
          return (
            <div key={el.id} style={{ ...style, position: 'absolute' }}>
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <svg style={{ width: '100%', height: '100%', overflow: 'visible', cursor: 'move' }}
                  viewBox={`0 0 ${el.width} ${el.height}`}
                  onClick={() => setSelectedId(el.id)}>
                  {svgContent}
                </svg>
                {renderResizeHandles(el)}
              </div>
            </div>
          );
        }
        return (
          <svg key={el.id} style={{ ...style, overflow: 'visible', cursor: isPreview ? 'default' : 'move' }}
            onClick={() => !isPreview && setSelectedId(el.id)}>
            {svgContent}
          </svg>
        );
      }
      case 'hexagon': {
        const hexPoints = Array.from({ length: 6 }, (_, i) => {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          return `${el.width/2 + el.width/2 * Math.cos(angle)},${el.height/2 + el.height/2 * Math.sin(angle)}`;
        }).join(' ');
        const svgContent = (
          <>
            <polygon points={hexPoints} fill={el.backgroundColor || '#06b6d4'} stroke={el.borderColor || '#0891b2'} strokeWidth={el.borderWidth || 2} />
            {isSelected && <rect x="-2" y="-2" width={el.width + 4} height={el.height + 4} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />}
          </>
        );
        if (isSelected) {
          return (
            <div key={el.id} style={{ ...style, position: 'absolute' }}>
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <svg style={{ width: '100%', height: '100%', overflow: 'visible', cursor: 'move' }}
                  viewBox={`0 0 ${el.width} ${el.height}`}
                  onClick={() => setSelectedId(el.id)}>
                  {svgContent}
                </svg>
                {renderResizeHandles(el)}
              </div>
            </div>
          );
        }
        return (
          <svg key={el.id} style={{ ...style, overflow: 'visible', cursor: isPreview ? 'default' : 'move' }}
            onClick={() => !isPreview && setSelectedId(el.id)}>
            {svgContent}
          </svg>
        );
      }
      case 'line':
      case 'arrow':
        if (isSelected) {
          return (
            <div key={el.id} style={{ ...style, position: 'absolute' }}>
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <svg style={{ width: '100%', height: '100%', overflow: 'visible', cursor: 'move' }}
                  onClick={() => setSelectedId(el.id)}>
                  <line x1="0" y1={el.height / 2} x2={el.width} y2={el.height / 2}
                    stroke={el.borderColor || '#000'} strokeWidth={el.borderWidth || 2} />
                  {el.type === 'arrow' && (
                    <polygon points={`${el.width},${el.height/2} ${el.width - 12},${el.height/2 - 6} ${el.width - 12},${el.height/2 + 6}`}
                      fill={el.borderColor || '#000'} />
                  )}
                  <rect x="-2" y="-2" width={el.width + 4} height={el.height + 4} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
                </svg>
                {renderResizeHandles(el)}
              </div>
            </div>
          );
        }
        return (
          <svg key={el.id} style={{ ...style, overflow: 'visible', cursor: isPreview ? 'default' : 'move' }}
            onClick={() => !isPreview && setSelectedId(el.id)}>
            <line x1="0" y1={el.height / 2} x2={el.width} y2={el.height / 2}
              stroke={el.borderColor || '#000'} strokeWidth={el.borderWidth || 2} />
            {el.type === 'arrow' && (
              <polygon points={`${el.width},${el.height/2} ${el.width - 12},${el.height/2 - 6} ${el.width - 12},${el.height/2 + 6}`}
                fill={el.borderColor || '#000'} />
            )}
          </svg>
        );
      default:
        return null;
    }
  };

  const tools_list: { id: Tool; icon: React.ReactNode; label: string; shortcut: string }[] = [
    { id: 'select', icon: <MousePointer className="h-4 w-4" />, label: 'Sélectionner', shortcut: 'V' },
    { id: 'pan', icon: <Hand className="h-4 w-4" />, label: 'Déplacer', shortcut: 'H' },
    { id: 'draw', icon: <Pencil className="h-4 w-4" />, label: 'Dessin libre', shortcut: 'P' },
    { id: 'eraser', icon: <Eraser className="h-4 w-4" />, label: 'Gomme', shortcut: 'E' },
    { id: 'text', icon: <Type className="h-4 w-4" />, label: 'Texte', shortcut: 'T' },
    { id: 'sticky', icon: <StickyNote className="h-4 w-4" />, label: 'Post-it', shortcut: 'N' },
    { id: 'image', icon: <ImageIcon className="h-4 w-4" />, label: 'Image', shortcut: 'I' },
    { id: 'rectangle', icon: <Square className="h-4 w-4" />, label: 'Rectangle', shortcut: 'R' },
    { id: 'circle', icon: <Circle className="h-4 w-4" />, label: 'Cercle', shortcut: 'C' },
    { id: 'triangle', icon: <Triangle className="h-4 w-4" />, label: 'Triangle', shortcut: '' },
    { id: 'diamond', icon: <Diamond className="h-4 w-4" />, label: 'Losange', shortcut: '' },
    { id: 'star', icon: <Star className="h-4 w-4" />, label: 'Étoile', shortcut: '' },
    { id: 'hexagon', icon: <Hexagon className="h-4 w-4" />, label: 'Hexagone', shortcut: '' },
    { id: 'line', icon: <Minus className="h-4 w-4" />, label: 'Ligne', shortcut: '' },
    { id: 'arrow', icon: <ArrowRight className="h-4 w-4" />, label: 'Flèche', shortcut: '' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Hidden image input */}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageImport} />

      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-card shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><ArrowLeft className="h-4 w-4" /></Button>
        <Input value={title} onChange={e => setTitle(e.target.value)}
          className="max-w-xs border-none shadow-none text-base font-semibold focus-visible:ring-0 px-1 h-8" placeholder="Sans titre" />
        <div className="flex items-center gap-0.5 ml-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={undo} disabled={historyIdx <= 0} title="Annuler (Ctrl+Z)"><Undo2 className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={redo} disabled={historyIdx >= history.length - 1} title="Rétablir (Ctrl+Y)"><Redo2 className="h-3.5 w-3.5" /></Button>
        </div>
        <div className="w-px h-5 bg-border mx-1" />
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}><ZoomOut className="h-3.5 w-3.5" /></Button>
          <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.min(5, z + 0.1))}><ZoomIn className="h-3.5 w-3.5" /></Button>
        </div>
        <Button variant={showGrid ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setShowGrid(p => !p)} title="Grille (G)">
          <Grid3X3 className="h-3.5 w-3.5" />
        </Button>
        <div className="flex-1" />
        {doc.is_shared && (
          <Badge variant="secondary" className="gap-1 text-xs h-6">
            <Users className="h-3 w-3" /> Partagé
          </Badge>
        )}
        <span className="text-xs text-muted-foreground hidden sm:block">{saving ? 'Sauvegarde...' : '✓ Sauvé'}</span>
        {isOwner && (
          <Button size="sm" variant="outline" onClick={() => setShowShareModal(true)} className="gap-1 h-7 text-xs">
            <Share2 className="h-3 w-3" /> Partager
          </Button>
        )}
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1 h-7 text-xs">
          <Save className="h-3 w-3" /> Sauver
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left toolbar */}
        <div className="w-12 border-r bg-card flex flex-col items-center py-2 gap-0.5 shrink-0 overflow-y-auto">
          {tools_list.map(t => (
            <button key={t.id} onClick={() => { setTool(t.id); if (t.id === 'image') imageInputRef.current?.click(); }}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0 ${tool === t.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground/70'}`}
              title={`${t.label}${t.shortcut ? ` (${t.shortcut})` : ''}`}>
              {t.icon}
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden relative"
          style={{ cursor: resizing ? HANDLE_CURSORS[resizing.handle] : tool === 'pan' ? 'grab' : tool === 'draw' ? 'crosshair' : tool === 'eraser' ? 'cell' : tool === 'select' ? 'default' : 'crosshair' }}>
          <div ref={canvasRef} className="absolute inset-0"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onWheel={handleWheel}>
            <div style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              position: 'absolute',
              width: '10000px',
              height: '10000px',
              background: board.background,
              backgroundImage: showGrid ? 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)' : 'none',
              backgroundSize: showGrid ? '20px 20px' : 'auto',
            }}>
              {board.elements.map(el => renderShape(el))}
              {drawingShape && renderShape(drawingShape, true)}
              {drawing && drawPoints.length > 1 && (
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                  <path d={drawPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                    fill="none" stroke={currentColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-56 border-l bg-card overflow-y-auto hidden md:block shrink-0">
          <div className="p-3 space-y-4">
            {/* Stroke Color */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Palette className="h-3 w-3" /> Couleur trait</h4>
              <div className="grid grid-cols-6 gap-1">
                {EXTENDED_COLORS.map(c => (
                  <button key={`stroke-${c}`} onClick={() => setCurrentColor(c)}
                    className={`w-full aspect-square rounded-md border-2 transition-all ${currentColor === c ? 'border-primary scale-90' : 'border-transparent hover:border-primary/30'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <label className="text-[10px] text-muted-foreground">Personnalisée:</label>
                <input type="color" value={currentColor} onChange={e => setCurrentColor(e.target.value)}
                  className="w-8 h-6 rounded border border-border cursor-pointer" />
                <span className="text-[10px] text-muted-foreground font-mono">{currentColor}</span>
              </div>
            </div>

            {/* Fill Color */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Remplissage</h4>
              <div className="grid grid-cols-6 gap-1">
                {EXTENDED_COLORS.map(c => (
                  <button key={`fill-${c}`} onClick={() => setCurrentBgColor(c)}
                    className={`w-full aspect-square rounded-md border-2 transition-all ${currentBgColor === c ? 'border-primary scale-90' : 'border-transparent hover:border-primary/30'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <label className="text-[10px] text-muted-foreground">Personnalisée:</label>
                <input type="color" value={currentBgColor} onChange={e => setCurrentBgColor(e.target.value)}
                  className="w-8 h-6 rounded border border-border cursor-pointer" />
                <span className="text-[10px] text-muted-foreground font-mono">{currentBgColor}</span>
              </div>
            </div>

            {/* Stroke Width */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Épaisseur</h4>
              <div className="flex items-center gap-1">
                {STROKE_WIDTHS.map(w => (
                  <button key={w} onClick={() => setStrokeWidth(w)}
                    className={`flex-1 h-8 rounded flex items-center justify-center transition-colors ${strokeWidth === w ? 'bg-primary/15 border border-primary' : 'hover:bg-muted border border-border'}`}>
                    <div className="rounded-full bg-foreground" style={{ width: w * 3 + 4, height: w * 3 + 4 }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Board Background */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Fond du tableau</h4>
              <div className="grid grid-cols-5 gap-1">
                {BG_COLORS.map(c => (
                  <button key={c} onClick={() => { setBoard(prev => ({ ...prev, background: c })); scheduleAutoSave(); }}
                    className={`w-full aspect-square rounded-md border-2 transition-all ${board.background === c ? 'border-primary scale-90' : 'border-border hover:border-primary/30'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <label className="text-[10px] text-muted-foreground">Personnalisée:</label>
                <input type="color" value={board.background} onChange={e => { setBoard(prev => ({ ...prev, background: e.target.value })); scheduleAutoSave(); }}
                  className="w-8 h-6 rounded border border-border cursor-pointer" />
              </div>
            </div>

            {/* Selected element properties */}
            {selectedEl && (
              <div className="pt-3 border-t space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground">Élément sélectionné</h4>

                {/* Size controls */}
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <label className="text-[10px] text-muted-foreground">Largeur</label>
                    <Input type="number" value={Math.round(selectedEl.width)} min={20}
                      onChange={e => updateElement(selectedEl.id, { width: parseInt(e.target.value) || 20 })}
                      className="h-7 text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Hauteur</label>
                    <Input type="number" value={Math.round(selectedEl.height)} min={20}
                      onChange={e => updateElement(selectedEl.id, { height: parseInt(e.target.value) || 20 })}
                      className="h-7 text-xs" />
                  </div>
                </div>

                {/* Element-specific color */}
                {['rectangle', 'circle', 'triangle', 'diamond', 'star', 'hexagon'].includes(selectedEl.type) && (
                  <div>
                    <label className="text-[10px] text-muted-foreground">Couleur de l'élément</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={selectedEl.backgroundColor || '#3b82f6'}
                        onChange={e => updateElement(selectedEl.id, { backgroundColor: e.target.value })}
                        className="w-8 h-6 rounded border border-border cursor-pointer" />
                      <input type="color" value={selectedEl.borderColor || '#000000'}
                        onChange={e => updateElement(selectedEl.id, { borderColor: e.target.value })}
                        className="w-8 h-6 rounded border border-border cursor-pointer" />
                      <span className="text-[10px] text-muted-foreground">Fond / Bord</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" onClick={duplicateElement} className="flex-1 text-[10px] gap-1 h-7">
                    <Copy className="h-3 w-3" /> Dupliquer
                  </Button>
                  <Button size="sm" variant="outline" onClick={deleteElement} className="flex-1 text-[10px] gap-1 h-7 text-destructive hover:text-destructive">
                    <Trash2 className="h-3 w-3" /> Supprimer
                  </Button>
                </div>
                <Button size="sm" variant="outline" onClick={() => updateElement(selectedEl.id, { locked: !selectedEl.locked })} className="w-full text-[10px] gap-1 h-7">
                  {selectedEl.locked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {selectedEl.locked ? 'Déverrouiller' : 'Verrouiller'}
                </Button>

                {selectedEl.type === 'sticky' && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">Couleur Post-it</h4>
                    <div className="grid grid-cols-4 gap-1">
                      {STICKY_COLORS.map(c => (
                        <button key={c} onClick={() => updateElement(selectedEl.id, { stickyColor: c })}
                          className={`w-full aspect-square rounded border-2 transition-all ${selectedEl.stickyColor === c ? 'border-primary' : 'border-border'}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <input type="color" value={selectedEl.stickyColor || '#fef08a'}
                        onChange={e => updateElement(selectedEl.id, { stickyColor: e.target.value })}
                        className="w-8 h-6 rounded border border-border cursor-pointer" />
                      <span className="text-[10px] text-muted-foreground">Couleur libre</span>
                    </div>
                  </div>
                )}

                {(selectedEl.type === 'text' || selectedEl.type === 'sticky') && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">Taille texte</h4>
                    <Input type="number" value={selectedEl.fontSize || 18} min={8} max={120}
                      onChange={e => updateElement(selectedEl.id, { fontSize: parseInt(e.target.value) || 18 })}
                      className="h-7 text-xs" />
                  </div>
                )}

                {/* Opacity */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">Opacité</h4>
                  <input type="range" min="0.1" max="1" step="0.05" value={selectedEl.opacity ?? 1}
                    onChange={e => updateElement(selectedEl.id, { opacity: parseFloat(e.target.value) })}
                    className="w-full h-1.5 accent-primary" />
                </div>
              </div>
            )}

            <div className="pt-3 border-t">
              <p className="text-[10px] text-muted-foreground">{board.elements.length} éléments · Zoom {Math.round(zoom * 100)}%</p>
            </div>
          </div>
        </div>
      </div>

      {userId && <ShareDocumentModal open={showShareModal} onOpenChange={setShowShareModal} documentId={doc.id} userId={userId} />}
    </div>
  );
};

export default WorkspaceWhiteboardEditor;
