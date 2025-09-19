
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import Sidebar from './components/Sidebar';
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
import Evenements from './pages/Evenements';
import CoffreFort from './pages/CoffreFort';
import Compte from './pages/Compte';
import NotFound from './pages/NotFound';
import Auth from './pages/Auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';

  if (isAuthPage) {
    return (
      <div className="min-h-screen w-full">
        <Routes>
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <Sidebar />
        <div className="flex flex-col flex-1">
          <header className="h-12 flex items-center border-b bg-white px-4">
            <SidebarTrigger />
          </header>
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
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
              <Route path="/evenements" element={<ProtectedRoute><Evenements /></ProtectedRoute>} />
              <Route path="/coffre-fort" element={<ProtectedRoute><CoffreFort /></ProtectedRoute>} />
              <Route path="/compte" element={<ProtectedRoute><Compte /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppContent />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
