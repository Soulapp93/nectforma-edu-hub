import React from 'react';
import DocumentViewer from '@/components/ui/document-viewer';

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
  if (!isOpen) return null;

  // Utiliser directement le DocumentViewer existant qui gère déjà tous les types de fichiers
  return (
    <DocumentViewer
      fileUrl={fileUrl}
      fileName={fileName}
      isOpen={isOpen}
      onClose={onClose}
    />
  );
};

export default FileViewerModal;