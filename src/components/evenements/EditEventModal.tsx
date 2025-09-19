import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, FileText } from 'lucide-react';
import { useUpdateEvent } from '@/hooks/useEvents';
import { useFormations } from '@/hooks/useFormations';
import { Event, CreateEventData } from '@/services/eventService';
import { fileUploadService } from '@/services/fileUploadService';
import { toast } from 'sonner';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
}

const audiences = [
  'Étudiants',
  'Formateurs', 
  'Administrateurs',
  'Tous'
];

const EditEventModal: React.FC<EditEventModalProps> = ({ isOpen, onClose, event }) => {
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    description: '',
    formation_ids: [],
    audiences: [],
    file_urls: []
  });
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateEventMutation = useUpdateEvent();
  const { formations } = useFormations();

  // Initialize form data when event changes
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        formation_ids: event.formation_ids || [],
        audiences: event.audiences || [],
        file_urls: event.file_urls || []
      });
    }
  }, [event]);

  const handleInputChange = (field: keyof CreateEventData, value: string | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFormationChange = (formationId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      formation_ids: checked 
        ? [...prev.formation_ids, formationId]
        : prev.formation_ids.filter(id => id !== formationId)
    }));
  };

  const handleAudienceChange = (audience: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      audiences: checked 
        ? [...prev.audiences, audience]
        : prev.audiences.filter(a => a !== audience)
    }));
  };

  const handleSelectAllFormations = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      formation_ids: checked ? formations.map(f => f.id) : []
    }));
  };

  const handleSelectAllAudiences = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      audiences: checked ? audiences : []
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      // Vérifier la taille totale (max 20MB au total)
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      if (totalSize > 20 * 1024 * 1024) {
        toast.error('La taille totale des fichiers ne doit pas dépasser 20MB');
        return;
      }
      
      setSelectedFiles(prevFiles => [...prevFiles, ...files]);
    }
  };

  const handleFileUpload = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return [];
    
    setIsUploading(true);
    try {
      const uploadPromises = selectedFiles.map(file => 
        fileUploadService.uploadFile(file, 'event-files')
      );
      const fileUrls = await Promise.all(uploadPromises);
      toast.success('Nouveaux fichiers téléchargés avec succès');
      return fileUrls;
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Erreur lors du téléchargement des fichiers');
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      file_urls: prev.file_urls.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      return;
    }

    try {
      let newFileUrls: string[] = [];
      
      // Upload new files if selected
      if (selectedFiles.length > 0) {
        try {
          newFileUrls = await handleFileUpload();
        } catch (error) {
          console.warn('File upload failed, proceeding without new files:', error);
        }
      }
      
      // Combine existing files with new files
      const allFileUrls = [...formData.file_urls, ...newFileUrls];
      
      // Préparer les données 
      const cleanedData = {
        ...formData,
        file_urls: allFileUrls,
      };
      
      await updateEventMutation.mutateAsync({ 
        eventId: event.id, 
        eventData: cleanedData 
      });
      onClose();
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'événement</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Titre */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium">
              Titre *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Ex: Atelier Développement Web"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Description de l'événement..."
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Fichiers existants */}
          {formData.file_urls.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Fichiers actuels</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {formData.file_urls.map((fileUrl, index) => (
                  <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="text-sm">Fichier {index + 1}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExistingFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nouveaux fichiers */}
          <div>
            <Label className="text-sm font-medium">Ajouter de nouveaux fichiers</Label>
            <div className="space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                className="hidden"
              />
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Téléchargement...' : 'Ajouter des fichiers'}
              </Button>
              
              {selectedFiles.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({(file.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Formations */}
          <div>
            <Label className="text-sm font-medium">Formations concernées</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
              <div className="flex items-center space-x-2 pb-2 border-b">
                <input
                  type="checkbox"
                  id="all-formations"
                  checked={formData.formation_ids.length === formations.length}
                  onChange={(e) => handleSelectAllFormations(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="all-formations" className="text-sm font-medium">
                  Toutes les formations
                </label>
              </div>
              {formations.map(formation => (
                <div key={formation.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`formation-${formation.id}`}
                    checked={formData.formation_ids.includes(formation.id)}
                    onChange={(e) => handleFormationChange(formation.id, e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor={`formation-${formation.id}`} className="text-sm">
                    {formation.title}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Audiences */}
          <div>
            <Label className="text-sm font-medium">Audiences concernées</Label>
            <div className="space-y-2 border rounded-lg p-3">
              <div className="flex items-center space-x-2 pb-2 border-b">
                <input
                  type="checkbox"
                  id="all-audiences"
                  checked={formData.audiences.length === audiences.length}
                  onChange={(e) => handleSelectAllAudiences(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="all-audiences" className="text-sm font-medium">
                  Toutes les audiences
                </label>
              </div>
              {audiences.map(audience => (
                <div key={audience} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`audience-${audience}`}
                    checked={formData.audiences.includes(audience)}
                    onChange={(e) => handleAudienceChange(audience, e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor={`audience-${audience}`} className="text-sm">
                    {audience}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateEventMutation.isPending}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={updateEventMutation.isPending || isUploading || !formData.title}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {updateEventMutation.isPending || isUploading ? 'Modification...' : 'Modifier l\'événement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEventModal;