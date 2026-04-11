import React, { useState, useEffect, useMemo } from 'react';
import { X, User, Mail, Building, Users, UserCheck, Phone, MapPin, FileText, ArrowLeft, Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { User as UserType, CreateUserData } from '@/services/userService';
import { Formation, formationService } from '@/services/formationService';
import { tutorService, CreateTutorData } from '@/services/tutorService';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { supabase } from '@/integrations/supabase/client';

// Sub-component: Formation → Promotion enrollment with hierarchical navigation
const FormationPromotionEnrollment: React.FC<{
  formations: Formation[];
  loadingFormations: boolean;
  selectedFormations: string[];
  onFormationToggle: (formationId: string, checked: boolean) => void;
}> = ({ formations, loadingFormations, selectedFormations, onFormationToggle }) => {
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  const formationGroups = useMemo(() => {
    const groups: Record<string, Formation[]> = {};
    formations.forEach(f => {
      const name = f.title;
      if (!groups[name]) groups[name] = [];
      groups[name].push(f);
    });
    Object.values(groups).forEach(group => {
      group.sort((a, b) => ((b as any).academic_year || '').localeCompare((a as any).academic_year || ''));
    });
    return groups;
  }, [formations]);

  const programNames = useMemo(() => Object.keys(formationGroups).sort(), [formationGroups]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        Inscription aux formations
      </h3>

      {loadingFormations ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Chargement des formations...</p>
        </div>
      ) : formations.length > 0 ? (
        <div className="border border-border rounded-lg overflow-hidden">
          {selectedProgram ? (
            // Promotions view
            <div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 border-b border-border">
                <button onClick={() => setSelectedProgram(null)} className="p-1 hover:bg-muted rounded-lg transition-colors">
                  <ArrowLeft className="h-4 w-4 text-foreground" />
                </button>
                <span className="text-sm font-medium text-foreground">{selectedProgram}</span>
                <Badge variant="outline" className="text-[10px] ml-auto">
                  {formationGroups[selectedProgram]?.length || 0} promotion(s)
                </Badge>
              </div>
              <div className="max-h-60 overflow-y-auto p-3 space-y-2">
                {(formationGroups[selectedProgram] || []).map((formation) => (
                  <div key={formation.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={`formation-${formation.id}`}
                      checked={selectedFormations.includes(formation.id)}
                      onCheckedChange={(checked) => onFormationToggle(formation.id, checked as boolean)}
                    />
                    <Label htmlFor={`formation-${formation.id}`} className="text-sm font-normal cursor-pointer flex-1">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {(formation as any).academic_year && (
                            <Badge className="bg-primary/10 text-primary text-[10px] px-1.5 py-0">
                              {(formation as any).academic_year}
                            </Badge>
                          )}
                          {formation.level}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Du {new Date(formation.start_date).toLocaleDateString('fr-FR')} au {new Date(formation.end_date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Programs view
            <div className="max-h-60 overflow-y-auto p-3 space-y-2">
              {programNames.map((name) => {
                const group = formationGroups[name];
                const selectedCount = group.filter(f => selectedFormations.includes(f.id)).length;
                return (
                  <div
                    key={name}
                    onClick={() => setSelectedProgram(name)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer group transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">{name}</div>
                      <div className="text-xs text-muted-foreground">
                        {group.length} promotion{group.length > 1 ? 's' : ''}
                        {selectedCount > 0 && (
                          <span className="text-primary ml-2">• {selectedCount} sélectionnée{selectedCount > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Aucune formation disponible</p>
      )}

      {selectedFormations.length > 0 && (
        <p className="text-sm text-green-600">
          {selectedFormations.length} promotion{selectedFormations.length > 1 ? 's' : ''} sélectionnée{selectedFormations.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

interface SimplifiedUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: CreateUserData, formationIds: string[], tutorData?: CreateTutorData & {
    contract_type?: string;
    contract_start_date?: string;
    contract_end_date?: string;
  }) => Promise<UserType>;
  user?: UserType | null;
  mode: 'create' | 'edit';
  preselectedRole?: 'AdminPrincipal' | 'Admin' | 'Formateur' | 'Étudiant' | null;
  loadUserFormations?: (userId: string) => Promise<string[]>;
}

const SimplifiedUserModal: React.FC<SimplifiedUserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  user,
  mode,
  preselectedRole,
  loadUserFormations
}) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'Étudiant' as 'AdminPrincipal' | 'Admin' | 'Formateur' | 'Étudiant' | 'Tuteur',
    status: 'Actif' as 'Actif' | 'Inactif' | 'En attente',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'France',
    nationality: '',
  });

  const [tutorData, setTutorData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    position: '',
    contract_type: '',
    contract_start_date: '',
    contract_end_date: ''
  });

  const [showTutorSection, setShowTutorSection] = useState(false);

  const [formations, setFormations] = useState<Formation[]>([]);
  const [selectedFormations, setSelectedFormations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFormations, setLoadingFormations] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const initModal = async () => {
      if (isOpen) {
        loadFormations();
        
        if (user && mode === 'edit') {
          setFormData({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            role: user.role || 'Étudiant',
            status: user.status || 'Actif',
            phone: (user as any).phone || '',
            date_of_birth: (user as any).date_of_birth || '',
            gender: (user as any).gender || '',
            address: (user as any).address || '',
            city: (user as any).city || '',
            postal_code: (user as any).postal_code || '',
            country: (user as any).country || 'France',
            nationality: (user as any).nationality || '',
          });
          
          // Charger les formations de l'utilisateur en mode édition
          if (loadUserFormations) {
            try {
              const userFormationIds = await loadUserFormations(user.id);
              setSelectedFormations(userFormationIds);
            } catch (error) {
              console.error('Erreur lors du chargement des formations utilisateur:', error);
              setSelectedFormations([]);
            }
          } else {
            setSelectedFormations([]);
          }

          // Charger le tuteur existant pour les étudiants
          if (user.role === 'Étudiant') {
            try {
              // Récupérer l'assignation tuteur-étudiant
              const { data: tutorAssignments } = await supabase
                .from('tutor_student_assignments')
                .select('tutor_id, is_active')
                .eq('student_id', user.id)
                .eq('is_active', true)
                .limit(1);

              if (tutorAssignments && tutorAssignments.length > 0) {
                // Récupérer les détails du tuteur séparément
                const { data: tutorDetails } = await supabase
                  .from('tutors')
                  .select('first_name, last_name, email, phone, company_name, position')
                  .eq('id', tutorAssignments[0].tutor_id)
                  .single();

                if (tutorDetails) {
                  setTutorData({
                    first_name: tutorDetails.first_name || '',
                    last_name: tutorDetails.last_name || '',
                    email: tutorDetails.email || '',
                    phone: tutorDetails.phone || '',
                    company_name: tutorDetails.company_name || '',
                    position: tutorDetails.position || '',
                    contract_type: '',
                    contract_start_date: '',
                    contract_end_date: ''
                  });
                  setShowTutorSection(true);
                } else {
                  resetTutorData();
                }
              } else {
                resetTutorData();
              }
            } catch (error) {
              console.error('Erreur lors du chargement du tuteur:', error);
              resetTutorData();
            }
          } else {
            resetTutorData();
          }
        } else {
          setFormData({
            first_name: '',
            last_name: '',
            email: '',
            role: preselectedRole || 'Étudiant',
            status: 'Actif',
            phone: '',
            date_of_birth: '',
            gender: '',
            address: '',
            city: '',
            postal_code: '',
            country: 'France',
            nationality: '',
          });
          setSelectedFormations([]);
          resetTutorData();
        }
        
        setErrors({});
      }
    };

    const resetTutorData = () => {
      setTutorData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company_name: '',
        position: '',
        contract_type: '',
        contract_start_date: '',
        contract_end_date: ''
      });
      setShowTutorSection(false);
    };
    
    initModal();
  }, [user, mode, isOpen, preselectedRole, loadUserFormations]);

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

    // Validation des données du tuteur si la section est activée
    if (showTutorSection && formData.role === 'Étudiant') {
      if (!tutorData.first_name.trim()) {
        newErrors.tutor_first_name = 'Le prénom du tuteur est requis';
      }
      if (!tutorData.last_name.trim()) {
        newErrors.tutor_last_name = 'Le nom du tuteur est requis';
      }
      if (!tutorData.email.trim()) {
        newErrors.tutor_email = 'L\'email du tuteur est requis';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tutorData.email)) {
        newErrors.tutor_email = 'Format d\'email du tuteur invalide';
      }
      if (!tutorData.company_name.trim()) {
        newErrors.tutor_company_name = 'Le nom de l\'entreprise est requis';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Préparer les données du tuteur si nécessaire
      const tutorInfo = showTutorSection && formData.role === 'Étudiant' ? {
        first_name: tutorData.first_name,
        last_name: tutorData.last_name,
        email: tutorData.email,
        phone: tutorData.phone,
        company_name: tutorData.company_name,
        position: tutorData.position,
        establishment_id: '', // Sera défini dans le service
        contract_type: tutorData.contract_type,
        contract_start_date: tutorData.contract_start_date,
        contract_end_date: tutorData.contract_end_date
      } : undefined;

      // Créer / mettre à jour l'utilisateur
      console.log('[SimplifiedUserModal] Appel onSave avec tutorInfo:', tutorInfo ? 'OUI' : 'NON');
      const newUser = await onSave({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        phone: formData.phone || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        gender: formData.gender || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        postal_code: formData.postal_code || undefined,
        country: formData.country || undefined,
        nationality: formData.nationality || undefined,
      } as any, selectedFormations, tutorInfo);

      // Vérifier si l'invitation tuteur a échoué (info stockée dans l'utilisateur retourné)
      const tutorError = (newUser as any)?._tutorInviteError;
      const tutorWarning = (newUser as any)?._tutorInviteWarning;

      if (tutorError) {
        toast.warning(`Utilisateur ${mode === 'create' ? 'créé' : 'mis à jour'}, mais l'invitation tuteur a échoué: ${tutorError}`);
      } else if (tutorWarning) {
        toast.warning(`Utilisateur ${mode === 'create' ? 'créé' : 'mis à jour'}. Tuteur créé mais: ${tutorWarning}`);
      } else if (tutorInfo) {
        toast.success(mode === 'create' 
          ? 'Étudiant créé et invitation tuteur envoyée avec succès!' 
          : 'Étudiant mis à jour et tuteur notifié');
      } else {
        toast.success(mode === 'create' ? 'Utilisateur créé et invitation envoyée' : 'Utilisateur mis à jour');
      }
      
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
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

  const handleTutorChange = (field: string, value: string) => {
    setTutorData(prev => ({ ...prev, [field]: value }));
    if (errors[`tutor_${field}`]) {
      setErrors(prev => ({ ...prev, [`tutor_${field}`]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {mode === 'create' 
              ? preselectedRole 
                ? `Ajouter un ${preselectedRole === 'Admin' ? 'Administrateur' : preselectedRole}`
                : 'Ajouter un utilisateur'
              : 'Modifier l\'utilisateur'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informations personnelles */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
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
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

            {/* Champs civils supplementaires */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="phone">Telephone</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="06 12 34 56 78" data-testid="user-phone" />
              </div>
              <div>
                <Label htmlFor="date_of_birth">Date de naissance</Label>
                <Input id="date_of_birth" type="date" value={formData.date_of_birth} onChange={(e) => handleChange('date_of_birth', e.target.value)} data-testid="user-dob" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Sexe</Label>
                <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
                  <SelectTrigger data-testid="user-gender"><SelectValue placeholder="Selectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculin</SelectItem>
                    <SelectItem value="F">Feminin</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="Numero et rue" data-testid="user-address" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">Ville</Label>
                <Input id="city" value={formData.city} onChange={(e) => handleChange('city', e.target.value)} placeholder="Paris" data-testid="user-city" />
              </div>
              <div>
                <Label htmlFor="postal_code">Code postal</Label>
                <Input id="postal_code" value={formData.postal_code} onChange={(e) => handleChange('postal_code', e.target.value)} placeholder="75001" data-testid="user-postal" />
              </div>
              <div>
                <Label htmlFor="nationality">Nationalite</Label>
                <Input id="nationality" value={formData.nationality} onChange={(e) => handleChange('nationality', e.target.value)} placeholder="Francaise" data-testid="user-nationality" />
              </div>
            </div>
          </div>

          {/* Paramètres du compte */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Paramètres du compte
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleChange('role', value)}
                  disabled={!!preselectedRole && mode === 'create'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Étudiant">Étudiant</SelectItem>
                    <SelectItem value="Formateur">Formateur</SelectItem>
                    <SelectItem value="Admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Actif">Actif</SelectItem>
                    <SelectItem value="Inactif">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tuteur - Pour les étudiants */}
          {formData.role === 'Étudiant' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  Associer un tuteur entreprise
                </h3>
                <Switch
                  checked={showTutorSection}
                  onCheckedChange={setShowTutorSection}
                />
              </div>
              
              {showTutorSection && (
                <div className="space-y-6 border border-border rounded-lg p-4 bg-muted/50">
                  {/* Informations personnelles du tuteur */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground/80 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Informations personnelles
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="tutor_first_name">Prénom du tuteur *</Label>
                        <Input
                          id="tutor_first_name"
                          value={tutorData.first_name}
                          onChange={(e) => handleTutorChange('first_name', e.target.value)}
                          className={errors.tutor_first_name ? 'border-red-500' : ''}
                          placeholder="Prénom"
                        />
                        {errors.tutor_first_name && (
                          <p className="text-sm text-red-600 mt-1">{errors.tutor_first_name}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="tutor_last_name">Nom du tuteur *</Label>
                        <Input
                          id="tutor_last_name"
                          value={tutorData.last_name}
                          onChange={(e) => handleTutorChange('last_name', e.target.value)}
                          className={errors.tutor_last_name ? 'border-red-500' : ''}
                          placeholder="Nom"
                        />
                        {errors.tutor_last_name && (
                          <p className="text-sm text-red-600 mt-1">{errors.tutor_last_name}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="tutor_email">Email du tuteur *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="tutor_email"
                            type="email"
                            value={tutorData.email}
                            onChange={(e) => handleTutorChange('email', e.target.value)}
                            className={`pl-10 ${errors.tutor_email ? 'border-red-500' : ''}`}
                            placeholder="tuteur@entreprise.com"
                          />
                        </div>
                        {errors.tutor_email && (
                          <p className="text-sm text-red-600 mt-1">{errors.tutor_email}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="tutor_phone">Téléphone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="tutor_phone"
                            value={tutorData.phone}
                            onChange={(e) => handleTutorChange('phone', e.target.value)}
                            className="pl-10"
                            placeholder="+33 6 12 34 56 78"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informations entreprise */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground/80 flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Informations entreprise
                    </h4>
                    
                    <div>
                      <Label htmlFor="tutor_company_name">Nom de l'entreprise *</Label>
                      <Input
                        id="tutor_company_name"
                        value={tutorData.company_name}
                        onChange={(e) => handleTutorChange('company_name', e.target.value)}
                        className={errors.tutor_company_name ? 'border-red-500' : ''}
                        placeholder="Nom de l'entreprise"
                      />
                      {errors.tutor_company_name && (
                        <p className="text-sm text-red-600 mt-1">{errors.tutor_company_name}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="tutor_position">Poste du tuteur</Label>
                        <Input
                          id="tutor_position"
                          value={tutorData.position}
                          onChange={(e) => handleTutorChange('position', e.target.value)}
                          placeholder="Responsable formation"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tutor_contract_type">Type de contrat</Label>
                        <Select
                          value={tutorData.contract_type}
                          onValueChange={(value) => handleTutorChange('contract_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Apprentissage">Apprentissage</SelectItem>
                            <SelectItem value="Professionnalisation">Professionnalisation</SelectItem>
                            <SelectItem value="Stage">Stage</SelectItem>
                            <SelectItem value="Autre">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tutor_contract_start_date">Date de début</Label>
                        <DatePicker
                          id="tutor_contract_start_date"
                          value={tutorData.contract_start_date}
                          onChange={(value) => handleTutorChange('contract_start_date', value)}
                          placeholder="Sélectionner une date"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tutor_contract_end_date">Date de fin</Label>
                        <DatePicker
                          id="tutor_contract_end_date"
                          value={tutorData.contract_end_date}
                          onChange={(value) => handleTutorChange('contract_end_date', value)}
                          placeholder="Sélectionner une date"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Inscription aux formations - Caché pour les administrateurs */}
          {formData.role !== 'Admin' && (
            <FormationPromotionEnrollment
              formations={formations}
              loadingFormations={loadingFormations}
              selectedFormations={selectedFormations}
              onFormationToggle={handleFormationToggle}
            />
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
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
