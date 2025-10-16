import React, { useMemo } from 'react';
import ChromeStylePDFViewer from '@/components/ui/viewers/ChromeStylePDFViewer';
import EnhancedMediaViewer from '@/components/ui/viewers/EnhancedMediaViewer';
import ExcelViewer from '@/components/ui/viewers/ExcelViewer';
import UniversalFileViewer from '@/components/ui/viewers/UniversalFileViewer';
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
  const fileExtension = useMemo(() => {
    if (!file) return '';
    return file.original_name.split('.').pop()?.toLowerCase() || '';
  }, [file]);

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

  if (!file || !open) return null;

  const handleClose = () => onOpenChange(false);

  // Use Chrome-style PDF viewer for PDFs
  if (fileType === 'pdf') {
    return (
      <ChromeStylePDFViewer
        fileUrl={file.file_url}
        fileName={file.original_name}
        onClose={handleClose}
      />
    );
  }

  // Use enhanced media viewer for video, audio, and images
  if (fileType === 'video' || fileType === 'audio' || fileType === 'image') {
    return (
      <EnhancedMediaViewer
        fileUrl={file.file_url}
        fileName={file.original_name}
        fileType={fileType}
        onClose={handleClose}
      />
    );
  }

  // Use Excel viewer for spreadsheet files
  if (fileType === 'excel') {
    return (
      <ExcelViewer
        fileUrl={file.file_url}
        fileName={file.original_name}
        onClose={handleClose}
      />
    );
  }

  // Fallback to universal viewer for other file types
  return (
    <div className="fixed inset-0 z-50">
      <UniversalFileViewer
        fileUrl={file.file_url}
        fileName={file.original_name}
        onClose={handleClose}
      />
    </div>
  );
};

export default FileViewerModal;