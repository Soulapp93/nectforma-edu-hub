import React, { useState, useCallback, useRef, useEffect } from 'react';
import { WorkspaceDocument } from '@/services/workspaceService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  ArrowLeft, Save, Plus, Trash2, Copy, ChevronLeft, ChevronRight,
  Type, ImageIcon, Square, Circle, Play, Maximize, GripVertical,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, Palette,
  Layout, Shapes, Search, Upload, Undo2, Redo2, Download,
  Layers, Lock, Unlock, Eye, EyeOff, RotateCcw, Minus,
  ChevronDown, X, PanelLeftClose, PanelLeftOpen, Grid3X3,
} from 'lucide-react';
import {
  presentationTemplates, getPresentationCategories, getPresentationTemplatesByCategory,
  curatedImageCollections, textPresets, shapePresets, colorPalettes,
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
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  src?: string;
  shape?: 'rectangle' | 'circle' | 'rounded' | 'line';
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  fontFamily?: string;
  textAlign?: string;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  opacity?: number;
  rotation?: number;
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: string;
  borderColor?: string;
  borderWidth?: number;
}

interface Slide {
  id: string;
  elements: SlideElement[];
  background: string;
  backgroundImage?: string;
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
  const [resizing, setResizing] = useState<{ id: string; startX: number; startY: number; elW: number; elH: number } | null>(null);
  const [isPresenting, setIsPresenting] = useState(false);
  const [sidebarPanel, setSidebarPanel] = useState<SidebarPanel>('templates');
  const [showTemplateGallery, setShowTemplateGallery] = useState(() => {
    const s = doc.content?.slides;
    return !(Array.isArray(s) && s.length > 0 && s.some((sl: any) => sl.elements?.length > 0));
  });
  const [templateCategory, setTemplateCategory] = useState('Tous');
  const [imageCategory, setImageCategory] = useState('Business');
  const [imageSearch, setImageSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [history, setHistory] = useState<Slide[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canvasRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  const currentSlide = slides[currentSlideIndex] || slides[0];

  // History management
  const pushHistory = useCallback((newSlides: Slide[]) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, JSON.parse(JSON.stringify(newSlides))].slice(-30);
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setSlides(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setSlides(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
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
      ...s,
      elements: s.elements.map(el => el.id === elementId ? { ...el, ...updates } : el)
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
      if (e.key === 'Delete' && selectedElementId && !editingTextId) {
        deleteElement();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedElementId, editingTextId, undo, redo]);

  const addSlide = () => {
    const s: Slide = { id: newId(), elements: [], background: '#ffffff' };
    const next = [...slides.slice(0, currentSlideIndex + 1), s, ...slides.slice(currentSlideIndex + 1)];
    setSlides(next);
    pushHistory(next);
    setCurrentSlideIndex(currentSlideIndex + 1);
    scheduleAutoSave();
  };

  const duplicateSlide = () => {
    const dup: Slide = { ...JSON.parse(JSON.stringify(currentSlide)), id: newId() };
    const next = [...slides.slice(0, currentSlideIndex + 1), dup, ...slides.slice(currentSlideIndex + 1)];
    setSlides(next);
    pushHistory(next);
    setCurrentSlideIndex(currentSlideIndex + 1);
    scheduleAutoSave();
  };

  const deleteSlide = () => {
    if (slides.length <= 1) return;
    const next = slides.filter((_, i) => i !== currentSlideIndex);
    setSlides(next);
    pushHistory(next);
    setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
    scheduleAutoSave();
  };

  const addElement = (type: SlideElement['type'], overrides?: Partial<SlideElement>) => {
    const el: SlideElement = {
      id: newId(), type,
      x: 80 + Math.random() * 100, y: 80 + Math.random() * 100,
      width: type === 'text' ? 400 : 200,
      height: type === 'text' ? 60 : 200,
      content: type === 'text' ? 'Cliquez pour éditer' : undefined,
      shape: type === 'shape' ? 'rectangle' : undefined,
      fontSize: type === 'text' ? 24 : undefined,
      color: type === 'text' ? '#000000' : undefined,
      backgroundColor: type === 'shape' ? '#3b82f6' : undefined,
      opacity: 1,
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

  const addImageElement = (url: string) => {
    addElement('image', { src: url, width: 300, height: 200 });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      addImageElement(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const applyTemplate = (template: PresentationTemplate) => {
    const newSlides = template.slides.map(s => ({
      ...s,
      id: newId(),
      elements: s.elements.map(el => ({ ...el, id: newId() }))
    }));
    setSlides(newSlides);
    pushHistory(newSlides);
    setCurrentSlideIndex(0);
    setShowTemplateGallery(false);
    scheduleAutoSave();
    toast.success(`Template "${template.name}" appliqué`);
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent, elId: string) => {
    if (editingTextId === elId) return;
    e.stopPropagation();
    const el = currentSlide.elements.find(e => e.id === elId);
    if (!el) return;
    setSelectedElementId(elId);
    setDragging({ id: elId, startX: e.clientX, startY: e.clientY, elX: el.x, elY: el.y });
  };

  const handleResizeStart = (e: React.MouseEvent, elId: string) => {
    e.stopPropagation();
    const el = currentSlide.elements.find(e => e.id === elId);
    if (!el) return;
    setResizing({ id: elId, startX: e.clientX, startY: e.clientY, elW: el.width, elH: el.height });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const scale = canvasRef.current.getBoundingClientRect().width / SLIDE_W;
      if (dragging) {
        const dx = (e.clientX - dragging.startX) / scale;
        const dy = (e.clientY - dragging.startY) / scale;
        updateElement(dragging.id, { x: dragging.elX + dx, y: dragging.elY + dy });
      }
      if (resizing) {
        const dx = (e.clientX - resizing.startX) / scale;
        const dy = (e.clientY - resizing.startY) / scale;
        updateElement(resizing.id, { width: Math.max(20, resizing.elW + dx), height: Math.max(10, resizing.elH + dy) });
      }
    };
    const handleMouseUp = () => {
      if (dragging || resizing) { pushHistory(slides); scheduleAutoSave(); }
      setDragging(null);
      setResizing(null);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [dragging, resizing, updateElement, scheduleAutoSave, pushHistory, slides]);

  // Presentation mode
  useEffect(() => {
    if (!isPresenting) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPresenting(false);
      if (e.key === 'ArrowRight' || e.key === ' ') setCurrentSlideIndex(i => Math.min(i + 1, slides.length - 1));
      if (e.key === 'ArrowLeft') setCurrentSlideIndex(i => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isPresenting, slides.length]);

  const selectedElement = selectedElementId ? currentSlide.elements.find(e => e.id === selectedElementId) : null;

  const renderElement = (el: SlideElement, interactive = true) => {
    const isSelected = interactive && selectedElementId === el.id;
    const isEditing = interactive && editingTextId === el.id;

    const baseStyle: React.CSSProperties = {
      position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height,
      cursor: interactive ? (isEditing ? 'text' : 'move') : 'default',
      outline: isSelected ? '2px solid #6366f1' : 'none',
      outlineOffset: '1px',
      opacity: el.opacity ?? 1,
      transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    };

    if (el.type === 'text') {
      return (
        <div
          key={el.id}
          style={{
            ...baseStyle,
            fontSize: el.fontSize,
            fontWeight: el.fontWeight,
            fontStyle: el.fontStyle,
            fontFamily: el.fontFamily || 'inherit',
            textAlign: (el.textAlign as any) || 'left',
            color: el.color,
            backgroundColor: el.backgroundColor || 'transparent',
            letterSpacing: el.letterSpacing,
            lineHeight: el.lineHeight,
            textTransform: el.textTransform as any,
          }}
          onMouseDown={interactive ? e => handleMouseDown(e, el.id) : undefined}
          onDoubleClick={interactive ? () => { setEditingTextId(el.id); setSelectedElementId(el.id); } : undefined}
        >
          {isEditing ? (
            <textarea
              autoFocus
              value={el.content || ''}
              onChange={e => updateElement(el.id, { content: e.target.value })}
              onBlur={() => { setEditingTextId(null); pushHistory(slides); scheduleAutoSave(); }}
              className="w-full h-full bg-transparent border-none outline-none resize-none"
              style={{ fontSize: 'inherit', fontWeight: 'inherit', fontStyle: 'inherit', textAlign: 'inherit', color: 'inherit', fontFamily: 'inherit', letterSpacing: 'inherit', lineHeight: 'inherit', textTransform: 'inherit' as any }}
            />
          ) : (
            <span className="whitespace-pre-wrap block w-full h-full overflow-hidden">{el.content}</span>
          )}
          {isSelected && interactive && (
            <div className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-indigo-500 rounded-full cursor-se-resize border-2 border-white shadow-sm" onMouseDown={e => handleResizeStart(e, el.id)} />
          )}
        </div>
      );
    }

    if (el.type === 'image') {
      return (
        <div key={el.id} style={baseStyle} onMouseDown={interactive ? e => handleMouseDown(e, el.id) : undefined}>
          <img src={el.src} alt="" className="w-full h-full object-cover" draggable={false} style={{ borderRadius: el.borderRadius }} />
          {isSelected && interactive && (
            <div className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-indigo-500 rounded-full cursor-se-resize border-2 border-white shadow-sm" onMouseDown={e => handleResizeStart(e, el.id)} />
          )}
        </div>
      );
    }

    if (el.type === 'shape') {
      return (
        <div
          key={el.id}
          style={{
            ...baseStyle,
            backgroundColor: el.backgroundColor || '#3b82f6',
            borderRadius: el.shape === 'circle' ? '50%' : el.shape === 'rounded' ? (el.borderRadius || 16) + 'px' : el.shape === 'line' ? 0 : '0',
            border: el.borderColor ? `${el.borderWidth || 1}px solid ${el.borderColor}` : undefined,
          }}
          onMouseDown={interactive ? e => handleMouseDown(e, el.id) : undefined}
        >
          {isSelected && interactive && (
            <div className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-indigo-500 rounded-full cursor-se-resize border-2 border-white shadow-sm" onMouseDown={e => handleResizeStart(e, el.id)} />
          )}
        </div>
      );
    }

    return null;
  };

  // ═══════════════════════════════════════════
  // TEMPLATE GALLERY (shown on new presentations)
  // ═══════════════════════════════════════════
  if (showTemplateGallery) {
    const categories = getPresentationCategories();
    const filteredTemplates = getPresentationTemplatesByCategory(templateCategory);

    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
        <div className="flex items-center gap-3 px-6 py-4 border-b bg-card">
          <Button variant="ghost" size="icon" onClick={onClose}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-xl font-bold">Créer une présentation</h1>
            <p className="text-sm text-muted-foreground">Choisissez un template pour commencer</p>
          </div>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => setShowTemplateGallery(false)}>
            Commencer vide
          </Button>
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setTemplateCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                templateCategory === cat
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Template grid */}
        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => applyTemplate(template)}
                className="group text-left rounded-xl border-2 border-border hover:border-primary/50 hover:shadow-lg transition-all overflow-hidden bg-card"
              >
                {/* Template preview */}
                <div className="relative aspect-video overflow-hidden" style={{ background: template.slides[0]?.background || '#fff' }}>
                  <div style={{
                    width: SLIDE_W, height: SLIDE_H,
                    transform: `scale(${220 / SLIDE_W})`,
                    transformOrigin: 'top left',
                    position: 'absolute', top: 0, left: 0,
                  }}>
                    {template.slides[0]?.elements.map(el => renderElement(el as any, false))}
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                      Utiliser ce template
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{template.thumbnail}</span>
                    <div>
                      <p className="text-sm font-semibold truncate">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
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
  // FULLSCREEN PRESENTATION MODE
  // ═══════════════════════════════════════════
  if (isPresenting) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center cursor-none" onClick={() => setCurrentSlideIndex(i => Math.min(i + 1, slides.length - 1))}>
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            width: SLIDE_W, height: SLIDE_H, position: 'absolute',
            left: '50%', top: '50%',
            transform: `translate(-50%, -50%) scale(${Math.min(window.innerWidth / SLIDE_W, window.innerHeight / SLIDE_H)})`,
            transformOrigin: 'center center',
            background: currentSlide.background,
          }}>
            {currentSlide.elements.map(el => renderElement(el, false))}
          </div>
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm text-white/70 text-sm px-4 py-2 rounded-full">
          <span>{currentSlideIndex + 1} / {slides.length}</span>
          <span className="text-white/40">·</span>
          <span>Échap pour quitter</span>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // SIDEBAR PANELS CONTENT
  // ═══════════════════════════════════════════
  const renderSidebarContent = () => {
    switch (sidebarPanel) {
      case 'templates':
        return (
          <div className="p-3 space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground px-1">Templates</h3>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {getPresentationCategories().map(cat => (
                <button key={cat} onClick={() => setTemplateCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${templateCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >{cat}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {getPresentationTemplatesByCategory(templateCategory).map(t => (
                <button key={t.id} onClick={() => applyTemplate(t)}
                  className="group rounded-lg border hover:border-primary/40 hover:shadow-md transition-all overflow-hidden bg-card text-left"
                >
                  <div className="relative aspect-video overflow-hidden" style={{ background: t.slides[0]?.background || '#fff' }}>
                    <div style={{ width: SLIDE_W, height: SLIDE_H, transform: `scale(${120 / SLIDE_W})`, transformOrigin: 'top left', position: 'absolute' }}>
                      {t.slides[0]?.elements.map(el => renderElement(el as any, false))}
                    </div>
                  </div>
                  <p className="text-xs font-medium px-2 py-1.5 truncate">{t.thumbnail} {t.name}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="p-3 space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground px-1">Styles de texte</h3>
            <div className="space-y-2">
              {textPresets.map((preset, i) => (
                <button key={i} onClick={() => addElement('text', {
                  content: preset.label,
                  fontSize: preset.fontSize,
                  fontWeight: preset.fontWeight,
                  fontStyle: (preset as any).fontStyle,
                  width: Math.min(preset.width, 800),
                  height: preset.height,
                  color: '#1e293b',
                })}
                  className="w-full text-left px-3 py-2.5 rounded-lg border hover:border-primary/40 hover:bg-accent/50 transition-all"
                >
                  <span style={{ fontSize: Math.min(preset.fontSize * 0.5, 28), fontWeight: preset.fontWeight, fontStyle: (preset as any).fontStyle }}>
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
            <div className="pt-2">
              <h4 className="text-xs font-semibold text-muted-foreground px-1 mb-2">Zone de texte libre</h4>
              <Button size="sm" variant="outline" className="w-full gap-2" onClick={() => addElement('text')}>
                <Type className="h-4 w-4" /> Ajouter un texte
              </Button>
            </div>
          </div>
        );

      case 'elements':
        return (
          <div className="p-3 space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground px-1">Formes</h3>
            <div className="grid grid-cols-2 gap-2">
              {shapePresets.map((preset, i) => (
                <button key={i} onClick={() => addElement('shape', {
                  shape: preset.shape,
                  width: preset.width,
                  height: preset.height,
                  backgroundColor: preset.backgroundColor,
                  borderRadius: preset.borderRadius,
                })}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg border hover:border-primary/40 hover:bg-accent/50 transition-all"
                >
                  <div
                    className="w-10 h-8"
                    style={{
                      backgroundColor: preset.backgroundColor,
                      borderRadius: preset.shape === 'circle' ? '50%' : preset.shape === 'rounded' ? (preset.borderRadius || 6) + 'px' : 0,
                      height: preset.shape === 'line' ? 3 : undefined,
                      marginTop: preset.shape === 'line' ? 12 : undefined,
                    }}
                  />
                  <span className="text-xs text-muted-foreground">{preset.label}</span>
                </button>
              ))}
            </div>
            <div className="pt-2">
              <h4 className="text-xs font-semibold text-muted-foreground px-1 mb-2">Palettes</h4>
              {colorPalettes.map((p, i) => (
                <div key={i} className="mb-2">
                  <p className="text-xs text-muted-foreground mb-1 px-1">{p.name}</p>
                  <div className="flex gap-1">
                    {p.colors.map((c, j) => (
                      <button key={j} onClick={() => {
                        if (selectedElement) {
                          updateElement(selectedElement.id,
                            selectedElement.type === 'text' ? { color: c } : { backgroundColor: c }
                          );
                          scheduleAutoSave();
                        }
                      }}
                        className="w-7 h-7 rounded-md border border-border hover:scale-110 transition-transform"
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
            <h3 className="text-sm font-semibold text-muted-foreground px-1">Images libres de droits</h3>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(curatedImageCollections).map(cat => (
                <button key={cat} onClick={() => setImageCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${imageCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >{cat}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(curatedImageCollections as any)[imageCategory]?.map((url: string, i: number) => (
                <button key={i} onClick={() => addImageElement(url.replace('w=400&h=300', 'w=960&h=540'))}
                  className="rounded-lg overflow-hidden border hover:border-primary/40 hover:shadow-md transition-all group"
                >
                  <img src={url} alt="" className="w-full aspect-video object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center pt-1">
              📸 Photos Unsplash — Libres de droits
            </p>
          </div>
        );

      case 'uploads':
        return (
          <div className="p-3 space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground px-1">Mes fichiers</h3>
            <label className="flex flex-col items-center gap-3 p-8 border-2 border-dashed rounded-xl hover:border-primary/40 hover:bg-accent/30 transition-all cursor-pointer">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Importer une image</span>
              <span className="text-xs text-muted-foreground/60">JPG, PNG, SVG, GIF</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => {
              const url = prompt("URL de l'image :");
              if (url) addImageElement(url);
            }}>
              <ImageIcon className="h-4 w-4" /> Depuis une URL
            </Button>
          </div>
        );

      default:
        return null;
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
  // MAIN EDITOR LAYOUT
  // ═══════════════════════════════════════════
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* ═══ TOP BAR ═══ */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-card shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><ArrowLeft className="h-4 w-4" /></Button>
        <Input value={title} onChange={e => setTitle(e.target.value)} className="max-w-xs border-none shadow-none text-base font-semibold focus-visible:ring-0 px-1 h-8" placeholder="Sans titre" />
        <div className="flex items-center gap-0.5 ml-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={historyIndex <= 0} title="Annuler"><Undo2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={historyIndex >= history.length - 1} title="Rétablir"><Redo2 className="h-4 w-4" /></Button>
        </div>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground hidden sm:block">{saving ? 'Sauvegarde...' : '✓ Sauvé'}</span>
        <Button size="sm" variant="outline" onClick={() => setShowTemplateGallery(true)} className="gap-1.5 h-8 text-xs">
          <Layout className="h-3.5 w-3.5" /> Templates
        </Button>
        <Button size="sm" variant="outline" onClick={() => setIsPresenting(true)} className="gap-1.5 h-8 text-xs">
          <Play className="h-3.5 w-3.5" /> Présenter
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 h-8 text-xs">
          <Save className="h-3.5 w-3.5" /> Sauvegarder
        </Button>
      </div>

      {/* ═══ CONTEXT TOOLBAR ═══ */}
      {selectedElement && (
        <div className="flex items-center gap-1 px-3 py-1 border-b bg-card/80 shrink-0 overflow-x-auto">
          {selectedElement.type === 'text' && (
            <>
              <select value={selectedElement.fontSize || 24} onChange={e => { updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) }); scheduleAutoSave(); }}
                className="text-xs border rounded px-1.5 py-1 bg-background h-7">
                {[12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 96].map(s => <option key={s} value={s}>{s}px</option>)}
              </select>
              <div className="w-px h-5 bg-border mx-0.5" />
              <button onClick={() => { updateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' }); scheduleAutoSave(); }}
                className={`p-1.5 rounded-md ${selectedElement.fontWeight === 'bold' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}><Bold className="h-3.5 w-3.5" /></button>
              <button onClick={() => { updateElement(selectedElement.id, { fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' }); scheduleAutoSave(); }}
                className={`p-1.5 rounded-md ${selectedElement.fontStyle === 'italic' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}><Italic className="h-3.5 w-3.5" /></button>
              <div className="w-px h-5 bg-border mx-0.5" />
              <button onClick={() => { updateElement(selectedElement.id, { textAlign: 'left' }); scheduleAutoSave(); }}
                className={`p-1.5 rounded-md ${selectedElement.textAlign === 'left' || !selectedElement.textAlign ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}><AlignLeft className="h-3.5 w-3.5" /></button>
              <button onClick={() => { updateElement(selectedElement.id, { textAlign: 'center' }); scheduleAutoSave(); }}
                className={`p-1.5 rounded-md ${selectedElement.textAlign === 'center' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}><AlignCenter className="h-3.5 w-3.5" /></button>
              <button onClick={() => { updateElement(selectedElement.id, { textAlign: 'right' }); scheduleAutoSave(); }}
                className={`p-1.5 rounded-md ${selectedElement.textAlign === 'right' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}><AlignRight className="h-3.5 w-3.5" /></button>
              <div className="w-px h-5 bg-border mx-0.5" />
              <div className="flex items-center gap-1">
                <label className="text-xs text-muted-foreground">Couleur</label>
                <input type="color" value={selectedElement.color || '#000000'} onChange={e => { updateElement(selectedElement.id, { color: e.target.value }); scheduleAutoSave(); }}
                  className="w-6 h-6 rounded cursor-pointer border-0" />
              </div>
              <div className="flex items-center gap-1">
                <label className="text-xs text-muted-foreground">Fond</label>
                <input type="color" value={selectedElement.backgroundColor || '#ffffff'} onChange={e => { updateElement(selectedElement.id, { backgroundColor: e.target.value }); scheduleAutoSave(); }}
                  className="w-6 h-6 rounded cursor-pointer border-0" />
              </div>
            </>
          )}
          {(selectedElement.type === 'shape' || selectedElement.type === 'image') && (
            <div className="flex items-center gap-1">
              <label className="text-xs text-muted-foreground">Couleur</label>
              <input type="color" value={selectedElement.backgroundColor || '#3b82f6'} onChange={e => { updateElement(selectedElement.id, { backgroundColor: e.target.value }); scheduleAutoSave(); }}
                className="w-6 h-6 rounded cursor-pointer border-0" />
            </div>
          )}
          <div className="w-px h-5 bg-border mx-0.5" />
          <div className="flex items-center gap-1">
            <label className="text-xs text-muted-foreground">Opacité</label>
            <input type="range" min="0" max="1" step="0.05" value={selectedElement.opacity ?? 1}
              onChange={e => { updateElement(selectedElement.id, { opacity: parseFloat(e.target.value) }); scheduleAutoSave(); }}
              className="w-16 h-1 accent-primary" />
            <span className="text-xs text-muted-foreground w-8">{Math.round((selectedElement.opacity ?? 1) * 100)}%</span>
          </div>
          <div className="flex-1" />
          <Button size="sm" variant="ghost" onClick={deleteElement} className="text-xs text-destructive gap-1 h-7">
            <Trash2 className="h-3.5 w-3.5" /> Supprimer
          </Button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ═══ LEFT SIDEBAR ICONS ═══ */}
        <div className="flex shrink-0">
          <div className="w-14 border-r bg-card flex flex-col items-center py-2 gap-0.5 shrink-0">
            {sidebarItems.map(item => (
              <button key={item.id}
                onClick={() => {
                  if (sidebarPanel === item.id && sidebarOpen) {
                    setSidebarOpen(false);
                    setSidebarPanel(null);
                  } else {
                    setSidebarPanel(item.id);
                    setSidebarOpen(true);
                  }
                }}
                className={`w-11 h-11 flex flex-col items-center justify-center rounded-lg transition-all gap-0.5 ${
                  sidebarPanel === item.id && sidebarOpen
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="text-[9px] leading-none font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          {/* ═══ LEFT SIDEBAR PANEL ═══ */}
          {sidebarOpen && sidebarPanel && (
            <div className="w-64 border-r bg-card overflow-hidden hidden md:block">
              <ScrollArea className="h-full">
                {renderSidebarContent()}
              </ScrollArea>
            </div>
          )}
        </div>

        {/* ═══ CENTER: CANVAS ═══ */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 md:p-8"
            style={{ backgroundColor: '#e5e5e5' }}
            onClick={() => { setSelectedElementId(null); setEditingTextId(null); }}
          >
            <div
              ref={canvasRef}
              className="relative shadow-2xl rounded-sm"
              style={{
                width: '100%', maxWidth: '860px',
                aspectRatio: `${SLIDE_W}/${SLIDE_H}`,
                background: currentSlide.background,
                overflow: 'hidden',
              }}
              onClick={e => e.stopPropagation()}
            >
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

          {/* ═══ BOTTOM: SLIDES STRIP ═══ */}
          <div className="h-28 border-t bg-card shrink-0 flex items-center gap-2 px-3 overflow-x-auto">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={addSlide} title="Nouvelle diapositive">
              <Plus className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {slides.map((slide, i) => (
                <div
                  key={slide.id}
                  className={`cursor-pointer rounded-lg border-2 transition-all overflow-hidden shrink-0 group relative ${
                    i === currentSlideIndex ? 'border-primary shadow-md' : 'border-border hover:border-primary/30'
                  }`}
                  style={{ width: 120 }}
                  onClick={() => { setCurrentSlideIndex(i); setSelectedElementId(null); setEditingTextId(null); }}
                >
                  <div className="relative" style={{ paddingBottom: '56.25%', background: slide.background }}>
                    <div style={{ position: 'absolute', inset: 0, transform: `scale(${120 / SLIDE_W})`, transformOrigin: 'top left', width: SLIDE_W, height: SLIDE_H }}>
                      {slide.elements.map(el => renderElement(el, false))}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5 font-medium">
                    {i + 1}
                  </div>
                  {/* Slide actions on hover */}
                  <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                    <button onClick={(e) => { e.stopPropagation(); setCurrentSlideIndex(i); duplicateSlide(); }}
                      className="w-5 h-5 rounded bg-black/50 text-white flex items-center justify-center hover:bg-black/70">
                      <Copy className="h-2.5 w-2.5" />
                    </button>
                    {slides.length > 1 && (
                      <button onClick={(e) => { e.stopPropagation(); setCurrentSlideIndex(i); setTimeout(deleteSlide, 0); }}
                        className="w-5 h-5 rounded bg-red-500/70 text-white flex items-center justify-center hover:bg-red-500">
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ RIGHT: PROPERTIES PANEL ═══ */}
        <div className="w-52 border-l bg-card overflow-y-auto hidden lg:block shrink-0">
          <div className="p-3 space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Fond de diapositive</h4>
              <div className="grid grid-cols-4 gap-1">
                {BG_COLORS.map(c => (
                  <button key={c} onClick={() => { updateSlide(currentSlideIndex, { background: c }); scheduleAutoSave(); }}
                    className={`w-full aspect-square rounded-md border-2 transition-all ${currentSlide.background === c ? 'border-primary scale-95' : 'border-border hover:border-primary/30'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="color" value={currentSlide.background} onChange={e => { updateSlide(currentSlideIndex, { background: e.target.value }); scheduleAutoSave(); }}
                  className="w-8 h-8 rounded cursor-pointer border-0" />
                <Input value={currentSlide.background} onChange={e => { updateSlide(currentSlideIndex, { background: e.target.value }); scheduleAutoSave(); }}
                  className="text-xs h-7 flex-1" placeholder="#hex" />
              </div>
            </div>

            {/* Slide info */}
            <div className="pt-2 border-t">
              <h4 className="text-xs font-semibold text-muted-foreground mb-1">Diapositive</h4>
              <p className="text-xs text-muted-foreground">{currentSlideIndex + 1} / {slides.length}</p>
              <p className="text-xs text-muted-foreground">{currentSlide.elements.length} éléments</p>
            </div>

            {/* Element-specific properties */}
            {selectedElement && (
              <div className="pt-2 border-t space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground">Propriétés</h4>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[10px] text-muted-foreground">X</label>
                    <Input type="number" value={Math.round(selectedElement.x)} onChange={e => { updateElement(selectedElement.id, { x: parseInt(e.target.value) || 0 }); scheduleAutoSave(); }}
                      className="text-xs h-7" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Y</label>
                    <Input type="number" value={Math.round(selectedElement.y)} onChange={e => { updateElement(selectedElement.id, { y: parseInt(e.target.value) || 0 }); scheduleAutoSave(); }}
                      className="text-xs h-7" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Largeur</label>
                    <Input type="number" value={Math.round(selectedElement.width)} onChange={e => { updateElement(selectedElement.id, { width: parseInt(e.target.value) || 20 }); scheduleAutoSave(); }}
                      className="text-xs h-7" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Hauteur</label>
                    <Input type="number" value={Math.round(selectedElement.height)} onChange={e => { updateElement(selectedElement.id, { height: parseInt(e.target.value) || 10 }); scheduleAutoSave(); }}
                      className="text-xs h-7" />
                  </div>
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="pt-2 border-t">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Actions</h4>
              <div className="space-y-1">
                <Button size="sm" variant="outline" onClick={addSlide} className="w-full text-xs gap-1.5 h-7">
                  <Plus className="h-3 w-3" /> Nouvelle diapositive
                </Button>
                <Button size="sm" variant="outline" onClick={duplicateSlide} className="w-full text-xs gap-1.5 h-7">
                  <Copy className="h-3 w-3" /> Dupliquer
                </Button>
                <Button size="sm" variant="outline" onClick={deleteSlide} className="w-full text-xs gap-1.5 h-7 text-destructive hover:text-destructive" disabled={slides.length <= 1}>
                  <Trash2 className="h-3 w-3" /> Supprimer
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
