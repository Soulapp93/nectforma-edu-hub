import React, { useState } from 'react';
import { Users, Calendar, FileText, Eye, Edit, Trash2 } from 'lucide-react';
import FileViewerModal from './FileViewerModal';

interface EventCardProps {
  id: string;
  title: string;
  description: string;
  formation_ids?: string[];
  audiences?: string[];
  file_urls?: string[];
  created_at: string;
  created_by?: string;
  onView: (eventId: string) => void;
  onEdit?: (eventId: string) => void;
  onDelete?: (eventId: string) => void;
  isAdmin?: boolean;
  currentUserId?: string;
}

const EventCard: React.FC<EventCardProps> = ({
  id,
  title,
  description,
  formation_ids = [],
  audiences = [],
  file_urls = [],
  created_at,
  created_by,
  onView,
  onEdit,
  onDelete,
  isAdmin = false,
  currentUserId
}) => {
  const [selectedFile, setSelectedFile] = useState<{url: string, name: string} | null>(null);
  
  // Vérifier si l'utilisateur peut modifier/supprimer l'événement
  const canEdit = isAdmin || created_by === currentUserId;
  
  // Debug logs pour traquer les file_urls et permissions
  console.log(`EventCard ${id} - Rendering with file_urls:`, file_urls);
  console.log(`EventCard ${id} - file_urls length:`, file_urls?.length || 0);
  console.log(`EventCard ${id} - isAdmin:`, isAdmin, 'created_by:', created_by, 'currentUserId:', currentUserId, 'canEdit:', canEdit);
  
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
        {canEdit && (
          <div className="absolute top-2 right-2 flex space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(id);
              }}
              className="p-1.5 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
              title="Modifier"
            >
              <Edit className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(id);
              }}
              className="p-1.5 bg-white/20 text-white rounded-full hover:bg-red-500 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
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
          
          {file_urls.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Fichiers joints:</span>
              </div>
              <div className="ml-6 space-y-1">
                {file_urls.map((fileUrl, index) => {
                  // Extraire un nom de fichier plus descriptif basé sur l'URL
                  let fileName = `Fichier ${index + 1}`;
                  
                  if (fileUrl.includes('dummy.pdf')) {
                    fileName = 'Programme de la conférence.pdf';
                  } else if (fileUrl.includes('file_example_JPG')) {
                    fileName = 'Image promotionnelle.jpg';
                  } else if (fileUrl.includes('sample-pdf-file.pdf')) {
                    fileName = 'Brochure établissement.pdf';
                  } else if (fileUrl.includes('sample.pdf')) {
                    fileName = 'Règlement cérémonie.pdf';
                  } else if (fileUrl.includes('placeholder')) {
                    fileName = 'Programme événement.png';
                  }
                  
                  return (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile({url: fileUrl, name: fileName});
                      }}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      <span>{fileName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end">
          <button 
            onClick={() => onView(id)}
            className="flex items-center px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Eye className="h-4 w-4 mr-1" />
            Voir détails
          </button>
        </div>
      </div>

      {/* File Viewer Modal */}
      <FileViewerModal
        isOpen={selectedFile !== null}
        onClose={() => setSelectedFile(null)}
        fileUrl={selectedFile?.url || ''}
        fileName={selectedFile?.name || ''}
      />
    </div>
  );
};

export default EventCard;