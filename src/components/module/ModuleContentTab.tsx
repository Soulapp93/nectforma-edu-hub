import React, { useState, useEffect } from 'react';
import { Plus, FileText, ExternalLink, Edit, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { moduleContentService, ModuleContent } from '@/services/moduleContentService';
import CreateContentModal from './CreateContentModal';
import { toast } from 'sonner';

interface ModuleContentTabProps {
  moduleId: string;
}

const ModuleContentTab: React.FC<ModuleContentTabProps> = ({ moduleId }) => {
  const [contents, setContents] = useState<ModuleContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<ModuleContent | null>(null);

  const fetchContents = async () => {
    try {
      const data = await moduleContentService.getModuleContents(moduleId);
      setContents(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement du contenu:', error);
      toast.error('Erreur lors du chargement du contenu');
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
    toast.success('Contenu ajouté avec succès');
  };

  const handleEditSuccess = () => {
    fetchContents();
    setShowEditModal(null);
    toast.success('Contenu modifié avec succès');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce contenu ?')) {
      try {
        await moduleContentService.deleteContent(id);
        fetchContents();
        toast.success('Contenu supprimé avec succès');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleOpenFile = (fileUrl: string, fileName: string) => {
    try {
      const extension = fileName.split('.').pop()?.toLowerCase();
      
      // Détecter si c'est un lien YouTube
      if (fileUrl.includes('youtube.com') || fileUrl.includes('youtu.be')) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Ouverture de la vidéo YouTube');
        return;
      }
      
      // Pour les fichiers Office, utiliser Office Online Viewer
      if (extension === 'docx' || extension === 'doc') {
        const officeUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`;
        const link = document.createElement('a');
        link.href = officeUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Ouverture dans Word Online');
        return;
      }
      
      if (extension === 'xlsx' || extension === 'xls') {
        const officeUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`;
        const link = document.createElement('a');
        link.href = officeUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Ouverture dans Excel Online');
        return;
      }
      
      if (extension === 'pptx' || extension === 'ppt') {
        const officeUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`;
        const link = document.createElement('a');
        link.href = officeUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Ouverture dans PowerPoint Online');
        return;
      }
      
      // Pour tous les autres fichiers (PDF, images, vidéos, audio), ouvrir directement dans le navigateur
      const link = document.createElement('a');
      link.href = fileUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Ouverture du fichier');
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du fichier:', error);
      toast.error('Erreur lors de l\'ouverture du fichier');
    }
  };

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    try {
      // Créer un lien de téléchargement
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Téléchargement démarré');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleEdit = (content: ModuleContent) => {
    setShowEditModal(content);
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'cours': return 'bg-blue-100 text-blue-800';
      case 'support': return 'bg-green-100 text-green-800';
      case 'video': return 'bg-purple-100 text-purple-800';
      case 'document': return 'bg-orange-100 text-orange-800';
      case 'devoir': return 'bg-red-100 text-red-800';
      case 'evaluation': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'ppt':
      case 'pptx':
        return '📊';
      case 'xls':
      case 'xlsx':
        return '📈';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      default:
        return '📎';
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
          Ajouter un élément
        </Button>
      </div>

      {contents.length > 0 ? (
        <div className="space-y-4">
          {contents.map((content) => (
            <div key={content.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {content.file_name && (
                      <span className="text-2xl">{getFileIcon(content.file_name)}</span>
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900">{content.title}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${getContentTypeColor(content.content_type)}`}>
                          {content.content_type}
                        </span>
                      </div>
                    </div>
                  </div>
                  {content.description && (
                    <p className="text-gray-600 text-sm mb-3 ml-11">{content.description}</p>
                  )}
                  {content.file_name && (
                    <div className="flex items-center text-sm text-gray-500 ml-11">
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
                        onClick={() => handleOpenFile(content.file_url, content.file_name || 'fichier')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Ouvrir
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
                  
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleEdit(content)}
                  >
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

      {showEditModal && (
        <CreateContentModal
          isOpen={!!showEditModal}
          onClose={() => setShowEditModal(null)}
          moduleId={moduleId}
          onSuccess={handleEditSuccess}
          editContent={showEditModal}
        />
      )}
    </div>
  );
};

export default ModuleContentTab;
