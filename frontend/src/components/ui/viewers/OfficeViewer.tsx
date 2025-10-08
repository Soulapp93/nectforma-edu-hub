
import React, { useState } from 'react';
import { Button } from '../button';
import { AlertCircle, Download, ExternalLink } from 'lucide-react';

interface OfficeViewerProps {
  fileUrl: string;
  fileName: string;
  fileExtension: string;
}

const OfficeViewer: React.FC<OfficeViewerProps> = ({ fileUrl, fileName, fileExtension }) => {
  const [googleViewerError, setGoogleViewerError] = useState(false);
  const [microsoftViewerError, setMicrosoftViewerError] = useState(false);

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

  // Si les deux visualiseurs échouent, afficher les options
  if (googleViewerError && microsoftViewerError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
        <AlertCircle className="h-16 w-16 mb-4 text-orange-500" />
        <h3 className="text-lg font-medium mb-2">Visualisation non disponible</h3>
        <p className="text-sm text-center mb-6 max-w-md">
          Ce fichier {fileExtension.toUpperCase()} ne peut pas être visualisé directement dans le navigateur.
          Vous pouvez l'ouvrir dans un nouvel onglet ou le télécharger.
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
    );
  }

  // Essayer Microsoft Office Online en premier pour les fichiers Office
  if (!microsoftViewerError && ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(fileExtension)) {
    const microsoftViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
    
    return (
      <div className="w-full h-full relative">
        <iframe
          src={microsoftViewerUrl}
          className="w-full h-full border-0"
          title={fileName}
          onError={() => setMicrosoftViewerError(true)}
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
        <div className="absolute top-2 right-2 flex space-x-2">
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
    );
  }

  // Fallback vers Google Docs Viewer
  if (!googleViewerError) {
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    
    return (
      <div className="w-full h-full relative">
        <iframe
          src={googleViewerUrl}
          className="w-full h-full border-0"
          title={fileName}
          onError={() => setGoogleViewerError(true)}
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
        <div className="absolute top-2 right-2 flex space-x-2">
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
    );
  }

  return null;
};

export default OfficeViewer;
