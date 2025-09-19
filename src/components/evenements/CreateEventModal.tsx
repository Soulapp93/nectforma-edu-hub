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

const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    description: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    location: '',
    category: '',
    image_url: '',
    status: 'Ouvert',
    formation_id: 'none',
    audience: ''
  });
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createEventMutation = useCreateEvent();
  const { formations } = useFormations();

  const handleInputChange = (field: keyof CreateEventData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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
    
    if (!formData.title || !formData.category || !formData.start_date || !formData.start_time) {
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
      
      // Préparer les données en nettoyant les valeurs "none"
      const cleanedData = {
        ...formData,
        image_url: imageUrl,
        formation_id: formData.formation_id === 'none' ? undefined : formData.formation_id,
      };
      
      await createEventMutation.mutateAsync(cleanedData);
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        location: '',
        category: '',
        
        image_url: '',
        status: 'Ouvert',
        formation_id: 'none',
        audience: ''
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-4">
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

              <div>
                <Label htmlFor="start_date" className="text-sm font-medium">
                  Date *
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="start_time" className="text-sm font-medium">
                  Heure début *
                </Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => handleInputChange('start_time', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="end_time" className="text-sm font-medium">
                  Heure fin
                </Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => handleInputChange('end_time', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="status" className="text-sm font-medium">
                  Statut
                </Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ouvert">Ouvert</SelectItem>
                    <SelectItem value="Bientôt complet">Bientôt complet</SelectItem>
                    <SelectItem value="Complet">Complet</SelectItem>
                    <SelectItem value="Annulé">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location" className="text-sm font-medium">
                  Lieu
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Ex: Lab A101"
                />
              </div>

              <div>
                <Label htmlFor="formation_id" className="text-sm font-medium">
                  Formation (optionnelle)
                </Label>
                <Select 
                  value={formData.formation_id} 
                  onValueChange={(value) => handleInputChange('formation_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Aucune" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {formations.map(formation => (
                      <SelectItem key={formation.id} value={formation.id}>
                        {formation.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Atelier pratique HTML, CSS, JS avec nos formateurs."
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                      {isUploading ? 'Téléchargement...' : 'Importer'}
                    </Button>
                  )}
                  
                  {(imagePreview || formData.image_url) && (
                    <div className="relative">
                      <img
                        src={imagePreview || formData.image_url}
                        alt="Aperçu"
                        className="w-full h-20 object-cover rounded-lg border"
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

              <div>
                <Label htmlFor="audience" className="text-sm font-medium">
                  Audience
                </Label>
                <Select 
                  value={formData.audience} 
                  onValueChange={(value) => handleInputChange('audience', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Étudiants">Étudiants</SelectItem>
                    <SelectItem value="Formateurs">Formateurs</SelectItem>
                    <SelectItem value="Tous">Tous</SelectItem>
                    <SelectItem value="Administrateurs">Administrateurs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

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
              {createEventMutation.isPending || isUploading ? 'Création...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventModal;