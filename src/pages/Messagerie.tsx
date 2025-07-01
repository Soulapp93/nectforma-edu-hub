
import React, { useState } from 'react';
import { Search, Plus, Star, Send, Paperclip, Archive, Trash } from 'lucide-react';

const Messagerie = () => {
  const [selectedMessage, setSelectedMessage] = useState(1);

  const messages = [
    {
      id: 1,
      sender: 'Pierre Martin',
      email: 'formateur@example.com',
      subject: 'Nouveau module disponible',
      preview: 'Bonjour, Je vous informe qu\'un nouveau module "Stratégies digitales" est maintenant disponible...',
      time: '10/06/2025 10:30',
      isRead: false,
      isStarred: true,
      attachments: 1
    },
    {
      id: 2,
      sender: 'Administration EduPlatform',
      email: 'admin@example.com',
      subject: 'Rappel: Évaluation à rendre',
      preview: 'Bonjour, Nous vous rappelons que l\'évaluation "Analytics et KPI" doit être rendue avant le...',
      time: '09/06/2025 14:20',
      isRead: true,
      isStarred: false,
      attachments: 0
    }
  ];

  const folders = [
    { name: 'Boîte de réception', count: 2, active: true },
    { name: 'Envoyés', count: 0, active: false },
    { name: 'Brouillons', count: 0, active: false },
    { name: 'Programmés', count: 0, active: false },
    { name: 'Favoris', count: 1, active: false },
    { name: 'Archivés', count: 0, active: false },
    { name: 'Corbeille', count: 0, active: false }
  ];

  const currentMessage = messages.find(msg => msg.id === selectedMessage);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Messagerie</h1>
        <p className="text-gray-600">Communiquez avec les formateurs, étudiants et l'administration</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: '600px' }}>
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            {/* New Message Button */}
            <div className="p-4 border-b border-gray-200">
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau message
              </button>
            </div>

            {/* Folders */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <nav className="space-y-1">
                  {folders.map((folder) => (
                    <button
                      key={folder.name}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg ${
                        folder.active 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{folder.name}</span>
                      {folder.count > 0 && (
                        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                          {folder.count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* Message List */}
          <div className="w-96 border-r border-gray-200 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher des emails..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => setSelectedMessage(message.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedMessage === message.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${message.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                        {message.sender}
                      </span>
                      {message.isStarred && (
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{message.time}</span>
                  </div>
                  <p className={`text-sm mb-2 ${message.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                    {message.subject}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-2">{message.preview}</p>
                  {message.attachments > 0 && (
                    <div className="flex items-center mt-2">
                      <Paperclip className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500">{message.attachments} pièce(s) jointe(s)</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Message Content */}
          <div className="flex-1 flex flex-col">
            {currentMessage ? (
              <>
                {/* Message Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">{currentMessage.subject}</h2>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <Archive className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <Trash className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-yellow-500 rounded-lg hover:bg-gray-100">
                        <Star className={`h-4 w-4 ${currentMessage.isStarred ? 'text-yellow-400 fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div>
                      <span className="font-medium">De: {currentMessage.sender}</span>
                      <span className="ml-2">&lt;{currentMessage.email}&gt;</span>
                    </div>
                    <span>Date: {currentMessage.time}</span>
                  </div>
                </div>

                {/* Message Body */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="prose max-w-none">
                    <p>Bonjour,</p>
                    <p>Je vous informe qu'un nouveau module "Stratégies digitales" est maintenant disponible dans la formation Marketing Digital.</p>
                    <p>Cordialement,<br />Pierre Martin</p>
                    
                    {currentMessage.attachments > 0 && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Pièces jointes (1):</h4>
                        <div className="flex items-center space-x-2">
                          <Paperclip className="h-4 w-4 text-gray-400" />
                          <button className="text-sm text-blue-600 hover:text-blue-800">
                            syllabus.pdf (1.2MB) - Télécharger (Simulation)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reply Section */}
                <div className="p-6 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center">
                      <Send className="h-4 w-4 mr-2" />
                      Répondre
                    </button>
                    <button className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                      Transférer
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <p>Sélectionnez un message pour le lire</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messagerie;
