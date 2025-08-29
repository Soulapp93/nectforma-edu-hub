import React, { useState } from 'react';
import AccountTabs from '../components/compte/AccountTabs';
import ProfileSettings from '../components/compte/ProfileSettings';
import NotificationsSettings from '../components/compte/NotificationsSettings';

const Compte = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: 'Admin Nect',
    email: 'admin@nectforma.com',
    phone: '+33 1 23 45 67 89',
    address: '123 Rue de la Formation, 75001 Paris',
    role: 'Administrateur',
    establishmentName: 'École Supérieure de Formation',
    establishmentType: 'École supérieure',
    establishmentAddress: '123 Rue de la Formation, 75001 Paris',
    siret: '12345678901234',
    numberOfStudents: '50-100'
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: true,
    systemUpdates: true,
    coursesReminders: true,
    attendanceAlerts: true
  });

  const plans = [
    {
      name: 'Basic',
      price: '24,99',
      current: true,
      features: [
        'Jusqu\'à 50 étudiants',
        '3 Go de stockage',
        'Gestion des formations',
        'Emploi du temps basique',
        'Support email'
      ]
    },
    {
      name: 'Essentiel',
      price: '49',
      current: false,
      features: [
        'Jusqu\'à 200 étudiants',
        '10 Go de stockage',
        'Messagerie intégrée',
        'Émargement numérique',
        'Support prioritaire'
      ]
    },
    {
      name: 'Premium',
      price: '99',
      current: false,
      features: [
        'Étudiants illimités',
        '100 Go de stockage',
        'Toutes les fonctionnalités',
        'API personnalisée',
        'Support dédié'
      ]
    }
  ];

  const handleSaveProfile = () => {
    console.log('Saving profile data:', profileData);
  };

  const handleSaveNotifications = () => {
    console.log('Saving notifications:', notifications);
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
          {activeTab === 'profile' && (
            <ProfileSettings
              profileData={profileData}
              onProfileDataChange={setProfileData}
              onSave={handleSaveProfile}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsSettings
              notifications={notifications}
              onNotificationsChange={setNotifications}
              onSave={handleSaveNotifications}
            />
          )}

          {activeTab !== 'profile' && activeTab !== 'notifications' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="h-8 w-8 text-purple-600">⚙️</div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Section en développement
                </h3>
                <p className="text-gray-600">
                  Cette section sera développée prochainement. Restez connecté pour découvrir toutes les fonctionnalités.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Compte;
