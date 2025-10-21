import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, FileText, Image as ImageIcon, File, Reply, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useChatMessages } from '@/hooks/useChatGroups';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { chatService } from '@/services/chatService';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage } from '@/services/chatService';

interface ChatRoomProps {
  groupId: string;
  groupName: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ groupId, groupName }) => {
  const [messageText, setMessageText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const { messages, loading, sendMessage, deleteMessage } = useChatMessages(groupId);
  const { userId } = useCurrentUser();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [messageText]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!messageText.trim() && selectedFiles.length === 0) return;
    
    try {
      setUploading(true);
      
      // Send the text message with optional reply
      if (messageText.trim()) {
        const message = await chatService.sendMessage(
          groupId, 
          messageText,
          replyingTo?.id || null
        );
        
        // Upload attachments if any
        if (selectedFiles.length > 0) {
          for (const file of selectedFiles) {
            await chatService.uploadAttachment(message.id, file);
          }
        }
      }
      
      setMessageText('');
      setSelectedFiles([]);
      setReplyingTo(null);
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

  const handleReply = (message: ChatMessage) => {
    setReplyingTo(message);
    textareaRef.current?.focus();
  };

  const handleDelete = async (messageId: string) => {
    if (deleteMessage) {
      await deleteMessage(messageId);
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
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="border-b border-border/50 p-4 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">{groupName[0]}</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{groupName}</h2>
            <p className="text-xs text-muted-foreground">{messages.length} messages</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 bg-transparent" ref={scrollRef}>
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
                    'flex gap-3 animate-fade-in group',
                    isOwnMessage && 'flex-row-reverse'
                  )}
                >
                  <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
                    <AvatarImage src={message.sender?.profile_photo_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                  </Avatar>

                  <div
                    className={cn(
                      'flex flex-col max-w-[75%] relative',
                      isOwnMessage && 'items-end'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-xs font-medium text-foreground">
                        {isOwnMessage ? 'Vous' : senderName}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 relative">
                      {/* Reply Preview */}
                      {message.replied_to_message && (
                        <div className={cn(
                          "text-xs px-3 py-1.5 rounded-lg border-l-2 bg-muted/50",
                          isOwnMessage ? "border-primary-foreground/30" : "border-primary/30"
                        )}>
                          <p className="font-medium text-muted-foreground">
                            {message.replied_to_message.sender?.first_name || 'Utilisateur'}
                          </p>
                          <p className="text-muted-foreground/80 truncate">
                            {message.replied_to_message.content.substring(0, 50)}
                            {message.replied_to_message.content.length > 50 && '...'}
                          </p>
                        </div>
                      )}

                      <div className="flex items-start gap-2">
                        <div
                          className={cn(
                            'rounded-2xl px-4 py-2.5 shadow-sm flex-1',
                            message.is_deleted 
                              ? 'bg-muted text-muted-foreground italic'
                              : isOwnMessage
                                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                : 'bg-card text-foreground border border-border/50 rounded-tl-sm'
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                            {message.content}
                          </p>
                        </div>

                        {/* Message Actions */}
                        {!message.is_deleted && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={isOwnMessage ? "end" : "start"}>
                              <DropdownMenuItem onClick={() => handleReply(message)}>
                                <Reply className="h-4 w-4 mr-2" />
                                Répondre
                              </DropdownMenuItem>
                              {isOwnMessage && (
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(message.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
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
                                'flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:opacity-80 transition-all hover:scale-[1.02] shadow-sm',
                                isOwnMessage
                                  ? 'bg-primary/80 text-primary-foreground'
                                  : 'bg-card/80 text-foreground border border-border/50'
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
      <div className="border-t border-border/50 p-4 bg-card/50 backdrop-blur-sm">
        {/* Reply Preview */}
        {replyingTo && (
          <div className="mb-3 flex items-start gap-2 bg-muted/50 px-3 py-2 rounded-lg border-l-2 border-primary">
            <Reply className="h-4 w-4 mt-0.5 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">
                Répondre à {replyingTo.sender?.first_name || 'Utilisateur'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {replyingTo.content}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setReplyingTo(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-muted/80 px-3 py-2 rounded-xl text-sm shadow-sm border border-border/50"
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

        <div className="flex items-end gap-2">
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
            className="shrink-0 h-10 w-10 rounded-full hover:bg-primary/10"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <div className="flex-1 bg-background border border-border/50 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-ring/20 transition-all">
            <Textarea
              ref={textareaRef}
              placeholder="Écrivez votre message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent px-4 py-3 focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={uploading}
              rows={1}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={(!messageText.trim() && selectedFiles.length === 0) || uploading}
            className="shrink-0 h-10 w-10 rounded-full p-0"
            size="icon"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
