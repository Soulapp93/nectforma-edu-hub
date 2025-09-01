
import React from 'react';
import { Edit, CheckCircle, Clock } from 'lucide-react';

interface ModuleCorrectionsTabProps {
  moduleId: string;
}

const ModuleCorrectionsTab: React.FC<ModuleCorrectionsTabProps> = ({ moduleId }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Corrections</h2>
      </div>

      <div className="p-6">
        <div className="text-center py-8">
          <Edit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune correction</h3>
          <p className="text-gray-600">Les corrections publiées apparaîtront ici.</p>
        </div>
      </div>
    </div>
  );
};

export default ModuleCorrectionsTab;
