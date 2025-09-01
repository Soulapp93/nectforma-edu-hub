
import React, { useState } from 'react';
import { Button } from '../button';
import { AlertCircle, Download } from 'lucide-react';

interface OfficeViewerProps {
  fileUrl: string;
  fileName: string;
  fileExtension: string;
}

const OfficeViewer: React.FC<OfficeViewerProps> = ({ fileUrl, fileName, fileExtension }) => {
  const [showError, setShowError] = useState(false);
  
  // Pour les fichiers Office, on essaie d'abord Google Docs Viewer
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (showError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <AlertCircle className="h-12 w-12 mb-4 text-orange-500" />
        <h3 className="text-lg font-medium mb-2">Visualisation non disponible</h3>
        <p className="text-sm text-center mb-4">
          Ce fichier {fileExtension.toUpperCase()} ne peut pas être visualisé directement dans le navigateur.
        </p>
        <Button onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Télécharger le fichier
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <iframe
        src={googleViewerUrl}
        className="w-full h-full border-0"
        title={fileName}
        onError={() => setShowError(true)}
      />
      <div className="absolute top-2 right-2">
        <Button size="sm" variant="outline" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-1" />
          Télécharger
        </Button>
      </div>
    </div>
  );
};

export default OfficeViewer;
