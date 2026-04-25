import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  PenTool, UserCircle2, ScrollText, Stamp, Eraser, Upload, Save, Loader2, Trash2, Eye,
} from 'lucide-react';
import { fileUploadService } from '@/services/fileUploadService';

type SigType = 'pedagogue' | 'jury' | 'stamp';

interface BulletinSignature {
  id: string;
  period_id: string;
  signature_type: SigType;
  name: string | null;
  title: string | null;
  signature_image: string | null;
}

const TYPE_META: Record<SigType, { label: string; icon: React.ComponentType<any>; color: string; defaultTitle: string }> = {
  pedagogue: { label: 'Responsable Pédagogique', icon: UserCircle2, color: '#3B82F6', defaultTitle: 'Responsable pédagogique' },
  jury:      { label: 'Président du Jury',       icon: ScrollText,  color: '#8B5CF6', defaultTitle: 'Président du jury' },
  stamp:     { label: "Cachet de l'Établissement", icon: Stamp,     color: '#EF4444', defaultTitle: "Cachet officiel" },
};

interface Props {
  periodId: string | null;
  establishmentId: string;
}

const SignaturesCachetTab: React.FC<Props> = ({ periodId }) => {
  const queryClient = useQueryClient();

  const { data: signatures = [], isLoading } = useQuery({
    queryKey: ['bulletin-signatures', periodId],
    queryFn: async () => {
      if (!periodId) return [];
      const { data, error } = await (supabase as any)
        .from('bulletin_signatures')
        .select('*')
        .eq('period_id', periodId);
      if (error) throw error;
      return (data || []) as BulletinSignature[];
    },
    enabled: !!periodId,
  });

  const upsert = useMutation({
    mutationFn: async (payload: Partial<BulletinSignature> & { signature_type: SigType }) => {
      if (!periodId) throw new Error('Aucune période sélectionnée');
      const existing = signatures.find(s => s.signature_type === payload.signature_type);
      if (existing) {
        const { data, error } = await (supabase as any)
          .from('bulletin_signatures')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await (supabase as any)
        .from('bulletin_signatures')
        .insert({ ...payload, period_id: periodId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulletin-signatures', periodId] });
      toast.success('Signature enregistrée');
    },
    onError: (e: any) => toast.error(e?.message || 'Erreur lors de la sauvegarde'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('bulletin_signatures').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulletin-signatures', periodId] });
      toast.success('Signature supprimée');
    },
    onError: (e: any) => toast.error(e?.message || 'Erreur lors de la suppression'),
  });

  const [editingType, setEditingType] = useState<SigType | null>(null);

  if (!periodId) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Sélectionnez une période d'évaluation pour configurer les signatures et le cachet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="signatures-cachet-tab">
      <div>
        <h2 className="text-xl font-bold text-foreground">Signatures et cachet</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configurez les signatures qui apparaîtront en bas des bulletins de notes pour cette période.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(TYPE_META) as SigType[]).map((type) => {
          const meta = TYPE_META[type];
          const Icon = meta.icon;
          const sig = signatures.find(s => s.signature_type === type);
          const hasSig = !!sig?.signature_image;
          return (
            <Card key={type} className="relative overflow-hidden border-2 transition-all hover:shadow-lg" data-testid={`signature-card-${type}`}>
              <div className="h-1.5" style={{ backgroundColor: meta.color }} />
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${meta.color}18` }}>
                    <Icon className="h-5 w-5" style={{ color: meta.color }} />
                  </div>
                  <h3 className="font-semibold text-sm">{meta.label}</h3>
                </div>

                {/* Preview area */}
                <div className="relative h-28 bg-muted/30 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                  {hasSig ? (
                    <img src={sig!.signature_image!} alt="" className="max-h-24 max-w-full object-contain" />
                  ) : (
                    <p className="text-xs text-muted-foreground">Aucune signature</p>
                  )}
                </div>

                {sig?.name && (
                  <div className="text-xs">
                    <p className="font-semibold truncate">{sig.name}</p>
                    <p className="text-muted-foreground truncate">{sig.title || meta.defaultTitle}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => setEditingType(type)}
                    data-testid={`edit-signature-${type}`}
                    style={{ backgroundColor: meta.color }}
                  >
                    <PenTool className="h-3.5 w-3.5" />
                    {hasSig ? 'Modifier' : 'Configurer'}
                  </Button>
                  {hasSig && sig && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => remove.mutate(sig.id)}
                      data-testid={`delete-signature-${type}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Aperçu bulletin */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Aperçu sur le bulletin</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-br from-slate-50 to-white rounded-lg border">
            {(Object.keys(TYPE_META) as SigType[]).map((type) => {
              const sig = signatures.find(s => s.signature_type === type);
              return (
                <div key={type} className="text-center space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{TYPE_META[type].label}</p>
                  <div className="h-16 flex items-center justify-center">
                    {sig?.signature_image
                      ? <img src={sig.signature_image} alt="" className="max-h-14 object-contain" />
                      : <span className="text-[10px] text-muted-foreground italic">— non configuré —</span>}
                  </div>
                  {sig?.name && (
                    <>
                      <p className="text-xs font-semibold">{sig.name}</p>
                      <p className="text-[10px] text-muted-foreground">{sig.title || TYPE_META[type].defaultTitle}</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {editingType && (
        <SignatureEditor
          type={editingType}
          existing={signatures.find(s => s.signature_type === editingType)}
          onClose={() => setEditingType(null)}
          onSave={(payload) => {
            upsert.mutate(payload);
            setEditingType(null);
          }}
        />
      )}
    </div>
  );
};

// =====================================================
// Sub-component: SignatureEditor (draw or upload)
// =====================================================

interface EditorProps {
  type: SigType;
  existing?: BulletinSignature;
  onClose: () => void;
  onSave: (payload: { signature_type: SigType; name: string; title: string; signature_image: string | null }) => void;
}

const SignatureEditor: React.FC<EditorProps> = ({ type, existing, onClose, onSave }) => {
  const meta = TYPE_META[type];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [name, setName] = useState(existing?.name || '');
  const [title, setTitle] = useState(existing?.title || meta.defaultTitle);
  const [imageData, setImageData] = useState<string | null>(existing?.signature_image || null);
  const [mode, setMode] = useState<'draw' | 'upload' | 'preview'>(existing?.signature_image ? 'preview' : 'draw');
  const [uploading, setUploading] = useState(false);

  // Init canvas with existing image
  useEffect(() => {
    if (mode !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1f2937';
  }, [mode]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const evt: any = 'touches' in e ? e.touches[0] : e;
    return {
      x: ((evt.clientX - rect.left) / rect.width) * canvas.width,
      y: ((evt.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDrawing(true);
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const stopDrawing = () => setDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await fileUploadService.uploadFile(file, 'module-files');
      setImageData(url);
      setMode('preview');
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    let signatureImage: string | null = imageData;
    if (mode === 'draw' && canvasRef.current) {
      signatureImage = canvasRef.current.toDataURL('image/png');
    }
    onSave({ signature_type: type, name: name.trim(), title: title.trim(), signature_image: signatureImage });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0" data-testid={`signature-editor-${type}`}>
        <DialogHeader className="p-5 pb-3 border-b" style={{ background: `linear-gradient(135deg, ${meta.color}10, transparent)` }}>
          <DialogTitle className="flex items-center gap-2">
            <meta.icon className="h-5 w-5" style={{ color: meta.color }} />
            {meta.label}
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nom</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Marie Dupont" data-testid="sig-name-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Titre / Fonction</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={meta.defaultTitle} data-testid="sig-title-input" />
            </div>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
            <button
              onClick={() => setMode('draw')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${mode === 'draw' ? 'bg-white shadow-sm' : 'text-muted-foreground'}`}
              data-testid="sig-mode-draw"
            >
              <PenTool className="h-3 w-3 inline mr-1" /> Dessiner
            </button>
            <button
              onClick={() => setMode('upload')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${mode === 'upload' ? 'bg-white shadow-sm' : 'text-muted-foreground'}`}
              data-testid="sig-mode-upload"
            >
              <Upload className="h-3 w-3 inline mr-1" /> Importer
            </button>
            {imageData && (
              <button
                onClick={() => setMode('preview')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${mode === 'preview' ? 'bg-white shadow-sm' : 'text-muted-foreground'}`}
              >
                <Eye className="h-3 w-3 inline mr-1" /> Aperçu
              </button>
            )}
          </div>

          {/* Canvas / Upload / Preview */}
          {mode === 'draw' && (
            <div className="space-y-2">
              <div className="border-2 border-dashed border-border rounded-lg overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="w-full touch-none cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  data-testid="sig-canvas"
                />
              </div>
              <Button variant="outline" size="sm" onClick={clearCanvas} className="gap-1.5">
                <Eraser className="h-3.5 w-3.5" /> Effacer
              </Button>
            </div>
          )}

          {mode === 'upload' && (
            <div className="space-y-2">
              <label className={`flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:bg-muted/30 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploading ? (
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Cliquer pour importer</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG transparent recommandé · max 5 Mo</p>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                  data-testid="sig-upload-input"
                />
              </label>
            </div>
          )}

          {mode === 'preview' && imageData && (
            <div className="border-2 border-dashed border-border rounded-lg p-6 bg-white flex items-center justify-center">
              <img src={imageData} alt="Aperçu signature" className="max-h-32 object-contain" />
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t bg-muted/20 flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} className="gap-1.5" style={{ backgroundColor: meta.color }} data-testid="sig-save-btn">
            <Save className="h-4 w-4" /> Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignaturesCachetTab;
