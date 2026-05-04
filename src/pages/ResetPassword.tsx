import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, Loader2, XCircle, Shield, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import NectformaLogo from '@/components/NectformaLogo';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    checkResetFlow();
  }, []);

  const checkResetFlow = async () => {
    try {
      const customToken = searchParams.get('token');

      if (customToken) {
        const { data, error: validateError } = await supabase.functions.invoke('validate-activation-token', {
          body: { token: customToken },
        });

        if (validateError || !data?.success) {
          setError("Le lien de réinitialisation est invalide ou a expiré.");
          setLoading(false);
          return;
        }

        setUserEmail(data.user?.email || null);
        setTokenValid(true);
        setLoading(false);
        return;
      }

      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (accessToken && refreshToken && type === 'recovery') {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError || !sessionData.session) {
          setError("Session invalide ou expirée.");
          setLoading(false);
          return;
        }

        setUserEmail(sessionData.session.user.email || null);
        setTokenValid(true);
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserEmail(session.user.email || null);
        setTokenValid(true);
        setLoading(false);
        return;
      }

      setError("Lien de réinitialisation invalide ou expiré. Veuillez demander un nouveau lien.");
      setLoading(false);
    } catch (err: any) {
      logger.error("Error checking reset flow:", err);
      setError("Erreur lors de la vérification du lien.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setSubmitting(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setSubmitting(false);
      return;
    }

    try {
      const customToken = searchParams.get('token');

      if (customToken) {
        const { data, error: resetError } = await supabase.functions.invoke('activate-user-account', {
          body: {
            token: customToken,
            password: formData.password
          }
        });

        if (resetError) {
          setError('Erreur lors de la mise à jour du mot de passe. Veuillez réessayer.');
          setSubmitting(false);
          return;
        }

        if (data?.error) {
          setError(data.error);
          setSubmitting(false);
          return;
        }

        setSuccess(true);
        toast.success('Mot de passe mis à jour avec succès !');

        if (userEmail) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: userEmail,
            password: formData.password
          });

          if (!signInError) {
            setTimeout(() => navigate('/dashboard'), 2000);
            return;
          }
        }

        setTimeout(() => navigate('/auth'), 2000);
      } else {
        const { error: updateError } = await supabase.auth.updateUser({
          password: formData.password
        });

        if (updateError) {
          if (updateError.message.includes('Auth session missing')) {
            setError('Session expirée. Veuillez demander un nouveau lien de réinitialisation.');
          } else {
            setError('Erreur lors de la mise à jour du mot de passe. Veuillez réessayer.');
          }
          setSubmitting(false);
          return;
        }

        setSuccess(true);
        toast.success('Mot de passe mis à jour avec succès !');
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (err: any) {
      logger.error("Reset password error:", err);
      setError('Erreur lors de la mise à jour du mot de passe. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setError(null);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-gradient-to-br from-primary/90 via-primary to-primary/80">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/70">Vérification du lien de réinitialisation...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid && error) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-gradient-to-br from-primary/90 via-primary to-primary/80">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>
        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4 animate-float">
              <NectformaLogo variant="light" size="xl" />
            </div>
            <p className="text-white/70 text-sm">Plateforme de gestion éducative</p>
          </div>
          <div className="bg-card rounded-2xl border-2 border-primary/30 shadow-2xl p-6 sm:p-8 backdrop-blur-sm text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Lien invalide ou expiré
            </h2>
            <p className="text-muted-foreground mb-6">
              {error}
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="w-full bg-primary text-primary-foreground py-3.5 px-4 rounded-xl font-semibold hover:bg-primary/90 transition-all duration-200 shadow-lg"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-gradient-to-br from-primary/90 via-primary to-primary/80">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>
        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4 animate-float">
              <NectformaLogo variant="light" size="xl" />
            </div>
            <p className="text-white/70 text-sm">Plateforme de gestion éducative</p>
          </div>
          <div className="bg-card rounded-2xl border-2 border-primary/30 shadow-2xl p-6 sm:p-8 backdrop-blur-sm text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Mot de passe mis à jour !
            </h2>
            <p className="text-muted-foreground mb-6">
              Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers votre espace...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-gradient-to-br from-primary/90 via-primary to-primary/80">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-white/3 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
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
          <p className="text-white/70 text-sm">Plateforme de gestion éducative</p>
        </div>

        {/* Reset password card */}
        <div className="bg-card rounded-2xl border-2 border-primary/30 shadow-2xl p-6 sm:p-8 backdrop-blur-sm animate-slide-up">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-1">Nouveau mot de passe</h2>
            <p className="text-muted-foreground text-sm">
              Créez un nouveau mot de passe sécurisé
            </p>
            {userEmail && (
              <p className="text-sm text-primary mt-2">{userEmail}</p>
            )}
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-xl text-sm mb-4 animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                <Lock className="inline h-4 w-4 mr-2 text-primary" />
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-primary/20 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 pr-12 text-foreground placeholder:text-muted-foreground/60"
                  placeholder="Minimum 8 caractères"
                  required
                  minLength={8}
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

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                <Lock className="inline h-4 w-4 mr-2 text-primary" />
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-primary/20 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 pr-12 text-foreground placeholder:text-muted-foreground/60"
                  placeholder="Confirmez votre mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-3.5 px-4 rounded-xl font-semibold hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98]"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Mise à jour en cours...
                </span>
              ) : (
                'Mettre à jour le mot de passe'
              )}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </Link>
          </div>
        </div>

        {/* Legal links */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <Link 
            to="/cgu" 
            className="text-white/70 hover:text-white text-xs transition-colors flex items-center gap-1"
          >
            <Shield className="h-3 w-3" />
            CGU
          </Link>
          <span className="text-white/30">•</span>
          <Link 
            to="/politique-confidentialite" 
            className="text-white/70 hover:text-white text-xs transition-colors flex items-center gap-1"
          >
            <Lock className="h-3 w-3" />
            Confidentialité
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 text-white/50 text-xs">
          © {new Date().getFullYear()} NECTFORMA. Tous droits réservés.
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
