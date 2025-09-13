import React, { useState } from 'react';
import AccountTabs from '../components/compte/AccountTabs';
import EstablishmentSettings from '../components/compte/EstablishmentSettings';

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
    firstName: 'Admin',
    lastName: 'Nect',
    email: 'admin@ecole-formation.fr',
    phone: '+33 6 12 34 56 78',
    role: 'Directeur',
    personalAddress: '123 Rue Personnelle, 75001 Paris'
  });

  const [establishmentData, setEstablishmentData] = useState<EstablishmentDataState>({
    name: 'École Supérieure de Formation',
    phone: '+33 1 23 45 67 89',
    website: 'www.ecole-formation.fr',
    address: '123 Rue de la Formation, 75001 Paris',
    type: 'École supérieure',
    director: 'Jean Dupont',
    siret: '12345678901234',
    numberOfUsers: 25
  });

  const handleLogoUpload = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      // Créer une URL temporaire pour prévisualiser l'image
      const logoUrl = URL.createObjectURL(file);
      setEstablishmentData(prev => ({ ...prev, logoUrl }));
      console.log('Logo uploadé:', file);
    }
  };

  const handleSaveEstablishment = () => {
    console.log('Saving admin data:', adminData);
    console.log('Saving establishment data:', establishmentData);
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
