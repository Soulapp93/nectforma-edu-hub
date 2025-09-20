import React from 'react';
import DocumentViewer from '@/components/ui/document-viewer';
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

  // Utiliser directement le DocumentViewer existant comme dans les événements
  return (
    <DocumentViewer
      fileUrl={file.file_url}
      fileName={file.original_name}
      isOpen={open}
      onClose={() => onOpenChange(false)}
    />
  );
};

export default FileViewerModal;