import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink, RefreshCw, AlertCircle, Eye } from 'lucide-react';
import { Button } from '../button';
import { toast } from 'sonner';

interface UniversalFileViewerProps {
  fileUrl: string;
  fileName: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onClose?: () => void;
}

const UniversalFileViewer: React.FC<UniversalFileViewerProps> = ({
  fileUrl,
  fileName,
  isFullscreen = false,
  onToggleFullscreen,
  onClose
}) => {
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerMethod, setViewerMethod] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const fileExtension = getFileExtension(fileName);

  // Différentes méthodes de visualisation selon le type de fichier
  const getViewerOptions = () => {
    const encodedUrl = encodeURIComponent(fileUrl);
    
    if (fileExtension === 'pdf') {
      return [
        {
          name: 'Google Docs Viewer',
          url: `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`,
          description: 'Visualiseur Google'
        },
        {
          name: 'Mozilla PDF.js',
          url: `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodedUrl}`,
          description: 'Visualiseur PDF.js'
        },
        {
          name: 'Iframe Direct',
          url: fileUrl,
          description: 'Chargement direct'
        }
      ];
    }

    if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(fileExtension)) {
      return [
        {
          name: 'Office Online',
          url: `https://view.officeapps.live.com/op/view.aspx?src=${encodedUrl}`,
          description: 'Office Online Viewer'
        },
        {
          name: 'Google Docs Viewer',
          url: `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`,
          description: 'Visualiseur Google'
        }
      ];
    }

    // Pour les autres types de fichiers (images, etc.)
    return [
      {
        name: 'Direct View',
        url: fileUrl,
        description: 'Affichage direct'
      }
    ];
  };

  const viewerOptions = getViewerOptions();
  const currentViewer = viewerOptions[viewerMethod];

  const handleIframeLoad = () => {
    setIsLoading(false);
    setLoadError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setLoadError(true);
    console.error(`Erreur de chargement avec ${currentViewer.name}`);
  };

  const handleRetry = () => {
    if (viewerMethod < viewerOptions.length - 1) {
      setViewerMethod(viewerMethod + 1);
      setIsLoading(true);
      setLoadError(false);
      setRetryCount(retryCount + 1);
      toast.info(`Tentative avec ${viewerOptions[viewerMethod + 1].name}...`);
    } else {
      // Reset to first method
      setViewerMethod(0);
      setIsLoading(true);
      setLoadError(false);
      setRetryCount(retryCount + 1);
      toast.info('Nouvelle tentative...');
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Téléchargement démarré');
  };

  const openInNewTab = () => {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  const getFileTypeColor = () => {
    switch (fileExtension) {
      case 'pdf': return 'bg-red-100 text-red-700 border-red-200';
      case 'doc':
      case 'docx': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ppt':
      case 'pptx': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'xls':
      case 'xlsx': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getFileIcon = () => {
    switch (fileExtension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'ppt':
      case 'pptx': return '📊';
      case 'xls':
      case 'xlsx': return '📈';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return '🖼️';
      default: return '📎';
    }
  };

  // Reset viewer method when file changes
  useEffect(() => {
    setViewerMethod(0);
    setIsLoading(true);
    setLoadError(false);
    setRetryCount(0);
  }, [fileUrl]);

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getFileIcon()}</span>
          <div>
            <h3 className="font-medium text-gray-900 truncate max-w-md">{fileName}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`text-xs px-2 py-1 rounded border ${getFileTypeColor()}`}>
                {fileExtension.toUpperCase()}
              </span>
              <span className="text-xs text-gray-500">
                {currentViewer.description}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {loadError && viewerOptions.length > 1 && (
            <Button size="sm" variant="outline" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Réessayer
            </Button>
          )}
          
          <Button size="sm" variant="outline" onClick={openInNewTab}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Ouvrir
          </Button>
          
          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Télécharger
          </Button>
          
          {onToggleFullscreen && (
            <Button size="sm" variant="outline" onClick={onToggleFullscreen}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
          
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative bg-gray-100">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-gray-600">Chargement du document...</p>
            <p className="text-xs text-gray-500 mt-1">Méthode: {currentViewer.name}</p>
          </div>
        )}

        {loadError ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Impossible de charger le document
            </h3>
            <p className="text-gray-600 mb-4 max-w-md">
              Le document ne peut pas être affiché dans le navigateur. 
              Cela peut être dû aux paramètres de sécurité du fichier.
            </p>
            
            <div className="flex flex-col space-y-3">
              <div className="flex space-x-3">
                <Button onClick={handleDownload} variant="default">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le fichier
                </Button>
                <Button onClick={openInNewTab} variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir dans un nouvel onglet
                </Button>
              </div>
              
              {viewerOptions.length > 1 && (
                <Button onClick={handleRetry} variant="ghost">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Essayer une autre méthode ({viewerMethod + 1}/{viewerOptions.length})
                </Button>
              )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg max-w-md">
              <p className="text-sm text-blue-800">
                <strong>Conseil :</strong> Pour une meilleure expérience, 
                téléchargez le fichier et ouvrez-le avec l'application appropriée.
              </p>
            </div>
          </div>
        ) : (
          <iframe
            src={currentViewer.url}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            allow="fullscreen"
            title={fileName}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          />
        )}
      </div>
    </div>
  );
};

export default UniversalFileViewer;