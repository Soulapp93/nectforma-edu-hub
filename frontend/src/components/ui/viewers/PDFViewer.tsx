
import React, { useState } from 'react';
import { AlertCircle, Download, ExternalLink } from 'lucide-react';
import { Button } from '../button';

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileUrl, fileName }) => {
  const [embedError, setEmbedError] = useState(false);
  const [viewerError, setViewerError] = useState(false);

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

  // Si les deux méthodes échouent, afficher les options de téléchargement
  if (embedError && viewerError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
        <AlertCircle className="h-16 w-16 mb-4 text-orange-500" />
        <h3 className="text-lg font-medium mb-2">Visualisation bloquée</h3>
        <p className="text-sm text-center mb-6 max-w-md">
          Votre navigateur bloque la visualisation directe de ce PDF. 
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

  // Essayer d'abord Google Docs Viewer si l'embed direct échoue
  if (embedError && !viewerError) {
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    
    return (
      <div className="w-full h-full relative">
        <iframe
          src={googleViewerUrl}
          className="w-full h-full border-0"
          title={fileName}
          onError={() => setViewerError(true)}
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

  // Essayer d'abord l'embed direct du PDF
  return (
    <div className="w-full h-full relative">
      <iframe
        src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`}
        className="w-full h-full border-0"
        title={fileName}
        onError={() => setEmbedError(true)}
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
};

export default PDFViewer;
