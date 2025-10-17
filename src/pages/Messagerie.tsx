
import React, { useState } from 'react';
import { Search, Plus, MessageSquare, Send, Paperclip, Star, Archive, Trash2, Users, User, Inbox, Mail, Clock, Heart, FolderArchive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NewMessageModal from '@/components/messagerie/NewMessageModal';

const Messagerie = () => {
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);

  const folders = [
    { id: 'inbox', name: 'Boîte de réception', icon: Inbox, count: 3 },
    { id: 'sent', name: 'Envoyés', icon: Send, count: 0 },
    { id: 'drafts', name: 'Brouillons', icon: Mail, count: 1 },
    { id: 'scheduled', name: 'Programmés', icon: Clock, count: 0 },
    { id: 'favorites', name: 'Favoris', icon: Heart, count: 0 },
    { id: 'archives', name: 'Archives', icon: FolderArchive, count: 0 },
    { id: 'trash', name: 'Corbeille', icon: Trash2, count: 0 },
  ];

  const handleRefresh = () => {
    console.log('Actualisation des messages...');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 sm:gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">Messagerie</h1>
              <p className="text-base sm:text-lg text-muted-foreground">Communiquez avec les formateurs, étudiants et l'administration</p>
            </div>
            <Button 
              onClick={() => setIsNewMessageModalOpen(true)}
              className="bg-primary hover:bg-primary/90 w-full sm:w-auto h-11 sm:h-12 text-base font-medium shadow-sm px-6"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nouveau message
            </Button>
          </div>

          {/* Search and Refresh */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1 sm:max-w-lg">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher des emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-base border border-input bg-background rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
            </div>
            <Button variant="outline" onClick={handleRefresh} className="w-full sm:w-auto h-11 sm:h-12 text-base px-6">
              Actualiser
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border p-5 sm:p-6 shadow-sm">
              <nav className="space-y-2">
                {folders.map((folder) => {
                  const IconComponent = folder.icon;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => setSelectedFolder(folder.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all ${
                        selectedFolder === folder.id
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className="h-5 w-5" />
                        <span className="text-sm sm:text-base font-medium">{folder.name}</span>
                      </div>
                      {folder.count > 0 && (
                        <span className={`text-xs sm:text-sm px-2.5 py-1 rounded-full font-medium ${
                          selectedFolder === folder.id
                            ? 'bg-primary-foreground text-primary'
                            : 'bg-muted-foreground text-muted-foreground-foreground'
                        }`}>
                          {folder.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-card rounded-xl border min-h-[500px] sm:min-h-[600px] shadow-sm">
              {/* Folder Header */}
              <div className="p-5 sm:p-6 border-b">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                  {folders.find(f => f.id === selectedFolder)?.name}
                </h2>
              </div>

              {/* Empty State */}
              <div className="flex flex-col items-center justify-center py-20 sm:py-24 px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <Mail className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-foreground mb-3">Aucun message</h3>
                <p className="text-base sm:text-lg text-muted-foreground text-center">
                  Aucun message pour ce dossier.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <NewMessageModal 
        isOpen={isNewMessageModalOpen}
        onClose={() => setIsNewMessageModalOpen(false)}
      />
    </div>
  );
};

export default Messagerie;
