
import React from 'react';
import { Users, BookOpen, User, Clock } from 'lucide-react';

interface FormationCardProps {
  id: number;
  title: string;
  level: string;
  students: number;
  modules: number;
  instructor: string;
  status: 'Actif' | 'Inactif' | 'Brouillon';
  color: string;
  description?: string;
  duration?: string;
  maxStudents?: string;
}

const FormationCard: React.FC<FormationCardProps> = ({
  title,
  level,
  students,
  modules,
  instructor,
  status,
  color,
  description,
  duration,
  maxStudents
}) => {
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-32 relative" style={{ backgroundColor: color }}>
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="font-semibold text-lg mb-1">{level}</h3>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="font-semibold text-gray-900 mb-2 text-lg">{title}</h3>
        {description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>
        )}
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2" />
            {students} étudiant{students > 1 ? 's' : ''} inscrit{students > 1 ? 's' : ''}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <BookOpen className="h-4 w-4 mr-2" />
            {modules} module{modules > 1 ? 's' : ''}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <User className="h-4 w-4 mr-2" />
            {instructor}
          </div>
          {duration && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              {duration}h de formation
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
            Voir détails
          </button>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">
              Modifier
            </button>
            <button className="px-3 py-1 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Gérer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormationCard;
