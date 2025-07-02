
import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Lock, Bell, Shield, CreditCard, Users, Building, Save } from 'lucide-react';

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

  const tabs = [
    { id: 'profile', name: 'Profil', icon: User },
    { id: 'establishment', name: 'Établissement', icon: Building },
    { id: 'security', name: 'Sécurité', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'subscription', name: 'Abonnement', icon: CreditCard },
    { id: 'team', name: 'Équipe', icon: Users },
  ];

  const handleSaveProfile = () => {
    console.log('Saving profile data:', profileData);
    // Implement save logic here
  };

  const handleSaveNotifications = () => {
    console.log('Saving notifications:', notifications);
    // Implement save logic here
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion du compte</h1>
        <p className="text-gray-600">Gérez vos informations personnelles et les paramètres de votre compte</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors mb-2 ${
                    activeTab === tab.id
                      ? 'bg-purple-50 text-purple-600 border-purple-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Informations personnelles</h2>
                <button
                  onClick={handleSaveProfile}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline h-4 w-4 mr-2" />
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline h-4 w-4 mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="inline h-4 w-4 mr-2" />
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
                  <input
                    type="text"
                    value={profileData.role}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-2" />
                  Adresse
                </label>
                <textarea
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Establishment Tab */}
          {activeTab === 'establishment' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Informations établissement</h2>
                <button
                  onClick={handleSaveProfile}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="inline h-4 w-4 mr-2" />
                    Nom de l'établissement
                  </label>
                  <input
                    type="text"
                    value={profileData.establishmentName}
                    onChange={(e) => setProfileData({ ...profileData, establishmentName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type d'établissement</label>
                  <select
                    value={profileData.establishmentType}
                    onChange={(e) => setProfileData({ ...profileData, establishmentType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="École supérieure">École supérieure</option>
                    <option value="Centre de formation">Centre de formation</option>
                    <option value="Organisme de formation">Organisme de formation</option>
                    <option value="Entreprise">Entreprise</option>
                    <option value="Formateur indépendant">Formateur indépendant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SIRET</label>
                  <input
                    type="text"
                    value={profileData.siret}
                    onChange={(e) => setProfileData({ ...profileData, siret: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre d'étudiants</label>
                  <select
                    value={profileData.numberOfStudents}
                    onChange={(e) => setProfileData({ ...profileData, numberOfStudents: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="1-10">1-10</option>
                    <option value="11-25">11-25</option>
                    <option value="26-50">26-50</option>
                    <option value="51-100">51-100</option>
                    <option value="101-500">101-500</option>
                    <option value="500+">500+</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-2" />
                  Adresse de l'établissement
                </label>
                <textarea
                  value={profileData.establishmentAddress}
                  onChange={(e) => setProfileData({ ...profileData, establishmentAddress: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Sécurité du compte</h2>

              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Mot de passe</h3>
                      <p className="text-sm text-gray-600">Dernière modification il y a 3 mois</p>
                    </div>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      Modifier
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Authentification à deux facteurs</h3>
                      <p className="text-sm text-gray-600">Sécurisez votre compte avec l'A2F</p>
                    </div>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      Activer
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Sessions actives</h3>
                      <p className="text-sm text-gray-600">Gérez vos sessions de connexion</p>
                    </div>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      Voir les sessions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Préférences de notification</h2>
                <button
                  onClick={handleSaveNotifications}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </button>
              </div>

              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Notifications générales</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Notifications par email</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.emailNotifications}
                          onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Notifications SMS</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.smsNotifications}
                          onChange={(e) => setNotifications({ ...notifications, smsNotifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Notifications pédagogiques</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Rappels de cours</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.coursesReminders}
                          onChange={(e) => setNotifications({ ...notifications, coursesReminders: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Alertes de présence</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.attendanceAlerts}
                          onChange={(e) => setNotifications({ ...notifications, attendanceAlerts: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Abonnement actuel</h2>
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Plan Basic</h3>
                    <p className="text-sm text-gray-600">24,99€/mois • Renouvelé le 15 février 2024</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-purple-600">24,99€</span>
                    <p className="text-sm text-gray-600">par mois</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Changer de plan</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <div key={plan.name} className={`border rounded-xl p-6 ${
                      plan.current ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                    }`}>
                      {plan.current && (
                        <div className="text-center mb-4">
                          <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                            Plan actuel
                          </span>
                        </div>
                      )}
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                        <div className="text-3xl font-bold text-gray-900">
                          {plan.price}€
                          <span className="text-lg font-normal text-gray-600">/mois</span>
                        </div>
                      </div>
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <button className={`w-full py-2 rounded-lg font-medium ${
                        plan.current 
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}>
                        {plan.current ? 'Plan actuel' : 'Choisir ce plan'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Gestion de l'équipe</h2>
                <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  <Users className="h-4 w-4 mr-2" />
                  Inviter un membre
                </button>
              </div>

              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Gestion d'équipe</h3>
                <p className="text-gray-600">
                  Invitez des membres de votre équipe à rejoindre votre espace NectForma.
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
