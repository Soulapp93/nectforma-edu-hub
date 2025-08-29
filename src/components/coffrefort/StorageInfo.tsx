
import React from 'react';

interface StorageInfoProps {
  storageUsed: number;
  storageTotal: number;
}

const StorageInfo: React.FC<StorageInfoProps> = ({ storageUsed, storageTotal }) => {
  const storagePercentage = (storageUsed / storageTotal) * 100;

  return (
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
  );
};

export default StorageInfo;
