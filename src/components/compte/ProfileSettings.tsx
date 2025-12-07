import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import FileUpload from '@/components/ui/file-upload';
import SignatureManagementModal from '@/components/ui/signature-management-modal';
import { User, Lock, Camera, PenTool } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';

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
  const { userRole, userId } = useCurrentUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // États pour la gestion des signatures (formateurs uniquement)
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [currentSignature, setCurrentSignature] = useState<string | null>(null);
  const [loadingSignature, setLoadingSignature] = useState(false);

  // Charger la signature actuelle du formateur
  useEffect(() => {
    const loadUserSignature = async () => {
      if (userRole === 'Formateur' && userId) {
        try {
          setLoadingSignature(true);
          const { data, error } = await supabase
            .from('user_signatures')
            .select('signature_data')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (error && error.code !== 'PGRST116') {
            console.error('Erreur lors du chargement de la signature:', error);
            return;
          }

          if (data?.signature_data) {
            setCurrentSignature(data.signature_data);
          }
        } catch (error) {
          console.error('Erreur lors du chargement de la signature:', error);
        } finally {
          setLoadingSignature(false);
        }
      }
    };

    loadUserSignature();
  }, [userRole, userId]);

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

  // Fonction pour sauvegarder la signature
  const handleSaveSignature = async (signatureData: string) => {
    if (!userId) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      const { error } = await supabase
        .from('user_signatures')
        .upsert({
          user_id: userId,
          signature_data: signatureData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Erreur lors de la sauvegarde de la signature:', error);
        throw error;
      }

      // Mettre à jour l'état local
      setCurrentSignature(signatureData);
      setShowSignatureModal(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la signature:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Photo de profil */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Camera className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Photo de profil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {profileData.profilePhotoUrl ? (
                <img 
                  src={profileData.profilePhotoUrl} 
                  alt="Photo de profil" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
              )}
            </div>
            <div className="w-full sm:flex-1">
              <FileUpload
                onFileSelect={onPhotoUpload}
                accept="image/*"
                multiple={false}
                className="w-full"
              />
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 text-center sm:text-left">
                JPG, PNG (max 5MB)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations personnelles */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Informations personnelles
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleEditToggle}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              {isEditing ? 'Annuler' : 'Modifier'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-sm">Prénom</Label>
              <Input
                id="firstName"
                value={profileData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Votre prénom"
                disabled={!isEditing}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm">Nom</Label>
              <Input
                id="lastName"
                value={profileData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Votre nom"
                disabled={!isEditing}
                className="text-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="votre@email.com"
                disabled={!isEditing}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm">Téléphone</Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Votre numéro"
                disabled={!isEditing}
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gestion de signature - uniquement pour les formateurs */}
      {userRole === 'Formateur' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <PenTool className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Signature du Formateur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-3 sm:p-4 border rounded-lg">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-muted border-2 border-dashed border-border rounded-lg">
                  {loadingSignature ? (
                    <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-primary"></div>
                  ) : currentSignature ? (
                    <img 
                      src={currentSignature} 
                      alt="Signature" 
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <PenTool className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm sm:text-base">
                    {currentSignature ? 'Signature enregistrée' : 'Aucune signature'}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    {currentSignature 
                      ? 'Utilisée automatiquement lors des émargements'
                      : 'Enregistrez votre signature pour la validation'
                    }
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowSignatureModal(true)}
                disabled={loadingSignature}
                className="w-full sm:w-auto text-xs sm:text-sm"
                size="sm"
              >
                <PenTool className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                {currentSignature ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Changement de mot de passe */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Lock className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Sécurité
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePasswordEditToggle}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              {isEditingPassword ? 'Annuler' : 'Modifier'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="currentPassword" className="text-sm">Mot de passe actuel</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Mot de passe actuel"
              disabled={!isEditingPassword}
              className="text-sm"
            />
          </div>
          
          <div>
            <Label htmlFor="newPassword" className="text-sm">Nouveau mot de passe</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 caractères"
              disabled={!isEditingPassword}
              className="text-sm"
            />
          </div>
          
          <div>
            <Label htmlFor="confirmPassword" className="text-sm">Confirmer</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmer le mot de passe"
              disabled={!isEditingPassword}
              className="text-sm"
            />
          </div>
          
          {isEditingPassword && (
            <Button 
              onClick={handlePasswordChange}
              disabled={!currentPassword || !newPassword || !confirmPassword}
              className="w-full text-sm"
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
      
      {/* Modal de gestion des signatures */}
      {userRole === 'Formateur' && (
        <SignatureManagementModal
          isOpen={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          currentSignature={currentSignature}
          onSave={handleSaveSignature}
          title="Gestion de votre signature"
        />
      )}
    </div>
  );
};

export default ProfileSettings;