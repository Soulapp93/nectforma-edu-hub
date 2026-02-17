import React, { useState, useCallback, useRef, useEffect } from 'react';
import { WorkspaceDocument } from '@/services/workspaceService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  ArrowLeft, Save, Plus, Trash2, Copy, Type, ImageIcon, Square, Play, Maximize,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, Layout, Shapes, Search, Upload,
  Undo2, Redo2, ChevronDown, X, Grid3X3, Underline, ZoomIn, ZoomOut,
  MousePointer, Move, Minimize2,
} from 'lucide-react';
import {
  presentationTemplates, getPresentationCategories, getPresentationTemplatesByCategory,
  searchPresentationTemplates, curatedImageCollections, textPresets, shapePresets, colorPalettes,
  type PresentationTemplate, type PresentationSlide, type PresentationElement
} from '@/data/presentationTemplates';

interface Props {
  document: WorkspaceDocument;
  onSave: (doc: WorkspaceDocument) => Promise<void>;
  onClose: () => void;
}

interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  x: number; y: number; width: number; height: number;
  content?: string; src?: string;
  shape?: string;
  fontSize?: number; fontWeight?: string; fontStyle?: string; fontFamily?: string;
  textAlign?: string; color?: string; backgroundColor?: string;
  borderRadius?: number; opacity?: number; rotation?: number;
  letterSpacing?: number; lineHeight?: number; textTransform?: string;
  borderColor?: string; borderWidth?: number;
  locked?: boolean; zIndex?: number;
  textDecoration?: string;
}

interface Slide {
  id: string;
  elements: SlideElement[];
  background: string;
  backgroundImage?: string;
  notes?: string;
  transition?: string;
}

type SidebarPanel = 'templates' | 'elements' | 'text' | 'images' | 'uploads' | null;

const SLIDE_W = 960;
const SLIDE_H = 540;
const newId = () => Math.random().toString(36).slice(2, 10);

const BG_COLORS = [
  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0',
  '#1e293b', '#0f172a', '#0c0a09', '#18181b',
  '#1e40af', '#7c3aed', '#dc2626', '#059669',
  '#f97316', '#06b6d4', '#ec4899', '#f59e0b',
  '#fef3c7', '#dcfce7', '#dbeafe', '#f3e8ff',
  '#0f0f23', '#1e1b4b', '#064e3b', '#450a0a',
  '#431407', '#500724', '#042f2e', '#451a03',
];

const FONT_FAMILIES = [
  'Inter', 'Arial', 'Georgia', 'Times New Roman', 'Courier New',
  'Verdana', 'Trebuchet MS', 'Impact', 'Comic Sans MS', 'Palatino',
];

const WorkspacePresentationEditor: React.FC<Props> = ({ document: doc, onSave, onClose }) => {
  const { userId } = useCurrentUser();
  const [title, setTitle] = useState(doc.title);
  const [saving, setSaving] = useState(false);
  const [slides, setSlides] = useState<Slide[]>(() => {
    const s = doc.content?.slides;
    if (Array.isArray(s) && s.length > 0) return s;
    return [{ id: newId(), elements: [], background: '#ffffff' }];
  });
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; elX: number; elY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; startX: number; startY: number; elW: number; elH: number; corner: string } | null>(null);
  const [isPresenting, setIsPresenting] = useState(false);
  const [presentSlideIndex, setPresentSlideIndex] = useState(0);
  const [sidebarPanel, setSidebarPanel] = useState<SidebarPanel>('templates');
  const [showTemplateGallery, setShowTemplateGallery] = useState(() => {
    const s = doc.content?.slides;
    return !(Array.isArray(s) && s.length > 0 && s.some((sl: any) => sl.elements?.length > 0));
  });
  const [templateCategory, setTemplateCategory] = useState('Tous');
  const [templateSearch, setTemplateSearch] = useState('');
  const [imageCategory, setImageCategory] = useState('Business');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [history, setHistory] = useState<Slide[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [canvasZoom, setCanvasZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [cursorHidden, setCursorHidden] = useState(false);
  const [slideNotes, setSlideNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const presentRef = useRef<HTMLDivElement>(null);
  const cursorTimer = useRef<NodeJS.Timeout | null>(null);

  const currentSlide = slides[currentSlideIndex] || slides[0];

  // History
  const pushHistory = useCallback((newSlides: Slide[]) => {
    setHistory(prev => [...prev.slice(0, historyIndex + 1), JSON.parse(JSON.stringify(newSlides))].slice(-50));
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) { setHistoryIndex(p => p - 1); setSlides(JSON.parse(JSON.stringify(history[historyIndex - 1]))); }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) { setHistoryIndex(p => p + 1); setSlides(JSON.parse(JSON.stringify(history[historyIndex + 1]))); }
  }, [history, historyIndex]);

  const updateSlide = useCallback((index: number, updates: Partial<Slide>) => {
    setSlides(prev => {
      const next = prev.map((s, i) => i === index ? { ...s, ...updates } : s);
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const updateElement = useCallback((elementId: string, updates: Partial<SlideElement>) => {
    setSlides(prev => prev.map((s, i) => i === currentSlideIndex ? {
      ...s, elements: s.elements.map(el => el.id === elementId ? { ...el, ...updates } : el)
    } : s));
  }, [currentSlideIndex]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave({ ...doc, title, content: { slides }, last_edited_by: userId || null });
      toast.success('Présentation sauvegardée');
    } catch { toast.error('Erreur de sauvegarde'); }
    finally { setSaving(false); }
  }, [doc, title, slides, onSave, userId]);

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(handleSave, 3000);
  }, [handleSave]);

  useEffect(() => () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isPresenting) return;
      if (e.key === 'Delete' && selectedElementId && !editingTextId) { deleteElement(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedElementId) { e.preventDefault(); duplicateElement(); }
      if (e.key === 'g' && !editingTextId) { setShowGrid(p => !p); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedElementId, editingTextId, undo, redo, isPresenting]);

  // Slide operations
  const addSlide = () => {
    const s: Slide = { id: newId(), elements: [], background: currentSlide.background || '#ffffff' };
    const next = [...slides.slice(0, currentSlideIndex + 1), s, ...slides.slice(currentSlideIndex + 1)];
    setSlides(next); pushHistory(next);
    setCurrentSlideIndex(currentSlideIndex + 1);
    scheduleAutoSave();
  };

  const duplicateSlide = () => {
    const dup: Slide = { ...JSON.parse(JSON.stringify(currentSlide)), id: newId() };
    const next = [...slides.slice(0, currentSlideIndex + 1), dup, ...slides.slice(currentSlideIndex + 1)];
    setSlides(next); pushHistory(next);
    setCurrentSlideIndex(currentSlideIndex + 1);
    scheduleAutoSave();
  };

  const deleteSlide = () => {
    if (slides.length <= 1) return;
    const next = slides.filter((_, i) => i !== currentSlideIndex);
    setSlides(next); pushHistory(next);
    setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
    scheduleAutoSave();
  };

  // Element operations
  const addElement = (type: SlideElement['type'], overrides?: Partial<SlideElement>) => {
    const el: SlideElement = {
      id: newId(), type,
      x: 80 + Math.random() * 100, y: 80 + Math.random() * 100,
      width: type === 'text' ? 400 : 200, height: type === 'text' ? 60 : 200,
      content: type === 'text' ? 'Cliquez pour éditer' : undefined,
      shape: type === 'shape' ? 'rectangle' : undefined,
      fontSize: type === 'text' ? 24 : undefined,
      color: type === 'text' ? '#000000' : undefined,
      backgroundColor: type === 'shape' ? '#3b82f6' : undefined,
      opacity: 1, zIndex: currentSlide.elements.length,
      ...overrides,
    };
    updateSlide(currentSlideIndex, { elements: [...currentSlide.elements, el] });
    setSelectedElementId(el.id);
    scheduleAutoSave();
  };

  const deleteElement = () => {
    if (!selectedElementId) return;
    updateSlide(currentSlideIndex, { elements: currentSlide.elements.filter(e => e.id !== selectedElementId) });
    setSelectedElementId(null);
    scheduleAutoSave();
  };

  const duplicateElement = () => {
    if (!selectedElementId) return;
    const el = currentSlide.elements.find(e => e.id === selectedElementId);
    if (!el) return;
    const dup = { ...el, id: newId(), x: el.x + 20, y: el.y + 20 };
    updateSlide(currentSlideIndex, { elements: [...currentSlide.elements, dup] });
    setSelectedElementId(dup.id);
    scheduleAutoSave();
  };

  const addImageElement = (url: string) => addElement('image', { src: url, width: 300, height: 200 });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => addImageElement(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const applyTemplate = (template: PresentationTemplate) => {
    const newSlides = template.slides.map(s => ({
      ...s, id: newId(), elements: s.elements.map(el => ({ ...el, id: newId() }))
    }));
    setSlides(newSlides); pushHistory(newSlides);
    setCurrentSlideIndex(0);
    setShowTemplateGallery(false);
    scheduleAutoSave();
    toast.success(`Template "${template.name}" appliqué`);
  };

  // Drag & resize handlers
  const handleMouseDown = (e: React.MouseEvent, elId: string) => {
    if (editingTextId === elId) return;
    e.stopPropagation();
    const el = currentSlide.elements.find(e => e.id === elId);
    if (!el || el.locked) return;
    setSelectedElementId(elId);
    setDragging({ id: elId, startX: e.clientX, startY: e.clientY, elX: el.x, elY: el.y });
  };

  const handleResizeStart = (e: React.MouseEvent, elId: string, corner: string = 'se') => {
    e.stopPropagation();
    const el = currentSlide.elements.find(e => e.id === elId);
    if (!el || el.locked) return;
    setResizing({ id: elId, startX: e.clientX, startY: e.clientY, elW: el.width, elH: el.height, corner });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const scale = canvasRef.current.getBoundingClientRect().width / SLIDE_W;
      if (dragging) {
        const dx = (e.clientX - dragging.startX) / scale;
        const dy = (e.clientY - dragging.startY) / scale;
        let newX = dragging.elX + dx;
        let newY = dragging.elY + dy;
        // Snap to grid
        if (showGrid) {
          newX = Math.round(newX / 20) * 20;
          newY = Math.round(newY / 20) * 20;
        }
        updateElement(dragging.id, { x: newX, y: newY });
      }
      if (resizing) {
        const dx = (e.clientX - resizing.startX) / scale;
        const dy = (e.clientY - resizing.startY) / scale;
        updateElement(resizing.id, {
          width: Math.max(20, resizing.elW + dx),
          height: Math.max(10, resizing.elH + dy)
        });
      }
    };
    const handleMouseUp = () => {
      if (dragging || resizing) { pushHistory(slides); scheduleAutoSave(); }
      setDragging(null); setResizing(null);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [dragging, resizing, updateElement, scheduleAutoSave, pushHistory, slides, showGrid]);

  // ═══════════════════════════════════════════
  // FULLSCREEN PRESENTATION MODE
  // ═══════════════════════════════════════════
  const startPresentation = useCallback(() => {
    setPresentSlideIndex(currentSlideIndex);
    setIsPresenting(true);
    // Request fullscreen
    try {
      document.documentElement.requestFullscreen?.();
    } catch {}
  }, [currentSlideIndex]);

  const exitPresentation = useCallback(() => {
    setIsPresenting(false);
    setCursorHidden(false);
    try {
      if (document.fullscreenElement) document.exitFullscreen?.();
    } catch {}
  }, []);

  // Presentation keyboard & mouse
  useEffect(() => {
    if (!isPresenting) return;
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exitPresentation();
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setPresentSlideIndex(i => Math.min(i + 1, slides.length - 1));
      }
      if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault();
        setPresentSlideIndex(i => Math.max(i - 1, 0));
      }
      if (e.key === 'Home') setPresentSlideIndex(0);
      if (e.key === 'End') setPresentSlideIndex(slides.length - 1);
    };
    const mouseHandler = () => {
      setCursorHidden(false);
      if (cursorTimer.current) clearTimeout(cursorTimer.current);
      cursorTimer.current = setTimeout(() => setCursorHidden(true), 3000);
    };
    const fsHandler = () => {
      if (!document.fullscreenElement && isPresenting) exitPresentation();
    };
    window.addEventListener('keydown', keyHandler);
    window.addEventListener('mousemove', mouseHandler);
    document.addEventListener('fullscreenchange', fsHandler);
    // Start cursor hide timer
    cursorTimer.current = setTimeout(() => setCursorHidden(true), 3000);
    return () => {
      window.removeEventListener('keydown', keyHandler);
      window.removeEventListener('mousemove', mouseHandler);
      document.removeEventListener('fullscreenchange', fsHandler);
      if (cursorTimer.current) clearTimeout(cursorTimer.current);
    };
  }, [isPresenting, slides.length, exitPresentation]);

  const selectedElement = selectedElementId ? currentSlide.elements.find(e => e.id === selectedElementId) : null;

  // Render element
  const renderElement = (el: SlideElement, interactive = true) => {
    const isSelected = interactive && selectedElementId === el.id;
    const isEditing = interactive && editingTextId === el.id;

    const baseStyle: React.CSSProperties = {
      position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height,
      cursor: interactive ? (el.locked ? 'not-allowed' : isEditing ? 'text' : 'move') : 'default',
      outline: isSelected ? '2px solid #6366f1' : 'none',
      outlineOffset: '1px',
      opacity: el.opacity ?? 1,
      transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
      zIndex: el.zIndex,
    };

    const resizeHandles = isSelected && interactive && !el.locked ? (
      <>
        <div className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-indigo-500 rounded-full cursor-se-resize border-2 border-white shadow-sm" onMouseDown={e => handleResizeStart(e, el.id, 'se')} />
        <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-indigo-500 rounded-full cursor-nw-resize border-2 border-white shadow-sm" onMouseDown={e => handleResizeStart(e, el.id, 'nw')} />
        <div className="absolute -right-1.5 -top-1.5 w-3 h-3 bg-indigo-500 rounded-full cursor-ne-resize border-2 border-white shadow-sm" onMouseDown={e => handleResizeStart(e, el.id, 'ne')} />
        <div className="absolute -left-1.5 -bottom-1.5 w-3 h-3 bg-indigo-500 rounded-full cursor-sw-resize border-2 border-white shadow-sm" onMouseDown={e => handleResizeStart(e, el.id, 'sw')} />
      </>
    ) : null;

    if (el.type === 'text') {
      return (
        <div key={el.id} style={{
          ...baseStyle, fontSize: el.fontSize, fontWeight: el.fontWeight, fontStyle: el.fontStyle,
          fontFamily: el.fontFamily || 'inherit', textAlign: (el.textAlign as any) || 'left',
          color: el.color, backgroundColor: el.backgroundColor || 'transparent',
          letterSpacing: el.letterSpacing, lineHeight: el.lineHeight,
          textTransform: el.textTransform as any, textDecoration: el.textDecoration,
        }}
          onMouseDown={interactive ? e => handleMouseDown(e, el.id) : undefined}
          onDoubleClick={interactive ? () => { setEditingTextId(el.id); setSelectedElementId(el.id); } : undefined}
        >
          {isEditing ? (
            <textarea autoFocus value={el.content || ''}
              onChange={e => updateElement(el.id, { content: e.target.value })}
              onBlur={() => { setEditingTextId(null); pushHistory(slides); scheduleAutoSave(); }}
              className="w-full h-full bg-transparent border-none outline-none resize-none"
              style={{ fontSize: 'inherit', fontWeight: 'inherit', fontStyle: 'inherit', textAlign: 'inherit', color: 'inherit', fontFamily: 'inherit', letterSpacing: 'inherit', lineHeight: 'inherit', textTransform: 'inherit' as any, textDecoration: 'inherit' }}
            />
          ) : (
            <span className="whitespace-pre-wrap block w-full h-full overflow-hidden">{el.content}</span>
          )}
          {resizeHandles}
        </div>
      );
    }

    if (el.type === 'image') {
      return (
        <div key={el.id} style={baseStyle} onMouseDown={interactive ? e => handleMouseDown(e, el.id) : undefined}>
          <img src={el.src} alt="" className="w-full h-full object-cover" draggable={false} style={{ borderRadius: el.borderRadius }} />
          {resizeHandles}
        </div>
      );
    }

    if (el.type === 'shape') {
      const shapeStyle: React.CSSProperties = {
        ...baseStyle,
        backgroundColor: el.backgroundColor || '#3b82f6',
        borderRadius: el.shape === 'circle' ? '50%' : el.shape === 'rounded' ? (el.borderRadius || 16) + 'px' : el.shape === 'line' ? 0 : '0',
        border: el.borderColor ? `${el.borderWidth || 1}px solid ${el.borderColor}` : undefined,
      };
      if (el.shape === 'diamond') {
        shapeStyle.transform = `${shapeStyle.transform || ''} rotate(45deg)`;
      }
      return (
        <div key={el.id} style={shapeStyle}
          onMouseDown={interactive ? e => handleMouseDown(e, el.id) : undefined}
        >
          {resizeHandles}
        </div>
      );
    }
    return null;
  };

  // ═══════════════════════════════════════════
  // FULLSCREEN PRESENTATION MODE RENDER
  // ═══════════════════════════════════════════
  if (isPresenting) {
    const pSlide = slides[presentSlideIndex] || slides[0];
    return (
      <div
        ref={presentRef}
        className="fixed inset-0 z-[99999] bg-black flex items-center justify-center select-none"
        style={{ cursor: cursorHidden ? 'none' : 'default' }}
        onClick={(e) => {
          const rect = (e.target as HTMLElement).getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          if (clickX > rect.width / 2) {
            setPresentSlideIndex(i => Math.min(i + 1, slides.length - 1));
          } else {
            setPresentSlideIndex(i => Math.max(i - 1, 0));
          }
        }}
      >
        <div style={{
          width: SLIDE_W, height: SLIDE_H, position: 'absolute',
          left: '50%', top: '50%',
          marginLeft: -SLIDE_W / 2, marginTop: -SLIDE_H / 2,
          transform: `scale(${Math.min(window.innerWidth / SLIDE_W, window.innerHeight / SLIDE_H)})`,
          transformOrigin: 'center center',
          background: pSlide.background,
        }}>
          {pSlide.elements.map(el => renderElement(el, false))}
        </div>

        {/* Presentation controls - auto-hide */}
        <div className={`absolute bottom-0 left-0 right-0 transition-opacity duration-500 ${cursorHidden ? 'opacity-0' : 'opacity-100'}`}>
          <div className="flex items-center justify-center gap-4 pb-6">
            <div className="flex items-center gap-3 bg-black/60 backdrop-blur-lg text-white/90 text-sm px-6 py-3 rounded-full shadow-2xl">
              <button onClick={(e) => { e.stopPropagation(); setPresentSlideIndex(i => Math.max(i - 1, 0)); }}
                className="hover:text-white disabled:opacity-30" disabled={presentSlideIndex === 0}>
                ‹
              </button>
              <span className="font-medium min-w-[60px] text-center">{presentSlideIndex + 1} / {slides.length}</span>
              <button onClick={(e) => { e.stopPropagation(); setPresentSlideIndex(i => Math.min(i + 1, slides.length - 1)); }}
                className="hover:text-white disabled:opacity-30" disabled={presentSlideIndex === slides.length - 1}>
                ›
              </button>
              <div className="w-px h-4 bg-white/20" />
              <button onClick={(e) => { e.stopPropagation(); exitPresentation(); }}
                className="hover:text-red-400 flex items-center gap-1">
                <Minimize2 className="h-3.5 w-3.5" /> Quitter
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-white/10 transition-opacity ${cursorHidden ? 'opacity-0' : 'opacity-100'}`}>
          <div className="h-full bg-white/60 transition-all duration-300" style={{ width: `${((presentSlideIndex + 1) / slides.length) * 100}%` }} />
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // TEMPLATE GALLERY
  // ═══════════════════════════════════════════
  if (showTemplateGallery) {
    const categories = getPresentationCategories();
    const filteredTemplates = templateSearch
      ? searchPresentationTemplates(templateSearch)
      : getPresentationTemplatesByCategory(templateCategory);

    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
        <div className="flex items-center gap-3 px-6 py-4 border-b bg-card">
          <Button variant="ghost" size="icon" onClick={onClose}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-xl font-bold">Créer une présentation</h1>
            <p className="text-sm text-muted-foreground">{presentationTemplates.length} templates disponibles</p>
          </div>
          <div className="flex-1" />
          {/* Search */}
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={templateSearch}
              onChange={e => setTemplateSearch(e.target.value)}
              placeholder="Rechercher un template..."
              className="pl-9 h-9"
            />
            {templateSearch && (
              <button onClick={() => setTemplateSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <Button variant="outline" onClick={() => setShowTemplateGallery(false)}>
            Commencer vide
          </Button>
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-1.5 px-6 py-3 border-b overflow-x-auto">
          {categories.map(cat => (
            <button key={cat} onClick={() => { setTemplateCategory(cat); setTemplateSearch(''); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                templateCategory === cat && !templateSearch
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >{cat}</button>
          ))}
        </div>

        {/* Results count */}
        {templateSearch && (
          <div className="px-6 py-2 text-sm text-muted-foreground">
            {filteredTemplates.length} résultat{filteredTemplates.length > 1 ? 's' : ''} pour "{templateSearch}"
          </div>
        )}

        {/* Template grid */}
        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredTemplates.map(template => (
              <button key={template.id} onClick={() => applyTemplate(template)}
                className="group text-left rounded-xl border-2 border-border hover:border-primary/50 hover:shadow-lg transition-all overflow-hidden bg-card"
              >
                <div className="relative aspect-video overflow-hidden" style={{ background: template.slides[0]?.background || '#fff' }}>
                  <div style={{
                    width: SLIDE_W, height: SLIDE_H,
                    transform: `scale(${180 / SLIDE_W})`,
                    transformOrigin: 'top left',
                    position: 'absolute', top: 0, left: 0,
                  }}>
                    {template.slides[0]?.elements.map(el => renderElement(el as any, false))}
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg">
                      Utiliser
                    </span>
                  </div>
                </div>
                <div className="p-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{template.thumbnail}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{template.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{template.category}</p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // SIDEBAR PANELS
  // ═══════════════════════════════════════════
  const renderSidebarContent = () => {
    switch (sidebarPanel) {
      case 'templates':
        return (
          <div className="p-3 space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground px-1">Templates</h3>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={templateSearch} onChange={e => setTemplateSearch(e.target.value)}
                placeholder="Rechercher..." className="pl-8 h-8 text-xs" />
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {getPresentationCategories().map(cat => (
                <button key={cat} onClick={() => { setTemplateCategory(cat); setTemplateSearch(''); }}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                    templateCategory === cat && !templateSearch ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >{cat}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(templateSearch ? searchPresentationTemplates(templateSearch) : getPresentationTemplatesByCategory(templateCategory)).slice(0, 20).map(t => (
                <button key={t.id} onClick={() => applyTemplate(t)}
                  className="group rounded-lg border hover:border-primary/40 hover:shadow-md transition-all overflow-hidden bg-card text-left"
                >
                  <div className="relative aspect-video overflow-hidden" style={{ background: t.slides[0]?.background || '#fff' }}>
                    <div style={{ width: SLIDE_W, height: SLIDE_H, transform: `scale(${110 / SLIDE_W})`, transformOrigin: 'top left', position: 'absolute' }}>
                      {t.slides[0]?.elements.map(el => renderElement(el as any, false))}
                    </div>
                  </div>
                  <p className="text-[10px] font-medium px-1.5 py-1 truncate">{t.thumbnail} {t.name}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setShowTemplateGallery(true)}
              className="w-full text-xs text-primary hover:underline py-2">
              Voir tous les {presentationTemplates.length} templates →
            </button>
          </div>
        );

      case 'text':
        return (
          <div className="p-3 space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground px-1">Styles de texte</h3>
            <div className="space-y-1.5">
              {textPresets.map((preset, i) => (
                <button key={i} onClick={() => addElement('text', {
                  content: preset.label, fontSize: preset.fontSize, fontWeight: preset.fontWeight,
                  fontStyle: (preset as any).fontStyle, width: Math.min(preset.width, 800), height: preset.height,
                  color: '#1e293b', textTransform: (preset as any).textTransform, letterSpacing: (preset as any).letterSpacing,
                })}
                  className="w-full text-left px-3 py-2 rounded-lg border hover:border-primary/40 hover:bg-accent/50 transition-all"
                >
                  <span style={{ fontSize: Math.min(preset.fontSize * 0.45, 24), fontWeight: preset.fontWeight, fontStyle: (preset as any).fontStyle }}>
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
            <Button size="sm" variant="outline" className="w-full gap-2 text-xs" onClick={() => addElement('text')}>
              <Type className="h-3.5 w-3.5" /> Texte libre
            </Button>
          </div>
        );

      case 'elements':
        return (
          <div className="p-3 space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground px-1">Formes</h3>
            <div className="grid grid-cols-3 gap-1.5">
              {shapePresets.map((preset, i) => (
                <button key={i} onClick={() => addElement('shape', {
                  shape: preset.shape, width: preset.width, height: preset.height,
                  backgroundColor: preset.backgroundColor, borderRadius: preset.borderRadius,
                  borderColor: (preset as any).borderColor, borderWidth: (preset as any).borderWidth,
                })}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg border hover:border-primary/40 hover:bg-accent/50 transition-all"
                >
                  <div className="w-8 h-6" style={{
                    backgroundColor: preset.backgroundColor === 'transparent' ? undefined : preset.backgroundColor,
                    borderRadius: preset.shape === 'circle' ? '50%' : preset.shape === 'rounded' ? (preset.borderRadius || 6) + 'px' : 0,
                    height: preset.shape === 'line' ? 3 : undefined, marginTop: preset.shape === 'line' ? 10 : undefined,
                    border: (preset as any).borderColor ? `2px solid ${(preset as any).borderColor}` : undefined,
                  }} />
                  <span className="text-[9px] text-muted-foreground">{preset.label}</span>
                </button>
              ))}
            </div>
            <div className="pt-2">
              <h4 className="text-xs font-semibold text-muted-foreground px-1 mb-2">Palettes</h4>
              {colorPalettes.slice(0, 6).map((p, i) => (
                <div key={i} className="mb-2">
                  <p className="text-[10px] text-muted-foreground mb-1 px-1">{p.name}</p>
                  <div className="flex gap-0.5">
                    {p.colors.map((c, j) => (
                      <button key={j} onClick={() => {
                        if (selectedElement) {
                          updateElement(selectedElement.id, selectedElement.type === 'text' ? { color: c } : { backgroundColor: c });
                          scheduleAutoSave();
                        }
                      }}
                        className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'images':
        return (
          <div className="p-3 space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground px-1">Images libres</h3>
            <div className="flex flex-wrap gap-1">
              {Object.keys(curatedImageCollections).map(cat => (
                <button key={cat} onClick={() => setImageCategory(cat)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                    imageCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >{cat}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(curatedImageCollections as any)[imageCategory]?.map((url: string, i: number) => (
                <button key={i} onClick={() => addImageElement(url.replace('w=400&h=300', 'w=960&h=540'))}
                  className="rounded-lg overflow-hidden border hover:border-primary/40 hover:shadow-md transition-all group"
                >
                  <img src={url} alt="" className="w-full aspect-video object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center">📸 Unsplash — Libres de droits</p>
          </div>
        );

      case 'uploads':
        return (
          <div className="p-3 space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground px-1">Mes fichiers</h3>
            <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-xl hover:border-primary/40 hover:bg-accent/30 transition-all cursor-pointer">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Importer une image</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            <Button variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={() => {
              const url = prompt("URL de l'image :");
              if (url) addImageElement(url);
            }}>
              <ImageIcon className="h-3.5 w-3.5" /> Depuis une URL
            </Button>
          </div>
        );

      default: return null;
    }
  };

  const sidebarItems = [
    { id: 'templates' as const, icon: Layout, label: 'Templates' },
    { id: 'elements' as const, icon: Shapes, label: 'Éléments' },
    { id: 'text' as const, icon: Type, label: 'Texte' },
    { id: 'images' as const, icon: ImageIcon, label: 'Photos' },
    { id: 'uploads' as const, icon: Upload, label: 'Imports' },
  ];

  // ═══════════════════════════════════════════
  // MAIN EDITOR
  // ═══════════════════════════════════════════
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* TOP BAR */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b bg-card shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><ArrowLeft className="h-4 w-4" /></Button>
        <Input value={title} onChange={e => setTitle(e.target.value)}
          className="max-w-xs border-none shadow-none text-base font-semibold focus-visible:ring-0 px-1 h-8" placeholder="Sans titre" />
        <div className="flex items-center gap-0.5 ml-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={undo} disabled={historyIndex <= 0} title="Annuler (Ctrl+Z)"><Undo2 className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={redo} disabled={historyIndex >= history.length - 1} title="Rétablir (Ctrl+Y)"><Redo2 className="h-3.5 w-3.5" /></Button>
        </div>
        <div className="w-px h-5 bg-border mx-1" />
        {/* Zoom */}
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCanvasZoom(z => Math.max(50, z - 10))}><ZoomOut className="h-3.5 w-3.5" /></Button>
          <span className="text-xs text-muted-foreground w-10 text-center">{canvasZoom}%</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCanvasZoom(z => Math.min(200, z + 10))}><ZoomIn className="h-3.5 w-3.5" /></Button>
        </div>
        <Button variant={showGrid ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setShowGrid(p => !p)} title="Grille (G)">
          <Grid3X3 className="h-3.5 w-3.5" />
        </Button>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground hidden sm:block">{saving ? 'Sauvegarde...' : '✓ Sauvé'}</span>
        <Button size="sm" variant="outline" onClick={() => setShowTemplateGallery(true)} className="gap-1.5 h-7 text-xs">
          <Layout className="h-3 w-3" /> Templates
        </Button>
        <Button size="sm" variant="default" onClick={startPresentation} className="gap-1.5 h-7 text-xs bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 border-0">
          <Play className="h-3 w-3" /> Présenter
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 h-7 text-xs">
          <Save className="h-3 w-3" /> Sauvegarder
        </Button>
      </div>

      {/* CONTEXT TOOLBAR */}
      {selectedElement && (
        <div className="flex items-center gap-1 px-3 py-1 border-b bg-card/80 shrink-0 overflow-x-auto">
          {selectedElement.type === 'text' && (
            <>
              <select value={selectedElement.fontFamily || 'Inter'} onChange={e => { updateElement(selectedElement.id, { fontFamily: e.target.value }); scheduleAutoSave(); }}
                className="text-xs border rounded px-1 py-0.5 bg-background h-6 max-w-[100px]">
                {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <select value={selectedElement.fontSize || 24} onChange={e => { updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) }); scheduleAutoSave(); }}
                className="text-xs border rounded px-1 py-0.5 bg-background h-6 w-14">
                {[10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 96, 120].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="w-px h-4 bg-border mx-0.5" />
              <button onClick={() => { updateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' }); scheduleAutoSave(); }}
                className={`p-1 rounded ${selectedElement.fontWeight === 'bold' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}><Bold className="h-3.5 w-3.5" /></button>
              <button onClick={() => { updateElement(selectedElement.id, { fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' }); scheduleAutoSave(); }}
                className={`p-1 rounded ${selectedElement.fontStyle === 'italic' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}><Italic className="h-3.5 w-3.5" /></button>
              <button onClick={() => { updateElement(selectedElement.id, { textDecoration: selectedElement.textDecoration === 'underline' ? 'none' : 'underline' }); scheduleAutoSave(); }}
                className={`p-1 rounded ${selectedElement.textDecoration === 'underline' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}><Underline className="h-3.5 w-3.5" /></button>
              <div className="w-px h-4 bg-border mx-0.5" />
              <button onClick={() => { updateElement(selectedElement.id, { textAlign: 'left' }); scheduleAutoSave(); }}
                className={`p-1 rounded ${!selectedElement.textAlign || selectedElement.textAlign === 'left' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}><AlignLeft className="h-3.5 w-3.5" /></button>
              <button onClick={() => { updateElement(selectedElement.id, { textAlign: 'center' }); scheduleAutoSave(); }}
                className={`p-1 rounded ${selectedElement.textAlign === 'center' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}><AlignCenter className="h-3.5 w-3.5" /></button>
              <button onClick={() => { updateElement(selectedElement.id, { textAlign: 'right' }); scheduleAutoSave(); }}
                className={`p-1 rounded ${selectedElement.textAlign === 'right' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}><AlignRight className="h-3.5 w-3.5" /></button>
              <div className="w-px h-4 bg-border mx-0.5" />
              <input type="color" value={selectedElement.color || '#000000'} onChange={e => { updateElement(selectedElement.id, { color: e.target.value }); scheduleAutoSave(); }}
                className="w-5 h-5 rounded cursor-pointer border-0" title="Couleur texte" />
              <input type="color" value={selectedElement.backgroundColor || '#ffffff'} onChange={e => { updateElement(selectedElement.id, { backgroundColor: e.target.value }); scheduleAutoSave(); }}
                className="w-5 h-5 rounded cursor-pointer border-0" title="Fond" />
            </>
          )}
          {(selectedElement.type === 'shape' || selectedElement.type === 'image') && (
            <>
              <span className="text-xs text-muted-foreground">Couleur</span>
              <input type="color" value={selectedElement.backgroundColor || '#3b82f6'} onChange={e => { updateElement(selectedElement.id, { backgroundColor: e.target.value }); scheduleAutoSave(); }}
                className="w-5 h-5 rounded cursor-pointer border-0" />
              {selectedElement.type === 'image' && (
                <>
                  <span className="text-xs text-muted-foreground ml-1">Bord</span>
                  <input type="range" min="0" max="50" value={selectedElement.borderRadius || 0}
                    onChange={e => { updateElement(selectedElement.id, { borderRadius: parseInt(e.target.value) }); scheduleAutoSave(); }}
                    className="w-14 h-1 accent-primary" />
                </>
              )}
            </>
          )}
          <div className="w-px h-4 bg-border mx-0.5" />
          <span className="text-[10px] text-muted-foreground">Opacité</span>
          <input type="range" min="0" max="1" step="0.05" value={selectedElement.opacity ?? 1}
            onChange={e => { updateElement(selectedElement.id, { opacity: parseFloat(e.target.value) }); scheduleAutoSave(); }}
            className="w-14 h-1 accent-primary" />
          <span className="text-[10px] text-muted-foreground w-6">{Math.round((selectedElement.opacity ?? 1) * 100)}%</span>
          <span className="text-[10px] text-muted-foreground ml-1">Rotation</span>
          <input type="range" min="0" max="360" value={selectedElement.rotation || 0}
            onChange={e => { updateElement(selectedElement.id, { rotation: parseInt(e.target.value) }); scheduleAutoSave(); }}
            className="w-14 h-1 accent-primary" />
          <div className="flex-1" />
          <Button size="sm" variant="ghost" onClick={duplicateElement} className="text-xs gap-1 h-6 px-2">
            <Copy className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={deleteElement} className="text-xs text-destructive gap-1 h-6 px-2">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR ICONS */}
        <div className="flex shrink-0">
          <div className="w-12 border-r bg-card flex flex-col items-center py-2 gap-0.5 shrink-0">
            {sidebarItems.map(item => (
              <button key={item.id}
                onClick={() => {
                  if (sidebarPanel === item.id && sidebarOpen) { setSidebarOpen(false); setSidebarPanel(null); }
                  else { setSidebarPanel(item.id); setSidebarOpen(true); }
                }}
                className={`w-10 h-10 flex flex-col items-center justify-center rounded-lg transition-all gap-0.5 ${
                  sidebarPanel === item.id && sidebarOpen ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="text-[8px] leading-none font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          {/* SIDEBAR PANEL */}
          {sidebarOpen && sidebarPanel && (
            <div className="w-60 border-r bg-card overflow-hidden hidden md:block">
              <ScrollArea className="h-full">{renderSidebarContent()}</ScrollArea>
            </div>
          )}
        </div>

        {/* CENTER: CANVAS */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 md:p-8"
            style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}
            onClick={() => { setSelectedElementId(null); setEditingTextId(null); }}
          >
            <div
              ref={canvasRef}
              className="relative shadow-2xl rounded-sm"
              style={{
                width: `${860 * canvasZoom / 100}px`,
                aspectRatio: `${SLIDE_W}/${SLIDE_H}`,
                background: currentSlide.background,
                overflow: 'hidden',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Grid overlay */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none z-50" style={{
                  backgroundImage: 'linear-gradient(rgba(99,102,241,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.1) 1px, transparent 1px)',
                  backgroundSize: `${20 * (canvasRef.current?.getBoundingClientRect().width || SLIDE_W) / SLIDE_W}px ${20 * (canvasRef.current?.getBoundingClientRect().width || SLIDE_W) / SLIDE_W}px`,
                }} />
              )}
              <div style={{ position: 'absolute', inset: 0 }}>
                <div style={{
                  width: SLIDE_W, height: SLIDE_H,
                  transform: `scale(${(canvasRef.current?.getBoundingClientRect().width || SLIDE_W) / SLIDE_W})`,
                  transformOrigin: 'top left',
                }}>
                  {currentSlide.elements.map(el => renderElement(el, true))}
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM: SLIDES STRIP */}
          <div className="h-24 border-t bg-card shrink-0 flex items-center gap-2 px-3 overflow-x-auto">
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={addSlide} title="Nouvelle diapositive">
              <Plus className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {slides.map((slide, i) => (
                <div key={slide.id}
                  className={`cursor-pointer rounded-lg border-2 transition-all overflow-hidden shrink-0 group relative ${
                    i === currentSlideIndex ? 'border-primary shadow-md' : 'border-border hover:border-primary/30'
                  }`}
                  style={{ width: 110 }}
                  onClick={() => { setCurrentSlideIndex(i); setSelectedElementId(null); setEditingTextId(null); }}
                >
                  <div className="relative" style={{ paddingBottom: '56.25%', background: slide.background }}>
                    <div style={{ position: 'absolute', inset: 0, transform: `scale(${110 / SLIDE_W})`, transformOrigin: 'top left', width: SLIDE_W, height: SLIDE_H }}>
                      {slide.elements.map(el => renderElement(el, false))}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center py-0.5 font-medium">
                    {i + 1}
                  </div>
                  <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                    <button onClick={(e) => { e.stopPropagation(); setCurrentSlideIndex(i); duplicateSlide(); }}
                      className="w-4 h-4 rounded bg-black/50 text-white flex items-center justify-center hover:bg-black/70">
                      <Copy className="h-2 w-2" />
                    </button>
                    {slides.length > 1 && (
                      <button onClick={(e) => { e.stopPropagation(); setCurrentSlideIndex(i); setTimeout(deleteSlide, 0); }}
                        className="w-4 h-4 rounded bg-red-500/70 text-white flex items-center justify-center hover:bg-red-500">
                        <Trash2 className="h-2 w-2" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: PROPERTIES PANEL */}
        <div className="w-48 border-l bg-card overflow-y-auto hidden lg:block shrink-0">
          <div className="p-3 space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Fond</h4>
              <div className="grid grid-cols-5 gap-1">
                {BG_COLORS.map(c => (
                  <button key={c} onClick={() => { updateSlide(currentSlideIndex, { background: c }); scheduleAutoSave(); }}
                    className={`w-full aspect-square rounded border-2 transition-all ${currentSlide.background === c ? 'border-primary scale-90' : 'border-border hover:border-primary/30'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="flex items-center gap-1 mt-2">
                <input type="color" value={currentSlide.background} onChange={e => { updateSlide(currentSlideIndex, { background: e.target.value }); scheduleAutoSave(); }}
                  className="w-6 h-6 rounded cursor-pointer border-0" />
                <Input value={currentSlide.background} onChange={e => { updateSlide(currentSlideIndex, { background: e.target.value }); scheduleAutoSave(); }}
                  className="text-xs h-6 flex-1" placeholder="#hex" />
              </div>
            </div>

            <div className="pt-2 border-t">
              <h4 className="text-xs font-semibold text-muted-foreground mb-1">Diapositive</h4>
              <p className="text-[10px] text-muted-foreground">{currentSlideIndex + 1} / {slides.length} · {currentSlide.elements.length} éléments</p>
            </div>

            {selectedElement && (
              <div className="pt-2 border-t space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground">Position & Taille</h4>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    ['X', 'x', selectedElement.x],
                    ['Y', 'y', selectedElement.y],
                    ['L', 'width', selectedElement.width],
                    ['H', 'height', selectedElement.height],
                  ].map(([label, key, val]) => (
                    <div key={key as string}>
                      <label className="text-[9px] text-muted-foreground">{label as string}</label>
                      <Input type="number" value={Math.round(val as number)}
                        onChange={e => { updateElement(selectedElement.id, { [key as string]: parseInt(e.target.value) || 0 }); scheduleAutoSave(); }}
                        className="text-xs h-6" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t">
              <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">Actions</h4>
              <div className="space-y-1">
                <Button size="sm" variant="outline" onClick={addSlide} className="w-full text-[10px] gap-1 h-6">
                  <Plus className="h-2.5 w-2.5" /> Nouvelle slide
                </Button>
                <Button size="sm" variant="outline" onClick={duplicateSlide} className="w-full text-[10px] gap-1 h-6">
                  <Copy className="h-2.5 w-2.5" /> Dupliquer
                </Button>
                <Button size="sm" variant="outline" onClick={deleteSlide} className="w-full text-[10px] gap-1 h-6 text-destructive hover:text-destructive" disabled={slides.length <= 1}>
                  <Trash2 className="h-2.5 w-2.5" /> Supprimer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspacePresentationEditor;
