
import React, { useState } from 'react';
import { Button } from '../button';
import { Download, ExternalLink, AlertCircle } from 'lucide-react';

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

  const handleIframeError = () => {
    console.log('Erreur de chargement de l\'iframe PDF');
    setLoadError(true);
  };

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 mb-4 text-orange-500 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600 mb-4">Impossible de charger le document PDF</p>
          <p className="text-sm text-gray-500 mb-6">
            Le fichier ne peut pas être affiché directement. Vous pouvez le télécharger pour l'ouvrir.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={openInNewTab} variant="default">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir dans un nouvel onglet
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

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Barre d'outils simple */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 font-medium">
            Visualisation PDF
          </span>
        </div>

        <div className="flex items-center space-x-2">
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

      {/* Zone d'affichage PDF */}
      <div className="flex-1 relative bg-white">
        <iframe
          src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`}
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

export default SimplePDFViewer;
