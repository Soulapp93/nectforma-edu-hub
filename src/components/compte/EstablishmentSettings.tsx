import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Building, User, Phone, Globe, MapPin, Users, FileText } from 'lucide-react';

interface AdminData {
  firstName: string;
  lastName: string;
  role: string;
  personalAddress: string;
}

interface EstablishmentData {
  name: string;
  phone: string;
  website: string;
  address: string;
  type: string;
  director: string;
  siret: string;
  numberOfUsers: number;
}

interface EstablishmentSettingsProps {
  adminData: AdminData;
  establishmentData: EstablishmentData;
  onAdminDataChange: (data: AdminData) => void;
  onEstablishmentDataChange: (data: EstablishmentData) => void;
  onSave: () => void;
}

const EstablishmentSettings: React.FC<EstablishmentSettingsProps> = ({
  adminData,
  establishmentData,
  onAdminDataChange,
  onEstablishmentDataChange,
  onSave
}) => {
  const handleAdminChange = (field: keyof AdminData, value: string) => {
    onAdminDataChange({ ...adminData, [field]: value });
  };

  const handleEstablishmentChange = (field: keyof EstablishmentData, value: string | number) => {
    onEstablishmentDataChange({ ...establishmentData, [field]: value });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
          <Building className="h-6 w-6 mr-2 text-purple-600" />
          Gestion de l'établissement
        </h2>
        <p className="text-gray-600">
          Gérez les informations de l'administrateur principal et de l'établissement
        </p>
      </div>

      {/* Informations personnelles de l'administrateur */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="h-5 w-5 mr-2 text-blue-600" />
          Informations personnelles de l'administrateur principal
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="firstName">Prénom</Label>
            <Input
              id="firstName"
              value={adminData.firstName}
              onChange={(e) => handleAdminChange('firstName', e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              value={adminData.lastName}
              onChange={(e) => handleAdminChange('lastName', e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="role">Rôle/Poste dans l'établissement</Label>
            <Input
              id="role"
              value={adminData.role}
              onChange={(e) => handleAdminChange('role', e.target.value)}
              className="mt-1"
              placeholder="Ex: Directeur, Responsable pédagogique..."
            />
          </div>
          
          <div>
            <Label htmlFor="personalAddress">Adresse personnelle</Label>
            <Input
              id="personalAddress"
              value={adminData.personalAddress}
              onChange={(e) => handleAdminChange('personalAddress', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Informations de l'établissement */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Building className="h-5 w-5 mr-2 text-green-600" />
          Informations de l'établissement
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="establishmentName">Nom de l'établissement</Label>
            <Input
              id="establishmentName"
              value={establishmentData.name}
              onChange={(e) => handleEstablishmentChange('name', e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="establishmentPhone">Téléphone</Label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="establishmentPhone"
                value={establishmentData.phone}
                onChange={(e) => handleEstablishmentChange('phone', e.target.value)}
                className="pl-10"
                placeholder="+33 1 23 45 67 89"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="website">Site web</Label>
            <div className="relative mt-1">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="website"
                value={establishmentData.website}
                onChange={(e) => handleEstablishmentChange('website', e.target.value)}
                className="pl-10"
                placeholder="www.exemple.com"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="establishmentAddress">Adresse de l'établissement</Label>
            <div className="relative mt-1">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="establishmentAddress"
                value={establishmentData.address}
                onChange={(e) => handleEstablishmentChange('address', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="establishmentType">Type d'établissement</Label>
            <Input
              id="establishmentType"
              value={establishmentData.type}
              onChange={(e) => handleEstablishmentChange('type', e.target.value)}
              className="mt-1"
              placeholder="Ex: École supérieure, Centre de formation..."
            />
          </div>
          
          <div>
            <Label htmlFor="director">Directeur</Label>
            <Input
              id="director"
              value={establishmentData.director}
              onChange={(e) => handleEstablishmentChange('director', e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="siret">SIRET</Label>
            <div className="relative mt-1">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="siret"
                value={establishmentData.siret}
                onChange={(e) => handleEstablishmentChange('siret', e.target.value)}
                className="pl-10"
                placeholder="12345678901234"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="numberOfUsers">Nombre d'utilisateurs</Label>
            <div className="relative mt-1">
              <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="numberOfUsers"
                type="number"
                value={establishmentData.numberOfUsers}
                onChange={(e) => handleEstablishmentChange('numberOfUsers', parseInt(e.target.value) || 0)}
                className="pl-10"
                min="1"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave} className="px-8">
          Sauvegarder les modifications
        </Button>
      </div>
    </div>
  );
};

export default EstablishmentSettings;