import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { digitalSafeService, DigitalSafeFile } from '@/services/digitalSafeService';
import { useToast } from '@/hooks/use-toast';
import PDFViewer from '@/components/ui/viewers/PDFViewer';
import ImageViewer from '@/components/ui/viewers/ImageViewer';
import TextViewer from '@/components/ui/viewers/TextViewer';
import UnsupportedViewer from '@/components/ui/viewers/UnsupportedViewer';

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
  const { toast } = useToast();

  if (!file) return null;

  const handleDownload = async () => {
    try {
      await digitalSafeService.downloadFile(file.file_url, file.original_name);
      toast({
        title: "Succès",
        description: "Téléchargement commencé.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du téléchargement.",
        variant: "destructive",
      });
    }
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const renderFileViewer = () => {
    const extension = getFileExtension(file.original_name);
    const contentType = file.content_type.toLowerCase();

    // PDF
    if (contentType === 'application/pdf' || extension === 'pdf') {
      return <PDFViewer fileUrl={file.file_url} fileName={file.original_name} />;
    }

    // Images
    if (contentType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return <ImageViewer fileUrl={file.file_url} fileName={file.original_name} />;
    }

    // Texte
    if (contentType.startsWith('text/') || ['txt', 'md', 'csv', 'json', 'xml', 'js', 'css', 'html'].includes(extension)) {
      return <TextViewer fileUrl={file.file_url} fileName={file.original_name} />;
    }

    // Non supporté
    return (
      <UnsupportedViewer
        fileUrl={file.file_url}
        fileName={file.original_name}
        fileExtension={extension}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold truncate mr-4">
              {file.original_name}
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {(file.file_size / 1024 / 1024).toFixed(2)} MB • {file.content_type}
          </div>
        </DialogHeader>
        
        <div className="flex-1 min-h-[500px] max-h-[600px] overflow-hidden">
          {renderFileViewer()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileViewerModal;