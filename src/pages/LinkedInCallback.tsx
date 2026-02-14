import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const LinkedInCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [accountName, setAccountName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMessage(searchParams.get('error_description') || 'Authorization denied');
      return;
    }

    if (code) {
      exchangeCode(code);
    } else {
      setStatus('error');
      setErrorMessage('No authorization code received');
    }
  }, [searchParams]);

  const exchangeCode = async (code: string) => {
    try {
      // Always use production domain for LinkedIn OAuth
      const redirectUri = 'https://nectforma.com/linkedin-callback';

      const { data, error } = await supabase.functions.invoke('linkedin-oauth', {
        body: {
          action: 'exchange-code',
          code,
          redirect_uri: redirectUri,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Exchange failed');
      }

      setAccountName(data.account_name || 'LinkedIn');
      setStatus('success');
      toast.success(`LinkedIn connecté : ${data.account_name || 'Page LinkedIn'}`);
    } catch (err: any) {
      console.error('LinkedIn callback error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Failed to connect LinkedIn');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            💼 Connexion LinkedIn
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <>
              <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Connexion en cours...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Check className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium">Connecté à {accountName}</p>
              <p className="text-sm text-muted-foreground">
                Vos publications LinkedIn seront automatiquement publiées sur cette page.
              </p>
              <Button onClick={() => navigate('/blog-admin')} className="w-full">
                Retour à l'administration
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="font-medium text-destructive">Échec de la connexion</p>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              <Button onClick={() => navigate('/blog-admin')} variant="outline" className="w-full">
                Retour
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LinkedInCallback;
