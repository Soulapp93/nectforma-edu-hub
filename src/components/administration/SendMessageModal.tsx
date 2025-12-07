import React, { useState } from 'react';
import { Mail, Send, MessageSquare, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { messageService } from '@/services/messageService';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: { id: string; email: string; firstName: string; lastName: string }[];
}

const SendMessageModal: React.FC<SendMessageModalProps> = ({
  isOpen,
  onClose,
  recipients
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'nectfy' | 'gmail'>('nectfy');

  const handleSendViaGmail = () => {
    const emails = recipients.map(r => r.email).join(',');
    const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(emails)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.open(gmailUrl, '_blank');
    toast.success('Gmail ouvert dans un nouvel onglet');
  };

  const handleSendViaNectfy = async () => {
    if (!subject.trim()) {
      toast.error('Veuillez saisir un sujet');
      return;
    }

    if (!message.trim()) {
      toast.error('Veuillez saisir un message');
      return;
    }

    setLoading(true);
    try {
      // Create message via NECTFY messaging system
      await messageService.createMessage({
        subject,
        content: message,
        recipients: {
          type: 'user',
          ids: recipients.map(r => r.id)
        }
      });

      // Send email notification via Edge Function
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          userEmails: recipients.map(r => r.email),
          title: subject,
          message: 'Vous avez reçu un nouveau message sur votre espace NECTFY. Veuillez vous connecter pour le consulter.',
          type: 'message'
        }
      });

      if (error) {
        console.error('Error sending email notification:', error);
        // Don't fail the whole operation if email notification fails
      }

      toast.success(`Message envoyé à ${recipients.length} destinataire(s)`);
      setSubject('');
      setMessage('');
      onClose();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Envoyer un message
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'nectfy' | 'gmail')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="nectfy" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Via NECTFY
            </TabsTrigger>
            <TabsTrigger value="gmail" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Via Gmail
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-4">
            <div className="text-sm text-muted-foreground">
              {recipients.length} destinataire(s) sélectionné(s)
            </div>

            <div className="max-h-24 overflow-y-auto space-y-1 bg-muted/50 rounded-lg p-3">
              {recipients.map((recipient, index) => (
                <div key={index} className="text-sm flex items-center justify-between">
                  <span className="font-medium">{recipient.firstName} {recipient.lastName}</span>
                  <span className="text-muted-foreground text-xs">{recipient.email}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sujet</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Sujet du message"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Votre message..."
                rows={6}
              />
            </div>
          </div>

          <TabsContent value="nectfy" className="mt-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Message NECTFY :</strong> Les destinataires recevront le message dans leur espace messagerie NECTFY 
                et une notification email les informant qu'ils ont reçu un message.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Annuler
              </Button>
              <Button onClick={handleSendViaNectfy} disabled={loading}>
                {loading ? (
                  'Envoi en cours...'
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer via NECTFY
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="gmail" className="mt-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <strong>Gmail :</strong> Gmail s'ouvrira dans un nouvel onglet avec les destinataires, 
                le sujet et le message pré-remplis. Vous pourrez modifier et envoyer depuis Gmail.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button onClick={handleSendViaGmail} variant="success">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir Gmail
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SendMessageModal;
