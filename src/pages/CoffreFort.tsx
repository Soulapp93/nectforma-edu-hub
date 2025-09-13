import React, { useState } from 'react';
import { FileText, Folder, Upload, Download, Trash2, Eye, Share, Plus } from 'lucide-react';
import StorageInfo from '../components/coffrefort/StorageInfo';
import FileFilters from '../components/coffrefort/FileFilters';
import FoldersGrid from '../components/coffrefort/FoldersGrid';
import FileUploadModal from '../components/coffrefort/FileUploadModal';
import CreateFolderModal from '../components/coffrefort/CreateFolderModal';
import FileViewerModal from '../components/coffrefort/FileViewerModal';
import { useDigitalSafe } from '@/hooks/useDigitalSafe';
import { DigitalSafeFile } from '@/services/digitalSafeService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const CoffreFort = () => {
  const {
    folders,
    files,
    currentFolder,
    setCurrentFolder,
    loading,
    storageInfo,
    loadData,
    deleteFile,
    deleteFolder,
    downloadFile
  } = useDigitalSafe();

  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [selectedFileForView, setSelectedFileForView] = useState<DigitalSafeFile | null>(null);

  const handleSelectFile = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    setSelectedFiles(selectedFiles.length === files.length ? [] : files.map(f => f.id));
  };

  const getFileTypeFromName = (name: string) => {
    const extension = name.split('.').pop()?.toUpperCase() || '';
    return extension;
  };

  const getFileTypeColor = (type: string) => {
    const colors = {
      'PDF': 'bg-red-100 text-red-800',
      'DOCX': 'bg-blue-100 text-blue-800',
      'DOC': 'bg-blue-100 text-blue-800',
      'XLSX': 'bg-green-100 text-green-800',
      'XLS': 'bg-green-100 text-green-800',
      'PPTX': 'bg-orange-100 text-orange-800',
      'PPT': 'bg-orange-100 text-orange-800',
      'JPG': 'bg-purple-100 text-purple-800',
      'JPEG': 'bg-purple-100 text-purple-800',
      'PNG': 'bg-purple-100 text-purple-800',
      'GIF': 'bg-purple-100 text-purple-800',
      'TXT': 'bg-gray-100 text-gray-800',
      'MD': 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
  };

  const filteredFiles = files.filter(file =>
    file.original_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteSelected = async () => {
    if (selectedFiles.length === 0) return;
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedFiles.length} fichier(s) ?`)) {
      try {
        await Promise.all(selectedFiles.map(fileId => deleteFile(fileId)));
        setSelectedFiles([]);
      } catch (error) {
        console.error('Erreur suppression multiple:', error);
      }
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedFiles.length === 0) return;
    
    try {
      const filesToDownload = files.filter(file => selectedFiles.includes(file.id));
      for (const file of filesToDownload) {
        await downloadFile(file);
      }
    } catch (error) {
      console.error('Erreur téléchargement multiple:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Coffre-fort numérique</h1>
            <p className="text-gray-600">Stockage sécurisé de vos documents importants</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowCreateFolderModal(true)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau dossier
            </button>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importer des fichiers
            </button>
          </div>
        </div>

        <StorageInfo 
          storageUsed={Math.round(storageInfo.used / (1024 * 1024))} 
          storageTotal={Math.round(storageInfo.total / (1024 * 1024))} 
        />
      </div>

      <FileFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedFiles={selectedFiles}
        onSelectAll={handleSelectAll}
        filesCount={files.length}
        onDownloadSelected={handleDownloadSelected}
        onDeleteSelected={handleDeleteSelected}
      />

      <FoldersGrid 
        folders={folders.map(folder => ({
          id: folder.id,
          name: folder.name,
          icon: Folder,
          files: 0, // TODO: compter les fichiers dans le dossier
          size: '0 MB' // TODO: calculer la taille
        }))} 
        onFolderClick={(folderId) => setCurrentFolder(folderId)}
        onDeleteFolder={deleteFolder}
      />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Fichiers récents</h2>
          {files.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              {selectedFiles.length === files.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          )}
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map((file) => {
              const fileType = getFileTypeFromName(file.original_name);
              return (
                <div 
                  key={file.id} 
                  className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer ${
                    selectedFiles.includes(file.id) ? 'ring-2 ring-purple-500 bg-purple-50' : ''
                  }`}
                  onClick={() => handleSelectFile(file.id)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex items-center space-x-1">
                      {file.is_shared && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" title="Partagé"></div>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getFileTypeColor(fileType)}`}>
                        {fileType}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2 text-sm line-clamp-2">{file.original_name}</h3>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>{formatFileSize(file.file_size)}</div>
                    <div>Modifié le {formatDate(file.updated_at)}</div>
                  </div>
                  <div className="flex items-center space-x-1 mt-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFileForView(file);
                      }}
                      className="p-1 text-purple-600 hover:text-purple-900 rounded"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFile(file);
                      }}
                      className="p-1 text-blue-600 hover:text-blue-900 rounded"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
                          deleteFile(file.id);
                        }
                      }}
                      className="p-1 text-red-600 hover:text-red-900 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedFiles.length === files.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taille</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modifié</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Propriétaire</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFiles.map((file) => {
                  const fileType = getFileTypeFromName(file.original_name);
                  return (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={() => handleSelectFile(file.id)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                            <FileText className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{file.original_name}</div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getFileTypeColor(fileType)}`}>
                                {fileType}
                              </span>
                              {file.is_shared && (
                                <span className="text-xs text-green-600 font-medium">Partagé</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatFileSize(file.file_size)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(file.updated_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Moi</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => setSelectedFileForView(file)}
                            className="text-purple-600 hover:text-purple-900 p-1"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => downloadFile(file)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900 p-1">
                            <Share className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
                                deleteFile(file.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-900 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredFiles.length === 0 && (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'Aucun fichier trouvé' : 'Aucun fichier'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Essayez de modifier votre recherche.' 
                  : 'Commencez par importer vos premiers documents.'
                }
              </p>
              {!searchTerm && (
                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Importer des fichiers
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <FileUploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        folderId={currentFolder}
        onSuccess={loadData}
      />

      <CreateFolderModal
        open={showCreateFolderModal}
        onOpenChange={setShowCreateFolderModal}
        parentId={currentFolder}
        onSuccess={loadData}
      />

      <FileViewerModal
        open={!!selectedFileForView}
        onOpenChange={(open) => !open && setSelectedFileForView(null)}
        file={selectedFileForView}
      />
    </div>
  );
};

export default CoffreFort;
