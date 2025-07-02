
import React, { useState } from 'react';
import { Search, Plus, MessageSquare, Send, Paperclip, Star, Archive, Trash2, Users, User } from 'lucide-react';

const Messagerie = () => {
  const [selectedConversation, setSelectedConversation] = useState(1);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const conversations = [
    {
      id: 1,
      name: 'Formateur Prof',
      role: 'Formateur',
      lastMessage: 'Bonjour, j\'aimerais discuter du programme de la semaine prochaine.',
      time: '14:30',
      unread: 2,
      avatar: 'FP'
    },
    {
      id: 2,
      name: 'Sangare Souleymane',
      role: 'Étudiant',
      lastMessage: 'Merci pour les ressources partagées.',
      time: '12:15',
      unread: 0,
      avatar: 'SS'
    },
    {
      id: 3,
      name: 'Groupe Marketing Digital',
      role: 'Groupe',
      lastMessage: 'Le prochain cours aura lieu en salle B.',
      time: '10:45',
      unread: 5,
      avatar: 'GM',
      isGroup: true
    },
    {
      id: 4,
      name: 'Nouvel Utilisateur',
      role: 'Étudiant',
      lastMessage: 'Pouvez-vous m\'envoyer le planning mis à jour ?',
      time: '09:20',
      unread: 1,
      avatar: 'NU'
    }
  ];

  const messages = [
    {
      id: 1,
      senderId: 1,
      senderName: 'Formateur Prof',
      content: 'Bonjour, j\'aimerais discuter du programme de la semaine prochaine.',
      time: '14:30',
      isOwn: false
    },
    {
      id: 2,
      senderId: 'me',
      senderName: 'Moi',
      content: 'Bonjour ! Bien sûr, nous pouvons organiser une réunion. Quel moment vous conviendrait le mieux ?',
      time: '14:32',
      isOwn: true
    },
    {
      id: 3,
      senderId: 1,
      senderName: 'Formateur Prof',
      content: 'Demain matin vers 10h si possible ? Nous avons plusieurs points à aborder concernant les nouvelles modalités d\'évaluation.',
      time: '14:35',
      isOwn: false
    }
  ];

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Messagerie</h1>
            <button className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedConversation === conversation.id ? 'bg-purple-50 border-purple-200' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${
                  conversation.isGroup ? 'bg-green-500' : 'bg-purple-500'
                }`}>
                  {conversation.isGroup ? (
                    <Users className="h-5 w-5" />
                  ) : (
                    <span className="text-sm">{conversation.avatar}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {conversation.name}
                    </h3>
                    <span className="text-xs text-gray-500">{conversation.time}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage}
                    </p>
                    {conversation.unread > 0 && (
                      <span className="ml-2 px-2 py-1 text-xs bg-purple-600 text-white rounded-full">
                        {conversation.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{conversation.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                    <span className="text-sm">FP</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Formateur Prof</h2>
                    <p className="text-sm text-gray-500">En ligne</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Star className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Archive className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.isOwn 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.isOwn ? 'text-purple-100' : 'text-gray-500'
                    }`}>
                      {message.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Paperclip className="h-5 w-5" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Tapez votre message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sélectionnez une conversation
              </h3>
              <p className="text-gray-500">
                Choisissez une conversation pour commencer à discuter
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messagerie;
