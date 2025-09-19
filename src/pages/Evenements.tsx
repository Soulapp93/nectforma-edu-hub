
import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Users, Search, Filter, FileText, Edit, Trash2 } from 'lucide-react';
import CreateEventModal from '@/components/evenements/CreateEventModal';
import EditEventModal from '@/components/evenements/EditEventModal';
import EventCard from '@/components/evenements/EventCard';
import FileViewerModal from '@/components/evenements/FileViewerModal';
import { useEvents, useDeleteEvent } from '@/hooks/useEvents';
import { Event } from '@/services/eventService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { seedDemoEvents } from '@/utils/seedEvents';

const Evenements = () => {
  const { data: events = [], isLoading } = useEvents();
  const { userRole } = useCurrentUser();
  const deleteEventMutation = useDeleteEvent();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{url: string, name: string} | null>(null);

  // Vérification des permissions admin
  const isAdmin = userRole === 'admin' || userRole === 'Administrateur' || userRole === 'Super Administrateur';
  
  // Debug logs
  console.log('userRole:', userRole);
  console.log('events:', events);
  console.log('isAdmin:', isAdmin);

  // Initialiser les données démo au premier chargement
  useEffect(() => {
    const hasInitialized = sessionStorage.getItem('demo_initialized');
    if (!hasInitialized) {
      console.log('Initializing demo data...');
      seedDemoEvents();
      sessionStorage.setItem('demo_initialized', 'true');
    }
  }, []);

  const handleEventClick = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setShowEventDetails(true);
    }
  };

  const handleEditEvent = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setIsEditModalOpen(true);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      try {
        await deleteEventMutation.mutateAsync(eventId);
        setShowEventDetails(false);
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Événements</h1>
          <p className="text-gray-600">Découvrez les événements de votre établissement</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center font-medium"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouvel événement
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un événement..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
            <option value="">Filtrer par audience</option>
            <option value="Étudiants">Étudiants</option>
            <option value="Formateurs">Formateurs</option>
            <option value="Administrateurs">Administrateurs</option>
            <option value="Tous">Tous</option>
          </select>
        </div>
      </div>

      {/* Événements Grid */}
      {events.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun événement</h3>
            <p className="text-gray-600 mb-4">
              Créez votre premier événement pour commencer à informer votre communauté.
            </p>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Créer un événement
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {events.map((event) => (
            <EventCard
              key={event.id}
              {...event}
              onView={handleEventClick}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
              isAdmin={isAdmin}
              currentUserId={userRole ? '00000000-0000-4000-8000-000000000001' : undefined}
            />
          ))}
        </div>
      )}

      {/* Event Details Modal */}
      {showEventDetails && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="relative h-32 bg-gradient-to-r from-purple-500 to-purple-600">
              <button
                onClick={() => setShowEventDetails(false)}
                className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full"
              >
                ×
              </button>
              <div className="absolute bottom-4 left-6 text-white">
                <h2 className="text-2xl font-bold">{selectedEvent.title}</h2>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-6">{selectedEvent.description || 'Aucune description disponible'}</p>
              

              {selectedEvent.file_urls && selectedEvent.file_urls.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Fichiers joints</h4>
                  <div className="space-y-2">
                    {selectedEvent.file_urls.map((fileUrl, index) => {
                      // Extraire un nom de fichier plus descriptif basé sur l'URL
                      let fileName = `Fichier ${index + 1}`;
                      
                      if (fileUrl.includes('dummy.pdf')) {
                        fileName = 'Programme de la conférence.pdf';
                      } else if (fileUrl.includes('file_example_JPG')) {
                        fileName = 'Image promotionnelle.jpg';
                      } else if (fileUrl.includes('sample-pdf-file.pdf')) {
                        fileName = 'Brochure établissement.pdf';
                      } else if (fileUrl.includes('sample.pdf')) {
                        fileName = 'Règlement cérémonie.pdf';
                      } else if (fileUrl.includes('placeholder')) {
                        fileName = 'Programme événement.png';
                      }
                      
                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedFile({url: fileUrl, name: fileName})}
                          className="flex items-center px-3 py-2 bg-gray-50 rounded-lg hover:bg-purple-50 hover:border-purple-200 border border-transparent transition-colors cursor-pointer w-full text-left"
                        >
                          <FileText className="h-4 w-4 mr-2 text-blue-600" />
                          <span className="text-sm text-blue-600 hover:text-purple-600">{fileName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                {isAdmin && (
                  <>
                    <button
                      onClick={() => {
                        setShowEventDetails(false);
                        handleEditEvent(selectedEvent.id);
                      }}
                      className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(selectedEvent.id)}
                      className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowEventDetails(false)}
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
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />

      {/* Edit Event Modal */}
      {isEditModalOpen && selectedEvent && (
        <EditEventModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)}
          event={selectedEvent}
        />
      )}

      {/* File Viewer Modal */}
      <FileViewerModal
        isOpen={selectedFile !== null}
        onClose={() => setSelectedFile(null)}
        fileUrl={selectedFile?.url || ''}
        fileName={selectedFile?.name || ''}
      />
    </div>
  );
};

export default Evenements;
