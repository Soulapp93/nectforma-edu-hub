
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArrowLeft } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import BottomNavigation from './components/BottomNavigation';
import NotificationBell from './components/NotificationBell';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Administration from './pages/Administration';
import Formations from './pages/Formations';
import FormationDetail from './pages/FormationDetail';
import TextBookDetail from './pages/TextBookDetail';
import TextBookByFormation from './pages/TextBookByFormation';
import SuiviEmargement from './pages/SuiviEmargement';
import EmploiTemps from './pages/EmploiTemps';
import ScheduleEditor from './pages/ScheduleEditor';
import Messagerie from './pages/Messagerie';
import Emargement from './pages/Emargement';
import EmargementQR from './pages/EmargementQR';
import AttendanceImprovements from './pages/AttendanceImprovements';
import GestionEtablissement from './pages/GestionEtablissement';
import Compte from './pages/Compte';
import NotFound from './pages/NotFound';
import Auth from './pages/Auth';
import Index from './pages/Index';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === '/auth';
  const isMobile = useIsMobile();
  
  // Déterminer si on peut revenir en arrière
  const canGoBack = location.pathname !== '/dashboard' && location.pathname !== '/';

  if (isAuthPage) {
    return (
      <div className="min-h-screen w-full">
        <Routes>
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </div>
    );
  }

  const isIndexPage = location.pathname === '/';
  
  if (isIndexPage) {
    return (
      <Routes>
        <Route path="/" element={<Index />} />
      </Routes>
    );
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex h-screen w-full bg-gray-50">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        <div className="flex flex-col flex-1 w-full">
          {/* Header - hidden on mobile, shown on desktop */}
          <header className="hidden md:flex h-14 sm:h-16 items-center justify-between border-b bg-white px-4 sm:px-6 sticky top-0 z-40 shadow-sm">
            <SidebarTrigger className="h-9 w-9" />
            <div className="flex items-center space-x-3 sm:space-x-4">
              <NotificationBell />
            </div>
          </header>
          
          {/* Mobile Header - shown only on mobile */}
          <header className="md:hidden h-14 flex items-center justify-between border-b bg-white px-4 sticky top-0 z-40 shadow-sm">
            {canGoBack ? (
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Retour"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </button>
            ) : (
              <div className="w-9" /> // Placeholder pour maintenir le centrage
            )}
            
            <div className="flex items-center space-x-2 absolute left-1/2 transform -translate-x-1/2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">N</span>
              </div>
              <h1 className="text-lg font-bold text-primary">NECTFY</h1>
            </div>
            
            <NotificationBell />
          </header>
          
          <main className="flex-1 overflow-auto bg-gray-50 pb-20 md:pb-0">
            <Routes>
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/administration" element={<ProtectedRoute><Administration /></ProtectedRoute>} />
              <Route path="/formations" element={<ProtectedRoute><Formations /></ProtectedRoute>} />
              <Route path="/formations/:formationId" element={<ProtectedRoute><FormationDetail /></ProtectedRoute>} />
              <Route path="/cahier-texte/:textBookId" element={<ProtectedRoute><TextBookDetail /></ProtectedRoute>} />
              <Route path="/cahier-texte/formation/:formationId" element={<ProtectedRoute><TextBookByFormation /></ProtectedRoute>} />
              <Route path="/suivi-emargement" element={<ProtectedRoute><SuiviEmargement /></ProtectedRoute>} />
              <Route path="/emploi-temps" element={<ProtectedRoute><EmploiTemps /></ProtectedRoute>} />
              <Route path="/emploi-temps/edit/:scheduleId" element={<ProtectedRoute><ScheduleEditor /></ProtectedRoute>} />
              <Route path="/emploi-temps/view/:scheduleId" element={<ProtectedRoute><ScheduleEditor /></ProtectedRoute>} />
              <Route path="/messagerie" element={<ProtectedRoute><Messagerie /></ProtectedRoute>} />
              <Route path="/emargement" element={<ProtectedRoute><Emargement /></ProtectedRoute>} />
              <Route path="/emargement-qr" element={<ProtectedRoute><EmargementQR /></ProtectedRoute>} />
              <Route path="/emargement/ameliorations" element={<ProtectedRoute><AttendanceImprovements /></ProtectedRoute>} />
              <Route path="/gestion-etablissement" element={<ProtectedRoute><GestionEtablissement /></ProtectedRoute>} />
              <Route path="/compte" element={<ProtectedRoute><Compte /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
        
        {/* Bottom Navigation - shown only on mobile */}
        <BottomNavigation />
      </div>
      <Toaster />
    </SidebarProvider>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AppContent />
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
