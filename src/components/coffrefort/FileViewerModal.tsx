import React from 'react';
import ChromeInspiredDocumentViewer from '@/components/ui/viewers/ChromeInspiredDocumentViewer';
import { DigitalSafeFile } from '@/services/digitalSafeService';

interface FileViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: DigitalSafeFile | null;
}

const FileViewerModal: React.FC<FileViewerModalProps> = ({
  open,
  onOpenChange,
  file
}) => {
  if (!file) return null;

  return (
    <ChromeInspiredDocumentViewer
      fileUrl={file.file_url}
      fileName={file.original_name}
      isOpen={open}
      onClose={() => onOpenChange(false)}
    />
  );
};

export default FileViewerModal;