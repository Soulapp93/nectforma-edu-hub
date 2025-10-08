import React from 'react';
import AttendanceImprovementsList from '@/components/emargement/AttendanceImprovementsList';

const AttendanceImprovements = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-8 px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Améliorations du Système d'Émargement</h1>
          <p className="text-blue-100">Détails des améliorations proposées pour moderniser le système existant.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <AttendanceImprovementsList />
      </div>
    </div>
  );
};

export default AttendanceImprovements;