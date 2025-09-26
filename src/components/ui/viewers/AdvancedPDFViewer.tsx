import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, 
  Download, Printer, Maximize2, Minimize2, X, 
  FileText, Grid3X3, ChevronUp, ChevronDown,
  RotateCcw, Move, MousePointer
} from 'lucide-react';
import { Button } from '../button';
import { Input } from '../input';
import { ScrollArea } from '../scroll-area';
import { Separator } from '../separator';

interface AdvancedPDFViewerProps {
  fileUrl: string;
  fileName: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onClose?: () => void;
}

const AdvancedPDFViewer: React.FC<AdvancedPDFViewerProps> = ({
  fileUrl,
  fileName,
  isFullscreen = false,
  onToggleFullscreen,
  onClose
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [pageInput, setPageInput] = useState('1');
  const [fitMode, setFitMode] = useState('width'); // 'width', 'height', 'page'
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePageInputChange = (value: string) => {
    setPageInput(value);
  };

  const handlePageInputSubmit = () => {
    const pageNum = parseInt(pageInput);
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 500));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleZoomFit = (mode: string) => {
    setFitMode(mode);
    if (mode === 'width') setZoom(100);
    if (mode === 'height') setZoom(85);
    if (mode === 'page') setZoom(75);
  };

  const handleRotate = (direction: 'cw' | 'ccw') => {
    setRotation(prev => {
      const newRotation = direction === 'cw' ? prev + 90 : prev - 90;
      return newRotation >= 360 ? 0 : newRotation < 0 ? 270 : newRotation;
    });
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    } else {
      window.open(fileUrl, '_blank');
    }
  };

  return (
    <div className={`${
      isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'w-full h-full'
    } flex flex-col`}>
      
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h2 className="text-sm font-medium text-gray-900 truncate max-w-md">
            {fileName}
          </h2>
          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium">
            PDF
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
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

      {/* Main Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
        {/* Left side - Navigation */}
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="h-8 px-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-1">
            <Input
              type="text"
              value={pageInput}
              onChange={(e) => handlePageInputChange(e.target.value)}
              onBlur={handlePageInputSubmit}
              onKeyPress={(e) => e.key === 'Enter' && handlePageInputSubmit()}
              className="w-12 h-8 text-xs text-center"
            />
            <span className="text-xs text-gray-500">/ {totalPages}</span>
          </div>
          
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="h-8 px-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Center - Zoom controls */}
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" onClick={handleZoomOut} className="h-8 px-2">
            <ZoomOut className="h-3 w-3" />
          </Button>
          
          <div className="flex items-center space-x-1">
            <Input
              type="text"
              value={`${zoom}%`}
              readOnly
              className="w-16 h-8 text-xs text-center"
            />
          </div>
          
          <Button size="sm" variant="ghost" onClick={handleZoomIn} className="h-8 px-2">
            <ZoomIn className="h-3 w-3" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button 
            size="sm" 
            variant={fitMode === 'width' ? 'secondary' : 'ghost'} 
            onClick={() => handleZoomFit('width')} 
            className="h-8 px-2 text-xs"
          >
            Largeur
          </Button>
          
          <Button 
            size="sm" 
            variant={fitMode === 'height' ? 'secondary' : 'ghost'} 
            onClick={() => handleZoomFit('height')} 
            className="h-8 px-2 text-xs"
          >
            Hauteur
          </Button>
          
          <Button 
            size="sm" 
            variant={fitMode === 'page' ? 'secondary' : 'ghost'} 
            onClick={() => handleZoomFit('page')} 
            className="h-8 px-2 text-xs"
          >
            Page
          </Button>
        </div>

        {/* Right side - Tools */}
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" onClick={() => handleRotate('ccw')} className="h-8 px-2">
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button size="sm" variant="ghost" onClick={() => handleRotate('cw')} className="h-8 px-2">
            <RotateCw className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button size="sm" variant="ghost" onClick={handlePrint} className="h-8 px-2">
            <Printer className="h-4 w-4" />
          </Button>
          
          <Button 
            size="sm" 
            variant={showThumbnails ? 'secondary' : 'ghost'} 
            onClick={() => setShowThumbnails(!showThumbnails)} 
            className="h-8 px-2"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Thumbnails */}
        {showThumbnails && (
          <div className="w-48 bg-gray-50 border-r border-gray-200 flex flex-col">
            <div className="p-2 border-b border-gray-200">
              <h3 className="text-xs font-medium text-gray-700">Pages</h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {Array.from({ length: Math.max(totalPages, 10) }, (_, i) => (
                  <div
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`relative cursor-pointer rounded border-2 transition-colors ${
                      currentPage === i + 1 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="aspect-[3/4] bg-white rounded flex items-center justify-center">
                      <div className="text-xs text-gray-400">
                        <FileText className="h-8 w-8" />
                      </div>
                    </div>
                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                      {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Main Viewer */}
        <div className="flex-1 bg-gray-100 relative overflow-hidden">
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ 
              transform: `scale(${zoom/100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
          >
            <iframe
              ref={iframeRef}
              src={fileUrl}
              className="w-full h-full border-0 bg-white shadow-lg"
              title={fileName}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
              allow="fullscreen"
              onLoad={() => {
                console.log('PDF chargé:', fileName);
                // Pour l'instant, on simule 10 pages - dans un vrai système, 
                // on utiliserait une bibliothèque comme PDF.js pour détecter le nombre de pages
                setTotalPages(10);
              }}
              onError={(e) => {
                console.error('Erreur de chargement du PDF:', e);
              }}
            />
          </div>
        </div>

        {/* Right Sidebar - Options */}
        {showRightPanel && (
          <div className="w-64 bg-gray-50 border-l border-gray-200 flex flex-col">
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">Options d'affichage</h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-4">
                <div>
                  <h4 className="text-xs font-medium text-gray-600 mb-2">Navigation</h4>
                  <div className="space-y-1">
                    <Button size="sm" variant="ghost" className="w-full justify-start h-8">
                      <ChevronUp className="h-3 w-3 mr-2" />
                      Première page
                    </Button>
                    <Button size="sm" variant="ghost" className="w-full justify-start h-8">
                      <ChevronDown className="h-3 w-3 mr-2" />
                      Dernière page
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-xs font-medium text-gray-600 mb-2">Outils</h4>
                  <div className="space-y-1">
                    <Button size="sm" variant="ghost" className="w-full justify-start h-8">
                      <MousePointer className="h-3 w-3 mr-2" />
                      Sélection
                    </Button>
                    <Button size="sm" variant="ghost" className="w-full justify-start h-8">
                      <Move className="h-3 w-3 mr-2" />
                      Déplacement
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedPDFViewer;