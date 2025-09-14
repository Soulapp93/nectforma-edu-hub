import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import FileUpload from '@/components/ui/file-upload';
import { User, Lock, Camera } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePhotoUrl?: string;
}

interface ProfileSettingsProps {
  profileData: ProfileData;
  onProfileDataChange: (data: ProfileData) => void;
  onPhotoUpload: (files: File[]) => void;
  onSave: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  profileData,
  onProfileDataChange,
  onPhotoUpload,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    onProfileDataChange({
      ...profileData,
      [field]: value
    });
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handlePasswordEditToggle = () => {
    setIsEditingPassword(!isEditingPassword);
    if (!isEditingPassword) {
      // Reset les champs quand on active l'édition
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleSave = () => {
    onSave();
    setIsEditing(false);
    toast.success('Profil mis à jour avec succès');
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    // Ici vous pourriez ajouter la logique pour changer le mot de passe
    toast.success('Mot de passe mis à jour avec succès');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsEditingPassword(false);
  };

  return (
    <div className="space-y-6">
      {/* Photo de profil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Camera className="h-5 w-5 mr-2" />
            Photo de profil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {profileData.profilePhotoUrl ? (
                <img 
                  src={profileData.profilePhotoUrl} 
                  alt="Photo de profil" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-gray-400" />
              )}
            </div>
            <div>
              <FileUpload
                onFileSelect={onPhotoUpload}
                accept="image/*"
                multiple={false}
                className="w-auto"
              />
              <p className="text-sm text-gray-500 mt-1">
                Formats acceptés: JPG, PNG (max 5MB)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations personnelles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Informations personnelles
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleEditToggle}
            >
              {isEditing ? 'Annuler' : 'Modifier les informations'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={profileData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Votre prénom"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={profileData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Votre nom"
                disabled={!isEditing}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="votre@email.com"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Votre numéro de téléphone"
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Changement de mot de passe */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Sécurité
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePasswordEditToggle}
            >
              {isEditingPassword ? 'Annuler' : 'Modifier mot de passe'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Saisissez votre mot de passe actuel"
              disabled={!isEditingPassword}
            />
          </div>
          
          <div>
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nouveau mot de passe (min. 6 caractères)"
              disabled={!isEditingPassword}
            />
          </div>
          
          <div>
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmez votre nouveau mot de passe"
              disabled={!isEditingPassword}
            />
          </div>
          
          {isEditingPassword && (
            <Button 
              onClick={handlePasswordChange}
              disabled={!currentPassword || !newPassword || !confirmPassword}
              className="w-full md:w-auto"
            >
              Changer le mot de passe
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Bouton de sauvegarde */}
      {isEditing && (
        <div className="flex justify-end">
          <Button onClick={handleSave} className="px-6">
            Sauvegarder les modifications
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;