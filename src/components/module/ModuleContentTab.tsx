
import React, { useState, useEffect } from 'react';
import { Plus, FileText, Eye, Edit, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { moduleContentService, ModuleContent } from '@/services/moduleContentService';
import CreateContentModal from './CreateContentModal';

interface ModuleContentTabProps {
  moduleId: string;
}

const ModuleContentTab: React.FC<ModuleContentTabProps> = ({ moduleId }) => {
  const [contents, setContents] = useState<ModuleContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchContents = async () => {
    try {
      const data = await moduleContentService.getModuleContents(moduleId);
      setContents(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement du contenu:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, [moduleId]);

  const handleCreateSuccess = () => {
    fetchContents();
    setShowCreateModal(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce contenu ?')) {
      try {
        await moduleContentService.deleteContent(id);
        fetchContents();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleViewFile = (fileUrl: string) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'cours': return 'bg-blue-100 text-blue-800';
      case 'support': return 'bg-green-100 text-green-800';
      case 'video': return 'bg-purple-100 text-purple-800';
      case 'document': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Contenu du Module</h2>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter du contenu
        </Button>
      </div>

      {contents.length > 0 ? (
        <div className="space-y-4">
          {contents.map((content) => (
            <div key={content.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-medium text-gray-900">{content.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getContentTypeColor(content.content_type)}`}>
                      {content.content_type}
                    </span>
                  </div>
                  {content.description && (
                    <p className="text-gray-600 text-sm mb-3">{content.description}</p>
                  )}
                  {content.file_name && (
                    <div className="flex items-center text-sm text-gray-500">
                      <FileText className="h-4 w-4 mr-1" />
                      <span>{content.file_name}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {content.file_url && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewFile(content.file_url)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Visualiser
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadFile(content.file_url, content.file_name || 'fichier')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Télécharger
                      </Button>
                    </>
                  )}
                  
                  <Button size="sm" variant="ghost">
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-red-600"
                    onClick={() => handleDelete(content.id)}
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun contenu</h3>
          <p className="text-gray-600">Aucun contenu n'a encore été ajouté à ce module.</p>
        </div>
      )}

      {showCreateModal && (
        <CreateContentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          moduleId={moduleId}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};

export default ModuleContentTab;
