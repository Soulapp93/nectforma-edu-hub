import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { supabase } from '@/integrations/supabase/client';
import { useMyContext } from '@/hooks/useMyContext';
import Sidebar from '@/components/Sidebar';
import TopHeaderBar from '@/components/TopHeaderBar';
import MobileHeader from '@/components/MobileHeader';
import CookieConsent from '@/components/CookieConsent';

const Auth = lazy(() => import('@/pages/Auth'));
const Index = lazy(() => import('@/pages/Index'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Administration = lazy(() => import('@/pages/Administration'));
const Pedagogie = lazy(() => import('@/pages/Pedagogie'));
const SuiviEmargementHub = lazy(() => import('@/pages/SuiviEmargementHub'));
const NotesHub = lazy(() => import('@/pages/NotesHub'));
const CommunicationHub = lazy(() => import('@/pages/CommunicationHub'));
const DocumentsArchives = lazy(() => import('@/pages/DocumentsArchives'));
const Formations = lazy(() => import('@/pages/Formations'));
const FormationDetail = lazy(() => import('@/pages/FormationDetail'));
const TextBookDetail = lazy(() => import('@/pages/TextBookDetail'));
const TextBookByFormation = lazy(() => import('@/pages/TextBookByFormation'));
const SuiviEmargement = lazy(() => import('@/pages/SuiviEmargement'));
const Emargement = lazy(() => import('@/pages/Emargement'));
const EmargementQR = lazy(() => import('@/pages/EmargementQR'));
const Messagerie = lazy(() => import('@/pages/Messagerie'));
const Groupes = lazy(() => import('@/pages/Groupes'));
const Compte = lazy(() => import('@/pages/Compte'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const GestionEtablissement = lazy(() => import('@/pages/GestionEtablissement'));
const CreateEstablishment = lazy(() => import('@/pages/CreateEstablishment'));
const Blog = lazy(() => import('@/pages/Blog'));
const BlogPost = lazy(() => import('@/pages/BlogPost'));
const BlogAdmin = lazy(() => import('@/pages/BlogAdmin'));
const Documentation = lazy(() => import('@/pages/Documentation'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const AcceptInvitation = lazy(() => import('@/pages/AcceptInvitation'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Activation = lazy(() => import('@/pages/Activation'));
const SignaturePublique = lazy(() => import('@/pages/SignaturePublique'));
const QuestionnairePublic = lazy(() => import('@/pages/QuestionnairePublic'));
const LinkedInCallback = lazy(() => import('@/pages/LinkedInCallback'));
const EspaceTravail = lazy(() => import('@/pages/EspaceTravail'));
const CGU = lazy(() => import('@/pages/CGU'));
const PolitiqueConfidentialite = lazy(() => import('@/pages/PolitiqueConfidentialite'));
const SuperAdmin = lazy(() => import('@/pages/SuperAdmin'));
const AttendanceLinkPage = lazy(() => import('@/pages/AttendanceLinkPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCurrentUser();
  if (loading) return <LoadingFallback />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { userRole, loading } = useCurrentUser();
  if (loading) return <LoadingFallback />;
  const adminRoles = ['admin', 'admin_principal', 'super_admin'];
  if (!adminRoles.includes(userRole || '')) {
    return <Navigate to="/dashboard-etudiant" replace />;
  }
  return <>{children}</>;
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { userRole, loading } = useCurrentUser();
  if (loading) return <LoadingFallback />;
  if (userRole !== 'super_admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppContent() {
  const { user, loading, userRole } = useCurrentUser();
  const { user: myUser, establishment } = useMyContext();
  const [showCookieConsent, setShowCookieConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setShowCookieConsent(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (loading) return <LoadingFallback />;

  const isPublicRoute = [
    '/auth', '/blog', '/fonctionnalites', '/pourquoi-nous',
    '/create-establishment', '/documentation', '/cgu', '/politique-confidentialite',
  ].some(path => window.location.pathname.startsWith(path)) ||
    window.location.pathname === '/' ||
    window.location.pathname.startsWith('/accept-invitation') ||
    window.location.pathname.startsWith('/reset-password') ||
    window.location.pathname.startsWith('/activation') ||
    window.location.pathname.startsWith('/signature-publique') ||
    window.location.pathname.startsWith('/questionnaire-public') ||
    window.location.pathname.startsWith('/linkedin-callback') ||
    window.location.pathname.startsWith('/attendance-link');

  if (!user && !isPublicRoute) {
    return (
      <Routes>
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  if (!user || isPublicRoute) {
    return (
      <Routes>
        <Route path="/" element={<Suspense fallback={<LoadingFallback />}><Index /></Suspense>} />
        <Route path="/auth" element={<Suspense fallback={<LoadingFallback />}><Auth /></Suspense>} />
        <Route path="/blog" element={<Suspense fallback={<LoadingFallback />}><Blog /></Suspense>} />
        <Route path="/blog/:slug" element={<Suspense fallback={<LoadingFallback />}><BlogPost /></Suspense>} />
        <Route path="/fonctionnalites" element={<Suspense fallback={<LoadingFallback />}><Index /></Suspense>} />
        <Route path="/pourquoi-nous" element={<Suspense fallback={<LoadingFallback />}><Index /></Suspense>} />
        <Route path="/create-establishment" element={<Suspense fallback={<LoadingFallback />}><CreateEstablishment /></Suspense>} />
        <Route path="/documentation" element={<Suspense fallback={<LoadingFallback />}><Documentation /></Suspense>} />
        <Route path="/cgu" element={<Suspense fallback={<LoadingFallback />}><CGU /></Suspense>} />
        <Route path="/politique-confidentialite" element={<Suspense fallback={<LoadingFallback />}><PolitiqueConfidentialite /></Suspense>} />
        <Route path="/accept-invitation" element={<Suspense fallback={<LoadingFallback />}><AcceptInvitation /></Suspense>} />
        <Route path="/reset-password" element={<Suspense fallback={<LoadingFallback />}><ResetPassword /></Suspense>} />
        <Route path="/activation" element={<Suspense fallback={<LoadingFallback />}><Activation /></Suspense>} />
        <Route path="/signature-publique/:token" element={<Suspense fallback={<LoadingFallback />}><SignaturePublique /></Suspense>} />
        <Route path="/questionnaire-public/:token" element={<Suspense fallback={<LoadingFallback />}><QuestionnairePublic /></Suspense>} />
        <Route path="/linkedin-callback" element={<Suspense fallback={<LoadingFallback />}><LinkedInCallback /></Suspense>} />
        <Route path="/attendance-link/:token" element={<Suspense fallback={<LoadingFallback />}><AttendanceLinkPage /></Suspense>} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  const getDashboardRoute = () => {
    if (userRole === 'super_admin') return '/super-admin';
    if (userRole === 'etudiant') return '/dashboard-etudiant';
    if (userRole === 'tuteur') return '/dashboard-tuteur';
    return '/dashboard';
  };

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
        <main className="flex-1 overflow-auto bg-background rounded-tl-2xl">
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
              <Route path="/emargement" element={<ProtectedRoute><Emargement /></ProtectedRoute>} />
              <Route path="/emargement-qr" element={<ProtectedRoute><EmargementQR /></ProtectedRoute>} />
              <Route path="/messagerie" element={<ProtectedRoute><Messagerie /></ProtectedRoute>} />
              <Route path="/groupes" element={<ProtectedRoute><Groupes /></ProtectedRoute>} />
              <Route path="/compte" element={<ProtectedRoute><Compte /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/gestion-etablissement" element={<ProtectedRoute><GestionEtablissement /></ProtectedRoute>} />
              <Route path="/blog" element={<Suspense fallback={<LoadingFallback />}><Blog /></Suspense>} />
              <Route path="/blog/:slug" element={<Suspense fallback={<LoadingFallback />}><BlogPost /></Suspense>} />
              <Route path="/blog-admin" element={<ProtectedRoute><AdminRoute><BlogAdmin /></AdminRoute></ProtectedRoute>} />
              <Route path="/documentation" element={<Suspense fallback={<LoadingFallback />}><Documentation /></Suspense>} />
              <Route path="/espace-travail" element={<ProtectedRoute><EspaceTravail /></ProtectedRoute>} />
              <Route path="/super-admin" element={<ProtectedRoute><SuperAdminRoute><SuperAdmin /></SuperAdminRoute></ProtectedRoute>} />
              <Route path="/attendance-link/:token" element={<Suspense fallback={<LoadingFallback />}><AttendanceLinkPage /></Suspense>} />
              <Route path="/signature-publique/:token" element={<Suspense fallback={<LoadingFallback />}><SignaturePublique /></Suspense>} />
              <Route path="/questionnaire-public/:token" element={<Suspense fallback={<LoadingFallback />}><QuestionnairePublic /></Suspense>} />
              <Route path="/accept-invitation" element={<Suspense fallback={<LoadingFallback />}><AcceptInvitation /></Suspense>} />
              <Route path="/reset-password" element={<Suspense fallback={<LoadingFallback />}><ResetPassword /></Suspense>} />
              <Route path="/activation" element={<Suspense fallback={<LoadingFallback />}><Activation /></Suspense>} />
              <Route path="/linkedin-callback" element={<Suspense fallback={<LoadingFallback />}><LinkedInCallback /></Suspense>} />
              <Route path="/cgu" element={<Suspense fallback={<LoadingFallback />}><CGU /></Suspense>} />
              <Route path="/politique-confidentialite" element={<Suspense fallback={<LoadingFallback />}><PolitiqueConfidentialite /></Suspense>} />
              <Route path="/" element={<Navigate to={getDashboardRoute()} replace />} />
              <Route path="*" element={<Suspense fallback={<LoadingFallback />}><NotFound /></Suspense>} />
            </Routes>
          </Suspense>
        </main>
      </div>
      {showCookieConsent && <CookieConsent onClose={() => setShowCookieConsent(false)} />}
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AppContent />
          <Toaster />
        </ThemeProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
