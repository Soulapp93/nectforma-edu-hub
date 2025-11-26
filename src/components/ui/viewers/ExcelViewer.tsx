import React, { useState } from 'react';
import { Download, X, Maximize2, Minimize2, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExcelViewerProps {
  fileUrl: string;
  fileName: string;
  onClose: () => void;
}

const ExcelViewer: React.FC<ExcelViewerProps> = ({ fileUrl, fileName, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Encode the file URL for Google Viewer
  const encodedUrl = encodeURIComponent(fileUrl);
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;
  const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
  
  // Generate Google Sheets opening URL
  const openWithGoogleSheets = () => {
    window.open(`https://docs.google.com/spreadsheets/d/?url=${encodedUrl}`, '_blank', 'noopener,noreferrer');
  };
  
  // Generate Excel Online opening URL
  const openWithExcel = () => {
    window.open(`https://excel.office.com/launch?url=${encodedUrl}`, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Erreur lors du téléchargement');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur de téléchargement:', error);
    }
  };

  const openInNewTab = () => {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`fixed inset-0 z-50 bg-background ${isFullscreen ? 'p-0' : 'p-4'}`}>
      <div className="h-full flex flex-col bg-card rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <FileSpreadsheet className="h-8 w-8 text-green-600" />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold truncate">{fileName}</h2>
              <p className="text-sm text-muted-foreground">
                Fichier Excel • Visualisation native
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openWithGoogleSheets}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Google Sheets
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openWithExcel}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel Online
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Télécharger
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content - Native Excel Viewer */}
        <div className="flex-1 overflow-hidden bg-background">
          <iframe
            src={googleViewerUrl}
            className="w-full h-full border-0"
            title={fileName}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
      </div>
    </div>
  );
};

export default ExcelViewer;
