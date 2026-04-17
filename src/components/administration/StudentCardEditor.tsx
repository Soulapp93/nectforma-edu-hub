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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Save, Plus, Trash2, Type, Image, Minus, Square, Variable, QrCode, Flag,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Copy, Lock, Unlock, Loader2, Palette, LayoutTemplate, Layers,
  Move, ChevronUp, ChevronDown, RotateCcw, CreditCard,
} from 'lucide-react';
import {
  studentCardService, type CardElement, type CardTemplateData, CARD_VARIABLES, CARD_PRESETS, FRENCH_FLAG_SVG,
} from '@/services/studentCardService';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: string;
  templateId?: string | null;
}

const CARD_W = 320;
const CARD_H = 400;
const FONTS = ['Helvetica', 'Georgia', 'Arial', 'Verdana', 'Courier New', 'Times New Roman'];

let nextId = 200;
const genId = () => `cel-${++nextId}-${Date.now()}`;

const StudentCardEditor: React.FC<Props> = ({ open, onOpenChange, establishmentId, templateId }) => {
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('Modele par defaut');
  const [activeFace, setActiveFace] = useState<'recto' | 'verso'>('recto');
  const [elements, setElements] = useState<CardElement[]>([]);
  const [rectoBg, setRectoBg] = useState('#ffffff');
  const [versoBg, setVersoBg] = useState('#ffffff');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offX: number; offY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; startW: number; startH: number; startX: number; startY: number } | null>(null);
  const [dbId, setDbId] = useState<string | null>(templateId || null);
  const [activePanel, setActivePanel] = useState('elements');

  const { data: existingTemplate } = useQuery({
    queryKey: ['card-template-edit', templateId],
    queryFn: async () => {
      const templates = await studentCardService.getTemplates(establishmentId);
      return templates.find(t => t.id === templateId) || null;
    },
    enabled: !!templateId,
  });

  useEffect(() => {
    if (existingTemplate) {
      setName(existingTemplate.name);
      setDbId(existingTemplate.id);
      const td = existingTemplate.template_data;
      setElements(td.elements || []);
      setRectoBg(td.recto?.backgroundColor || '#ffffff');
      setVersoBg(td.verso?.backgroundColor || '#ffffff');
    } else if (!templateId) {
      const preset = CARD_PRESETS[0];
      setElements(preset.data.elements.map(el => ({ ...el, id: genId() })));
      setRectoBg(preset.data.recto.backgroundColor);
      setVersoBg(preset.data.verso.backgroundColor);
    }
  }, [existingTemplate, templateId]);

  const faceElements = elements.filter(el => el.face === activeFace);
  const selected = elements.find(el => el.id === selectedId) || null;

  const updateElement = useCallback((id: string, updates: Partial<CardElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  }, []);

  const updateStyles = useCallback((id: string, styles: Partial<CardElement['styles']>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, styles: { ...el.styles, ...styles } } : el));
  }, []);

  const addElement = useCallback((type: CardElement['type'], content = '') => {
    const defaults: Record<string, Partial<CardElement>> = {
      text: { width: 200, height: 20, content: 'Texte', styles: { fontSize: 12, color: '#1a1a2e', fontFamily: 'Helvetica', textAlign: 'left' } },
      variable: { width: 250, height: 22, content: '{nom_complet}', styles: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', fontFamily: 'Helvetica' } },
      image: { width: 100, height: 80, content: '', styles: { borderRadius: 4 } },
      line: { width: 300, height: 2, content: '', styles: { backgroundColor: '#1a1a2e' } },
      rectangle: { width: 200, height: 50, content: '', styles: { borderColor: '#1a1a2e', borderWidth: 1, backgroundColor: 'transparent', borderRadius: 4 } },
      qrcode: { width: 100, height: 100, content: '{qrcode}', styles: {} },
      barcode: { width: 200, height: 40, content: '{numero_etudiant}', styles: { fontSize: 10, fontFamily: 'Courier New' } },
    };
    const d = defaults[type] || {};
    const newEl: CardElement = {
      id: genId(), type, face: activeFace, x: 150, y: 100, width: 200, height: 20, content: content || d.content || '',
      styles: { fontSize: 12, color: '#000', fontFamily: 'Helvetica', textAlign: 'left', ...d.styles }, ...d,
    };
    setElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
  }, [activeFace]);

  const removeElement = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const duplicateElement = useCallback((id: string) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const newEl = { ...el, id: genId(), x: el.x + 15, y: el.y + 15 };
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

  // Drag
  const handleMouseDown = useCallback((e: React.MouseEvent, elId: string) => {
    e.stopPropagation();
    setSelectedId(elId);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const el = elements.find(x => x.id === elId);
    if (!el) return;
    setDragging({ id: elId, offX: e.clientX - rect.left - el.x, offY: e.clientY - rect.top - el.y });
  }, [elements]);

  const handleResizeStart = useCallback((e: React.MouseEvent, elId: string) => {
    e.stopPropagation(); e.preventDefault();
    const el = elements.find(x => x.id === elId);
    if (!el) return;
    setResizing({ id: elId, startW: el.width, startH: el.height, startX: e.clientX, startY: e.clientY });
  }, [elements]);

  useEffect(() => {
    if (!dragging && !resizing) return;
    const handleMove = (e: MouseEvent) => {
      if (dragging) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        let nx = Math.max(0, Math.min(e.clientX - rect.left - dragging.offX, CARD_W - 20));
        let ny = Math.max(0, Math.min(e.clientY - rect.top - dragging.offY, CARD_H - 10));
        updateElement(dragging.id, { x: Math.round(nx), y: Math.round(ny) });
      }
      if (resizing) {
        updateElement(resizing.id, { width: Math.max(20, resizing.startW + e.clientX - resizing.startX), height: Math.max(8, resizing.startH + e.clientY - resizing.startY) });
      }
    };
    const handleUp = () => { setDragging(null); setResizing(null); };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [dragging, resizing, updateElement]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: CardTemplateData = { elements, recto: { backgroundColor: rectoBg }, verso: { backgroundColor: versoBg } };
      const result = await studentCardService.upsertTemplate({ id: dbId || undefined, establishment_id: establishmentId, name, template_data: data });
      setDbId(result.id);
      queryClient.invalidateQueries({ queryKey: ['card-templates'] });
      toast.success('Modele sauvegarde');
    } catch (err: any) { toast.error(err.message || 'Erreur'); } finally { setSaving(false); }
  };

  const loadPreset = (idx: number) => {
    const p = CARD_PRESETS[idx];
    if (!p) return;
    setElements(p.data.elements.map(el => ({ ...el, id: genId() })));
    setRectoBg(p.data.recto.backgroundColor);
    setVersoBg(p.data.verso.backgroundColor);
    setSelectedId(null);
    toast.success(`Modele "${p.name}" charge`);
  };

  const currentBg = activeFace === 'recto' ? rectoBg : versoBg;
  const setBg = activeFace === 'recto' ? setRectoBg : setVersoBg;

  const renderElement = (el: CardElement) => {
    const isSelected = el.id === selectedId;
    const base: React.CSSProperties = {
      position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height,
      cursor: 'move', outline: isSelected ? '2px solid #3b82f6' : 'none', outlineOffset: 1, zIndex: isSelected ? 50 : 1,
    };

    if (el.type === 'line') return (
      <div key={el.id} style={{ ...base, backgroundColor: el.styles.backgroundColor || '#000' }} onMouseDown={e => handleMouseDown(e, el.id)}>
        {isSelected && <div className="absolute -right-1 -bottom-1 w-2.5 h-2.5 bg-blue-500 cursor-se-resize rounded-sm" onMouseDown={e => handleResizeStart(e, el.id)} />}
      </div>
    );

    if (el.type === 'rectangle') return (
      <div key={el.id} style={{ ...base, backgroundColor: el.styles.backgroundColor || 'transparent', border: `${el.styles.borderWidth || 1}px solid ${el.styles.borderColor || '#000'}`, borderRadius: el.styles.borderRadius ?? 0 }} onMouseDown={e => handleMouseDown(e, el.id)}>
        {isSelected && <div className="absolute -right-1 -bottom-1 w-2.5 h-2.5 bg-blue-500 cursor-se-resize rounded-sm" onMouseDown={e => handleResizeStart(e, el.id)} />}
      </div>
    );

    if (el.type === 'qrcode') return (
      <div key={el.id} style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 4 }} onMouseDown={e => handleMouseDown(e, el.id)}>
        <QrCode className="w-full h-full text-gray-800" />
        {isSelected && <div className="absolute -right-1 -bottom-1 w-2.5 h-2.5 bg-blue-500 cursor-se-resize rounded-sm" onMouseDown={e => handleResizeStart(e, el.id)} />}
      </div>
    );

    if (el.type === 'image') return (
      <div key={el.id} style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderRadius: el.styles.borderRadius ?? 0, border: el.styles.borderWidth ? `${el.styles.borderWidth}px solid ${el.styles.borderColor || '#e2e8f0'}` : undefined }} onMouseDown={e => handleMouseDown(e, el.id)}>
        {el.content && el.content !== '{photo}' ? <img src={el.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: el.styles.borderRadius }} /> : <Image className="h-5 w-5 text-gray-400" />}
        {isSelected && <div className="absolute -right-1 -bottom-1 w-2.5 h-2.5 bg-blue-500 cursor-se-resize rounded-sm" onMouseDown={e => handleResizeStart(e, el.id)} />}
      </div>
    );

    const isVar = el.type === 'variable';
    return (
      <div key={el.id} style={{
        ...base, fontSize: el.styles.fontSize, fontFamily: el.styles.fontFamily, fontWeight: el.styles.fontWeight as any,
        fontStyle: el.styles.fontStyle, textAlign: el.styles.textAlign as any, color: el.styles.color,
        letterSpacing: el.styles.letterSpacing, textTransform: el.styles.textTransform as any,
        backgroundColor: el.styles.backgroundColor || 'transparent',
        borderRadius: el.styles.borderRadius ?? 0,
        display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap',
        justifyContent: el.styles.textAlign === 'center' ? 'center' : el.styles.textAlign === 'right' ? 'flex-end' : 'flex-start',
        opacity: el.styles.opacity ?? 1,
        padding: el.styles.backgroundColor ? '0 4px' : undefined,
      }} onMouseDown={e => handleMouseDown(e, el.id)}>
        {isVar && <Badge variant="outline" className="absolute -top-3.5 left-0 text-[7px] px-1 py-0 bg-amber-50 text-amber-700 border-amber-300">var</Badge>}
        <span className="truncate w-full" style={{ textAlign: el.styles.textAlign as any }}>{el.content}</span>
        {isSelected && <div className="absolute -right-1 -bottom-1 w-2.5 h-2.5 bg-blue-500 cursor-se-resize rounded-sm" onMouseDown={e => handleResizeStart(e, el.id)} />}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1200px] h-[85vh] flex flex-col p-0 gap-0" data-testid="card-editor">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30 shrink-0">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <Input value={name} onChange={e => setName(e.target.value)} className="h-8 w-48 text-sm font-medium" data-testid="card-template-name" />
          </div>
          <div className="flex items-center gap-2">
            {/* Recto / Verso toggle */}
            <div className="flex rounded-lg border overflow-hidden">
              <button onClick={() => setActiveFace('recto')} className={`px-3 py-1 text-xs font-medium ${activeFace === 'recto' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`} data-testid="face-recto">Recto</button>
              <button onClick={() => setActiveFace('verso')} className={`px-3 py-1 text-xs font-medium ${activeFace === 'verso' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`} data-testid="face-verso">Verso</button>
            </div>
            <Button size="sm" className="h-8 gap-1.5" onClick={handleSave} disabled={saving} data-testid="save-card-template">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Sauvegarder
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left panel */}
          <div className="w-56 border-r bg-background overflow-y-auto shrink-0">
            <Tabs value={activePanel} onValueChange={setActivePanel}>
              <TabsList className="w-full grid grid-cols-3 rounded-none border-b h-8">
                <TabsTrigger value="elements" className="text-[10px] h-7"><Plus className="h-3 w-3" /></TabsTrigger>
                <TabsTrigger value="presets" className="text-[10px] h-7"><LayoutTemplate className="h-3 w-3" /></TabsTrigger>
                <TabsTrigger value="canvas" className="text-[10px] h-7"><Palette className="h-3 w-3" /></TabsTrigger>
              </TabsList>
              <TabsContent value="elements" className="p-2.5 space-y-2 mt-0">
                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Elements</p>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { type: 'text' as const, icon: Type, label: 'Texte' },
                    { type: 'variable' as const, icon: Variable, label: 'Variable' },
                    { type: 'image' as const, icon: Image, label: 'Image' },
                    { type: 'qrcode' as const, icon: QrCode, label: 'QR Code' },
                    { type: 'line' as const, icon: Minus, label: 'Ligne' },
                    { type: 'rectangle' as const, icon: Square, label: 'Rectangle' },
                  ].map(item => (
                    <Button key={item.type} variant="outline" size="sm" className="h-12 flex-col gap-0.5 text-[9px]"
                      onClick={() => addElement(item.type)} data-testid={`add-card-${item.type}`}>
                      <item.icon className="h-3.5 w-3.5" />{item.label}
                    </Button>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full h-8 text-[9px] gap-1.5" onClick={() => addElement('image', FRENCH_FLAG_SVG)} data-testid="add-card-flag">
                  <Flag className="h-3.5 w-3.5" /> Drapeau France
                </Button>
                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider pt-1">Variables</p>
                <div className="space-y-0.5 max-h-36 overflow-y-auto">
                  {CARD_VARIABLES.map(v => (
                    <button key={v.key} className="w-full text-left px-1.5 py-1 rounded text-[10px] hover:bg-muted transition-colors flex justify-between"
                      onClick={() => addElement('variable', v.key)}>
                      <span className="font-mono text-primary">{v.key}</span>
                      <span className="text-muted-foreground">{v.example}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider pt-1">Calques ({faceElements.length})</p>
                <div className="space-y-0.5 max-h-32 overflow-y-auto">
                  {[...faceElements].reverse().map(el => (
                    <div key={el.id} className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${selectedId === el.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`} onClick={() => setSelectedId(el.id)}>
                      <span className="truncate flex-1">{el.type === 'variable' ? el.content : el.content?.substring(0, 18) || el.type}</span>
                      <button onClick={e => { e.stopPropagation(); removeElement(el.id); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-2.5 w-2.5" /></button>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="presets" className="p-2.5 space-y-2 mt-0">
                {CARD_PRESETS.map((p, i) => {
                  // Show a mini preview with the header color
                  const headerEl = p.data.elements.find(el => el.face === 'recto' && el.type === 'rectangle' && el.y === 0);
                  const headerBg = headerEl?.styles.backgroundColor || '#1e3a5f';
                  return (
                    <Card key={i} className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all" onClick={() => loadPreset(i)} data-testid={`card-preset-${i}`}>
                      <CardContent className="p-1.5">
                        <div className="rounded border overflow-hidden mb-1" style={{ height: 50 }}>
                          <div style={{ height: 16, backgroundColor: headerBg }} />
                          <div style={{ height: 34, backgroundColor: p.data.recto.backgroundColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 6, color: headerBg, fontWeight: 700, letterSpacing: 1 }}>CARTE ETUDIANT</span>
                          </div>
                        </div>
                        <p className="text-[10px] font-medium truncate">{p.name}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>
              <TabsContent value="canvas" className="p-2.5 space-y-3 mt-0">
                <div className="space-y-1.5">
                  <Label className="text-xs">Fond ({activeFace})</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={currentBg} onChange={e => setBg(e.target.value)} className="w-7 h-7 rounded border cursor-pointer" />
                    <Input value={currentBg} onChange={e => setBg(e.target.value)} className="h-7 text-xs flex-1" />
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => { setElements(prev => prev.filter(el => el.face !== activeFace)); setSelectedId(null); }}>
                  <RotateCcw className="h-3 w-3" /> Effacer {activeFace}
                </Button>
              </TabsContent>
            </Tabs>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto bg-muted/50 flex items-center justify-center p-6" onClick={() => setSelectedId(null)}>
            <div ref={canvasRef} className="relative shadow-2xl rounded-xl overflow-hidden"
              style={{ width: CARD_W, height: CARD_H, backgroundColor: currentBg, flexShrink: 0 }}
              onClick={e => e.stopPropagation()} data-testid="card-canvas">
              {faceElements.map(renderElement)}
            </div>
          </div>

          {/* Right panel */}
          <div className="w-56 border-l bg-background overflow-y-auto shrink-0">
            {selected && selected.face === activeFace ? (
              <div className="p-2.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold">Proprietes</p>
                  <div className="flex gap-0.5">
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => duplicateElement(selected.id)}><Copy className="h-2.5 w-2.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveLayer(selected.id, 'up')}><ChevronUp className="h-2.5 w-2.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveLayer(selected.id, 'down')}><ChevronDown className="h-2.5 w-2.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => removeElement(selected.id)}><Trash2 className="h-2.5 w-2.5" /></Button>
                  </div>
                </div>
                {(selected.type === 'text' || selected.type === 'variable') && (
                  <div className="space-y-1">
                    <Label className="text-[10px]">Contenu</Label>
                    {selected.type === 'variable' ? (
                      <Select value={selected.content} onValueChange={v => updateElement(selected.id, { content: v })}>
                        <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{CARD_VARIABLES.map(v => <SelectItem key={v.key} value={v.key}>{v.label}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <Input value={selected.content} onChange={e => updateElement(selected.id, { content: e.target.value })} className="h-7 text-[10px]" />
                    )}
                  </div>
                )}
                {selected.type === 'image' && (
                  <div className="space-y-1"><Label className="text-[10px]">URL image</Label><Input value={selected.content} onChange={e => updateElement(selected.id, { content: e.target.value })} placeholder="https://..." className="h-7 text-[10px]" /></div>
                )}
                <div className="space-y-1">
                  <Label className="text-[10px]">Position & Taille</Label>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="flex items-center gap-0.5"><span className="text-[8px] text-muted-foreground w-2">X</span><Input type="number" value={selected.x} onChange={e => updateElement(selected.id, { x: +e.target.value })} className="h-6 text-[10px]" /></div>
                    <div className="flex items-center gap-0.5"><span className="text-[8px] text-muted-foreground w-2">Y</span><Input type="number" value={selected.y} onChange={e => updateElement(selected.id, { y: +e.target.value })} className="h-6 text-[10px]" /></div>
                    <div className="flex items-center gap-0.5"><span className="text-[8px] text-muted-foreground w-2">L</span><Input type="number" value={selected.width} onChange={e => updateElement(selected.id, { width: +e.target.value })} className="h-6 text-[10px]" /></div>
                    <div className="flex items-center gap-0.5"><span className="text-[8px] text-muted-foreground w-2">H</span><Input type="number" value={selected.height} onChange={e => updateElement(selected.id, { height: +e.target.value })} className="h-6 text-[10px]" /></div>
                  </div>
                </div>
                {(selected.type === 'text' || selected.type === 'variable') && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Police</Label>
                      <Select value={selected.styles.fontFamily || 'Helvetica'} onValueChange={v => updateStyles(selected.id, { fontFamily: v })}>
                        <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{FONTS.map(f => <SelectItem key={f} value={f}><span style={{ fontFamily: f }}>{f}</span></SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Taille ({selected.styles.fontSize}px)</Label>
                      <Slider value={[selected.styles.fontSize || 12]} onValueChange={v => updateStyles(selected.id, { fontSize: v[0] })} min={6} max={36} step={1} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Couleur texte</Label>
                      <div className="flex gap-1.5 items-center">
                        <input type="color" value={selected.styles.color || '#000'} onChange={e => updateStyles(selected.id, { color: e.target.value })} className="w-6 h-6 rounded border cursor-pointer" />
                        <Input value={selected.styles.color || '#000'} onChange={e => updateStyles(selected.id, { color: e.target.value })} className="h-6 text-[10px] flex-1" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Fond de l'element</Label>
                      <div className="flex gap-1.5 items-center">
                        <input type="color" value={selected.styles.backgroundColor || '#ffffff'} onChange={e => updateStyles(selected.id, { backgroundColor: e.target.value })} className="w-6 h-6 rounded border cursor-pointer" />
                        <Input value={selected.styles.backgroundColor || ''} onChange={e => updateStyles(selected.id, { backgroundColor: e.target.value })} placeholder="transparent" className="h-6 text-[10px] flex-1" />
                        {selected.styles.backgroundColor && <button onClick={() => updateStyles(selected.id, { backgroundColor: undefined })} className="text-[8px] text-destructive shrink-0">X</button>}
                      </div>
                    </div>
                    <div className="flex gap-0.5 flex-wrap">
                      <Button variant={selected.styles.fontWeight === '700' ? 'default' : 'outline'} size="icon" className="h-6 w-6" onClick={() => updateStyles(selected.id, { fontWeight: selected.styles.fontWeight === '700' ? '400' : '700' })}><Bold className="h-2.5 w-2.5" /></Button>
                      <Button variant={selected.styles.fontStyle === 'italic' ? 'default' : 'outline'} size="icon" className="h-6 w-6" onClick={() => updateStyles(selected.id, { fontStyle: selected.styles.fontStyle === 'italic' ? 'normal' : 'italic' })}><Italic className="h-2.5 w-2.5" /></Button>
                      <Button variant={selected.styles.textAlign === 'left' ? 'default' : 'outline'} size="icon" className="h-6 w-6" onClick={() => updateStyles(selected.id, { textAlign: 'left' })}><AlignLeft className="h-2.5 w-2.5" /></Button>
                      <Button variant={selected.styles.textAlign === 'center' ? 'default' : 'outline'} size="icon" className="h-6 w-6" onClick={() => updateStyles(selected.id, { textAlign: 'center' })}><AlignCenter className="h-2.5 w-2.5" /></Button>
                      <Button variant={selected.styles.textAlign === 'right' ? 'default' : 'outline'} size="icon" className="h-6 w-6" onClick={() => updateStyles(selected.id, { textAlign: 'right' })}><AlignRight className="h-2.5 w-2.5" /></Button>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Espacement ({selected.styles.letterSpacing ?? 0})</Label>
                      <Slider value={[selected.styles.letterSpacing ?? 0]} onValueChange={v => updateStyles(selected.id, { letterSpacing: v[0] })} min={0} max={10} step={1} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Arrondi ({selected.styles.borderRadius ?? 0}px)</Label>
                      <Slider value={[selected.styles.borderRadius ?? 0]} onValueChange={v => updateStyles(selected.id, { borderRadius: v[0] })} min={0} max={30} step={1} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Opacite ({Math.round((selected.styles.opacity ?? 1) * 100)}%)</Label>
                      <Slider value={[(selected.styles.opacity ?? 1) * 100]} onValueChange={v => updateStyles(selected.id, { opacity: v[0] / 100 })} min={10} max={100} step={5} />
                    </div>
                  </>
                )}
                {(selected.type === 'rectangle' || selected.type === 'line') && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Couleur de fond</Label>
                      <div className="flex gap-1.5 items-center">
                        <input type="color" value={selected.styles.backgroundColor || '#000'} onChange={e => updateStyles(selected.id, { backgroundColor: e.target.value })} className="w-6 h-6 rounded border cursor-pointer" />
                        <Input value={selected.styles.backgroundColor || ''} onChange={e => updateStyles(selected.id, { backgroundColor: e.target.value })} className="h-6 text-[10px] flex-1" />
                      </div>
                    </div>
                    {selected.type === 'rectangle' && (
                      <>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Couleur bordure</Label>
                          <div className="flex gap-1.5 items-center">
                            <input type="color" value={selected.styles.borderColor || '#000'} onChange={e => updateStyles(selected.id, { borderColor: e.target.value })} className="w-6 h-6 rounded border cursor-pointer" />
                            <Input value={selected.styles.borderColor || ''} onChange={e => updateStyles(selected.id, { borderColor: e.target.value })} className="h-6 text-[10px] flex-1" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Epaisseur bordure ({selected.styles.borderWidth ?? 0}px)</Label>
                          <Slider value={[selected.styles.borderWidth ?? 0]} onValueChange={v => updateStyles(selected.id, { borderWidth: v[0] })} min={0} max={8} step={1} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Arrondi ({selected.styles.borderRadius ?? 0}px)</Label>
                          <Slider value={[selected.styles.borderRadius ?? 0]} onValueChange={v => updateStyles(selected.id, { borderRadius: v[0] })} min={0} max={50} step={1} />
                        </div>
                      </>
                    )}
                    <div className="space-y-1">
                      <Label className="text-[10px]">Opacite ({Math.round((selected.styles.opacity ?? 1) * 100)}%)</Label>
                      <Slider value={[(selected.styles.opacity ?? 1) * 100]} onValueChange={v => updateStyles(selected.id, { opacity: v[0] / 100 })} min={10} max={100} step={5} />
                    </div>
                  </>
                )}
                {selected.type === 'image' && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Arrondi ({selected.styles.borderRadius ?? 0}px)</Label>
                      <Slider value={[selected.styles.borderRadius ?? 0]} onValueChange={v => updateStyles(selected.id, { borderRadius: v[0] })} min={0} max={100} step={1} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Bordure ({selected.styles.borderWidth ?? 0}px)</Label>
                      <Slider value={[selected.styles.borderWidth ?? 0]} onValueChange={v => updateStyles(selected.id, { borderWidth: v[0] })} min={0} max={6} step={1} />
                    </div>
                    {(selected.styles.borderWidth ?? 0) > 0 && (
                      <div className="space-y-1">
                        <Label className="text-[10px]">Couleur bordure</Label>
                        <input type="color" value={selected.styles.borderColor || '#ccc'} onChange={e => updateStyles(selected.id, { borderColor: e.target.value })} className="w-6 h-6 rounded border cursor-pointer" />
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Move className="h-6 w-6 text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">Selectionnez un element</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentCardEditor;
