
import React, { useState } from 'react';
import { FileText, Folder, Upload, Download, Trash2, Eye, Share, Lock, Plus, Search, Filter } from 'lucide-react';

const CoffreFort = () => {
  const [currentFolder, setCurrentFolder] = useState('root');
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const folders = [
    { id: 1, name: 'Documents administratifs', icon: Folder, files: 12, size: '45 MB' },
    { id: 2, name: 'Formations', icon: Folder, files: 28, size: '156 MB' },
    { id: 3, name: 'Évaluations', icon: Folder, files: 15, size: '23 MB' },
    { id: 4, name: 'Ressources pédagogiques', icon: Folder, files: 42, size: '287 MB' }
  ];

  const files = [
    {
      id: 1,
      name: 'Règlement intérieur 2024.pdf',
      type: 'PDF',
      size: '2.3 MB',
      modified: '2024-01-15',
      owner: 'Admin Nect',
      shared: true,
      icon: FileText
    },
    {
      id: 2,
      name: 'Programme Marketing Digital.docx',
      type: 'DOCX',
      size: '1.8 MB',
      modified: '2024-01-12',
      owner: 'Formateur Prof',
      shared: false,
      icon: FileText
    },
    {
      id: 3,
      name: 'Certificat formation Photoshop.pdf',
      type: 'PDF',
      size: '856 KB',
      modified: '2024-01-10',
      owner: 'Sangare Souleymane',
      shared: false,
      icon: FileText
    },
    {
      id: 4,
      name: 'Présentation communication digitale.pptx',
      type: 'PPTX',
      size: '4.2 MB',
      modified: '2024-01-08',
      owner: 'Formateur Communication',
      shared: true,
      icon: FileText
    },
    {
      id: 5,
      name: 'Évaluation finale - Marketing.xlsx',
      type: 'XLSX',
      size: '1.1 MB',
      modified: '2024-01-05',
      owner: 'Admin Nect',
      shared: false,
      icon: FileText
    }
  ];

  const storageUsed = 512; // MB
  const storageTotal = 3000; // MB (3 GB for Basic plan)
  const storagePercentage = (storageUsed / storageTotal) * 100;

  const handleSelectFile = (fileId: number) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    setSelectedFiles(selectedFiles.length === files.length ? [] : files.map(f => f.id));
  };

  const getFileTypeColor = (type: string) => {
    const colors = {
      'PDF': 'bg-red-100 text-red-800',
      'DOCX': 'bg-blue-100 text-blue-800',
      'XLSX': 'bg-green-100 text-green-800',
      'PPTX': 'bg-orange-100 text-orange-800',
      'IMG': 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Coffre-fort numérique</h1>
            <p className="text-gray-600">Stockage sécurisé de vos documents importants</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau dossier
            </button>
            <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              <Upload className="h-4 w-4 mr-2" />
              Importer des fichiers
            </button>
          </div>
        </div>

        {/* Storage Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Espace de stockage</h2>
            <span className="text-sm text-gray-500">Plan Basic - 3 Go</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-purple-600 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${storagePercentage}%` }}
                ></div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {storageUsed} MB / {storageTotal} MB ({storagePercentage.toFixed(1)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher dans vos fichiers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:bg-gray-100'}`}
            >
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
              </div>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:bg-gray-100'}`}
            >
              <div className="w-4 h-4 flex flex-col space-y-1">
                <div className="bg-current h-0.5 rounded"></div>
                <div className="bg-current h-0.5 rounded"></div>
                <div className="bg-current h-0.5 rounded"></div>
              </div>
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedFiles.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <span className="text-sm text-purple-700 font-medium">
              {selectedFiles.length} fichier(s) sélectionné(s)
            </span>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg">
                <Download className="h-4 w-4" />
              </button>
              <button className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg">
                <Share className="h-4 w-4" />
              </button>
              <button className="p-2 text-red-600 hover:bg-red-100 rounded-lg">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Folders */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Dossiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {folders.map((folder) => {
            const Icon = folder.icon;
            return (
              <div key={folder.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">{folder.name}</h3>
                <div className="text-sm text-gray-500">
                  <div>{folder.files} fichiers</div>
                  <div>{folder.size}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Files */}
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
              const Icon = file.icon;
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
                      <Icon className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex items-center space-x-1">
                      {file.shared && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" title="Partagé"></div>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getFileTypeColor(file.type)}`}>
                        {file.type}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2 text-sm line-clamp-2">{file.name}</h3>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>{file.size}</div>
                    <div>Modifié le {file.modified}</div>
                    <div>Par {file.owner}</div>
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
                  const Icon = file.icon;
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
                            <Icon className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{file.name}</div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getFileTypeColor(file.type)}`}>
                                {file.type}
                              </span>
                              {file.shared && (
                                <span className="text-xs text-green-600 font-medium">Partagé</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{file.size}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{file.modified}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{file.owner}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-purple-600 hover:text-purple-900 p-1">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-blue-600 hover:text-blue-900 p-1">
                            <Download className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900 p-1">
                            <Share className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900 p-1">
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
      </div>

      {/* Empty State */}
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
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium">
                Importer des fichiers
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoffreFort;
