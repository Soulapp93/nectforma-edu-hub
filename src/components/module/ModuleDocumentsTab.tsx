
import React, { useState, useEffect } from 'react';
import { Plus, FileText, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { moduleDocumentService, ModuleDocument } from '@/services/moduleDocumentService';
import CreateDocumentModal from './CreateDocumentModal';

interface ModuleDocumentsTabProps {
  moduleId: string;
}

const ModuleDocumentsTab: React.FC<ModuleDocumentsTabProps> = ({ moduleId }) => {
  const [documents, setDocuments] = useState<ModuleDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

  const handleDelete = async (documentId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      try {
        await moduleDocumentService.deleteDocument(documentId);
        fetchDocuments();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels = {
      'article': 'Article',
      'support': 'Support',
      'reference': 'Référence',
      'autre': 'Autre'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getDocumentTypeColor = (type: string) => {
    const colors = {
      'article': 'bg-blue-100 text-blue-800',
      'support': 'bg-green-100 text-green-800',
      'reference': 'bg-purple-100 text-purple-800',
      'autre': 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
          <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un document
          </Button>
        </div>
      </div>

      <div className="p-6">
        {documents.length > 0 ? (
          <div className="space-y-4">
            {documents.map((document) => (
              <div key={document.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{document.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getDocumentTypeColor(document.document_type)}`}>
                          {getDocumentTypeLabel(document.document_type)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span>{document.file_name}</span>
                        {document.file_size && (
                          <span className="ml-2">({Math.round(document.file_size / 1024)} KB)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(document.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                {document.description && (
                  <p className="text-gray-600 text-sm mt-2 ml-14">{document.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun document</h3>
            <p className="text-gray-600 mb-4">Ce module n'a pas encore de documents.</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter le premier document
            </Button>
          </div>
        )}
      </div>

      <CreateDocumentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        moduleId={moduleId}
        onSuccess={fetchDocuments}
      />
    </div>
  );
};

export default ModuleDocumentsTab;
