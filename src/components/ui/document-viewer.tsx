import React, { useState } from 'react';
import { X, Maximize2, Minimize2, ChevronLeft, ChevronRight, ExternalLink, Download, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from './button';
import AdvancedFileViewer from './viewers/AdvancedFileViewer';
import ImageViewer from './viewers/ImageViewer';
import TextViewer from './viewers/TextViewer';
import UnsupportedViewer from './viewers/UnsupportedViewer';

interface DocumentViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
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
  const [useAdvancedPDF, setUseAdvancedPDF] = useState(true);

  if (!isOpen) return null;

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const fileExtension = getFileExtension(fileName);

  // Pour les PDFs et fichiers Office, utiliser le visualiseur universel
  if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(fileExtension)) {
    return (
      <div className={`fixed inset-0 z-50 ${
        isPresentationMode || isFullscreen 
          ? 'bg-black w-screen h-screen' 
          : 'bg-black bg-opacity-95 flex items-center justify-center p-4'
      }`}>
        <div className={`${
          isPresentationMode || isFullscreen 
            ? 'w-screen h-screen' 
            : 'w-full h-full max-w-7xl max-h-[95vh] rounded-lg overflow-hidden bg-white'
        }`}>
          <AdvancedFileViewer 
            fileUrl={fileUrl} 
            fileName={fileName}
            isFullscreen={isFullscreen}
            isPresentationMode={isPresentationMode}
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            onTogglePresentationMode={() => setIsPresentationMode(!isPresentationMode)}
            onClose={onClose}
          />
        </div>
      </div>
    );
  }

  const renderDocumentContent = () => {
    console.log('Visualisation du fichier:', fileName, 'URL:', fileUrl, 'Extension:', fileExtension);

    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(fileExtension)) {
      return <ImageViewer fileUrl={fileUrl} fileName={fileName} />;
    }

    // Les fichiers Office sont maintenant gérés plus haut avec le UniversalFileViewer

    // Fichiers texte
    if (['txt', 'md', 'json', 'xml', 'csv', 'log'].includes(fileExtension)) {
      return <TextViewer fileUrl={fileUrl} fileName={fileName} />;
    }

    // Type de fichier non supporté
    return (
      <UnsupportedViewer 
        fileUrl={fileUrl} 
        fileName={fileName} 
        fileExtension={fileExtension}
      />
    );
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

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

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 25, 50));
  };

  const resetZoom = () => {
    setZoom(100);
  };

  const showHeader = !isFullscreen;

  return (
    <div 
      className={`fixed inset-0 z-50 ${
        isFullscreen 
          ? 'bg-black w-screen h-screen' 
          : 'bg-black bg-opacity-95 flex items-center justify-center p-4'
      }`}
    >
      <div 
        className={`${
          isFullscreen 
            ? 'w-screen h-screen bg-white' 
            : 'bg-white flex flex-col w-full h-full max-w-7xl max-h-[95vh] rounded-lg'
        }`}
        style={{
          contain: 'layout style paint',
          isolation: 'isolate'
        }}
      >
        {/* Header */}
        {showHeader && (
          <div className="flex flex-col border-b border-gray-200 bg-white rounded-t-lg flex-shrink-0">
            {/* Top bar - File info and close */}
            <div className="flex items-center justify-between p-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <h2 className="text-sm font-semibold text-gray-900 truncate max-w-md">
                  {fileName}
                </h2>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                  {fileExtension.toUpperCase()}
                </span>
              </div>
              
              <button 
                onClick={onClose} 
                className="inline-flex items-center justify-center h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Toolbar - Navigation and actions */}
            <div className="flex items-center justify-between p-2 bg-gray-50">
              {/* Navigation controls */}
              <div className="flex items-center space-x-2">
                {(['pdf', 'ppt', 'pptx'].includes(fileExtension)) && (
                  <>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={handlePrevPage}
                      disabled={currentPage <= 1}
                      className="h-8 px-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <span className="text-xs text-gray-600 px-2 min-w-[80px] text-center">
                      {['ppt', 'pptx'].includes(fileExtension) ? `Slide ${currentPage}` : `Page ${currentPage} / ${totalPages}`}
                    </span>
                    
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={handleNextPage}
                      disabled={currentPage >= totalPages}
                      className="h-8 px-2"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    
                    <div className="h-4 w-px bg-gray-300 mx-2" />
                  </>
                )}

                <span className="text-xs text-gray-500">
                  Visualiseur: {['pdf'].includes(fileExtension) ? 'PDF' : 
                              ['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx'].includes(fileExtension) ? 'Microsoft Office' :
                              ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(fileExtension) ? 'Image' : 'Document'}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-1">
                {/* Zoom controls for images and PDFs */}
                {(['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(fileExtension)) && (
                  <>
                    <button className="inline-flex items-center justify-center h-8 px-2 hover:bg-accent hover:text-accent-foreground rounded-md" onClick={handleZoomOut}>
                      <ZoomOut className="h-3 w-3" />
                    </button>
                    <span className="text-xs text-gray-600 px-1 min-w-[45px] text-center">
                      {zoom}%
                    </span>
                    <button className="inline-flex items-center justify-center h-8 px-2 hover:bg-accent hover:text-accent-foreground rounded-md" onClick={handleZoomIn}>
                      <ZoomIn className="h-3 w-3" />
                    </button>
                    <button className="inline-flex items-center justify-center h-8 px-2 hover:bg-accent hover:text-accent-foreground rounded-md" onClick={resetZoom}>
                      <RotateCcw className="h-3 w-3" />
                    </button>
                    <div className="h-4 w-px bg-gray-300 mx-1" />
                  </>
                )}

                {/* Fullscreen toggle */}
                <button className="inline-flex items-center justify-center h-8 px-2 hover:bg-accent hover:text-accent-foreground rounded-md" onClick={toggleFullscreen}>
                  {isFullscreen ? (
                    <Minimize2 className="h-3 w-3" />
                  ) : (
                    <Maximize2 className="h-3 w-3" />
                  )}
                </button>
                
                {/* External link */}
                <button className="inline-flex items-center justify-center h-8 px-2 hover:bg-accent hover:text-accent-foreground rounded-md" onClick={handleOpenInNewTab}>
                  <ExternalLink className="h-3 w-3" />
                </button>
                
                {/* Download */}
                <button className="inline-flex items-center justify-center h-8 px-2 hover:bg-accent hover:text-accent-foreground rounded-md" onClick={handleDownload}>
                  <Download className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contenu du document */}
        <div className={`${
          isFullscreen 
            ? 'absolute inset-0 w-full h-full' 
            : 'flex-1 overflow-hidden'
        }`}>
          {renderDocumentContent()}
        </div>

        {/* Bouton de fermeture flottant en plein écran */}
        {isFullscreen && (
          <div className="absolute top-4 right-4 z-20">
            <button 
              className="inline-flex items-center justify-center h-8 w-8 p-0 bg-white/90 hover:bg-white border border-gray-300 shadow-lg rounded-md"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;