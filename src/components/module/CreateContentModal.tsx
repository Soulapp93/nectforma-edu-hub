
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { moduleContentService, ModuleContent } from '@/services/moduleContentService';
import { fileUploadService } from '@/services/fileUploadService';
import FileUpload from '@/components/ui/file-upload';

interface CreateContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  onSuccess: () => void;
  editContent?: ModuleContent;
}

const CreateContentModal: React.FC<CreateContentModalProps> = ({
  isOpen,
  onClose,
  moduleId,
  onSuccess,
  editContent
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'cours' as 'cours' | 'support' | 'video' | 'document'
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editContent) {
      setFormData({
        title: editContent.title,
        description: editContent.description || '',
        content_type: editContent.content_type as 'cours' | 'support' | 'video' | 'document'
      });
    }
  }, [editContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Saving content with:', { formData, files: selectedFiles, editMode: !!editContent });

      if (editContent) {
        // Mode édition
        let fileUrl = editContent.file_url;
        let fileName = editContent.file_name;

        if (selectedFiles.length > 0) {
          console.log('Uploading new file:', selectedFiles[0]);
          fileUrl = await fileUploadService.uploadFile(selectedFiles[0]);
          fileName = selectedFiles[0].name;
          console.log('New file uploaded, URL:', fileUrl);
        }

        const contentData = {
          ...formData,
          file_url: fileUrl,
          file_name: fileName
        };

        console.log('Updating content in database:', contentData);
        await moduleContentService.updateContent(editContent.id, contentData);
        console.log('Content updated successfully');
      } else {
        // Mode création
        let fileUrl = null;
        let fileName = null;

        if (selectedFiles.length > 0) {
          console.log('Uploading file:', selectedFiles[0]);
          fileUrl = await fileUploadService.uploadFile(selectedFiles[0]);
          fileName = selectedFiles[0].name;
          console.log('File uploaded, URL:', fileUrl);
        }

        const contentData = {
          ...formData,
          module_id: moduleId,
          file_url: fileUrl,
          file_name: fileName
        };

        console.log('Creating content in database:', contentData);
        await moduleContentService.createContent(contentData);
        console.log('Content created successfully');
      }

      onSuccess();
      onClose();
      setFormData({
        title: '',
        description: '',
        content_type: 'cours'
      });
      setSelectedFiles([]);
    } catch (error: any) {
      console.error('Error saving content:', error);
      setError(error.message || (editContent ? 'Erreur lors de la modification du contenu' : 'Erreur lors de la création du contenu'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            {editContent ? 'Modifier le contenu' : 'Ajouter du contenu'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de contenu *
            </label>
            <select
              value={formData.content_type}
              onChange={(e) => setFormData({ ...formData, content_type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="cours">Cours</option>
              <option value="support">Support</option>
              <option value="video">Vidéo</option>
              <option value="document">Document</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {editContent ? 'Nouveau fichier (optionnel)' : 'Fichier (optionnel)'}
            </label>
            <FileUpload
              onFileSelect={setSelectedFiles}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.avi,.mov,.jpg,.jpeg,.png"
              maxSize={50}
            />
            {editContent?.file_name && selectedFiles.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Fichier actuel: {editContent.file_name}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (editContent ? 'Modification...' : 'Création...') : (editContent ? 'Modifier' : 'Créer')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateContentModal;
