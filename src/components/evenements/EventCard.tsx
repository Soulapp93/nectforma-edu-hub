import React from 'react';
import { Users, Calendar, FileText, Eye } from 'lucide-react';

interface EventCardProps {
  id: string;
  title: string;
  description: string;
  formation_ids?: string[];
  audiences?: string[];
  file_urls?: string[];
  created_at: string;
  onView: (eventId: string) => void;
}

const EventCard: React.FC<EventCardProps> = ({
  id,
  title,
  description,
  formation_ids = [],
  audiences = [],
  file_urls = [],
  created_at,
  onView
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-24 bg-gradient-to-r from-purple-500 to-purple-600 relative flex items-center justify-center">
        <div className="text-white text-center">
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
      </div>
      
      <div className="p-4">
        <div className="mb-3">
          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
            {description || 'Aucune description disponible'}
          </p>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>Créé le {formatDate(created_at)}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>
              {audiences.length > 0 
                ? audiences.join(', ') 
                : 'Toutes les audiences'
              }
            </span>
          </div>
          
          {file_urls.length > 0 && (
            <div className="flex items-center text-sm text-gray-600">
              <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{file_urls.length} fichier{file_urls.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {formation_ids.length > 0 
              ? `${formation_ids.length} formation${formation_ids.length > 1 ? 's' : ''}`
              : 'Toutes les formations'
            }
          </div>
          <button 
            onClick={() => onView(id)}
            className="flex items-center px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Eye className="h-4 w-4 mr-1" />
            Voir détails
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;