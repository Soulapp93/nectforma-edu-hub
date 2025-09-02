
import React, { useState, useEffect } from 'react';
import { Plus, FileText, Users, Calendar, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { assignmentService, Assignment } from '@/services/assignmentService';
import CreateAssignmentModal from './CreateAssignmentModal';
import AssignmentSubmissionsModal from './AssignmentSubmissionsModal';
import SubmitAssignmentModal from './SubmitAssignmentModal';
import { toast } from 'sonner';

interface ModuleAssignmentsTabProps {
  moduleId: string;
}

const ModuleAssignmentsTab: React.FC<ModuleAssignmentsTabProps> = ({ moduleId }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Assignment | null>(null);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState<Assignment | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState<Assignment | null>(null);

  const fetchAssignments = async () => {
    try {
      const data = await assignmentService.getModuleAssignments(moduleId);
      setAssignments(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des devoirs:', error);
      toast.error('Erreur lors du chargement des devoirs');
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
    toast.success('Devoir créé avec succès');
  };

  const handleEditSuccess = () => {
    fetchAssignments();
    setShowEditModal(null);
    toast.success('Devoir modifié avec succès');
  };

  const handleSubmitSuccess = () => {
    fetchAssignments();
    setShowSubmitModal(null);
    toast.success('Devoir rendu avec succès');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce devoir ?')) {
      try {
        // Ajoutons une méthode de suppression au service
        // Pour l'instant, nous ne l'implémentons pas car elle n'existe pas dans le service
        toast.error('Fonction de suppression non implémentée');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleEdit = (assignment: Assignment) => {
    setShowEditModal(assignment);
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
            <div key={assignment.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
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
                    {assignment.is_published && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        Publié
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowSubmitModal(assignment)}
                  >
                    Rendre le devoir
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowSubmissionsModal(assignment)}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Voir soumissions
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleEdit(assignment)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-red-600"
                    onClick={() => handleDelete(assignment.id)}
                  >
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

      {showEditModal && (
        <CreateAssignmentModal
          isOpen={!!showEditModal}
          onClose={() => setShowEditModal(null)}
          moduleId={moduleId}
          onSuccess={handleEditSuccess}
          editAssignment={showEditModal}
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
