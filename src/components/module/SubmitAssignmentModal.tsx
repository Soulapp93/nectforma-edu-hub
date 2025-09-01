
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { assignmentService, Assignment } from '@/services/assignmentService';
import { fileUploadService } from '@/services/fileUploadService';
import FileUpload from '@/components/ui/file-upload';

interface SubmitAssignmentModalProps {
  assignment: Assignment;
  onClose: () => void;
  onSuccess: () => void;
}

const SubmitAssignmentModal: React.FC<SubmitAssignmentModalProps> = ({
  assignment,
  onClose,
  onSuccess
}) => {
  const [submissionText, setSubmissionText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!submissionText.trim() && selectedFiles.length === 0) {
      alert('Veuillez ajouter du texte ou des fichiers pour votre soumission');
      return;
    }

    setLoading(true);

    try {
      // Créer la soumission
      const submission = await assignmentService.submitAssignment({
        assignment_id: assignment.id,
        student_id: 'current-user-id', // TODO: Récupérer l'ID utilisateur actuel
        submission_text: submissionText.trim() || null
      });

      // Uploader les fichiers si il y en a
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileUrl = await fileUploadService.uploadFile(file);
          await assignmentService.addSubmissionFile({
            submission_id: submission.id,
            file_url: fileUrl,
            file_name: file.name,
            file_size: file.size
          });
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Erreur lors de la soumission du devoir');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Rendre le devoir: {assignment.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {assignment.description && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-blue-900 mb-2">Description du devoir:</h3>
              <p className="text-blue-800">{assignment.description}</p>
              {assignment.due_date && (
                <p className="text-sm text-blue-600 mt-2">
                  À rendre avant le: {new Date(assignment.due_date).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre réponse
              </label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Rédigez votre réponse ici..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fichiers joints (optionnel)
              </label>
              <FileUpload
                onFileSelect={setSelectedFiles}
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip,.rar"
                maxSize={10}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Soumission...' : 'Rendre le devoir'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubmitAssignmentModal;
