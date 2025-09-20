import React, { useState } from 'react';
import { BookOpen, Users, Clock, Calendar, User, Edit, Trash2, Eye } from 'lucide-react';
import { Formation } from '@/services/formationService';
import { useNavigate } from 'react-router-dom';
import FormationParticipantsModal from './FormationParticipantsModal';

interface FormationCardProps extends Formation {
  modules?: Array<{
    id: string;
    title: string;
    duration_hours: number;
    module_instructors?: Array<{
      instructor: {
        id: string;
        first_name: string;
        last_name: string;
      };
    }>;
  }>;
  participantsCount?: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

const FormationCard: React.FC<FormationCardProps> = ({
  id,
  title,
  description,
  level,
  status,
  start_date,
  end_date,
  max_students,
  duration,
  price,
  color = '#8B5CF6',
  modules = [],
  participantsCount = 0,
  onEdit,
  onDelete
}) => {
  const navigate = useNavigate();
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Actif':
        return 'bg-green-100 text-green-800';
      case 'Inactif':
        return 'bg-red-100 text-red-800';
      case 'Brouillon':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level: string) => {
    const colors = {
      'BAC+1': 'bg-purple-100 text-purple-800',
      'BAC+2': 'bg-blue-100 text-blue-800',
      'BAC+3': 'bg-green-100 text-green-800',
      'BAC+4': 'bg-orange-100 text-orange-800',
      'BAC+5': 'bg-red-100 text-red-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const uniqueInstructors = modules.flatMap(module => 
    (module.module_instructors || []).map(mi => mi.instructor)
  ).reduce((acc, instructor) => {
    if (!acc.find(i => i.id === instructor.id)) {
      acc.push(instructor);
    }
    return acc;
  }, [] as Array<{ id: string; first_name: string; last_name: string; }>);

  const handleViewDetail = () => {
    navigate(`/formations/${id}`);
  };

  const handleViewParticipants = () => {
    setIsParticipantsModalOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 group">
        {/* Barre de couleur en haut */}
        <div 
          className="h-2 rounded-t-xl" 
          style={{ backgroundColor: color }}
        />
        
        <div className="p-4">
          {/* Header avec actions */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(level)}`}>
                  {level}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
                  {status}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
              {description && (
                <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
              )}
            </div>
            
            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Informations principales */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <span>Du {new Date(start_date).toLocaleDateString()} au {new Date(end_date).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2 text-gray-400" />
              <span>{duration}h de formation</span>
            </div>
          </div>

          {/* Modules */}
          <div className="border-t border-gray-100 pt-3 mb-3">
            <div className="flex items-center text-sm text-gray-600">
              <BookOpen className="h-4 w-4 mr-2 text-gray-400" />
              <span>{modules.length} module{modules.length > 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Formateurs */}
          {uniqueInstructors.length > 0 && (
            <div className="border-t border-gray-100 pt-3 mb-3">
              <span className="text-sm font-medium text-gray-700">
                <User className="h-4 w-4 inline mr-1" />
                Formateurs:
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {uniqueInstructors.slice(0, 2).map(instructor => (
                  <span 
                    key={instructor.id}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                  >
                    {instructor.first_name} {instructor.last_name}
                  </span>
                ))}
                {uniqueInstructors.length > 2 && (
                  <span className="text-xs text-gray-500">
                    +{uniqueInstructors.length - 2} autre(s)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={handleViewParticipants}
              className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Users className="h-4 w-4 mr-2" />
              Voir les participants ({participantsCount})
            </button>
            <button
              onClick={handleViewDetail}
              className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ backgroundColor: color }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir détail
            </button>
          </div>
        </div>
      </div>

      {/* Participants Modal */}
      <FormationParticipantsModal
        isOpen={isParticipantsModalOpen}
        onClose={() => setIsParticipantsModalOpen(false)}
        formationId={id}
        formationTitle={title}
        formationColor={color}
      />
    </>
  );
};

// Helper functions
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Actif':
      return 'bg-green-100 text-green-800';
    case 'Inactif':
      return 'bg-red-100 text-red-800';
    case 'Brouillon':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getLevelColor = (level: string) => {
  const colors = {
    'BAC+1': 'bg-purple-100 text-purple-800',
    'BAC+2': 'bg-blue-100 text-blue-800',
    'BAC+3': 'bg-green-100 text-green-800',
    'BAC+4': 'bg-orange-100 text-orange-800',
    'BAC+5': 'bg-red-100 text-red-800'
  };
  return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export default FormationCard;
