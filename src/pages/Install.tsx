import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Check, Share, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Application installée !</h1>
          <p className="text-muted-foreground">Nectforma est maintenant disponible sur votre écran d'accueil.</p>
          <Button onClick={() => navigate('/')} className="w-full">Ouvrir Nectforma</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <div className="w-24 h-24 mx-auto">
            <img src="/pwa-icon-512.png" alt="Nectforma" className="w-full h-full rounded-2xl shadow-lg" />
          </div>
          <h1 className="text-3xl font-bold">Installer Nectforma</h1>
          <p className="text-muted-foreground">
            Accédez à Nectforma directement depuis votre écran d'accueil, comme une vraie application mobile.
          </p>
        </div>

        <div className="space-y-3 text-left bg-card rounded-xl p-6 shadow-sm border">
          <h2 className="font-semibold text-lg">Avantages</h2>
          <div className="space-y-2">
            {[
              'Accès rapide depuis l\'écran d\'accueil',
              'Fonctionne hors-ligne',
              'Notifications push',
              'Expérience plein écran',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {isIOS ? (
          <div className="bg-card rounded-xl p-6 shadow-sm border space-y-4">
            <h2 className="font-semibold">Sur iPhone / iPad</h2>
            <div className="space-y-3 text-left text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <span>Appuyez sur <Share className="w-4 h-4 inline text-primary" /> <strong>Partager</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <span>Sélectionnez <strong>"Sur l'écran d'accueil"</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <span>Appuyez sur <strong>"Ajouter"</strong></span>
              </div>
            </div>
          </div>
        ) : deferredPrompt ? (
          <Button onClick={handleInstall} size="lg" className="w-full gap-2">
            <Download className="w-5 h-5" />
            Installer Nectforma
          </Button>
        ) : (
          <div className="bg-card rounded-xl p-6 shadow-sm border space-y-4">
            <h2 className="font-semibold">Sur Android</h2>
            <div className="space-y-3 text-left text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <span>Appuyez sur <MoreVertical className="w-4 h-4 inline text-primary" /> <strong>le menu du navigateur</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <span>Sélectionnez <strong>"Installer l'application"</strong></span>
              </div>
            </div>
          </div>
        )}

        <Button variant="ghost" onClick={() => navigate('/')} className="text-muted-foreground">
          Continuer sur le navigateur
        </Button>
      </div>
    </div>
  );
};

export default Install;
