import React, { useState, useEffect } from 'react';
import { Button } from '../button';
import { AlertCircle, Download, ExternalLink, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface SecureOfficeViewerProps {
  fileUrl: string;
  fileName: string;
  onClose: () => void;
}

const SecureOfficeViewer: React.FC<SecureOfficeViewerProps> = ({ 
  fileUrl, 
  fileName,
  onClose 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadFile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Télécharger le fichier via fetch
        const response = await fetch(fileUrl);
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement du fichier');
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setLoading(false);
      } catch (err) {
        console.error('Erreur chargement fichier:', err);
        setError('Impossible de charger le fichier');
        setLoading(false);
      }
    };

    loadFile();

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [fileUrl]);

  const handleDownload = () => {
    if (blobUrl) {
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Téléchargement démarré');
    }
  };

  const openInNewTab = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      toast.success('Fichier ouvert dans un nouvel onglet');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#323639]">
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="w-12 h-12 animate-spin text-white mb-4" />
          <div className="text-white text-lg">Chargement du document...</div>
          <div className="text-gray-400 text-sm mt-2">Préparation du fichier pour la visualisation</div>
        </div>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#323639]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#323639] border-b border-gray-700 flex-shrink-0">
          <div className="text-sm text-gray-200 max-w-md truncate">
            {fileName}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <span className="sr-only">Fermer</span>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* Error content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-white">
          <AlertCircle className="h-16 w-16 mb-4 text-red-400" />
          <h3 className="text-xl font-medium mb-2">Impossible de charger le document</h3>
          <p className="text-sm text-center mb-6 max-w-md text-gray-300">
            {error || 'Une erreur est survenue lors du chargement du fichier.'}
          </p>
          <div className="flex space-x-3">
            <Button onClick={handleDownload} variant="default" className="bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Télécharger le fichier
            </Button>
            <Button onClick={onClose} variant="outline" className="border-gray-500 text-white hover:bg-gray-700">
              Fermer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Pour les fichiers Office, utiliser Office Online avec le blob URL
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
  const isOfficeFile = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#323639]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#323639] border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-200 max-w-md truncate">
            {fileName}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={openInNewTab}
            className="h-8 px-3 text-gray-300 hover:text-white hover:bg-gray-700"
            title="Nouvel onglet"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            <span className="text-xs">Ouvrir</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 px-3 text-gray-300 hover:text-white hover:bg-gray-700"
            title="Télécharger"
          >
            <Download className="h-4 w-4 mr-1" />
            <span className="text-xs">Télécharger</span>
          </Button>

          <div className="h-6 w-px bg-gray-600" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
            title="Fermer"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-[#525659]">
        {isOfficeFile ? (
          // Pour les fichiers Office, essayer d'utiliser Office Online avec le blob
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(blobUrl)}`}
            className="w-full h-full border-0"
            title={fileName}
            onError={() => {
              toast.error('La visualisation en ligne a échoué. Veuillez télécharger le fichier.');
            }}
          />
        ) : (
          // Pour les autres types, affichage direct
          <div className="flex flex-col items-center justify-center h-full p-8">
            <FileText className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">{fileName}</h3>
            <p className="text-sm text-gray-300 mb-6">
              Fichier prêt à être téléchargé ou ouvert
            </p>
            <div className="flex space-x-3">
              <Button onClick={openInNewTab} variant="default" className="bg-blue-600 hover:bg-blue-700">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir
              </Button>
              <Button onClick={handleDownload} variant="outline" className="border-gray-500 text-white hover:bg-gray-700">
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecureOfficeViewer;
