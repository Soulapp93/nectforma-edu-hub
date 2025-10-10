import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EnhancedOfficeViewer from './EnhancedOfficeViewer';

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

  const getFileExtension = (fileName: string): string => {
    return fileName.split('.').pop()?.toLowerCase() || '';
  };

  const fileExtension = getFileExtension(fileName);

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
      {/* Bouton fermer en haut à droite */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="bg-background/80 backdrop-blur-sm hover:bg-background"
          title="Fermer"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Visualiseur */}
      <div className="flex-1 overflow-hidden">
        <EnhancedOfficeViewer
          fileUrl={fileUrl}
          fileName={fileName}
          fileExtension={fileExtension}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
      </div>
    </div>
  );
};

export default ChromeStyleDocumentViewer;
