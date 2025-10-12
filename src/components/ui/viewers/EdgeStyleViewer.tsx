import React, { useState, useEffect, useRef } from 'react';
import { X, Download, ZoomIn, ZoomOut, Printer, RotateCw, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as pdfjsLib from 'pdfjs-dist';

// Configuration du worker PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface EdgeStyleViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

const EdgeStyleViewer: React.FC<EdgeStyleViewerProps> = ({
  fileUrl,
  fileName,
  isOpen,
  onClose
}) => {
  const [pdf, setPdf] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isPDF = fileName.toLowerCase().endsWith('.pdf');

  useEffect(() => {
    if (isOpen && isPDF) {
      loadPDF();
    }
  }, [isOpen, fileUrl, isPDF]);

  useEffect(() => {
    if (pdf && currentPage) {
      renderPage(currentPage);
    }
  }, [pdf, currentPage, zoom, rotation]);

  const loadPDF = async () => {
    try {
      setLoading(true);
      const loadingTask = pdfjsLib.getDocument(fileUrl);
      const pdfDoc = await loadingTask.promise;
      setPdf(pdfDoc);
      setTotalPages(pdfDoc.numPages);
      await generateThumbnails(pdfDoc);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement du PDF:', error);
      setLoading(false);
    }
  };

  const generateThumbnails = async (pdfDoc: any) => {
    const thumbs: string[] = [];
    for (let i = 1; i <= Math.min(pdfDoc.numPages, 50); i++) {
      try {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.2 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;
          thumbs.push(canvas.toDataURL());
        }
      } catch (error) {
        console.error(`Erreur génération vignette page ${i}:`, error);
      }
    }
    setThumbnails(thumbs);
  };

  const renderPage = async (pageNum: number) => {
    if (!pdf || !canvasRef.current) return;

    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: zoom, rotation });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
      }
    } catch (error) {
      console.error('Erreur lors du rendu de la page:', error);
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
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Erreur plein écran:', error);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  if (!isOpen) return null;

  if (!isPDF) {
    return (
      <div ref={containerRef} className="fixed inset-0 z-[9999] bg-background flex flex-col">
        <div className="bg-muted border-b border-border px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium">{fileName}</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-muted/30">
          <iframe
            src={fileUrl}
            className="w-full h-full border-0"
            title={fileName}
          />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="fixed inset-0 z-[9999] bg-[#323639] flex flex-col">
      {/* Barre d'outils supérieure */}
      <div className="bg-[#323639] border-b border-[#464646] px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-white">{fileName}</span>
          <div className="flex items-center gap-1 bg-[#464646] rounded px-2 py-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="h-7 px-2 text-white hover:bg-[#5a5a5a]"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-white px-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="h-7 px-2 text-white hover:bg-[#5a5a5a]"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="text-white hover:bg-[#464646]"
            title="Zoom arrière"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-white min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="text-white hover:bg-[#464646]"
            title="Zoom avant"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-[#464646] mx-2" />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRotate}
            className="text-white hover:bg-[#464646]"
            title="Rotation"
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            className="text-white hover:bg-[#464646]"
            title="Imprimer"
          >
            <Printer className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-white hover:bg-[#464646]"
            title="Télécharger"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-white hover:bg-[#464646]"
            title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          <div className="w-px h-6 bg-[#464646] mx-2" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-[#464646]"
            title="Fermer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Zone principale avec sidebar et contenu */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar avec table des matières */}
        {showThumbnails && (
          <div className="w-64 bg-[#252525] border-r border-[#464646] flex flex-col">
            <div className="px-4 py-3 border-b border-[#464646]">
              <h3 className="text-sm font-medium text-white">Table des matières</h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {thumbnails.map((thumb, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`w-full p-2 rounded transition-colors ${
                      currentPage === index + 1
                        ? 'bg-[#0078d4] ring-2 ring-[#0078d4]'
                        : 'bg-[#323639] hover:bg-[#464646]'
                    }`}
                  >
                    <img
                      src={thumb}
                      alt={`Page ${index + 1}`}
                      className="w-full h-auto rounded"
                    />
                    <div className="text-xs text-white text-center mt-1">
                      {index + 1}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Zone de visualisation du document */}
        <div className="flex-1 overflow-auto bg-[#525252] flex items-center justify-center p-8">
          {loading ? (
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <div>Chargement du document...</div>
            </div>
          ) : (
            <div className="bg-white shadow-2xl">
              <canvas ref={canvasRef} className="max-w-full h-auto" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EdgeStyleViewer;
