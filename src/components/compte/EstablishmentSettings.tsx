import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import FileUpload from '../ui/file-upload';
import { Building, User, Phone, Globe, MapPin, Users, FileText, Mail, Upload } from 'lucide-react';

interface AdminData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
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
  logoUrl?: string;
}

interface EstablishmentSettingsProps {
  adminData: AdminData;
  establishmentData: EstablishmentData;
  onAdminDataChange: (data: AdminData) => void;
  onEstablishmentDataChange: (data: EstablishmentData) => void;
  onLogoUpload: (files: File[]) => void;
  onSave: () => void;
}

const EstablishmentSettings: React.FC<EstablishmentSettingsProps> = ({
  adminData,
  establishmentData,
  onAdminDataChange,
  onEstablishmentDataChange,
  onLogoUpload,
  onSave
}) => {
  const handleAdminChange = (field: keyof AdminData, value: string) => {
    onAdminDataChange({ ...adminData, [field]: value });
  };

  const handleEstablishmentChange = (field: keyof EstablishmentData, value: string | number) => {
    onEstablishmentDataChange({ ...establishmentData, [field]: value });
  };

  return (
    <div className="glass-card rounded-xl p-8 floating-card">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center">
          <Building className="h-6 w-6 mr-2 text-primary" />
          Gestion de l'établissement
        </h2>
        <p className="text-muted-foreground">
          Gérez les informations de l'administrateur principal et de l'établissement
        </p>
      </div>

      {/* Informations personnelles de l'administrateur */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <User className="h-5 w-5 mr-2 text-info" />
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
            <Label htmlFor="adminEmail">Email</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="adminEmail"
                type="email"
                value={adminData.email}
                onChange={(e) => handleAdminChange('email', e.target.value)}
                className="pl-10"
                placeholder="admin@exemple.com"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="adminPhone">Téléphone</Label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="adminPhone"
                value={adminData.phone}
                onChange={(e) => handleAdminChange('phone', e.target.value)}
                className="pl-10"
                placeholder="+33 6 12 34 56 78"
              />
            </div>
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
          
          <div className="md:col-span-2">
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
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Building className="h-5 w-5 mr-2 text-primary" />
          Informations de l'établissement
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Label htmlFor="name">Nom de l'établissement</Label>
            <Input
              id="name"
              value={establishmentData.name}
              onChange={(e) => handleEstablishmentChange('name', e.target.value)}
              className="mt-1"
              placeholder="Ex: École Supérieure de Commerce"
            />
          </div>
          
          <div>
            <Label htmlFor="establishmentPhone">Téléphone</Label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
              <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="website"
                value={establishmentData.website}
                onChange={(e) => handleEstablishmentChange('website', e.target.value)}
                className="pl-10"
                placeholder="https://www.exemple.com"
              />
            </div>
          </div>
          
          <div className="md:col-span-2">
            <Label htmlFor="address">Adresse complète</Label>
            <div className="relative mt-1">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="address"
                value={establishmentData.address}
                onChange={(e) => handleEstablishmentChange('address', e.target.value)}
                className="pl-10"
                placeholder="123 Rue de l'Exemple, 75001 Paris, France"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="type">Type d'établissement</Label>
            <select
              id="type"
              value={establishmentData.type}
              onChange={(e) => handleEstablishmentChange('type', e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Sélectionnez un type</option>
              <option value="école_supérieure">École Supérieure</option>
              <option value="université">Université</option>
              <option value="centre_formation">Centre de Formation</option>
              <option value="lycée">Lycée</option>
              <option value="collège">Collège</option>
              <option value="organisme_privé">Organisme Privé</option>
            </select>
          </div>
          
          <div>
            <Label htmlFor="director">Directeur/Directrice</Label>
            <Input
              id="director"
              value={establishmentData.director}
              onChange={(e) => handleEstablishmentChange('director', e.target.value)}
              className="mt-1"
              placeholder="Nom complet du directeur"
            />
          </div>
          
          <div>
            <Label htmlFor="siret">SIRET</Label>
            <div className="relative mt-1">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="siret"
                value={establishmentData.siret}
                onChange={(e) => handleEstablishmentChange('siret', e.target.value)}
                className="pl-10"
                placeholder="123 456 789 01234"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="numberOfUsers">Nombre d'utilisateurs</Label>
            <div className="relative mt-1">
              <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="numberOfUsers"
                type="number"
                value={establishmentData.numberOfUsers.toString()}
                onChange={(e) => handleEstablishmentChange('numberOfUsers', parseInt(e.target.value) || 0)}
                className="pl-10"
                placeholder="0"
                min="0"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Logo de l'établissement */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Upload className="h-5 w-5 mr-2 text-warning" />
          Logo de l'établissement
        </h3>
        
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-muted border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center overflow-hidden">
            {establishmentData.logoUrl ? (
              <img 
                src={establishmentData.logoUrl} 
                alt="Logo de l'établissement" 
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <Building className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          
          <div className="flex-1">
            <FileUpload
              onFileSelect={onLogoUpload}
              accept="image/*"
              multiple={false}
              className="w-auto"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Formats acceptés: JPG, PNG, SVG (max 2MB)<br/>
              Recommandations: 200x200px, fond transparent
            </p>
          </div>
        </div>
      </div>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end">
        <Button
          onClick={onSave}
          variant="premium"
          size="lg"
          className="px-8"
        >
          Enregistrer toutes les modifications
        </Button>
      </div>
    </div>
  );
};

export default EstablishmentSettings;