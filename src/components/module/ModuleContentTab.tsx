
import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { moduleContentService, ModuleContent } from '@/services/moduleContentService';
import CreateContentModal from './CreateContentModal';

interface ModuleContentTabProps {
  moduleId: string;
}

const ModuleContentTab: React.FC<ModuleContentTabProps> = ({ moduleId }) => {
  const [contents, setContents] = useState<ModuleContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchContents = async () => {
    try {
      const data = await moduleContentService.getModuleContents(moduleId);
      setContents(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des contenus:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, [moduleId]);

  const handleDelete = async (contentId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce contenu ?')) {
      try {
        await moduleContentService.deleteContent(contentId);
        fetchContents();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'cours':
        return <BookOpen className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    const labels = {
      'cours': 'Cours',
      'support': 'Support',
      'video': 'Vidéo',
      'document': 'Document'
    };
    return labels[type as keyof typeof labels] || type;
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
          <h2 className="text-xl font-semibold text-gray-900">Contenus du module</h2>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter du contenu
          </Button>
        </div>
      </div>

      <div className="p-6">
        {contents.length > 0 ? (
          <div className="space-y-4">
            {contents.map((content) => (
              <div key={content.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                      {getContentTypeIcon(content.content_type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{content.title}</h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {getContentTypeLabel(content.content_type)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Visualiser
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(content.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                {content.description && (
                  <p className="text-gray-600 text-sm mt-2 ml-14">{content.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun contenu</h3>
            <p className="text-gray-600 mb-4">Ce module n'a pas encore de contenu.</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter le premier contenu
            </Button>
          </div>
        )}
      </div>

      <CreateContentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        moduleId={moduleId}
        onSuccess={fetchContents}
      />
    </div>
  );
};

export default ModuleContentTab;
