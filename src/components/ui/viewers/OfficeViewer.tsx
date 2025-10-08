
import React, { useState, useEffect } from 'react';
import { Button } from '../button';
import { AlertCircle, Download, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface OfficeViewerProps {
  fileUrl: string;
  fileName: string;
  fileExtension: string;
}

const OfficeViewer: React.FC<OfficeViewerProps> = ({ fileUrl, fileName, fileExtension }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [viewerType, setViewerType] = useState<'microsoft' | 'google' | 'direct'>('microsoft');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [fileUrl, viewerType]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Téléchargement démarré');
  };

  const openInNewTab = () => {
    window.open(fileUrl, '_blank');
    toast.info('Ouverture dans un nouvel onglet');
  };

  const handleIframeLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError(true);
    
    // Try fallback viewers
    if (viewerType === 'microsoft' && retryCount < 1) {
      setRetryCount(prev => prev + 1);
      setViewerType('google');
      toast.error('Erreur avec Microsoft Viewer, essai avec Google Viewer...');
    } else if (viewerType === 'google' && retryCount < 2) {
      setRetryCount(prev => prev + 1);
      setViewerType('direct');
      toast.error('Erreur avec Google Viewer, tentative directe...');
    } else {
      toast.error('Impossible de charger le document');
    }
  };

  const retry = () => {
    setRetryCount(0);
    setViewerType('microsoft');
    setLoading(true);
    setError(false);
  };

  const getViewerUrl = () => {
    if (viewerType === 'microsoft') {
      // Microsoft Office Online Viewer - works best for Office files
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
    } else if (viewerType === 'google') {
      // Google Docs Viewer - fallback option
      return `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    } else {
      // Direct access
      return fileUrl;
    }
  };

  // Show error state with options
  if (error && retryCount >= 2) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#525659] text-white p-8">
        <AlertCircle className="h-16 w-16 mb-4 text-orange-400" />
        <h3 className="text-xl font-medium mb-2">Visualisation non disponible</h3>
        <p className="text-sm text-center mb-6 max-w-md text-gray-300">
          Ce fichier {fileExtension.toUpperCase()} ne peut pas être visualisé directement dans le navigateur.
          Vous pouvez l'ouvrir dans un nouvel onglet ou le télécharger.
        </p>
        <div className="flex space-x-3 mb-4">
          <Button onClick={openInNewTab} variant="default" className="bg-blue-600 hover:bg-blue-700">
            <ExternalLink className="h-4 w-4 mr-2" />
            Ouvrir dans un nouvel onglet
          </Button>
          <Button onClick={handleDownload} variant="outline" className="border-gray-500 text-white hover:bg-gray-700">
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
        </div>
        <Button onClick={retry} variant="ghost" className="text-gray-400 hover:text-white">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  const viewerUrl = getViewerUrl();

  return (
    <div className="w-full h-full relative bg-[#525659]">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#525659] z-10">
          <Loader2 className="w-12 h-12 animate-spin text-white mb-4" />
          <div className="text-white text-lg">Chargement du document...</div>
          <div className="text-gray-400 text-sm mt-2">
            {viewerType === 'microsoft' && 'Microsoft Office Viewer'}
            {viewerType === 'google' && 'Google Docs Viewer'}
            {viewerType === 'direct' && 'Visualisation directe'}
          </div>
        </div>
      )}
      
      <iframe
        src={viewerUrl}
        className="w-full h-full border-0"
        title={fileName}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        style={{ backgroundColor: '#525659' }}
      />
    </div>
  );
};

export default OfficeViewer;
