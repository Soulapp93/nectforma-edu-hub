
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { moduleDocumentService, ModuleDocument } from '@/services/moduleDocumentService';
import { fileUploadService } from '@/services/fileUploadService';
import FileUpload from '@/components/ui/file-upload';

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  onSuccess: () => void;
  editDocument?: ModuleDocument;
}

const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  isOpen,
  onClose,
  moduleId,
  onSuccess,
  editDocument
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    document_type: 'support' as 'support' | 'article' | 'reference' | 'autre'
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editDocument) {
      setFormData({
        title: editDocument.title,
        description: editDocument.description || '',
        document_type: editDocument.document_type as 'support' | 'article' | 'reference' | 'autre'
      });
    }
  }, [editDocument]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editDocument) {
        let fileUrl = editDocument.file_url;
        let fileName = editDocument.file_name;
        let fileSize = editDocument.file_size;

        if (selectedFiles.length > 0) {
          const file = selectedFiles[0];
          fileUrl = await fileUploadService.uploadFile(file);
          fileName = file.name;
          fileSize = file.size;
        }

        await moduleDocumentService.updateDocument(editDocument.id, {
          ...formData,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize
        });
      } else {
        if (selectedFiles.length === 0) {
          throw new Error('Veuillez sélectionner un fichier');
        }

        const file = selectedFiles[0];
        const fileUrl = await fileUploadService.uploadFile(file);

        await moduleDocumentService.createDocument({
          ...formData,
          module_id: moduleId,
          file_url: fileUrl,
          file_name: file.name,
          file_size: file.size
        });
      }

      onSuccess();
      onClose();
      setFormData({ title: '', description: '', document_type: 'support' });
      setSelectedFiles([]);
    } catch (error: any) {
      console.error('Error saving document:', error);
      setError(error.message || (editDocument ? 'Erreur lors de la modification du document' : 'Erreur lors de la création du document'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-md max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 sm:p-6 pb-0 shrink-0">
          <DialogTitle>
            {editDocument ? 'Modifier le document' : 'Ajouter un document'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Titre *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Type de document *
            </label>
            <select
              value={formData.document_type}
              onChange={(e) => setFormData({ ...formData, document_type: e.target.value as any })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="support">Support de cours</option>
              <option value="article">Article</option>
              <option value="reference">Référence</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {editDocument ? 'Nouveau fichier (laisser vide pour conserver l\'actuel)' : 'Fichier *'}
            </label>
            <FileUpload
              onFileSelect={setSelectedFiles}
              maxSize={50}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tous types de fichiers acceptés (PDF, Word, Excel, PowerPoint, images, vidéos, audio, etc.)
            </p>
            {editDocument?.file_name && selectedFiles.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Fichier actuel: {editDocument.file_name}
              </p>
            )}
          </div>
        </form>

        <DialogFooter className="p-4 sm:p-6 pt-0 shrink-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button 
            onClick={(e) => {
              const form = (e.target as HTMLElement).closest('[role="dialog"]')?.querySelector('form');
              if (form) form.requestSubmit();
            }}
            disabled={loading || (!editDocument && selectedFiles.length === 0)}
          >
            {loading ? (editDocument ? 'Modification...' : 'Création...') : (editDocument ? 'Modifier' : 'Créer')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDocumentModal;
