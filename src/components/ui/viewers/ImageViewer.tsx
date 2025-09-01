
import React, { useState } from 'react';
import { Download, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '../button';

interface ImageViewerProps {
  fileUrl: string;
  fileName: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ fileUrl, fileName }) => {
  const [imageError, setImageError] = useState(false);
  const [zoom, setZoom] = useState(1);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openInNewTab = () => {
    window.open(fileUrl, '_blank');
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.1));
  const handleResetZoom = () => setZoom(1);

  if (imageError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
        <AlertCircle className="h-16 w-16 mb-4 text-orange-500" />
        <h3 className="text-lg font-medium mb-2">Impossible de charger l'image</h3>
        <p className="text-sm text-center mb-6 max-w-md">
          Cette image ne peut pas être affichée directement. 
          Vous pouvez l'ouvrir dans un nouvel onglet ou la télécharger.
        </p>
        <div className="flex space-x-3">
          <Button onClick={openInNewTab} variant="default">
            <ExternalLink className="h-4 w-4 mr-2" />
            Ouvrir dans un nouvel onglet
          </Button>
          <Button onClick={handleDownload} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* Controls */}
      <div className="flex items-center justify-between p-3 bg-white border-b">
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" onClick={handleZoomOut}>
            -
          </Button>
          <span className="text-sm min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button size="sm" variant="outline" onClick={handleZoomIn}>
            +
          </Button>
          <Button size="sm" variant="outline" onClick={handleResetZoom}>
            Reset
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={openInNewTab}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Nouvel onglet
          </Button>
          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Télécharger
          </Button>
        </div>
      </div>

      {/* Image Container */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        <img
          src={fileUrl}
          alt={fileName}
          className="max-w-none transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
          onError={() => setImageError(true)}
          crossOrigin="anonymous"
        />
      </div>
    </div>
  );
};

export default ImageViewer;
