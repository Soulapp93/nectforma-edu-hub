
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Administration from "./pages/Administration";
import Formations from "./pages/Formations";
import Messagerie from "./pages/Messagerie";
import EmploiTemps from "./pages/EmploiTemps";
import Emargement from "./pages/Emargement";
import Evenements from "./pages/Evenements";
import CoffreFort from "./pages/CoffreFort";
import Compte from "./pages/Compte";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/home" element={<Index />} />
          <Route path="/register" element={<Index />} />
          
          {/* Protected routes with sidebar */}
          <Route path="/*" element={
            <div className="flex h-screen bg-gray-50">
              <Sidebar />
              <main className="flex-1 overflow-auto">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/administration" element={<Administration />} />
                  <Route path="/formations" element={<Formations />} />
                  <Route path="/messagerie" element={<Messagerie />} />
                  <Route path="/emploi-temps" element={<EmploiTemps />} />
                  <Route path="/emargement" element={<Emargement />} />
                  <Route path="/evenements" element={<Evenements />} />
                  <Route path="/coffre-fort" element={<CoffreFort />} />
                  <Route path="/compte" element={<Compte />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
