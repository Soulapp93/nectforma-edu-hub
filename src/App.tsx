
import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { SidebarProvider } from '@/components/ui/sidebar';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/button';
import Sidebar from './components/Sidebar';
import TopHeaderBar from './components/TopHeaderBar';
import MobileHeader from './components/MobileHeader';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminPrincipalRoute from './components/AdminPrincipalRoute';
import TutorRestrictedRoute from './components/TutorRestrictedRoute';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEstablishmentTheme } from '@/hooks/useEstablishmentTheme';
import { monitoring } from '@/utils/monitoring';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import CookieConsent from '@/components/CookieConsent';

// Lazy load all pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Administration = React.lazy(() => import('./pages/Administration'));
const Formations = React.lazy(() => import('./pages/Formations'));
const FormationDetail = React.lazy(() => import('./pages/FormationDetail'));
const TextBookDetail = React.lazy(() => import('./pages/TextBookDetail'));
const TextBookByFormation = React.lazy(() => import('./pages/TextBookByFormation'));
const SuiviEmargement = React.lazy(() => import('./pages/SuiviEmargement'));
const SignaturePublique = React.lazy(() => import('./pages/SignaturePublique'));
const EmploiTemps = React.lazy(() => import('./pages/EmploiTemps'));
const Messagerie = React.lazy(() => import('./pages/Messagerie'));
const Groupes = React.lazy(() => import('./pages/Groupes'));
const Emargement = React.lazy(() => import('./pages/Emargement'));
const EmargementQR = React.lazy(() => import('./pages/EmargementQR'));
const GestionEtablissement = React.lazy(() => import('./pages/GestionEtablissement'));
const Compte = React.lazy(() => import('./pages/Compte'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const Auth = React.lazy(() => import('./pages/Auth'));
const Index = React.lazy(() => import('./pages/Index'));
const CreateEstablishment = React.lazy(() => import('./pages/CreateEstablishment'));
const AcceptInvitation = React.lazy(() => import('./pages/AcceptInvitation'));
const Solutions = React.lazy(() => import('./pages/Solutions'));
const Fonctionnalites = React.lazy(() => import('./pages/Fonctionnalites'));
const PourquoiNous = React.lazy(() => import('./pages/PourquoiNous'));
const CGU = React.lazy(() => import('./pages/CGU'));
const PolitiqueConfidentialite = React.lazy(() => import('./pages/PolitiqueConfidentialite'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const Activation = React.lazy(() => import('./pages/Activation'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const Documentation = React.lazy(() => import('./pages/Documentation'));
const Blog = React.lazy(() => import('./pages/Blog'));
const Install = React.lazy(() => import('./pages/Install'));
const BlogPost = React.lazy(() => import('./pages/BlogPost'));
const BlogAdmin = React.lazy(() => import('./pages/BlogAdmin'));
const LinkedInCallback = React.lazy(() => import('./pages/LinkedInCallback'));
const EspaceTravail = React.lazy(() => import('./pages/EspaceTravail'));
const QuestionnairePublic = React.lazy(() => import('./pages/QuestionnairePublic'));
const Notes = React.lazy(() => import('./pages/Notes'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
      <p className="text-muted-foreground text-sm">Chargement...</p>
    </div>
  </div>
);

const ErrorFallback = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center min-h-screen bg-background p-6">
    <div className="max-w-md w-full text-center space-y-3">
      <h1 className="text-lg font-semibold">Impossible de charger la session</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" onClick={() => window.location.reload()}>Reessayer</Button>
        <Button onClick={() => (window.location.href = '/auth')}>Se reconnecter</Button>
      </div>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    },
  },
});

// ─── Layout: bare wrapper (no sidebar, no auth) ────────────────────
const MinimalLayout = () => (
  <div className="min-h-screen w-full">
    <Suspense fallback={<LoadingFallback />}>
      <Outlet />
    </Suspense>
    <Toaster />
  </div>
);

// ─── Layout: public marketing pages ────────────────────────────────
const PublicLayout = () => {
  const { userId, userRole, loading: authLoading, error: authError } = useCurrentUser();
  const location = useLocation();

  const legalPages = ['/cgu', '/politique-confidentialite'];
  const isBlogArticlePage = location.pathname.startsWith('/blog/');
  const isLegalPage = legalPages.includes(location.pathname);

  if (authLoading) return <LoadingFallback />;
  if (authError) return <ErrorFallback message={authError} />;

  // Authenticated users are redirected from marketing pages (but not from legal/blog)
  if (userId && !isLegalPage && !isBlogArticlePage) {
    if (userRole === 'SuperAdmin') return <Navigate to="/blog-admin" replace />;
    const home = userRole === 'Admin' || userRole === 'AdminPrincipal' ? '/dashboard' : '/formations';
    return <Navigate to={home} replace />;
  }

  return (
    <>
      <GoogleAnalytics measurementId={import.meta.env.VITE_GA_MEASUREMENT_ID || ''} />
      <Suspense fallback={<LoadingFallback />}>
        <Outlet />
      </Suspense>
      <CookieConsent />
    </>
  );
};

// ─── Layout: auth page with redirect if already logged in ──────────
const AuthLayout = () => {
  const { userId, userRole, loading: authLoading } = useCurrentUser();

  if (authLoading) return <LoadingFallback />;

  if (userId && userRole) {
    if (userRole === 'SuperAdmin') return <Navigate to="/blog-admin" replace />;
    const home = userRole === 'Admin' || userRole === 'AdminPrincipal' ? '/dashboard' : '/formations';
    return <Navigate to={home} replace />;
  }

  return (
    <div className="min-h-screen w-full">
      <Suspense fallback={<LoadingFallback />}>
        <Outlet />
      </Suspense>
    </div>
  );
};

// ─── Layout: SuperAdmin blog-admin with GA ─────────────────────────
const BlogAdminLayout = () => {
  const { userId, userRole, loading: authLoading, error: authError } = useCurrentUser();
  const location = useLocation();

  if (authLoading) return <LoadingFallback />;
  if (authError) return <ErrorFallback message={authError} />;
  if (!userId) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (userRole !== 'SuperAdmin') return <Navigate to="/" replace />;

  return (
    <>
      <GoogleAnalytics measurementId={import.meta.env.VITE_GA_MEASUREMENT_ID || ''} />
      <Suspense fallback={<LoadingFallback />}>
        <Outlet />
      </Suspense>
      <Toaster />
    </>
  );
};

// ─── Layout: authenticated with sidebar ────────────────────────────
const AuthenticatedLayout = () => {
  const { userId, userRole, loading: authLoading, error: authError } = useCurrentUser();
  const location = useLocation();

  if (authLoading) return <LoadingFallback />;

  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <div className="max-w-md w-full text-center space-y-3">
          <h1 className="text-lg font-semibold">Session instable</h1>
          <p className="text-sm text-muted-foreground">{authError}</p>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>Reessayer</Button>
            <Button onClick={() => (window.location.href = '/auth')}>Se reconnecter</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!userId) return <Navigate to="/auth" state={{ from: location }} replace />;

  if (!userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
          <p className="text-muted-foreground text-sm">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (userRole === 'SuperAdmin') return <Navigate to="/blog-admin" replace />;

  return (
    <SidebarProvider
      defaultOpen={true}
      style={{
        "--sidebar-width": "16rem",
        "--sidebar-width-icon": "4.5rem",
      } as React.CSSProperties}
    >
      <Sidebar />
      <div className="flex min-h-svh flex-1 flex-col min-w-0 nect-gradient">
        <MobileHeader />
        <TopHeaderBar />
        <main className="flex-1 overflow-auto bg-[hsl(230_25%_97%)] rounded-tl-2xl">
          <Suspense fallback={<LoadingFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  );
};

// ─── Root: monitoring + theme ──────────────────────────────────────
const AppRoot = () => {
  const { userId } = useCurrentUser();
  useEstablishmentTheme();

  useEffect(() => {
    monitoring.setUserId(userId || null);
  }, [userId]);

  useEffect(() => {
    monitoring.trackPageLoad();
  }, []);

  return <Outlet />;
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange forcedTheme="light">
        <QueryClientProvider client={queryClient}>
          <Router>
            <AuthProvider>
              <Routes>
                {/* Root wrapper for monitoring & theme */}
                <Route element={<AppRoot />}>

                  {/* ── Minimal pages (no auth, no sidebar) ── */}
                  <Route element={<MinimalLayout />}>
                    <Route path="/emargement/signer/:token" element={<SignaturePublique />} />
                    <Route path="/questionnaire/:token" element={<QuestionnairePublic />} />
                    <Route path="/linkedin-callback" element={<LinkedInCallback />} />
                    <Route path="/create-establishment" element={<CreateEstablishment />} />
                    <Route path="/creer-etablissement" element={<CreateEstablishment />} />
                    <Route path="/accept-invitation" element={<AcceptInvitation />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/activation" element={<Activation />} />
                  </Route>

                  {/* ── Auth page ── */}
                  <Route element={<AuthLayout />}>
                    <Route path="/auth" element={<Auth />} />
                  </Route>

                  {/* ── Public marketing pages ── */}
                  <Route element={<PublicLayout />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/solutions" element={<Navigate to="/fonctionnalites" replace />} />
                    <Route path="/fonctionnalites" element={<Fonctionnalites />} />
                    <Route path="/pourquoi-nous" element={<PourquoiNous />} />
                    <Route path="/cgu" element={<CGU />} />
                    <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
                    <Route path="/documentation" element={<Documentation />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/:slug" element={<BlogPost />} />
                    <Route path="/install" element={<Install />} />
                  </Route>

                  {/* ── Blog admin (SuperAdmin only) ── */}
                  <Route element={<BlogAdminLayout />}>
                    <Route path="/blog-admin" element={<BlogAdmin />} />
                  </Route>

                  {/* ── Authenticated app with sidebar ── */}
                  <Route element={<AuthenticatedLayout />}>
                    <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
                    <Route path="/administration" element={<AdminRoute><Administration /></AdminRoute>} />
                    <Route path="/formations" element={<Formations />} />
                    <Route path="/formations/:formationId" element={<FormationDetail />} />
                    <Route path="/cahier-texte/:textBookId" element={<TextBookDetail />} />
                    <Route path="/cahier-texte/formation/:formationId" element={<TextBookByFormation />} />
                    <Route path="/suivi-emargement" element={<SuiviEmargement />} />
                    <Route path="/emploi-temps" element={<EmploiTemps />} />
                    <Route path="/emploi-temps/view/:scheduleId" element={<EmploiTemps />} />
                    <Route path="/emploi-temps/edit/:scheduleId" element={<EmploiTemps />} />
                    <Route path="/messagerie" element={<TutorRestrictedRoute><Messagerie /></TutorRestrictedRoute>} />
                    <Route path="/groupes" element={<TutorRestrictedRoute><Groupes /></TutorRestrictedRoute>} />
                    <Route path="/emargement" element={<TutorRestrictedRoute><Emargement /></TutorRestrictedRoute>} />
                    <Route path="/emargement-qr" element={<TutorRestrictedRoute><EmargementQR /></TutorRestrictedRoute>} />
                    <Route path="/gestion-etablissement" element={<AdminPrincipalRoute><GestionEtablissement /></AdminPrincipalRoute>} />
                    <Route path="/compte" element={<Compte />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/espace-travail" element={<TutorRestrictedRoute><EspaceTravail /></TutorRestrictedRoute>} />
                    <Route path="/notes" element={<Notes />} />
                  </Route>

                  {/* ── Catch-all ── */}
                  <Route path="*" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <NotFound />
                    </Suspense>
                  } />

                </Route>
              </Routes>
            </AuthProvider>
          </Router>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
