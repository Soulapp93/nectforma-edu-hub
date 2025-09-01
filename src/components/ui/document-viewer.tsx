
import React, { useState } from 'react';
import { X, Maximize2, Minimize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

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
  const [currentSlide, setCurrentSlide] = useState(1);

  if (!isOpen) return null;

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const fileExtension = getFileExtension(fileName);

  const renderDocumentContent = () => {
    // PDF - Utilisation de l'iframe avec le visualiseur PDF du navigateur
    if (fileExtension === 'pdf') {
      return (
        <iframe
          src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`}
          className="w-full h-full border-0"
          title={fileName}
        />
      );
    }

    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(fileExtension)) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <img
            src={fileUrl}
            alt={fileName}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    }

    // PowerPoint, Word, Excel - Utilisation de Microsoft Office Online Viewer
    if (['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx'].includes(fileExtension)) {
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
      
      return (
        <div className="w-full h-full">
          <iframe
            src={officeViewerUrl}
            className="w-full h-full border-0"
            title={fileName}
            allow="fullscreen"
          />
        </div>
      );
    }

    // Fichiers texte
    if (['txt', 'md', 'json', 'xml', 'csv'].includes(fileExtension)) {
      return (
        <div className="p-4 h-full overflow-auto">
          <iframe
            src={fileUrl}
            className="w-full h-full border-0 bg-white"
            title={fileName}
          />
        </div>
      );
    }

    // Type de fichier non supporté pour la visualisation
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="text-6xl mb-4">📄</div>
        <h3 className="text-lg font-medium mb-2">Aperçu non disponible</h3>
        <p className="text-sm text-center mb-4">
          Ce type de fichier ({fileExtension.toUpperCase()}) ne peut pas être visualisé directement.
        </p>
        <Button onClick={() => window.open(fileUrl, '_blank')}>
          Télécharger le fichier
        </Button>
      </div>
    );
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 ${
      isFullscreen ? 'p-0' : 'p-4'
    }`}>
      <div className={`bg-white rounded-lg flex flex-col ${
        isFullscreen 
          ? 'w-full h-full rounded-none' 
          : 'w-full h-full max-w-6xl max-h-[90vh]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {fileName}
            </h2>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {fileExtension.toUpperCase()}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Contrôles pour PowerPoint */}
            {['ppt', 'pptx'].includes(fileExtension) && (
              <div className="flex items-center space-x-1 border-r pr-2 mr-2">
                <Button size="sm" variant="ghost" onClick={() => setCurrentSlide(Math.max(1, currentSlide - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-500 min-w-[60px] text-center">
                  Slide {currentSlide}
                </span>
                <Button size="sm" variant="ghost" onClick={() => setCurrentSlide(currentSlide + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <Button size="sm" variant="ghost" onClick={toggleFullscreen}>
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Contenu du document */}
        <div className="flex-1 overflow-hidden">
          {renderDocumentContent()}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
