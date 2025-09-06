import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Clock, Calendar, User, BookOpen, Upload, X, FileText, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import DocumentViewer from '@/components/ui/document-viewer';
import { textBookService, TextBook, TextBookEntry } from '@/services/textBookService';
import { moduleService, FormationModule } from '@/services/moduleService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const TextBookDetail: React.FC = () => {
  const { textBookId } = useParams<{ textBookId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [textBook, setTextBook] = useState<TextBook | null>(null);
  const [entries, setEntries] = useState<TextBookEntry[]>([]);
  const [modules, setModules] = useState<FormationModule[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAddEntryModalOpen, setIsAddEntryModalOpen] = useState(false);
  const [isEditEntryModalOpen, setIsEditEntryModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TextBookEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { userId } = useCurrentUser();

  // Form state for new entry
  const [newEntry, setNewEntry] = useState({
    date: '',
    start_time: '',
    end_time: '',
    module_id: '',
    content: ''
  });

  // Form state for editing entry
  const [editEntry, setEditEntry] = useState({
    date: '',
    start_time: '',
    end_time: '',
    module_id: '',
    content: ''
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ url: string; name: string } | null>(null);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);


  const fetchTextBookData = async () => {
    if (!textBookId) return;
    
    try {
      setLoading(true);
      
      // Fetch text book details
      const textBookData = await textBookService.getTextBooks();
      const currentTextBook = textBookData?.find(tb => tb.id === textBookId);
      
      if (!currentTextBook) {
        throw new Error('Cahier de texte non trouvé');
      }
      
      setTextBook(currentTextBook);
      
      // Fetch modules for this formation
      if (currentTextBook.formation_id) {
        const modulesData = await moduleService.getFormationModules(currentTextBook.formation_id);
        setModules(modulesData || []);
      }
      
      // Fetch current user details
      if (userId) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .eq('id', userId)
          .single();
        setCurrentUser(userData);
      }
      
      // Fetch entries
      const entriesData = await textBookService.getTextBookEntries(textBookId);
      setEntries((entriesData as any) || []);
      
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du cahier de texte.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTextBookData();
  }, [textBookId]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!textBookId || !newEntry.date || !newEntry.start_time || !newEntry.end_time || !newEntry.module_id) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    const selectedModule = modules.find(m => m.id === newEntry.module_id);
    if (!selectedModule) {
      toast({
        title: "Erreur",
        description: "Module sélectionné non valide.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create entry first
      const newEntryData = await textBookService.createTextBookEntry({
        text_book_id: textBookId,
        date: newEntry.date,
        start_time: newEntry.start_time,
        end_time: newEntry.end_time,
        subject_matter: selectedModule.title,
        content: newEntry.content || undefined,
        instructor_id: userId || undefined,
      });

      // Upload files if any
      if (uploadedFiles.length > 0) {
        await textBookService.uploadEntryFiles(newEntryData.id, uploadedFiles);
      }

      toast({
        title: "Succès",
        description: "L'entrée a été ajoutée avec succès.",
      });

      // Reset form and close modal
      setNewEntry({
        date: '',
        start_time: '',
        end_time: '',
        module_id: '',
        content: ''
      });
      setUploadedFiles([]);
      setIsAddEntryModalOpen(false);
      
      // Refresh entries
      fetchTextBookData();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de l'entrée.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEntry || !editEntry.date || !editEntry.start_time || !editEntry.end_time || !editEntry.module_id) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    const selectedModule = modules.find(m => m.id === editEntry.module_id);
    if (!selectedModule) {
      toast({
        title: "Erreur",
        description: "Module sélectionné non valide.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await textBookService.updateTextBookEntry(selectedEntry.id, {
        date: editEntry.date,
        start_time: editEntry.start_time,
        end_time: editEntry.end_time,
        subject_matter: selectedModule.title,
        content: editEntry.content || undefined,
      });

      toast({
        title: "Succès",
        description: "L'entrée a été modifiée avec succès.",
      });

      setIsEditEntryModalOpen(false);
      setSelectedEntry(null);
      
      // Refresh entries
      fetchTextBookData();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la modification de l'entrée.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!selectedEntry) return;

    try {
      await textBookService.deleteTextBookEntry(selectedEntry.id);

      toast({
        title: "Succès",
        description: "L'entrée a été supprimée avec succès.",
      });

      setIsDeleteConfirmOpen(false);
      setSelectedEntry(null);
      
      // Refresh entries
      fetchTextBookData();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'entrée.",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (entry: TextBookEntry) => {
    const entryModule = modules.find(m => m.title === entry.subject_matter);
    setSelectedEntry(entry);
    setEditEntry({
      date: entry.date,
      start_time: entry.start_time,
      end_time: entry.end_time,
      module_id: entryModule?.id || '',
      content: entry.content || ''
    });
    setIsEditEntryModalOpen(true);
  };

  const openDeleteModal = (entry: TextBookEntry) => {
    setSelectedEntry(entry);
    setIsDeleteConfirmOpen(true);
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // Remove seconds, keep only HH:MM
  };

  const openFileViewer = (fileUrl: string, fileName: string) => {
    setSelectedFile({ url: fileUrl, name: fileName });
    setIsFileViewerOpen(true);
  };

  const closeFileViewer = () => {
    setIsFileViewerOpen(false);
    setSelectedFile(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Chargement du cahier de texte...</p>
        </div>
      </div>
    );
  }

  if (!textBook) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4">Cahier de texte non trouvé</h2>
        <Button onClick={() => navigate('/administration')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à l'administration
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => navigate('/administration')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'administration
          </Button>
          
          <Button onClick={() => setIsAddEntryModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une entrée
          </Button>
        </div>
        
        <div 
          className="rounded-lg p-6 text-white"
          style={{ 
            background: `linear-gradient(135deg, ${textBook.formations?.color || '#8B5CF6'}, ${textBook.formations?.color || '#8B5CF6'}cc)`
          }}
        >
          <div className="flex items-center space-x-3 mb-2">
            <BookOpen className="h-6 w-6" />
            <h1 className="text-2xl font-bold">
              Cahier de texte - {textBook.formations?.title}
            </h1>
          </div>
          <p className="text-white/90">Année académique : {textBook.academic_year}</p>
        </div>
      </div>

      {/* Entries Table */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucune entrée dans ce cahier de texte
                </h3>
                <p className="text-gray-600 mb-6">
                  Commencez par ajouter votre première entrée pour ce cours.
                </p>
                <Button onClick={() => setIsAddEntryModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une entrée
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <div key={entry.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {/* Entry Header */}
                <div 
                  className="grid grid-cols-4 text-white text-sm font-medium"
                  style={{ 
                    background: `linear-gradient(135deg, ${textBook.formations?.color || '#8B5CF6'}, ${textBook.formations?.color || '#8B5CF6'}cc)`
                  }}
                >
                  <div className="p-3 border-r border-white/20">DATE</div>
                  <div className="p-3 border-r border-white/20">HEURE</div>
                  <div className="p-3 border-r border-white/20">MATIÈRE/MODULE</div>
                  <div className="p-3">FORMATEUR</div>
                </div>
                
                {/* Entry Data */}
                <div className="grid grid-cols-4 text-sm">
                  <div className="p-3 border-r border-gray-200 font-medium">
                    {format(new Date(entry.date), 'dd/MM/yyyy', { locale: fr })}
                  </div>
                  <div className="p-3 border-r border-gray-200">
                    {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                  </div>
                  <div className="p-3 border-r border-gray-200 font-medium">
                    {entry.subject_matter}
                  </div>
                  <div className="p-3">
                    {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'N/A'}
                  </div>
                </div>
                
                {/* Content Section */}
                {entry.content && (
                  <div className="bg-purple-50 border-t border-gray-200">
                    <div className="p-4">
                      <div className="bg-white rounded p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-purple-600 font-medium text-sm uppercase tracking-wide">CONTENU</h4>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => openEditModal(entry)}
                              size="sm"
                              variant="outline"
                              className="h-8 px-2"
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Modifier
                            </Button>
                            <Button
                              onClick={() => openDeleteModal(entry)}
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Supprimer
                            </Button>
                          </div>
                        </div>
                        <div 
                          className="prose prose-sm max-w-none text-gray-700"
                          dangerouslySetInnerHTML={{ __html: entry.content }}
                        />
                        
                        {/* Files section */}
                        {entry.files && entry.files.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex flex-wrap gap-2">
                              {entry.files.map((file, fileIndex) => (
                                <button
                                  key={file.id}
                                  onClick={() => openFileViewer(file.file_url, file.file_name)}
                                  className="inline-flex items-center px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Fichier joint {fileIndex + 1}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Entry Modal */}
      <Dialog open={isAddEntryModalOpen} onOpenChange={setIsAddEntryModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle entrée</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleAddEntry} className="space-y-6">
            {/* Date and Time Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="start_time">Heure début</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={newEntry.start_time}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, start_time: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end_time">Heure fin</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={newEntry.end_time}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, end_time: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Instructor Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Formateur</Label>
                <Input
                  value={currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Chargement...'}
                  disabled
                  className="bg-muted"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Email du formateur</Label>
                <Input
                  value={currentUser?.email || 'Chargement...'}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            {/* Module Selection */}
            <div className="space-y-2">
              <Label htmlFor="module">Matière / Module</Label>
              <Select value={newEntry.module_id} onValueChange={(value) => setNewEntry(prev => ({ ...prev, module_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Content with rich text editor */}
            <div className="space-y-2">
              <Label htmlFor="content">Contenu de la séance</Label>
              <RichTextEditor
                value={newEntry.content}
                onChange={(value) => setNewEntry(prev => ({ ...prev, content: value }))}
                placeholder="Décrivez le contenu de la séance..."
                rows={8}
              />
            </div>


            {/* File Upload Section */}
            <div className="space-y-2">
              <Label>Fichiers joints</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                  onChange={(e) => {
                    if (e.target.files) {
                      setUploadedFiles(Array.from(e.target.files));
                    }
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      {uploadedFiles.length > 0 
                        ? `${uploadedFiles.length} fichier(s) sélectionné(s)` 
                        : 'Sélectionnez des fichiers à joindre'}
                    </p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={uploading}
                    >
                      {uploading ? 'Téléchargement...' : 'Sélectionner des fichiers'}
                    </Button>
                  </div>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Fichiers sélectionnés :</h4>
                    <div className="space-y-1">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                          <span className="flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            {file.name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setUploadedFiles(files => files.filter((_, i) => i !== index))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddEntryModalOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Modal */}
      <Dialog open={isEditEntryModalOpen} onOpenChange={setIsEditEntryModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'entrée</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleEditEntry} className="space-y-6">
            {/* Date and Time Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editEntry.date}
                  onChange={(e) => setEditEntry(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-start-time">Heure début</Label>
                <Input
                  id="edit-start-time"
                  type="time"
                  value={editEntry.start_time}
                  onChange={(e) => setEditEntry(prev => ({ ...prev, start_time: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-end-time">Heure fin</Label>
                <Input
                  id="edit-end-time"
                  type="time"
                  value={editEntry.end_time}
                  onChange={(e) => setEditEntry(prev => ({ ...prev, end_time: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Module Selection */}
            <div className="space-y-2">
              <Label htmlFor="edit-module">Matière / Module</Label>
              <Select value={editEntry.module_id} onValueChange={(value) => setEditEntry(prev => ({ ...prev, module_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Content with rich text editor */}
            <div className="space-y-2">
              <Label htmlFor="edit-content">Contenu de la séance</Label>
              <RichTextEditor
                value={editEntry.content}
                onChange={(value) => setEditEntry(prev => ({ ...prev, content: value }))}
                placeholder="Décrivez le contenu de la séance..."
                rows={8}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditEntryModalOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Modification...' : 'Modifier'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              Confirmer la suppression
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer cette entrée ? Cette action est irréversible.
            </p>
            {selectedEntry && (
              <div className="mt-3 p-3 bg-gray-50 rounded">
                <p className="text-sm font-medium">
                  {format(new Date(selectedEntry.date), 'dd/MM/yyyy', { locale: fr })} - {selectedEntry.subject_matter}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleDeleteEntry}
            >
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Viewer */}
      {selectedFile && (
        <DocumentViewer
          fileUrl={selectedFile.url}
          fileName={selectedFile.name}
          isOpen={isFileViewerOpen}
          onClose={closeFileViewer}
        />
      )}
    </div>
  );
};

export default TextBookDetail;