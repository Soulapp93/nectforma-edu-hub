
import React from 'react';
import { Button } from '../button';
import { Download, FileText } from 'lucide-react';

interface UnsupportedViewerProps {
  fileUrl: string;
  fileName: string;
  fileExtension: string;
}

const UnsupportedViewer: React.FC<UnsupportedViewerProps> = ({ 
  fileUrl, 
  fileName, 
  fileExtension 
}) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500">
      <FileText className="h-16 w-16 mb-4 text-gray-400" />
      <h3 className="text-lg font-medium mb-2">Aperçu non disponible</h3>
      <p className="text-sm text-center mb-4 max-w-md">
        Ce type de fichier ({fileExtension.toUpperCase()}) ne peut pas être visualisé directement. 
        Vous pouvez le télécharger pour l'ouvrir avec l'application appropriée.
      </p>
      <Button onClick={handleDownload}>
        <Download className="h-4 w-4 mr-2" />
        Télécharger le fichier
      </Button>
    </div>
  );
};

export default UnsupportedViewer;
