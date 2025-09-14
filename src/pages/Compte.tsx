import React, { useState, useEffect } from 'react';
import AccountTabs from '../components/compte/AccountTabs';
import EstablishmentSettings from '../components/compte/EstablishmentSettings';
import ProfileSettings from '../components/compte/ProfileSettings';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';

type EstablishmentDataState = {
  name: string;
  phone: string;
  website: string;
  address: string;
  type: string;
  director: string;
  siret: string;
  numberOfUsers: number;
  logoUrl?: string;
};

const Compte = () => {
  const { userRole } = useCurrentUser();
  
  // TOUS LES HOOKS DOIVENT ÊTRE APPELÉS EN PREMIER - JAMAIS APRÈS UN RETURN CONDITIONNEL
  const [activeTab, setActiveTab] = useState(
    userRole === 'AdminPrincipal' ? 'establishment' : 'profile'
  );
  const [adminData, setAdminData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    personalAddress: ''
  });

  const [establishmentData, setEstablishmentData] = useState<EstablishmentDataState>({
    name: '',
    phone: '',
    website: '',
    address: '',
    type: '',
    director: '',
    siret: '',
    numberOfUsers: 0
  });

  // État pour les données de profil utilisateur
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    profilePhotoUrl: undefined as string | undefined
  });

  // Charger les données sauvegardées au montage du composant
  useEffect(() => {
    const savedAdminData = localStorage.getItem('adminData');
    const savedEstablishmentData = localStorage.getItem('establishmentData');
    const savedProfileData = localStorage.getItem('profileData');

    if (savedAdminData) {
      try {
        setAdminData(JSON.parse(savedAdminData));
      } catch (error) {
        console.error('Erreur lors du chargement des données admin:', error);
      }
    }

    if (savedEstablishmentData) {
      try {
        setEstablishmentData(JSON.parse(savedEstablishmentData));
      } catch (error) {
        console.error('Erreur lors du chargement des données établissement:', error);
      }
    }

    if (savedProfileData) {
      try {
        setProfileData(JSON.parse(savedProfileData));
      } catch (error) {
        console.error('Erreur lors du chargement des données profil:', error);
      }
    }

    // Ajuster l'onglet actif selon le rôle de l'utilisateur
    setActiveTab(userRole === 'AdminPrincipal' ? 'establishment' : 'profile');
  }, [userRole]);

  const handleLogoUpload = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      // Créer une URL temporaire pour prévisualiser l'image
      const logoUrl = URL.createObjectURL(file);
      setEstablishmentData(prev => ({ ...prev, logoUrl }));
      
      // Sauvegarder le logo en base64 pour la persistance
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoData = e.target?.result as string;
        setEstablishmentData(prev => ({ ...prev, logoUrl: logoData }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEstablishment = () => {
    try {
      // Sauvegarder les données dans localStorage
      localStorage.setItem('adminData', JSON.stringify(adminData));
      localStorage.setItem('establishmentData', JSON.stringify(establishmentData));
      
      toast.success('Informations sauvegardées avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde des informations');
    }
  };

  const handleProfilePhotoUpload = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoData = e.target?.result as string;
        setProfileData(prev => ({ ...prev, profilePhotoUrl: photoData }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileDataChange = (data: { firstName: string; lastName: string; email: string; phone: string; profilePhotoUrl?: string }) => {
    setProfileData({
      ...data,
      profilePhotoUrl: data.profilePhotoUrl
    });
  };

  const handleSaveProfile = () => {
    try {
      localStorage.setItem('profileData', JSON.stringify(profileData));
      toast.success('Profil sauvegardé avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil:', error);
      toast.error('Erreur lors de la sauvegarde du profil');
    }
  };

  // Déterminer le titre selon le rôle
  const pageTitle = userRole === 'AdminPrincipal' ? 'Gestion du compte' : 'Mon Profil';
  const pageDescription = userRole === 'AdminPrincipal' 
    ? 'Gérez les informations de l\'établissement et les paramètres administrateur'
    : 'Gérez vos informations personnelles et les paramètres de votre profil';

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
        <p className="text-gray-600">{pageDescription}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <AccountTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1">
          {activeTab === 'establishment' && (
            <EstablishmentSettings
              adminData={adminData}
              establishmentData={establishmentData}
              onAdminDataChange={setAdminData}
              onEstablishmentDataChange={setEstablishmentData}
              onLogoUpload={handleLogoUpload}
              onSave={handleSaveEstablishment}
            />
          )}
          
          {activeTab === 'profile' && (
            <ProfileSettings
              profileData={profileData}
              onProfileDataChange={handleProfileDataChange}
              onPhotoUpload={handleProfilePhotoUpload}
              onSave={handleSaveProfile}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Compte;