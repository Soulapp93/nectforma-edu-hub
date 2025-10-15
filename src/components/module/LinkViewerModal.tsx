import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [embedError, setEmbedError] = useState(false);
  const [showIframe, setShowIframe] = useState(true);

  // Réinitialiser l'état quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setEmbedError(false);
      setShowIframe(true);
    }
  }, [isOpen]);

  // Fonction pour détecter et convertir les URLs YouTube en format embed
  const getEmbedUrl = (url: string) => {
    // YouTube standard: youtube.com/watch?v=VIDEO_ID
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vérifier si c'est déjà une URL embed
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    
    return null;
  };

  const embedUrl = getEmbedUrl(url);
  const isEmbeddable = !!embedUrl;
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

  const handleOpenInNewTab = () => {
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    window.open(formattedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir dans un nouvel onglet
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 h-full flex flex-col gap-4">
          {isYouTube && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Certaines vidéos YouTube ne peuvent pas être intégrées directement. 
                Si la vidéo ne s'affiche pas, cliquez sur "Ouvrir dans un nouvel onglet" ci-dessus.
              </AlertDescription>
            </Alert>
          )}

          {embedError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Cette vidéo ne peut pas être lue ici car le propriétaire a désactivé la lecture sur d'autres sites.
                Veuillez cliquer sur "Ouvrir dans un nouvel onglet" pour la voir sur YouTube.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex-1 h-full">
            {isEmbeddable && showIframe ? (
              <iframe
                src={embedUrl}
                className="w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={title}
                onError={() => setEmbedError(true)}
              />
            ) : !isEmbeddable ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground text-center text-lg font-medium">
                  Ce lien ne peut pas être intégré directement
                </p>
                <p className="text-muted-foreground text-center text-sm max-w-md">
                  Cliquez sur le bouton ci-dessous pour ouvrir le lien dans un nouvel onglet
                </p>
                <Button size="lg" onClick={handleOpenInNewTab}>
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Ouvrir le lien
                </Button>
                <a 
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all max-w-lg text-center"
                >
                  {url}
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LinkViewerModal;
