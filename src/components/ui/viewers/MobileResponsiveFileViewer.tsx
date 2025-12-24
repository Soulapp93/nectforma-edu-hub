import React, { useState, useEffect, useRef } from 'react';
import { X, Download, ExternalLink, Maximize2, Minimize2, ZoomIn, ZoomOut, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileResponsiveFileViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

const MobileResponsiveFileViewer: React.FC<MobileResponsiveFileViewerProps> = ({
  fileUrl,
  fileName,
  isOpen,
  onClose
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [pdfFallback, setPdfFallback] = useState(false);
  const isMobile = useIsMobile();
  const objectRef = useRef<HTMLObjectElement>(null);

  const getFileExtension = (name: string) => {
    return name.split('.').pop()?.toLowerCase() || '';
  };

  const getFileType = (extension: string) => {
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    const pdfExtensions = ['pdf'];
    const officeExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
    
    if (pdfExtensions.includes(extension)) return 'pdf';
    if (videoExtensions.includes(extension)) return 'video';
    if (imageExtensions.includes(extension)) return 'image';
    if (officeExtensions.includes(extension)) return 'office';
    return 'other';
  };

  const extension = getFileExtension(fileName);
  const fileType = getFileType(extension);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      // Reset states when opening
      setLoading(true);
      setError(false);
      setPdfFallback(false);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Pour les PDFs, on détecte si l'objet a réussi à charger
  useEffect(() => {
    if (fileType === 'pdf' && isOpen && !isMobile) {
      const timer = setTimeout(() => {
        // Si après 3 secondes le loading est toujours actif, passer au fallback
        if (loading) {
          setPdfFallback(true);
          setLoading(false);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [fileType, isOpen, loading, isMobile]);

  const handleDownload = () => {
    // Utiliser fetch pour forcer le téléchargement
    fetch(fileUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch(() => {
        // Fallback: ouvrir dans un nouvel onglet
        window.open(fileUrl, '_blank');
      });
  };

  const handleOpenNewTab = () => {
    window.open(fileUrl, '_blank');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));

  const handlePdfLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handlePdfError = () => {
    // Si l'objet échoue, passer au mode fallback
    setPdfFallback(true);
    setLoading(false);
  };

  if (!isOpen) return null;

  const renderPdfContent = () => {
    // Sur mobile, toujours utiliser Google Docs Viewer
    if (isMobile) {
      const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
      return (
        <div className="flex-1 w-full h-full bg-muted">
          <iframe
            src={googleViewerUrl}
            className="w-full h-full border-0"
            title={fileName}
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
          />
        </div>
      );
    }

    // Sur desktop, si fallback activé, afficher les options de téléchargement
    if (pdfFallback) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center h-full bg-muted/50">
          <div className="bg-background rounded-xl p-8 max-w-lg w-full shadow-lg border">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <FileText className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">{fileName}</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              La prévisualisation n'est pas disponible pour ce document. 
              Vous pouvez le télécharger ou l'ouvrir dans un nouvel onglet.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleDownload} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
              <Button variant="outline" onClick={handleOpenNewTab} className="flex-1">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir dans un nouvel onglet
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Sur desktop, essayer d'abord avec <object> puis <embed>
    return (
      <div className="flex-1 w-full h-full bg-muted relative">
        <object
          ref={objectRef}
          data={fileUrl}
          type="application/pdf"
          className="w-full h-full"
          onLoad={handlePdfLoad}
          onError={handlePdfError}
        >
          {/* Fallback si object ne fonctionne pas */}
          <embed
            src={fileUrl}
            type="application/pdf"
            className="w-full h-full"
          />
        </object>
      </div>
    );
  };

  const renderContent = () => {
    if (fileType === 'image') {
      return (
        <div className="flex-1 flex items-center justify-center overflow-auto p-2 sm:p-4 bg-black/90">
          <img
            src={fileUrl}
            alt={fileName}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom / 100})` }}
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
          />
        </div>
      );
    }

    if (fileType === 'video') {
      return (
        <div className="flex-1 flex items-center justify-center bg-black p-2 sm:p-4">
          <video
            src={fileUrl}
            controls
            autoPlay
            className="max-w-full max-h-full"
            onLoadedData={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
          />
        </div>
      );
    }

    if (fileType === 'pdf') {
      return renderPdfContent();
    }

    if (fileType === 'office') {
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
      return (
        <div className="flex-1 w-full h-full bg-muted">
          <iframe
            src={officeViewerUrl}
            className="w-full h-full border-0"
            title={fileName}
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
          />
        </div>
      );
    }

    // Fallback pour autres fichiers
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center">
        <div className="bg-muted rounded-lg p-6 sm:p-8 max-w-md w-full">
          <p className="text-muted-foreground mb-4 text-sm sm:text-base">
            Ce type de fichier ne peut pas être prévisualisé directement.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleDownload} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
            <Button variant="outline" onClick={handleOpenNewTab} className="flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header responsive */}
      <div className="flex items-center justify-between p-2 sm:p-3 border-b bg-background shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0 h-8 w-8 sm:h-9 sm:w-9"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <span className="text-xs sm:text-sm font-medium truncate">{fileName}</span>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Zoom controls - masqués sur mobile pour les images */}
          {fileType === 'image' && !isMobile && (
            <>
              <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-8 w-8">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs w-10 text-center">{zoom}%</span>
              <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-8 w-8">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="h-8 w-8 sm:h-9 sm:w-9"
            title="Télécharger"
          >
            <Download className="h-4 w-4" />
          </Button>
          
          {!isMobile && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenNewTab}
                className="h-8 w-8 sm:h-9 sm:w-9"
                title="Ouvrir dans un nouvel onglet"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="h-8 w-8 sm:h-9 sm:w-9"
                title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden relative">
        {loading && !pdfFallback && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Chargement...</span>
            </div>
          </div>
        )}
        
        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center h-full">
            <div className="bg-muted rounded-lg p-6 sm:p-8 max-w-md w-full">
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                Impossible de charger le fichier.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleDownload} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
                <Button variant="outline" onClick={handleOpenNewTab} className="flex-1">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir dans un nouvel onglet
                </Button>
              </div>
            </div>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
};

export default MobileResponsiveFileViewer;
