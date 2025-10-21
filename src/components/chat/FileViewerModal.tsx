import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import UniversalFileViewer from '@/components/ui/viewers/UniversalFileViewer';

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
  fileName,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <DialogTitle className="sr-only">{fileName}</DialogTitle>
        <UniversalFileViewer
          fileUrl={fileUrl}
          fileName={fileName}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default FileViewerModal;
