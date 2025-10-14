import React, { useState, useEffect } from 'react';
import { Plus, FileText, Eye, Trash2, Download, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { moduleDocumentService, ModuleDocument } from '@/services/moduleDocumentService';
import CreateDocumentModal from './CreateDocumentModal';
import ModuleFileViewerModal from './ModuleFileViewerModal';
import { toast } from 'sonner';

interface ModuleDocumentsTabProps {
  moduleId: string;
}

const ModuleDocumentsTab: React.FC<ModuleDocumentsTabProps> = ({ moduleId }) => {
  const [documents, setDocuments] = useState<ModuleDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<ModuleDocument | null>(null);
  const [viewerFile, setViewerFile] = useState<{ url: string; name: string } | null>(null);

  const fetchDocuments = async () => {
    try {
      const data = await moduleDocumentService.getModuleDocuments(moduleId);
      setDocuments(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      toast.error('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [moduleId]);

  const handleCreateSuccess = () => {
    fetchDocuments();
    setShowCreateModal(false);
    toast.success('Document ajouté avec succès');
  };

  const handleEditSuccess = () => {
    fetchDocuments();
    setShowEditModal(null);
    toast.success('Document modifié avec succès');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      try {
        await moduleDocumentService.deleteDocument(id);
        fetchDocuments();
        toast.success('Document supprimé avec succès');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleOpenFile = (fileUrl: string, fileName: string) => {
    // Ouvrir le visualiseur intégré pour éviter les blocages Chrome
    setViewerFile({ url: fileUrl, name: fileName });
  };

  const handleDownloadDocument = async (fileUrl: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Téléchargement démarré');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleEdit = (document: ModuleDocument) => {
    setShowEditModal(document);
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'article': return 'bg-blue-100 text-blue-800';
      case 'support': return 'bg-green-100 text-green-800';
      case 'reference': return 'bg-purple-100 text-purple-800';
      case 'autre': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    return (size / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
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
        <h2 className="text-xl font-semibold">Documents</h2>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un document
        </Button>
      </div>

      {documents.length > 0 ? (
        <div className="space-y-4">
          {documents.map((document) => (
            <div key={document.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{getFileIcon(document.file_name)}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">{document.title}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${getDocumentTypeColor(document.document_type)}`}>
                          {document.document_type}
                        </span>
                      </div>
                    </div>
                  </div>
                  {document.description && (
                    <p className="text-gray-600 text-sm mb-3 ml-11">{document.description}</p>
                  )}
                  <div className="flex items-center text-sm text-gray-500 space-x-4 ml-11">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      <span>{document.file_name}</span>
                    </div>
                    {document.file_size && (
                      <span>{formatFileSize(document.file_size)}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => handleOpenFile(document.file_url, document.file_name)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Visualiser
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDownloadDocument(document.file_url, document.file_name)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Télécharger
                  </Button>

                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleEdit(document)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-red-600"
                    onClick={() => handleDelete(document.id)}
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun document</h3>
          <p className="text-gray-600">Aucun document n'a encore été ajouté à ce module.</p>
        </div>
      )}

      {showCreateModal && (
        <CreateDocumentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          moduleId={moduleId}
          onSuccess={handleCreateSuccess}
        />
      )}

      {showEditModal && (
        <CreateDocumentModal
          isOpen={!!showEditModal}
          onClose={() => setShowEditModal(null)}
          moduleId={moduleId}
          onSuccess={handleEditSuccess}
          editDocument={showEditModal}
        />
      )}

      {viewerFile && (
        <ModuleFileViewerModal
          isOpen={!!viewerFile}
          onClose={() => setViewerFile(null)}
          fileUrl={viewerFile.url}
          fileName={viewerFile.name}
        />
      )}
    </div>
  );
};

export default ModuleDocumentsTab;
