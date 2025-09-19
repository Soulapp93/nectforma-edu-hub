import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X } from 'lucide-react';
import { useCreateEvent } from '@/hooks/useEvents';
import { useFormations } from '@/hooks/useFormations';
import { CreateEventData } from '@/services/eventService';
import { fileUploadService } from '@/services/fileUploadService';
import { toast } from 'sonner';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = [
  'Conférence',
  'Atelier', 
  'Présentation',
  'Cérémonie',
  'Formation',
  'Networking',
  'Porte ouverte'
];

const audiences = [
  'Étudiants',
  'Formateurs', 
  'Administrateurs',
  'Tous'
];

const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    description: '',
    category: '',
    image_url: '',
    formation_ids: [],
    audiences: []
  });
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createEventMutation = useCreateEvent();
  const { formations } = useFormations();

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

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image valide');
        return;
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 5MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async (): Promise<string | null> => {
    if (!selectedImage) return null;
    
    setIsUploading(true);
    try {
      const imageUrl = await fileUploadService.uploadFile(selectedImage, 'event-images');
      toast.success('Image téléchargée avec succès');
      return imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erreur lors du téléchargement de l\'image');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    handleInputChange('image_url', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category) {
      return;
    }

    try {
      let imageUrl = formData.image_url;
      
      // Upload image if selected (but don't fail if upload fails)
      if (selectedImage) {
        try {
          const uploadedUrl = await handleImageUpload();
          if (uploadedUrl) {
            imageUrl = uploadedUrl;
          }
        } catch (error) {
          console.warn('Image upload failed, proceeding without image:', error);
          // Continue without image
        }
      }
      
      // Préparer les données 
      const cleanedData = {
        ...formData,
        image_url: imageUrl,
      };
      
      await createEventMutation.mutateAsync(cleanedData);
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        image_url: '',
        formation_ids: [],
        audiences: []
      });
      setSelectedImage(null);
      setImagePreview('');
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un nouvel événement</DialogTitle>
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

          {/* Image */}
          <div>
            <Label className="text-sm font-medium">Image</Label>
            <div className="space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              
              {!imagePreview && !formData.image_url && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Téléchargement...' : 'Importer une image'}
                </Button>
              )}
              
              {(imagePreview || formData.image_url) && (
                <div className="relative">
                  <img
                    src={imagePreview || formData.image_url}
                    alt="Aperçu"
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              <Input
                type="url"
                value={formData.image_url}
                onChange={(e) => {
                  handleInputChange('image_url', e.target.value);
                  if (e.target.value && !selectedImage) {
                    setImagePreview('');
                  }
                }}
                placeholder="ou URL d'image"
                className="text-xs"
              />
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
            <p className="text-xs text-gray-500 mt-1">
              L'événement ne sera visible que pour les formations sélectionnées
            </p>
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
            <p className="text-xs text-gray-500 mt-1">
              L'événement ne sera visible que pour les audiences sélectionnées
            </p>
          </div>

          {/* Catégorie */}
          <div>
            <Label htmlFor="category" className="text-sm font-medium">
              Catégorie *
            </Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createEventMutation.isPending}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={createEventMutation.isPending || isUploading || !formData.title || !formData.category}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {createEventMutation.isPending || isUploading ? 'Création...' : 'Créer l\'événement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventModal;