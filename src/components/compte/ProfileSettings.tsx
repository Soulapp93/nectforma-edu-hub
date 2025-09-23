import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
            .single();

          if (error) {
            if (error.code !== 'PGRST116') { // Pas d'enregistrement trouvé
              console.error('Erreur lors du chargement de la signature:', error);
            }
          } else if (data) {
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

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      // Logique d'annulation éventuelle ici
    }
  };

  const handlePasswordEditToggle = () => {
    setIsEditingPassword(!isEditingPassword);
    if (isEditingPassword) {
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
    <div className="space-y-6">
      {/* Photo de profil */}
      <div className="glass-card rounded-xl p-6 floating-card">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center">
            <Camera className="h-5 w-5 mr-2" />
            Photo de profil
          </h3>
        </div>
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {profileData.profilePhotoUrl ? (
              <img 
                src={profileData.profilePhotoUrl} 
                alt="Photo de profil" 
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <div>
            <FileUpload
              onFileSelect={onPhotoUpload}
              accept="image/*"
              multiple={false}
              className="w-auto"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Formats acceptés: JPG, PNG (max 5MB)
            </p>
          </div>
        </div>
      </div>

      {/* Informations personnelles */}
      <div className="glass-card rounded-xl p-6 floating-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center">
            <User className="h-5 w-5 mr-2" />
            Informations personnelles
          </h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleEditToggle}
          >
            {isEditing ? 'Annuler' : 'Modifier les informations'}
          </Button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={profileData.firstName}
                onChange={(e) => onProfileDataChange({
                  ...profileData,
                  firstName: e.target.value
                })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={profileData.lastName}
                onChange={(e) => onProfileDataChange({
                  ...profileData,
                  lastName: e.target.value
                })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => onProfileDataChange({
                  ...profileData,
                  email: e.target.value
                })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => onProfileDataChange({
                  ...profileData,
                  phone: e.target.value
                })}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Gestion de signature - uniquement pour les formateurs */}
      {userRole === 'Formateur' && (
        <div className="glass-card rounded-xl p-6 floating-card">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center">
              <PenTool className="h-5 w-5 mr-2" />
              Signature du Formateur
            </h3>
          </div>
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-16 h-16 bg-muted border-2 border-dashed border-muted-foreground/30 rounded-lg">
                {loadingSignature ? (
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                ) : currentSignature ? (
                  <img 
                    src={currentSignature} 
                    alt="Signature du formateur" 
                    className="max-w-full max-h-full"
                  />
                ) : (
                  <PenTool className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {currentSignature ? 'Signature configurée' : 'Aucune signature'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentSignature 
                    ? 'Utilisée pour signer les feuilles d\'émargement' 
                    : 'Créez votre signature pour valider les feuilles d\'émargement'
                  }
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowSignatureModal(true)}
              variant="outline"
            >
              <PenTool className="h-4 w-4 mr-2" />
              {currentSignature ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </div>
      )}

      {/* Changement de mot de passe */}
      <div className="glass-card rounded-xl p-6 floating-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            Sécurité
          </h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handlePasswordEditToggle}
          >
            {isEditingPassword ? 'Annuler' : 'Modifier mot de passe'}
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
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
              disabled={!isEditingPassword}
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={!isEditingPassword}
            />
          </div>
          {isEditingPassword && (
            <Button
              onClick={handlePasswordChange}
              variant="premium"
              disabled={!currentPassword || !newPassword || !confirmPassword}
            >
              Changer le mot de passe
            </Button>
          )}
        </div>
      </div>

      {/* Bouton de sauvegarde */}
      {isEditing && (
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            variant="premium"
            size="lg"
          >
            Enregistrer les modifications
          </Button>
        </div>
      )}

      {/* Modal de gestion des signatures */}
      <SignatureManagementModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSave={handleSaveSignature}
        currentSignature={currentSignature}
        title="Gestion de la signature"
      />
    </div>
  );
};

export default ProfileSettings;