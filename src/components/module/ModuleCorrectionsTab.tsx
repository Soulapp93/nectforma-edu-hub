import React, { useState, useEffect } from 'react';
import { Edit, CheckCircle, Clock, FileText, Eye, Download, FolderOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { assignmentService, Assignment, AssignmentSubmission } from '@/services/assignmentService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import CorrectionModal from './CorrectionModal';
import StudentCorrectionViewModal from './StudentCorrectionViewModal';
import { toast } from 'sonner';

interface ModuleCorrectionsTabProps {
  moduleId: string;
}

interface AssignmentWithSubmissions {
  assignment: Assignment;
  submissions: AssignmentSubmission[];
}

const ModuleCorrectionsTab: React.FC<ModuleCorrectionsTabProps> = ({ moduleId }) => {
  const [assignmentsWithSubmissions, setAssignmentsWithSubmissions] = useState<AssignmentWithSubmissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCorrectionModal, setShowCorrectionModal] = useState<AssignmentSubmission | null>(null);
  const [showStudentModal, setShowStudentModal] = useState<{ submission: AssignmentSubmission; title: string } | null>(null);
  const [expandedAssignments, setExpandedAssignments] = useState<Set<string>>(new Set());
  
  const { userId, userRole, loading: userLoading } = useCurrentUser();

  // Définir les permissions
  const isFormateur = userRole === 'Formateur';
  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';
  const canViewCorrections = isFormateur || isAdmin;
  const isEtudiant = userRole === 'Étudiant';

  // Fonction pour vérifier si l'utilisateur peut corriger/modifier une soumission
  const canCorrectSubmission = (assignment: Assignment) => {
    // Admin/Formateur: correction uniquement sur ses propres devoirs
    if ((isFormateur || isAdmin) && assignment.created_by && assignment.created_by === userId) return true;
    return false;
  };

  const fetchData = async () => {
    if (!userId) return;
    
    try {
      const assignments = await assignmentService.getModuleAssignments(moduleId);
      
      const result: AssignmentWithSubmissions[] = [];
      
      for (const assignment of assignments) {
        const submissions = await assignmentService.getAssignmentSubmissions(assignment.id);
        
        let filteredSubmissions = submissions;
        
        // Pour les étudiants, ne montrer que leurs propres soumissions avec corrections publiées
        if (isEtudiant) {
          filteredSubmissions = submissions.filter(s => 
            s.student_id === userId && 
            s.correction?.published_at !== null
          );
        }
        
        // Ne pas ajouter les devoirs sans soumissions pertinentes
        if (filteredSubmissions.length > 0 || canViewCorrections) {
          result.push({
            assignment,
            submissions: filteredSubmissions
          });
        }
      }
      
      setAssignmentsWithSubmissions(result);
      
      // Étendre tous les devoirs par défaut pour les formateurs/admins
      if (canViewCorrections) {
        setExpandedAssignments(new Set(result.map(r => r.assignment.id)));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des corrections:', error);
      toast.error('Erreur lors du chargement des corrections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && userId && userRole) {
      fetchData();
    }
  }, [moduleId, userId, userRole, userLoading]);

  const toggleAssignment = (assignmentId: string) => {
    setExpandedAssignments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assignmentId)) {
        newSet.delete(assignmentId);
      } else {
        newSet.add(assignmentId);
      }
      return newSet;
    });
  };

  const handleCorrectionSuccess = () => {
    fetchData();
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
      return { status: 'Non corrigé', color: 'bg-amber-100 text-amber-800', icon: Clock };
    }
  };

  if (loading || userLoading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  // Vue Étudiant - Afficher ses propres corrections
  if (isEtudiant) {
    const myCorrections = assignmentsWithSubmissions
      .flatMap(aws => aws.submissions.map(s => ({ ...s, assignmentTitle: aws.assignment.title })));

    if (myCorrections.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune correction disponible</h3>
          <p className="text-gray-600">
            Vos corrections apparaîtront ici une fois publiées par le formateur.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Mes corrections</h2>
        
        <div className="space-y-4">
        {myCorrections.map((submission) => {
            const correction = submission.correction;
            
            // Ignorer les soumissions sans correction (sécurité supplémentaire)
            if (!correction) return null;
            
            return (
              <div key={submission.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {submission.assignmentTitle}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Rendu le {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}</span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        Note: {correction.score ?? '-'}/{correction.max_score ?? '-'}
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowStudentModal({ 
                      submission, 
                      title: submission.assignmentTitle 
                    })}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Voir correction
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {showStudentModal && (
          <StudentCorrectionViewModal
            submission={showStudentModal.submission}
            assignmentTitle={showStudentModal.title}
            onClose={() => setShowStudentModal(null)}
          />
        )}
      </div>
    );
  }

  // Vue Formateur/Admin - Historique des corrections par devoir
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Corrections des devoirs</h2>
      </div>

      {assignmentsWithSubmissions.length > 0 ? (
        <div className="space-y-4">
          {assignmentsWithSubmissions.map(({ assignment, submissions }) => {
            const isExpanded = expandedAssignments.has(assignment.id);
            const correctedCount = submissions.filter(s => s.correction?.is_corrected).length;
            const publishedCount = submissions.filter(s => s.correction?.published_at).length;
            
            return (
              <div key={assignment.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                {/* En-tête du devoir (cliquable) */}
                <button
                  onClick={() => toggleAssignment(assignment.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                    <FolderOpen className="h-5 w-5 text-blue-600" />
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                      <p className="text-sm text-gray-500">
                        {submissions.length} soumission{submissions.length > 1 ? 's' : ''} • 
                        {correctedCount} corrigée{correctedCount > 1 ? 's' : ''} • 
                        {publishedCount} publiée{publishedCount > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Liste des soumissions */}
                {isExpanded && (
                  <div className="border-t divide-y">
                    {submissions.length > 0 ? (
                      submissions.map((submission) => {
                        const statusInfo = getSubmissionStatus(submission);
                        const StatusIcon = statusInfo.icon;
                        
                        return (
                          <div key={submission.id} className="p-4 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-700 font-medium text-sm">
                                    {submission.student?.first_name?.[0]}{submission.student?.last_name?.[0]}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {submission.student?.first_name} {submission.student?.last_name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Rendu le {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${statusInfo.color}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {statusInfo.status}
                                  {submission.correction?.score !== undefined && submission.correction.is_corrected && (
                                    <span className="ml-1">
                                      ({submission.correction.score}/{submission.correction.max_score})
                                    </span>
                                  )}
                                </span>
                                
                                {/* Bouton Corriger/Modifier - uniquement si l'utilisateur peut corriger ce devoir */}
                                {canCorrectSubmission(assignment) && (
                                  <Button 
                                    size="sm" 
                                    variant={submission.correction?.is_corrected ? 'outline' : 'default'}
                                    onClick={() => setShowCorrectionModal(submission)}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    {submission.correction?.is_corrected ? 'Modifier' : 'Corriger'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center text-gray-500">
                        Aucune soumission pour ce devoir
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Edit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun devoir à corriger</h3>
          <p className="text-gray-600">Les soumissions des étudiants apparaîtront ici.</p>
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
