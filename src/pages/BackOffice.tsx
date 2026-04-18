import React, { useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import logoNf from '@/assets/logo-nf.png';
import {
  FileText, Building2, BarChart3, Headphones, CreditCard, LogOut,
  ChevronLeft, ChevronRight, Share2, LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const BOArticles = React.lazy(() => import('../components/backoffice/BOArticles'));
const BOCrm = React.lazy(() => import('../components/backoffice/BOCrm'));
const BOAnalytics = React.lazy(() => import('../components/backoffice/BOAnalytics'));
const BOSupport = React.lazy(() => import('../components/backoffice/BOSupport'));
const BOSubscriptions = React.lazy(() => import('../components/backoffice/BOSubscriptions'));
const BODashboard = React.lazy(() => import('../components/backoffice/BODashboard'));

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'articles', label: 'Articles & Social', icon: FileText },
  { id: 'crm', label: 'CRM', icon: Building2 },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'support', label: 'Support', icon: Headphones },
  { id: 'subscriptions', label: 'Abonnements', icon: CreditCard },
];

const BackOffice: React.FC = () => {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
    toast.success('Deconnexion reussie');
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden" data-testid="back-office">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-56'} bg-[#0f0f23] flex flex-col transition-all duration-200 shrink-0`}>
        {/* Logo */}
        <div className="p-3 border-b border-white/10 flex items-center gap-2">
          <img src={logoNf} alt="NF" className="w-8 h-8 rounded-lg" />
          {!collapsed && <span className="text-white font-bold text-sm">Back Office</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = activeModule === item.id;
            return (
              <button key={item.id} onClick={() => setActiveModule(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${isActive ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}
                data-testid={`bo-nav-${item.id}`}>
                <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-amber-400' : ''}`} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-white/10 space-y-1">
          <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 text-xs">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Reduire</span></>}
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 text-xs">
            <LogOut className="h-4 w-4" />{!collapsed && <span>Deconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>}>
          {activeModule === 'dashboard' && <BODashboard />}
          {activeModule === 'articles' && <BOArticles />}
          {activeModule === 'crm' && <BOCrm />}
          {activeModule === 'analytics' && <BOAnalytics />}
          {activeModule === 'support' && <BOSupport />}
          {activeModule === 'subscriptions' && <BOSubscriptions />}
        </Suspense>
      </main>
    </div>
  );
};

export default BackOffice;
