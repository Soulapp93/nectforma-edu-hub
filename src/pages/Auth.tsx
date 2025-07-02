
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, Building, MapPin, Phone, Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal info
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    
    // Establishment info
    establishmentName: '',
    establishmentType: '',
    establishmentAddress: '',
    siret: '',
    numberOfStudents: '',
    establishmentPhone: '',
    establishmentEmail: ''
  });

  const establishmentTypes = [
    'École supérieure',
    'Centre de formation',
    'Organisme de formation',
    'Entreprise',
    'Formateur indépendant'
  ];

  const studentRanges = [
    '1-10',
    '11-25',
    '26-50',
    '51-100',
    '101-500',
    '500+'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      console.log('Login attempt:', { email: formData.email, password: formData.password });
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } else {
      if (step === 1) {
        setStep(2);
      } else {
        console.log('Registration attempt:', formData);
        // Handle registration logic
        window.location.href = '/dashboard';
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 to-purple-800 text-white p-12 flex-col justify-center">
        <div className="max-w-md">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-bold text-xl">NF</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">NECTFORMA</h1>
              <p className="text-purple-200">Plateforme de gestion éducative</p>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold mb-6">
            Révolutionnez votre gestion de formation
          </h2>
          
          <p className="text-lg text-purple-100 mb-8">
            Rejoignez des milliers d'établissements qui font confiance à NectForma 
            pour digitaliser leur gestion pédagogique et administrative.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-300 rounded-full mr-3"></div>
              <span className="text-purple-100">Gestion complète des formations</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-300 rounded-full mr-3"></div>
              <span className="text-purple-100">Emploi du temps intelligent</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-300 rounded-full mr-3"></div>
              <span className="text-purple-100">Coffre-fort numérique sécurisé</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-300 rounded-full mr-3"></div>
              <span className="text-purple-100">Messagerie intégrée</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {isLogin ? 'Connexion' : 'Créer un compte'}
              </h2>
              <p className="text-gray-600">
                {isLogin 
                  ? 'Connectez-vous à votre espace NectForma'
                  : step === 1 
                    ? 'Commencez votre essai gratuit'
                    : 'Informations sur votre établissement'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {isLogin ? (
                // Login Form
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="inline h-4 w-4 mr-2" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="votre@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Lock className="inline h-4 w-4 mr-2" />
                      Mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                        placeholder="Votre mot de passe"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                      <span className="ml-2 text-sm text-gray-600">Se souvenir de moi</span>
                    </label>
                    <a href="#" className="text-sm text-purple-600 hover:text-purple-700">
                      Mot de passe oublié ?
                    </a>
                  </div>
                </>
              ) : (
                // Registration Form
                step === 1 ? (
                  // Step 1: Personal Information
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="inline h-4 w-4 mr-2" />
                        Email professionnel
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="votre@email.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="inline h-4 w-4 mr-2" />
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="+33 1 23 45 67 89"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Lock className="inline h-4 w-4 mr-2" />
                        Mot de passe
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Minimum 8 caractères"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Confirmez votre mot de passe"
                        required
                      />
                    </div>
                  </>
                ) : (
                  // Step 2: Establishment Information
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Building className="inline h-4 w-4 mr-2" />
                        Nom de l'établissement
                      </label>
                      <input
                        type="text"
                        value={formData.establishmentName}
                        onChange={(e) => handleInputChange('establishmentName', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Nom de votre établissement"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type d'établissement</label>
                      <select
                        value={formData.establishmentType}
                        onChange={(e) => handleInputChange('establishmentType', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      >
                        <option value="">Sélectionnez un type</option>
                        {establishmentTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre d'apprenants</label>
                      <select
                        value={formData.numberOfStudents}
                        onChange={(e) => handleInputChange('numberOfStudents', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      >
                        <option value="">Sélectionnez une tranche</option>
                        {studentRanges.map(range => (
                          <option key={range} value={range}>{range} apprenants</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="inline h-4 w-4 mr-2" />
                        Adresse
                      </label>
                      <textarea
                        value={formData.establishmentAddress}
                        onChange={(e) => handleInputChange('establishmentAddress', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={3}
                        placeholder="Adresse complète de l'établissement"
                        required
                      />
                    </div>
                  </>
                )
              )}

              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                {isLogin 
                  ? 'Se connecter' 
                  : step === 1 
                    ? 'Continuer' 
                    : 'Créer mon compte'
                }
              </button>
            </form>

            {!isLogin && step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="w-full mt-4 text-purple-600 hover:text-purple-700 font-medium"
              >
                Étape précédente
              </button>
            )}

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {isLogin ? "Vous n'avez pas de compte ?" : "Vous avez déjà un compte ?"}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setStep(1);
                  }}
                  className="ml-2 text-purple-600 hover:text-purple-700 font-medium"
                >
                  {isLogin ? 'Créer un compte' : 'Se connecter'}
                </button>
              </p>
            </div>

            {!isLogin && (
              <p className="text-xs text-gray-500 text-center mt-4">
                En créant un compte, vous acceptez nos{' '}
                <a href="#" className="text-purple-600 hover:text-purple-700">conditions d'utilisation</a>
                {' '}et notre{' '}
                <a href="#" className="text-purple-600 hover:text-purple-700">politique de confidentialité</a>.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
