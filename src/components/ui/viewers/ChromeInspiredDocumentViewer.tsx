import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, ExternalLink, Maximize2, Minimize2, X, 
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight, 
  Presentation, Home, RotateCw, Square
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '../button';
import { Input } from '../input';

// Configure PDF.js worker
try {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url,
  ).toString();
} catch (error) {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

interface ChromeInspiredDocumentViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ChromeInspiredDocumentViewer: React.FC<ChromeInspiredDocumentViewerProps> = ({
  fileUrl,
  fileName,
  isOpen,
  onClose
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showControls, setShowControls] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  if (!isOpen) return null;

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const fileExtension = getFileExtension(fileName);
  const isPDF = fileExtension === 'pdf';

  // Chrome-style toolbar handlers
  const handleZoomIn = () => setZoom(prev => Math.min(300, prev + 25));
  const handleZoomOut = () => setZoom(prev => Math.max(50, prev - 25));
  const handleZoomReset = () => setZoom(100);
  const handleFitToWidth = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 80;
      const newZoom = Math.max(50, Math.min(300, (containerWidth / 595) * 100));
      setZoom(Math.round(newZoom));
    }
  };

  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(fileUrl, '_blank');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const togglePresentationMode = () => {
    setIsPresentationMode(!isPresentationMode);
    if (!isPresentationMode) {
      setIsFullscreen(true);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (value >= 1 && value <= totalPages) {
      setCurrentPage(value);
    }
  };

  // PDF handlers
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setTotalPages(numPages);
    setLoading(false);
    setError('');
  };

  const onDocumentLoadError = (error: Error) => {
    setError(`Erreur: ${error.message}`);
    setLoading(false);
  };

  // Auto-hide controls in presentation mode
  useEffect(() => {
    if (isPresentationMode) {
      const timer = setTimeout(() => setShowControls(false), 3000);
      const handleMouseMove = () => {
        setShowControls(true);
        clearTimeout(timer);
        setTimeout(() => setShowControls(false), 3000);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        clearTimeout(timer);
      };
    } else {
      setShowControls(true);
    }
  }, [isPresentationMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevPage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNextPage();
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case 'Escape':
          if (isPresentationMode) {
            setIsPresentationMode(false);
            setIsFullscreen(false);
          } else if (isFullscreen) {
            setIsFullscreen(false);
          } else {
            onClose();
          }
          break;
        case 'f':
        case 'F11':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, isPresentationMode, isFullscreen]);

  const renderContent = () => {
    if (isPDF) {
      return (
        <div className="flex justify-center items-center h-full p-4">
          <div
            style={{
              transform: `rotate(${rotation}deg) scale(${zoom / 100})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease-in-out'
            }}
          >
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div className="animate-pulse bg-gray-200 w-96 h-96 rounded" />}
            >
              <Page
                pageNumber={currentPage}
                className="shadow-lg border border-gray-200"
                loading={<div className="animate-pulse bg-gray-200 w-96 h-96 rounded" />}
              />
            </Document>
          </div>
        </div>
      );
    }

    // For other file types, use iframe
    return (
      <iframe
        src={fileUrl}
        className="w-full h-full border-0"
        title={fileName}
        style={{
          transform: `rotate(${rotation}deg) scale(${zoom / 100})`,
          transformOrigin: 'center center'
        }}
      />
    );
  };

  return (
    <div className={`fixed inset-0 z-50 ${
      isPresentationMode ? 'bg-black' : 'bg-gray-900/95'
    } flex items-center justify-center`}>
      
      <div className={`${
        isFullscreen || isPresentationMode
          ? 'w-full h-full'
          : 'w-[95vw] h-[95vh] max-w-7xl'
      } bg-white rounded-lg overflow-hidden flex flex-col`}>
        
        {/* Chrome-style Toolbar */}
        <div className={`flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 flex-shrink-0 transition-all duration-300 ${
          isPresentationMode && !showControls ? 'opacity-0 pointer-events-none h-0' : 'opacity-100 h-auto'
        }`}>
          
          {/* Left side - File info and navigation */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
                {fileName}
              </span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                {fileExtension.toUpperCase()}
              </span>
            </div>
            
            {isPDF && totalPages > 1 && (
              <>
                <div className="h-4 w-px bg-gray-300" />
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="ghost" onClick={handlePrevPage} disabled={currentPage <= 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    <Input
                      type="number"
                      value={currentPage}
                      onChange={handlePageInputChange}
                      min={1}
                      max={totalPages}
                      className="w-12 h-6 text-xs text-center border-gray-300"
                    />
                    <span className="text-xs text-gray-500">de {totalPages}</span>
                  </div>
                  
                  <Button size="sm" variant="ghost" onClick={handleNextPage} disabled={currentPage >= totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Right side - Chrome-style controls */}
          <div className="flex items-center space-x-1">
            
            {/* Zoom controls */}
            <Button size="sm" variant="ghost" onClick={handleZoomOut} disabled={zoom <= 50}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <span className="text-xs text-gray-600 w-10 text-center font-mono">
              {zoom}%
            </span>
            
            <Button size="sm" variant="ghost" onClick={handleZoomIn} disabled={zoom >= 300}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <Button size="sm" variant="ghost" onClick={handleFitToWidth} title="Ajuster à la largeur">
              <Square className="h-4 w-4" />
            </Button>
            
            <Button size="sm" variant="ghost" onClick={handleRotate} title="Rotation">
              <RotateCw className="h-4 w-4" />
            </Button>

            <div className="h-4 w-px bg-gray-300 mx-1" />

            {/* Action buttons */}
            <Button size="sm" variant="ghost" onClick={togglePresentationMode} title="Mode présentation">
              <Presentation className="h-4 w-4" />
            </Button>

            <Button size="sm" variant="ghost" onClick={toggleFullscreen} title="Plein écran">
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

            <Button size="sm" variant="ghost" onClick={handleDownload} title="Télécharger">
              <Download className="h-4 w-4" />
            </Button>

            <Button size="sm" variant="ghost" onClick={handleOpenInNewTab} title="Nouvel onglet">
              <ExternalLink className="h-4 w-4" />
            </Button>

            <div className="h-4 w-px bg-gray-300 mx-1" />

            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div 
          ref={containerRef}
          className={`flex-1 overflow-auto ${
            isPresentationMode ? 'bg-black' : 'bg-gray-100'
          }`}
        >
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Chargement...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <p className="text-red-600 mb-4">{error}</p>
                <div className="space-x-2">
                  <Button onClick={() => window.location.reload()}>Réessayer</Button>
                  <Button variant="outline" onClick={handleDownload}>Télécharger</Button>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && renderContent()}
        </div>

        {/* Floating controls for presentation mode */}
        {isPresentationMode && showControls && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-full px-4 py-2 flex items-center space-x-2">
            {isPDF && (
              <>
                <button 
                  className="text-white hover:bg-white/20 rounded p-1"
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-white text-sm px-2">{currentPage} / {totalPages}</span>
                <button 
                  className="text-white hover:bg-white/20 rounded p-1"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="h-4 w-px bg-white/30 mx-2" />
              </>
            )}
            
            <button className="text-white hover:bg-white/20 rounded p-1" onClick={handleDownload}>
              <Download className="h-5 w-5" />
            </button>
            
            <button className="text-white hover:bg-white/20 rounded p-1" onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChromeInspiredDocumentViewer;