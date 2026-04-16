import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Save, Plus, Trash2, Type, Image, Minus, Square, PenTool, Variable,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Copy, Lock, Unlock, Loader2, Palette, LayoutTemplate, Layers,
  Settings2, Move, ChevronUp, ChevronDown, RotateCcw,
} from 'lucide-react';
import {
  diplomaService,
  type DiplomaElement,
  type DiplomaTemplateData,
  type DiplomaTemplate,
  DIPLOMA_VARIABLES,
  PRESET_TEMPLATES,
} from '@/services/diplomaService';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: string;
  templateId?: string | null;
}

const CANVAS_W = 800;
const CANVAS_H = 520;

const FONTS = ['Georgia', 'Helvetica', 'Palatino', 'Times New Roman', 'Courier New', 'Arial', 'Verdana'];

let nextId = 100;
const genId = () => `el-${++nextId}-${Date.now()}`;

const DiplomaTemplateEditor: React.FC<Props> = ({ open, onOpenChange, establishmentId, templateId }) => {
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('Modele par defaut');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [elements, setElements] = useState<DiplomaElement[]>([]);
  const [bgColor, setBgColor] = useState('#fffef7');
  const [borderStyle, setBorderStyle] = useState<'none' | 'simple' | 'double' | 'ornate'>('double');
  const [borderColor, setBorderColor] = useState('#d4af37');
  const [borderWidth, setBorderWidth] = useState(4);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offX: number; offY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; startW: number; startH: number; startX: number; startY: number } | null>(null);
  const [dbId, setDbId] = useState<string | null>(templateId || null);
  const [activePanel, setActivePanel] = useState('elements');

  // Load existing template
  const { data: existingTemplate } = useQuery({
    queryKey: ['diploma-template', templateId],
    queryFn: () => diplomaService.getTemplate(templateId!),
    enabled: !!templateId,
  });

  useEffect(() => {
    if (existingTemplate) {
      setName(existingTemplate.name);
      setOrientation(existingTemplate.orientation);
      setDbId(existingTemplate.id);
      const td = existingTemplate.template_data;
      setElements(td.elements || []);
      setBgColor(td.backgroundColor || '#fffef7');
      setBorderStyle(td.borderStyle || 'double');
      setBorderColor(td.borderColor || '#d4af37');
      setBorderWidth(td.borderWidth ?? 4);
    } else if (!templateId) {
      // Load default preset
      const preset = PRESET_TEMPLATES[0];
      setElements(preset.data.elements);
      setBgColor(preset.data.backgroundColor);
      setBorderStyle(preset.data.borderStyle || 'double');
      setBorderColor(preset.data.borderColor || '#d4af37');
      setBorderWidth(preset.data.borderWidth ?? 4);
    }
  }, [existingTemplate, templateId]);

  const selected = elements.find(el => el.id === selectedId) || null;

  const updateElement = useCallback((id: string, updates: Partial<DiplomaElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  }, []);

  const updateStyles = useCallback((id: string, styles: Partial<DiplomaElement['styles']>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, styles: { ...el.styles, ...styles } } : el));
  }, []);

  const addElement = useCallback((type: DiplomaElement['type'], content = '') => {
    const defaults: Record<string, Partial<DiplomaElement>> = {
      text: { width: 300, height: 30, content: 'Texte', styles: { fontSize: 16, color: '#1a1a2e', fontFamily: 'Georgia', textAlign: 'center' } },
      variable: { width: 400, height: 40, content: '{nom_complet}', styles: { fontSize: 28, fontWeight: '700', color: '#1a1a2e', fontFamily: 'Georgia', textAlign: 'center' } },
      image: { width: 120, height: 80, content: '', styles: { borderRadius: 0 } },
      line: { width: 400, height: 2, content: '', styles: { backgroundColor: '#d4af37' } },
      rectangle: { width: 200, height: 100, content: '', styles: { borderColor: '#d4af37', borderWidth: 2, backgroundColor: 'transparent', borderRadius: 4 } },
      signature_zone: { width: 200, height: 70, content: 'Le Directeur', styles: { fontSize: 11, textAlign: 'center', color: '#444', fontFamily: 'Georgia' } },
    };
    const d = defaults[type] || {};
    const newEl: DiplomaElement = {
      id: genId(), type, x: 250, y: 200, width: 200, height: 30, content: content || d.content || '',
      styles: { fontSize: 14, color: '#000', fontFamily: 'Georgia', textAlign: 'left', ...d.styles },
      ...d,
    };
    setElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
  }, []);

  const removeElement = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const duplicateElement = useCallback((id: string) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const newEl = { ...el, id: genId(), x: el.x + 20, y: el.y + 20 };
    setElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
  }, [elements]);

  const moveLayer = useCallback((id: string, dir: 'up' | 'down') => {
    setElements(prev => {
      const idx = prev.findIndex(e => e.id === id);
      if (idx < 0) return prev;
      const arr = [...prev];
      const swapIdx = dir === 'up' ? idx + 1 : idx - 1;
      if (swapIdx < 0 || swapIdx >= arr.length) return prev;
      [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
      return arr;
    });
  }, []);

  // Drag handling
  const handleMouseDown = useCallback((e: React.MouseEvent, elId: string) => {
    e.stopPropagation();
    const el = elements.find(x => x.id === elId);
    if (!el || el.locked) return;
    setSelectedId(elId);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragging({ id: elId, offX: e.clientX - rect.left - el.x, offY: e.clientY - rect.top - el.y });
  }, [elements]);

  const handleResizeStart = useCallback((e: React.MouseEvent, elId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const el = elements.find(x => x.id === elId);
    if (!el || el.locked) return;
    setResizing({ id: elId, startW: el.width, startH: el.height, startX: e.clientX, startY: e.clientY });
  }, [elements]);

  useEffect(() => {
    if (!dragging && !resizing) return;
    const handleMove = (e: MouseEvent) => {
      if (dragging) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const cW = orientation === 'landscape' ? CANVAS_W : CANVAS_H;
        const cH = orientation === 'landscape' ? CANVAS_H : CANVAS_W;
        let nx = e.clientX - rect.left - dragging.offX;
        let ny = e.clientY - rect.top - dragging.offY;
        nx = Math.max(0, Math.min(nx, cW - 20));
        ny = Math.max(0, Math.min(ny, cH - 20));
        updateElement(dragging.id, { x: Math.round(nx), y: Math.round(ny) });
      }
      if (resizing) {
        const dx = e.clientX - resizing.startX;
        const dy = e.clientY - resizing.startY;
        updateElement(resizing.id, { width: Math.max(30, resizing.startW + dx), height: Math.max(10, resizing.startH + dy) });
      }
    };
    const handleUp = () => { setDragging(null); setResizing(null); };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [dragging, resizing, orientation, updateElement]);

  // Save
  const handleSave = async () => {
    setSaving(true);
    try {
      const templateData: DiplomaTemplateData = { elements, backgroundColor: bgColor, borderStyle, borderColor, borderWidth };
      const result = await diplomaService.upsertTemplate({
        id: dbId || undefined,
        establishment_id: establishmentId,
        name,
        template_data: templateData,
        orientation,
        page_format: 'A4',
      });
      setDbId(result.id);
      queryClient.invalidateQueries({ queryKey: ['diploma-templates'] });
      toast.success('Modele sauvegarde');
    } catch (err: any) {
      toast.error(err.message || 'Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const loadPreset = (idx: number) => {
    const p = PRESET_TEMPLATES[idx];
    if (!p) return;
    setElements(p.data.elements.map(el => ({ ...el, id: genId() })));
    setBgColor(p.data.backgroundColor);
    setBorderStyle(p.data.borderStyle || 'none');
    setBorderColor(p.data.borderColor || '#ccc');
    setBorderWidth(p.data.borderWidth ?? 0);
    setSelectedId(null);
    toast.success(`Modele "${p.name}" charge`);
  };

  const canvasWidth = orientation === 'landscape' ? CANVAS_W : CANVAS_H;
  const canvasHeight = orientation === 'landscape' ? CANVAS_H : CANVAS_W;

  const getBorderCSS = (): React.CSSProperties => {
    if (borderStyle === 'none') return {};
    if (borderStyle === 'simple') return { border: `${borderWidth}px solid ${borderColor}` };
    if (borderStyle === 'double') return { border: `${borderWidth}px double ${borderColor}` };
    if (borderStyle === 'ornate') return { border: `${borderWidth}px solid ${borderColor}`, boxShadow: `inset 0 0 0 ${borderWidth + 4}px transparent, inset 0 0 0 ${borderWidth + 6}px ${borderColor}` };
    return {};
  };

  const renderElement = (el: DiplomaElement) => {
    const isSelected = el.id === selectedId;
    const base: React.CSSProperties = {
      position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height,
      cursor: el.locked ? 'default' : 'move',
      outline: isSelected ? '2px solid #3b82f6' : 'none',
      outlineOffset: 2,
      zIndex: isSelected ? 50 : 1,
    };

    if (el.type === 'line') {
      return (
        <div key={el.id} style={{ ...base, backgroundColor: el.styles.backgroundColor || '#000', opacity: el.styles.opacity ?? 1 }}
          onMouseDown={e => handleMouseDown(e, el.id)} data-testid={`canvas-el-${el.id}`}>
          {isSelected && <div className="absolute -right-1 -bottom-1 w-3 h-3 bg-blue-500 cursor-se-resize rounded-sm" onMouseDown={e => handleResizeStart(e, el.id)} />}
        </div>
      );
    }

    if (el.type === 'rectangle') {
      return (
        <div key={el.id} style={{
          ...base, backgroundColor: el.styles.backgroundColor || 'transparent',
          border: `${el.styles.borderWidth || 1}px solid ${el.styles.borderColor || '#000'}`,
          borderRadius: el.styles.borderRadius ?? 0, opacity: el.styles.opacity ?? 1,
        }} onMouseDown={e => handleMouseDown(e, el.id)} data-testid={`canvas-el-${el.id}`}>
          {isSelected && <div className="absolute -right-1 -bottom-1 w-3 h-3 bg-blue-500 cursor-se-resize rounded-sm" onMouseDown={e => handleResizeStart(e, el.id)} />}
        </div>
      );
    }

    if (el.type === 'signature_zone') {
      return (
        <div key={el.id} style={{ ...base, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}
          onMouseDown={e => handleMouseDown(e, el.id)} data-testid={`canvas-el-${el.id}`}>
          <div style={{ width: '80%', borderBottom: '1px solid #999', marginBottom: 4, paddingTop: el.height - 30 }} />
          <span style={{ fontSize: el.styles.fontSize || 11, color: el.styles.color || '#444', fontFamily: el.styles.fontFamily, fontStyle: 'italic' }}>{el.content}</span>
          {isSelected && <div className="absolute -right-1 -bottom-1 w-3 h-3 bg-blue-500 cursor-se-resize rounded-sm" onMouseDown={e => handleResizeStart(e, el.id)} />}
        </div>
      );
    }

    if (el.type === 'image') {
      return (
        <div key={el.id} style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderRadius: el.styles.borderRadius ?? 0 }}
          onMouseDown={e => handleMouseDown(e, el.id)} data-testid={`canvas-el-${el.id}`}>
          {el.content ? <img src={el.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Image className="h-6 w-6 text-gray-400" />}
          {isSelected && <div className="absolute -right-1 -bottom-1 w-3 h-3 bg-blue-500 cursor-se-resize rounded-sm" onMouseDown={e => handleResizeStart(e, el.id)} />}
        </div>
      );
    }

    // text / variable
    const isVar = el.type === 'variable';
    return (
      <div key={el.id} style={{
        ...base, fontSize: el.styles.fontSize, fontFamily: el.styles.fontFamily,
        fontWeight: el.styles.fontWeight as any, fontStyle: el.styles.fontStyle,
        textAlign: el.styles.textAlign as any, color: el.styles.color,
        textDecoration: el.styles.textDecoration, letterSpacing: el.styles.letterSpacing,
        lineHeight: el.styles.lineHeight ? `${el.styles.lineHeight}` : undefined,
        display: 'flex', alignItems: 'center', justifyContent: el.styles.textAlign === 'center' ? 'center' : el.styles.textAlign === 'right' ? 'flex-end' : 'flex-start',
        overflow: 'hidden', whiteSpace: 'nowrap', opacity: el.styles.opacity ?? 1,
      }} onMouseDown={e => handleMouseDown(e, el.id)} data-testid={`canvas-el-${el.id}`}>
        {isVar && <Badge variant="outline" className="absolute -top-4 left-0 text-[8px] px-1 py-0 bg-amber-50 text-amber-700 border-amber-300">var</Badge>}
        <span className="truncate w-full" style={{ textAlign: el.styles.textAlign as any }}>{el.content}</span>
        {isSelected && <div className="absolute -right-1 -bottom-1 w-3 h-3 bg-blue-500 cursor-se-resize rounded-sm" onMouseDown={e => handleResizeStart(e, el.id)} />}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] flex flex-col p-0 gap-0" data-testid="diploma-editor">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30 shrink-0">
          <div className="flex items-center gap-3">
            <LayoutTemplate className="h-5 w-5 text-primary" />
            <Input value={name} onChange={e => setName(e.target.value)} className="h-8 w-56 text-sm font-medium" data-testid="template-name" />
          </div>
          <div className="flex items-center gap-2">
            <Select value={orientation} onValueChange={(v: any) => setOrientation(v)}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="landscape">Paysage</SelectItem>
                <SelectItem value="portrait">Portrait</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="h-8 gap-1.5" onClick={handleSave} disabled={saving} data-testid="save-template">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Sauvegarder
            </Button>
          </div>
        </div>

        {/* Main area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel */}
          <div className="w-64 border-r bg-background overflow-y-auto shrink-0">
            <Tabs value={activePanel} onValueChange={setActivePanel}>
              <TabsList className="w-full grid grid-cols-3 rounded-none border-b h-9">
                <TabsTrigger value="elements" className="text-xs gap-1 h-8"><Plus className="h-3 w-3" />Ajouter</TabsTrigger>
                <TabsTrigger value="presets" className="text-xs gap-1 h-8"><LayoutTemplate className="h-3 w-3" />Modeles</TabsTrigger>
                <TabsTrigger value="canvas" className="text-xs gap-1 h-8"><Palette className="h-3 w-3" />Fond</TabsTrigger>
              </TabsList>

              <TabsContent value="elements" className="p-3 space-y-2 mt-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Elements</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { type: 'text' as const, icon: Type, label: 'Texte' },
                    { type: 'variable' as const, icon: Variable, label: 'Variable' },
                    { type: 'image' as const, icon: Image, label: 'Image' },
                    { type: 'line' as const, icon: Minus, label: 'Ligne' },
                    { type: 'rectangle' as const, icon: Square, label: 'Rectangle' },
                    { type: 'signature_zone' as const, icon: PenTool, label: 'Signature' },
                  ].map(item => (
                    <Button key={item.type} variant="outline" size="sm" className="h-16 flex-col gap-1 text-[10px]"
                      onClick={() => addElement(item.type)} data-testid={`add-${item.type}`}>
                      <item.icon className="h-4 w-4" />{item.label}
                    </Button>
                  ))}
                </div>

                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-2">Variables dynamiques</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {DIPLOMA_VARIABLES.map(v => (
                    <button key={v.key} className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors flex items-center justify-between group"
                      onClick={() => addElement('variable', v.key)} data-testid={`add-var-${v.key}`}>
                      <span className="font-mono text-[10px] text-primary">{v.key}</span>
                      <span className="text-[9px] text-muted-foreground group-hover:text-foreground">{v.example}</span>
                    </button>
                  ))}
                </div>

                {/* Layers */}
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-2">Calques ({elements.length})</p>
                <div className="space-y-0.5 max-h-40 overflow-y-auto">
                  {[...elements].reverse().map(el => (
                    <div key={el.id}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer transition-colors ${selectedId === el.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                      onClick={() => setSelectedId(el.id)}>
                      <span className="truncate flex-1">{el.type === 'variable' ? el.content : el.type === 'text' ? el.content.substring(0, 20) : el.type}</span>
                      <button onClick={e => { e.stopPropagation(); removeElement(el.id); }} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="presets" className="p-3 space-y-2 mt-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Modeles predefinies</p>
                <div className="space-y-2">
                  {PRESET_TEMPLATES.map((p, i) => (
                    <Card key={i} className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all" onClick={() => loadPreset(i)} data-testid={`preset-${i}`}>
                      <CardContent className="p-3">
                        <div className="h-16 rounded border mb-2" style={{
                          backgroundColor: p.data.backgroundColor,
                          ...( p.data.borderStyle === 'double' ? { border: `3px double ${p.data.borderColor}` } : { border: `2px solid ${p.data.borderColor || '#eee'}` }),
                        }}>
                          <div className="flex items-center justify-center h-full">
                            <span className="text-[9px] text-muted-foreground">{p.name}</span>
                          </div>
                        </div>
                        <p className="text-xs font-medium">{p.name}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="canvas" className="p-3 space-y-3 mt-0">
                <div className="space-y-1.5">
                  <Label className="text-xs">Couleur de fond</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-8 h-8 rounded border cursor-pointer" />
                    <Input value={bgColor} onChange={e => setBgColor(e.target.value)} className="h-8 text-xs flex-1" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Style de bordure</Label>
                  <Select value={borderStyle} onValueChange={(v: any) => setBorderStyle(v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune</SelectItem>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="double">Double</SelectItem>
                      <SelectItem value="ornate">Ornementale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {borderStyle !== 'none' && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Couleur de bordure</Label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)} className="w-8 h-8 rounded border cursor-pointer" />
                        <Input value={borderColor} onChange={e => setBorderColor(e.target.value)} className="h-8 text-xs flex-1" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Epaisseur ({borderWidth}px)</Label>
                      <Slider value={[borderWidth]} onValueChange={v => setBorderWidth(v[0])} min={1} max={10} step={1} />
                    </div>
                  </>
                )}
                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => { setElements([]); setSelectedId(null); }}>
                    <RotateCcw className="h-3 w-3" /> Tout effacer
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto bg-muted/50 flex items-center justify-center p-6" onClick={() => setSelectedId(null)}>
            <div ref={canvasRef} className="relative shadow-2xl"
              style={{ width: canvasWidth, height: canvasHeight, backgroundColor: bgColor, ...getBorderCSS(), flexShrink: 0 }}
              onClick={e => e.stopPropagation()} data-testid="diploma-canvas">
              {elements.map(renderElement)}
            </div>
          </div>

          {/* Right panel — Properties */}
          <div className="w-64 border-l bg-background overflow-y-auto shrink-0">
            {selected ? (
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold">Proprietes</p>
                  <div className="flex gap-0.5">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => duplicateElement(selected.id)} title="Dupliquer"><Copy className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveLayer(selected.id, 'up')} title="Avancer"><ChevronUp className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveLayer(selected.id, 'down')} title="Reculer"><ChevronDown className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateElement(selected.id, { locked: !selected.locked })} title={selected.locked ? 'Deverrouiller' : 'Verrouiller'}>
                      {selected.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeElement(selected.id)} title="Supprimer"><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>

                {/* Content */}
                {(selected.type === 'text' || selected.type === 'variable' || selected.type === 'signature_zone') && (
                  <div className="space-y-1.5">
                    <Label className="text-[10px]">Contenu</Label>
                    {selected.type === 'variable' ? (
                      <Select value={selected.content} onValueChange={v => updateElement(selected.id, { content: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DIPLOMA_VARIABLES.map(v => <SelectItem key={v.key} value={v.key}>{v.label} ({v.key})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={selected.content} onChange={e => updateElement(selected.id, { content: e.target.value })} className="h-8 text-xs" data-testid="prop-content" />
                    )}
                  </div>
                )}

                {selected.type === 'image' && (
                  <div className="space-y-1.5">
                    <Label className="text-[10px]">URL de l'image</Label>
                    <Input value={selected.content} onChange={e => updateElement(selected.id, { content: e.target.value })} placeholder="https://..." className="h-8 text-xs" />
                  </div>
                )}

                {/* Position & Size */}
                <div className="space-y-1.5">
                  <Label className="text-[10px]">Position & Taille</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="flex items-center gap-1"><span className="text-[9px] text-muted-foreground w-3">X</span><Input type="number" value={selected.x} onChange={e => updateElement(selected.id, { x: +e.target.value })} className="h-7 text-xs" /></div>
                    <div className="flex items-center gap-1"><span className="text-[9px] text-muted-foreground w-3">Y</span><Input type="number" value={selected.y} onChange={e => updateElement(selected.id, { y: +e.target.value })} className="h-7 text-xs" /></div>
                    <div className="flex items-center gap-1"><span className="text-[9px] text-muted-foreground w-3">L</span><Input type="number" value={selected.width} onChange={e => updateElement(selected.id, { width: +e.target.value })} className="h-7 text-xs" /></div>
                    <div className="flex items-center gap-1"><span className="text-[9px] text-muted-foreground w-3">H</span><Input type="number" value={selected.height} onChange={e => updateElement(selected.id, { height: +e.target.value })} className="h-7 text-xs" /></div>
                  </div>
                </div>

                {/* Text styles */}
                {(selected.type === 'text' || selected.type === 'variable' || selected.type === 'signature_zone') && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-[10px]">Police</Label>
                      <Select value={selected.styles.fontFamily || 'Georgia'} onValueChange={v => updateStyles(selected.id, { fontFamily: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FONTS.map(f => <SelectItem key={f} value={f}><span style={{ fontFamily: f }}>{f}</span></SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px]">Taille ({selected.styles.fontSize}px)</Label>
                      <Slider value={[selected.styles.fontSize || 14]} onValueChange={v => updateStyles(selected.id, { fontSize: v[0] })} min={8} max={72} step={1} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px]">Couleur</Label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={selected.styles.color || '#000'} onChange={e => updateStyles(selected.id, { color: e.target.value })} className="w-7 h-7 rounded border cursor-pointer" />
                        <Input value={selected.styles.color || '#000'} onChange={e => updateStyles(selected.id, { color: e.target.value })} className="h-7 text-xs flex-1" />
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant={selected.styles.fontWeight === '700' ? 'default' : 'outline'} size="icon" className="h-7 w-7" onClick={() => updateStyles(selected.id, { fontWeight: selected.styles.fontWeight === '700' ? '400' : '700' })}><Bold className="h-3 w-3" /></Button>
                      <Button variant={selected.styles.fontStyle === 'italic' ? 'default' : 'outline'} size="icon" className="h-7 w-7" onClick={() => updateStyles(selected.id, { fontStyle: selected.styles.fontStyle === 'italic' ? 'normal' : 'italic' })}><Italic className="h-3 w-3" /></Button>
                      <Button variant={selected.styles.textDecoration === 'underline' ? 'default' : 'outline'} size="icon" className="h-7 w-7" onClick={() => updateStyles(selected.id, { textDecoration: selected.styles.textDecoration === 'underline' ? 'none' : 'underline' })}><Underline className="h-3 w-3" /></Button>
                      <div className="w-px bg-border mx-0.5" />
                      <Button variant={selected.styles.textAlign === 'left' ? 'default' : 'outline'} size="icon" className="h-7 w-7" onClick={() => updateStyles(selected.id, { textAlign: 'left' })}><AlignLeft className="h-3 w-3" /></Button>
                      <Button variant={selected.styles.textAlign === 'center' ? 'default' : 'outline'} size="icon" className="h-7 w-7" onClick={() => updateStyles(selected.id, { textAlign: 'center' })}><AlignCenter className="h-3 w-3" /></Button>
                      <Button variant={selected.styles.textAlign === 'right' ? 'default' : 'outline'} size="icon" className="h-7 w-7" onClick={() => updateStyles(selected.id, { textAlign: 'right' })}><AlignRight className="h-3 w-3" /></Button>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px]">Espacement lettres ({selected.styles.letterSpacing ?? 0}px)</Label>
                      <Slider value={[selected.styles.letterSpacing ?? 0]} onValueChange={v => updateStyles(selected.id, { letterSpacing: v[0] })} min={0} max={20} step={1} />
                    </div>
                  </>
                )}

                {/* Shape styles */}
                {(selected.type === 'rectangle' || selected.type === 'line') && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-[10px]">Couleur</Label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={selected.type === 'line' ? (selected.styles.backgroundColor || '#000') : (selected.styles.borderColor || '#000')}
                          onChange={e => selected.type === 'line' ? updateStyles(selected.id, { backgroundColor: e.target.value }) : updateStyles(selected.id, { borderColor: e.target.value })}
                          className="w-7 h-7 rounded border cursor-pointer" />
                      </div>
                    </div>
                    {selected.type === 'rectangle' && (
                      <div className="space-y-1.5">
                        <Label className="text-[10px]">Arrondi ({selected.styles.borderRadius ?? 0}px)</Label>
                        <Slider value={[selected.styles.borderRadius ?? 0]} onValueChange={v => updateStyles(selected.id, { borderRadius: v[0] })} min={0} max={50} step={1} />
                      </div>
                    )}
                  </>
                )}

                {/* Opacity */}
                <div className="space-y-1.5">
                  <Label className="text-[10px]">Opacite ({Math.round((selected.styles.opacity ?? 1) * 100)}%)</Label>
                  <Slider value={[(selected.styles.opacity ?? 1) * 100]} onValueChange={v => updateStyles(selected.id, { opacity: v[0] / 100 })} min={10} max={100} step={5} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <Move className="h-8 w-8 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Selectionnez un element sur le canvas pour modifier ses proprietes</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DiplomaTemplateEditor;
