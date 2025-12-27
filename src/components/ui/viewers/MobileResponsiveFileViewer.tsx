import React from 'react';
import TrueFullscreenViewer from './TrueFullscreenViewer';

interface MobileResponsiveFileViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

const MobileResponsiveFileViewer: React.FC<MobileResponsiveFileViewerProps> = ({
  fileUrl,
  fileName,
  isOpen,
  onClose
}) => {
  return (
    <TrueFullscreenViewer
      fileUrl={fileUrl}
      fileName={fileName}
      isOpen={isOpen}
      onClose={onClose}
    />
  );
};

export default MobileResponsiveFileViewer;
