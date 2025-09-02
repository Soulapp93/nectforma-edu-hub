
import React, { useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from './button';
import SimplePDFViewer from './viewers/SimplePDFViewer';
import ImageViewer from './viewers/ImageViewer';
import EnhancedOfficeViewer from './viewers/EnhancedOfficeViewer';
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

  if (!isOpen) return null;

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const fileExtension = getFileExtension(fileName);

  const renderDocumentContent = () => {
    console.log('Visualisation du fichier:', fileName, 'URL:', fileUrl, 'Extension:', fileExtension);

    // PDF - Utilisation du visualiseur PDF simple
    if (fileExtension === 'pdf') {
      return (
        <SimplePDFViewer 
          fileUrl={fileUrl} 
          fileName={fileName}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        />
      );
    }

    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(fileExtension)) {
      return <ImageViewer fileUrl={fileUrl} fileName={fileName} />;
    }

    // Fichiers Office
    if (['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx'].includes(fileExtension)) {
      return (
        <EnhancedOfficeViewer 
          fileUrl={fileUrl} 
          fileName={fileName} 
          fileExtension={fileExtension}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        />
      );
    }

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

  const showHeader = !isFullscreen || !['pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx'].includes(fileExtension);

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 ${
      isFullscreen ? 'p-0' : 'p-4'
    }`}>
      <div className={`bg-white rounded-lg flex flex-col ${
        isFullscreen 
          ? 'w-full h-full rounded-none' 
          : 'w-full h-full max-w-7xl max-h-[95vh]'
      }`}>
        {/* Header */}
        {showHeader && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white rounded-t-lg flex-shrink-0">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {fileName}
              </h2>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {fileExtension.toUpperCase()}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {!['pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx'].includes(fileExtension) && (
                <Button size="sm" variant="ghost" onClick={toggleFullscreen}>
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              )}
              
              <Button size="sm" variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Contenu du document */}
        <div className="flex-1 overflow-hidden">
          {renderDocumentContent()}
        </div>

        {/* Bouton de fermeture en plein écran pour PDF et Office */}
        {isFullscreen && ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx'].includes(fileExtension) && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70 z-10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;
