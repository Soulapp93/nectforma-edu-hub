
import React from 'react';
import FormationCard from '../components/FormationCard';

const Formations = () => {
  const formations = [
    {
      title: 'Introduction au Marketing Digital',
      level: 'BAC+1',
      students: 2,
      modules: 2,
      instructor: 'Formateur Prof',
      status: 'Actif' as const,
      color: '#8B5CF6'
    },
    {
      title: 'Cours de Photoshop Avancé',
      level: 'BAC+3',
      students: 1,
      modules: 0,
      instructor: 'Non assigné',
      status: 'Actif' as const,
      color: '#3B82F6'
    }
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Formations</h1>
        <p className="text-gray-600">Accédez à vos formations et modules pédagogiques</p>
      </div>

      {/* BAC+1 Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-purple-600 mb-4">BAC+1</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FormationCard {...formations[0]} />
        </div>
      </div>

      {/* BAC+3 Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-purple-600 mb-4">BAC+3</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FormationCard {...formations[1]} />
        </div>
      </div>

      {/* Empty State for more formations */}
      <div className="bg-gray-50 rounded-xl p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Créer une nouvelle formation</h3>
          <p className="text-gray-600 mb-4">Ajoutez des formations pour enrichir votre catalogue pédagogique.</p>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium">
            Créer une formation
          </button>
        </div>
      </div>
    </div>
  );
};

export default Formations;
