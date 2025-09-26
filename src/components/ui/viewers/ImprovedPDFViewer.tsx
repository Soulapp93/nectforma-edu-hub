import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, 
  Download, Maximize2, Minimize2, X, RefreshCw, ExternalLink,
  AlertCircle
} from 'lucide-react';
import { Button } from '../button';
import { Alert, AlertDescription } from '../alert';

interface ImprovedPDFViewerProps {
  fileUrl: string;
  fileName: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onClose?: () => void;
}

const ImprovedPDFViewer: React.FC<ImprovedPDFViewerProps> = ({
  fileUrl,
  fileName,
  isFullscreen = false,
  onToggleFullscreen,
  onClose
}) => {
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [viewerMethod, setViewerMethod] = useState<'direct' | 'google' | 'mozilla' | 'download'>('direct');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('ImprovedPDFViewer - URL:', fileUrl, 'Method:', viewerMethod);
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
    setRetryCount(prev => prev + 1);
    setLoadError(false);
    setIsLoading(true);
    
    // Cycle through different viewing methods
    if (viewerMethod === 'direct') {
      setViewerMethod('google');
    } else if (viewerMethod === 'google') {
      setViewerMethod('mozilla');
    } else {
      setViewerMethod('direct');
    }
  };

  const handleIframeLoad = () => {
    console.log('PDF iframe loaded successfully');
    setIsLoading(false);
    setLoadError(false);
  };

  const handleIframeError = () => {
    console.error('PDF iframe failed to load');
    setIsLoading(false);
    setLoadError(true);
  };

  const getViewerUrl = () => {
    const encodedUrl = encodeURIComponent(fileUrl);
    
    switch (viewerMethod) {
      case 'google':
        return `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`;
      case 'mozilla':
        return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodedUrl}`;
      case 'direct':
      default:
        return fileUrl;
    }
  };

  const getViewerName = () => {
    switch (viewerMethod) {
      case 'google': return 'Google Docs';
      case 'mozilla': return 'PDF.js';
      case 'direct': return 'Direct';
      default: return 'Direct';
    }
  };

  return (
    <div 
      className={`${
        isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'w-full h-full'
      } flex flex-col`}
      style={{
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        imageRendering: 'auto',
        contain: 'layout style paint',
        isolation: 'isolate'
      }}
    >
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-sm font-medium text-gray-900 truncate max-w-md">
            {fileName}
          </h2>
          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium">
            PDF
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
                  Impossible de charger le PDF avec le visualiseur {getViewerName()}.
                  Cela peut être dû à des restrictions de sécurité du navigateur.
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
                  <p className="text-sm text-gray-600">Chargement du PDF...</p>
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
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                border: 'none',
                outline: 'none',
                background: 'white',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                imageRendering: 'auto',
                textRendering: 'optimizeLegibility',
                backfaceVisibility: 'hidden',
                transform: 'translateZ(0)',
                willChange: isFullscreen ? 'transform' : 'auto',
                isolation: 'isolate',
                contain: 'layout style paint'
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ImprovedPDFViewer;