import React, { useState, useEffect, useRef } from 'react';
import { X, Download, ExternalLink, Maximize2, Minimize2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import AdvancedPDFViewer from './AdvancedPDFViewer';
import AudioViewer from './AudioViewer';
import TextViewer from './TextViewer';
import ArchiveViewer from './ArchiveViewer';
import { useResolvedFileUrl } from '@/hooks/useResolvedFileUrl';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { configurePdfJsWorker } from '@/lib/pdfWorker';

// Configuration de PDF.js (worker) - local/bundled for reliability (mobile-safe)
configurePdfJsWorker(pdfjs);


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
  const [pdfPages, setPdfPages] = useState(0);
  const [pdfPage, setPdfPage] = useState(1);
  const [useAdvancedPdfViewer, setUseAdvancedPdfViewer] = useState(true);
  const isMobile = useIsMobile();
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const watchdogRef = useRef<number | null>(null);

  const { resolvedUrl, isResolving } = useResolvedFileUrl(fileUrl, { enabled: isOpen });
  const effectiveUrl = resolvedUrl;

  const getFileExtension = (name: string) => {
    return name.split('.').pop()?.toLowerCase() || '';
  };

  const getFileType = (extension: string) => {
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    const pdfExtensions = ['pdf'];
    const officeExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'];
    const textExtensions = ['txt', 'md', 'markdown', 'log', 'json', 'xml', 'yaml', 'yml', 
                           'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'hpp',
                           'css', 'scss', 'less', 'html', 'sh', 'bash', 'sql', 'php', 'rb', 
                           'go', 'rs', 'swift', 'csv'];
    const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz'];
    
    if (pdfExtensions.includes(extension)) return 'pdf';
    if (videoExtensions.includes(extension)) return 'video';
    if (imageExtensions.includes(extension)) return 'image';
    if (officeExtensions.includes(extension)) return 'office';
    if (audioExtensions.includes(extension)) return 'audio';
    if (textExtensions.includes(extension)) return 'text';
    if (archiveExtensions.includes(extension)) return 'archive';
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
      if (fileType === 'pdf') {
        setPdfPages(0);
        setPdfPage(1);
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, fileType]);

  // Network probe + watchdog to avoid infinite "Chargement..." when the file is unreachable or blocked
  useEffect(() => {
    if (!isOpen) return;
    if (isResolving) return;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);

    if (watchdogRef.current) window.clearTimeout(watchdogRef.current);
    watchdogRef.current = window.setTimeout(() => {
      setLoading(false);
      setError(true);
      toast.error('Le fichier met trop de temps à charger. Essayez de l’ouvrir dans un nouvel onglet.');
    }, 20000);

    // Tiny fetch to verify the URL is actually reachable (avoids downloading the whole file)
    fetch(effectiveUrl, {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
      signal: controller.signal,
    })
      .then((res) => {
        // Some servers don’t support Range and may return 200
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      })
      .catch(() => {
        setLoading(false);
        setError(true);
        toast.error('Impossible de charger le fichier.');
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
      });

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
      if (watchdogRef.current) window.clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    };
  }, [isOpen, isResolving, effectiveUrl]);

  // Clear watchdog as soon as something finishes (success or error)
  useEffect(() => {
    if (!isOpen) return;
    if (loading) return;
    if (watchdogRef.current) window.clearTimeout(watchdogRef.current);
    watchdogRef.current = null;
  }, [isOpen, loading]);

  const handleDownload = () => {
    fetch(effectiveUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Téléchargement démarré');
      })
      .catch(() => {
        window.open(effectiveUrl, '_blank', 'noopener,noreferrer');
      });
  };

  const handleOpenNewTab = () => {
    window.open(effectiveUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(fileUrl).then(() => {
      toast.success('Lien copié dans le presse-papier');
    }).catch(() => {
      toast.error('Impossible de copier le lien');
    });
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

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));

  if (!isOpen) return null;

  // Use specialized viewers for specific file types
  if (fileType === 'pdf' && useAdvancedPdfViewer) {
    return (
      <AdvancedPDFViewer
        fileUrl={effectiveUrl}
        fileName={fileName}
        isOpen={isOpen}
        onClose={onClose}
        onShare={handleShare}
      />
    );
  }

  if (fileType === 'audio') {
    return (
      <AudioViewer
        fileUrl={effectiveUrl}
        fileName={fileName}
        isOpen={isOpen}
        onClose={onClose}
        onShare={handleShare}
      />
    );
  }

  if (fileType === 'text') {
    return (
      <TextViewer
        fileUrl={effectiveUrl}
        fileName={fileName}
        isOpen={isOpen}
        onClose={onClose}
        onShare={handleShare}
      />
    );
  }

  if (fileType === 'archive') {
    return (
      <ArchiveViewer
        fileUrl={effectiveUrl}
        fileName={fileName}
        isOpen={isOpen}
        onClose={onClose}
        onShare={handleShare}
      />
    );
  }

  const renderPdfContent = () => {
    const scale = zoom / 100;

    return (
      <div className="flex-1 w-full h-full bg-muted overflow-auto" ref={pdfContainerRef}>
        <div className="min-h-full w-full flex items-start justify-center p-4 sm:p-6">
          <Document
            file={{ url: effectiveUrl }}
            options={{ disableRange: true, disableStream: true }}
            onLoadSuccess={({ numPages }) => {
              setPdfPages(numPages);
              setLoading(false);
              setError(false);
            }}
            onLoadError={() => {
              setLoading(false);
              setError(true);
            }}
            loading={null}
          >
            <Page
              pageNumber={pdfPage}
              scale={scale}
              renderTextLayer
              renderAnnotationLayer
              className="shadow-2xl"
              onRenderSuccess={() => setLoading(false)}
            />
          </Document>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (fileType === 'image') {
      return (
        <div className="flex-1 flex items-center justify-center overflow-auto p-2 sm:p-4 bg-black/90">
          <img
            src={effectiveUrl}
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
            src={effectiveUrl}
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
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(effectiveUrl)}`;
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
          {/* Navigation PDF */}
          {fileType === 'pdf' && pdfPages > 1 && (
            <div className="hidden sm:flex items-center gap-1 mr-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                disabled={pdfPage <= 1}
                className="h-8 w-8"
                title="Page précédente"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs w-16 text-center tabular-nums">
                {pdfPage}/{pdfPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPdfPage((p) => Math.min(pdfPages, p + 1))}
                disabled={pdfPage >= pdfPages}
                className="h-8 w-8"
                title="Page suivante"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Zoom controls - masqués sur mobile */}
          {(fileType === 'image' || fileType === 'pdf') && !isMobile && (
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

          {/* Share button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="h-8 w-8 sm:h-9 sm:w-9"
            title="Partager le lien"
          >
            <Share2 className="h-4 w-4" />
          </Button>

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
        {(loading || isResolving) && (
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
