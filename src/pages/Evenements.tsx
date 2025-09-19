
import React, { useState } from 'react';
import { Calendar, MapPin, Users, Clock, Plus, Eye, Edit, Trash2, Star } from 'lucide-react';
import { useEvents, useRegisterForEvent, useUnregisterFromEvent } from '@/hooks/useEvents';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import CreateEventModal from '@/components/evenements/CreateEventModal';
import { toast } from 'sonner';

const Evenements = () => {
  const { data: events = [], isLoading } = useEvents();
  const currentUser = useCurrentUser();
  const registerMutation = useRegisterForEvent();
  const unregisterMutation = useUnregisterFromEvent();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const categories = ['Conférence', 'Atelier', 'Présentation', 'Cérémonie', 'Formation', 'Networking', 'Porte ouverte'];

  const filteredEvents = selectedCategory === 'all' 
    ? events 
    : events.filter(event => event.category === selectedCategory);

  const handleRegister = async (eventId: string, isRegistered: boolean) => {
    try {
      if (isRegistered) {
        await unregisterMutation.mutateAsync(eventId);
      } else {
        await registerMutation.mutateAsync(eventId);
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleViewDetails = (event: any) => {
    setSelectedEvent(event);
    setShowDetails(true);
  };

  const canCreateEvent = () => {
    console.log('Current user:', currentUser);
    console.log('User role:', currentUser.userRole);
    return currentUser.userRole === 'Administrateur' || 
           currentUser.userRole === 'Super Administrateur' || 
           currentUser.userRole === 'Formateur' ||
           currentUser.userRole === 'admin' ||
           currentUser.userRole === 'instructor';
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Événements</h1>
            <p className="text-gray-600">Créez et gérez les événements de votre établissement.</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center font-medium transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nouvel événement
          </button>
        </div>
        
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Rechercher un événement..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option>Tous les statuts</option>
                <option>Ouvert</option>
                <option>Bientôt complet</option>
                <option>Complet</option>
                <option>Annulé</option>
              </select>
            </div>
          </div>
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
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-48 bg-gray-200 animate-pulse"></div>
              <div className="p-6 space-y-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div 
              key={event.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
              onClick={() => handleViewDetails(event)}
            >
              <div className="h-48 relative overflow-hidden">
                {event.image_url ? (
                  <img 
                    src={event.image_url} 
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600"></div>
                )}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)} backdrop-blur-sm bg-white/90`}>
                    {event.category}
                  </span>
                </div>
                {/* Overlay pour indiquer la cliquabilité */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                  <div className="bg-white/0 group-hover:bg-white/20 backdrop-blur-sm rounded-full p-3 transform scale-0 group-hover:scale-100 transition-transform duration-300">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                  {event.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                
                <div className="space-y-2 mb-4">
                  {event.formation_ids && event.formation_ids.length > 0 && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-2" />
                      {event.formation_ids.length} formation(s) concernée(s)
                    </div>
                  )}
                  {event.audiences && event.audiences.length > 0 && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-2" />
                      {event.audiences.join(', ')}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center">
                  <div className="flex items-center text-purple-600 text-sm font-medium">
                    <Eye className="h-4 w-4 mr-1" />
                    Cliquer pour voir les détails
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Event Details Modal */}
      {showDetails && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="relative h-64 overflow-hidden">
              {selectedEvent.image_url ? (
                <img 
                  src={selectedEvent.image_url} 
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600"></div>
              )}
              <div className="absolute inset-0 bg-black/40"></div>
              <button
                onClick={() => setShowDetails(false)}
                className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full"
              >
                ×
              </button>
              <div className="absolute bottom-6 left-6 text-white">
                <h2 className="text-2xl font-bold mb-2">{selectedEvent.title}</h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedEvent.category)}`}>
                  {selectedEvent.category}
                </span>
              </div>
              
              <p className="text-gray-700 mb-6">{selectedEvent.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Formations concernées</h4>
                  <div className="space-y-2">
                    {selectedEvent.formation_ids && selectedEvent.formation_ids.length > 0 ? (
                      <p className="text-sm text-gray-600">{selectedEvent.formation_ids.length} formation(s) sélectionnée(s)</p>
                    ) : (
                      <p className="text-sm text-gray-600">Toutes les formations</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Audiences concernées</h4>
                  <div className="space-y-2">
                    {selectedEvent.audiences && selectedEvent.audiences.length > 0 ? (
                      <p className="text-sm text-gray-600">{selectedEvent.audiences.join(', ')}</p>
                    ) : (
                      <p className="text-sm text-gray-600">Toutes les audiences</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      <CreateEventModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />

      {/* Empty State */}
      {!isLoading && filteredEvents.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun événement trouvé</h3>
            <p className="text-gray-600 mb-4">
              Aucun événement ne correspond à vos critères de recherche.
            </p>
            {canCreateEvent() && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Créer un événement
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Evenements;
