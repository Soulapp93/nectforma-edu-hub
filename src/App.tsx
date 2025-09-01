
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Administration from './pages/Administration';
import Formations from './pages/Formations';
import FormationDetail from './pages/FormationDetail';
import ELearning from './pages/ELearning';
import EmploiTemps from './pages/EmploiTemps';
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
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/administration" element={<Administration />} />
              <Route path="/formations" element={<Formations />} />
              <Route path="/formations/:formationId" element={<FormationDetail />} />
              <Route path="/e-learning" element={<ELearning />} />
              <Route path="/emploi-temps" element={<EmploiTemps />} />
              <Route path="/messagerie" element={<Messagerie />} />
              <Route path="/emargement" element={<Emargement />} />
              <Route path="/evenements" element={<Evenements />} />
              <Route path="/coffre-fort" element={<CoffreFort />} />
              <Route path="/compte" element={<Compte />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
