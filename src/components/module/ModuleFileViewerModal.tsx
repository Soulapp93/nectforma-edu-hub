import React from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import UniversalFileViewer from '@/components/ui/viewers/UniversalFileViewer';

interface ModuleFileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
}

const ModuleFileViewerModal: React.FC<ModuleFileViewerModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  fileName,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 overflow-hidden">
        <UniversalFileViewer
          fileUrl={fileUrl}
          fileName={fileName}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ModuleFileViewerModal;
