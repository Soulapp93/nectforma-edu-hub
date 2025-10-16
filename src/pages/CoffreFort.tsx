import React, { useState } from 'react';
import { FileText, Folder, Upload, Download, Trash2, Eye, Share, Plus, ArrowLeft, Filter, X, RefreshCw } from 'lucide-react';
import FoldersGrid from '../components/coffrefort/FoldersGrid';
import FileUploadModal from '../components/coffrefort/FileUploadModal';
import CreateFolderModal from '../components/coffrefort/CreateFolderModal';
import FileViewerModal from '../components/coffrefort/FileViewerModal';
import { useDigitalSafe } from '@/hooks/useDigitalSafe';
import { DigitalSafeFile } from '@/services/digitalSafeService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { regenerateCoffreFortUrls } from '@/utils/regenerateCoffreFortUrls';
import { toast } from 'sonner';

const CoffreFort = () => {
  const {
    folders,
    files,
    currentFolder,
    setCurrentFolder,
    loading,
    loadData,
    deleteFile,
    deleteFolder,
    downloadFile
  } = useDigitalSafe();

  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'folders' | 'files'>('folders');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [selectedFileForView, setSelectedFileForView] = useState<DigitalSafeFile | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [fileTypeFilter, setFileTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerateUrls = async () => {
    if (!confirm('Voulez-vous régénérer les URLs de tous les fichiers ? Cette opération peut prendre quelques instants.')) {
      return;
    }

    setIsRegenerating(true);
    toast.info('Régénération des URLs en cours...');

    try {
      const result = await regenerateCoffreFortUrls();
      
      if (result.success) {
        toast.success(`✅ ${result.updated} fichier(s) mis à jour avec succès !`);
        // Recharger les données
        await loadData();
      } else {
        toast.warning(`⚠️ ${result.updated} fichier(s) mis à jour, ${result.errors} erreur(s)`);
      }
    } catch (error) {
      console.error('Erreur régénération:', error);
      toast.error('Erreur lors de la régénération des URLs');
    } finally {
      setIsRegenerating(false);
    }
  };

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

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.original_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !fileTypeFilter || getFileTypeFromName(file.original_name) === fileTypeFilter;
    const matchesDate = !dateFilter || (() => {
      const fileDate = new Date(file.updated_at);
      const today = new Date();
      switch(dateFilter) {
        case 'today': return fileDate.toDateString() === today.toDateString();
        case 'week': return (today.getTime() - fileDate.getTime()) / (1000 * 3600 * 24) <= 7;
        case 'month': return (today.getTime() - fileDate.getTime()) / (1000 * 3600 * 24) <= 30;
        default: return true;
      }
    })();
    const matchesSize = !sizeFilter || (() => {
      const sizeMB = file.file_size / (1024 * 1024);
      switch(sizeFilter) {
        case 'small': return sizeMB < 1;
        case 'medium': return sizeMB >= 1 && sizeMB < 10;
        case 'large': return sizeMB >= 10;
        default: return true;
      }
    })();
    
    return matchesSearch && matchesType && matchesDate && matchesSize;
  });

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

  const currentFolderData = folders.find(f => f.id === currentFolder);
  const uniqueFileTypes = [...new Set(files.map(file => getFileTypeFromName(file.original_name)))];

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
          <div className="flex items-center space-x-4">
            {currentFolder && (
              <button 
                onClick={() => setCurrentFolder(null)}
                className="flex items-center text-purple-600 hover:text-purple-700"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Retour
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {currentFolder && currentFolderData 
                  ? currentFolderData.name 
                  : 'Coffre-fort numérique'
                }
              </h1>
              <p className="text-gray-600">
                {currentFolder 
                  ? 'Contenu du dossier' 
                  : 'Stockage sécurisé de vos documents importants'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {(activeTab === 'folders' || currentFolder) && !currentFolder && (
              <button 
                onClick={() => setShowCreateFolderModal(true)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau dossier
              </button>
            )}
            {!currentFolder && files.length > 0 && (
              <button 
                onClick={handleRegenerateUrls}
                disabled={isRegenerating}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Régénérer les URLs des anciens fichiers"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                {isRegenerating ? 'Mise à jour...' : 'Réparer URLs'}
              </button>
            )}
            <button 
              onClick={() => setShowUploadModal(true)}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importer des fichiers
            </button>
          </div>
        </div>
      </div>

      {!currentFolder && (
        <div className="mb-6">
          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('folders')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'folders'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Folder className="h-4 w-4 inline mr-2" />
              Dossiers
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'files'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Fichiers
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder={`Rechercher ${activeTab === 'folders' ? 'des dossiers' : 'des fichiers'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            {activeTab === 'files' && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-3 py-2 border rounded-lg transition-colors ${
                  showFilters || fileTypeFilter || dateFilter || sizeFilter
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </button>
            )}
          </div>
          
          {activeTab === 'files' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100'}`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100'}`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Filtres avancés */}
        {activeTab === 'files' && showFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de fichier</label>
                <select
                  value={fileTypeFilter}
                  onChange={(e) => setFileTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Tous les types</option>
                  {uniqueFileTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date de modification</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Toutes les dates</option>
                  <option value="today">Aujourd'hui</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Taille</label>
                <select
                  value={sizeFilter}
                  onChange={(e) => setSizeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Toutes les tailles</option>
                  <option value="small">Petit (&lt; 1 MB)</option>
                  <option value="medium">Moyen (1-10 MB)</option>
                  <option value="large">Grand (&gt; 10 MB)</option>
                </select>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  setFileTypeFilter('');
                  setDateFilter('');
                  setSizeFilter('');
                  setShowFilters(false);
                }}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Effacer les filtres
              </button>
            </div>
          </div>
        )}

        {/* Actions sélection multiple */}
        {activeTab === 'files' && selectedFiles.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-700 font-medium">
                {selectedFiles.length} fichier(s) sélectionné(s)
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownloadSelected}
                  className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </button>
                <button
                  onClick={() => setSelectedFiles([])}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contenu principal */}
      {(activeTab === 'folders' || currentFolder) && !currentFolder && (
        <FoldersGrid 
          folders={folders.filter(folder => 
            folder.name.toLowerCase().includes(searchTerm.toLowerCase())
          ).map(folder => ({
            id: folder.id,
            name: folder.name,
            icon: Folder,
            files: 0,
            size: '0 MB'
          }))} 
          onFolderClick={(folderId) => {
            setCurrentFolder(folderId);
            setActiveTab('files');
          }}
          onDeleteFolder={deleteFolder}
        />
      )}

      {(activeTab === 'files' || currentFolder) && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {currentFolder ? 'Fichiers du dossier' : 'Tous les fichiers'}
            </h2>
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
                        checked={selectedFiles.length === files.length && files.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taille</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modifié</th>
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
      )}

      {/* Modals */}
      <FileUploadModal 
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        folderId={currentFolder || undefined}
        onSuccess={() => {
          console.log('Upload réussi, rechargement des données...');
          loadData();
        }}
      />

      <CreateFolderModal
        open={showCreateFolderModal}
        onOpenChange={setShowCreateFolderModal}
        parentId={currentFolder || undefined}
        onSuccess={() => {
          console.log('Dossier créé, rechargement des données...');
          loadData();
        }}
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