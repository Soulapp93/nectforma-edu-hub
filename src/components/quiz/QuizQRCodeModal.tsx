import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check, QrCode, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAppBaseUrl } from '@/lib/appBaseUrl';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pinCode: string;
}

const QuizQRCodeModal: React.FC<Props> = ({ open, onOpenChange, pinCode }) => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const joinUrl = `${getAppBaseUrl()}/quiz/join?pin=${pinCode}`;

  useEffect(() => {
    if (open && pinCode) {
      QRCode.toDataURL(joinUrl, {
        width: 300,
        margin: 2,
        color: { dark: '#1a1a2e', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      }).then(setQrDataUrl).catch((e) => logger.error(e));
    }
  }, [open, pinCode, joinUrl]);

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    toast.success('Lien copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyPin = () => {
    navigator.clipboard.writeText(pinCode);
    toast.success('PIN copié !');
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rejoins le Quiz !',
          text: `Rejoins le quiz avec le code PIN : ${pinCode}`,
          url: joinUrl,
        });
      } catch {}
    } else {
      copyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" /> Partager le Quiz
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 text-center">
          {/* QR Code */}
          {qrDataUrl && (
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-2xl shadow-lg inline-block">
                <img src={qrDataUrl} alt="QR Code Quiz" className="w-56 h-56" />
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Scannez ce QR code ou entrez le code PIN ci-dessous
          </p>

          {/* PIN Display */}
          <button onClick={copyPin}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 hover:border-primary/40 transition-all">
            <span className="text-4xl font-black tracking-[0.4em] text-primary">{pinCode}</span>
          </button>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={copyLink} variant="outline" className="flex-1 gap-2 rounded-xl">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copié !' : 'Copier le lien'}
            </Button>
            <Button onClick={share} className="flex-1 gap-2 rounded-xl">
              <Share2 className="h-4 w-4" /> Partager
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuizQRCodeModal;
