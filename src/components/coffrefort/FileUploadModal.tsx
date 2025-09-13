import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import FileUpload from '@/components/ui/file-upload';
import { digitalSafeService } from '@/services/digitalSafeService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface FileUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId?: string;
  onSuccess: () => void;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  open,
  onOpenChange,
  folderId,
  onSuccess
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      await digitalSafeService.uploadFiles(selectedFiles, folderId);
      toast({
        title: "Succès",
        description: `${selectedFiles.length} fichier(s) uploadé(s) avec succès.`,
      });
      setSelectedFiles([]);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erreur upload:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'upload des fichiers.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importer des fichiers</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <FileUpload
            onFileSelect={setSelectedFiles}
            multiple={true}
            maxSize={20}
            accept="*/*"
          />
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Upload...
                </>
              ) : (
                'Importer'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadModal;