
import React, { useState } from 'react';
import { X, Maximize2, Minimize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import PDFViewer from './viewers/PDFViewer';
import ImageViewer from './viewers/ImageViewer';
import OfficeViewer from './viewers/OfficeViewer';
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
  const [currentSlide, setCurrentSlide] = useState(1);

  if (!isOpen) return null;

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const fileExtension = getFileExtension(fileName);

  const renderDocumentContent = () => {
    console.log('Tentative de visualisation du fichier:', fileName, 'URL:', fileUrl);

    // PDF - Utilisation du visualiseur PDF natif
    if (fileExtension === 'pdf') {
      return <PDFViewer fileUrl={fileUrl} fileName={fileName} />;
    }

    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(fileExtension)) {
      return <ImageViewer fileUrl={fileUrl} fileName={fileName} />;
    }

    // Fichiers Office - PowerPoint, Word, Excel
    if (['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx'].includes(fileExtension)) {
      return (
        <OfficeViewer 
          fileUrl={fileUrl} 
          fileName={fileName} 
          fileExtension={fileExtension}
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

  const isPowerPoint = ['ppt', 'pptx'].includes(fileExtension);

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
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white rounded-t-lg flex-shrink-0">
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
            {isPowerPoint && (
              <div className="flex items-center space-x-1 border-r pr-2 mr-2">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setCurrentSlide(Math.max(1, currentSlide - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-500 min-w-[60px] text-center">
                  Slide {currentSlide}
                </span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setCurrentSlide(currentSlide + 1)}
                >
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
