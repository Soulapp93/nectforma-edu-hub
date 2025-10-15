import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, AlertCircle, Copy, CheckCheck, Video, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface LinkViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

const LinkViewerModal: React.FC<LinkViewerModalProps> = ({
  isOpen,
  onClose,
  url,
  title
}) => {
  const [copied, setCopied] = useState(false);
  const [embedError, setEmbedError] = useState(false);

  // Réinitialiser l'état quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setEmbedError(false);
    }
  }, [isOpen]);

  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  
  // Extraire l'ID de la vidéo YouTube
  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeVideoId(url);
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Lien copié dans le presse-papier !');
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast.error('Erreur lors de la copie du lien');
    }
  };

  const handleDirectAccess = () => {
    // Créer un élément <a> temporaire pour contourner les restrictions
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isYouTube ? <Video className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Section principale avec miniature YouTube ou icône */}
          {isYouTube && thumbnailUrl ? (
            <div className="relative rounded-lg overflow-hidden bg-muted">
              <img 
                src={thumbnailUrl} 
                alt="Miniature vidéo YouTube" 
                className="w-full h-64 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="bg-red-600 rounded-full p-4">
                  <Video className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-32 rounded-lg bg-muted flex items-center justify-center">
              <Link2 className="h-16 w-16 text-muted-foreground" />
            </div>
          )}

          {/* Alert informatif */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {isYouTube ? (
                <>
                  <strong>Cette vidéo YouTube a des restrictions.</strong><br />
                  Le propriétaire a désactivé la lecture intégrée. Utilisez les options ci-dessous pour accéder au contenu.
                </>
              ) : (
                <>
                  <strong>Lien externe</strong><br />
                  Utilisez les options ci-dessous pour accéder au contenu.
                </>
              )}
            </AlertDescription>
          </Alert>

          {/* URL avec fond */}
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Adresse du lien :</p>
            <p className="text-sm font-mono break-all text-foreground select-all">{url}</p>
          </div>

          {/* Boutons d'action */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button 
              size="lg" 
              onClick={handleCopyLink}
              variant="default"
              className="w-full"
            >
              {copied ? (
                <>
                  <CheckCheck className="h-5 w-5 mr-2" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5 mr-2" />
                  Copier le lien
                </>
              )}
            </Button>

            <Button 
              size="lg" 
              onClick={handleDirectAccess}
              variant="secondary"
              className="w-full"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Ouvrir le lien
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
              💡 Comment accéder au contenu :
            </h4>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1.5 list-decimal list-inside">
              <li>Cliquez sur "Copier le lien" ci-dessus</li>
              <li>Ouvrez un nouvel onglet dans votre navigateur</li>
              <li>Collez le lien dans la barre d'adresse (Ctrl+V ou Cmd+V)</li>
              <li>Appuyez sur Entrée pour accéder au contenu</li>
            </ol>
          </div>

          {isYouTube && (
            <p className="text-xs text-muted-foreground text-center">
              Cette restriction est imposée par le propriétaire de la vidéo YouTube, pas par cette plateforme.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LinkViewerModal;
