import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Shield, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import NectformaLogo from '@/components/NectformaLogo';

const Auth = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

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
      }
    } catch (err: any) {
      setError('Erreur lors de la connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError('Erreur lors de l\'envoi du lien. Veuillez réessayer.');
        setResetLoading(false);
        return;
      }

      setResetSent(true);
      toast.success('Si cette adresse email existe, un lien de réinitialisation vous a été envoyé.');
    } catch (err: any) {
      setError('Erreur lors de l\'envoi. Veuillez réessayer.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setError(null);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-gradient-to-br from-primary/90 via-primary to-primary/80 dark:from-background dark:via-background dark:to-primary/10">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/5 dark:bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 dark:bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-white/3 dark:bg-primary/3 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
        
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md animate-scale-in">
        {/* Logo and brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4 animate-float">
            <NectformaLogo variant="light" size="xl" />
          </div>
          <p className="text-white/70 dark:text-muted-foreground text-sm">Plateforme de gestion éducative</p>
        </div>

        {/* Login / Forgot Password card */}
        <div className="bg-card rounded-2xl border-2 border-primary/30 dark:border-border shadow-2xl p-6 sm:p-8 backdrop-blur-sm animate-slide-up">
          {!showForgotPassword ? (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-1">Connexion</h2>
                <p className="text-muted-foreground text-sm">Accédez à votre espace NECTFORMA</p>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-xl text-sm mb-4 animate-fade-in">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    <Mail className="inline h-4 w-4 mr-2 text-primary" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-primary/20 dark:border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground/60"
                    placeholder="votre@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    <Lock className="inline h-4 w-4 mr-2 text-primary" />
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-primary/20 dark:border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 pr-12 text-foreground placeholder:text-muted-foreground/60"
                      placeholder="Votre mot de passe"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" className="rounded border-primary/30 text-primary focus:ring-primary h-4 w-4" />
                    <span className="ml-2 text-sm text-muted-foreground">Se souvenir de moi</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setError(null);
                      setResetEmail(formData.email);
                    }}
                    className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground py-3.5 px-4 rounded-xl font-semibold hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Connexion...
                    </span>
                  ) : (
                    'Se connecter'
                  )}
                </button>
              </form>

              {/* Create establishment link */}
              <div className="mt-6 pt-6 border-t border-border text-center">
                <p className="text-muted-foreground text-sm mb-3">
                  Pas encore de compte établissement ?
                </p>
                <Link 
                  to="/create-establishment" 
                  className="inline-flex items-center justify-center w-full bg-secondary text-secondary-foreground py-3 px-4 rounded-xl font-medium hover:bg-secondary/80 transition-all duration-200"
                >
                  Créer un établissement
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-1">Mot de passe oublié</h2>
                <p className="text-muted-foreground text-sm">
                  Entrez votre adresse email pour recevoir un lien de réinitialisation
                </p>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-xl text-sm mb-4 animate-fade-in">
                  {error}
                </div>
              )}

              {resetSent ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium mb-1">Email envoyé !</p>
                    <p className="text-muted-foreground text-sm">
                      Si un compte existe avec l'adresse <strong className="text-foreground">{resetEmail}</strong>, vous recevrez un lien de réinitialisation.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetSent(false);
                      setError(null);
                    }}
                    className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Retour à la connexion
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      <Mail className="inline h-4 w-4 mr-2 text-primary" />
                      Adresse email
                    </label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => {
                        setResetEmail(e.target.value);
                        setError(null);
                      }}
                      className="w-full px-4 py-3 border-2 border-primary/20 dark:border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground/60"
                      placeholder="votre@email.com"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground py-3.5 px-4 rounded-xl font-semibold hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 shadow-lg"
                    disabled={resetLoading}
                  >
                    {resetLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Envoi en cours...
                      </span>
                    ) : (
                      'Envoyer le lien de réinitialisation'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setError(null);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors py-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Retour à la connexion
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* Legal links */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <Link 
            to="/cgu" 
            className="text-white/70 dark:text-muted-foreground hover:text-white dark:hover:text-foreground text-xs transition-colors flex items-center gap-1"
          >
            <Shield className="h-3 w-3" />
            CGU
          </Link>
          <span className="text-white/30 dark:text-muted-foreground/30">•</span>
          <Link 
            to="/politique-confidentialite" 
            className="text-white/70 dark:text-muted-foreground hover:text-white dark:hover:text-foreground text-xs transition-colors flex items-center gap-1"
          >
            <Lock className="h-3 w-3" />
            Confidentialité
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 text-white/50 dark:text-muted-foreground/50 text-xs">
          © {new Date().getFullYear()} NECTFORMA. Tous droits réservés.
        </div>
      </div>
    </div>
  );
};

export default Auth;
