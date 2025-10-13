import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, ZoomIn, ZoomOut, Download, Maximize2, Minimize2, RotateCw, 
  ChevronLeft, ChevronRight, Printer, ExternalLink, RefreshCw,
  Menu, Grid3X3, Play, Pause, VolumeX, Volume2, SkipBack, SkipForward,
  FileText, Image, Video, File, AlertCircle, Loader2, Search,
  Settings, Share2, Bookmark, MoreVertical, Monitor, Smartphone,
  Tablet, SquareEqual
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Configuration de PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ModernFileViewerProps {
  fileUrl: string;
  fileName: string;
  mimeType?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface FileTypeInfo {
  type: 'pdf' | 'office' | 'image' | 'video' | 'audio' | 'text' | 'unsupported';
  icon: React.ComponentType<any>;
  color: string;
  supportedFormats: string[];
}

const fileTypes: Record<string, FileTypeInfo> = {
  pdf: {
    type: 'pdf',
    icon: FileText,
    color: '#ef4444',
    supportedFormats: ['pdf']
  },
  office: {
    type: 'office',
    icon: File,
    color: '#3b82f6',
    supportedFormats: ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'ods', 'odp']
  },
  image: {
    type: 'image',
    icon: Image,
    color: '#10b981',
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico', 'tiff']
  },
  video: {
    type: 'video',
    icon: Video,
    color: '#8b5cf6',
    supportedFormats: ['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv', 'mkv']
  },
  audio: {
    type: 'audio',
    icon: Volume2,
    color: '#f59e0b',
    supportedFormats: ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma']
  },
  text: {
    type: 'text',
    icon: FileText,
    color: '#6b7280',
    supportedFormats: ['txt', 'md', 'csv', 'json', 'xml', 'html', 'css', 'js', 'ts', 'py', 'java', 'cpp']
  }
};

const ModernFileViewer: React.FC<ModernFileViewerProps> = ({
  fileUrl,
  fileName,
  mimeType,
  isOpen,
  onClose
}) => {
  // States
  const [currentFileType, setCurrentFileType] = useState<FileTypeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  
  // PDF specific states
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pdfScale, setPdfScale] = useState<number>(1.0);
  const [searchText, setSearchText] = useState('');
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [fitMode, setFitMode] = useState<'auto' | 'width' | 'height' | 'page'>('auto');
  
  // Image specific states
  const [imageScale, setImageScale] = useState<number>(1.0);
  const [imageRotation, setImageRotation] = useState<number>(0);
  
  // Video/Audio specific states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  
  // Office document states
  const [officeViewerMethod, setOfficeViewerMethod] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Utility functions
  const getFileExtension = useCallback((filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  }, []);

  const getMimeTypeFromExtension = useCallback((extension: string) => {
    const mimeMap: Record<string, string> = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
      'png': 'image/png', 'gif': 'image/gif', 'webp': 'image/webp',
      'svg': 'image/svg+xml', 'bmp': 'image/bmp', 'tiff': 'image/tiff',
      'mp4': 'video/mp4', 'webm': 'video/webm', 'ogg': 'video/ogg',
      'avi': 'video/x-msvideo', 'mov': 'video/quicktime', 'wmv': 'video/x-ms-wmv',
      'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'flac': 'audio/flac',
      'aac': 'audio/aac', 'm4a': 'audio/x-m4a', 'wma': 'audio/x-ms-wma',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain', 'md': 'text/markdown', 'csv': 'text/csv',
      'json': 'application/json', 'xml': 'application/xml'
    };
    return mimeMap[extension] || 'application/octet-stream';
  }, []);

  const detectFileType = useCallback((filename: string, mime?: string) => {
    const extension = getFileExtension(filename);
    
    // Try to detect from MIME type first
    if (mime) {
      if (mime.startsWith('image/')) return fileTypes.image;
      if (mime.startsWith('video/')) return fileTypes.video;
      if (mime.startsWith('audio/')) return fileTypes.audio;
      if (mime.startsWith('text/')) return fileTypes.text;
      if (mime === 'application/pdf') return fileTypes.pdf;
    }
    
    // Fallback to extension detection
    for (const [key, type] of Object.entries(fileTypes)) {
      if (type.supportedFormats.includes(extension)) {
        return type;
      }
    }
    
    return {
      type: 'unsupported' as const,
      icon: AlertCircle,
      color: '#ef4444',
      supportedFormats: []
    };
  }, [getFileExtension]);

  // Initialize file type
  useEffect(() => {
    if (fileName) {
      const detectedType = detectFileType(fileName, mimeType);
      setCurrentFileType(detectedType);
      setIsLoading(false);
    }
  }, [fileName, mimeType, detectFileType]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch(e.key) {
        case 'Escape':
          e.preventDefault();
          if (isFullscreen) {
            exitFullscreen();
          } else {
            onClose();
          }
          break;
        case 'ArrowLeft':
          if (currentFileType?.type === 'pdf' && pageNumber > 1) {
            setPageNumber(pageNumber - 1);
          }
          break;
        case 'ArrowRight':
          if (currentFileType?.type === 'pdf' && pageNumber < numPages) {
            setPageNumber(pageNumber + 1);
          }
          break;
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomIn();
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomOut();
          }
          break;
        case ' ':
          if (currentFileType?.type === 'video' || currentFileType?.type === 'audio') {
            e.preventDefault();
            togglePlayPause();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pageNumber, numPages, currentFileType, isFullscreen, onClose]);

  // Fullscreen handling - Détecter les changements de l'API native
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!(
        document.fullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      
      console.log('🔄 Fullscreen change détecté:', isNowFullscreen);
      
      setIsFullscreen(isNowFullscreen);
      
      if (isNowFullscreen) {
        // En mode plein écran NATIF : cacher complètement la toolbar
        setShowToolbar(false);
        console.log('🔒 Mode plein écran NATIF activé - toolbar cachée');
        
        // Masquer le body scroll
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
      } else {
        // Sortie du mode plein écran natif
        setShowToolbar(true);
        console.log('🔓 Sortie mode plein écran NATIF - toolbar visible');
        
        // Restaurer le scroll
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    };

    // Écouter TOUS les événements de fullscreen
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Mouse movement handler for fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    const handleMouseMove = () => {
      setShowToolbar(true);
      // Auto-hide after 3 seconds of no movement
      const timer = setTimeout(() => {
        if (isFullscreen) setShowToolbar(false);
      }, 3000);
      return () => clearTimeout(timer);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [isFullscreen]);

  // Manage body overflow in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      // Hide body scroll and prevent scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.documentElement.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.documentElement.style.overflow = 'unset';
    }

    return () => {
      // Cleanup on unmount
      document.body.style.overflow = 'unset';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.documentElement.style.overflow = 'unset';
    };
  }, [isFullscreen]);

  // Control functions
  const handleZoomIn = () => {
    if (currentFileType?.type === 'pdf') {
      setPdfScale(prev => Math.min(prev + 0.25, 3.0));
    } else if (currentFileType?.type === 'image') {
      setImageScale(prev => Math.min(prev + 0.25, 5.0));
    }
  };

  const handleZoomOut = () => {
    if (currentFileType?.type === 'pdf') {
      setPdfScale(prev => Math.max(prev - 0.25, 0.25));
    } else if (currentFileType?.type === 'image') {
      setImageScale(prev => Math.max(prev - 0.25, 0.1));
    }
  };

  const handleRotate = () => {
    if (currentFileType?.type === 'image') {
      setImageRotation(prev => (prev + 90) % 360);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Téléchargement démarré');
  };

  const handlePrint = () => {
    window.open(fileUrl, '_blank')?.print();
  };

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      try {
        // Utiliser l'API NATIVE du navigateur pour un VRAI plein écran
        if (containerRef.current) {
          await containerRef.current.requestFullscreen();
          console.log('✅ API Fullscreen native activée');
        }
      } catch (error) {
        console.error('❌ Erreur API fullscreen native:', error);
        
        // Fallback: Mode plein écran forcé
        setIsFullscreen(true);
        setShowToolbar(false);
        
        if (containerRef.current) {
          const element = containerRef.current;
          element.style.position = 'fixed';
          element.style.top = '0';
          element.style.left = '0';
          element.style.width = '100vw';
          element.style.height = '100vh';
          element.style.zIndex = '999999';
          element.style.margin = '0';
          element.style.padding = '0';
          element.style.border = 'none';
          element.style.overflow = 'hidden';
        }
        
        // Masquer tout le reste
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        toast.success('Mode plein écran activé (fallback)');
      }
    } else {
      exitFullscreen();
    }
  };

  // Fit mode handlers
  const handleFitModeChange = (mode: 'auto' | 'width' | 'height' | 'page') => {
    setFitMode(mode);
    
    if (currentFileType?.type === 'pdf') {
      const contentElement = contentRef.current;
      if (!contentElement) return;
      
      const containerWidth = contentElement.clientWidth;
      const containerHeight = contentElement.clientHeight;
      
      switch (mode) {
        case 'width':
          setPdfScale(containerWidth / 800); // 800 is base PDF width
          break;
        case 'height':
          setPdfScale(containerHeight / 1000); // Estimate for height
          break;
        case 'page':
          setPdfScale(Math.min(containerWidth / 800, containerHeight / 1000));
          break;
        case 'auto':
        default:
          setPdfScale(1.0);
          break;
      }
    } else if (currentFileType?.type === 'image') {
      switch (mode) {
        case 'width':
          setImageScale(1.0);
          break;
        case 'page':
          setImageScale(0.8);
          break;
        case 'auto':
        default:
          setImageScale(1.0);
          break;
      }
    }
  };

  const exitFullscreen = async () => {
    try {
      // D'abord essayer de sortir du vrai fullscreen
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        console.log('✅ Sortie API fullscreen native');
      }
    } catch (error) {
      console.error('❌ Erreur sortie fullscreen:', error);
    }
    
    // Dans tous les cas, nettoyer notre état
    setIsFullscreen(false);
    setShowToolbar(true);
    
    // Restaurer les styles
    if (containerRef.current) {
      const element = containerRef.current;
      element.style.position = '';
      element.style.top = '';
      element.style.left = '';
      element.style.width = '';
      element.style.height = '';
      element.style.zIndex = '';
      element.style.margin = '';
      element.style.padding = '';
      element.style.border = '';
      element.style.overflow = '';
    }
    
    // Restaurer le body
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    
    toast.success('Mode plein écran désactivé');
  };

  const togglePlayPause = () => {
    const mediaElement = videoRef.current || audioRef.current;
    if (mediaElement) {
      if (isPlaying) {
        mediaElement.pause();
      } else {
        mediaElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (time: number) => {
    const mediaElement = videoRef.current || audioRef.current;
    if (mediaElement) {
      mediaElement.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Render functions for different file types
  const renderPDFViewer = () => {
    const getPageWidth = () => {
      // En mode plein écran ABSOLU, utiliser la taille COMPLÈTE de l'écran
      if (isFullscreen) {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const thumbnailWidth = showThumbnails ? 300 : 0;
        const toolbarHeight = showToolbar ? 60 : 0;
        
        const availableWidth = screenWidth - thumbnailWidth;
        const availableHeight = screenHeight - toolbarHeight;
        
        switch (fitMode) {
          case 'width':
            // Utiliser TOUTE la largeur disponible
            return availableWidth;
          case 'height':
            // Calculer selon la hauteur disponible (ratio A4)
            return Math.min(availableWidth, availableHeight * 0.707);
          case 'page':
            // Optimiser pour que la page entière soit visible
            return Math.min(availableWidth, availableHeight * 0.707);
          case 'auto':
          default:
            // Par défaut, utiliser le maximum possible
            return availableWidth * 0.95; // 95% pour un léger padding
        }
      } else {
        // Mode normal (fenêtré)
        if (!contentRef.current) return 900;
        
        const containerWidth = contentRef.current.clientWidth;
        const containerHeight = contentRef.current.clientHeight;
        
        switch (fitMode) {
          case 'width':
            return containerWidth - (showThumbnails ? 320 : 64);
          case 'height':
            return Math.min(900, (containerHeight - 32) * 0.7);
          case 'page':
            return Math.min(
              containerWidth - (showThumbnails ? 320 : 64),
              (containerHeight - 32) * 0.7
            );
          case 'auto':
          default:
            return Math.min(900, containerWidth - (showThumbnails ? 320 : 64));
        }
      }
    };

    return (
      <div className={cn(
        "flex h-full",
        isFullscreen ? "bg-black" : "bg-gradient-to-br from-gray-50 to-gray-100"
      )}>
        {showThumbnails && (
          <div className={cn(
            "w-64 border-r overflow-y-auto shadow-lg",
            isFullscreen ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}>
            <div className="p-4">
              <h3 className={cn(
                "text-sm font-semibold mb-3",
                isFullscreen ? "text-gray-200" : "text-gray-700"
              )}>Pages</h3>
              <div className="space-y-3">
                {Array.from(new Array(numPages), (el, index) => (
                  <div
                    key={`thumb_${index + 1}`}
                    onClick={() => setPageNumber(index + 1)}
                    className={cn(
                      "cursor-pointer p-2 rounded-lg border-2 transition-all hover:shadow-md",
                      pageNumber === index + 1 && !isFullscreen && "border-blue-500 bg-blue-50 shadow-md",
                      pageNumber === index + 1 && isFullscreen && "border-blue-400 bg-blue-900 shadow-md",
                      pageNumber !== index + 1 && !isFullscreen && "border-gray-200 hover:border-gray-300",
                      pageNumber !== index + 1 && isFullscreen && "border-gray-600 hover:border-gray-500"
                    )}
                  >
                    <Document file={fileUrl} loading="">
                      <Page
                        pageNumber={index + 1}
                        width={180}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </Document>
                    <div className={cn(
                      "text-center text-xs mt-2",
                      isFullscreen ? "text-gray-300" : "text-gray-500"
                    )}>
                      Page {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div 
          className="flex-1 overflow-auto" 
          ref={contentRef}
          style={isFullscreen && !showToolbar ? {
            position: 'absolute',
            top: '0',
            left: showThumbnails ? '300px' : '0',
            right: '0',
            bottom: '0',
            width: showThumbnails ? 'calc(100vw - 300px)' : '100vw',
            height: '100vh',
            margin: '0',
            padding: '0',
            border: 'none',
            overflow: 'auto'
          } : isFullscreen && showToolbar ? {
            position: 'absolute',
            top: '60px',
            left: showThumbnails ? '300px' : '0',
            right: '0',
            bottom: '0',
            width: showThumbnails ? 'calc(100vw - 300px)' : '100vw',
            height: 'calc(100vh - 60px)',
            margin: '0',
            padding: '0',
            border: 'none',
            overflow: 'auto'
          } : {}}
        >
          <div 
            className={cn(
              "flex items-center justify-center",
              isFullscreen ? "h-full w-full p-0 m-0" : "min-h-full p-8"
            )}
            style={isFullscreen ? {
              transform: `scale(${pdfScale})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease',
              width: '100%',
              height: '100%',
              margin: '0',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            } : {
              transform: `scale(${pdfScale})`,
              transformOrigin: fitMode === 'width' || fitMode === 'page' ? 'top center' : 'center',
              transition: 'transform 0.2s ease'
            }}
          >
            <Document
              file={fileUrl}
              onLoadSuccess={({ numPages }) => {
                setNumPages(numPages);
                setIsLoading(false);
                setLoadError(null);
                // Auto-apply fit mode on load
                setTimeout(() => handleFitModeChange(fitMode), 100);
              }}
              onLoadError={(error) => {
                console.error('Erreur PDF:', error);
                setLoadError('Impossible de charger le document PDF');
                setIsLoading(false);
              }}
              loading={
                <div className={cn(
                  "flex flex-col items-center justify-center p-12",
                  isFullscreen ? "text-white" : "text-gray-600"
                )}>
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <div className="text-lg">Chargement du document...</div>
                </div>
              }
              error={
                <div className={cn(
                  "flex flex-col items-center justify-center p-12",
                  isFullscreen ? "text-red-400" : "text-red-600"
                )}>
                  <AlertCircle className="h-12 w-12 mb-4" />
                  <div className="text-lg">Erreur lors du chargement</div>
                  <Button onClick={() => window.location.reload()} className="mt-4">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réessayer
                  </Button>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                width={getPageWidth()}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                loading={
                  <div className={cn(
                    "flex items-center justify-center",
                    isFullscreen ? "bg-transparent text-white p-2" : "bg-white text-gray-700 p-8 shadow-lg rounded-lg"
                  )}>
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Chargement de la page...</span>
                  </div>
                }
                className={cn(
                  isFullscreen ? "bg-white" : "bg-white shadow-xl rounded-lg"
                )}
                style={isFullscreen ? {
                  display: 'block',
                  margin: '0',
                  padding: '0',
                  border: 'none',
                  borderRadius: '0',
                  boxShadow: 'none',
                  outline: 'none'
                } : {}}
              />
            </Document>
          </div>
        </div>
      </div>
    );
  };

  const renderImageViewer = () => {
    const getImageStyle = () => {
      const baseStyle = {
        transform: `scale(${imageScale}) rotate(${imageRotation}deg)`,
        objectFit: 'contain' as const,
        transition: 'transform 0.3s ease'
      };

      // En mode plein écran, utiliser TOUT l'espace disponible
      if (isFullscreen) {
        switch (fitMode) {
          case 'width':
            return {
              ...baseStyle,
              width: '100vw',
              height: 'auto',
              maxWidth: '100vw',
              maxHeight: '100vh'
            };
          case 'height':
            return {
              ...baseStyle,
              width: 'auto',
              height: '100vh',
              maxWidth: '100vw',
              maxHeight: '100vh'
            };
          case 'page':
            return {
              ...baseStyle,
              width: '100vw',
              height: '100vh',
              maxWidth: '100vw',
              maxHeight: '100vh'
            };
          case 'auto':
          default:
            return {
              ...baseStyle,
              maxWidth: '100vw',
              maxHeight: '100vh'
            };
        }
      } else {
        // Mode normal (non plein écran)
        switch (fitMode) {
          case 'width':
            return {
              ...baseStyle,
              width: '100%',
              height: 'auto',
              maxWidth: '100%',
              maxHeight: 'none'
            };
          case 'height':
            return {
              ...baseStyle,
              width: 'auto',
              height: '100%',
              maxWidth: 'none',
              maxHeight: '100%'
            };
          case 'page':
            return {
              ...baseStyle,
              width: '100%',
              height: '100%',
              maxWidth: '100%',
              maxHeight: '100%'
            };
          case 'auto':
          default:
            return {
              ...baseStyle,
              maxWidth: '90%',
              maxHeight: '90%'
            };
        }
      }
    };

    return (
      <div className={cn(
        "flex-1 overflow-hidden",
        isFullscreen ? "bg-black" : "bg-gradient-to-br from-gray-900 to-gray-800"
      )}
      style={isFullscreen ? {
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        width: '100vw',
        height: '100vh',
        margin: '0',
        padding: '0',
        border: 'none',
        overflow: 'hidden'
      } : {}}
      >
        <div 
          className={cn(
            "flex items-center justify-center h-full",
            isFullscreen ? "p-0 m-0" : "p-4"
          )}
          style={isFullscreen ? {
            width: '100%',
            height: '100%',
            margin: '0',
            padding: '0'
          } : {}}
        >
          <img
            src={fileUrl}
            alt={fileName}
            style={getImageStyle()}
            className="shadow-2xl rounded-lg"
            onLoad={() => {
              setIsLoading(false);
              setLoadError(null);
            }}
            onError={() => {
              setLoadError('Impossible de charger l\'image');
              setIsLoading(false);
            }}
          />
        </div>
      </div>
    );
  };

  const renderVideoViewer = () => {
    const getVideoStyle = () => {
      // En mode plein écran, utiliser TOUT l'espace comme YouTube
      if (isFullscreen) {
        switch (fitMode) {
          case 'width':
            return {
              width: '100vw',
              height: 'auto',
              maxWidth: '100vw',
              maxHeight: '100vh',
              objectFit: 'contain' as const
            };
          case 'height':
            return {
              width: 'auto',
              height: '100vh',
              maxWidth: '100vw',
              maxHeight: '100vh',
              objectFit: 'contain' as const
            };
          case 'page':
            return {
              width: '100vw',
              height: '100vh',
              maxWidth: '100vw',
              maxHeight: '100vh',
              objectFit: 'contain' as const
            };
          case 'auto':
          default:
            return {
              width: '100vw',
              height: 'auto',
              maxWidth: '100vw',
              maxHeight: '100vh',
              objectFit: 'contain' as const
            };
        }
      } else {
        // Mode normal (non plein écran)
        switch (fitMode) {
          case 'width':
            return {
              width: '100%',
              height: 'auto',
              maxWidth: '100%',
              maxHeight: '100%'
            };
          case 'height':
            return {
              width: 'auto',
              height: '100%',
              maxWidth: '100%',
              maxHeight: '100%'
            };
          case 'page':
            return {
              width: '100%',
              height: '100%',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain' as const
            };
          case 'auto':
          default:
            return {
              width: '100%',
              height: 'auto',
              maxWidth: '100%',
              maxHeight: '80vh'
            };
        }
      }
    };

    return (
      <div 
        className="flex-1 flex flex-col bg-black"
        style={isFullscreen ? {
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          width: '100vw',
          height: '100vh',
          margin: '0',
          padding: '0',
          border: 'none'
        } : {}}
      >
        <div 
          className="flex-1 flex items-center justify-center" 
          style={isFullscreen ? {
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: showToolbar ? '60px' : '60px', // Toujours espace pour contrôles vidéo
            width: '100%',
            height: showToolbar ? 'calc(100vh - 120px)' : 'calc(100vh - 60px)',
            margin: '0',
            padding: '0'
          } : { minHeight: 0 }}
        >
          <video
            ref={videoRef}
            src={fileUrl}
            controls={false}
            style={getVideoStyle()}
            className="shadow-2xl"
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setDuration(videoRef.current.duration);
                setIsLoading(false);
                setLoadError(null);
              }
            }}
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onVolumeChange={() => {
              if (videoRef.current) {
                setVolume(videoRef.current.volume);
                setIsMuted(videoRef.current.muted);
              }
            }}
            onError={(e) => {
              console.error('Erreur vidéo:', e);
              setLoadError('Impossible de lire la vidéo. Format non supporté ou fichier corrompu.');
              setIsLoading(false);
            }}
            onCanPlay={() => {
              console.log('Vidéo prête à être lue');
              setIsLoading(false);
            }}
            preload="metadata"
          />
        </div>
        
        {/* Custom video controls - YouTube style */}
        <div className={cn(
          "backdrop-blur-sm p-4 border-t",
          isFullscreen ? "bg-black/80 border-gray-700" : "bg-gray-900/90 border-gray-700"
        )}>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlayPause}
              className="text-white hover:bg-gray-700"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            
            <div className="flex items-center space-x-2 text-white text-sm flex-1">
              <span className="text-xs">{formatTime(currentTime)}</span>
              <div 
                className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden cursor-pointer hover:h-2 transition-all"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  handleSeek(percent * duration);
                }}
              >
                <div 
                  className="h-full bg-red-600 rounded-full transition-all"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <span className="text-xs">{formatTime(duration)}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = !isMuted;
                    setIsMuted(!isMuted);
                  }
                }}
                className="text-white hover:bg-gray-700 h-8 w-8 p-0"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              
              {/* Volume slider */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const newVolume = parseFloat(e.target.value);
                  if (videoRef.current) {
                    videoRef.current.volume = newVolume;
                    videoRef.current.muted = newVolume === 0;
                    setVolume(newVolume);
                    setIsMuted(newVolume === 0);
                  }
                }}
                className="w-16 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(isMuted ? 0 : volume) * 100}%, #4b5563 ${(isMuted ? 0 : volume) * 100}%, #4b5563 100%)`
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOfficeViewer = () => {
    const extension = getFileExtension(fileName);
    const isExcel = ['xls', 'xlsx'].includes(extension);
    const isPowerPoint = ['ppt', 'pptx'].includes(extension);
    const isWord = ['doc', 'docx'].includes(extension);
    
    // URLs spécialisées selon le type de document
    const getOfficeViewerUrls = () => {
      const baseUrl = fileUrl;
      const encodedUrl = encodeURIComponent(baseUrl);
      
      if (isExcel) {
        return [
          `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}&action=embedview&wdHideGridlines=True&wdDownloadButton=True`,
          `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`,
          `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`
        ];
      } else if (isPowerPoint) {
        return [
          `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}&action=embedview&wdAr=1.777777777777777`,
          `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`,
          baseUrl // Fallback direct
        ];
      } else {
        return [
          `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`,
          `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`
        ];
      }
    };
    
    const officeViewerUrls = getOfficeViewerUrls();
    const currentUrl = officeViewerUrls[officeViewerMethod];

    return (
      <div className={cn(
        "flex-1 relative",
        isFullscreen ? "bg-black" : "bg-gray-100"
      )}>
        {isLoading && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center z-10",
            isFullscreen ? "bg-black/80 text-white" : "bg-white/80 text-gray-700"
          )}>
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <div className="text-lg">Chargement du document {isExcel ? 'Excel' : isPowerPoint ? 'PowerPoint' : 'Word'}...</div>
              <div className="text-sm opacity-70 mt-2">
                {retryCount > 0 ? 'Tentative avec un visualiseur alternatif...' : 'Veuillez patienter'}
              </div>
            </div>
          </div>
        )}
        
        <iframe
          src={currentUrl}
          className="w-full h-full border-0"
          title={fileName}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          onLoad={() => {
            setTimeout(() => {
              setIsLoading(false);
              setLoadError(null);
            }, 2000); // Délai pour s'assurer que le contenu est chargé
          }}
          onError={() => {
            console.error(`Erreur avec ${currentUrl}, tentative ${retryCount + 1}`);
            if (officeViewerMethod < officeViewerUrls.length - 1) {
              setOfficeViewerMethod(officeViewerMethod + 1);
              setRetryCount(retryCount + 1);
              setIsLoading(true);
            } else {
              setLoadError(`Impossible de charger le document ${isExcel ? 'Excel' : isPowerPoint ? 'PowerPoint' : 'Word'}. Le fichier peut être corrompu ou le format non supporté.`);
              setIsLoading(false);
            }
          }}
        />
        
        {retryCount > 0 && !isLoading && (
          <div className={cn(
            "absolute top-4 right-4 border rounded-lg p-3 shadow-lg",
            isFullscreen ? "bg-gray-800 border-gray-600 text-yellow-400" : "bg-yellow-100 border-yellow-300 text-yellow-800"
          )}>
            <div className="text-sm">
              📋 Visualiseur alternatif utilisé ({retryCount + 1}/{officeViewerUrls.length})
            </div>
          </div>
        )}

        {loadError && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center",
            isFullscreen ? "bg-black text-white" : "bg-gray-50 text-gray-700"
          )}>
            <div className="text-center p-8 max-w-md">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <div className="text-lg font-medium mb-2">Erreur de chargement</div>
              <div className="text-sm mb-4">{loadError}</div>
              <div className="space-y-2">
                <Button 
                  onClick={handleDownload}
                  className="mr-2"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le fichier
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setRetryCount(0);
                    setOfficeViewerMethod(0);
                    setIsLoading(true);
                    setLoadError(null);
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTextViewer = () => (
    <div className="flex-1 overflow-auto bg-white">
      <iframe
        src={fileUrl}
        className="w-full h-full border-0"
        title={fileName}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setLoadError('Impossible de charger le fichier texte');
          setIsLoading(false);
        }}
      />
    </div>
  );

  const renderAudioViewer = () => (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
      <div className="text-center text-white p-8">
        <Volume2 className="h-24 w-24 mx-auto mb-6 text-purple-300" />
        <h3 className="text-2xl font-semibold mb-4">{fileName}</h3>
        
        <audio
          ref={audioRef}
          src={fileUrl}
          controls
          className="w-full max-w-md mx-auto"
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuration(audioRef.current.duration);
              setIsLoading(false);
            }
          }}
          onError={() => {
            setLoadError('Impossible de lire le fichier audio');
            setIsLoading(false);
          }}
        />
      </div>
    </div>
  );

  const renderUnsupportedViewer = () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-8">
      <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 mb-2">Format non supporté</h3>
      <p className="text-gray-500 mb-6 text-center">
        Ce type de fichier ne peut pas être visualisé directement dans le navigateur.
      </p>
      <div className="flex space-x-3">
        <Button onClick={handleDownload} className="flex items-center">
          <Download className="h-4 w-4 mr-2" />
          Télécharger
        </Button>
        <Button 
          variant="outline" 
          onClick={() => window.open(fileUrl, '_blank')}
          className="flex items-center"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Ouvrir dans un nouvel onglet
        </Button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  const IconComponent = currentFileType?.icon || File;
  const fileColor = currentFileType?.color || '#6b7280';

  return (
    <div
      className={cn(
        "fixed inset-0 flex flex-col",
        isFullscreen ? "z-[9999] bg-black" : "z-50 bg-white"
      )}
      ref={containerRef}
      style={isFullscreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        margin: 0,
        padding: 0,
        border: 'none',
        overflow: 'hidden'
      } : {}}
    >
      {/* Modern Chrome-style toolbar - MASQUÉE en mode plein écran natif */}
      {(!isFullscreen || (isFullscreen && showToolbar)) && (
        <div 
          className={cn(
            "flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm flex-shrink-0 transition-all duration-300",
            isFullscreen && showToolbar && "absolute top-0 left-0 right-0 z-50 bg-black/90 text-white border-gray-700"
          )}
        >
        {/* Left section - File info and navigation */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <IconComponent 
              className="h-5 w-5" 
              style={{ color: fileColor }} 
            />
            <div className="max-w-md">
              <div className="text-sm font-medium text-gray-900 truncate">
                {fileName}
              </div>
              <div className="text-xs text-gray-500">
                {currentFileType?.type.charAt(0).toUpperCase() + currentFileType?.type.slice(1)} • {(fileUrl.length / 1024).toFixed(1)} KB
              </div>
            </div>
          </div>

          {/* PDF Navigation */}
          {currentFileType?.type === 'pdf' && numPages > 0 && (
            <>
              <div className="h-8 w-px bg-gray-300" />
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                  disabled={pageNumber <= 1}
                  className={cn("h-8 w-8 p-0", isFullscreen && "text-white hover:text-gray-300")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Input
                  type="number"
                  value={pageNumber}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= numPages) {
                      setPageNumber(page);
                    }
                  }}
                  className={cn(
                    "w-16 h-8 text-center text-sm",
                    isFullscreen && "bg-black/50 border-gray-600 text-white"
                  )}
                  min={1}
                  max={numPages}
                />
                
                <span className={cn("text-sm", isFullscreen ? "text-gray-300" : "text-gray-500")}>/ {numPages}</span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                  disabled={pageNumber >= numPages}
                  className={cn("h-8 w-8 p-0", isFullscreen && "text-white hover:text-gray-300")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Right section - Controls */}
        <div className="flex items-center space-x-1">
          {/* Zoom controls for zoomable content */}
          {(['pdf', 'image'].includes(currentFileType?.type || '')) && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                className={cn("h-8 w-8 p-0", isFullscreen && "text-white hover:text-gray-300")}
                title="Zoom arrière"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <div className={cn("text-sm min-w-[50px] text-center", isFullscreen ? "text-white" : "text-gray-600")}>
                {Math.round((currentFileType?.type === 'pdf' ? pdfScale : imageScale) * 100)}%
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                className={cn("h-8 w-8 p-0", isFullscreen && "text-white hover:text-gray-300")}
                title="Zoom avant"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>

              {/* Fit Mode Selector - Chrome style */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("h-8 w-8 p-0", isFullscreen && "text-white hover:text-gray-300")}
                    title="Ajuster à la page"
                  >
                    <SquareEqual className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => handleFitModeChange('auto')}
                    className={fitMode === 'auto' ? 'bg-blue-50 text-blue-700' : ''}
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Taille automatique
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleFitModeChange('width')}
                    className={fitMode === 'width' ? 'bg-blue-50 text-blue-700' : ''}
                  >
                    <Smartphone className="h-4 w-4 mr-2 rotate-90" />
                    Ajuster à la largeur
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleFitModeChange('height')}
                    className={fitMode === 'height' ? 'bg-blue-50 text-blue-700' : ''}
                  >
                    <Tablet className="h-4 w-4 mr-2" />
                    Ajuster à la hauteur
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleFitModeChange('page')}
                    className={fitMode === 'page' ? 'bg-blue-50 text-blue-700' : ''}
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Page entière
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className={cn("h-6 w-px mx-2", isFullscreen ? "bg-gray-600" : "bg-gray-300")} />
            </>
          )}

          {/* Rotate for images */}
          {currentFileType?.type === 'image' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRotate}
              className={cn("h-8 w-8 p-0", isFullscreen && "text-white hover:text-gray-300")}
              title="Rotation"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          )}

          {/* PDF Thumbnails */}
          {currentFileType?.type === 'pdf' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowThumbnails(!showThumbnails)}
              className={cn(
                "h-8 w-8 p-0",
                showThumbnails && !isFullscreen && "bg-blue-100 text-blue-600",
                showThumbnails && isFullscreen && "bg-blue-600 text-white",
                isFullscreen && "text-white hover:text-gray-300"
              )}
              title="Miniatures"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          )}

          <div className={cn("h-6 w-px mx-2", isFullscreen ? "bg-gray-600" : "bg-gray-300")} />

          {/* Download */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className={cn("h-8 w-8 p-0", isFullscreen && "text-white hover:text-gray-300")}
            title="Télécharger"
          >
            <Download className="h-4 w-4" />
          </Button>

          {/* Print */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            className={cn("h-8 w-8 p-0", isFullscreen && "text-white hover:text-gray-300")}
            title="Imprimer"
          >
            <Printer className="h-4 w-4" />
          </Button>

          {/* External link */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(fileUrl, '_blank')}
            className={cn("h-8 w-8 p-0", isFullscreen && "text-white hover:text-gray-300")}
            title="Ouvrir dans un nouvel onglet"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className={cn("h-8 w-8 p-0", isFullscreen && "text-white hover:text-gray-300")}
            title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>

          <div className={cn("h-6 w-px mx-2", isFullscreen ? "bg-gray-600" : "bg-gray-300")} />

          {/* Close */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={cn("h-8 w-8 p-0", isFullscreen && "text-white hover:text-gray-300")}
            title="Fermer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      )}

      {/* Bouton de fermeture SEUL en mode plein écran natif */}
      {isFullscreen && !showToolbar && (
        <button
          onClick={onClose}
          className="fixed top-4 right-4 z-[999999] w-10 h-10 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
          title="Fermer (Échap)"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <div className="text-lg font-medium text-gray-700">Chargement...</div>
            <div className="text-sm text-gray-500 mt-1">Préparation du fichier</div>
          </div>
        </div>
      )}

      {/* Error state */}
      {loadError && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <div className="text-lg font-medium text-gray-700 mb-2">Erreur de chargement</div>
            <div className="text-sm text-gray-500 mb-4">{loadError}</div>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </div>
      )}

      {/* Content area */}
      {!isLoading && !loadError && (
        <div 
          className={cn(
            "flex-1 overflow-hidden",
            isFullscreen && "relative"
          )}
          onMouseMove={isFullscreen ? () => setShowToolbar(true) : undefined}
        >
          {currentFileType?.type === 'pdf' && renderPDFViewer()}
          {currentFileType?.type === 'image' && renderImageViewer()}
          {currentFileType?.type === 'video' && renderVideoViewer()}
          {currentFileType?.type === 'audio' && renderAudioViewer()}
          {currentFileType?.type === 'office' && renderOfficeViewer()}
          {currentFileType?.type === 'text' && renderTextViewer()}
          {currentFileType?.type === 'unsupported' && renderUnsupportedViewer()}
        </div>
      )}
    </div>
  );
};

export default ModernFileViewer;