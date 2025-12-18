
import React, { useState, useEffect } from 'react';
import { X, User, Calendar, FileText, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { assignmentService, Assignment, AssignmentSubmission } from '@/services/assignmentService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import CorrectionModal from './CorrectionModal';

interface AssignmentSubmissionsModalProps {
  assignment: Assignment;
  onClose: () => void;
}

const AssignmentSubmissionsModal: React.FC<AssignmentSubmissionsModalProps> = ({
  assignment,
  onClose
}) => {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCorrectionModal, setShowCorrectionModal] = useState<AssignmentSubmission | null>(null);
  
  const { userId, userRole } = useCurrentUser();

  // Permissions: gestion (corriger/publier) uniquement pour le créateur du devoir
  const isFormateur = userRole === 'Formateur';
  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';
  const canManage = !!userId && (isFormateur || isAdmin) && assignment.created_by && assignment.created_by === userId;
  const canCorrect = canManage;
  const canPublish = canManage;

  const fetchSubmissions = async () => {
    try {
      const data = await assignmentService.getAssignmentSubmissions(assignment.id);
      setSubmissions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des soumissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [assignment.id]);

  const handlePublishCorrections = async () => {
    if (confirm('Publier toutes les corrections corrigées ? Les étudiants pourront voir leurs notes.')) {
      try {
        await assignmentService.publishCorrections(assignment.id);
        fetchSubmissions();
      } catch (error) {
        console.error('Erreur lors de la publication:', error);
      }
    }
  };

  const handleCorrectionSuccess = () => {
    fetchSubmissions();
    setShowCorrectionModal(null);
  };

  const correctedCount = submissions.filter(s => s.correction?.is_corrected).length;
  const publishedCount = submissions.filter(s => s.correction?.published_at).length;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold">{assignment.title} - Soumissions</h2>
              <p className="text-sm text-gray-600 mt-1">
                {submissions.length} soumission{submissions.length > 1 ? 's' : ''} • {correctedCount} corrigée{correctedCount > 1 ? 's' : ''} • {publishedCount} publiée{publishedCount > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canPublish && correctedCount > 0 && (
                <Button 
                  onClick={handlePublishCorrections}
                  disabled={correctedCount === publishedCount}
                >
                  Publier les corrections
                </Button>
              )}
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {loading ? (
              <div className="text-center py-8">Chargement...</div>
            ) : submissions.length > 0 ? (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {submission.student?.first_name} {submission.student?.last_name}
                          </h3>
                          <p className="text-sm text-gray-600">{submission.student?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{new Date(submission.submitted_at).toLocaleDateString()}</span>
                        </div>
                        {submission.correction ? (
                          <div className="flex items-center space-x-2">
                            {submission.correction.is_corrected ? (
                              <>
                                <span className="flex items-center text-green-600 text-sm">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Corrigé ({submission.correction.score}/{submission.correction.max_score})
                                </span>
                                {canCorrect && (
                                  <Button 
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowCorrectionModal(submission)}
                                  >
                                    Modifier correction
                                  </Button>
                                )}
                              </>
                            ) : (
                              <span className="flex items-center text-yellow-600 text-sm">
                                <Clock className="h-4 w-4 mr-1" />
                                En cours
                              </span>
                            )}
                            {submission.correction.published_at && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Publié
                              </span>
                            )}
                          </div>
                        ) : (
                          canCorrect && (
                            <Button 
                              size="sm"
                              onClick={() => setShowCorrectionModal(submission)}
                            >
                              Corriger
                            </Button>
                          )
                        )}
                      </div>
                    </div>


                    {submission.correction?.comments && (
                      <div className="bg-blue-50 rounded p-3">
                        <h4 className="text-sm font-medium text-blue-900 mb-1">Commentaires du formateur:</h4>
                        <p className="text-sm text-blue-800">{submission.correction.comments}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune soumission</h3>
                <p className="text-gray-600">Aucun étudiant n'a encore rendu ce devoir.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCorrectionModal && (
        <CorrectionModal
          submission={showCorrectionModal}
          onClose={() => setShowCorrectionModal(null)}
          onSuccess={handleCorrectionSuccess}
        />
      )}
    </>
  );
};

export default AssignmentSubmissionsModal;
