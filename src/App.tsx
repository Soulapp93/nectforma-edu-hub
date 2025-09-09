
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Administration from './pages/Administration';
import Formations from './pages/Formations';
import FormationDetail from './pages/FormationDetail';
import TextBookDetail from './pages/TextBookDetail';
import TextBookByFormation from './pages/TextBookByFormation';
import ELearning from './pages/ELearning';
import EmploiTemps from './pages/EmploiTemps';
import ScheduleEditor from './pages/ScheduleEditor';
import Messagerie from './pages/Messagerie';
import Emargement from './pages/Emargement';
import Evenements from './pages/Evenements';
import CoffreFort from './pages/CoffreFort';
import Compte from './pages/Compte';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <SidebarProvider>
          <div className="flex h-screen w-full bg-gray-50">
            <Sidebar />
            <div className="flex flex-col flex-1">
              <header className="h-12 flex items-center border-b bg-white px-4">
                <SidebarTrigger />
              </header>
              <main className="flex-1 overflow-auto">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/administration" element={<Administration />} />
                  <Route path="/formations" element={<Formations />} />
                  <Route path="/formations/:formationId" element={<FormationDetail />} />
                  <Route path="/cahier-texte/:textBookId" element={<TextBookDetail />} />
                  <Route path="/cahier-texte/formation/:formationId" element={<TextBookByFormation />} />
                  <Route path="/e-learning" element={<ELearning />} />
                  <Route path="/emploi-temps" element={<EmploiTemps />} />
                  <Route path="/emploi-temps/edit/:scheduleId" element={<ScheduleEditor />} />
                  <Route path="/emploi-temps/view/:scheduleId" element={<ScheduleEditor />} />
                  <Route path="/messagerie" element={<Messagerie />} />
                  <Route path="/emargement" element={<Emargement />} />
                  <Route path="/evenements" element={<Evenements />} />
                  <Route path="/coffre-fort" element={<CoffreFort />} />
                  <Route path="/compte" element={<Compte />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
          <Toaster />
        </SidebarProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
