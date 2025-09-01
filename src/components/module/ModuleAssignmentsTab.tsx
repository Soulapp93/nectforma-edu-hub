
import React, { useState, useEffect } from 'react';
import { Plus, FileText, Users, Calendar, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { assignmentService, Assignment } from '@/services/assignmentService';
import CreateAssignmentModal from './CreateAssignmentModal';
import AssignmentSubmissionsModal from './AssignmentSubmissionsModal';
import SubmitAssignmentModal from './SubmitAssignmentModal';

interface ModuleAssignmentsTabProps {
  moduleId: string;
}

const ModuleAssignmentsTab: React.FC<ModuleAssignmentsTabProps> = ({ moduleId }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState<Assignment | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState<Assignment | null>(null);

  const fetchAssignments = async () => {
    try {
      const data = await assignmentService.getModuleAssignments(moduleId);
      setAssignments(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des devoirs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [moduleId]);

  const handleCreateSuccess = () => {
    fetchAssignments();
    setShowCreateModal(false);
  };

  const handleSubmitSuccess = () => {
    fetchAssignments();
    setShowSubmitModal(null);
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Devoirs & Évaluations</h2>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Créer un devoir
        </Button>
      </div>

      {assignments.length > 0 ? (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-2">{assignment.title}</h3>
                  {assignment.description && (
                    <p className="text-gray-600 text-sm mb-3">{assignment.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      {assignment.assignment_type}
                    </span>
                    {assignment.due_date && (
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Échéance: {new Date(assignment.due_date).toLocaleDateString()}
                      </span>
                    )}
                    <span>{assignment.max_points} points</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Bouton pour étudiants - Rendre le devoir */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowSubmitModal(assignment)}
                  >
                    Rendre le devoir
                  </Button>
                  
                  {/* Bouton pour formateurs - Voir les soumissions */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowSubmissionsModal(assignment)}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Voir soumissions
                  </Button>
                  
                  <Button size="sm" variant="ghost">
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button size="sm" variant="ghost" className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun devoir</h3>
          <p className="text-gray-600">Aucun devoir n'a encore été créé pour ce module.</p>
        </div>
      )}

      {showCreateModal && (
        <CreateAssignmentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          moduleId={moduleId}
          onSuccess={handleCreateSuccess}
        />
      )}

      {showSubmissionsModal && (
        <AssignmentSubmissionsModal
          assignment={showSubmissionsModal}
          onClose={() => setShowSubmissionsModal(null)}
        />
      )}

      {showSubmitModal && (
        <SubmitAssignmentModal
          assignment={showSubmitModal}
          onClose={() => setShowSubmitModal(null)}
          onSuccess={handleSubmitSuccess}
        />
      )}
    </div>
  );
};

export default ModuleAssignmentsTab;
