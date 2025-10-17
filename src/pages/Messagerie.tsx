
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
      <div className="container mx-auto py-4 sm:py-6 px-2 sm:px-4">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Messagerie</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">Communiquez avec les formateurs, étudiants et l'administration</p>
            </div>
            <Button 
              onClick={() => setIsNewMessageModalOpen(true)}
              className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau message
            </Button>
          </div>

          {/* Search and Refresh */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-4">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher des emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
            <Button variant="outline" onClick={handleRefresh} className="w-full sm:w-auto">
              Actualiser
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border p-4">
              <nav className="space-y-2">
                {folders.map((folder) => {
                  const IconComponent = folder.icon;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => setSelectedFolder(folder.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors ${
                        selectedFolder === folder.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className="h-4 w-4" />
                        <span className="text-sm font-medium">{folder.name}</span>
                      </div>
                      {folder.count > 0 && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
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
            <div className="bg-card rounded-lg border min-h-[400px] sm:min-h-[500px]">
              {/* Folder Header */}
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-foreground">
                  {folders.find(f => f.id === selectedFolder)?.name}
                </h2>
              </div>

              {/* Empty State */}
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Aucun message</h3>
                <p className="text-muted-foreground text-center">
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
