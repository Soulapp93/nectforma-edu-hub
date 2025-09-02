
import React, { useState } from 'react';
import { Button } from '../button';
import { Download, ExternalLink, AlertCircle, Eye } from 'lucide-react';

interface SimplePDFViewerProps {
  fileUrl: string;
  fileName: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const SimplePDFViewer: React.FC<SimplePDFViewerProps> = ({ 
  fileUrl, 
  fileName, 
  isFullscreen = false,
  onToggleFullscreen 
}) => {
  const [loadError, setLoadError] = useState(false);
  const [viewerMethod, setViewerMethod] = useState<'direct' | 'google' | 'mozilla'>('direct');

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
    // Utiliser Google Docs Viewer pour éviter les blocages
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=false`;
    window.open(googleViewerUrl, '_blank', 'noopener,noreferrer');
  };

  const handleIframeError = () => {
    console.log('Erreur de chargement de l\'iframe PDF avec méthode:', viewerMethod);
    if (viewerMethod === 'direct') {
      setViewerMethod('google');
    } else if (viewerMethod === 'google') {
      setViewerMethod('mozilla');
    } else {
      setLoadError(true);
    }
  };

  const tryDifferentViewer = () => {
    if (viewerMethod === 'direct') {
      setViewerMethod('google');
    } else if (viewerMethod === 'google') {
      setViewerMethod('mozilla');
    } else {
      setViewerMethod('direct');
    }
    setLoadError(false);
  };

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 mb-4 text-orange-500 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600 mb-4">Impossible de charger le document PDF</p>
          <p className="text-sm text-gray-500 mb-6">
            Le fichier est bloqué par les restrictions de sécurité du navigateur. 
            Utilisez les options ci-dessous pour visualiser le document.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={tryDifferentViewer} variant="default">
              <Eye className="h-4 w-4 mr-2" />
              Essayer un autre visualiseur
            </Button>
            <Button onClick={openInNewTab} variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir avec Google Docs
            </Button>
            <Button onClick={handleDownload} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Télécharger le fichier
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getViewerUrl = () => {
    switch (viewerMethod) {
      case 'google':
        return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
      case 'mozilla':
        return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(fileUrl)}`;
      default:
        return `${fileUrl}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`;
    }
  };

  const getViewerName = () => {
    switch (viewerMethod) {
      case 'google':
        return 'Google Docs Viewer';
      case 'mozilla':
        return 'Mozilla PDF.js';
      default:
        return 'Visualiseur natif';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Barre d'outils améliorée */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 font-medium">
            Visualisation PDF - {getViewerName()}
          </span>
          {viewerMethod !== 'direct' && (
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
              Mode compatible
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" onClick={tryDifferentViewer}>
            <Eye className="h-4 w-4 mr-1" />
            Changer de visualiseur
          </Button>
          
          <Button size="sm" variant="outline" onClick={openInNewTab}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Google Docs
          </Button>
          
          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Télécharger
          </Button>
        </div>
      </div>

      {/* Zone d'affichage PDF */}
      <div className="flex-1 relative bg-white">
        <iframe
          src={getViewerUrl()}
          className="w-full h-full border-0"
          title={fileName}
          onError={handleIframeError}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
          allow="fullscreen"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
};

export default SimplePDFViewer;
