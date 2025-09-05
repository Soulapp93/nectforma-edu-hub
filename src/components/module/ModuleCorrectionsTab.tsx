
import React, { useState, useEffect } from 'react';
import { Edit, CheckCircle, Clock, FileText, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { assignmentService, AssignmentSubmission } from '@/services/assignmentService';
import CorrectionModal from './CorrectionModal';
import { toast } from 'sonner';

interface ModuleCorrectionsTabProps {
  moduleId: string;
}

const ModuleCorrectionsTab: React.FC<ModuleCorrectionsTabProps> = ({ moduleId }) => {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCorrectionModal, setShowCorrectionModal] = useState<AssignmentSubmission | null>(null);

  const fetchSubmissions = async () => {
    try {
      // Récupérer d'abord les devoirs du module
      const assignments = await assignmentService.getModuleAssignments(moduleId);
      
      // Puis récupérer toutes les soumissions pour ces devoirs
      const allSubmissions: AssignmentSubmission[] = [];
      for (const assignment of assignments) {
        const assignmentSubmissions = await assignmentService.getAssignmentSubmissions(assignment.id);
        allSubmissions.push(...assignmentSubmissions);
      }
      
      setSubmissions(allSubmissions);
    } catch (error) {
      console.error('Erreur lors du chargement des corrections:', error);
      toast.error('Erreur lors du chargement des corrections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [moduleId]);

  const handleCorrect = (submission: AssignmentSubmission) => {
    setShowCorrectionModal(submission);
  };

  const handleCorrectionSuccess = () => {
    fetchSubmissions();
    setShowCorrectionModal(null);
    toast.success('Correction sauvegardée avec succès');
  };

  const getSubmissionStatus = (submission: AssignmentSubmission) => {
    if (submission.correction?.is_corrected) {
      if (submission.correction.published_at) {
        return { status: 'Publié', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      } else {
        return { status: 'Corrigé', color: 'bg-blue-100 text-blue-800', icon: Edit };
      }
    } else {
      return { status: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Corrections</h2>
      </div>

      {submissions.length > 0 ? (
        <div className="space-y-4">
          {submissions.map((submission) => {
            const statusInfo = getSubmissionStatus(submission);
            const StatusIcon = statusInfo.icon;
            
            return (
              <div key={submission.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <StatusIcon className="h-5 w-5 text-gray-500" />
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {submission.student?.first_name} {submission.student?.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">{submission.student?.email}</p>
                      </div>
                    </div>
                    
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 ml-8">
                      <span className="flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        Rendu le {new Date(submission.submitted_at).toLocaleDateString()}
                      </span>
                      
                      <span className={`px-2 py-1 rounded-full text-xs ${statusInfo.color}`}>
                        {statusInfo.status}
                      </span>
                      
                      {submission.correction?.score !== undefined && (
                        <span className="font-medium">
                          {submission.correction.score}/{submission.correction.max_score} points
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {submission.correction?.is_corrected ? (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCorrect(submission)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir correction
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Exporter
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={() => handleCorrect(submission)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Corriger
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Edit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune correction</h3>
          <p className="text-gray-600">Les corrections publiées apparaîtront ici.</p>
        </div>
      )}

      {showCorrectionModal && (
        <CorrectionModal
          submission={showCorrectionModal}
          onClose={() => setShowCorrectionModal(null)}
          onSuccess={handleCorrectionSuccess}
        />
      )}
    </div>
  );
};

export default ModuleCorrectionsTab;
