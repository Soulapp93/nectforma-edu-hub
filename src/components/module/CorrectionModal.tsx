
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* En-tête du modal */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Corriger - {submission.student?.first_name} {submission.student?.last_name}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenu principal avec scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Soumission de l'étudiant */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Soumission de l'étudiant
              </h3>
              
              {submission.submission_text && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-medium mb-3 text-gray-800">Réponse textuelle:</h4>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {submission.submission_text}
                  </p>
                </div>
              )}

              {submissionFiles.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 text-gray-800">Fichiers joints:</h4>
                  <div className="space-y-3">
                    {submissionFiles.map((file, index) => (
                      <div 
                        key={index} 
                        className="bg-gray-50 border border-gray-200 p-4 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {/* Informations du fichier */}
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="flex-shrink-0">
                            <File className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {file.file_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {(file.file_size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        
                        {/* Boutons d'action - bien visibles */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewFile(file.file_url, file.file_name)}
                            className="flex-1 sm:flex-none justify-center sm:justify-start"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Prévisualiser
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => downloadFile(file.file_url, file.file_name)}
                            className="flex-1 sm:flex-none justify-center sm:justify-start bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Soumis le:</strong> {new Date(submission.submitted_at).toLocaleDateString()} à {new Date(submission.submitted_at).toLocaleTimeString()}
                </p>
              </div>
            </div>

            {/* Formulaire de correction */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Correction
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note obtenue
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={correction.max_score}
                      value={correction.score}
                      onChange={(e) => setCorrection({ ...correction, score: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note maximale
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={correction.max_score}
                      onChange={(e) => setCorrection({ ...correction, max_score: parseInt(e.target.value) || 100 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commentaires de correction
                  </label>
                  <textarea
                    value={correction.comments}
                    onChange={(e) => setCorrection({ ...correction, comments: e.target.value })}
                    rows={8}
                    placeholder="Ajoutez vos commentaires détaillés de correction..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Résumé de la note */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">
                      Note finale: {correction.score}/{correction.max_score}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Pourcentage: {((correction.score / correction.max_score) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose}
                    className="w-full sm:w-auto"
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                  >
                    {loading ? 'Sauvegarde...' : 'Sauvegarder la correction'}
                  </Button>
                </div>
              </form>
            </div>
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
