import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../button';

interface NativeBrowserViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

const NativeBrowserViewer: React.FC<NativeBrowserViewerProps> = ({
  fileUrl,
  fileName,
  isOpen,
  onClose
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Barre d'outils simple */}
      <div className="h-12 border-b bg-background flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium truncate max-w-md">{fileName}</span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="hover:bg-accent"
          title="Fermer (Échap)"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Iframe en plein écran - délègue tous les contrôles au navigateur */}
      <iframe
        src={fileUrl}
        title={fileName}
        className="flex-1 w-full border-0"
        style={{
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
};

export default NativeBrowserViewer;
