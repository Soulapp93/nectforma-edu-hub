import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, Download, Maximize2, Minimize2, RotateCw, Menu, ChevronLeft, ChevronRight, Printer, ExternalLink } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configuration de PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ChromeStyleViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ChromeStyleViewer: React.FC<ChromeStyleViewerProps> = ({
  fileUrl,
  fileName,
  isOpen,
  onClose
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.3);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageWidth, setPageWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Calculate page width on mount and resize
  useEffect(() => {
    const updatePageWidth = () => {
      if (contentRef.current) {
        const width = contentRef.current.clientWidth;
        setPageWidth(width - 100); // Padding
      }
    };

    updatePageWidth();
    window.addEventListener('resize', updatePageWidth);
    return () => window.removeEventListener('resize', updatePageWidth);
  }, [showThumbnails]);

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
          if (pageNumber > 1) setPageNumber(pageNumber - 1);
          break;
        case 'ArrowRight':
          if (pageNumber < numPages) setPageNumber(pageNumber + 1);
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pageNumber, numPages, isFullscreen, onClose]);

  if (!isOpen) return null;

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const fileExtension = getFileExtension(fileName);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Erreur de chargement du PDF:', error);
    toast.error('Erreur lors du chargement du document');
    setLoading(false);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
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
    const printWindow = window.open(fileUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleOpenNewTab = () => {
    window.open(fileUrl, '_blank');
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement && containerRef.current) {
      try {
        await containerRef.current.requestFullscreen();
      } catch (err) {
        console.error('Erreur fullscreen:', err);
        toast.error('Impossible de passer en plein écran');
      }
    } else {
      exitFullscreen();
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

  const getZoomPercentage = () => {
    return Math.round(scale * 100);
  };

  const renderPDFViewer = () => {
    return (
      <div className="flex h-full">
        {/* Sidebar with thumbnails */}
        {showThumbnails && (
          <div className="w-48 bg-[#3c3c3c] border-r border-gray-700 overflow-y-auto">
            <div className="p-2 space-y-2">
              {Array.from(new Array(numPages), (el, index) => (
                <div
                  key={`thumb_${index + 1}`}
                  onClick={() => setPageNumber(index + 1)}
                  className={`cursor-pointer p-1 rounded transition-all ${
                    pageNumber === index + 1
                      ? 'bg-blue-600 ring-2 ring-blue-400'
                      : 'bg-[#2c2c2c] hover:bg-[#404040]'
                  }`}
                >
                  <Document file={fileUrl} loading="">
                    <Page
                      pageNumber={index + 1}
                      width={160}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>
                  <div className="text-center text-xs text-gray-300 mt-1">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main content area */}
        <div className="flex-1 overflow-auto bg-[#525659]" ref={contentRef}>
          <div className="flex items-center justify-center min-h-full p-8">
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center p-8">
                  <div className="text-white text-lg">Chargement du document...</div>
                </div>
              }
              error={
                <div className="flex items-center justify-center p-8">
                  <div className="text-red-400 text-lg">Erreur lors du chargement du PDF</div>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                width={pageWidth > 0 ? pageWidth * scale : undefined}
                rotate={rotation}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <div className="text-white">Chargement de la page...</div>
                  </div>
                }
                className="shadow-2xl bg-white"
              />
            </Document>
          </div>
        </div>
      </div>
    );
  };

  const renderImageViewer = () => {
    return (
      <div className="flex-1 overflow-auto bg-[#525659]">
        <div className="flex items-center justify-center min-h-full p-4">
          <img
            src={fileUrl}
            alt={fileName}
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              maxWidth: '100%',
              height: 'auto',
              transition: 'transform 0.2s ease'
            }}
            className="shadow-2xl"
          />
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (fileExtension === 'pdf') {
      return renderPDFViewer();
    }

    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(fileExtension)) {
      return renderImageViewer();
    }

    // For other file types, use iframe
    return (
      <div className="flex-1 bg-[#525659]">
        <iframe
          src={fileUrl}
          className="w-full h-full border-0"
          title={fileName}
        />
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#323639]"
      ref={containerRef}
    >
      {/* Chrome-style toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#323639] border-b border-gray-700 flex-shrink-0">
        {/* Left side - File name and navigation */}
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-200 max-w-md truncate">
            {fileName}
          </div>
          
          {fileExtension === 'pdf' && (
            <>
              <div className="h-6 w-px bg-gray-600" />
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                  disabled={pageNumber <= 1}
                  className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={pageNumber}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= numPages) {
                        setPageNumber(page);
                      }
                    }}
                    className="w-12 h-7 px-2 text-center bg-[#2c2c2c] text-gray-200 border border-gray-600 rounded text-sm"
                    min={1}
                    max={numPages}
                  />
                  <span className="text-sm text-gray-400">/ {numPages}</span>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                  disabled={pageNumber >= numPages}
                  className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Right side - Controls */}
        <div className="flex items-center space-x-2">
          {/* Zoom controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
            title="Zoom arrière"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <div className="text-sm text-gray-300 min-w-[50px] text-center">
            {getZoomPercentage()}%
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
            title="Zoom avant"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-gray-600" />

          {/* Rotate */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRotate}
            className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
            title="Rotation"
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          {/* Thumbnails toggle (PDF only) */}
          {fileExtension === 'pdf' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowThumbnails(!showThumbnails)}
              className={`h-8 w-8 p-0 hover:bg-gray-700 ${
                showThumbnails ? 'text-blue-400' : 'text-gray-300 hover:text-white'
              }`}
              title="Miniatures"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}

          <div className="h-6 w-px bg-gray-600" />

          {/* Download */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
            title="Télécharger"
          >
            <Download className="h-4 w-4" />
          </Button>

          {/* Print */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
            title="Imprimer"
          >
            <Printer className="h-4 w-4" />
          </Button>

          {/* Open in new tab */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenNewTab}
            className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
            title="Nouvel onglet"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
            title="Plein écran"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>

          <div className="h-6 w-px bg-gray-600" />

          {/* Close */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
            title="Fermer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

export default ChromeStyleViewer;
