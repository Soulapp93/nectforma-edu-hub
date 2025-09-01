
import React, { useState, useEffect } from 'react';
import { Button } from '../button';
import { Download, ExternalLink, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';

interface EnhancedOfficeViewerProps {
  fileUrl: string;
  fileName: string;
  fileExtension: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const EnhancedOfficeViewer: React.FC<EnhancedOfficeViewerProps> = ({ 
  fileUrl, 
  fileName, 
  fileExtension,
  isFullscreen = false,
  onToggleFullscreen 
}) => {
  const [currentMethod, setCurrentMethod] = useState<'office365' | 'google' | 'error'>('office365');
  const [currentSlide, setCurrentSlide] = useState(1);

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

  const handleIframeError = () => {
    if (currentMethod === 'office365') {
      setCurrentMethod('google');
    } else {
      setCurrentMethod('error');
    }
  };

  useEffect(() => {
    // Reset au changement de fichier
    setCurrentMethod('office365');
    setCurrentSlide(1);
  }, [fileUrl]);

  const isPowerPoint = ['ppt', 'pptx'].includes(fileExtension);

  if (currentMethod === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50">
        <div className="text-center">
          <div className="text-blue-500 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Visualisation non disponible</h3>
          <p className="text-gray-600 mb-4">
            Ce fichier {fileExtension.toUpperCase()} ne peut pas être visualisé directement dans le navigateur.
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
      </div>
    );
  }

  // URLs des visualiseurs
  const office365Url = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}&wdAr=1.7777777777777777`;
  const googleUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;

  const viewerUrl = currentMethod === 'office365' ? office365Url : googleUrl;

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Barre d'outils */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-2">
          {isPowerPoint && (
            <div className="flex items-center space-x-2 border-r pr-4 mr-4">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setCurrentSlide(Math.max(1, currentSlide - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 min-w-[80px] text-center">
                Slide {currentSlide}
              </span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setCurrentSlide(currentSlide + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <span className="text-sm text-gray-600">
            Visualiseur: {currentMethod === 'office365' ? 'Microsoft Office' : 'Google Docs'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {onToggleFullscreen && (
            <Button size="sm" variant="outline" onClick={onToggleFullscreen}>
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}
          
          <Button size="sm" variant="outline" onClick={openInNewTab}>
            <ExternalLink className="h-4 w-4" />
          </Button>
          
          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Zone d'affichage */}
      <div className="flex-1 relative">
        <iframe
          src={viewerUrl}
          className="w-full h-full border-0"
          title={fileName}
          onError={handleIframeError}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          allow="fullscreen"
        />
      </div>
    </div>
  );
};

export default EnhancedOfficeViewer;
