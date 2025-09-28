import React from 'react';
import ChromeInspiredDocumentViewer from '@/components/ui/viewers/ChromeInspiredDocumentViewer';

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
}

const FileViewerModal: React.FC<FileViewerModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  fileName
}) => {
  return (
    <ChromeInspiredDocumentViewer
      fileUrl={fileUrl}
      fileName={fileName}
      isOpen={isOpen}
      onClose={onClose}
    />
  );
};

export default FileViewerModal;