
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { moduleDocumentService } from '@/services/moduleDocumentService';
import { fileUploadService } from '@/services/fileUploadService';
import FileUpload from '@/components/ui/file-upload';

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  onSuccess: () => void;
}

const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  isOpen,
  onClose,
  moduleId,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    document_type: 'support' as 'article' | 'support' | 'reference' | 'autre'
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      alert('Veuillez sélectionner un fichier');
      return;
    }

    setLoading(true);

    try {
      const fileUrl = await fileUploadService.uploadFile(selectedFiles[0]);
      
      await moduleDocumentService.createDocument({
        ...formData,
        module_id: moduleId,
        file_url: fileUrl,
        file_name: selectedFiles[0].name,
        file_size: selectedFiles[0].size,
        created_by: 'current-user-id' // TODO: Récupérer l'ID utilisateur actuel
      });

      onSuccess();
      onClose();
      setFormData({
        title: '',
        description: '',
        document_type: 'support'
      });
      setSelectedFiles([]);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('Erreur lors de l\'ajout du document');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Ajouter un document</h2>
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
              Type de document *
            </label>
            <select
              value={formData.document_type}
              onChange={(e) => setFormData({ ...formData, document_type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="support">Support</option>
              <option value="article">Article</option>
              <option value="reference">Référence</option>
              <option value="autre">Autre</option>
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
              Fichier *
            </label>
            <FileUpload
              onFileSelect={setSelectedFiles}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.ppt,.pptx"
              maxSize={25}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || selectedFiles.length === 0}>
              {loading ? 'Ajout...' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDocumentModal;
