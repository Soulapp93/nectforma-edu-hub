
import React, { useState } from 'react';
import { 
  Monitor, 
  Plus, 
  Search, 
  Video, 
  Users, 
  Calendar,
  FileText,
  Settings,
  Mic,
  MicOff,
  VideoOff,
  Phone,
  Share,
  MessageCircle,
  MoreVertical,
  Play,
  Pause,
  Volume2,
  Maximize,
  Download,
  Upload,
  Eye,
  Clock,
  BookOpen
} from 'lucide-react';

const ELearning = () => {
  const [activeTab, setActiveTab] = useState('classes');
  const [selectedClass, setSelectedClass] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const virtualClasses = [
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
  ];

  const recordings = [
    {
      id: 1,
      title: 'Marketing Digital - Session 1',
      duration: '2h 15m',
      date: '2024-01-10',
      views: 45,
      size: '1.2 GB'
    },
    {
      id: 2,
      title: 'Communication Digitale - Introduction',
      duration: '1h 30m',
      date: '2024-01-08',
      views: 32,
      size: '850 MB'
    }
  ];

  const handleJoinClass = (classItem) => {
    setSelectedClass(classItem);
    setIsInCall(true);
  };

  const handleLeaveCall = () => {
    setIsInCall(false);
    setSelectedClass(null);
  };

  const filteredClasses = virtualClasses.filter(cls =>
    cls.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isInCall && selectedClass) {
    return (
      <div className="h-screen bg-gray-900 flex flex-col">
        {/* Video Call Interface */}
        <div className="flex-1 relative">
          {/* Main Video Area */}
          <div className="h-full bg-gray-800 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-32 h-32 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold">FP</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{selectedClass.instructor}</h3>
              <p className="text-gray-300">{selectedClass.title}</p>
            </div>
          </div>

          {/* Participants Grid */}
          <div className="absolute top-4 right-4 w-80 h-60 bg-gray-800 rounded-lg overflow-hidden">
            <div className="p-3 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-medium">Participants ({selectedClass.participants})</span>
                <button className="text-gray-400 hover:text-white">
                  <Users className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 p-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-700 rounded aspect-video flex items-center justify-center">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">E{i+1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Sidebar */}
          <div className="absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 transform translate-x-full transition-transform">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold">Chat du cours</h3>
            </div>
            <div className="flex-1 p-4">
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium">Formateur Prof</p>
                  <p className="text-sm text-gray-600">Bonjour à tous, nous commençons dans 2 minutes</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Tapez votre message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Control Bar */}
        <div className="bg-gray-800 p-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center space-x-4">
              <span className="text-white font-medium">{selectedClass.title}</span>
              <span className="text-gray-400 text-sm">
                {selectedClass.participants} participants
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-full ${isMuted ? 'bg-red-600' : 'bg-gray-600'} text-white hover:opacity-80`}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`p-3 rounded-full ${isVideoOff ? 'bg-red-600' : 'bg-gray-600'} text-white hover:opacity-80`}
              >
                {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </button>

              <button className="p-3 rounded-full bg-gray-600 text-white hover:opacity-80">
                <Share className="h-5 w-5" />
              </button>

              <button className="p-3 rounded-full bg-gray-600 text-white hover:opacity-80">
                <MessageCircle className="h-5 w-5" />
              </button>

              <button
                onClick={handleLeaveCall}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                <Phone className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">E-Learning</h1>
            <p className="text-gray-600">Gérez vos cours en ligne et vidéoconférences</p>
          </div>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center font-medium">
            <Plus className="h-5 w-5 mr-2" />
            Nouvelle classe virtuelle
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'classes', label: 'Classes virtuelles', icon: Monitor },
              { id: 'recordings', label: 'Enregistrements', icon: Video },
              { id: 'materials', label: 'Ressources', icon: FileText },
              { id: 'settings', label: 'Paramètres', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'classes' && (
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
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                <option>Tous les statuts</option>
                <option>En cours</option>
                <option>Programmé</option>
                <option>Terminé</option>
              </select>
            </div>
          </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((classItem) => (
              <div key={classItem.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-5 w-5" />
                    </button>
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
                      onClick={() => handleJoinClass(classItem)}
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
        </div>
      )}

      {activeTab === 'recordings' && (
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Enregistrements des cours</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {recordings.map((recording) => (
                <div key={recording.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Play className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="text-base font-medium text-gray-900">
                          {recording.title}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {recording.duration}
                          </span>
                          <span className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {recording.views} vues
                          </span>
                          <span>{recording.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Play className="h-5 w-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Download className="h-5 w-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'materials' && (
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Ressources pédagogiques</h3>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center text-sm">
                <Upload className="h-4 w-4 mr-2" />
                Ajouter une ressource
              </button>
            </div>
            
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune ressource</h3>
              <p className="text-gray-500">Ajoutez des ressources pédagogiques pour vos cours en ligne</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Paramètres E-Learning</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-3">Paramètres de vidéoconférence</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-purple-600 mr-3" defaultChecked />
                    <span className="text-sm text-gray-700">Activer l'enregistrement automatique</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-purple-600 mr-3" />
                    <span className="text-sm text-gray-700">Autoriser le partage d'écran pour les participants</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-purple-600 mr-3" defaultChecked />
                    <span className="text-sm text-gray-700">Chat activé pendant les cours</span>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-base font-medium text-gray-900 mb-3">Qualité vidéo</h4>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option>HD (720p)</option>
                  <option>Full HD (1080p)</option>
                  <option>4K (2160p)</option>
                </select>
              </div>

              <div>
                <h4 className="text-base font-medium text-gray-900 mb-3">Stockage des enregistrements</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Espace utilisé</span>
                    <span className="text-sm font-medium">2.4 GB / 10 GB</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '24%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium">
                Sauvegarder les paramètres
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ELearning;
