
import React from 'react';

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileUrl, fileName }) => {
  return (
    <iframe
      src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`}
      className="w-full h-full border-0"
      title={fileName}
    />
  );
};

export default PDFViewer;
