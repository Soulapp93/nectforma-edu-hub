import React, { useEffect, useState } from 'react';
import { X, Download, Printer, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChromeStyleDocumentViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ChromeStyleDocumentViewer: React.FC<ChromeStyleDocumentViewerProps> = ({
  fileUrl,
  fileName,
  isOpen,
  onClose
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  const getFileType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(extension)) return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) return 'office';
    return 'other';
  };

  const fileType = getFileType(fileName);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          exitFullscreen();
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isFullscreen, onClose]);

  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      window.open(fileUrl, '_blank');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenInNewTab = () => {
    window.open(fileUrl, '_blank');
  };

  const toggleFullscreen = async () => {
    const element = document.getElementById('viewer-container');
    if (!element) return;

    try {
      if (!isFullscreen) {
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Erreur lors du basculement en plein écran:', error);
    }
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (error) {
        console.error('Erreur lors de la sortie du plein écran:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="viewer-container"
      className="fixed inset-0 z-[9999] bg-background flex flex-col"
    >
      {/* Barre d'outils style Chrome */}
      <div className="bg-muted border-b border-border px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <span className="text-sm font-medium truncate">{fileName}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            title="Télécharger"
          >
            <Download className="h-4 w-4" />
          </Button>

          {fileType !== 'other' && fileType !== 'office' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrint}
              title="Imprimer"
            >
              <Printer className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenInNewTab}
            title="Ouvrir dans un nouvel onglet"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            title="Fermer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Zone de visualisation */}
      <div className="flex-1 relative bg-muted/30 overflow-hidden">
        {fileType === 'pdf' && (
          <iframe
            src={fileUrl}
            className="w-full h-full border-0"
            title={fileName}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        )}

        {fileType === 'image' && (
          <div className="flex items-center justify-center h-full p-4">
            <img 
              src={fileUrl} 
              alt={fileName}
              className="max-w-full max-h-full object-contain"
              onLoad={() => setLoading(false)}
            />
          </div>
        )}

        {fileType === 'office' && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <p className="text-lg font-medium mb-4">Fichier Office détecté</p>
            <p className="text-muted-foreground mb-6">
              Ce type de fichier doit être ouvert dans un nouvel onglet pour être visualisé correctement.
            </p>
            <Button onClick={handleOpenInNewTab}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir dans un nouvel onglet
            </Button>
          </div>
        )}

        {fileType === 'other' && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <p className="text-lg font-medium mb-4">Aperçu non disponible</p>
            <p className="text-muted-foreground mb-6">
              Ce type de fichier ne peut pas être visualisé directement. Vous pouvez le télécharger.
            </p>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger le fichier
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChromeStyleDocumentViewer;
