
import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download, Maximize2, Minimize2, X } from 'lucide-react';
import { Button } from '../button';

// Configuration de PDF.js worker avec une version stable
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface EnhancedPDFViewerProps {
  fileUrl: string;
  fileName: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const EnhancedPDFViewer: React.FC<EnhancedPDFViewerProps> = ({ 
  fileUrl, 
  fileName, 
  isFullscreen = false,
  onToggleFullscreen 
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    console.log(`PDF chargé avec succès: ${numPages} pages`);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Erreur de chargement PDF:', error);
    setError('Impossible de charger le document PDF');
    setLoading(false);
  }, []);

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.3));
  };

  const resetZoom = () => {
    setScale(1.2);
  };

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value);
    if (page >= 1 && page <= numPages) {
      setPageNumber(page);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-6">
            Le fichier ne peut pas être affiché directement. Vous pouvez le télécharger pour l'ouvrir.
          </p>
          <Button onClick={handleDownload} variant="default">
            <Download className="h-4 w-4 mr-2" />
            Télécharger le fichier
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Barre d'outils - Style sombre comme dans la capture */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-3">
          {/* Navigation des pages */}
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="text-white hover:bg-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min={1}
              max={numPages}
              value={pageNumber}
              onChange={handlePageInputChange}
              className="w-12 text-center text-sm border border-gray-600 rounded px-2 py-1 bg-gray-700 text-white"
            />
            <span className="text-sm text-gray-300">/ {numPages}</span>
          </div>
          
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="text-white hover:bg-gray-700"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Contrôles de zoom et rotation */}
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={zoomOut}
            className="text-white hover:bg-gray-700"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-sm text-gray-300 min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={zoomIn}
            className="text-white hover:bg-gray-700"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={resetZoom}
            className="text-white hover:bg-gray-700 text-xs"
          >
            Automatique
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={rotate}
            className="text-white hover:bg-gray-700"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {onToggleFullscreen && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onToggleFullscreen}
              className="text-white hover:bg-gray-700"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}
          
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleDownload}
            className="text-white hover:bg-gray-700"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Zone d'affichage du PDF */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-4 bg-gray-900">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-lg text-white">Chargement du document...</div>
          </div>
        )}
        
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading=""
          error=""
          options={{
            cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
            cMapPacked: true,
            standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
            httpHeaders: {
              'Access-Control-Allow-Origin': '*',
            },
            withCredentials: false,
          }}
          className="flex justify-center"
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            rotate={rotation}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-2xl border border-gray-700"
            canvasBackground="white"
          />
        </Document>
      </div>
    </div>
  );
};

export default EnhancedPDFViewer;
