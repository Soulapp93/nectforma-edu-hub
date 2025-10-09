import React, { useState } from 'react';

interface BasicPDFViewerProps {
  fileUrl: string;
  fileName: string;
}

const BasicPDFViewer: React.FC<BasicPDFViewerProps> = ({ 
  fileUrl, 
  fileName 
}) => {
  const [loading, setLoading] = useState(true);

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Chargement du PDF...</p>
          </div>
        </div>
      )}

      <embed
        src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
        type="application/pdf"
        className="w-full h-full"
        title={fileName}
        onLoad={() => setLoading(false)}
      />
    </div>
  );
};

export default BasicPDFViewer;