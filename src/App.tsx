
import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
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
const Pedagogie = React.lazy(() => import('./pages/Pedagogie'));
const SuiviEmargementHub = React.lazy(() => import('./pages/SuiviEmargementHub'));
const NotesHub = React.lazy(() => import('./pages/NotesHub'));
const CommunicationHub = React.lazy(() => import('./pages/CommunicationHub'));
const DocumentsArchives = React.lazy(() => import('./pages/DocumentsArchives'));
const ClassesVirtuelles = React.lazy(() => import('./pages/ClassesVirtuelles'));
const Notes = React.lazy(() => import('./pages/Notes'));
const Finance = React.lazy(() => import('./pages/Finance'));
const Comptabilite = React.lazy(() => import('./pages/Comptabilite'));
const RessourcesHumaines = React.lazy(() => import('./pages/RessourcesHumaines'));
const QuizJoin = React.lazy(() => import('./pages/QuizJoin'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
      <p className="text-muted-foreground text-sm">Chargement...</p>
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

const AppContent = () => {
  const location = useLocation();
  const { userId, userRole, loading: authLoading, error: authError } = useCurrentUser();
  
  useEstablishmentTheme();
  
  useEffect(() => {
    monitoring.setUserId(userId || null);
  }, [userId]);

  useEffect(() => {
    monitoring.trackPageLoad();
  }, []);
  
  const isSignaturePage = location.pathname.startsWith('/emargement/signer/');
  const isLinkedInCallback = location.pathname === '/linkedin-callback';

  if (isSignaturePage || isLinkedInCallback) {
    return (
      <div className="min-h-screen w-full">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/emargement/signer/:token" element={<SignaturePublique />} />
            <Route path="/questionnaire/:token" element={<QuestionnairePublic />} />
            <Route path="/linkedin-callback" element={<LinkedInCallback />} />
          </Routes>
        </Suspense>
        <Toaster />
      </div>
    );
  }

  const isBlogAdminPage = location.pathname === '/blog-admin';
  if (isBlogAdminPage) {
    if (authLoading) return <LoadingFallback />;

    if (authError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-6">
          <div className="max-w-md w-full text-center space-y-3">
            <h1 className="text-lg font-semibold">Impossible de charger la session</h1>
            <p className="text-sm text-muted-foreground">{authError}</p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" onClick={() => window.location.reload()}>Réessayer</Button>
              <Button onClick={() => (window.location.href = '/auth')}>Se reconnecter</Button>
            </div>
          </div>
        </div>
      );
    }

    if (!userId) return <Navigate to="/auth" state={{ from: location }} replace />;
    if (userRole !== 'SuperAdmin') return <Navigate to="/" replace />;

    return (
      <>
        <GoogleAnalytics measurementId={import.meta.env.VITE_GA_MEASUREMENT_ID || ''} />
        <Suspense fallback={<LoadingFallback />}><BlogAdmin /></Suspense>
        <Toaster />
      </>
    );
  }
  
  const isAuthPage = location.pathname === '/auth';
  const isCreateEstablishmentPage = location.pathname === '/create-establishment' || location.pathname === '/creer-etablissement';
  const isAcceptInvitationPage = location.pathname === '/accept-invitation';
  const isResetPasswordPage = location.pathname === '/reset-password';
  const isActivationPage = location.pathname === '/activation';

  if (isAuthPage) {
    if (authLoading) return <LoadingFallback />;
    if (userId && userRole) {
      if (userRole === 'SuperAdmin') return <Navigate to="/blog-admin" replace />;
      const home = userRole === 'Admin' || userRole === 'AdminPrincipal' ? '/dashboard' : '/formations';
      return <Navigate to={home} replace />;
    }
    return (
      <div className="min-h-screen w-full">
        <Suspense fallback={<LoadingFallback />}>
          <Routes><Route path="/auth" element={<Auth />} /></Routes>
        </Suspense>
      </div>
    );
  }

  if (isCreateEstablishmentPage) {
    return (
      <div className="min-h-screen w-full">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/create-establishment" element={<CreateEstablishment />} />
            <Route path="/creer-etablissement" element={<CreateEstablishment />} />
          </Routes>
        </Suspense>
      </div>
    );
  }

  if (isAcceptInvitationPage) {
    return (
      <div className="min-h-screen w-full">
        <Suspense fallback={<LoadingFallback />}>
          <Routes><Route path="/accept-invitation" element={<AcceptInvitation />} /></Routes>
        </Suspense>
      </div>
    );
  }

  if (isResetPasswordPage) {
    return (
      <div className="min-h-screen w-full">
        <Suspense fallback={<LoadingFallback />}>
          <Routes><Route path="/reset-password" element={<ResetPassword />} /></Routes>
        </Suspense>
      </div>
    );
  }

  if (isActivationPage) {
    return (
      <div className="min-h-screen w-full">
        <Suspense fallback={<LoadingFallback />}>
          <Routes><Route path="/activation" element={<Activation />} /></Routes>
        </Suspense>
      </div>
    );
  }

  const publicPages = ['/', '/fonctionnalites', '/pourquoi-nous', '/cgu', '/politique-confidentialite', '/documentation', '/blog', '/install'];
  const legalPages = ['/cgu', '/politique-confidentialite'];
  const isPublicPage = publicPages.includes(location.pathname) || location.pathname.startsWith('/blog/');
  const isBlogArticlePage = location.pathname.startsWith('/blog/');
  const isLegalPage = legalPages.includes(location.pathname);
  
  if (isPublicPage) {
    if (authLoading) return <LoadingFallback />;

    if (authError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-6">
          <div className="max-w-md w-full text-center space-y-3">
            <h1 className="text-lg font-semibold">Impossible de charger la session</h1>
            <p className="text-sm text-muted-foreground">{authError}</p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" onClick={() => window.location.reload()}>Réessayer</Button>
              <Button onClick={() => (window.location.href = '/auth')}>Se reconnecter</Button>
            </div>
          </div>
        </div>
      );
    }

    if (userId && !isLegalPage && !isBlogArticlePage) {
      if (userRole === 'SuperAdmin') return <Navigate to="/blog-admin" replace />;
      const home = userRole === 'Admin' || userRole === 'AdminPrincipal' ? '/dashboard' : '/formations';
      return <Navigate to={home} replace />;
    }

    return (
      <>
        <GoogleAnalytics measurementId={import.meta.env.VITE_GA_MEASUREMENT_ID || ''} />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
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
          </Routes>
        </Suspense>
        <CookieConsent />
      </>
    );
  }

  if (authLoading) return <LoadingFallback />;

  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <div className="max-w-md w-full text-center space-y-3">
          <h1 className="text-lg font-semibold">Session instable</h1>
          <p className="text-sm text-muted-foreground">{authError}</p>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>Réessayer</Button>
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
        "--sidebar-width": "18rem",
        "--sidebar-width-icon": "4.5rem",
      } as React.CSSProperties}
    >
      <Sidebar />
      <div className="flex min-h-svh flex-1 flex-col min-w-0 nect-gradient">
        <MobileHeader />
        <TopHeaderBar />
        <main className="flex-1 overflow-auto bg-[hsl(230_25%_97%)] rounded-tl-2xl">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/dashboard" element={<ProtectedRoute><AdminRoute><Dashboard /></AdminRoute></ProtectedRoute>} />
              <Route path="/administration" element={<ProtectedRoute><AdminRoute><Administration /></AdminRoute></ProtectedRoute>} />
              <Route path="/pedagogie" element={<ProtectedRoute><AdminRoute><Pedagogie /></AdminRoute></ProtectedRoute>} />
              <Route path="/suivi-emargement-admin" element={<ProtectedRoute><AdminRoute><SuiviEmargementHub /></AdminRoute></ProtectedRoute>} />
              <Route path="/notes-admin" element={<ProtectedRoute><AdminRoute><NotesHub /></AdminRoute></ProtectedRoute>} />
              <Route path="/communication" element={<ProtectedRoute><AdminRoute><CommunicationHub /></AdminRoute></ProtectedRoute>} />
              <Route path="/documents-archives" element={<ProtectedRoute><AdminRoute><DocumentsArchives /></AdminRoute></ProtectedRoute>} />
              <Route path="/formations" element={<ProtectedRoute><Formations /></ProtectedRoute>} />
              <Route path="/formations/:formationId" element={<ProtectedRoute><FormationDetail /></ProtectedRoute>} />
              <Route path="/cahier-texte/:textBookId" element={<ProtectedRoute><TextBookDetail /></ProtectedRoute>} />
              <Route path="/cahier-texte/formation/:formationId" element={<ProtectedRoute><TextBookByFormation /></ProtectedRoute>} />
              <Route path="/suivi-emargement" element={<ProtectedRoute><SuiviEmargement /></ProtectedRoute>} />
              <Route path="/emploi-temps" element={<ProtectedRoute><EmploiTemps /></ProtectedRoute>} />
              <Route path="/emploi-temps/view/:scheduleId" element={<ProtectedRoute><EmploiTemps /></ProtectedRoute>} />
              <Route path="/emploi-temps/edit/:scheduleId" element={<ProtectedRoute><EmploiTemps /></ProtectedRoute>} />
              <Route path="/messagerie" element={<ProtectedRoute><TutorRestrictedRoute><Messagerie /></TutorRestrictedRoute></ProtectedRoute>} />
              <Route path="/groupes" element={<ProtectedRoute><TutorRestrictedRoute><Groupes /></TutorRestrictedRoute></ProtectedRoute>} />
              <Route path="/emargement" element={<ProtectedRoute><TutorRestrictedRoute><Emargement /></TutorRestrictedRoute></ProtectedRoute>} />
              <Route path="/emargement-qr" element={<ProtectedRoute><TutorRestrictedRoute><EmargementQR /></TutorRestrictedRoute></ProtectedRoute>} />
              <Route path="/gestion-etablissement" element={<ProtectedRoute><AdminPrincipalRoute><GestionEtablissement /></AdminPrincipalRoute></ProtectedRoute>} />
              <Route path="/compte" element={<ProtectedRoute><Compte /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/espace-travail" element={<ProtectedRoute><TutorRestrictedRoute><EspaceTravail /></TutorRestrictedRoute></ProtectedRoute>} />
              <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
              <Route path="/classes-virtuelles" element={<ProtectedRoute><ClassesVirtuelles /></ProtectedRoute>} />
              <Route path="/finance" element={<ProtectedRoute><AdminRoute><Finance /></AdminRoute></ProtectedRoute>} />
              <Route path="/comptabilite" element={<ProtectedRoute><AdminRoute><Comptabilite /></AdminRoute></ProtectedRoute>} />
              <Route path="/ressources-humaines" element={<ProtectedRoute><AdminRoute><RessourcesHumaines /></AdminRoute></ProtectedRoute>} />
              <Route path="/quiz/join/:quizId" element={<ProtectedRoute><QuizJoin /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange forcedTheme="light">
        <QueryClientProvider client={queryClient}>
          <Router>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </Router>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
