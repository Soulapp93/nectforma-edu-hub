import React, { useState } from 'react';
import { Mail, Send, Inbox, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMessages } from '@/hooks/useMessages';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import NewMessageModal from '@/components/messagerie/NewMessageModal';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const Messagerie = () => {
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { messages, loading } = useMessages();
  const { userId } = useCurrentUser();

  // Séparer les messages envoyés et reçus
  const sentMessages = messages.filter(msg => msg.sender_id === userId);
  const receivedMessages = messages.filter(msg => msg.sender_id !== userId);

  // Filtrer les messages par terme de recherche
  const filterMessages = (msgs: typeof messages) => {
    if (!searchTerm) return msgs;
    return msgs.filter(msg => 
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredSentMessages = filterMessages(sentMessages);
  const filteredReceivedMessages = filterMessages(receivedMessages);

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
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Messagerie</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gérez vos communications
          </p>
        </div>
        <Button onClick={() => setIsNewMessageOpen(true)} className="gap-2">
          <Mail className="h-4 w-4" />
          Nouveau message
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <Input
          placeholder="Rechercher dans les messages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Messages Tabs */}
      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="received" className="gap-2">
            <Inbox className="h-4 w-4" />
            Reçus ({filteredReceivedMessages.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <Send className="h-4 w-4" />
            Envoyés ({filteredSentMessages.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des messages...
            </div>
          ) : filteredReceivedMessages.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">Aucun message reçu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReceivedMessages.map((message) => (
                <MessageCard key={message.id} message={message} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des messages...
            </div>
          ) : filteredSentMessages.length === 0 ? (
            <div className="text-center py-12">
              <Send className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">Aucun message envoyé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSentMessages.map((message) => (
                <MessageCard key={message.id} message={message} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <NewMessageModal
        isOpen={isNewMessageOpen}
        onClose={() => setIsNewMessageOpen(false)}
      />
    </div>
  );
};

export default Messagerie;
