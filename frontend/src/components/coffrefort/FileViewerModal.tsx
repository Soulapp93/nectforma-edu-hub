import React from 'react';
import ChromeStyleViewer from '@/components/ui/viewers/ChromeStyleViewer';
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
    <ChromeStyleViewer
      fileUrl={file.file_url}
      fileName={file.original_name}
      isOpen={open}
      onClose={() => onOpenChange(false)}
    />
  );
};

export default FileViewerModal;