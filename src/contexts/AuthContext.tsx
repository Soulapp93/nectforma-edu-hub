import { logger } from '@/utils/logger';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { rpcWithRetry } from '@/lib/supabaseRetry';

const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(`${label}: timeout after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
};

interface AuthState {
  userId: string | null;
  userRole: string | null;
  isSuperAdmin: boolean;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthState>({
  userId: null,
  userRole: null,
  isSuperAdmin: false,
  loading: true,
  error: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    userId: null,
    userRole: null,
    isSuperAdmin: false,
    loading: true,
    error: null,
  });

  // Guards to prevent duplicate/concurrent fetches
  const fetchingForUidRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  const fetchUserRole = useCallback(async (uid: string, mounted: { current: boolean }) => {
    // Skip if already fetching for the same user
    if (fetchingForUidRef.current === uid) return;
    fetchingForUidRef.current = uid;

    try {
      const { data: isSA, error: isSuperAdminError } = await withTimeout(
        rpcWithRetry(() => supabase.rpc('is_super_admin'), { maxRetries: 2, baseDelayMs: 400 }),
        6000,
        'is_super_admin'
      );

      if (!mounted.current) return;

      if (isSuperAdminError) {
        logger.error('Erreur is_super_admin:', isSuperAdminError);
      }

      const superAdmin = !!isSA;

      if (superAdmin) {
        setState(prev => ({ ...prev, userId: uid, userRole: 'SuperAdmin', isSuperAdmin: true, error: null }));
        return;
      }

      const { data, error: rpcError } = await withTimeout(
        rpcWithRetry(() => supabase.rpc('get_current_user_role'), {
          maxRetries: 3,
          baseDelayMs: 500,
          onRetry: (attempt, err) => logger.warn(`Retry ${attempt} get_current_user_role:`, err.message),
        }),
        8000,
        'get_current_user_role'
      );

      if (!mounted.current) return;

      if (rpcError) {
        logger.error('Erreur get_current_user_role:', rpcError);
        setState(prev => ({ ...prev, userId: uid, userRole: null, isSuperAdmin: false, error: 'Erreur de chargement du rôle' }));
        return;
      }

      setState(prev => ({ ...prev, userId: uid, userRole: (data as string) ?? null, isSuperAdmin: false, error: null }));
    } catch (err) {
      logger.error('Erreur fetchUserRole:', err);
      if (mounted.current) {
        setState(prev => ({ ...prev, userId: uid, userRole: null, isSuperAdmin: false, error: 'Erreur de connexion' }));
      }
    } finally {
      // Release the lock only if we were the one holding it for this uid
      if (fetchingForUidRef.current === uid) {
        fetchingForUidRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    const mounted = { current: true };

    sessionStorage.removeItem('demo_user');

    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await withTimeout(
          supabase.auth.getSession(),
          6000,
          'getSession'
        );

        if (!mounted.current) return;

        if (sessionError) {
          logger.error('Erreur de session:', sessionError);
          setState(prev => ({ ...prev, error: 'Erreur de session', loading: false }));
          return;
        }

        if (session?.user?.id) {
          await fetchUserRole(session.user.id, mounted);
        } else {
          setState(prev => ({ ...prev, userId: null, userRole: null, isSuperAdmin: false }));
        }
      } catch (err) {
        logger.error('Erreur initializeAuth:', err);
        if (mounted.current) {
          setState(prev => ({ ...prev, userId: null, userRole: null, isSuperAdmin: false, error: 'Erreur de connexion' }));
        }
      } finally {
        if (mounted.current) {
          setState(prev => ({ ...prev, loading: false }));
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted.current) return;

        if (event === 'INITIAL_SESSION') return;

        if (event === 'SIGNED_OUT') {
          // Clear any pending debounce
          if (debounceTimerRef.current) {
            window.clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
          }
          fetchingForUidRef.current = null;
          setState({ userId: null, userRole: null, isSuperAdmin: false, loading: false, error: null });
          return;
        }

        if (session?.user?.id) {
          setState(prev => ({ ...prev, userId: session.user.id }));
          
          // Debounce role fetch to prevent token refresh storms
          if (debounceTimerRef.current) {
            window.clearTimeout(debounceTimerRef.current);
          }
          debounceTimerRef.current = window.setTimeout(() => {
            debounceTimerRef.current = null;
            fetchUserRole(session.user.id, mounted);
          }, 300);
        }
      }
    );

    initializeAuth();

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [fetchUserRole]);

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
};
