import React, { useState, useEffect } from 'react';
import { Mail, Send, Inbox, FileText, Clock, Heart, Archive, Trash2, RefreshCw, Menu, X, ChevronLeft, Reply, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMessages } from '@/hooks/useMessages';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUsers } from '@/hooks/useUsers';
import NewMessageModal from '@/components/messagerie/NewMessageModal';
import MessageAttachmentsViewer from '@/components/messagerie/MessageAttachmentsViewer';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type FolderType = 'inbox' | 'sent' | 'drafts' | 'scheduled' | 'favorites' | 'archived' | 'trash';

interface ReplyData {
  messageId: string;
  subject: string;
  senderName: string;
  senderId: string;
  originalContent: string;
}

const Messagerie = () => {
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<FolderType>('inbox');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [replyData, setReplyData] = useState<ReplyData | null>(null);
  const { messages, loading, refetch } = useMessages();
  const { userId } = useCurrentUser();
  const { users } = useUsers();

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

  // Get sender info for a message
  const getSenderInfo = (senderId: string) => {
    const sender = users.find(u => u.id === senderId);
    if (sender) {
      return {
        name: `${sender.first_name} ${sender.last_name}`,
        email: sender.email,
        photo: sender.profile_photo_url,
        initials: `${sender.first_name[0]}${sender.last_name[0]}`
      };
    }
    return { name: 'Utilisateur inconnu', email: '', photo: null, initials: '?' };
  };

  const handleFolderSelect = (folderId: FolderType) => {
    setSelectedFolder(folderId);
    setSelectedMessageId(null);
    setIsSidebarOpen(false);
  };

  const handleReply = (message: typeof selectedMessage) => {
    if (!message) return;
    const senderInfo = getSenderInfo(message.sender_id);
    setReplyData({
      messageId: message.id,
      subject: message.subject,
      senderName: senderInfo.name,
      senderId: message.sender_id,
      originalContent: message.content
    });
    setIsNewMessageOpen(true);
  };

  const handleCloseModal = () => {
    setIsNewMessageOpen(false);
    setReplyData(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header modernisé */}
      <div className="p-4 sm:p-6 border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Mobile sidebar toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden shrink-0"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                  <Mail className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Messagerie</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block">
                    Communiquez avec les formateurs, étudiants et l'administration
                  </p>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setIsNewMessageOpen(true)} 
              className="gap-2 shadow-lg hover:shadow-xl transition-all shrink-0"
              size="default"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Nouveau message</span>
              <span className="sm:hidden">Nouveau</span>
            </Button>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Rechercher un message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-sm bg-background/50 border-border/50 focus:border-primary/50"
              />
            </div>
            <Button variant="outline" size="icon" onClick={refetch} disabled={loading} className="shrink-0 bg-background/50">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Folders Sidebar - modernisé */}
        <div className={cn(
          "absolute lg:relative z-50 lg:z-auto h-full w-64 border-r border-border/50 bg-card/95 backdrop-blur-sm overflow-y-auto transition-transform duration-300 ease-in-out",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          <div className="p-3">
            <div className="flex items-center justify-between mb-3 lg:hidden">
              <span className="text-sm font-semibold text-foreground px-2">Dossiers</span>
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {folders.map((folder) => {
                const Icon = folder.icon;
                const isActive = selectedFolder === folder.id;
                
                return (
                  <button
                    key={folder.id}
                    onClick={() => handleFolderSelect(folder.id)}
                    className={cn(
                      'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200',
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-md' 
                        : 'hover:bg-accent/50 text-foreground hover:translate-x-1'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{folder.label}</span>
                    </div>
                    {folder.count > 0 && (
                      <Badge 
                        variant={isActive ? "secondary" : "outline"}
                        className={cn(
                          "text-xs font-semibold",
                          isActive && "bg-primary-foreground/20 text-primary-foreground border-none"
                        )}
                      >
                        {folder.count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Messages List / Detail */}
        <div className="flex-1 overflow-hidden flex flex-col bg-background/30">
          {selectedMessage ? (
            // Message Detail View - modernisé
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedMessageId(null)}
                  className="gap-2 hover:bg-accent/50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Retour
                </Button>
                {selectedFolder === 'inbox' && (
                  <Button 
                    size="sm" 
                    onClick={() => handleReply(selectedMessage)}
                    className="gap-2 shadow-md"
                  >
                    <Reply className="h-4 w-4" />
                    Répondre
                  </Button>
                )}
              </div>
              <div className="max-w-4xl mx-auto">
                {/* Sender info - card améliorée */}
                {(() => {
                  const senderInfo = getSenderInfo(selectedMessage.sender_id);
                  return (
                    <Card className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-muted/50 to-muted/30 border-border/50 shadow-sm">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                        <AvatarImage src={senderInfo.photo || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                          {senderInfo.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{senderInfo.name}</p>
                        <p className="text-sm text-muted-foreground">{senderInfo.email}</p>
                      </div>
                    </Card>
                  );
                })()}
                
                <h2 className="text-xl sm:text-2xl font-bold mb-4 text-foreground">{selectedMessage.subject}</h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-6">
                  <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDistanceToNow(new Date(selectedMessage.created_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                  {selectedMessage.attachment_count > 0 && (
                    <span className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full">
                      <FileText className="h-3.5 w-3.5" />
                      {selectedMessage.attachment_count} pièce(s) jointe(s)
                    </span>
                  )}
                </div>
                
                {/* Contenu du message */}
                <Card className="bg-card border-border/50 shadow-sm overflow-hidden">
                  <div className="p-6">
                    <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90">{selectedMessage.content}</p>
                  </div>
                </Card>
                
                {/* Pièces jointes avec viewer */}
                <MessageAttachmentsViewer messageId={selectedMessage.id} />
                
                {/* Quick reply button at bottom */}
                {selectedFolder === 'inbox' && (
                  <div className="mt-8 pt-6 border-t border-border/50">
                    <Button 
                      onClick={() => handleReply(selectedMessage)}
                      className="w-full sm:w-auto gap-2 shadow-lg"
                      size="lg"
                    >
                      <Reply className="h-4 w-4" />
                      Répondre à ce message
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Messages List View - modernisé
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                    {folders.find(f => f.id === selectedFolder)?.label}
                  </h2>
                  <Badge variant="secondary" className="text-xs">
                    {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                {loading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-8 w-8 mx-auto text-primary animate-spin mb-3" />
                    <p className="text-muted-foreground">Chargement des messages...</p>
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="h-20 w-20 mx-auto bg-muted/50 rounded-full flex items-center justify-center mb-4">
                      <Mail className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <p className="text-xl font-semibold mb-2 text-foreground">Aucun message</p>
                    <p className="text-sm text-muted-foreground">Aucun message dans ce dossier.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredMessages.map((message) => {
                      const senderInfo = getSenderInfo(message.sender_id);
                      return (
                        <Card
                          key={message.id}
                          className="p-4 hover:shadow-lg transition-all duration-200 cursor-pointer border-border/50 hover:border-primary/30 bg-card/80 backdrop-blur-sm group"
                          onClick={() => setSelectedMessageId(message.id)}
                        >
                          <div className="flex items-start gap-4">
                            <Avatar className="h-11 w-11 shrink-0 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                              <AvatarImage src={senderInfo.photo || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                                {senderInfo.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-foreground truncate">{senderInfo.name}</span>
                                {message.is_draft && (
                                  <Badge variant="secondary" className="text-xs shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                    Brouillon
                                  </Badge>
                                )}
                              </div>
                              <h3 className="font-semibold text-foreground truncate text-base mb-1.5 group-hover:text-primary transition-colors">
                                {message.subject}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {message.content}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(message.created_at), {
                                    addSuffix: true,
                                    locale: fr,
                                  })}
                                </span>
                                {message.attachment_count > 0 && (
                                  <span className="flex items-center gap-1 text-primary">
                                    <FileText className="h-3 w-3" />
                                    {message.attachment_count}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronLeft className="h-5 w-5 text-muted-foreground/50 rotate-180 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <NewMessageModal
        isOpen={isNewMessageOpen}
        onClose={handleCloseModal}
        replyTo={replyData || undefined}
      />
    </div>
  );
};

export default Messagerie;
