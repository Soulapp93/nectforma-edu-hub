import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw,
  Download, Maximize2, Minimize2, X, RefreshCw, ExternalLink,
  AlertCircle, Loader2, Home, BookOpen, Search, Grid3X3
} from 'lucide-react';
import { Button } from '../button';
import { Alert, AlertDescription } from '../alert';
import { Input } from '../input';
import { Slider } from '../slider';

// Configure PDF.js worker avec fallback
try {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url,
  ).toString();
} catch (error) {
  console.warn('Fallback to CDN worker:', error);
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

interface ModernPDFViewerProps {
  fileUrl: string;
  fileName: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onClose?: () => void;
}

const ModernPDFViewer: React.FC<ModernPDFViewerProps> = ({
  fileUrl,
  fileName,
  isFullscreen = false,
  onToggleFullscreen,
  onClose
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [renderMode, setRenderMode] = useState<'single' | 'continuous'>('single');
  const [useFallback, setUseFallback] = useState<boolean>(false);
  const [loadAttempts, setLoadAttempts] = useState<number>(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Timeout pour détecter un chargement bloqué
  useEffect(() => {
    if (loading && !useFallback && loadAttempts < 2) {
      console.log('PDF loading timeout started');
      const timeout = setTimeout(() => {
        console.warn('PDF loading timeout - switching to fallback iframe');
        setUseFallback(true);
        setLoading(false);
        setError('');
      }, 8000); // 8 secondes de timeout

      return () => clearTimeout(timeout);
    }
  }, [loading, useFallback, loadAttempts]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError('');
    setLoadAttempts(prev => prev + 1);
    console.log('✓ PDF loaded successfully:', numPages, 'pages');
    console.log('File URL:', fileUrl);
  }, [fileUrl]);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('✗ PDF loading error:', error);
    console.error('File URL:', fileUrl);
    console.error('Error details:', error.message, error.stack);
    console.error('PDF.js version:', pdfjs.version);
    console.error('Worker src:', pdfjs.GlobalWorkerOptions.workerSrc);
    
    setLoadAttempts(prev => prev + 1);
    
    // Basculer vers le fallback iframe après la première erreur
    if (loadAttempts === 0) {
      console.warn('Switching to iframe fallback after first error');
      setUseFallback(true);
      setLoading(false);
      setError('');
    } else {
      setError(`Erreur de chargement: ${error.message}`);
      setLoading(false);
    }
  }, [fileUrl, loadAttempts]);

  const onPageLoadSuccess = useCallback(() => {
    console.log('Page rendered successfully');
  }, []);

  const goToPrevPage = useCallback(() => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  }, [numPages]);

  const goToFirstPage = useCallback(() => {
    setPageNumber(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setPageNumber(numPages);
  }, [numPages]);

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev * 1.2, 3.0));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev / 1.2, 0.3));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1.0);
  }, []);

  const fitToWidth = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 40;
      // Approximate PDF page width ratio
      const newScale = containerWidth / 595; // A4 width in points
      setScale(Math.max(0.3, Math.min(3.0, newScale)));
    }
  }, []);

  const rotateClockwise = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [fileUrl, fileName]);

  const openInNewTab = useCallback(() => {
    window.open(fileUrl, '_blank');
  }, [fileUrl]);

  const handlePageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (value >= 1 && value <= numPages) {
      setPageNumber(value);
    }
  }, [numPages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevPage();
          break;
        case 'ArrowRight':
          goToNextPage();
          break;
        case 'Home':
          goToFirstPage();
          break;
        case 'End':
          goToLastPage();
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
        case '0':
          e.preventDefault();
          resetZoom();
          break;
        case 'f':
        case 'F11':
          if (onToggleFullscreen) {
            e.preventDefault();
            onToggleFullscreen();
          }
          break;
        case 'Escape':
          if (isFullscreen && onClose) {
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevPage, goToNextPage, goToFirstPage, goToLastPage, zoomIn, zoomOut, resetZoom, onToggleFullscreen, onClose, isFullscreen]);

  return (
    <div 
      className={`${
        isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : 'w-full h-full bg-white'
      } flex flex-col`}
      style={{
        fontFeatureSettings: '"liga" on, "kern" on',
        textRendering: 'optimizeLegibility',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale'
      }}
    >
      {/* Header/Toolbar */}
      <div className={`${
        isFullscreen 
          ? 'bg-gray-800 text-white border-gray-700' 
          : 'bg-white text-gray-900 border-gray-200'
      } border-b flex-shrink-0`}>
        {/* Top Row - File Info */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-5 w-5 text-blue-500" />
            <h2 className="text-sm font-semibold truncate max-w-md">
              {fileName}
            </h2>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium">
              PDF
            </span>
            {numPages > 0 && (
              <span className="text-xs opacity-60">
                {numPages} page{numPages > 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <Button size="sm" variant="ghost" onClick={openInNewTab} className="h-8 px-2">
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDownload} className="h-8 px-2">
              <Download className="h-4 w-4" />
            </Button>
            {onToggleFullscreen && (
              <Button size="sm" variant="ghost" onClick={onToggleFullscreen} className="h-8 px-2">
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}
            {onClose && (
              <Button size="sm" variant="ghost" onClick={onClose} className="h-8 px-2">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Bottom Row - Controls */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-700">
          {/* Navigation */}
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={goToFirstPage}
              disabled={pageNumber <= 1}
              className="h-8 px-2"
            >
              <Home className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="h-8 px-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-1">
              <Input
                type="number"
                value={pageNumber}
                onChange={handlePageInputChange}
                min={1}
                max={numPages}
                className="w-16 h-8 text-center text-sm"
              />
              <span className="text-sm opacity-60">/ {numPages}</span>
            </div>
            
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className="h-8 px-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={goToLastPage}
              disabled={pageNumber >= numPages}
              className="h-8 px-2"
            >
              <BookOpen className="h-3 w-3" />
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="ghost" onClick={zoomOut} className="h-8 px-2">
              <ZoomOut className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={fitToWidth} className="h-8 px-3 text-xs">
              Ajuster
            </Button>
            <span className="text-xs min-w-[50px] text-center font-mono">
              {Math.round(scale * 100)}%
            </span>
            <Button size="sm" variant="ghost" onClick={zoomIn} className="h-8 px-2">
              <ZoomIn className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={rotateClockwise} className="h-8 px-2">
              <RotateCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto" ref={containerRef}>
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-sm opacity-60">Chargement du PDF...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full p-8">
            <Alert className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <div className="mt-3 space-x-2">
                  <Button size="sm" onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réessayer
                  </Button>
                  <Button size="sm" variant="outline" onClick={openInNewTab}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir dans un nouvel onglet
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {!loading && !error && !useFallback && (
          <div className="flex justify-center p-4">
            <div 
              ref={pageRef}
              className="shadow-lg"
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
            >
              <Document
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                }
                error={
                  <div className="p-8 text-center">
                    <AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
                    <p className="text-sm text-red-600">Erreur de chargement du PDF</p>
                  </div>
                }
                options={{
                  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
                  cMapPacked: true,
                  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
                  withCredentials: false,
                }}
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  onLoadSuccess={onPageLoadSuccess}
                  loading={
                    <div className="flex items-center justify-center p-8 bg-gray-50 rounded">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                  }
                  error={
                    <div className="p-8 text-center bg-gray-50 rounded">
                      <AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
                      <p className="text-sm text-red-600">Erreur de rendu de la page</p>
                    </div>
                  }
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="max-w-full"
                />
              </Document>
            </div>
          </div>
        )}

        {/* Fallback iframe pour les PDFs qui ne chargent pas avec react-pdf */}
        {!loading && !error && useFallback && (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full h-full max-w-[1200px] shadow-2xl bg-white rounded-lg overflow-hidden">
              <iframe
                src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1&page=${pageNumber}&zoom=${Math.round(scale * 100)}`}
                className="w-full h-full border-0"
                title={fileName}
                onLoad={() => {
                  console.log('✓ PDF loaded successfully via iframe fallback');
                  setLoading(false);
                }}
                onError={() => {
                  console.error('✗ Iframe also failed to load PDF');
                  setError('Impossible de charger le PDF');
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernPDFViewer;