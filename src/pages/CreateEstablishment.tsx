import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building, ArrowLeft, ArrowRight, Check, Mail, Phone, User, MapPin, FileText, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CreateEstablishment = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Establishment info
    establishmentName: '',
    establishmentType: '',
    address: '',
    numberOfStudents: '',
    numberOfInstructors: '',
    siret: '',
    director: '',
    website: '',
    establishmentPhone: '',
    establishmentEmail: '',
    
    // Admin info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    roleInEstablishment: '',
    password: '',
    confirmPassword: ''
  });

  const establishmentTypes = [
    'École supérieure',
    'Centre de formation',
    'Organisme de formation',
    'Entreprise',
    'Formateur indépendant'
  ];

  const userRanges = [
    '1-10',
    '11-25',
    '26-50',
    '51-100',
    '101-500',
    '500+'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.establishmentName || !formData.establishmentType || !formData.address) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep2()) return;
    
    setLoading(true);
    
    try {
      // Use Edge Function with service role to bypass RLS completely
      const { data, error } = await supabase.functions.invoke('create-establishment', {
        body: {
          establishment: {
            name: formData.establishmentName,
            type: formData.establishmentType,
            email: formData.establishmentEmail || formData.email,
            address: formData.address,
            phone: formData.establishmentPhone,
            website: formData.website,
            siret: formData.siret,
            director: formData.director,
            numberOfStudents: formData.numberOfStudents,
            numberOfInstructors: formData.numberOfInstructors
          },
          admin: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password
          }
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Erreur lors de la création');

      toast.success('Compte établissement créé avec succès! Vous pouvez maintenant vous connecter.');
      
      // Redirect to auth page for login
      setTimeout(() => {
        navigate('/auth');
      }, 2000);

    } catch (error: any) {
      console.error('Error creating establishment:', error);
      toast.error(error.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-purple-50 to-white">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                NECTFORMA
              </h1>
            </Link>
            <Link to="/auth" className="text-gray-600 hover:text-primary transition-colors">
              Déjà un compte ? Se connecter
            </Link>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                {step > 1 ? <Check className="h-5 w-5" /> : '1'}
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Établissement</span>
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Administrateur</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <Building className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {step === 1 ? 'Informations de l\'établissement' : 'Administrateur principal'}
            </h2>
            <p className="text-gray-600">
              {step === 1 
                ? 'Renseignez les informations de votre établissement'
                : 'Créez le compte de l\'administrateur principal'
              }
            </p>
          </div>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit} className="space-y-6">
            {step === 1 ? (
              // Step 1: Establishment Information
              <>
                <div>
                  <Label htmlFor="establishmentName">
                    <Building className="inline h-4 w-4 mr-2" />
                    Nom de l'établissement *
                  </Label>
                  <Input
                    id="establishmentName"
                    type="text"
                    value={formData.establishmentName}
                    onChange={(e) => handleInputChange('establishmentName', e.target.value)}
                    placeholder="Nom de votre établissement"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="establishmentType">Type d'établissement *</Label>
                  <select
                    id="establishmentType"
                    value={formData.establishmentType}
                    onChange={(e) => handleInputChange('establishmentType', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Sélectionnez un type</option>
                    {establishmentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="address">
                    <MapPin className="inline h-4 w-4 mr-2" />
                    Adresse *
                  </Label>
                  <textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    rows={3}
                    placeholder="Adresse complète de l'établissement"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="numberOfStudents">
                      <Users className="inline h-4 w-4 mr-2" />
                      Nombre d'étudiants
                    </Label>
                    <select
                      id="numberOfStudents"
                      value={formData.numberOfStudents}
                      onChange={(e) => handleInputChange('numberOfStudents', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Sélectionnez</option>
                      {userRanges.map(range => (
                        <option key={range} value={range}>{range}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="numberOfInstructors">
                      <Users className="inline h-4 w-4 mr-2" />
                      Nombre de formateurs
                    </Label>
                    <select
                      id="numberOfInstructors"
                      value={formData.numberOfInstructors}
                      onChange={(e) => handleInputChange('numberOfInstructors', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Sélectionnez</option>
                      {userRanges.map(range => (
                        <option key={range} value={range}>{range}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="siret">
                    <FileText className="inline h-4 w-4 mr-2" />
                    SIRET
                  </Label>
                  <Input
                    id="siret"
                    type="text"
                    value={formData.siret}
                    onChange={(e) => handleInputChange('siret', e.target.value)}
                    placeholder="N° SIRET de l'établissement"
                  />
                </div>

                <div>
                  <Label htmlFor="director">
                    <User className="inline h-4 w-4 mr-2" />
                    Directeur
                  </Label>
                  <Input
                    id="director"
                    type="text"
                    value={formData.director}
                    onChange={(e) => handleInputChange('director', e.target.value)}
                    placeholder="Nom du directeur"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="establishmentPhone">
                      <Phone className="inline h-4 w-4 mr-2" />
                      Téléphone
                    </Label>
                    <Input
                      id="establishmentPhone"
                      type="tel"
                      value={formData.establishmentPhone}
                      onChange={(e) => handleInputChange('establishmentPhone', e.target.value)}
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>

                  <div>
                    <Label htmlFor="establishmentEmail">
                      <Mail className="inline h-4 w-4 mr-2" />
                      Email
                    </Label>
                    <Input
                      id="establishmentEmail"
                      type="email"
                      value={formData.establishmentEmail}
                      onChange={(e) => handleInputChange('establishmentEmail', e.target.value)}
                      placeholder="contact@etablissement.fr"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="website">Site web</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://www.votre-etablissement.fr"
                  />
                </div>

                <div className="flex justify-between pt-6">
                  <Link to="/">
                    <Button type="button" variant="outline">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Retour
                    </Button>
                  </Link>
                  <Button type="submit" className="bg-primary hover:bg-primary/90">
                    Continuer
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            ) : (
              // Step 2: Administrator Information
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Prénom *</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Votre prénom"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="lastName">Nom *</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Votre nom"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">
                    <Mail className="inline h-4 w-4 mr-2" />
                    Email professionnel *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="votre@email.com"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Vous recevrez toutes les notifications sur cet email
                  </p>
                </div>

                <div>
                  <Label htmlFor="phone">
                    <Phone className="inline h-4 w-4 mr-2" />
                    Téléphone *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="roleInEstablishment">Rôle dans l'établissement</Label>
                  <Input
                    id="roleInEstablishment"
                    type="text"
                    value={formData.roleInEstablishment}
                    onChange={(e) => handleInputChange('roleInEstablishment', e.target.value)}
                    placeholder="Ex: Directeur, Responsable pédagogique..."
                  />
                </div>

                <div>
                  <Label htmlFor="password">Mot de passe *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Minimum 6 caractères"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirmez votre mot de passe"
                    required
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> En tant qu'administrateur principal, vous aurez accès à toutes les fonctionnalités de gestion et pourrez ajouter d'autres utilisateurs (administrateurs, formateurs, étudiants, tuteurs).
                  </p>
                </div>

                <div className="flex justify-between pt-6">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={loading}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={loading}>
                    {loading ? 'Création en cours...' : 'Créer mon compte'}
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEstablishment;