import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, ZoomIn, ZoomOut, Download, Maximize2, Minimize2, RotateCw, 
  ChevronLeft, ChevronRight, Printer, ExternalLink, RefreshCw,
  Menu, Grid3X3, Play, Pause, VolumeX, Volume2, SkipBack, SkipForward,
  FileText, Image, Video, File, AlertCircle, Loader2, Search,
  Settings, Share2, Bookmark, MoreVertical, Monitor, Smartphone,
  Tablet, SquareEqual, Presentation
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
  const [officeScale, setOfficeScale] = useState<number>(1.0); // Zoom pour Office
  
  // PowerPoint specific states
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides, setTotalSlides] = useState(0);
  
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

  // Manage body overflow in fullscreen and PowerPoint CSS optimization
  useEffect(() => {
    if (isFullscreen) {
      // Hide body scroll and prevent scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.documentElement.style.overflow = 'hidden';
      
      // CSS spécialement pour maximiser PowerPoint
      const powerPointCSS = `
        iframe[title*="PowerPoint"] {
          width: 100% !important;
          height: 100% !important;
          border: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* Forcer Office Online à utiliser tout l'espace */
        .office-frame, .WACViewPanel, .PowerPointFrame {
          width: 100% !important;
          height: 100% !important;
          transform: scale(1.3) !important;
          transform-origin: center center !important;
        }
      `;
      
      // Ajouter le CSS au document
      let styleElement = document.getElementById('powerpoint-fullscreen-css');
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'powerpoint-fullscreen-css';
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = powerPointCSS;
      
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.documentElement.style.overflow = 'unset';
      
      // Supprimer le CSS PowerPoint
      const styleElement = document.getElementById('powerpoint-fullscreen-css');
      if (styleElement) {
        styleElement.remove();
      }
    }

    return () => {
      // Cleanup on unmount
      document.body.style.overflow = 'unset';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.documentElement.style.overflow = 'unset';
      
      const styleElement = document.getElementById('powerpoint-fullscreen-css');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [isFullscreen]);

  // Control functions
  const handleZoomIn = () => {
    if (currentFileType?.type === 'pdf') {
      setPdfScale(prev => Math.min(prev + 0.25, 3.0));
    } else if (currentFileType?.type === 'image') {
      setImageScale(prev => Math.min(prev + 0.25, 5.0));
    } else if (currentFileType?.type === 'office') {
      setOfficeScale(prev => Math.min(prev + 0.15, 2.0));
    }
  };

  const handleZoomOut = () => {
    if (currentFileType?.type === 'pdf') {
      setPdfScale(prev => Math.max(prev - 0.25, 0.25));
    } else if (currentFileType?.type === 'image') {
      setImageScale(prev => Math.max(prev - 0.25, 0.1));
    } else if (currentFileType?.type === 'office') {
      setOfficeScale(prev => Math.max(prev - 0.15, 0.5));
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
  // Optimisation spéciale PowerPoint
  const optimizePowerPointDisplay = useCallback((mode: string) => {
    const iframe = document.querySelector('iframe[title*="PowerPoint"]') as HTMLIFrameElement;
    if (!iframe) return;

    const container = contentRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    let scale = 1.0;
    let transformOrigin = 'center center';

    switch (mode) {
      case 'width':
        scale = Math.min(containerWidth / 800, 1.5); // Utiliser toute la largeur
        transformOrigin = 'top center';
        break;
      case 'height':
        scale = Math.min(containerHeight / 600, 1.5); // Optimiser pour la hauteur
        transformOrigin = 'center center';
        break;
      case 'page':
        scale = Math.min(containerWidth / 800, containerHeight / 600, 1.8); // Page complète
        transformOrigin = 'center center';
        break;
      case 'auto':
      default:
        scale = isFullscreen ? 1.4 : 1.2; // Agrandissement par défaut
        transformOrigin = 'center center';
        break;
    }

    // Appliquer la transformation
    iframe.style.transform = `scale(${scale})`;
    iframe.style.transformOrigin = transformOrigin;
    iframe.style.width = '100%';
    iframe.style.height = '100%';

    console.log(`🎯 PowerPoint optimisé: mode=${mode}, scale=${scale}`);
  }, [isFullscreen]);

  const handleFitModeChange = (mode: 'auto' | 'width' | 'height' | 'page') => {
    setFitMode(mode);
    
    if (currentFileType?.type === 'pdf') {
      const contentElement = contentRef.current;
      if (!contentElement) return;
      
      const containerWidth = contentElement.clientWidth;
      const containerHeight = contentElement.clientHeight;
      
      switch (mode) {
        case 'width':
          setPdfScale(containerWidth / 800);
          break;
        case 'height':
          setPdfScale(containerHeight / 1000);
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
    } else if (currentFileType?.type === 'office') {
      // Optimisation spéciale Office/PowerPoint
      console.log(`📊 Mode d'ajustement Office: ${mode}`);
      
      switch (mode) {
        case 'width':
          setOfficeScale(1.3); // Largeur maximale
          break;
        case 'height':
          setOfficeScale(1.2); // Optimiser pour la hauteur
          break;
        case 'page':
          setOfficeScale(1.5); // Page complète - plus grand
          break;
        case 'auto':
        default:
          setOfficeScale(1.0); // Par défaut
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
      // Style optimisé selon le mode d'affichage - Style YouTube-like
      if (isFullscreen) {
        // En mode plein écran, calculer selon la toolbar
        const availableHeight = showToolbar ? 'calc(100vh - 60px)' : '100vh';
        
        switch (fitMode) {
          case 'width':
            // Largeur maximale comme YouTube
            return {
              width: '100vw',
              height: availableHeight,
              maxWidth: '100vw',
              maxHeight: availableHeight,
              objectFit: 'contain' as const
            };
          case 'height':
            return {
              width: 'auto',
              height: availableHeight,
              maxWidth: '100vw',
              maxHeight: availableHeight,
              objectFit: 'contain' as const
            };
          case 'page':
            // Mode page = couverture complète comme YouTube
            return {
              width: '100vw',
              height: availableHeight,
              maxWidth: '100vw',
              maxHeight: availableHeight,
              objectFit: 'cover' as const // Cover pour remplir complètement
            };
          case 'auto':
          default:
            // Par défaut en plein écran, maximiser l'utilisation de l'espace
            return {
              width: '100vw',
              height: availableHeight,
              maxWidth: '100vw',
              maxHeight: availableHeight,
              objectFit: 'contain' as const
            };
        }
      } else {
        // Mode normal avec contrôles similaires au PDF
        switch (fitMode) {
          case 'width':
            return {
              width: '100%',
              height: 'auto',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain' as const
            };
          case 'height':
            return {
              width: 'auto',
              height: '100%',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain' as const
            };
          case 'page':
            return {
              width: '100%',
              height: '100%',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'cover' as const // Cover pour remplir le conteneur
            };
          case 'auto':
          default:
            return {
              width: '100%',
              height: 'auto',
              maxWidth: '100%',
              maxHeight: '70vh',
              objectFit: 'contain' as const
            };
        }
      }
    };

    return (
      <div 
        className="flex-1 flex flex-col bg-black overflow-hidden"
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
        {/* Zone de la vidéo */}
        <div 
          className="flex-1 flex items-center justify-center bg-black relative"
          style={isFullscreen ? {
            position: 'absolute',
            top: showToolbar ? '60px' : '0',
            left: '0',
            right: '0',
            bottom: '60px', // Contrôles vidéo toujours en bas
            width: '100%',
            height: showToolbar ? 'calc(100vh - 120px)' : 'calc(100vh - 60px)',
            margin: '0',
            padding: '0'
          } : { 
            minHeight: '400px'
          }}
        >
          {/* Indicateur de chargement vidéo */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center text-white">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                <div className="text-lg font-medium">Chargement de la vidéo...</div>
                <div className="text-sm opacity-70 mt-2">Préparation du lecteur</div>
              </div>
            </div>
          )}

          {/* Erreur de chargement */}
          {loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
              <div className="text-center p-8">
                <Video className="h-16 w-16 mx-auto mb-4 text-red-500" />
                <div className="text-xl font-semibold mb-2">Impossible de lire la vidéo</div>
                <div className="text-sm opacity-70 mb-6">{loadError}</div>
                <div className="space-x-3">
                  <Button onClick={handleDownload} variant="outline" className="text-white border-white">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                  <Button 
                    onClick={() => {
                      setLoadError(null);
                      setIsLoading(true);
                      if (videoRef.current) {
                        videoRef.current.load();
                      }
                    }}
                    variant="outline" 
                    className="text-white border-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réessayer
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Élément vidéo principal */}
          <video
            ref={videoRef}
            src={fileUrl}
            controls={false}
            style={getVideoStyle()}
            className={cn(
              "transition-all duration-300",
              isFullscreen ? "" : "rounded-lg shadow-2xl"
            )}
            onLoadStart={() => {
              console.log('🎬 Début de chargement vidéo');
              setIsLoading(true);
            }}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setDuration(videoRef.current.duration);
                console.log('📹 Métadonnées vidéo chargées, durée:', videoRef.current.duration);
              }
            }}
            onCanPlay={() => {
              console.log('▶️ Vidéo prête à être lue');
              setIsLoading(false);
              setLoadError(null);
            }}
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
              }
            }}
            onPlay={() => {
              setIsPlaying(true);
              console.log('▶️ Lecture démarrée');
            }}
            onPause={() => {
              setIsPlaying(false);
              console.log('⏸️ Lecture en pause');
            }}
            onVolumeChange={() => {
              if (videoRef.current) {
                setVolume(videoRef.current.volume);
                setIsMuted(videoRef.current.muted);
              }
            }}
            onError={(e) => {
              console.error('❌ Erreur vidéo:', e);
              const target = e.target as HTMLVideoElement;
              let errorMessage = 'Format vidéo non supporté ou fichier corrompu';
              
              if (target.error) {
                switch (target.error.code) {
                  case 1: errorMessage = 'Chargement vidéo interrompu par l\'utilisateur'; break;
                  case 2: errorMessage = 'Erreur réseau lors du chargement'; break;
                  case 3: errorMessage = 'Format vidéo non supporté'; break;
                  case 4: errorMessage = 'Fichier vidéo non trouvé ou inaccessible'; break;
                  default: errorMessage = 'Erreur inconnue lors de la lecture';
                }
              }
              
              setLoadError(errorMessage);
              setIsLoading(false);
            }}
            onAbort={() => console.log('⚠️ Chargement vidéo interrompu')}
            onStalled={() => console.log('⏳ Vidéo en attente de données')}
            preload="metadata"
            playsInline={true}
          />
        </div>
        
        {/* Contrôles vidéo avancés - Style YouTube/Netflix */}
        <div 
          className={cn(
            "flex items-center space-x-4 px-6 py-3 backdrop-blur-sm border-t",
            isFullscreen ? "bg-black/90 border-gray-700 absolute bottom-0 left-0 right-0" : "bg-gray-900/95 border-gray-700"
          )}
          style={isFullscreen ? {
            zIndex: 10
          } : {}}
        >
          {/* Bouton Play/Pause */}
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePlayPause}
            className="text-white hover:bg-white/20 h-10 w-10 p-0 rounded-full"
            disabled={isLoading || !!loadError}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          
          {/* Barre de progression */}
          <div className="flex items-center space-x-3 text-white text-sm flex-1">
            <span className="text-xs font-mono min-w-[40px]">
              {formatTime(currentTime)}
            </span>
            
            <div 
              className="flex-1 h-2 bg-gray-600/50 rounded-full overflow-hidden cursor-pointer hover:h-3 transition-all group"
              onClick={(e) => {
                if (duration > 0) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  handleSeek(percent * duration);
                }
              }}
            >
              {/* Barre de progression */}
              <div className="relative h-full">
                <div 
                  className="h-full bg-red-600 rounded-full transition-all group-hover:bg-red-500"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
                {/* Indicateur de position au hover */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                  style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`, marginLeft: '-6px' }}
                />
              </div>
            </div>
            
            <span className="text-xs font-mono min-w-[40px]">
              {formatTime(duration)}
            </span>
          </div>
          
          {/* Contrôles volume */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            
            {/* Slider de volume amélioré */}
            <div className="relative group">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
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
                className="w-20 h-2 bg-gray-600/50 rounded-full appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(isMuted ? 0 : volume) * 100}%, #4b5563 ${(isMuted ? 0 : volume) * 100}%, #4b5563 100%)`
                }}
              />
            </div>
          </div>
          
          {/* Infos techniques (si pas en plein écran) */}
          {!isFullscreen && videoRef.current && (
            <div className="text-xs text-gray-400 hidden lg:block">
              {videoRef.current.videoWidth}×{videoRef.current.videoHeight}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPowerPointViewer = () => {
    // Rendu PowerPoint similaire au PDF avec navigation par slides

    // URLs optimisées pour PowerPoint avec rendu haute qualité
    const getPowerPointUrls = () => {
      // S'assurer que l'URL est accessible publiquement
      const cleanUrl = fileUrl.trim();
      const encodedUrl = encodeURIComponent(cleanUrl);
      
      return [
        // Method 1: Office Online Viewer (le plus fiable pour PowerPoint)
        `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`,
        // Method 2: Office Online avec paramètres avancés
        `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}&action=embedview&wdAr=1.777777777777777&wdHideHeaders=false&wdHideGridlines=true&wdHideNavigation=false&wdDownloadButton=true&wdInConfigurator=false&wdbiPreview=false`,
        // Method 3: Google Docs Viewer (backup)
        `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`,
        // Method 4: Tentative directe
        cleanUrl
      ];
    };

    const powerPointUrls = getPowerPointUrls();
    const currentUrl = powerPointUrls[officeViewerMethod];

    return (
      <div className={cn(
        "flex h-full",
        isFullscreen ? "bg-black" : "bg-gradient-to-br from-gray-50 to-gray-100"
      )}>
        {/* Miniatures comme pour PDF */}
        {showThumbnails && (
          <div className={cn(
            "w-64 border-r overflow-y-auto shadow-lg",
            isFullscreen ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}>
            <div className="p-4">
              <h3 className={cn(
                "text-sm font-semibold mb-3",
                isFullscreen ? "text-gray-200" : "text-gray-700"
              )}>Slides</h3>
              <div className="space-y-3">
                {/* Simuler des miniatures pour PowerPoint */}
                {Array.from(new Array(totalSlides || 8), (el, index) => (
                  <div
                    key={`slide_${index + 1}`}
                    onClick={() => setCurrentSlide(index + 1)}
                    className={cn(
                      "cursor-pointer p-3 rounded-lg border-2 transition-all hover:shadow-md aspect-video",
                      currentSlide === index + 1 && !isFullscreen && "border-orange-500 bg-orange-50 shadow-md",
                      currentSlide === index + 1 && isFullscreen && "border-orange-400 bg-orange-900 shadow-md",
                      currentSlide !== index + 1 && !isFullscreen && "border-gray-200 hover:border-gray-300",
                      currentSlide !== index + 1 && isFullscreen && "border-gray-600 hover:border-gray-500"
                    )}
                  >
                    <div className={cn(
                      "w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 rounded flex items-center justify-center text-xs font-medium",
                      isFullscreen && "from-orange-800 to-orange-900 text-orange-200"
                    )}>
                      📋 {index + 1}
                    </div>
                    <div className={cn(
                      "text-center text-xs mt-2",
                      isFullscreen ? "text-gray-300" : "text-gray-500"
                    )}>
                      Slide {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Zone de contenu principale - PowerPoint PLEIN ÉCRAN */}
        <div 
          className="flex-1 overflow-hidden bg-white" 
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
            overflow: 'hidden',
            background: 'white'
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
            overflow: 'hidden',
            background: 'white'
          } : {
            background: 'white',
            minHeight: '80vh'
          }}
        >
          {/* Indicateurs de chargement */}
          {isLoading && (
            <div className={cn(
              "absolute inset-0 flex items-center justify-center z-20",
              isFullscreen ? "bg-black/90 text-white" : "bg-white/90 text-gray-700"
            )}>
              <div className="text-center p-8">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-orange-600" />
                <div className="text-xl font-medium mb-2">
                  Chargement PowerPoint
                </div>
                <div className="text-sm opacity-70">
                  {retryCount > 0 ? `Méthode ${retryCount + 1}/${powerPointUrls.length}` : 'Optimisation du rendu...'}
                </div>
                <div className="mt-4">
                  <div className="w-64 h-1 bg-gray-300 rounded-full mx-auto overflow-hidden">
                    <div className="h-full bg-orange-600 rounded-full animate-pulse" style={{width: '75%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Iframe PowerPoint plein écran */}
          <div className={cn(
            "w-full h-full relative overflow-hidden",
            isFullscreen ? "bg-black" : "bg-white"
          )}>
            <iframe
              src={currentUrl}
              className="w-full h-full border-0"
              style={isFullscreen ? {
                width: '100vw',
                height: '100vh',
                margin: '0',
                padding: '0',
                border: 'none',
                borderRadius: '0',
                outline: 'none',
                transform: `scale(${officeScale})`,
                transformOrigin: 'center center',
                position: 'absolute',
                top: '0',
                left: '0'
              } : {
                width: '100%',
                height: '100%',
                margin: '0',
                padding: '0',
                border: 'none',
                transform: `scale(${officeScale})`,
                transformOrigin: 'center center'
              }}}
              title={`PowerPoint: ${fileName}`}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads allow-presentation"
              allowFullScreen={true}
              loading="eager"
              onLoad={() => {
                setTimeout(() => {
                  setIsLoading(false);
                  setLoadError(null);
                  setTotalSlides(8);
                  console.log('✅ PowerPoint chargé avec rendu PLEIN ÉCRAN');
                  
                  // Injection CSS pour maximiser l'affichage PowerPoint
                  const iframe = document.querySelector(`iframe[title="PowerPoint: ${fileName}"]`) as HTMLIFrameElement;
                  if (iframe) {
                    try {
                      iframe.onload = () => {
                        try {
                          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                          if (iframeDoc) {
                            // CSS pour maximiser l'affichage Office Online
                            const style = iframeDoc.createElement('style');
                            style.textContent = `
                              body, html {
                                margin: 0 !important;
                                padding: 0 !important;
                                width: 100vw !important;
                                height: 100vh !important;
                                overflow: hidden !important;
                              }
                              .WACViewPanel_1, .WACViewPanel {
                                width: 100% !important;
                                height: 100% !important;
                                margin: 0 !important;
                                padding: 0 !important;
                              }
                              .PowerPointFrame, .Office-App, .App-host {
                                width: 100% !important;
                                height: 100% !important;
                                transform: scale(1.5) !important;
                                transform-origin: center center !important;
                              }
                            `;
                            iframeDoc.head.appendChild(style);
                          }
                        } catch (e) {
                          console.log('Cross-origin iframe, CSS injection impossible');
                        }
                      };
                    } catch (e) {
                      console.log('Impossible d\'accéder au contenu de l\'iframe');
                    }
                  }
                }, 2000);
              }}
              onError={(e) => {
                console.error(`❌ Erreur PowerPoint avec ${currentUrl}:`, e);
                if (officeViewerMethod < powerPointUrls.length - 1) {
                  console.log(`🔄 Tentative méthode ${officeViewerMethod + 2}/${powerPointUrls.length}`);
                  setOfficeViewerMethod(officeViewerMethod + 1);
                  setRetryCount(retryCount + 1);
                  setIsLoading(true);
                } else {
                  setLoadError('Impossible de charger la présentation PowerPoint. Le fichier peut être protégé ou corrompu.');
                  setIsLoading(false);
                }
              }}
            />

            {/* Overlay de navigation si besoin */}
            {!isLoading && !loadError && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Zone de navigation invisible pour slides */}
                <div 
                  className="absolute left-0 top-0 w-16 h-full pointer-events-auto cursor-pointer hover:bg-black/10 transition-colors flex items-center justify-center"
                  onClick={() => {
                    if (currentSlide > 1) {
                      setCurrentSlide(currentSlide - 1);
                    }
                  }}
                >
                  {currentSlide > 1 && (
                    <ChevronLeft className="h-8 w-8 text-black/50 hover:text-black/80" />
                  )}
                </div>
                
                <div 
                  className="absolute right-0 top-0 w-16 h-full pointer-events-auto cursor-pointer hover:bg-black/10 transition-colors flex items-center justify-center"
                  onClick={() => {
                    if (currentSlide < (totalSlides || 8)) {
                      setCurrentSlide(currentSlide + 1);
                    }
                  }}
                >
                  {currentSlide < (totalSlides || 8) && (
                    <ChevronRight className="h-8 w-8 text-black/50 hover:text-black/80" />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Gestion d'erreur */}
          {loadError && (
            <div className={cn(
              "absolute inset-0 flex items-center justify-center p-8",
              isFullscreen ? "bg-black text-white" : "bg-gray-50 text-gray-700"
            )}>
              <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-6">
                  <Presentation className="h-8 w-8 text-orange-600" />
                </div>
                <div className="text-xl font-semibold mb-3">PowerPoint non accessible</div>
                <div className="text-sm mb-6 opacity-80">{loadError}</div>
                
                <div className="space-x-3">
                  <Button onClick={handleDownload} className="bg-orange-600 hover:bg-orange-700">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
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

        {/* Indicateur de méthode de rendu */}
        {retryCount > 0 && !isLoading && !loadError && (
          <div className={cn(
            "absolute top-4 right-4 px-3 py-2 rounded-lg shadow-lg text-xs font-medium z-10",
            isFullscreen ? "bg-gray-800/90 text-orange-400 border border-gray-600" : "bg-orange-100 text-orange-800 border border-orange-200"
          )}>
            📋 Rendu optimisé PowerPoint ({retryCount + 1}/{powerPointUrls.length})
          </div>
        )}
      </div>
    );
  };

  const renderOfficeViewer = () => {
    const extension = getFileExtension(fileName);
    const isPowerPoint = ['ppt', 'pptx'].includes(extension);
    
    // Utiliser le rendu spécialisé pour PowerPoint
    if (isPowerPoint) {
      return renderPowerPointViewer();
    }
    
    // Continuer avec Excel et Word comme avant
    const isExcel = ['xls', 'xlsx'].includes(extension);
    const isWord = ['doc', 'docx'].includes(extension);
    
    // URLs pour Excel et Word seulement
    const getOfficeViewerUrls = () => {
      const baseUrl = fileUrl;
      const encodedUrl = encodeURIComponent(baseUrl);
      
      if (isExcel) {
        return [
          `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}&action=embedview&wdHideHeaders=true&wdHideGridlines=false&wdDownloadButton=false&wdInConfigurator=true`,
          `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true&chrome=false&dov=1`,
          `https://view.officeapps.live.com/op/view.aspx?src=${encodedUrl}`
        ];
      } else {
        return [
          `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}&action=embedview&wdHideHeaders=true&wdDownloadButton=false&wdInConfigurator=true`,
          `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true&chrome=false&dov=1`
        ];
      }
    };
    
    const officeViewerUrls = getOfficeViewerUrls();
    const currentUrl = officeViewerUrls[officeViewerMethod];

    return (
      <div 
        className={cn(
          "flex-1 relative overflow-hidden",
          isFullscreen ? "bg-black" : "bg-white"
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
          border: 'none'
        } : {}}
      >
        {isLoading && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center z-10",
            isFullscreen ? "bg-black/90 text-white" : "bg-white/90 text-gray-700"
          )}>
            <div className="text-center p-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <div className="text-xl font-medium mb-2">
                Chargement {isExcel ? 'Excel' : 'Word'}
              </div>
              <div className="text-sm opacity-70">
                {retryCount > 0 ? `Tentative ${retryCount + 1}/${officeViewerUrls.length}` : 'Optimisation de l\'affichage...'}
              </div>
              <div className="mt-4">
                <div className="w-64 h-1 bg-gray-300 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{width: '70%'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <iframe
          src={currentUrl}
          className={cn(
            "w-full h-full border-0 bg-white",
            isFullscreen ? "absolute inset-0" : ""
          )}
          style={isFullscreen ? {
            width: '100vw',
            height: '100vh',
            margin: 0,
            padding: 0,
            border: 'none',
            borderRadius: 0
          } : {}}
          title={fileName}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
          allowFullScreen={true}
          onLoad={() => {
            setTimeout(() => {
              setIsLoading(false);
              setLoadError(null);
              console.log(`✅ Document ${isExcel ? 'Excel' : 'Word'} chargé avec succès`);
            }, 1500);
          }}
          onError={(e) => {
            console.error(`❌ Erreur avec ${currentUrl}:`, e);
            if (officeViewerMethod < officeViewerUrls.length - 1) {
              console.log(`🔄 Tentative avec visualiseur alternatif ${officeViewerMethod + 1}`);
              setOfficeViewerMethod(officeViewerMethod + 1);
              setRetryCount(retryCount + 1);
              setIsLoading(true);
            } else {
              setLoadError(`Impossible de charger le document ${isExcel ? 'Excel' : 'Word'}. Vérifiez que le fichier est accessible publiquement.`);
              setIsLoading(false);
            }
          }}
        />
        
        {/* Indicateur de méthode alternative */}
        {retryCount > 0 && !isLoading && !loadError && (
          <div className={cn(
            "absolute top-4 right-4 px-3 py-2 rounded-lg shadow-lg text-xs font-medium",
            isFullscreen ? "bg-gray-800/90 text-yellow-400 border border-gray-600" : "bg-blue-100 text-blue-800 border border-blue-200"
          )}>
            📊 Visualiseur optimisé ({retryCount + 1}/{officeViewerUrls.length})
          </div>
        )}

        {loadError && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center p-8",
            isFullscreen ? "bg-black text-white" : "bg-gray-50 text-gray-700"
          )}>
            <div className="text-center max-w-md">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6",
                isExcel ? "bg-green-100" : "bg-blue-100"
              )}>
                {isExcel ? "📊" : "📄"}
              </div>
              <div className="text-xl font-semibold mb-3">Document non accessible</div>
              <div className="text-sm mb-6 opacity-80">{loadError}</div>
              
              <div className="space-x-3">
                <Button 
                  onClick={handleDownload}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
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

          {/* PowerPoint Navigation */}
          {currentFileType?.type === 'office' && getFileExtension(fileName).match(/^(ppt|pptx)$/) && totalSlides > 0 && (
            <>
              <div className="h-8 w-px bg-gray-300" />
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentSlide(Math.max(1, currentSlide - 1))}
                  disabled={currentSlide <= 1}
                  className={cn("h-8 w-8 p-0", isFullscreen && "text-white hover:text-gray-300")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Input
                  type="number"
                  value={currentSlide}
                  onChange={(e) => {
                    const slide = parseInt(e.target.value);
                    if (slide >= 1 && slide <= totalSlides) {
                      setCurrentSlide(slide);
                    }
                  }}
                  className={cn(
                    "w-16 h-8 text-center text-sm",
                    isFullscreen && "bg-black/50 border-gray-600 text-white"
                  )}
                  min={1}
                  max={totalSlides}
                />
                
                <span className={cn("text-sm", isFullscreen ? "text-gray-300" : "text-gray-500")}>/ {totalSlides}</span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentSlide(Math.min(totalSlides, currentSlide + 1))}
                  disabled={currentSlide >= totalSlides}
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
          {(['pdf', 'image', 'office'].includes(currentFileType?.type || '')) && (
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
                {Math.round((
                  currentFileType?.type === 'pdf' ? pdfScale : 
                  currentFileType?.type === 'image' ? imageScale :
                  officeScale
                ) * 100)}%
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

          {/* PowerPoint Slides Thumbnails */}
          {currentFileType?.type === 'office' && getFileExtension(fileName).match(/^(ppt|pptx)$/) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowThumbnails(!showThumbnails)}
              className={cn(
                "h-8 w-8 p-0",
                showThumbnails && !isFullscreen && "bg-orange-100 text-orange-600",
                showThumbnails && isFullscreen && "bg-orange-600 text-white",
                isFullscreen && "text-white hover:text-gray-300"
              )}
              title="Miniatures des slides"
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