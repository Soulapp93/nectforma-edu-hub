import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Download, ExternalLink, Maximize2, Minimize2, ZoomIn, ZoomOut, 
  ChevronLeft, ChevronRight, Share2, Loader2, FileWarning, RotateCcw, AlertTriangle,
  RotateCw, RefreshCw, Grid3X3, Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { useResolvedFileUrl } from '@/hooks/useResolvedFileUrl';
import { useImageTransform } from './hooks/useImageTransform';
import AudioViewer from './AudioViewer';
import TextViewer from './TextViewer';
import ArchiveViewer from './ArchiveViewer';
import AnnotationLayer from './components/AnnotationLayer';

// Utility to detect iOS WebKit
const isIOSDevice = () => {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

interface ProductionFileViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

type FileType = 'pdf' | 'image' | 'video' | 'audio' | 'office' | 'text' | 'archive' | 'other';

const getFileExtension = (name: string): string => {
  return name.split('.').pop()?.toLowerCase() || '';
};

const getFileType = (extension: string): FileType => {
  const typeMap: Record<string, FileType> = {
    // PDF
    pdf: 'pdf',
    // Images
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', 
    bmp: 'image', svg: 'image', webp: 'image', heic: 'image',
    // Video
    mp4: 'video', webm: 'video', ogg: 'video', mov: 'video', avi: 'video', mkv: 'video',
    // Audio
    mp3: 'audio', wav: 'audio', aac: 'audio', flac: 'audio', m4a: 'audio', wma: 'audio',
    // Excel (-> Office Online, same as doc/ppt)
    xls: 'office', xlsx: 'office', csv: 'text',
    // Office (iframe-based)
    doc: 'office', docx: 'office', ppt: 'office', pptx: 'office',
    // Text/Code
    txt: 'text', md: 'text', markdown: 'text', log: 'text', json: 'text', xml: 'text',
    yaml: 'text', yml: 'text', js: 'text', jsx: 'text', ts: 'text', tsx: 'text',
    py: 'text', java: 'text', c: 'text', cpp: 'text', h: 'text', hpp: 'text',
    css: 'text', scss: 'text', less: 'text', html: 'text', sh: 'text', bash: 'text',
    sql: 'text', php: 'text', rb: 'text', go: 'text', rs: 'text', swift: 'text', csv: 'text',
    // Archive
    zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive',
  };
  return typeMap[extension] || 'other';
};

const ProductionFileViewer: React.FC<ProductionFileViewerProps> = ({
  fileUrl,
  fileName,
  isOpen,
  onClose
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfPages, setPdfPages] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [imageRotation, setImageRotation] = useState(0);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [officeViewerIndex, setOfficeViewerIndex] = useState(0);
  
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const officeLoadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { resolvedUrl, isResolving, resolveError } = useResolvedFileUrl(fileUrl, { 
    enabled: isOpen,
    expiresInSeconds: 60 * 30 // 30 minutes for production
  });

  const extension = useMemo(() => getFileExtension(fileName), [fileName]);
  const fileType = useMemo(() => getFileType(extension), [extension]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      setZoom(100);
      setPdfPage(1);
      setPdfPages(0);
      setLoadProgress(0);
      setRetryCount(0);
      setImageRotation(0);
      setShowThumbnails(false);
      setShowAnnotations(false);
      setOfficeViewerIndex(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle URL resolution errors
  useEffect(() => {
    if (resolveError && isOpen) {
      setError(`Impossible de récupérer le fichier: ${resolveError}`);
      setLoading(false);
    }
  }, [resolveError, isOpen]);

  // Simulate loading progress
  useEffect(() => {
    if (!isOpen || !loading) return;
    
    const interval = setInterval(() => {
      setLoadProgress(prev => Math.min(prev + 5, 90));
    }, 150);

    return () => clearInterval(interval);
  }, [isOpen, loading]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Auto-hide controls in fullscreen
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    if (isFullscreen) {
      controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen) {
      resetControlsTimeout();
    } else {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }
  }, [isFullscreen, resetControlsTimeout]);

  // Office viewer auto-fallback timeout
  useEffect(() => {
    if (fileType !== 'office' || !loading || !isOpen) return;
    officeLoadTimeoutRef.current = setTimeout(() => {
      if (loading && officeViewerIndex < 1) {
        setOfficeViewerIndex(prev => prev + 1);
        setLoading(true);
        toast.info('Basculement vers Google Docs Viewer...');
      }
    }, 15000);
    return () => {
      if (officeLoadTimeoutRef.current) clearTimeout(officeLoadTimeoutRef.current);
    };
  }, [officeViewerIndex, loading, fileType, isOpen]);

  // PDF embed onLoad is unreliable - use timeout fallback
  useEffect(() => {
    if (fileType === 'pdf' && resolvedUrl && loading && isOpen) {
      const timeout = setTimeout(() => {
        // After 2 seconds, assume PDF is loaded (embed onLoad doesn't fire reliably)
        handleLoadSuccess();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [fileType, resolvedUrl, loading, isOpen]);

  // Check if file is PowerPoint
  const isPowerPoint = useMemo(() => {
    return extension === 'ppt' || extension === 'pptx';
  }, [extension]);

  const officeIframeRef = useRef<HTMLIFrameElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
      if (e.key === 'f' || e.key === 'F') {
        if (e.target === document.body || e.target === containerRef.current) {
          toggleFullscreen();
        }
      }
      if (fileType === 'pdf') {
        if (e.key === 'ArrowLeft') setPdfPage(p => Math.max(1, p - 1));
        if (e.key === 'ArrowRight') setPdfPage(p => Math.min(pdfPages, p + 1));
      }
      // PowerPoint navigation - focus iframe and simulate navigation
      if (isPowerPoint && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        // Focus the iframe to enable native keyboard navigation
        if (officeIframeRef.current) {
          officeIframeRef.current.focus();
          // Post message to Office viewer for navigation
          try {
            officeIframeRef.current.contentWindow?.postMessage({
              type: 'keyboard',
              key: e.key
            }, '*');
          } catch {
            // Cross-origin restriction - iframe handles its own keyboard events when focused
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, fileType, pdfPages, onClose, isPowerPoint]);

  const toggleFullscreen = async () => {
    setIsFullscreen(prev => !prev);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(resolvedUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Téléchargement démarré');
    } catch {
      window.open(resolvedUrl, '_blank');
    }
  };

  const handleOpenNewTab = () => {
    window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(fileUrl).then(() => {
      toast.success('Lien copié');
    }).catch(() => {
      toast.error('Impossible de copier');
    });
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setLoadProgress(0);
    setRetryCount(prev => prev + 1);
  };

  const handleLoadSuccess = () => {
    setLoading(false);
    setError(null);
    setLoadProgress(100);
  };

  const handleLoadError = (errorMsg: string) => {
    setLoading(false);
    setError(errorMsg);
  };

  if (!isOpen) return null;

  const portalTarget = typeof document !== 'undefined' ? document.body : null;
  if (!portalTarget) return null;

  // Delegate to specialized viewers
  if (fileType === 'audio') {
    return createPortal(
      <AudioViewer
        fileUrl={resolvedUrl}
        fileName={fileName}
        isOpen={isOpen}
        onClose={onClose}
        onShare={handleShare}
      />,
      portalTarget
    );
  }

  if (fileType === 'text') {
    return createPortal(
      <TextViewer
        fileUrl={resolvedUrl}
        fileName={fileName}
        isOpen={isOpen}
        onClose={onClose}
        onShare={handleShare}
      />,
      portalTarget
    );
  }

  if (fileType === 'archive') {
    return createPortal(
      <ArchiveViewer
        fileUrl={resolvedUrl}
        fileName={fileName}
        isOpen={isOpen}
        onClose={onClose}
        onShare={handleShare}
      />,
      portalTarget
    );
  }
  // Content renderers
  const renderImageContent = () => (
    <div 
      ref={contentRef}
      className="flex-1 flex items-center justify-center overflow-hidden p-2 bg-black/95 relative touch-none"
      onTouchStart={(e) => {
        if (e.touches.length === 2) {
          e.preventDefault();
        }
      }}
      onTouchMove={(e) => {
        if (e.touches.length === 2) {
          e.preventDefault();
          // Pinch to zoom
          const touch1 = e.touches[0];
          const touch2 = e.touches[1];
          const distance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
          );
          // Simplified pinch zoom
          if ((window as any)._lastPinchDistance) {
            const delta = distance - (window as any)._lastPinchDistance;
            setZoom(z => Math.max(25, Math.min(300, z + delta * 0.5)));
          }
          (window as any)._lastPinchDistance = distance;
        }
      }}
      onTouchEnd={() => {
        (window as any)._lastPinchDistance = null;
      }}
    >
      <img
        key={retryCount}
        src={resolvedUrl}
        alt={fileName}
        className="max-w-full max-h-full object-contain transition-transform duration-200 select-none pointer-events-none"
        style={{ 
          transform: `scale(${zoom / 100}) rotate(${imageRotation}deg)`,
          transformOrigin: 'center center'
        }}
        onLoad={(e) => {
          const img = e.target as HTMLImageElement;
          setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
          handleLoadSuccess();
        }}
        onError={() => handleLoadError('Impossible de charger l\'image')}
        draggable={false}
      />
      
      {/* Annotation overlay */}
      {showAnnotations && imageDimensions.width > 0 && (
        <AnnotationLayer
          isActive={showAnnotations}
          onToggle={() => setShowAnnotations(false)}
          width={contentRef.current?.clientWidth || 800}
          height={contentRef.current?.clientHeight || 600}
          onSave={(dataUrl) => {
            toast.success('Annotations sauvegardées');
            setShowAnnotations(false);
          }}
        />
      )}
    </div>
  );

  const renderVideoContent = () => (
    <div className="flex-1 flex items-center justify-center bg-black p-2">
      <video
        key={retryCount}
        src={resolvedUrl}
        controls
        autoPlay
        playsInline
        className="max-w-full max-h-full"
        onLoadedData={handleLoadSuccess}
        onError={() => handleLoadError('Impossible de lire la vidéo')}
      />
    </div>
  );

  const renderPdfContent = () => (
    <div className="flex-1 w-full h-full bg-[#525659] relative">
      <embed
        key={retryCount}
        src={`${resolvedUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
        type="application/pdf"
        className="w-full h-full"
      />
    </div>
  );

  const renderOfficeContent = () => {
    const encodedUrl = encodeURIComponent(resolvedUrl);
    
    // Multiple viewer options with automatic fallback
    const officeViewers = [
      {
        name: 'Office Online',
        url: `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`,
      },
      {
        name: 'Google Docs Viewer',
        url: `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`,
      },
    ];
    
    const currentOfficeViewer = officeViewers[officeViewerIndex] || officeViewers[0];
    
    const handleOfficeLoadError = () => {
      // Try next viewer before giving up
      if (officeViewerIndex < officeViewers.length - 1) {
        setOfficeViewerIndex(prev => prev + 1);
        setLoading(true);
        toast.info(`Basculement vers ${officeViewers[officeViewerIndex + 1].name}...`);
      } else {
        handleLoadError('Impossible de charger le document Office');
      }
    };



    return (
      <div 
        className="flex-1 w-full h-full bg-muted relative"
        onClick={() => {
          officeIframeRef.current?.focus();
        }}
      >
        {/* Viewer indicator */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
          <span className="text-xs bg-background/80 backdrop-blur px-2 py-1 rounded text-muted-foreground">
            {currentOfficeViewer.name}
          </span>
          {officeViewers.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                setOfficeViewerIndex((prev) => (prev + 1) % officeViewers.length);
                setLoading(true);
              }}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Changer de viewer
            </Button>
          )}
        </div>
        
        <iframe
          ref={officeIframeRef}
          key={`${retryCount}-${officeViewerIndex}`}
          src={currentOfficeViewer.url}
          className="w-full h-full border-0"
          title={fileName}
          onLoad={() => {
            if (officeLoadTimeoutRef.current) clearTimeout(officeLoadTimeoutRef.current);
            handleLoadSuccess();
            if (isPowerPoint) {
              setTimeout(() => {
                officeIframeRef.current?.focus();
              }, 500);
            }
          }}
          onError={handleOfficeLoadError}
          sandbox="allow-scripts allow-same-origin allow-forms"
          tabIndex={0}
        />
      </div>
    );
  };

  const renderOtherContent = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-card rounded-xl p-8 max-w-md w-full shadow-2xl border border-border">
        <FileWarning className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-6">
          Ce type de fichier ne peut pas être prévisualisé directement.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
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

  const renderContent = () => {
    if (isResolving) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Préparation du fichier...</p>
          </div>
        </div>
      );
    }

    switch (fileType) {
      case 'image': return renderImageContent();
      case 'video': return renderVideoContent();
      case 'pdf': return renderPdfContent();
      case 'office': return renderOfficeContent();
      default: return renderOtherContent();
    }
  };

  const renderErrorState = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="bg-card rounded-xl p-8 max-w-md w-full shadow-2xl border border-destructive/30 text-center">
        <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-destructive" />
        <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
        <p className="text-muted-foreground mb-6">{error}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleRetry} className="flex-1">
            <RotateCcw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
          <Button variant="outline" onClick={handleOpenNewTab} className="flex-1">
            <ExternalLink className="h-4 w-4 mr-2" />
            Ouvrir dans un nouvel onglet
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[200] bg-background flex flex-col"
      onMouseMove={isFullscreen ? resetControlsTimeout : undefined}
      onTouchStart={isFullscreen ? resetControlsTimeout : undefined}
    >
      {/* Header - hidden in fullscreen for PDF/Office */}
      <header 
        className={`
          flex items-center justify-between p-2 border-b bg-background/95 backdrop-blur-sm shrink-0
          transition-all duration-300 ease-out
          ${isFullscreen && (fileType === 'pdf' || fileType === 'office') ? 'hidden' : ''}
          ${isFullscreen && fileType !== 'pdf' && fileType !== 'office' ? 'absolute top-0 left-0 right-0 z-50' : ''}
          ${isFullscreen && !showControls && fileType !== 'pdf' && fileType !== 'office' ? 'opacity-0 -translate-y-full pointer-events-none' : 'opacity-100 translate-y-0'}
        `}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (isFullscreen) setIsFullscreen(false);
              else onClose();
            }}
            className="shrink-0 h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">{fileName}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Zoom controls - images only */}
          {fileType === 'image' && (
            <div className="flex items-center gap-1 mr-2 bg-muted/50 rounded-lg px-2 py-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setZoom(z => Math.max(25, z - 25))} 
                className="h-7 w-7"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium w-12 text-center">{zoom}%</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setZoom(z => Math.min(300, z + 25))} 
                className="h-7 w-7"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Rotation for images */}
          {fileType === 'image' && !isMobile && (
            <div className="hidden sm:flex items-center gap-1 mr-2 bg-muted/50 rounded-lg px-1 py-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setImageRotation(r => (r - 90) % 360)} 
                className="h-7 w-7"
                title="Rotation gauche"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setImageRotation(r => (r + 90) % 360)} 
                className="h-7 w-7"
                title="Rotation droite"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Annotations toggle - images only */}
          {fileType === 'image' && (
            <Button 
              variant={showAnnotations ? 'secondary' : 'ghost'} 
              size="icon" 
              onClick={() => setShowAnnotations(!showAnnotations)} 
              className="h-9 w-9"
              title="Annotations"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}

          {/* Open in new tab */}
          <Button variant="ghost" size="icon" onClick={handleOpenNewTab} className="h-9 w-9" title="Ouvrir dans un nouvel onglet">
            <ExternalLink className="h-4 w-4" />
          </Button>
          {/* Actions */}
          <Button variant="ghost" size="icon" onClick={handleShare} className="h-9 w-9" title="Copier le lien">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDownload} className="h-9 w-9" title="Telecharger">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-9 w-9" title="Plein ecran">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* Loading overlay */}
      {loading && !error && (
        <div className="absolute inset-0 z-40 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground mb-2">Chargement en cours...</p>
          <div className="w-48">
            <Progress value={loadProgress} className="h-2" />
          </div>
        </div>
      )}

      {/* Main content */}
      {error ? renderErrorState() : renderContent()}

    </div>,
    portalTarget
  );
};

export default ProductionFileViewer;
