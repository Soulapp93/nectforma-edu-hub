
import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '../button';

// Configuration de PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

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
  const [scale, setScale] = useState<number>(1.0);
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
    setScale(1.0);
  };

  const rotate = () => {
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
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleDownload} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Télécharger le fichier
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Barre d'outils */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-2">
          {/* Navigation des pages */}
          <Button 
            size="sm" 
            variant="outline" 
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-2 px-3">
            <input
              type="number"
              min={1}
              max={numPages}
              value={pageNumber}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= numPages) {
                  setPageNumber(page);
                }
              }}
              className="w-12 text-center text-sm border rounded px-1"
            />
            <span className="text-sm text-gray-500">/ {numPages}</span>
          </div>
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Contrôles de zoom et rotation */}
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" onClick={zoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-sm min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <Button size="sm" variant="outline" onClick={zoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button size="sm" variant="outline" onClick={resetZoom}>
            Ajuster
          </Button>
          
          <Button size="sm" variant="outline" onClick={rotate}>
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {onToggleFullscreen && (
            <Button size="sm" variant="outline" onClick={onToggleFullscreen}>
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}
          
          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Zone d'affichage du PDF */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {loading && (
          <div className="flex items-center justify-center">
            <div className="text-lg text-gray-600">Chargement du document...</div>
          </div>
        )}
        
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading=""
          error=""
          options={{
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
            cMapPacked: true,
            standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/',
          }}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            rotate={rotation}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="shadow-lg"
          />
        </Document>
      </div>
    </div>
  );
};

export default EnhancedPDFViewer;
