
import React, { useState } from 'react';
import { Calendar, MapPin, Users, Clock, Plus, Eye, Edit, Trash2, Star } from 'lucide-react';

const Evenements = () => {
  const [events, setEvents] = useState([
    {
      id: 1,
      title: 'Conférence Marketing Digital 2024',
      description: 'Une conférence exclusive sur les dernières tendances du marketing digital.',
      date: '2024-03-15',
      time: '14:00',
      location: 'Amphithéâtre A',
      category: 'Conférence',
      maxParticipants: 100,
      registeredParticipants: 45,
      status: 'Ouvert',
      image: '/placeholder.svg',
      organizer: 'Admin Nect'
    },
    {
      id: 2,
      title: 'Atelier Créativité & Innovation',
      description: 'Développez votre créativité avec des techniques innovantes.',
      date: '2024-03-20',
      time: '10:00',
      location: 'Salle de créativité',
      category: 'Atelier',
      maxParticipants: 25,
      registeredParticipants: 18,
      status: 'Ouvert',
      image: '/placeholder.svg',
      organizer: 'Formateur Prof'
    },
    {
      id: 3,
      title: 'Présentation des Projets Étudiants',
      description: 'Les étudiants présentent leurs projets de fin d\'année.',
      date: '2024-04-10',
      time: '16:00',
      location: 'Salle de conférence',
      category: 'Présentation',
      maxParticipants: 50,
      registeredParticipants: 30,
      status: 'Bientôt complet',
      image: '/placeholder.svg',
      organizer: 'Administration'
    },
    {
      id: 4,
      title: 'Remise des Diplômes',
      description: 'Cérémonie officielle de remise des diplômes.',
      date: '2024-06-15',
      time: '18:00',
      location: 'Grand Amphithéâtre',
      category: 'Cérémonie',
      maxParticipants: 200,
      registeredParticipants: 85,
      status: 'Ouvert',
      image: '/placeholder.svg',
      organizer: 'Direction'
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const categories = ['Conférence', 'Atelier', 'Présentation', 'Cérémonie', 'Formation', 'Networking'];

  const filteredEvents = selectedCategory === 'all' 
    ? events 
    : events.filter(event => event.category === selectedCategory);

  const handleRegister = (eventId: number) => {
    setEvents(events.map(event => 
      event.id === eventId 
        ? { ...event, registeredParticipants: event.registeredParticipants + 1 }
        : event
    ));
  };

  const handleViewDetails = (event: any) => {
    setSelectedEvent(event);
    setShowDetails(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ouvert':
        return 'bg-green-100 text-green-800';
      case 'Bientôt complet':
        return 'bg-orange-100 text-orange-800';
      case 'Complet':
        return 'bg-red-100 text-red-800';
      case 'Annulé':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Conférence': 'bg-purple-100 text-purple-800',
      'Atelier': 'bg-blue-100 text-blue-800',
      'Présentation': 'bg-green-100 text-green-800',
      'Cérémonie': 'bg-yellow-100 text-yellow-800',
      'Formation': 'bg-red-100 text-red-800',
      'Networking': 'bg-pink-100 text-pink-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Événements</h1>
            <p className="text-gray-600">Découvrez et participez aux événements de votre établissement</p>
          </div>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center font-medium">
            <Plus className="h-5 w-5 mr-2" />
            Créer un événement
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tous
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 bg-gradient-to-br from-purple-500 to-blue-600 relative">
              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                  {event.category}
                </span>
              </div>
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                  {event.status}
                </span>
              </div>
              <div className="absolute bottom-4 left-4 text-white">
                <div className="flex items-center mb-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">{event.date}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span className="text-sm">{event.time}</span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-2" />
                  {event.location}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-2" />
                  {event.registeredParticipants}/{event.maxParticipants} participants
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleViewDetails(event)}
                  className="flex items-center text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Voir détails
                </button>
                <button
                  onClick={() => handleRegister(event.id)}
                  disabled={event.registeredParticipants >= event.maxParticipants}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  S'inscrire
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Event Details Modal */}
      {showDetails && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="relative h-64 bg-gradient-to-br from-purple-500 to-blue-600">
              <button
                onClick={() => setShowDetails(false)}
                className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full"
              >
                ×
              </button>
              <div className="absolute bottom-6 left-6 text-white">
                <h2 className="text-2xl font-bold mb-2">{selectedEvent.title}</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    <span>{selectedEvent.date}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    <span>{selectedEvent.time}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedEvent.category)}`}>
                  {selectedEvent.category}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedEvent.status)}`}>
                  {selectedEvent.status}
                </span>
              </div>
              
              <p className="text-gray-700 mb-6">{selectedEvent.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Informations pratiques</h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {selectedEvent.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      {selectedEvent.registeredParticipants}/{selectedEvent.maxParticipants} participants
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="h-4 w-4 mr-2" />
                      Organisé par {selectedEvent.organizer}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Participation</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Places disponibles</span>
                      <span className="font-medium">{selectedEvent.maxParticipants - selectedEvent.registeredParticipants}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${(selectedEvent.registeredParticipants / selectedEvent.maxParticipants) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    handleRegister(selectedEvent.id);
                    setShowDetails(false);
                  }}
                  disabled={selectedEvent.registeredParticipants >= selectedEvent.maxParticipants}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg font-medium"
                >
                  S'inscrire à l'événement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun événement trouvé</h3>
            <p className="text-gray-600 mb-4">
              Aucun événement ne correspond à vos critères de recherche.
            </p>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium">
              Créer un événement
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Evenements;
