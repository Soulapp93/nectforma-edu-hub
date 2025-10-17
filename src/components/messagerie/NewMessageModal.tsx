import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Paperclip, Upload, X, Search, Users, User } from 'lucide-react';
import { useFormations } from '@/hooks/useFormations';
import { useUsers } from '@/hooks/useUsers';
import { useMessages } from '@/hooks/useMessages';
import { toast } from 'sonner';

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
  const [scheduledDate, setScheduledDate] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedFormations, setSelectedFormations] = useState<string[]>([]);
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);
  const [allInstructors, setAllInstructors] = useState(false);
  const [allFormations, setAllFormations] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sending, setSending] = useState(false);

  const { formations } = useFormations();
  const { users } = useUsers();
  const { sendMessage } = useMessages();

  // Filter users based on search term for individual messages
  useEffect(() => {
    if (activeTab === 'individual' && searchTerm) {
      const filtered = users.filter(user => 
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered.slice(0, 5)); // Limit to 5 suggestions
    } else {
      setFilteredUsers([]);
    }
  }, [searchTerm, users, activeTab]);

  // Get instructors
  const instructors = users.filter(user => user.role === 'Formateur');

  const resetForm = () => {
    setRecipient('');
    setSubject('');
    setMessage('');
    setScheduleDelivery(false);
    setScheduledDate('');
    setAttachments([]);
    setSelectedFormations([]);
    setSelectedInstructors([]);
    setAllInstructors(false);
    setAllFormations(false);
    setSearchTerm('');
    setSending(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSend = async (isDraft = false) => {
    if (!subject || !message) {
      toast.error('Veuillez remplir l\'objet et le message');
      return;
    }

    if (scheduleDelivery && !scheduledDate) {
      toast.error('Veuillez sélectionner une date et heure pour la programmation');
      return;
    }

    try {
      setSending(true);
      
      let recipients: { type: 'user' | 'formation' | 'all_instructors'; ids?: string[] } = { type: 'user' };

      if (activeTab === 'individual') {
        // Find selected user
        const selectedUser = filteredUsers.find(user => 
          `${user.first_name} ${user.last_name}` === recipient || user.email === recipient
        );
        if (!selectedUser) {
          toast.error('Veuillez sélectionner un destinataire valide');
          return;
        }
        recipients = { type: 'user', ids: [selectedUser.id] };
      } else if (activeTab === 'groups') {
        if (!allFormations && selectedFormations.length === 0) {
          toast.error('Veuillez sélectionner au moins une formation');
          return;
        }
        if (allFormations) {
          recipients = { type: 'formation', ids: formations.map(f => f.id) };
        } else {
          recipients = { type: 'formation', ids: selectedFormations };
        }
      } else if (activeTab === 'instructors') {
        if (allInstructors) {
          recipients = { type: 'all_instructors' };
        } else if (selectedInstructors.length === 0) {
          toast.error('Veuillez sélectionner au moins un formateur');
          return;
        } else {
          recipients = { type: 'user', ids: selectedInstructors };
        }
      }

      await sendMessage({
        subject,
        content: message,
        scheduled_for: scheduleDelivery && scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
        is_draft: isDraft,
        recipients,
        attachments
      });

      toast.success(isDraft ? 'Brouillon enregistré' : 'Message envoyé avec succès');
      handleClose();
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du message');
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = () => {
    handleSend(true);
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

  const handleUserSelect = (user: any) => {
    setRecipient(`${user.first_name} ${user.last_name}`);
    setSearchTerm(`${user.first_name} ${user.last_name}`);
    setFilteredUsers([]);
  };

  const handleFormationToggle = (formationId: string) => {
    setSelectedFormations(prev => 
      prev.includes(formationId) 
        ? prev.filter(id => id !== formationId)
        : [...prev, formationId]
    );
  };

  const handleInstructorToggle = (instructorId: string) => {
    setSelectedInstructors(prev => 
      prev.includes(instructorId) 
        ? prev.filter(id => id !== instructorId)
        : [...prev, instructorId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Nouveau message</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="individual" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Message individuel</span>
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Groupes (Formations)</span>
            </TabsTrigger>
            <TabsTrigger value="instructors" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Formateurs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="space-y-4 mt-6">
            <div className="relative">
              <Label htmlFor="recipient" className="text-sm font-medium">
                Destinataire (nom complet)
              </Label>
              <div className="relative">
                <Input
                  id="recipient"
                  placeholder="Tapez le nom complet (ex: Jean Dupont)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              
              {filteredUsers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
                  {filteredUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className="w-full px-4 py-2 text-left hover:bg-muted flex items-center space-x-3"
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {user.first_name[0]}{user.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{user.first_name} {user.last_name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-muted-foreground mt-1">
                L'adresse par nom sera automatiquement liée à l'email de l'utilisateur
              </p>
            </div>
          </TabsContent>

          <TabsContent value="groups" className="space-y-4 mt-6">
            <div>
              <Label className="text-sm font-medium">
                Formations cibles (sélection multiple)
              </Label>
              <div className="mt-2 space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="all-formations"
                    checked={allFormations}
                    onCheckedChange={(checked) => {
                      setAllFormations(checked as boolean);
                      if (checked) {
                        setSelectedFormations([]);
                      }
                    }}
                  />
                  <Label htmlFor="all-formations" className="font-medium">
                    Toutes les formations
                  </Label>
                </div>
                
                {!allFormations && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {formations.map(formation => (
                        <div key={formation.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`formation-${formation.id}`}
                            checked={selectedFormations.includes(formation.id)}
                            onCheckedChange={() => handleFormationToggle(formation.id)}
                          />
                          <Label 
                            htmlFor={`formation-${formation.id}`} 
                            className="text-sm cursor-pointer flex-1"
                          >
                            {formation.title}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Astuce : vous pouvez cocher plusieurs formations pour envoyer le même message à tous leurs étudiants.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="instructors" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="all-instructors"
                  checked={allInstructors}
                  onCheckedChange={(checked) => {
                    setAllInstructors(checked as boolean);
                    if (checked) {
                      setSelectedInstructors([]);
                    }
                  }}
                />
                <Label htmlFor="all-instructors" className="font-medium">
                  Tous les formateurs
                </Label>
              </div>
              
              {!allInstructors && (
                <div>
                  <Label className="text-sm font-medium">
                    Choisir un ou plusieurs formateurs
                  </Label>
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                    {instructors.map(instructor => (
                      <div key={instructor.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`instructor-${instructor.id}`}
                          checked={selectedInstructors.includes(instructor.id)}
                          onCheckedChange={() => handleInstructorToggle(instructor.id)}
                        />
                        <Label 
                          htmlFor={`instructor-${instructor.id}`} 
                          className="text-sm cursor-pointer flex-1"
                        >
                          {instructor.first_name} {instructor.last_name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
              className="mt-1 min-h-[250px] resize-y text-base leading-relaxed p-4"
              rows={10}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length} caractères
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="schedule"
                checked={scheduleDelivery}
                onCheckedChange={(checked) => {
                  setScheduleDelivery(checked as boolean);
                  if (!checked) setScheduledDate('');
                }}
              />
              <Label htmlFor="schedule" className="text-sm font-medium cursor-pointer">
                Programmer l'envoi
              </Label>
            </div>

            {scheduleDelivery && (
              <div className="ml-6 space-y-2 p-4 bg-muted/50 rounded-lg border border-border">
                <Label htmlFor="scheduled-date" className="text-sm font-medium">
                  Date et heure d'envoi
                </Label>
                <Input
                  id="scheduled-date"
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground">
                  Le message sera envoyé automatiquement à la date et l'heure sélectionnées
                </p>
              </div>
            )}
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
          <Button variant="outline" onClick={handleClose} disabled={sending}>
            Annuler
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSaveDraft} 
            disabled={sending}
            className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
          >
            Enregistrer brouillon
          </Button>
          <Button 
            onClick={() => handleSend(false)} 
            disabled={sending}
            className="bg-primary hover:bg-primary/90"
          >
            {sending ? 'Envoi...' : 'Envoyer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewMessageModal;