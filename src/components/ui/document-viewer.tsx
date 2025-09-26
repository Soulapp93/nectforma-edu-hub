import React, { useState } from 'react';
import { X, ExternalLink, Download } from 'lucide-react';
import SimplePDFViewer from './viewers/SimplePDFViewer';
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

  if (!isOpen) return null;

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const fileExtension = getFileExtension(fileName);

  // Pour les PDFs utiliser le visualiseur simple
  if (fileExtension === 'pdf') {
    return (
      <SimplePDFViewer 
        fileUrl={fileUrl} 
        fileName={fileName}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        onClose={onClose}
      />
    );
  }

  const renderDocumentContent = () => {
    console.log('Visualisation du fichier:', fileName, 'URL:', fileUrl, 'Extension:', fileExtension);

    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(fileExtension)) {
      return <ImageViewer fileUrl={fileUrl} fileName={fileName} />;
    }

    // Fichiers Office avec iframe simple
    if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(fileExtension)) {
      return (
        <div className="w-full h-full">
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
            className="w-full h-full border-0"
            title={fileName}
          />
        </div>
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

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4">
      <div className="bg-white flex flex-col w-full h-full max-w-6xl max-h-[90vh] rounded-lg overflow-hidden">
        {/* Header simple */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-medium text-gray-900 truncate max-w-md">
              {fileName}
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-blue-600">Visualisation PDF</span>
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm text-gray-600">Mode compatible</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleOpenInNewTab}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded"
            >
              Ouvrir dans une nouvelle fenêtre
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded"
            >
              Télécharger
            </button>
            <button 
              onClick={onClose} 
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-5 w-5" />
            </button>
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