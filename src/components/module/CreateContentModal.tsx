
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { moduleContentService } from '@/services/moduleContentService';
import { fileUploadService } from '@/services/fileUploadService';
import FileUpload from '@/components/ui/file-upload';

interface CreateContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  onSuccess: () => void;
}

const CreateContentModal: React.FC<CreateContentModalProps> = ({
  isOpen,
  onClose,
  moduleId,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'cours' as 'cours' | 'support' | 'video' | 'document'
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let fileUrl = null;
      let fileName = null;

      if (selectedFiles.length > 0) {
        fileUrl = await fileUploadService.uploadFile(selectedFiles[0]);
        fileName = selectedFiles[0].name;
      }

      await moduleContentService.createContent({
        ...formData,
        module_id: moduleId,
        file_url: fileUrl,
        file_name: fileName,
        created_by: 'current-user-id' // TODO: Récupérer l'ID utilisateur actuel
      });

      onSuccess();
      onClose();
      setFormData({
        title: '',
        description: '',
        content_type: 'cours'
      });
      setSelectedFiles([]);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('Erreur lors de la création du contenu');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Ajouter du contenu</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              Fichier (optionnel)
            </label>
            <FileUpload
              onFileSelect={setSelectedFiles}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.avi,.mov,.jpg,.jpeg,.png"
              maxSize={50}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateContentModal;
