
import React, { useState, useEffect } from 'react';
import { X, Download, File, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { assignmentService, AssignmentSubmission } from '@/services/assignmentService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import DocumentViewer from '@/components/ui/document-viewer';
import { toast } from 'sonner';

interface CorrectionModalProps {
  submission: AssignmentSubmission;
  onClose: () => void;
  onSuccess: () => void;
}

const CorrectionModal: React.FC<CorrectionModalProps> = ({
  submission,
  onClose,
  onSuccess
}) => {
  const [correction, setCorrection] = useState({
    score: 0,
    max_score: 100,
    comments: ''
  });
  const [loading, setLoading] = useState(false);
  const [submissionFiles, setSubmissionFiles] = useState<any[]>([]);
  const [viewerFile, setViewerFile] = useState<{ url: string; name: string } | null>(null);
  const { userId } = useCurrentUser();

  useEffect(() => {
    // Charger les fichiers de la soumission
    const loadSubmissionFiles = async () => {
      try {
        const files = await assignmentService.getSubmissionFiles(submission.id);
        setSubmissionFiles(files || []);
      } catch (error) {
        console.error('Erreur lors du chargement des fichiers:', error);
      }
    };

    loadSubmissionFiles();

    // Si une correction existe déjà, la charger
    if (submission.correction) {
      setCorrection({
        score: submission.correction.score || 0,
        max_score: submission.correction.max_score || 100,
        comments: submission.correction.comments || ''
      });
    }
  }, [submission]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast.error('Utilisateur non authentifié');
      return;
    }

    setLoading(true);

    try {
      await assignmentService.correctSubmission(submission.id, {
        score: correction.score,
        max_score: correction.max_score,
        comments: correction.comments,
        corrected_by: userId
      });

      toast.success('Correction sauvegardée avec succès');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la correction:', error);
      toast.error('Erreur lors de la sauvegarde de la correction');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      // Créer un élément a pour le téléchargement
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Fichier téléchargé avec succès');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement du fichier');
    }
  };

  const viewFile = (fileUrl: string, fileName: string) => {
    setViewerFile({ url: fileUrl, name: fileName });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            Corriger - {submission.student?.first_name} {submission.student?.last_name}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Soumission de l'étudiant */}
          <div>
            <h3 className="text-lg font-medium mb-4">Soumission de l'étudiant</h3>
            
            {submission.submission_text && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2">Réponse textuelle:</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{submission.submission_text}</p>
              </div>
            )}

            {submissionFiles.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Fichiers joints:</h4>
                <div className="space-y-2">
                  {submissionFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                      <div className="flex items-center space-x-2">
                        <File className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">{file.file_name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.file_size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewFile(file.file_url, file.file_name)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadFile(file.file_url, file.file_name)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Télécharger
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-sm text-gray-500 mt-4">
              Soumis le: {new Date(submission.submitted_at).toLocaleDateString()} à {new Date(submission.submitted_at).toLocaleTimeString()}
            </div>
          </div>

          {/* Formulaire de correction */}
          <div>
            <h3 className="text-lg font-medium mb-4">Correction</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note obtenue
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={correction.max_score}
                    value={correction.score}
                    onChange={(e) => setCorrection({ ...correction, score: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note maximale
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={correction.max_score}
                    onChange={(e) => setCorrection({ ...correction, max_score: parseInt(e.target.value) || 100 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commentaires
                </label>
                <textarea
                  value={correction.comments}
                  onChange={(e) => setCorrection({ ...correction, comments: e.target.value })}
                  rows={6}
                  placeholder="Ajoutez vos commentaires de correction..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm">
                  <strong>Note finale: {correction.score}/{correction.max_score}</strong>
                  <span className="ml-2 text-gray-600">
                    ({((correction.score / correction.max_score) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Sauvegarde...' : 'Sauvegarder la correction'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Document Viewer */}
      {viewerFile && (
        <DocumentViewer
          fileUrl={viewerFile.url}
          fileName={viewerFile.name}
          isOpen={true}
          onClose={() => setViewerFile(null)}
        />
      )}
    </div>
  );
};

export default CorrectionModal;
