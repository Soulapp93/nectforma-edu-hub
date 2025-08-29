
import React from 'react';
import { User, Mail, Phone, MapPin, Save } from 'lucide-react';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  establishmentName: string;
  establishmentType: string;
  establishmentAddress: string;
  siret: string;
  numberOfStudents: string;
}

interface ProfileSettingsProps {
  profileData: ProfileData;
  onProfileDataChange: (data: ProfileData) => void;
  onSave: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ 
  profileData, 
  onProfileDataChange, 
  onSave 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Informations personnelles</h2>
        <button
          onClick={onSave}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder
        </button>
      </div>

      <div className="space-y-6">
        {/* Section Informations personnelles */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Informations personnelles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-2" />
                Nom complet
              </label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => onProfileDataChange({ ...profileData, name: e.target.value })}
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
                onChange={(e) => onProfileDataChange({ ...profileData, email: e.target.value })}
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
                onChange={(e) => onProfileDataChange({ ...profileData, phone: e.target.value })}
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

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-2" />
              Adresse personnelle
            </label>
            <textarea
              value={profileData.address}
              onChange={(e) => onProfileDataChange({ ...profileData, address: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Section Établissement */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Informations de l'établissement</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'établissement</label>
              <input
                type="text"
                value={profileData.establishmentName}
                onChange={(e) => onProfileDataChange({ ...profileData, establishmentName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type d'établissement</label>
              <select
                value={profileData.establishmentType}
                onChange={(e) => onProfileDataChange({ ...profileData, establishmentType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="École supérieure">École supérieure</option>
                <option value="Université">Université</option>
                <option value="Centre de formation">Centre de formation</option>
                <option value="Organisme de formation">Organisme de formation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SIRET</label>
              <input
                type="text"
                value={profileData.siret}
                onChange={(e) => onProfileDataChange({ ...profileData, siret: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre d'étudiants</label>
              <select
                value={profileData.numberOfStudents}
                onChange={(e) => onProfileDataChange({ ...profileData, numberOfStudents: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="50-100">50-100</option>
                <option value="100-500">100-500</option>
                <option value="500+">500+</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-2" />
              Adresse de l'établissement
            </label>
            <textarea
              value={profileData.establishmentAddress}
              onChange={(e) => onProfileDataChange({ ...profileData, establishmentAddress: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
