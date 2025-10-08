import React, { useState, useEffect } from 'react';
import { 
  Download, Maximize2, Minimize2, X, RefreshCw, ExternalLink,
  AlertCircle, FileText, Presentation, Table
} from 'lucide-react';
import { Button } from '../button';
import { Alert, AlertDescription } from '../alert';

interface ImprovedOfficeViewerProps {
  fileUrl: string;
  fileName: string;
  fileExtension: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onClose?: () => void;
}

const ImprovedOfficeViewer: React.FC<ImprovedOfficeViewerProps> = ({
  fileUrl,
  fileName,
  fileExtension,
  isFullscreen = false,
  onToggleFullscreen,
  onClose
}) => {
  const [loadError, setLoadError] = useState(false);
  const [viewerMethod, setViewerMethod] = useState<'office365' | 'google' | 'download'>('office365');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('ImprovedOfficeViewer - URL:', fileUrl, 'Extension:', fileExtension, 'Method:', viewerMethod);
    setIsLoading(true);
    setLoadError(false);
  }, [fileUrl, viewerMethod]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openInNewTab = () => {
    window.open(fileUrl, '_blank');
  };

  const handleRetry = () => {
    setLoadError(false);
    setIsLoading(true);
    
    // Cycle through different viewing methods
    if (viewerMethod === 'office365') {
      setViewerMethod('google');
    } else {
      setViewerMethod('office365');
    }
  };

  const handleIframeLoad = () => {
    console.log('Office file iframe loaded successfully');
    setIsLoading(false);
    setLoadError(false);
  };

  const handleIframeError = () => {
    console.error('Office file iframe failed to load');
    setIsLoading(false);
    setLoadError(true);
  };

  const getViewerUrl = () => {
    const encodedUrl = encodeURIComponent(fileUrl);
    
    switch (viewerMethod) {
      case 'google':
        return `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`;
      case 'office365':
      default:
        // Office Online viewer
        return `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
    }
  };

  const getViewerName = () => {
    switch (viewerMethod) {
      case 'google': return 'Google Docs';
      case 'office365': return 'Office Online';
      default: return 'Office Online';
    }
  };

  const getFileIcon = () => {
    switch (fileExtension) {
      case 'ppt':
      case 'pptx':
        return <Presentation className="h-4 w-4" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-4 w-4" />;
      case 'xls':
      case 'xlsx':
        return <Table className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getFileTypeColor = () => {
    switch (fileExtension) {
      case 'ppt':
      case 'pptx':
        return 'bg-orange-100 text-orange-700';
      case 'doc':
      case 'docx':
        return 'bg-blue-100 text-blue-700';
      case 'xls':
      case 'xlsx':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className={`${
      isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'w-full h-full'
    } flex flex-col`}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-sm font-medium text-gray-900 truncate max-w-md">
            {fileName}
          </h2>
          <span className={`text-xs px-2 py-1 rounded font-medium flex items-center space-x-1 ${getFileTypeColor()}`}>
            {getFileIcon()}
            <span>{fileExtension.toUpperCase()}</span>
          </span>
          <span className="text-xs text-gray-500">
            Visualiseur: {getViewerName()}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" onClick={handleRetry} className="h-8 px-2">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={openInNewTab} className="h-8 px-2">
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDownload} className="h-8 px-2">
            <Download className="h-4 w-4" />
          </Button>
          {onToggleFullscreen && (
            <Button size="sm" variant="ghost" onClick={onToggleFullscreen} className="h-8 px-2">
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          )}
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose} className="h-8 px-2">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {loadError ? (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center space-y-4 max-w-md">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Impossible de charger le fichier avec le visualiseur {getViewerName()}.
                  Cela peut être dû à des restrictions de sécurité du navigateur ou à des problèmes de compatibilité.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Button onClick={handleRetry} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Essayer un autre visualiseur
                </Button>
                
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={openInNewTab} className="flex-1">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir dans un nouvel onglet
                  </Button>
                  <Button variant="outline" onClick={handleDownload} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Chargement du fichier...</p>
                </div>
              </div>
            )}
            
            <iframe
              src={getViewerUrl()}
              className="w-full h-full border-0"
              title={fileName}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
              allow="fullscreen"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ImprovedOfficeViewer;