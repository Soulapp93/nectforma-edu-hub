import React, { useState, useEffect } from 'react';
import AccountTabs from '../components/compte/AccountTabs';
import EstablishmentSettings from '../components/compte/EstablishmentSettings';
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
  const [activeTab, setActiveTab] = useState('establishment');
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

  // Charger les données sauvegardées au montage du composant
  useEffect(() => {
    const savedAdminData = localStorage.getItem('adminData');
    const savedEstablishmentData = localStorage.getItem('establishmentData');

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
  }, []);

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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion du compte</h1>
        <p className="text-gray-600">Gérez vos informations personnelles et les paramètres de votre compte</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <AccountTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1">
          <EstablishmentSettings
            adminData={adminData}
            establishmentData={establishmentData}
            onAdminDataChange={setAdminData}
            onEstablishmentDataChange={setEstablishmentData}
            onLogoUpload={handleLogoUpload}
            onSave={handleSaveEstablishment}
          />
        </div>
      </div>
    </div>
  );
};

export default Compte;
