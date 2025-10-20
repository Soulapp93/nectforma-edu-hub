import React, { useState } from 'react';
import { Mail, Send, Inbox, FileText, Clock, Heart, Archive, Trash2, RefreshCw } from 'lucide-react';
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

  const MessageCard = ({ message }: { message: typeof messages[0] }) => {
    const isSent = message.sender_id === userId;
    
    return (
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-foreground truncate">
                {message.subject}
              </h3>
              {message.is_draft && (
                <Badge variant="secondary" className="text-xs">
                  Brouillon
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {message.content}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                {formatDistanceToNow(new Date(message.created_at), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
              {message.attachment_count > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {message.attachment_count} pièce(s) jointe(s)
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            {isSent ? (
              <div className="bg-primary/10 text-primary rounded-full p-2">
                <Send className="h-4 w-4" />
              </div>
            ) : (
              <div className="bg-secondary text-secondary-foreground rounded-full p-2">
                <Inbox className="h-4 w-4" />
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-border bg-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Messagerie</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Communiquez avec les formateurs, étudiants et l'administration
            </p>
          </div>
          <Button onClick={() => setIsNewMessageOpen(true)} className="gap-2">
            <Mail className="h-4 w-4" />
            Nouveau message
          </Button>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Rechercher des emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Button variant="outline" size="icon" onClick={refetch} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Folders Sidebar */}
        <div className="w-64 border-r border-border bg-card overflow-y-auto">
          <div className="p-2">
            {folders.map((folder) => {
              const Icon = folder.icon;
              const isActive = selectedFolder === folder.id;
              
              return (
                <button
                  key={folder.id}
                  onClick={() => {
                    setSelectedFolder(folder.id);
                    setSelectedMessageId(null);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-left transition-colors mb-1',
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-accent text-foreground'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
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
            <div className="flex-1 overflow-y-auto p-6">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedMessageId(null)}
                className="mb-4"
              >
                ← Retour
              </Button>
              <div className="max-w-4xl">
                <h2 className="text-2xl font-bold mb-4">{selectedMessage.subject}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
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
                  <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>
              </div>
            </div>
          ) : (
            // Messages List View
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-4">
                  {folders.find(f => f.id === selectedFolder)?.label}
                </h2>
                
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Chargement des messages...
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <p className="text-xl font-semibold mb-2">Aucun message</p>
                    <p className="text-sm text-muted-foreground">Aucun message pour ce dossier.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredMessages.map((message) => (
                      <Card
                        key={message.id}
                        className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedMessageId(message.id)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-foreground truncate">
                                {message.subject}
                              </h3>
                              {message.is_draft && (
                                <Badge variant="secondary" className="text-xs">
                                  Brouillon
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {message.content}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>
                                {formatDistanceToNow(new Date(message.created_at), {
                                  addSuffix: true,
                                  locale: fr,
                                })}
                              </span>
                              {message.attachment_count > 0 && (
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {message.attachment_count} pièce(s) jointe(s)
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
