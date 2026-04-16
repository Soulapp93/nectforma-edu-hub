import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { signatureService, SignatureRequest } from '@/services/signatureService';
import { Check, Loader2, AlertTriangle, Eraser, FileText, PenTool } from 'lucide-react';

const SignPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [request, setRequest] = useState<(SignatureRequest & { formations?: any; establishments?: any }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!token) return;
    signatureService.getByToken(token).then(data => {
      setRequest(data);
      if (data?.status === 'signed') setSigned(true);
      setLoading(false);
    }).catch(() => {
      setError('Lien invalide ou expire');
      setLoading(false);
    });
  }, [token]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || signed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      if ('touches' in e) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const start = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      isDrawingRef.current = true;
      lastPosRef.current = getPos(e);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!isDrawingRef.current) return;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPosRef.current = pos;
    };

    const stop = () => { isDrawingRef.current = false; };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stop);
    canvas.addEventListener('mouseleave', stop);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stop);

    return () => {
      canvas.removeEventListener('mousedown', start);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stop);
      canvas.removeEventListener('mouseleave', stop);
      canvas.removeEventListener('touchstart', start);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stop);
    };
  }, [request, signed]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSign = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !token) return;
    const dataUrl = canvas.toDataURL('image/png');
    // Check if canvas is empty
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const hasDrawing = pixels.some((v, i) => i % 4 === 3 && v > 0);
      if (!hasDrawing) {
        setError('Veuillez signer avant de valider');
        return;
      }
    }
    try {
      setSigning(true);
      setError('');
      await signatureService.signRequest(token, dataUrl);
      setSigned(true);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la signature');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!request || error === 'Lien invalide ou expire') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h2 className="text-lg font-semibold mb-2">Lien invalide ou expire</h2>
            <p className="text-sm text-muted-foreground text-center">Ce lien de signature n'est plus valide. Veuillez contacter l'administrateur.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold mb-2 text-emerald-800">Signature enregistree</h2>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Votre signature a ete appliquee aux bulletins de notes.
            </p>
            {request.signature_image_url && (
              <div className="border rounded-lg p-3 bg-white">
                <img src={request.signature_image_url} alt="Signature" className="h-16 object-contain" />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              Signe le {request.signed_at ? new Date(request.signed_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <PenTool className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Signature de bulletins</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {(request as any).establishments?.name || 'Etablissement'}
          </p>
        </div>

        {/* Info card */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-medium text-sm">{(request as any).formations?.title || 'Formation'}</p>
                <p className="text-xs text-muted-foreground">Bulletins de notes a signer</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Signataire</p>
                <p className="font-medium">{request.signer_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="font-medium">{request.signer_role}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signature pad */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Votre signature</p>
              <Button variant="ghost" size="sm" onClick={clearCanvas} className="gap-1.5 text-xs h-7">
                <Eraser className="h-3.5 w-3.5" /> Effacer
              </Button>
            </div>
            <div className="border-2 border-dashed border-border rounded-xl bg-white overflow-hidden" data-testid="signature-pad">
              <canvas
                ref={canvasRef}
                className="w-full cursor-crosshair touch-none"
                style={{ height: 200 }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Dessinez votre signature avec la souris ou le doigt
            </p>
            {error && <p className="text-xs text-destructive text-center">{error}</p>}
          </CardContent>
        </Card>

        {/* Submit */}
        <Button
          onClick={handleSign}
          disabled={signing}
          className="w-full gap-2 h-11"
          data-testid="submit-signature"
        >
          {signing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {signing ? 'Signature en cours...' : 'Signer et valider'}
        </Button>

        <p className="text-[10px] text-muted-foreground text-center">
          En signant, vous certifiez avoir pris connaissance des bulletins et validez leur contenu.
        </p>
      </div>
    </div>
  );
};

export default SignPage;
