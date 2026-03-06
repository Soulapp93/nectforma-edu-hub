
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      console.log('Saving document with:', { formData, files: selectedFiles, editMode: !!editDocument });

      if (editDocument) {
        // Mode édition
        let fileUrl = editDocument.file_url;
        let fileName = editDocument.file_name;
        let fileSize = editDocument.file_size;

        if (selectedFiles.length > 0) {
          const file = selectedFiles[0];
          console.log('Uploading new file:', file);
          fileUrl = await fileUploadService.uploadFile(file);
          fileName = file.name;
          fileSize = file.size;
          console.log('New file uploaded, URL:', fileUrl);
        }

        const documentData = {
          ...formData,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize
        };

        console.log('Updating document in database:', documentData);
        await moduleDocumentService.updateDocument(editDocument.id, documentData);
        console.log('Document updated successfully');
      } else {
        // Mode création
        if (selectedFiles.length === 0) {
          throw new Error('Veuillez sélectionner un fichier');
        }

        const file = selectedFiles[0];
        console.log('Uploading file:', file);

        const fileUrl = await fileUploadService.uploadFile(file);
        console.log('File uploaded, URL:', fileUrl);

        const documentData = {
          ...formData,
          module_id: moduleId,
          file_url: fileUrl,
          file_name: file.name,
          file_size: file.size
        };

        console.log('Creating document in database:', documentData);
        await moduleDocumentService.createDocument(documentData);
        console.log('Document created successfully');
      }

      onSuccess();
      onClose();
      setFormData({
        title: '',
        description: '',
        document_type: 'support'
      });
      setSelectedFiles([]);
    } catch (error: any) {
      console.error('Error saving document:', error);
      setError(error.message || (editDocument ? 'Erreur lors de la modification du document' : 'Erreur lors de la création du document'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-background rounded-lg w-full max-w-[95vw] sm:max-w-md max-h-[85vh] sm:max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold text-foreground">
            {editDocument ? 'Modifier le document' : 'Ajouter un document'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || (!editDocument && selectedFiles.length === 0)}>
              {loading ? (editDocument ? 'Modification...' : 'Création...') : (editDocument ? 'Modifier' : 'Créer')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDocumentModal;
