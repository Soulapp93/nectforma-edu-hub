import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, ExternalLink, Loader2, FileText, AlertCircle, Maximize2, Minimize2 } from 'lucide-react';
import FloatingViewerWindow from './FloatingViewerWindow';

interface Props {
  open: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  filename?: string;
}

/**
 * Resizable + draggable PDF viewer (uses FloatingViewerWindow).
 * Header looks identical to ProductionFileViewer for full UX consistency.
 */
const PdfViewerModal: React.FC<Props> = ({ open, onClose, url, title = 'Référentiel de formation', filename }) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    if (open) {
      setIframeLoaded(false);
      setIframeError(false);
    }
  }, [open, url]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'document.pdf';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const embedUrl = `${url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`;

  return (
    <FloatingViewerWindow
      open={open}
      onClose={onClose}
      testId="pdf-viewer-modal"
      renderHeader={({ dragHandleProps, isMaximized, toggleMaximize }) => (
        <div
          className="flex items-center justify-between gap-2 px-3 sm:px-5 py-3 border-b border-border bg-card/95 backdrop-blur-sm shrink-0"
          {...dragHandleProps}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-foreground truncate" data-testid="pdf-viewer-title">
                {title}
              </h3>
              {filename && (
                <p className="text-[11px] text-muted-foreground truncate hidden sm:block">{filename}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0" data-no-drag>
            <Button variant="ghost" size="sm" onClick={handleDownload} className="gap-1.5 hidden sm:inline-flex" data-testid="pdf-viewer-download" title="Télécharger">
              <Download className="h-4 w-4" />
              <span>Télécharger</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDownload} className="sm:hidden h-9 w-9" data-testid="pdf-viewer-download-mobile" title="Télécharger">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')} className="h-9 w-9" data-testid="pdf-viewer-newtab" title="Ouvrir dans un nouvel onglet">
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMaximize}
              className="h-9 w-9 hidden sm:inline-flex"
              data-testid="pdf-viewer-maximize"
              title={isMaximized ? 'Restaurer' : 'Plein écran'}
            >
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive" data-testid="pdf-viewer-close" title="Fermer">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    >
      {!iframeLoaded && !iframeError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground pointer-events-none z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Chargement du document...</p>
        </div>
      )}

      {iframeError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/15 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-amber-600" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">Impossible d'afficher le PDF dans le navigateur</p>
            <p className="text-sm text-muted-foreground mt-1">Téléchargez le fichier ou ouvrez-le dans un nouvel onglet pour le consulter.</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button onClick={handleDownload} className="gap-2"><Download className="h-4 w-4" /> Télécharger</Button>
            <Button variant="outline" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')} className="gap-2"><ExternalLink className="h-4 w-4" /> Nouvel onglet</Button>
          </div>
        </div>
      ) : (
        <iframe
          key={url}
          src={embedUrl}
          title={title}
          className="absolute inset-0 w-full h-full border-0 bg-white"
          onLoad={() => setIframeLoaded(true)}
          onError={() => setIframeError(true)}
          data-testid="pdf-viewer-iframe"
        />
      )}
    </FloatingViewerWindow>
  );
};

export default PdfViewerModal;
