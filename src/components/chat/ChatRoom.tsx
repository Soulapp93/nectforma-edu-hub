import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, FileText, Image as ImageIcon, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChatMessages } from '@/hooks/useChatGroups';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { chatService } from '@/services/chatService';
import { useToast } from '@/hooks/use-toast';

interface ChatRoomProps {
  groupId: string;
  groupName: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ groupId, groupName }) => {
  const [messageText, setMessageText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { messages, loading, sendMessage } = useChatMessages(groupId);
  const { userId } = useCurrentUser();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!messageText.trim() && selectedFiles.length === 0) return;
    
    try {
      setUploading(true);
      
      // Send the text message first
      if (messageText.trim()) {
        const message = await chatService.sendMessage(groupId, messageText);
        
        // Upload attachments if any
        if (selectedFiles.length > 0) {
          for (const file of selectedFiles) {
            await chatService.uploadAttachment(message.id, file);
          }
        }
      }
      
      setMessageText('');
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (contentType.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border p-4">
        <h2 className="text-xl font-semibold text-foreground">{groupName}</h2>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {loading && messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Chargement des messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Aucun message pour le moment. Soyez le premier à écrire !
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.sender_id === userId;
              const senderName = message.sender
                ? `${message.sender.first_name} ${message.sender.last_name}`
                : 'Utilisateur';
              const initials = message.sender
                ? `${message.sender.first_name[0]}${message.sender.last_name[0]}`
                : 'U';

              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    isOwnMessage && 'flex-row-reverse'
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.sender?.profile_photo_url || ''} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>

                  <div
                    className={cn(
                      'flex flex-col max-w-[70%]',
                      isOwnMessage && 'items-end'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {isOwnMessage ? 'Vous' : senderName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div
                        className={cn(
                          'rounded-lg px-4 py-2',
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>

                      {/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="flex flex-col gap-1">
                          {message.attachments.map((attachment) => (
                            <a
                              key={attachment.id}
                              href={attachment.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:opacity-80 transition-opacity',
                                isOwnMessage
                                  ? 'bg-primary/80 text-primary-foreground'
                                  : 'bg-muted/80 text-foreground'
                              )}
                            >
                              {getFileIcon(attachment.content_type || '')}
                              <span className="truncate max-w-[200px]">
                                {attachment.file_name}
                              </span>
                              {attachment.file_size && (
                                <span className="text-xs opacity-70">
                                  ({Math.round(attachment.file_size / 1024)} KB)
                                </span>
                              )}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-4">
        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg text-sm"
              >
                {getFileIcon(file.type)}
                <span className="truncate max-w-[150px]">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="ml-1 hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Écrivez votre message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            disabled={uploading}
          />
          <Button
            onClick={handleSend}
            disabled={(!messageText.trim() && selectedFiles.length === 0) || uploading}
            className="shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
