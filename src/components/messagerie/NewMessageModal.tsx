import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Paperclip, Upload, X } from 'lucide-react';

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewMessageModal = ({ isOpen, onClose }: NewMessageModalProps) => {
  const [activeTab, setActiveTab] = useState('individual');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [scheduleDelivery, setScheduleDelivery] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleSend = () => {
    // Logique d'envoi du message
    console.log('Envoi du message:', { activeTab, recipient, subject, message, scheduleDelivery, attachments });
    onClose();
  };

  const handleSaveDraft = () => {
    // Logique de sauvegarde en brouillon
    console.log('Sauvegarde en brouillon:', { activeTab, recipient, subject, message });
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachments(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau message</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="individual" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Message individuel
            </TabsTrigger>
            <TabsTrigger value="groups" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Groupes (Formations)
            </TabsTrigger>
            <TabsTrigger value="instructors" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Formateurs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="space-y-4 mt-6">
            <div>
              <Label htmlFor="recipient" className="text-sm font-medium">
                Destinataire (nom complet)
              </Label>
              <Input
                id="recipient"
                placeholder="Tapez le nom complet (ex: Jean Dupont)"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                L'adresse par nom sera automatiquement liée à l'email de l'utilisateur
              </p>
            </div>
          </TabsContent>

          <TabsContent value="groups" className="space-y-4 mt-6">
            <div>
              <Label htmlFor="group-recipient" className="text-sm font-medium">
                Sélectionner une formation
              </Label>
              <Input
                id="group-recipient"
                placeholder="Rechercher une formation..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="mt-1"
              />
            </div>
          </TabsContent>

          <TabsContent value="instructors" className="space-y-4 mt-6">
            <div>
              <Label htmlFor="instructor-recipient" className="text-sm font-medium">
                Sélectionner des formateurs
              </Label>
              <Input
                id="instructor-recipient"
                placeholder="Rechercher des formateurs..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="mt-1"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-4 mt-6">
          <div>
            <Label htmlFor="subject" className="text-sm font-medium">
              Objet
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="message" className="text-sm font-medium">
              Message
            </Label>
            <Textarea
              id="message"
              placeholder="Votre message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 min-h-[120px]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="schedule"
              checked={scheduleDelivery}
              onCheckedChange={(checked) => setScheduleDelivery(checked as boolean)}
            />
            <Label htmlFor="schedule" className="text-sm">
              Programmer l'envoi
            </Label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Paperclip className="h-4 w-4" />
              <span>Pièces jointes</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('file-upload')?.click()}
                className="text-primary hover:text-primary"
              >
                <Upload className="h-4 w-4 mr-1" />
                Ajouter des fichiers
              </Button>
              <input
                id="file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                    <span className="text-sm truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="outline" onClick={handleSaveDraft} className="text-primary border-primary hover:bg-primary hover:text-primary-foreground">
            Enregistrer brouillon
          </Button>
          <Button onClick={handleSend} className="bg-primary hover:bg-primary/90">
            Envoyer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewMessageModal;