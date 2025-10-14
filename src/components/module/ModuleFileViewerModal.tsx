import React, { useMemo } from 'react';
import ChromeStylePDFViewer from '@/components/ui/viewers/ChromeStylePDFViewer';
import EnhancedMediaViewer from '@/components/ui/viewers/EnhancedMediaViewer';
import ExcelViewer from '@/components/ui/viewers/ExcelViewer';
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
  const fileExtension = useMemo(() => {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }, [fileName]);

  const fileType = useMemo(() => {
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv', 'wmv'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'wma'];
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    const excelExtensions = ['xlsx', 'xls', 'csv', 'xlsm', 'xlsb'];

    if (fileExtension === 'pdf') return 'pdf';
    if (videoExtensions.includes(fileExtension)) return 'video';
    if (audioExtensions.includes(fileExtension)) return 'audio';
    if (imageExtensions.includes(fileExtension)) return 'image';
    if (excelExtensions.includes(fileExtension)) return 'excel';
    return 'other';
  }, [fileExtension]);

  if (!isOpen) return null;

  // Use Chrome-style PDF viewer for PDFs
  if (fileType === 'pdf') {
    return (
      <ChromeStylePDFViewer
        fileUrl={fileUrl}
        fileName={fileName}
        onClose={onClose}
      />
    );
  }

  // Use enhanced media viewer for video, audio, and images
  if (fileType === 'video' || fileType === 'audio' || fileType === 'image') {
    return (
      <EnhancedMediaViewer
        fileUrl={fileUrl}
        fileName={fileName}
        fileType={fileType}
        onClose={onClose}
      />
    );
  }

  // Use Excel viewer for spreadsheet files
  if (fileType === 'excel') {
    return (
      <ExcelViewer
        fileUrl={fileUrl}
        fileName={fileName}
        onClose={onClose}
      />
    );
  }

  // Fallback to universal viewer for other file types
  return (
    <div className="fixed inset-0 z-50">
      <UniversalFileViewer
        fileUrl={fileUrl}
        fileName={fileName}
        onClose={onClose}
      />
    </div>
  );
};

export default ModuleFileViewerModal;
