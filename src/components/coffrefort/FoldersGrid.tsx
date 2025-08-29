
import React from 'react';
import { Folder, Eye } from 'lucide-react';

interface Folder {
  id: number;
  name: string;
  icon: React.ComponentType<any>;
  files: number;
  size: string;
}

interface FoldersGridProps {
  folders: Folder[];
}

const FoldersGrid: React.FC<FoldersGridProps> = ({ folders }) => {
  return (
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
  );
};

export default FoldersGrid;
