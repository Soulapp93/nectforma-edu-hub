
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Administration from "./pages/Administration";
import Formations from "./pages/Formations";
import Messagerie from "./pages/Messagerie";
import EmploiTemps from "./pages/EmploiTemps";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/administration" element={<Administration />} />
              <Route path="/formations" element={<Formations />} />
              <Route path="/messagerie" element={<Messagerie />} />
              <Route path="/emploi-temps" element={<EmploiTemps />} />
              {/* Placeholder routes for other sections */}
              <Route path="/emargement" element={<div className="p-8"><h1 className="text-2xl font-bold">Émargement - En développement</h1></div>} />
              <Route path="/evenements" element={<div className="p-8"><h1 className="text-2xl font-bold">Événements - En développement</h1></div>} />
              <Route path="/coffre-fort" element={<div className="p-8"><h1 className="text-2xl font-bold">Coffre-fort - En développement</h1></div>} />
              <Route path="/compte" element={<div className="p-8"><h1 className="text-2xl font-bold">Gestion du compte - En développement</h1></div>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
