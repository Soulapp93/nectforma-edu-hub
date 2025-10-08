
import React, { useState, useEffect } from 'react';
import { Button } from '../button';
import { Download, ExternalLink, ChevronLeft, ChevronRight, Maximize2, Minimize2, AlertCircle } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openInNewTab = () => {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    console.log('Erreur iframe pour:', currentMethod);
    if (currentMethod === 'office365') {
      console.log('Tentative avec Google Docs Viewer');
      setCurrentMethod('google');
      setLoading(true);
    } else {
      console.log('Échec des deux méthodes');
      setCurrentMethod('error');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset au changement de fichier
    setCurrentMethod('office365');
    setCurrentSlide(1);
    setLoading(true);
  }, [fileUrl]);

  const isPowerPoint = ['ppt', 'pptx'].includes(fileExtension);

  if (currentMethod === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 mb-4 text-orange-500 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Visualisation non disponible</h3>
          <p className="text-gray-600 mb-4">
            Ce fichier {fileExtension.toUpperCase()} ne peut pas être visualisé directement dans le navigateur.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Cela peut être dû à des restrictions CORS ou à la configuration du serveur.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
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

  // URLs des visualiseurs avec gestion des erreurs CORS
  const office365Url = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}&wdAr=1.7777777777777777&wdEmbedCode=0`;
  const googleUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;

  const viewerUrl = currentMethod === 'office365' ? office365Url : googleUrl;

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Barre d'outils */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-4">
          {isPowerPoint && (
            <div className="flex items-center space-x-2 border-r pr-4">
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
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Visualiseur: {currentMethod === 'office365' ? 'Microsoft Office' : 'Google Docs'}
            </span>
            {loading && (
              <span className="text-xs text-blue-600">Chargement...</span>
            )}
          </div>
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
      <div className="flex-1 relative bg-white">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <div className="text-sm text-gray-600">Chargement du document...</div>
            </div>
          </div>
        )}
        
        <iframe
          src={viewerUrl}
          className="w-full h-full border-0"
          title={fileName}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          allow="fullscreen"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
};

export default EnhancedOfficeViewer;
