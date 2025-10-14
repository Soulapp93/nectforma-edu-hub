import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        
        <div className="flex-1 h-full">
          {isEmbeddable ? (
            <iframe
              src={embedUrl}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <p className="text-muted-foreground text-center">
                Ce lien ne peut pas être intégré directement.
              </p>
              <Button onClick={handleOpenInNewTab}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir le lien
              </Button>
              <a 
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                {url}
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LinkViewerModal;
