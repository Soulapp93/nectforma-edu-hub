import React, { useState, useEffect } from 'react';
import { 
  X, Download, ExternalLink, RefreshCw, AlertCircle, Eye, Maximize2, 
  Presentation, ChevronLeft, ChevronRight, RotateCw, RotateCcw,
  ZoomIn, ZoomOut, Home, Move, MousePointer, ScrollText,
  Settings, Columns, Rows, Square
} from 'lucide-react';
import { Button } from '../button';
import { toast } from 'sonner';
import { Separator } from '../separator';
import { Badge } from '../badge';

interface AdvancedFileViewerProps {
  fileUrl: string;
  fileName: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onClose?: () => void;
  isPresentationMode?: boolean;
  onTogglePresentationMode?: () => void;
}

const AdvancedFileViewer: React.FC<AdvancedFileViewerProps> = ({
  fileUrl,
  fileName,
  isFullscreen = false,
  onToggleFullscreen,
  onClose,
  isPresentationMode = false,
  onTogglePresentationMode
}) => {
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerMethod, setViewerMethod] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'double' | 'scroll'>('single');
  const [tool, setTool] = useState<'select' | 'hand'>('select');
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const fileExtension = getFileExtension(fileName);

  const getViewerOptions = () => {
    const encodedUrl = encodeURIComponent(fileUrl);
    
    if (fileExtension === 'pdf') {
      return [
        {
          name: 'Google Docs Viewer',
          url: `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`,
          description: 'Visualiseur Google'
        },
        {
          name: 'Mozilla PDF.js',
          url: `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodedUrl}`,
          description: 'Visualiseur PDF.js'
        },
        {
          name: 'Iframe Direct',
          url: fileUrl,
          description: 'Chargement direct'
        }
      ];
    }

    if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(fileExtension)) {
      return [
        {
          name: 'Office Online',
          url: `https://view.officeapps.live.com/op/view.aspx?src=${encodedUrl}`,
          description: 'Office Online Viewer'
        },
        {
          name: 'Google Docs Viewer',
          url: `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`,
          description: 'Visualiseur Google'
        }
      ];
    }

    return [
      {
        name: 'Direct View',
        url: fileUrl,
        description: 'Affichage direct'
      }
    ];
  };

  const viewerOptions = getViewerOptions();
  const currentViewer = viewerOptions[viewerMethod];

  const handleIframeLoad = () => {
    setIsLoading(false);
    setLoadError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setLoadError(true);
  };

  const handleRetry = () => {
    if (viewerMethod < viewerOptions.length - 1) {
      setViewerMethod(viewerMethod + 1);
    } else {
      setViewerMethod(0);
    }
    setIsLoading(true);
    setLoadError(false);
    toast.info(`Tentative avec ${viewerOptions[viewerMethod + 1]?.name || viewerOptions[0]?.name}...`);
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
    toast.success('Téléchargement démarré');
  };

  const openInNewTab = () => {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  const getFileTypeColor = () => {
    switch (fileExtension) {
      case 'pdf': return 'bg-red-100 text-red-700 border-red-200';
      case 'doc':
      case 'docx': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ppt':
      case 'pptx': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'xls':
      case 'xlsx': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getFileIcon = () => {
    switch (fileExtension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'ppt':
      case 'pptx': return '📊';
      case 'xls':
      case 'xlsx': return '📈';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return '🖼️';
      default: return '📎';
    }
  };

  const handleZoomIn = () => setZoom(Math.min(300, zoom + 25));
  const handleZoomOut = () => setZoom(Math.max(25, zoom - 25));
  const handleRotateClockwise = () => setRotation((rotation + 90) % 360);
  const handleRotateCounterClockwise = () => setRotation((rotation - 90 + 360) % 360);

  useEffect(() => {
    setViewerMethod(0);
    setIsLoading(true);
    setLoadError(false);
    setCurrentPage(1);
    setZoom(100);
    setRotation(0);
  }, [fileUrl]);

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

  return (
    <div className={`h-full w-full flex ${isPresentationMode ? 'bg-black' : 'bg-white'}`}>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0 transition-opacity duration-300 ${
          isPresentationMode && !showControls ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getFileIcon()}</span>
            <div>
              <h3 className="font-medium text-gray-900 truncate max-w-md">{fileName}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getFileTypeColor()}>
                  {fileExtension.toUpperCase()}
                </Badge>
                <span className="text-xs text-gray-500">
                  {currentViewer.description}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Quick actions */}
            <Button size="sm" variant="outline" onClick={openInNewTab}>
              <ExternalLink className="h-4 w-4 mr-1" />
              Nouvel onglet
            </Button>
            
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Télécharger
            </Button>

            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowOptionsPanel(!showOptionsPanel)}
            >
              <Settings className="h-4 w-4 mr-1" />
              Options
            </Button>

            {onTogglePresentationMode && (
              <Button size="sm" variant="outline" onClick={onTogglePresentationMode}>
                <Presentation className="h-4 w-4 mr-1" />
                Présentation
              </Button>
            )}
            
            {onToggleFullscreen && (
              <Button size="sm" variant="outline" onClick={onToggleFullscreen}>
                <Maximize2 className="h-4 w-4 mr-1" />
                Plein écran
              </Button>
            )}
            
            {onClose && (
              <Button size="sm" variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 relative ${isPresentationMode ? 'bg-black' : 'bg-gray-100'}`}>
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-sm text-gray-600">Chargement du document...</p>
              <p className="text-xs text-gray-500 mt-1">Méthode: {currentViewer.name}</p>
            </div>
          )}

          {loadError ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Impossible de charger le document
              </h3>
              <p className="text-gray-600 mb-4 max-w-md">
                Le document ne peut pas être affiché dans le navigateur.
              </p>
              
              <div className="flex space-x-3">
                <Button onClick={handleDownload} variant="default">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le fichier
                </Button>
                <Button onClick={openInNewTab} variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir dans un nouvel onglet
                </Button>
                {viewerOptions.length > 1 && (
                  <Button onClick={handleRetry} variant="ghost">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réessayer
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <iframe
              src={currentViewer.url}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              allow="fullscreen"
              title={fileName}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
              style={{ 
                transform: `rotate(${rotation}deg) scale(${zoom / 100})`,
                transformOrigin: 'center center'
              }}
            />
          )}

          {/* Floating controls for presentation mode */}
          {isPresentationMode && showControls && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 rounded-full px-4 py-2 flex items-center space-x-2 backdrop-blur-sm">
              {fileExtension === 'pdf' && (
                <>
                  <button 
                    className="inline-flex items-center justify-center h-8 px-2 text-white hover:bg-white/20 rounded"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-white text-sm px-2">Page {currentPage}</span>
                  <button 
                    className="inline-flex items-center justify-center h-8 px-2 text-white hover:bg-white/20 rounded"
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="h-4 w-px bg-white/30 mx-2" />
                </>
              )}
              <button 
                className="inline-flex items-center justify-center h-8 px-2 text-white hover:bg-white/20 rounded"
                onClick={openInNewTab}
              >
                <ExternalLink className="h-4 w-4" />
              </button>
              <button 
                className="inline-flex items-center justify-center h-8 px-2 text-white hover:bg-white/20 rounded"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </button>
              {onClose && (
                <button 
                  className="inline-flex items-center justify-center h-8 px-2 text-white hover:bg-white/20 rounded"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Options Panel */}
      {showOptionsPanel && !isPresentationMode && (
        <div className="w-80 border-l border-gray-200 bg-white flex-shrink-0 p-4 overflow-y-auto">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Options du document</h3>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowOptionsPanel(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Separator />

            {/* File Actions */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Actions du fichier</h4>
              <div className="space-y-2">
                <Button size="sm" variant="outline" onClick={openInNewTab} className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir le fichier
                </Button>
                {onTogglePresentationMode && (
                  <Button size="sm" variant="outline" onClick={onTogglePresentationMode} className="w-full justify-start">
                    <Presentation className="h-4 w-4 mr-2" />
                    Mode présentation
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Navigation (PDF only) */}
            {fileExtension === 'pdf' && (
              <>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Navigation</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm flex-1 text-center">Page {currentPage}</span>
                      <Button size="sm" variant="outline" onClick={() => setCurrentPage(currentPage + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setCurrentPage(1)} className="w-full justify-start">
                      <Home className="h-4 w-4 mr-2" />
                      Aller à la première page
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setCurrentPage(totalPages)} className="w-full justify-start">
                      <ScrollText className="h-4 w-4 mr-2" />
                      Aller à la dernière page
                    </Button>
                  </div>
                </div>

                <Separator />
              </>
            )}

            {/* Zoom Controls */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Zoom</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm flex-1 text-center">{zoom}%</span>
                  <Button size="sm" variant="outline" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
                <Button size="sm" variant="outline" onClick={() => setZoom(100)} className="w-full">
                  Taille réelle
                </Button>
              </div>
            </div>

            <Separator />

            {/* Rotation */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Rotation</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={handleRotateCounterClockwise}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Antihoraire
                </Button>
                <Button size="sm" variant="outline" onClick={handleRotateClockwise}>
                  <RotateCw className="h-4 w-4 mr-1" />
                  Horaire
                </Button>
              </div>
            </div>

            <Separator />

            {/* Tools */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Outils</h4>
              <div className="space-y-2">
                <Button 
                  size="sm" 
                  variant={tool === 'select' ? 'default' : 'outline'} 
                  onClick={() => setTool('select')}
                  className="w-full justify-start"
                >
                  <MousePointer className="h-4 w-4 mr-2" />
                  Outil de sélection de texte
                </Button>
                <Button 
                  size="sm" 
                  variant={tool === 'hand' ? 'default' : 'outline'} 
                  onClick={() => setTool('hand')}
                  className="w-full justify-start"
                >
                  <Move className="h-4 w-4 mr-2" />
                  Outil main
                </Button>
              </div>
            </div>

            <Separator />

            {/* View Mode (PDF only) */}
            {fileExtension === 'pdf' && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Mode d'affichage</h4>
                <div className="space-y-2">
                  <Button 
                    size="sm" 
                    variant={viewMode === 'single' ? 'default' : 'outline'} 
                    onClick={() => setViewMode('single')}
                    className="w-full justify-start"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Page unique
                  </Button>
                  <Button 
                    size="sm" 
                    variant={viewMode === 'double' ? 'default' : 'outline'} 
                    onClick={() => setViewMode('double')}
                    className="w-full justify-start"
                  >
                    <Columns className="h-4 w-4 mr-2" />
                    Double page
                  </Button>
                  <Button 
                    size="sm" 
                    variant={viewMode === 'scroll' ? 'default' : 'outline'} 
                    onClick={() => setViewMode('scroll')}
                    className="w-full justify-start"
                  >
                    <Rows className="h-4 w-4 mr-2" />
                    Défilement vertical
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFileViewer;