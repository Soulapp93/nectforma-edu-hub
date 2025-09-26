import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, Download, ExternalLink, RefreshCw, AlertCircle, Maximize2, 
  Presentation, ChevronLeft, ChevronRight, RotateCw, RotateCcw,
  ZoomIn, ZoomOut, Home, Move, MousePointer, ScrollText,
  Settings, Columns, Rows, Square, Menu, ChevronsLeft, 
  ChevronsRight, Minus, Plus
} from 'lucide-react';
import { toast } from 'sonner';

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
  const [totalPages, setTotalPages] = useState(100);
  const [showControls, setShowControls] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'double' | 'scroll'>('single');
  const [tool, setTool] = useState<'select' | 'hand'>('select');
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);
  const [customPageInput, setCustomPageInput] = useState('');
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const fileExtension = getFileExtension(fileName);

  const getViewerOptions = useCallback(() => {
    const encodedUrl = encodeURIComponent(fileUrl);
    
    if (fileExtension === 'pdf') {
      return [
        {
          name: 'Google Docs Viewer',
          url: `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`,
          description: 'Visualiseur Google PDF'
        },
        {
          name: 'Mozilla PDF.js',
          url: `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodedUrl}`,
          description: 'Visualiseur PDF.js'
        },
        {
          name: 'Iframe Direct',
          url: fileUrl,
          description: 'Chargement direct PDF'
        }
      ];
    }

    if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(fileExtension)) {
      return [
        {
          name: 'Office Online',
          url: `https://view.officeapps.live.com/op/view.aspx?src=${encodedUrl}`,
          description: 'Microsoft Office Online'
        },
        {
          name: 'Google Docs Viewer',
          url: `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`,
          description: 'Visualiseur Google Docs'
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
  }, [fileUrl, fileExtension]);

  const viewerOptions = getViewerOptions();
  const currentViewer = viewerOptions[viewerMethod];

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setLoadError(false);
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setLoadError(true);
  }, []);

  const handleRetry = useCallback(() => {
    const nextMethod = (viewerMethod + 1) % viewerOptions.length;
    setViewerMethod(nextMethod);
    setIsLoading(true);
    setLoadError(false);
    toast.info(`Tentative avec ${viewerOptions[nextMethod].name}...`);
  }, [viewerMethod, viewerOptions]);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Téléchargement démarré');
  }, [fileUrl, fileName]);

  const openInNewTab = useCallback(() => {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
    toast.success('Ouvert dans un nouvel onglet');
  }, [fileUrl]);

  const getFileTypeInfo = useCallback(() => {
    switch (fileExtension) {
      case 'pdf': return { color: 'bg-red-500', icon: '📄', label: 'PDF' };
      case 'doc':
      case 'docx': return { color: 'bg-blue-500', icon: '📝', label: 'Word' };
      case 'ppt':
      case 'pptx': return { color: 'bg-orange-500', icon: '📊', label: 'PowerPoint' };
      case 'xls':
      case 'xlsx': return { color: 'bg-green-500', icon: '📈', label: 'Excel' };
      default: return { color: 'bg-gray-500', icon: '📎', label: 'Fichier' };
    }
  }, [fileExtension]);

  const fileInfo = getFileTypeInfo();

  // Navigation functions
  const goToFirstPage = useCallback(() => setCurrentPage(1), []);
  const goToLastPage = useCallback(() => setCurrentPage(totalPages), []);
  const goToPreviousPage = useCallback(() => setCurrentPage(Math.max(1, currentPage - 1)), [currentPage]);
  const goToNextPage = useCallback(() => setCurrentPage(Math.min(totalPages, currentPage + 1)), [currentPage, totalPages]);
  
  const goToCustomPage = useCallback(() => {
    const pageNum = parseInt(customPageInput);
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      setCustomPageInput('');
      toast.success(`Page ${pageNum} sélectionnée`);
    } else {
      toast.error(`Page invalide. Saisir un nombre entre 1 et ${totalPages}`);
    }
  }, [customPageInput, totalPages]);

  // Zoom functions
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(300, zoom + 25);
    setZoom(newZoom);
    toast.info(`Zoom: ${newZoom}%`);
  }, [zoom]);
  
  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(25, zoom - 25);
    setZoom(newZoom);
    toast.info(`Zoom: ${newZoom}%`);
  }, [zoom]);
  
  const resetZoom = useCallback(() => {
    setZoom(100);
    toast.info('Zoom réinitialisé à 100%');
  }, []);

  // Rotation functions
  const handleRotateClockwise = useCallback(() => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    toast.info(`Rotation: ${newRotation}°`);
  }, [rotation]);
  
  const handleRotateCounterClockwise = useCallback(() => {
    const newRotation = (rotation - 90 + 360) % 360;
    setRotation(newRotation);
    toast.info(`Rotation: ${newRotation}°`);
  }, [rotation]);

  // Auto-hide controls in presentation mode
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPresentationMode) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPresentationMode]);

  const handleMouseMove = useCallback(() => {
    if (isPresentationMode) {
      setShowControls(true);
      resetControlsTimeout();
    }
  }, [isPresentationMode, resetControlsTimeout]);

  // Effects
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
      setShowControls(true);
      resetControlsTimeout();
      document.addEventListener('mousemove', handleMouseMove);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
    } else {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }
  }, [isPresentationMode, handleMouseMove, resetControlsTimeout]);

  return (
    <div className={`h-full w-full flex ${isPresentationMode ? 'bg-black' : 'bg-white'}`}>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header Toolbar */}
        <div className={`flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0 transition-all duration-300 ${
          isPresentationMode && !showControls ? 'opacity-0 pointer-events-none -translate-y-full' : 'opacity-100 translate-y-0'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 ${fileInfo.color} rounded flex items-center justify-center text-white text-sm font-medium`}>
              {fileInfo.label.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm truncate max-w-md">{fileName}</h3>
              <p className="text-xs text-gray-500">{currentViewer.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={openInNewTab}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <ExternalLink className="h-3 w-3 mr-1 inline" />
              Nouvel onglet
            </button>
            
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Download className="h-3 w-3 mr-1 inline" />
              Télécharger
            </button>

            <button
              onClick={() => setShowOptionsPanel(!showOptionsPanel)}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Settings className="h-3 w-3 mr-1 inline" />
              Options
            </button>

            {onTogglePresentationMode && (
              <button
                onClick={onTogglePresentationMode}
                className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 border border-purple-600 rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                <Presentation className="h-3 w-3 mr-1 inline" />
                Présentation
              </button>
            )}
            
            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Maximize2 className="h-3 w-3 mr-1 inline" />
                Plein écran
              </button>
            )}
            
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Document Content */}
        <div className={`flex-1 relative ${isPresentationMode ? 'bg-black' : 'bg-gray-100'}`}>
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-95 z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-sm font-medium text-gray-900">Chargement du document...</p>
              <p className="text-xs text-gray-500 mt-1">Méthode: {currentViewer.name}</p>
            </div>
          )}

          {loadError ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-400 mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Impossible de charger le document
              </h3>
              <p className="text-gray-600 mb-6 max-w-md">
                Le document ne peut pas être affiché avec cette méthode. Essayez une autre option ou téléchargez le fichier.
              </p>
              
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Download className="h-4 w-4 mr-2 inline" />
                  Télécharger le fichier
                </button>
                <button
                  onClick={openInNewTab}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <ExternalLink className="h-4 w-4 mr-2 inline" />
                  Ouvrir dans un nouvel onglet
                </button>
                {viewerOptions.length > 1 && (
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <RefreshCw className="h-4 w-4 mr-2 inline" />
                    Essayer une autre méthode
                  </button>
                )}
              </div>
              
              {viewerOptions.length > 1 && (
                <div className="mt-4 text-xs text-gray-500">
                  Méthode actuelle: {currentViewer.name} ({viewerMethod + 1}/{viewerOptions.length})
                </div>
              )}
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

          {/* Floating Controls for Presentation Mode */}
          {isPresentationMode && showControls && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-sm rounded-xl px-6 py-3 flex items-center space-x-4 shadow-2xl">
              {fileExtension === 'pdf' && (
                <>
                  <button 
                    onClick={goToPreviousPage}
                    disabled={currentPage <= 1}
                    className="p-2 text-white hover:bg-white/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-white font-medium min-w-[80px] text-center">
                    Page {currentPage} / {totalPages}
                  </span>
                  <button 
                    onClick={goToNextPage}
                    disabled={currentPage >= totalPages}
                    className="p-2 text-white hover:bg-white/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="h-6 w-px bg-white/30" />
                </>
              )}
              <button 
                onClick={openInNewTab}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <ExternalLink className="h-5 w-5" />
              </button>
              <button 
                onClick={handleDownload}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <Download className="h-5 w-5" />
              </button>
              {onClose && (
                <button 
                  onClick={onClose}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Advanced Options Panel */}
      {showOptionsPanel && !isPresentationMode && (
        <div className="w-80 border-l border-gray-200 bg-white flex-shrink-0 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Panel Header */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Options du document</h3>
              <button 
                onClick={() => setShowOptionsPanel(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Actions de fichier */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 text-sm">Actions de fichier</h4>
              <div className="space-y-2">
                <button
                  onClick={openInNewTab}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir le fichier
                </button>
                {onTogglePresentationMode && (
                  <button
                    onClick={onTogglePresentationMode}
                    className="w-full flex items-center px-3 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <Presentation className="h-4 w-4 mr-2" />
                    Mode présentation
                  </button>
                )}
              </div>
            </div>

            {/* Navigation (PDF uniquement) */}
            {fileExtension === 'pdf' && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 text-sm">Navigation</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage <= 1}
                      className="p-2 text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-center flex-1 font-medium">
                      Page {currentPage}
                    </span>
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage >= totalPages}
                      className="p-2 text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={customPageInput}
                      onChange={(e) => setCustomPageInput(e.target.value)}
                      placeholder={`1-${totalPages}`}
                      min="1"
                      max={totalPages}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={goToCustomPage}
                      disabled={!customPageInput}
                      className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Aller
                    </button>
                  </div>
                  
                  <button
                    onClick={goToFirstPage}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <ChevronsLeft className="h-4 w-4 mr-2" />
                    Aller à la première page
                  </button>
                  <button
                    onClick={goToLastPage}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <ChevronsRight className="h-4 w-4 mr-2" />
                    Aller à la dernière page
                  </button>
                </div>
              </div>
            )}

            {/* Zoom */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 text-sm">Zoom</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleZoomOut}
                    disabled={zoom <= 25}
                    className="p-2 text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-center flex-1 font-medium">
                    {zoom}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    disabled={zoom >= 300}
                    className="p-2 text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={resetZoom}
                  className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Taille réelle (100%)
                </button>
              </div>
            </div>

            {/* Rotation */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 text-sm">Rotation</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleRotateCounterClockwise}
                  className="flex items-center justify-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Antihoraire
                </button>
                <button
                  onClick={handleRotateClockwise}
                  className="flex items-center justify-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <RotateCw className="h-4 w-4 mr-1" />
                  Horaire
                </button>
              </div>
              {rotation !== 0 && (
                <div className="text-xs text-center text-gray-500">
                  Rotation actuelle: {rotation}°
                </div>
              )}
            </div>

            {/* Outils */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 text-sm">Outils</h4>
              <div className="space-y-2">
                <button
                  onClick={() => setTool('select')}
                  className={`w-full flex items-center px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    tool === 'select'
                      ? 'text-white bg-blue-600 hover:bg-blue-700'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <MousePointer className="h-4 w-4 mr-2" />
                  Outil de sélection de texte
                </button>
                <button
                  onClick={() => setTool('hand')}
                  className={`w-full flex items-center px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    tool === 'hand'
                      ? 'text-white bg-blue-600 hover:bg-blue-700'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Move className="h-4 w-4 mr-2" />
                  Outil main
                </button>
              </div>
            </div>

            {/* Mode d'affichage (PDF uniquement) */}
            {fileExtension === 'pdf' && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 text-sm">Mode d'affichage</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => setViewMode('single')}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      viewMode === 'single'
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Page unique
                  </button>
                  <button
                    onClick={() => setViewMode('double')}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      viewMode === 'double'
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Columns className="h-4 w-4 mr-2" />
                    Double page
                  </button>
                  <button
                    onClick={() => setViewMode('scroll')}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      viewMode === 'scroll'
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Rows className="h-4 w-4 mr-2" />
                    Défilement vertical
                  </button>
                </div>
              </div>
            )}

            {/* Informations du document */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-700 text-sm">Informations</h4>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-medium">{fileInfo.label}</span>
                </div>
                <div className="flex justify-between">
                  <span>Visualiseur:</span>
                  <span className="font-medium">{currentViewer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Zoom:</span>
                  <span className="font-medium">{zoom}%</span>
                </div>
                {rotation !== 0 && (
                  <div className="flex justify-between">
                    <span>Rotation:</span>
                    <span className="font-medium">{rotation}°</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFileViewer;