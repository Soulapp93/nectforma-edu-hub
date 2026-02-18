import React, { useState, useCallback, useRef, useEffect } from 'react';
import { WorkspaceDocument } from '@/services/workspaceService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  ArrowLeft, Save, Type, Image, Square, Circle, Star, Triangle,
  Trash2, Bold, Italic, AlignLeft, AlignCenter, AlignRight, Palette,
  Layers, Copy, Download, ZoomIn, ZoomOut, Minus, LayoutTemplate
} from 'lucide-react';
import VisualTemplateGallery from './VisualTemplateGallery';
import { VisualTemplate } from '@/data/visualTemplates';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  document: WorkspaceDocument;
  onSave: (doc: WorkspaceDocument) => Promise<void>;
  onClose: () => void;
}

interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'rectangle' | 'circle' | 'triangle' | 'line';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  content?: string;
  src?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  zIndex?: number;
}

interface CanvasData {
  width: number;
  height: number;
  background: string;
  elements: CanvasElement[];
}

const PRESET_SIZES = [
  { label: 'Post Instagram', w: 1080, h: 1080 },
  { label: 'Story Instagram', w: 1080, h: 1920 },
  { label: 'Bannière LinkedIn', w: 1584, h: 396 },
  { label: 'Post LinkedIn', w: 1200, h: 627 },
  { label: 'Miniature YouTube', w: 1280, h: 720 },
  { label: 'Affiche A4', w: 794, h: 1123 },
  { label: 'Carte de visite', w: 1050, h: 600 },
  { label: 'Présentation 16:9', w: 1920, h: 1080 },
];

const SHAPE_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#000000', '#ffffff', '#6b7280', '#1e293b'];
const BG_PRESETS = ['#ffffff', '#f1f5f9', '#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3', '#1e293b', '#0f172a', '#18181b', '#fef2f2'];

const newId = () => Math.random().toString(36).slice(2, 10);

const WorkspaceVisualEditor: React.FC<Props> = ({ document: doc, onSave, onClose }) => {
  const { userId } = useCurrentUser();
  const [title, setTitle] = useState(doc.title);
  const [saving, setSaving] = useState(false);
  const [canvas, setCanvas] = useState<CanvasData>(() => {
    const c = doc.content;
    if (c?.elements) return c as CanvasData;
    return { width: 1080, height: 1080, background: '#ffffff', elements: [] };
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; elX: number; elY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; startX: number; startY: number; elW: number; elH: number } | null>(null);
  const [zoom, setZoom] = useState(0.5);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setCanvas(prev => ({ ...prev, elements: prev.elements.map(el => el.id === id ? { ...el, ...updates } : el) }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave({ ...doc, title, content: canvas, last_edited_by: userId || null });
      toast.success('Visuel sauvegardé');
    } catch { toast.error('Erreur de sauvegarde'); }
    finally { setSaving(false); }
  }, [doc, title, canvas, onSave, userId]);

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(handleSave, 3000);
  }, [handleSave]);

  const loadTemplate = useCallback((template: VisualTemplate) => {
    setCanvas({
      width: template.width,
      height: template.height,
      background: template.canvas.background,
      elements: template.canvas.elements.map(el => ({ ...el })),
    });
    setSelectedId(null);
    setEditingTextId(null);
    setShowTemplateGallery(false);
    scheduleAutoSave();
    toast.success(`Template "${template.name}" chargé`);
  }, [scheduleAutoSave]);

  useEffect(() => () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); }, []);

  const addElement = (type: CanvasElement['type']) => {
    const el: CanvasElement = {
      id: newId(), type, x: canvas.width / 4, y: canvas.height / 4,
      width: type === 'text' ? 400 : type === 'line' ? 300 : 200,
      height: type === 'text' ? 60 : type === 'line' ? 4 : 200,
      content: type === 'text' ? 'Texte ici' : undefined,
      fontSize: type === 'text' ? 32 : undefined,
      color: type === 'text' ? '#000000' : undefined,
      backgroundColor: type !== 'text' && type !== 'line' ? '#3b82f6' : type === 'line' ? '#000000' : undefined,
      opacity: 1,
      zIndex: canvas.elements.length,
    };
    setCanvas(prev => ({ ...prev, elements: [...prev.elements, el] }));
    setSelectedId(el.id);
    scheduleAutoSave();
  };

  const addImage = () => {
    const url = prompt("URL de l'image :");
    if (!url) return;
    const el: CanvasElement = {
      id: newId(), type: 'image', x: 50, y: 50, width: 300, height: 300,
      src: url, opacity: 1, zIndex: canvas.elements.length,
    };
    setCanvas(prev => ({ ...prev, elements: [...prev.elements, el] }));
    setSelectedId(el.id);
    scheduleAutoSave();
  };

  const deleteElement = () => {
    if (!selectedId) return;
    setCanvas(prev => ({ ...prev, elements: prev.elements.filter(e => e.id !== selectedId) }));
    setSelectedId(null);
    scheduleAutoSave();
  };

  const duplicateElement = () => {
    if (!selectedId) return;
    const el = canvas.elements.find(e => e.id === selectedId);
    if (!el) return;
    const dup = { ...el, id: newId(), x: el.x + 20, y: el.y + 20, zIndex: canvas.elements.length };
    setCanvas(prev => ({ ...prev, elements: [...prev.elements, dup] }));
    setSelectedId(dup.id);
    scheduleAutoSave();
  };

  const bringForward = () => {
    if (!selectedId) return;
    setCanvas(prev => {
      const sorted = [...prev.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      const idx = sorted.findIndex(e => e.id === selectedId);
      if (idx < sorted.length - 1) {
        const temp = sorted[idx].zIndex;
        sorted[idx] = { ...sorted[idx], zIndex: sorted[idx + 1].zIndex };
        sorted[idx + 1] = { ...sorted[idx + 1], zIndex: temp };
      }
      return { ...prev, elements: sorted };
    });
    scheduleAutoSave();
  };

  // Drag & resize
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (editingTextId === id) return;
    e.stopPropagation();
    const el = canvas.elements.find(e => e.id === id);
    if (!el) return;
    setSelectedId(id);
    setDragging({ id, startX: e.clientX, startY: e.clientY, elX: el.x, elY: el.y });
  };

  const handleResizeStart = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const el = canvas.elements.find(e => e.id === id);
    if (!el) return;
    setResizing({ id, startX: e.clientX, startY: e.clientY, elW: el.width, elH: el.height });
  };

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (dragging) {
        const dx = (e.clientX - dragging.startX) / zoom;
        const dy = (e.clientY - dragging.startY) / zoom;
        updateElement(dragging.id, { x: dragging.elX + dx, y: dragging.elY + dy });
      }
      if (resizing) {
        const dx = (e.clientX - resizing.startX) / zoom;
        const dy = (e.clientY - resizing.startY) / zoom;
        updateElement(resizing.id, { width: Math.max(20, resizing.elW + dx), height: Math.max(10, resizing.elH + dy) });
      }
    };
    const up = () => {
      if (dragging || resizing) scheduleAutoSave();
      setDragging(null);
      setResizing(null);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [dragging, resizing, zoom, updateElement, scheduleAutoSave]);

  const selectedEl = selectedId ? canvas.elements.find(e => e.id === selectedId) : null;

  const renderElement = (el: CanvasElement) => {
    const isSelected = selectedId === el.id;
    const isEditing = editingTextId === el.id;
    const base: React.CSSProperties = {
      position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height,
      opacity: el.opacity ?? 1, zIndex: el.zIndex ?? 0,
      cursor: isEditing ? 'text' : 'move',
      outline: isSelected ? '2px solid hsl(var(--primary))' : 'none', outlineOffset: '2px',
      transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    };

    if (el.type === 'text') {
      return (
        <div key={el.id} style={{ ...base, fontSize: el.fontSize, fontWeight: el.fontWeight, fontStyle: el.fontStyle, textAlign: (el.textAlign as any) || 'left', color: el.color }}
          onMouseDown={e => handleMouseDown(e, el.id)}
          onDoubleClick={() => { setEditingTextId(el.id); setSelectedId(el.id); }}
        >
          {isEditing ? (
            <textarea autoFocus value={el.content || ''} onChange={e => updateElement(el.id, { content: e.target.value })} onBlur={() => { setEditingTextId(null); scheduleAutoSave(); }}
              className="w-full h-full bg-transparent border-none outline-none resize-none" style={{ fontSize: 'inherit', fontWeight: 'inherit', fontStyle: 'inherit', textAlign: 'inherit', color: 'inherit' }} />
          ) : <span className="whitespace-pre-wrap">{el.content}</span>}
          {isSelected && <div className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-primary rounded-full cursor-se-resize" onMouseDown={e => handleResizeStart(e, el.id)} />}
        </div>
      );
    }
    if (el.type === 'image') {
      return (
        <div key={el.id} style={base} onMouseDown={e => handleMouseDown(e, el.id)}>
          <img src={el.src} alt="" className="w-full h-full object-cover" style={{ borderRadius: el.borderRadius }} draggable={false} />
          {isSelected && <div className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-primary rounded-full cursor-se-resize" onMouseDown={e => handleResizeStart(e, el.id)} />}
        </div>
      );
    }
    if (el.type === 'circle') {
      return (
        <div key={el.id} style={{ ...base, backgroundColor: el.backgroundColor, borderRadius: '50%', border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor || '#000'}` : undefined }}
          onMouseDown={e => handleMouseDown(e, el.id)}>
          {isSelected && <div className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-primary rounded-full cursor-se-resize" onMouseDown={e => handleResizeStart(e, el.id)} />}
        </div>
      );
    }
    if (el.type === 'triangle') {
      return (
        <div key={el.id} style={base} onMouseDown={e => handleMouseDown(e, el.id)}>
          <svg viewBox="0 0 100 100" className="w-full h-full"><polygon points="50,5 95,95 5,95" fill={el.backgroundColor || '#3b82f6'} /></svg>
          {isSelected && <div className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-primary rounded-full cursor-se-resize" onMouseDown={e => handleResizeStart(e, el.id)} />}
        </div>
      );
    }
    if (el.type === 'line') {
      return (
        <div key={el.id} style={{ ...base, backgroundColor: el.backgroundColor || '#000' }}
          onMouseDown={e => handleMouseDown(e, el.id)}>
          {isSelected && <div className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-primary rounded-full cursor-se-resize" onMouseDown={e => handleResizeStart(e, el.id)} />}
        </div>
      );
    }
    // rectangle
    return (
      <div key={el.id} style={{ ...base, backgroundColor: el.backgroundColor, borderRadius: el.borderRadius, border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor || '#000'}` : undefined }}
        onMouseDown={e => handleMouseDown(e, el.id)}>
        {isSelected && <div className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-primary rounded-full cursor-se-resize" onMouseDown={e => handleResizeStart(e, el.id)} />}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={onClose}><ArrowLeft className="h-4 w-4" /></Button>
        <Input value={title} onChange={e => setTitle(e.target.value)} className="max-w-md border-none shadow-none text-lg font-semibold focus-visible:ring-0 px-1" placeholder="Titre" />
        <Button size="sm" variant="outline" onClick={() => setShowTemplateGallery(true)} className="gap-1.5 text-xs">
          <LayoutTemplate className="h-4 w-4" /> Templates
        </Button>
        <div className="flex-1" />
        <Select value={`${canvas.width}x${canvas.height}`} onValueChange={v => { const [w, h] = v.split('x').map(Number); setCanvas(prev => ({ ...prev, width: w, height: h })); scheduleAutoSave(); }}>
          <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PRESET_SIZES.map(s => <SelectItem key={`${s.w}x${s.h}`} value={`${s.w}x${s.h}`}>{s.label} ({s.w}×{s.h})</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground hidden sm:block">{saving ? 'Sauvegarde...' : 'Auto-sauvegarde'}</span>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
          <Save className="h-4 w-4" /> Sauvegarder
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-1.5 border-b bg-card/50 overflow-x-auto">
        <Button size="sm" variant="ghost" onClick={() => addElement('text')} className="text-xs gap-1"><Type className="h-3.5 w-3.5" /> Texte</Button>
        <Button size="sm" variant="ghost" onClick={addImage} className="text-xs gap-1"><Image className="h-3.5 w-3.5" /> Image</Button>
        <Button size="sm" variant="ghost" onClick={() => addElement('rectangle')} className="text-xs gap-1"><Square className="h-3.5 w-3.5" /> Rectangle</Button>
        <Button size="sm" variant="ghost" onClick={() => addElement('circle')} className="text-xs gap-1"><Circle className="h-3.5 w-3.5" /> Cercle</Button>
        <Button size="sm" variant="ghost" onClick={() => addElement('triangle')} className="text-xs gap-1"><Triangle className="h-3.5 w-3.5" /> Triangle</Button>
        <Button size="sm" variant="ghost" onClick={() => addElement('line')} className="text-xs gap-1"><Minus className="h-3.5 w-3.5" /> Ligne</Button>
        <div className="w-px h-5 bg-border mx-1" />
        {selectedEl && (
          <>
            {selectedEl.type === 'text' && (
              <>
                <button onClick={() => updateElement(selectedEl.id, { fontWeight: selectedEl.fontWeight === 'bold' ? 'normal' : 'bold' })} className={`p-1.5 rounded-md ${selectedEl.fontWeight === 'bold' ? 'bg-primary/10' : 'hover:bg-muted'}`}><Bold className="h-4 w-4" /></button>
                <button onClick={() => updateElement(selectedEl.id, { fontStyle: selectedEl.fontStyle === 'italic' ? 'normal' : 'italic' })} className={`p-1.5 rounded-md ${selectedEl.fontStyle === 'italic' ? 'bg-primary/10' : 'hover:bg-muted'}`}><Italic className="h-4 w-4" /></button>
                <select value={selectedEl.fontSize || 32} onChange={e => updateElement(selectedEl.id, { fontSize: parseInt(e.target.value) })} className="text-xs border rounded px-1 py-0.5 bg-background">
                  {[14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 96].map(s => <option key={s} value={s}>{s}px</option>)}
                </select>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded-md hover:bg-muted"><Palette className="h-4 w-4" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <div className="grid grid-cols-6 gap-1 p-2">
                  {SHAPE_COLORS.map(c => (
                    <button key={c} onClick={() => updateElement(selectedEl.id, selectedEl.type === 'text' ? { color: c } : { backgroundColor: c })} className="w-6 h-6 rounded border" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="ghost" onClick={duplicateElement} className="text-xs gap-1"><Copy className="h-3.5 w-3.5" /></Button>
            <Button size="sm" variant="ghost" onClick={bringForward} className="text-xs gap-1"><Layers className="h-3.5 w-3.5" /></Button>
            <Button size="sm" variant="ghost" onClick={deleteElement} className="text-xs text-destructive gap-1"><Trash2 className="h-3.5 w-3.5" /></Button>
            <div className="w-px h-5 bg-border mx-1" />
            <div className="flex items-center gap-1 text-xs">
              <span>Opacité</span>
              <input type="range" min={0} max={1} step={0.05} value={selectedEl.opacity ?? 1} onChange={e => { updateElement(selectedEl.id, { opacity: parseFloat(e.target.value) }); scheduleAutoSave(); }}
                className="w-20 h-1" />
            </div>
            {(selectedEl.type === 'rectangle' || selectedEl.type === 'image') && (
              <div className="flex items-center gap-1 text-xs">
                <span>Rayon</span>
                <input type="range" min={0} max={50} value={selectedEl.borderRadius || 0} onChange={e => { updateElement(selectedEl.id, { borderRadius: parseInt(e.target.value) }); scheduleAutoSave(); }}
                  className="w-16 h-1" />
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-auto flex items-center justify-center" style={{ backgroundColor: '#e0e0e0' }}
          onClick={() => { setSelectedId(null); setEditingTextId(null); }}>
          <div className="flex items-center gap-2 absolute top-auto bottom-4 z-10 bg-card/90 backdrop-blur-sm rounded-lg border px-2 py-1 shadow-sm" style={{ position: 'fixed', bottom: 80 }}>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}><ZoomOut className="h-3.5 w-3.5" /></Button>
            <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setZoom(z => Math.min(2, z + 0.1))}><ZoomIn className="h-3.5 w-3.5" /></Button>
          </div>
          <div
            ref={canvasRef}
            className="shadow-xl relative"
            style={{
              width: canvas.width * zoom,
              height: canvas.height * zoom,
              background: canvas.background,
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: canvas.width, height: canvas.height, transform: `scale(${zoom})`, transformOrigin: 'top left', position: 'absolute' }}>
              {canvas.elements
                .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
                .map(el => renderElement(el))}
            </div>
          </div>
        </div>

        {/* Right panel - background */}
        <div className="w-56 border-l bg-card p-3 space-y-4 overflow-y-auto hidden lg:block">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Fond du visuel</h4>
            <div className="grid grid-cols-5 gap-1">
              {BG_PRESETS.map(c => (
                <button key={c} onClick={() => { setCanvas(prev => ({ ...prev, background: c })); scheduleAutoSave(); }}
                  className={`w-8 h-8 rounded border-2 ${canvas.background === c ? 'border-primary' : 'border-border'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
            <Input value={canvas.background} onChange={e => { setCanvas(prev => ({ ...prev, background: e.target.value })); scheduleAutoSave(); }}
              className="mt-2 text-xs h-8" placeholder="#hex ou gradient" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Éléments ({canvas.elements.length})</h4>
            <div className="space-y-1">
              {canvas.elements.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0)).map(el => (
                <button key={el.id} onClick={() => setSelectedId(el.id)}
                  className={`w-full text-left text-xs px-2 py-1.5 rounded transition-colors ${selectedId === el.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>
                  {el.type === 'text' ? `📝 ${(el.content || '').slice(0, 20)}` : el.type === 'image' ? '🖼️ Image' : `🔷 ${el.type}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {showTemplateGallery && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="w-full max-w-6xl h-[85vh] bg-card rounded-2xl border shadow-2xl overflow-hidden">
            <VisualTemplateGallery onSelect={loadTemplate} onClose={() => setShowTemplateGallery(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceVisualEditor;
