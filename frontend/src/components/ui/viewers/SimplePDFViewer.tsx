import React, { useState, useEffect } from 'react';
import { 
  Download, Maximize2, Minimize2, X, ExternalLink, RefreshCw,
  AlertCircle, Loader2, BookOpen
} from 'lucide-react';
import { Button } from '../button';
import { Alert, AlertDescription } from '../alert';

interface SimplePDFViewerProps {
  fileUrl: string;
  fileName: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onClose?: () => void;
}

const SimplePDFViewer: React.FC<SimplePDFViewerProps> = ({
  fileUrl,
  fileName,
  isFullscreen = false,
  onToggleFullscreen,
  onClose
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);

  const maxRetries = 2;

  useEffect(() => {
    console.log('SimplePDFViewer - Loading PDF:', fileUrl);
    setLoading(true);
    setError('');
  }, [fileUrl, retryCount]);

  const handleIframeLoad = () => {
    console.log('PDF iframe loaded successfully');
    setLoading(false);
    setError('');
  };

  const handleIframeError = () => {
    console.error('PDF iframe loading error');
    setError('Impossible de charger le PDF');
    setLoading(false);
  };

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
    }
  };

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

  // Construire l'URL avec les paramètres appropriés
  const embedUrl = `${fileUrl}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`;

  return (
    <div 
      className={`${
        isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : 'w-full h-full bg-white'
      } flex flex-col`}
    >
      {/* Header/Toolbar */}
      <div className={`${
        isFullscreen 
          ? 'bg-gray-800 text-white border-gray-700' 
          : 'bg-white text-gray-900 border-gray-200'
      } border-b flex-shrink-0 p-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-5 w-5 text-red-500" />
            <h2 className="text-sm font-semibold truncate max-w-md">
              {fileName}
            </h2>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium">
              PDF
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            {error && (
              <Button size="sm" variant="ghost" onClick={handleRetry} className="h-8 px-2">
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
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
      </div>

      {/* Content Area */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-sm text-gray-600">Chargement du PDF...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <Alert className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <div className="mt-3 space-x-2">
                  {retryCount < maxRetries && (
                    <Button size="sm" onClick={handleRetry}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Réessayer
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={openInNewTab}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir dans un nouvel onglet
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <iframe
          src={embedUrl}
          className="w-full h-full border-0"
          title={fileName}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          style={{
            minHeight: '500px',
            background: 'white'
          }}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </div>
  );
};

export default SimplePDFViewer;