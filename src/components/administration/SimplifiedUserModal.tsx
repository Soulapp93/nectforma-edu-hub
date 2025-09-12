import React, { useState, useEffect } from 'react';
import { X, User, Mail, Building, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { User as UserType, CreateUserData } from '@/services/userService';
import { Formation, formationService } from '@/services/formationService';
import { activationService } from '@/services/activationService';

interface SimplifiedUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: CreateUserData, formationIds: string[]) => Promise<UserType>;
  user?: UserType | null;
  mode: 'create' | 'edit';
  preselectedRole?: 'Admin' | 'Formateur' | 'Étudiant' | null;
}

const SimplifiedUserModal: React.FC<SimplifiedUserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  user,
  mode,
  preselectedRole
}) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'Étudiant' as 'Admin' | 'Formateur' | 'Étudiant',
    status: 'Actif' as 'Actif' | 'Inactif' | 'En attente'
  });

  const [formations, setFormations] = useState<Formation[]>([]);
  const [selectedFormations, setSelectedFormations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFormations, setLoadingFormations] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      loadFormations();
      
      if (user && mode === 'edit') {
        setFormData({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          role: user.role || 'Étudiant',
          status: user.status || 'Actif'
        });
      } else {
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          role: preselectedRole || 'Étudiant',
          status: 'Actif'
        });
      }
      setSelectedFormations([]);
      setErrors({});
    }
  }, [user, mode, isOpen, preselectedRole]);

  const loadFormations = async () => {
    try {
      setLoadingFormations(true);
      const data = await formationService.getFormations();
      setFormations(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des formations:', error);
    } finally {
      setLoadingFormations(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Le prénom est requis';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Le nom est requis';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Créer l'utilisateur
      const newUser = await onSave({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        role: formData.role,
        status: formData.status
      }, selectedFormations);

      // Si c'est un nouvel utilisateur, créer un token d'activation et envoyer l'email
      if (mode === 'create') {
        try {
          const token = await activationService.createActivationToken(newUser.id!);
          await activationService.sendActivationEmail(
            formData.email,
            token.token,
            formData.first_name,
            formData.last_name
          );
          console.log('Email d\'activation envoyé avec succès');
        } catch (emailError) {
          console.error('Erreur lors de l\'envoi de l\'email d\'activation:', emailError);
          // On continue même si l'email échoue
        }
      }

      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFormationToggle = (formationId: string, checked: boolean) => {
    setSelectedFormations(prev => 
      checked 
        ? [...prev, formationId]
        : prev.filter(id => id !== formationId)
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' 
              ? preselectedRole 
                ? `Ajouter un ${preselectedRole === 'Admin' ? 'Administrateur' : preselectedRole}`
                : 'Ajouter un utilisateur'
              : 'Modifier l\'utilisateur'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informations personnelles */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              Informations personnelles
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Prénom *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  className={errors.first_name ? 'border-red-500' : ''}
                  placeholder="Entrez le prénom"
                />
                {errors.first_name && (
                  <p className="text-sm text-red-600 mt-1">{errors.first_name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="last_name">Nom *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  className={errors.last_name ? 'border-red-500' : ''}
                  placeholder="Entrez le nom"
                />
                {errors.last_name && (
                  <p className="text-sm text-red-600 mt-1">{errors.last_name}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="utilisateur@email.com"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Paramètres du compte */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Building className="h-5 w-5 text-purple-600" />
              Paramètres du compte
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Rôle</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  disabled={!!preselectedRole && mode === 'create'}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    !!preselectedRole && mode === 'create' ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="Étudiant">Étudiant</option>
                  <option value="Formateur">Formateur</option>
                  <option value="Admin">Administrateur</option>
                </select>
              </div>

              <div>
                <Label htmlFor="status">Statut</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                </select>
              </div>
            </div>
          </div>

          {/* Inscription aux formations - Caché pour les administrateurs */}
          {formData.role !== 'Admin' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Inscription aux formations
              </h3>
              
              {loadingFormations ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Chargement des formations...</p>
                </div>
              ) : formations.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {formations.map((formation) => (
                    <div key={formation.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`formation-${formation.id}`}
                        checked={selectedFormations.includes(formation.id)}
                        onCheckedChange={(checked) => 
                          handleFormationToggle(formation.id, checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={`formation-${formation.id}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        <div>
                          <div className="font-medium">{formation.title}</div>
                          <div className="text-xs text-gray-500">
                            {formation.level} • Du {new Date(formation.start_date).toLocaleDateString('fr-FR')} au {new Date(formation.end_date).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Aucune formation disponible</p>
              )}
              
              {selectedFormations.length > 0 && (
                <p className="text-sm text-green-600">
                  {selectedFormations.length} formation{selectedFormations.length > 1 ? 's' : ''} sélectionnée{selectedFormations.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {mode === 'create' ? 'Création...' : 'Mise à jour...'}
                </>
              ) : (
                <>
                  {mode === 'create' ? 'Créer l\'utilisateur' : 'Mettre à jour'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimplifiedUserModal;
