
import React, { useState } from 'react';
import { Upload, FileText, Download, Trash2, Eye, Search, Filter, FolderPlus, File, Image, Video } from 'lucide-react';

interface Material {
  id: number;
  name: string;
  type: 'pdf' | 'docx' | 'pptx' | 'mp4' | 'zip' | 'jpg' | 'png';
  size: string;
  uploadDate: string;
  category: string;
  uploader: string;
  downloads: number;
}

const Materials: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [materials, setMaterials] = useState<Material[]>([
    {
      id: 1,
      name: 'Présentation Marketing Digital.pdf',
      type: 'pdf',
      size: '2.4 MB',
      uploadDate: '2024-01-15',
      category: 'Marketing',
      uploader: 'Formateur Prof',
      downloads: 45
    },
    {
      id: 2,
      name: 'Exercices Photoshop.docx',
      type: 'docx',
      size: '1.8 MB',
      uploadDate: '2024-01-14',
      category: 'Design',
      uploader: 'Jean Martin',
      downloads: 32
    },
    {
      id: 3,
      name: 'Tutoriel Communication.mp4',
      type: 'mp4',
      size: '125 MB',
      uploadDate: '2024-01-12',
      category: 'Communication',
      uploader: 'Marie Dupont',
      downloads: 67
    },
    {
      id: 4,
      name: 'Templates Design.zip',
      type: 'zip',
      size: '45 MB',
      uploadDate: '2024-01-10',
      category: 'Design',
      uploader: 'Jean Martin',
      downloads: 28
    }
  ]);

  const categories = ['Marketing', 'Design', 'Communication', 'Développement', 'Business'];

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
      case 'docx':
      case 'pptx':
        return <FileText className="h-8 w-8" />;
      case 'mp4':
        return <Video className="h-8 w-8" />;
      case 'jpg':
      case 'png':
        return <Image className="h-8 w-8" />;
      default:
        return <File className="h-8 w-8" />;
    }
  };

  const getFileColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'bg-red-100 text-red-600';
      case 'docx':
        return 'bg-blue-100 text-blue-600';
      case 'pptx':
        return 'bg-orange-100 text-orange-600';
      case 'mp4':
        return 'bg-purple-100 text-purple-600';
      case 'zip':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-green-100 text-green-600';
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDeleteMaterial = (materialId: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      setMaterials(materials.filter(m => m.id !== materialId));
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Ressources pédagogiques</h3>
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <FolderPlus className="h-4 w-4 mr-2" />
            Nouveau dossier
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center text-sm">
            <Upload className="h-4 w-4 mr-2" />
            Ajouter des fichiers
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un document..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <div className="flex border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
            >
              Grille
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm border-l border-gray-300 ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
            >
              Liste
            </button>
          </div>
        </div>
      </div>

      {/* Materials */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredMaterials.map((material) => (
            <div key={material.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getFileColor(material.type)}`}>
                  {getFileIcon(material.type)}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDeleteMaterial(material.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <h4 className="font-medium text-gray-900 mb-2 line-clamp-2 text-sm">
                {material.name}
              </h4>
              
              <div className="space-y-1 mb-4">
                <p className="text-xs text-gray-500">{material.size}</p>
                <p className="text-xs text-gray-500">Par {material.uploader}</p>
                <p className="text-xs text-gray-500">{material.downloads} téléchargements</p>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-xs">
                  <Download className="h-3 w-3 mr-1 inline" />
                  Télécharger
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded-lg text-xs hover:bg-gray-50">
                  <Eye className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taille</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ajouté par</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMaterials.map((material) => (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getFileColor(material.type)}`}>
                          {getFileIcon(material.type)}
                        </div>
                        <span className="text-sm text-gray-900">{material.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.size}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.uploader}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.uploadDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-purple-600 hover:text-purple-900">
                          <Download className="h-4 w-4" />
                        </button>
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredMaterials.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || selectedCategory !== 'all' ? 'Aucun document trouvé' : 'Aucune ressource'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Essayez de modifier vos critères de recherche.' 
              : 'Ajoutez des ressources pédagogiques pour vos cours en ligne.'
            }
          </p>
          {(!searchTerm && selectedCategory === 'all') && (
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium">
              Ajouter une ressource
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Materials;
