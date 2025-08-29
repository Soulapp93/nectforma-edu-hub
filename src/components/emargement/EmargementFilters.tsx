
import React from 'react';

interface Formation {
  id: number;
  name: string;
  level: string;
}

interface EmargementFiltersProps {
  formations: Formation[];
  selectedFormation: string;
  onFormationChange: (value: string) => void;
}

const EmargementFilters: React.FC<EmargementFiltersProps> = ({
  formations,
  selectedFormation,
  onFormationChange
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Formation</label>
          <select 
            value={selectedFormation}
            onChange={(e) => onFormationChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Toutes les formations</option>
            {formations.map(formation => (
              <option key={formation.id} value={formation.id}>
                {formation.name} ({formation.level})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
            <option value="">Tous les statuts</option>
            <option value="termine">Terminé</option>
            <option value="en-cours">En cours</option>
            <option value="programme">Programmé</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default EmargementFilters;
