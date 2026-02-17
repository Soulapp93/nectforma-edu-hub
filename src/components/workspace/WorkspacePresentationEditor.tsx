import React, { useState, useCallback, useRef, useEffect } from 'react';
import { WorkspaceDocument } from '@/services/workspaceService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  ArrowLeft, Save, Plus, Trash2, Copy, ChevronLeft, ChevronRight,
  Type, Image, Square, Circle, Play, Maximize, GripVertical,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, Palette
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

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
  shape?: 'rectangle' | 'circle' | 'rounded';
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
}

interface Slide {
  id: string;
  elements: SlideElement[];
  background: string;
}

const SLIDE_W = 960;
const SLIDE_H = 540;
const BG_COLORS = ['#ffffff', '#1e293b', '#0f172a', '#1e40af', '#7c3aed', '#dc2626', '#059669', '#f59e0b', '#f1f5f9', '#fef3c7'];

const newId = () => Math.random().toString(36).slice(2, 10);

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
  const canvasRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  const currentSlide = slides[currentSlideIndex] || slides[0];

  const updateSlide = useCallback((index: number, updates: Partial<Slide>) => {
    setSlides(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
  }, []);

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

  const addSlide = () => {
    const s: Slide = { id: newId(), elements: [], background: '#ffffff' };
    setSlides(prev => [...prev.slice(0, currentSlideIndex + 1), s, ...prev.slice(currentSlideIndex + 1)]);
    setCurrentSlideIndex(currentSlideIndex + 1);
    scheduleAutoSave();
  };

  const duplicateSlide = () => {
    const dup: Slide = { ...JSON.parse(JSON.stringify(currentSlide)), id: newId() };
    setSlides(prev => [...prev.slice(0, currentSlideIndex + 1), dup, ...prev.slice(currentSlideIndex + 1)]);
    setCurrentSlideIndex(currentSlideIndex + 1);
    scheduleAutoSave();
  };

  const deleteSlide = () => {
    if (slides.length <= 1) return;
    setSlides(prev => prev.filter((_, i) => i !== currentSlideIndex));
    setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
    scheduleAutoSave();
  };

  const addElement = (type: SlideElement['type'], shape?: SlideElement['shape']) => {
    const el: SlideElement = {
      id: newId(), type, x: 50, y: 50,
      width: type === 'text' ? 400 : 200,
      height: type === 'text' ? 60 : 200,
      content: type === 'text' ? 'Cliquez pour éditer' : undefined,
      shape: shape || (type === 'shape' ? 'rectangle' : undefined),
      fontSize: type === 'text' ? 24 : undefined,
      color: type === 'text' ? '#000000' : undefined,
      backgroundColor: type === 'shape' ? '#3b82f6' : undefined,
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

  const addImage = () => {
    const url = prompt("URL de l'image :");
    if (!url) return;
    const el: SlideElement = { id: newId(), type: 'image', x: 50, y: 50, width: 300, height: 200, src: url };
    updateSlide(currentSlideIndex, { elements: [...currentSlide.elements, el] });
    setSelectedElementId(el.id);
    scheduleAutoSave();
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
        updateElement(dragging.id, { x: Math.max(0, dragging.elX + dx), y: Math.max(0, dragging.elY + dy) });
      }
      if (resizing) {
        const dx = (e.clientX - resizing.startX) / scale;
        const dy = (e.clientY - resizing.startY) / scale;
        updateElement(resizing.id, { width: Math.max(40, resizing.elW + dx), height: Math.max(20, resizing.elH + dy) });
      }
    };

    const handleMouseUp = () => {
      if (dragging || resizing) scheduleAutoSave();
      setDragging(null);
      setResizing(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [dragging, resizing, updateElement, scheduleAutoSave]);

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
      outline: isSelected ? '2px solid hsl(var(--primary))' : 'none',
      outlineOffset: '2px',
    };

    if (el.type === 'text') {
      return (
        <div
          key={el.id}
          style={{ ...baseStyle, fontSize: el.fontSize, fontWeight: el.fontWeight, fontStyle: el.fontStyle, textAlign: (el.textAlign as any) || 'left', color: el.color, backgroundColor: el.backgroundColor || 'transparent' }}
          onMouseDown={interactive ? e => handleMouseDown(e, el.id) : undefined}
          onDoubleClick={interactive ? () => { setEditingTextId(el.id); setSelectedElementId(el.id); } : undefined}
        >
          {isEditing ? (
            <textarea
              autoFocus
              value={el.content || ''}
              onChange={e => { updateElement(el.id, { content: e.target.value }); }}
              onBlur={() => { setEditingTextId(null); scheduleAutoSave(); }}
              className="w-full h-full bg-transparent border-none outline-none resize-none"
              style={{ fontSize: 'inherit', fontWeight: 'inherit', fontStyle: 'inherit', textAlign: 'inherit', color: 'inherit' }}
            />
          ) : (
            <span className="whitespace-pre-wrap">{el.content}</span>
          )}
          {isSelected && interactive && (
            <div
              className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-primary rounded-full cursor-se-resize"
              onMouseDown={e => handleResizeStart(e, el.id)}
            />
          )}
        </div>
      );
    }

    if (el.type === 'image') {
      return (
        <div key={el.id} style={baseStyle} onMouseDown={interactive ? e => handleMouseDown(e, el.id) : undefined}>
          <img src={el.src} alt="" className="w-full h-full object-cover" draggable={false} />
          {isSelected && interactive && (
            <div className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-primary rounded-full cursor-se-resize" onMouseDown={e => handleResizeStart(e, el.id)} />
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
            borderRadius: el.shape === 'circle' ? '50%' : el.shape === 'rounded' ? '16px' : '0',
          }}
          onMouseDown={interactive ? e => handleMouseDown(e, el.id) : undefined}
        >
          {isSelected && interactive && (
            <div className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-primary rounded-full cursor-se-resize" onMouseDown={e => handleResizeStart(e, el.id)} />
          )}
        </div>
      );
    }

    return null;
  };

  // Fullscreen presentation
  if (isPresenting) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setCurrentSlideIndex(i => Math.min(i + 1, slides.length - 1))}>
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
        <div className="absolute bottom-4 right-4 text-white/50 text-sm">{currentSlideIndex + 1} / {slides.length} — Echap pour quitter</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={onClose}><ArrowLeft className="h-4 w-4" /></Button>
        <Input value={title} onChange={e => setTitle(e.target.value)} className="max-w-md border-none shadow-none text-lg font-semibold focus-visible:ring-0 px-1" placeholder="Titre" />
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground hidden sm:block">{saving ? 'Sauvegarde...' : 'Auto-sauvegarde activée'}</span>
        <Button size="sm" variant="outline" onClick={() => setIsPresenting(true)} className="gap-1.5">
          <Play className="h-4 w-4" /> Présenter
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
          <Save className="h-4 w-4" /> Sauvegarder
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-1.5 border-b bg-card/50 overflow-x-auto">
        <Button size="sm" variant="ghost" onClick={() => addElement('text')} className="text-xs gap-1"><Type className="h-3.5 w-3.5" /> Texte</Button>
        <Button size="sm" variant="ghost" onClick={addImage} className="text-xs gap-1"><Image className="h-3.5 w-3.5" /> Image</Button>
        <Button size="sm" variant="ghost" onClick={() => addElement('shape', 'rectangle')} className="text-xs gap-1"><Square className="h-3.5 w-3.5" /> Rectangle</Button>
        <Button size="sm" variant="ghost" onClick={() => addElement('shape', 'circle')} className="text-xs gap-1"><Circle className="h-3.5 w-3.5" /> Cercle</Button>
        <Button size="sm" variant="ghost" onClick={() => addElement('shape', 'rounded')} className="text-xs gap-1"><Square className="h-3.5 w-3.5" style={{ borderRadius: 4 }} /> Arrondi</Button>
        <div className="w-px h-5 bg-border mx-1" />
        {selectedElement && (
          <>
            {selectedElement.type === 'text' && (
              <>
                <button onClick={() => updateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' })} className={`p-1.5 rounded-md ${selectedElement.fontWeight === 'bold' ? 'bg-primary/10' : 'hover:bg-muted'}`}>
                  <Bold className="h-4 w-4" />
                </button>
                <button onClick={() => updateElement(selectedElement.id, { fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })} className={`p-1.5 rounded-md ${selectedElement.fontStyle === 'italic' ? 'bg-primary/10' : 'hover:bg-muted'}`}>
                  <Italic className="h-4 w-4" />
                </button>
                <button onClick={() => updateElement(selectedElement.id, { textAlign: 'left' })} className="p-1.5 rounded-md hover:bg-muted"><AlignLeft className="h-4 w-4" /></button>
                <button onClick={() => updateElement(selectedElement.id, { textAlign: 'center' })} className="p-1.5 rounded-md hover:bg-muted"><AlignCenter className="h-4 w-4" /></button>
                <button onClick={() => updateElement(selectedElement.id, { textAlign: 'right' })} className="p-1.5 rounded-md hover:bg-muted"><AlignRight className="h-4 w-4" /></button>
                <select value={selectedElement.fontSize || 24} onChange={e => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })} className="text-xs border rounded px-1 py-0.5 bg-background">
                  {[12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72].map(s => <option key={s} value={s}>{s}px</option>)}
                </select>
                <div className="w-px h-5 bg-border mx-1" />
              </>
            )}
            {(selectedElement.type === 'shape' || selectedElement.type === 'text') && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5 rounded-md hover:bg-muted" title="Couleur">
                    <Palette className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <div className="grid grid-cols-5 gap-1 p-2">
                    {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#000000', '#6b7280'].map(c => (
                      <button key={c} onClick={() => updateElement(selectedElement.id, selectedElement.type === 'text' ? { color: c } : { backgroundColor: c })} className="w-6 h-6 rounded border" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button size="sm" variant="ghost" onClick={deleteElement} className="text-xs text-destructive gap-1">
              <Trash2 className="h-3.5 w-3.5" /> Supprimer
            </Button>
          </>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Slides sidebar */}
        <div className="w-48 border-r bg-muted/30 overflow-y-auto p-2 space-y-2 hidden md:block">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={`cursor-pointer rounded-lg border-2 transition-all overflow-hidden ${i === currentSlideIndex ? 'border-primary shadow-md' : 'border-border hover:border-primary/30'}`}
              onClick={() => { setCurrentSlideIndex(i); setSelectedElementId(null); setEditingTextId(null); }}
            >
              <div className="relative" style={{ paddingBottom: '56.25%', background: slide.background }}>
                <div style={{ position: 'absolute', inset: 0, transform: `scale(${148 / SLIDE_W})`, transformOrigin: 'top left', width: SLIDE_W, height: SLIDE_H }}>
                  {slide.elements.map(el => renderElement(el, false))}
                </div>
              </div>
              <div className="text-xs text-center py-1 bg-background/80 text-muted-foreground">{i + 1}</div>
            </div>
          ))}
          <div className="flex gap-1 pt-1">
            <Button size="sm" variant="outline" onClick={addSlide} className="flex-1 text-xs gap-1"><Plus className="h-3 w-3" /></Button>
            <Button size="sm" variant="outline" onClick={duplicateSlide} className="text-xs"><Copy className="h-3 w-3" /></Button>
            <Button size="sm" variant="outline" onClick={deleteSlide} className="text-xs text-destructive" disabled={slides.length <= 1}><Trash2 className="h-3 w-3" /></Button>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-8" style={{ backgroundColor: '#e8e8e8' }}
          onClick={() => { setSelectedElementId(null); setEditingTextId(null); }}
        >
          <div
            ref={canvasRef}
            className="relative shadow-xl rounded-sm"
            style={{ width: '100%', maxWidth: '900px', aspectRatio: `${SLIDE_W}/${SLIDE_H}`, background: currentSlide.background, overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ position: 'absolute', inset: 0 }}>
              {/* Scale canvas contents */}
              <div style={{ width: SLIDE_W, height: SLIDE_H, transform: `scale(${(canvasRef.current?.getBoundingClientRect().width || SLIDE_W) / SLIDE_W})`, transformOrigin: 'top left' }}>
                {currentSlide.elements.map(el => renderElement(el, true))}
              </div>
            </div>
          </div>
        </div>

        {/* Properties panel */}
        <div className="w-56 border-l bg-card p-3 space-y-4 overflow-y-auto hidden lg:block">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Fond de diapositive</h4>
            <div className="grid grid-cols-5 gap-1">
              {BG_COLORS.map(c => (
                <button key={c} onClick={() => { updateSlide(currentSlideIndex, { background: c }); scheduleAutoSave(); }} className={`w-8 h-8 rounded border-2 ${currentSlide.background === c ? 'border-primary' : 'border-border'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
            <Input
              value={currentSlide.background}
              onChange={e => { updateSlide(currentSlideIndex, { background: e.target.value }); scheduleAutoSave(); }}
              className="mt-2 text-xs h-8"
              placeholder="#hex"
            />
          </div>

          {/* Mobile slide nav */}
          <div className="flex items-center justify-between md:hidden">
            <Button size="sm" variant="outline" onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))} disabled={currentSlideIndex === 0}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-medium">{currentSlideIndex + 1} / {slides.length}</span>
            <Button size="sm" variant="outline" onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))} disabled={currentSlideIndex === slides.length - 1}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspacePresentationEditor;
