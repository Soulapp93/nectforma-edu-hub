import React from 'react';

interface BasicPDFViewerProps {
  fileUrl: string;
  fileName: string;
}

const BasicPDFViewer: React.FC<BasicPDFViewerProps> = ({ 
  fileUrl, 
  fileName 
}) => {
  return (
    <div className="w-full h-full bg-white">
      <iframe
        src={fileUrl}
        className="w-full h-full border-0"
        title={fileName}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
        allow="fullscreen"
      />
    </div>
  );
};

export default BasicPDFViewer;