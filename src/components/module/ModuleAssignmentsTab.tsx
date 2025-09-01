
import React, { useState, useEffect } from 'react';
import { Plus, FileText, Calendar, Users, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { assignmentService, Assignment } from '@/services/assignmentService';
import CreateAssignmentModal from './CreateAssignmentModal';
import AssignmentSubmissionsModal from './AssignmentSubmissionsModal';

interface ModuleAssignmentsTabProps {
  moduleId: string;
}

const ModuleAssignmentsTab: React.FC<ModuleAssignmentsTabProps> = ({ moduleId }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

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

  const getTypeLabel = (type: string) => {
    return type === 'devoir' ? 'Devoir' : 'Évaluation';
  };

  const getTypeColor = (type: string) => {
    return type === 'devoir' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Devoirs & Évaluations</h2>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Créer un devoir
          </Button>
        </div>
      </div>

      <div className="p-6">
        {assignments.length > 0 ? (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(assignment.assignment_type)}`}>
                          {getTypeLabel(assignment.assignment_type)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 space-x-4">
                        {assignment.due_date && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>Échéance: {new Date(assignment.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <span>Max: {assignment.max_points} points</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      Répondre au devoir
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedAssignment(assignment)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Voir les soumissions
                    </Button>
                  </div>
                </div>
                {assignment.description && (
                  <p className="text-gray-600 text-sm mt-2 ml-14">{assignment.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun devoir</h3>
            <p className="text-gray-600 mb-4">Ce module n'a pas encore de devoirs ou d'évaluations.</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer le premier devoir
            </Button>
          </div>
        )}
      </div>

      <CreateAssignmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        moduleId={moduleId}
        onSuccess={fetchAssignments}
      />

      {selectedAssignment && (
        <AssignmentSubmissionsModal
          assignment={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
        />
      )}
    </div>
  );
};

export default ModuleAssignmentsTab;
