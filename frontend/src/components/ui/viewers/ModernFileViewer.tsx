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
      'png': 'image/png', 'gif': 'image/gif',
      'mp4': 'video/mp4', 'webm': 'video/webm',
      'mp3': 'audio/mpeg', 'wav': 'audio/wav',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain'
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

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      
      // Auto-hide toolbar in fullscreen, show when not fullscreen
      if (isNowFullscreen) {
        setShowToolbar(false);
        // Auto-hide toolbar after 3 seconds in fullscreen
        const timer = setTimeout(() => {
          setShowToolbar(false);
        }, 3000);
        return () => clearTimeout(timer);
      } else {
        setShowToolbar(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
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
    if (!document.fullscreenElement && containerRef.current) {
      try {
        // Use the container element for true fullscreen
        await containerRef.current.requestFullscreen();
        setShowToolbar(false);
      } catch (err) {
        console.error('Erreur fullscreen:', err);
        toast.error('Impossible de passer en plein écran');
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
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (err) {
        console.error('Erreur sortie fullscreen:', err);
      }
    }
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
  const renderPDFViewer = () => (
    <div className="flex h-full bg-gradient-to-br from-gray-50 to-gray-100">
      {showThumbnails && (
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto shadow-lg">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Pages</h3>
            <div className="space-y-3">
              {Array.from(new Array(numPages), (el, index) => (
                <div
                  key={`thumb_${index + 1}`}
                  onClick={() => setPageNumber(index + 1)}
                  className={cn(
                    "cursor-pointer p-2 rounded-lg border-2 transition-all hover:shadow-md",
                    pageNumber === index + 1
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
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
                  <div className="text-center text-xs text-gray-500 mt-2">
                    Page {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto" ref={contentRef}>
        <div 
          className="flex items-center justify-center min-h-full p-8"
          style={{
            transform: `scale(${pdfScale})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease'
          }}
        >
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages }) => {
              setNumPages(numPages);
              setIsLoading(false);
              setLoadError(null);
            }}
            onLoadError={(error) => {
              console.error('Erreur PDF:', error);
              setLoadError('Impossible de charger le document PDF');
              setIsLoading(false);
            }}
            loading={
              <div className="flex flex-col items-center justify-center p-12 text-gray-600">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <div className="text-lg">Chargement du document...</div>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center p-12 text-red-600">
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
              width={Math.min(900, window.innerWidth - 400)}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              loading={
                <div className="flex items-center justify-center p-8 bg-white rounded-lg shadow-lg">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Chargement de la page...</span>
                </div>
              }
              className="shadow-xl rounded-lg bg-white"
            />
          </Document>
        </div>
      </div>
    </div>
  );

  const renderImageViewer = () => (
    <div className="flex-1 overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="flex items-center justify-center h-full p-4">
        <img
          src={fileUrl}
          alt={fileName}
          style={{
            transform: `scale(${imageScale}) rotate(${imageRotation}deg)`,
            maxWidth: '90%',
            maxHeight: '90%',
            objectFit: 'contain',
            transition: 'transform 0.3s ease'
          }}
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

  const renderVideoViewer = () => (
    <div className="flex-1 flex flex-col bg-black">
      <div className="flex-1 flex items-center justify-center p-4">
        <video
          ref={videoRef}
          src={fileUrl}
          controls={false}
          className="max-w-full max-h-full shadow-2xl rounded-lg"
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration);
              setIsLoading(false);
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
          onError={() => {
            setLoadError('Impossible de lire la vidéo');
            setIsLoading(false);
          }}
        />
      </div>
      
      {/* Custom video controls */}
      <div className="bg-gray-900/90 backdrop-blur-sm p-4 border-t border-gray-700">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePlayPause}
            className="text-white hover:bg-gray-700"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          
          <div className="flex items-center space-x-2 text-white text-sm">
            <span>{formatTime(currentTime)}</span>
            <div className="flex-1 h-2 bg-gray-600 rounded-full overflow-hidden cursor-pointer min-w-[200px]">
              <div 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  handleSeek(percent * duration);
                }}
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.muted = !isMuted;
                setIsMuted(!isMuted);
              }
            }}
            className="text-white hover:bg-gray-700"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderOfficeViewer = () => {
    const officeViewerUrls = [
      `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`,
      `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`
    ];
    
    const currentUrl = officeViewerUrls[officeViewerMethod];

    return (
      <div className="flex-1 bg-gray-100">
        <iframe
          src={currentUrl}
          className="w-full h-full border-0"
          title={fileName}
          onLoad={() => {
            setIsLoading(false);
            setLoadError(null);
          }}
          onError={() => {
            if (officeViewerMethod < officeViewerUrls.length - 1) {
              setOfficeViewerMethod(officeViewerMethod + 1);
              setRetryCount(retryCount + 1);
            } else {
              setLoadError('Impossible de charger le document Office');
              setIsLoading(false);
            }
          }}
        />
        {retryCount > 0 && (
          <div className="absolute top-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3">
            <div className="text-sm text-yellow-800">
              Utilisation d'un visualiseur alternatif...
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
      className="fixed inset-0 z-50 flex flex-col bg-white"
      ref={containerRef}
    >
      {/* Modern Chrome-style toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
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
                  className="h-8 w-8 p-0"
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
                  className="w-16 h-8 text-center text-sm"
                  min={1}
                  max={numPages}
                />
                
                <span className="text-sm text-gray-500">/ {numPages}</span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                  disabled={pageNumber >= numPages}
                  className="h-8 w-8 p-0"
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
                className="h-8 w-8 p-0"
                title="Zoom arrière"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <div className="text-sm text-gray-600 min-w-[50px] text-center">
                {Math.round((currentFileType?.type === 'pdf' ? pdfScale : imageScale) * 100)}%
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                className="h-8 w-8 p-0"
                title="Zoom avant"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <div className="h-6 w-px bg-gray-300 mx-2" />
            </>
          )}

          {/* Rotate for images */}
          {currentFileType?.type === 'image' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRotate}
              className="h-8 w-8 p-0"
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
                showThumbnails ? "bg-blue-100 text-blue-600" : ""
              )}
              title="Miniatures"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          )}

          <div className="h-6 w-px bg-gray-300 mx-2" />

          {/* Download */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 w-8 p-0"
            title="Télécharger"
          >
            <Download className="h-4 w-4" />
          </Button>

          {/* Print */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            className="h-8 w-8 p-0"
            title="Imprimer"
          >
            <Printer className="h-4 w-4" />
          </Button>

          {/* External link */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(fileUrl, '_blank')}
            className="h-8 w-8 p-0"
            title="Ouvrir dans un nouvel onglet"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="h-8 w-8 p-0"
            title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>

          <div className="h-6 w-px bg-gray-300 mx-2" />

          {/* Close */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            title="Fermer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

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
        <div className="flex-1 overflow-hidden">
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