import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Shield, Users, GraduationCap, UserCheck, Briefcase, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Comptes de démo pour les tests
const DEMO_ACCOUNTS = [
  { 
    role: 'Admin Principal', 
    email: 'admin.principal@demo.nectfy.fr', 
    password: 'Demo123!',
    icon: Shield,
    color: 'text-purple-600',
    borderColor: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50'
  },
  { 
    role: 'Administrateur', 
    email: 'admin@demo.nectfy.fr', 
    password: 'Demo123!',
    icon: Users,
    color: 'text-blue-600',
    borderColor: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50'
  },
  { 
    role: 'Formateur', 
    email: 'formateur@demo.nectfy.fr', 
    password: 'Demo123!',
    icon: Briefcase,
    color: 'text-emerald-600',
    borderColor: 'border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50'
  },
  { 
    role: 'Étudiant', 
    email: 'etudiant@demo.nectfy.fr', 
    password: 'Demo123!',
    icon: GraduationCap,
    color: 'text-amber-600',
    borderColor: 'border-amber-200 hover:border-amber-400 hover:bg-amber-50'
  },
  { 
    role: 'Tuteur', 
    email: 'tuteur@demo.nectfy.fr', 
    password: 'Demo123!',
    icon: UserCheck,
    color: 'text-rose-600',
    borderColor: 'border-rose-200 hover:border-rose-400 hover:bg-rose-50'
  },
];

const Auth = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);
  const [demoReady, setDemoReady] = useState(false);
  const [settingUpDemo, setSettingUpDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Initialize demo accounts on first load
  useEffect(() => {
    const initDemoAccounts = async () => {
      try {
        // Check if demo account exists by trying to get user info
        const { data: demoCheck } = await supabase
          .from('establishments')
          .select('id')
          .eq('email', 'demo@nectfy.fr')
          .maybeSingle();

        if (demoCheck) {
          setDemoReady(true);
          return;
        }

        // Setup demo accounts
        setSettingUpDemo(true);
        const { data, error } = await supabase.functions.invoke('setup-demo-accounts');
        
        if (error) {
          console.error('Demo setup error:', error);
        } else {
          console.log('Demo accounts setup:', data);
          setDemoReady(true);
        }
      } catch (err) {
        console.error('Error checking demo accounts:', err);
      } finally {
        setSettingUpDemo(false);
      }
    };

    initDemoAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Adresse email ou mot de passe incorrect');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Veuillez confirmer votre email avant de vous connecter');
        } else {
          setError('Erreur de connexion. Veuillez réessayer.');
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        toast.success('Connexion réussie !');
        // Check for redirect after login (e.g., from signature link)
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          sessionStorage.removeItem('redirectAfterLogin');
          window.location.href = redirectUrl;
        } else {
          window.location.href = '/dashboard';
        }
      }
    } catch (err: any) {
      setError('Erreur lors de la connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (email: string, password: string, role: string) => {
    setLoadingDemo(role);
    setError(null);
    
    try {
      // If demo not ready, try to setup first
      if (!demoReady) {
        toast.loading('Préparation des comptes démo...');
        const { error: setupError } = await supabase.functions.invoke('setup-demo-accounts');
        if (setupError) {
          toast.dismiss();
          toast.error('Erreur lors de la préparation des comptes démo');
          setLoadingDemo(null);
          return;
        }
        toast.dismiss();
        setDemoReady(true);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // If login fails, try to setup demo accounts again
        toast.loading('Configuration du compte démo...');
        await supabase.functions.invoke('setup-demo-accounts');
        toast.dismiss();
        
        // Retry login
        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (retryError) {
          toast.error(`Impossible de se connecter en tant que ${role}. Veuillez réessayer.`);
          setLoadingDemo(null);
          return;
        }

        if (retryData.user) {
          toast.success(`Connexion réussie en tant que ${role} !`);
          const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
          if (redirectUrl) {
            sessionStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectUrl;
          } else {
            window.location.href = '/dashboard';
          }
        }
        return;
      }

      if (data.user) {
        toast.success(`Connexion réussie en tant que ${role} !`);
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          sessionStorage.removeItem('redirectAfterLogin');
          window.location.href = redirectUrl;
        } else {
          window.location.href = '/dashboard';
        }
      }
    } catch (err: any) {
      toast.error('Erreur lors de la connexion démo');
    } finally {
      setLoadingDemo(null);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setError(null);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex flex-col lg:flex-row">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 to-purple-800 text-white p-12 flex-col justify-center">
        <div className="max-w-md">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-bold text-xl">N</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">NECTFY</h1>
              <p className="text-purple-200">Plateforme de gestion éducative</p>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold mb-6">
            Révolutionnez votre gestion de formation
          </h2>
          
          <p className="text-lg text-purple-100 mb-8">
            Rejoignez des milliers d'établissements qui font confiance à NECTFY 
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
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <span className="text-xl font-bold text-gray-900">NECTFY</span>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Connexion
              </h2>
              <p className="text-gray-600">
                Connectez-vous à votre espace NECTFY
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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

              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  <span className="ml-2 text-sm text-gray-600">Se souvenir de moi</span>
                </label>
                <a href="#" className="text-sm text-purple-600 hover:text-purple-700">
                  Mot de passe oublié ?
                </a>
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </button>
            </form>

            {/* Demo Accounts Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center mb-4">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  OU COMPTES DE DÉMO
                </span>
                {settingUpDemo && (
                  <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-500">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Préparation des comptes...
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                {DEMO_ACCOUNTS.map((account) => {
                  const Icon = account.icon;
                  const isLoading = loadingDemo === account.role;
                  return (
                    <button
                      key={account.role}
                      onClick={() => handleDemoLogin(account.email, account.password, account.role)}
                      disabled={loadingDemo !== null || settingUpDemo}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 border-2 rounded-lg transition-all ${account.borderColor} disabled:opacity-50`}
                    >
                      {isLoading ? (
                        <Loader2 className={`h-4 w-4 animate-spin ${account.color}`} />
                      ) : (
                        <Icon className={`h-4 w-4 ${account.color}`} />
                      )}
                      <span className={`font-medium text-sm ${account.color}`}>
                        {isLoading ? 'Connexion...' : account.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-gray-600 mb-4">
                Vous n'avez pas encore de compte établissement ?
              </p>
              <Link 
                to="/create-establishment" 
                className="block w-full text-center bg-gray-100 text-purple-600 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Créer un compte établissement
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
