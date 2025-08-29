
import React, { useState } from 'react';
import { Search, Monitor, Users, Calendar, Video, Edit, Trash2, Play, MoreVertical } from 'lucide-react';

interface VirtualClass {
  id: number;
  title: string;
  instructor: string;
  status: 'En cours' | 'Programmé' | 'Terminé';
  participants: number;
  maxParticipants: number;
  startTime: string;
  endTime: string;
  date: string;
  description: string;
  materials: string[];
  recording: boolean;
}

interface VirtualClassesProps {
  onJoinClass: (classItem: VirtualClass) => void;
}

const VirtualClasses: React.FC<VirtualClassesProps> = ({ onJoinClass }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [virtualClasses, setVirtualClasses] = useState<VirtualClass[]>([
    {
      id: 1,
      title: 'Marketing Digital - Module 1',
      instructor: 'Formateur Prof',
      status: 'En cours',
      participants: 15,
      maxParticipants: 25,
      startTime: '14:00',
      endTime: '16:00',
      date: '2024-01-15',
      description: 'Introduction aux stratégies de marketing digital',
      materials: ['Presentation.pdf', 'Exercices.docx'],
      recording: true
    },
    {
      id: 2,
      title: 'Communication Digitale',
      instructor: 'Marie Dupont',
      status: 'Programmé',
      participants: 8,
      maxParticipants: 20,
      startTime: '10:00',
      endTime: '12:00',
      date: '2024-01-16',
      description: 'Techniques de communication en ligne',
      materials: ['Guide.pdf'],
      recording: false
    },
    {
      id: 3,
      title: 'Photoshop Avancé',
      instructor: 'Jean Martin',
      status: 'Terminé',
      participants: 12,
      maxParticipants: 15,
      startTime: '09:00',
      endTime: '11:00',
      date: '2024-01-14',
      description: 'Techniques avancées de retouche photo',
      materials: ['Tutorial.pdf', 'Samples.zip'],
      recording: true
    }
  ]);

  const filteredClasses = virtualClasses.filter(cls => {
    const matchesSearch = cls.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || cls.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteClass = (classId: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette classe ?')) {
      setVirtualClasses(virtualClasses.filter(c => c.id !== classId));
    }
  };

  return (
    <div>
      {/* Search and filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une classe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="En cours">En cours</option>
            <option value="Programmé">Programmé</option>
            <option value="Terminé">Terminé</option>
          </select>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((classItem) => (
          <div key={classItem.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {classItem.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Par {classItem.instructor}
                  </p>
                  <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    classItem.status === 'En cours' 
                      ? 'bg-green-100 text-green-800'
                      : classItem.status === 'Programmé'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {classItem.status}
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-1">
                    <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteClass(classItem.id)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                {classItem.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  {classItem.date} • {classItem.startTime} - {classItem.endTime}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-2" />
                  {classItem.participants}/{classItem.maxParticipants} participants
                </div>
                {classItem.recording && (
                  <div className="flex items-center text-sm text-red-500">
                    <Video className="h-4 w-4 mr-2" />
                    Enregistrement activé
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => onJoinClass(classItem)}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium text-sm"
                >
                  {classItem.status === 'En cours' ? 'Rejoindre' : 'Démarrer'}
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  Détails
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <Monitor className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune classe trouvée</h3>
          <p className="text-gray-600">Aucune classe ne correspond à vos critères de recherche.</p>
        </div>
      )}
    </div>
  );
};

export default VirtualClasses;
