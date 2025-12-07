import React, { useState } from 'react';
import { Mail, Send, Inbox, FileText, Clock, Heart, Archive, Trash2, RefreshCw, Menu, X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMessages } from '@/hooks/useMessages';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import NewMessageModal from '@/components/messagerie/NewMessageModal';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type FolderType = 'inbox' | 'sent' | 'drafts' | 'scheduled' | 'favorites' | 'archived' | 'trash';

const Messagerie = () => {
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<FolderType>('inbox');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { messages, loading, refetch } = useMessages();
  const { userId } = useCurrentUser();

  const folders = [
    { id: 'inbox' as FolderType, label: 'Boîte de réception', icon: Inbox, count: messages.filter(m => m.sender_id !== userId && !m.is_draft).length },
    { id: 'sent' as FolderType, label: 'Envoyés', icon: Send, count: messages.filter(m => m.sender_id === userId && !m.is_draft).length },
    { id: 'drafts' as FolderType, label: 'Brouillons', icon: FileText, count: messages.filter(m => m.is_draft).length },
    { id: 'scheduled' as FolderType, label: 'Programmés', icon: Clock, count: 0 },
    { id: 'favorites' as FolderType, label: 'Favoris', icon: Heart, count: 0 },
    { id: 'archived' as FolderType, label: 'Archives', icon: Archive, count: 0 },
    { id: 'trash' as FolderType, label: 'Corbeille', icon: Trash2, count: 0 },
  ];

  const getFilteredMessages = () => {
    let filtered = messages;
    
    switch (selectedFolder) {
      case 'inbox':
        filtered = messages.filter(m => m.sender_id !== userId && !m.is_draft);
        break;
      case 'sent':
        filtered = messages.filter(m => m.sender_id === userId && !m.is_draft);
        break;
      case 'drafts':
        filtered = messages.filter(m => m.is_draft);
        break;
      default:
        filtered = [];
    }

    if (searchTerm) {
      filtered = filtered.filter(msg =>
        msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredMessages = getFilteredMessages();
  const selectedMessage = selectedMessageId ? messages.find(m => m.id === selectedMessageId) : null;

  const handleFolderSelect = (folderId: FolderType) => {
    setSelectedFolder(folderId);
    setSelectedMessageId(null);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="p-3 sm:p-4 lg:p-6 border-b border-border bg-card">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Mobile sidebar toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden shrink-0"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Messagerie</h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
                  Communiquez avec les formateurs, étudiants et l'administration
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setIsNewMessageOpen(true)} 
              className="gap-1.5 sm:gap-2 text-xs sm:text-sm shrink-0"
              size="sm"
            >
              <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Nouveau message</span>
              <span className="sm:hidden">Nouveau</span>
            </Button>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-sm"
              />
            </div>
            <Button variant="outline" size="icon" onClick={refetch} disabled={loading} className="shrink-0">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Folders Sidebar */}
        <div className={cn(
          "absolute lg:relative z-50 lg:z-auto h-full w-64 border-r border-border bg-card overflow-y-auto transition-transform duration-300 ease-in-out",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          <div className="p-2">
            <div className="flex items-center justify-between mb-2 lg:hidden">
              <span className="text-sm font-medium text-muted-foreground px-2">Dossiers</span>
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {folders.map((folder) => {
              const Icon = folder.icon;
              const isActive = selectedFolder === folder.id;
              
              return (
                <button
                  key={folder.id}
                  onClick={() => handleFolderSelect(folder.id)}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left transition-colors mb-1',
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-accent text-foreground'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{folder.label}</span>
                  </div>
                  {folder.count > 0 && (
                    <Badge 
                      variant={isActive ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {folder.count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Messages List / Detail */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {selectedMessage ? (
            // Message Detail View
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedMessageId(null)}
                className="mb-4 gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Retour
              </Button>
              <div className="max-w-4xl">
                <h2 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4">{selectedMessage.subject}</h2>
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                  <span>
                    {formatDistanceToNow(new Date(selectedMessage.created_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                  {selectedMessage.attachment_count > 0 && (
                    <span className="flex items-center gap-1">
                      • <FileText className="h-3 w-3" />
                      {selectedMessage.attachment_count} pièce(s) jointe(s)
                    </span>
                  )}
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-sm sm:text-base">{selectedMessage.content}</p>
                </div>
              </div>
            </div>
          ) : (
            // Messages List View
            <div className="flex-1 overflow-y-auto">
              <div className="p-3 sm:p-4">
                <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                  {folders.find(f => f.id === selectedFolder)?.label}
                </h2>
                
                {loading ? (
                  <div className="text-center py-8 sm:py-12 text-muted-foreground text-sm">
                    Chargement des messages...
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <Mail className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-3 sm:mb-4 opacity-50" />
                    <p className="text-lg sm:text-xl font-semibold mb-2">Aucun message</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Aucun message pour ce dossier.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredMessages.map((message) => (
                      <Card
                        key={message.id}
                        className="p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedMessageId(message.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                              <h3 className="font-semibold text-foreground truncate text-sm sm:text-base">
                                {message.subject}
                              </h3>
                              {message.is_draft && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  Brouillon
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-1.5 sm:mb-2">
                              {message.content}
                            </p>
                            <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
                              <span>
                                {formatDistanceToNow(new Date(message.created_at), {
                                  addSuffix: true,
                                  locale: fr,
                                })}
                              </span>
                              {message.attachment_count > 0 && (
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  <span className="hidden sm:inline">{message.attachment_count} pièce(s)</span>
                                  <span className="sm:hidden">{message.attachment_count}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <NewMessageModal
        isOpen={isNewMessageOpen}
        onClose={() => setIsNewMessageOpen(false)}
      />
    </div>
  );
};

export default Messagerie;
