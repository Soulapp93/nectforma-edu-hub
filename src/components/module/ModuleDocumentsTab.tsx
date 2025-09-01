
import React, { useState, useEffect } from 'react';
import { Plus, FileText, Eye, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { moduleDocumentService, ModuleDocument } from '@/services/moduleDocumentService';
import CreateDocumentModal from './CreateDocumentModal';

interface ModuleDocumentsTabProps {
  moduleId: string;
}

const ModuleDocumentsTab: React.FC<ModuleDocumentsTabProps> = ({ moduleId }) => {
  const [documents, setDocuments] = useState<ModuleDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchDocuments = async () => {
    try {
      const data = await moduleDocumentService.getModuleDocuments(moduleId);
      setDocuments(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
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
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      try {
        await moduleDocumentService.deleteDocument(id);
        fetchDocuments();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleViewDocument = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  const handleDownloadDocument = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <div key={document.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-medium text-gray-900">{document.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getDocumentTypeColor(document.document_type)}`}>
                      {document.document_type}
                    </span>
                  </div>
                  {document.description && (
                    <p className="text-gray-600 text-sm mb-3">{document.description}</p>
                  )}
                  <div className="flex items-center text-sm text-gray-500 space-x-4">
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
                    variant="outline"
                    onClick={() => handleViewDocument(document.file_url)}
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
    </div>
  );
};

export default ModuleDocumentsTab;
