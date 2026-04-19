import React, { useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import NectformaLogo from '@/components/NectformaLogo';
import {
  FileText, Building2, BarChart3, Headphones, CreditCard, LogOut,
  PanelLeftClose, PanelLeft, LayoutDashboard,
} from 'lucide-react';
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
      {/* Sidebar - same design as Nectforma establishment sidebar */}
      <aside className={`${collapsed ? 'w-[60px]' : 'w-[240px]'} bg-[hsl(240,60%,8%)] flex flex-col transition-all duration-300 shrink-0 relative overflow-hidden`}>
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(240,60%,12%)] to-[hsl(240,60%,6%)]" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--golden))]/5 rounded-full blur-3xl" />

        {/* Header/Logo */}
        <div className={`relative z-10 p-3 ${collapsed ? 'flex justify-center' : 'px-4'} border-b border-white/[0.08]`}>
          {collapsed ? (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(var(--golden))] to-[hsl(var(--golden))]/70 flex items-center justify-center">
              <span className="text-[hsl(var(--golden-foreground))] font-black text-sm">NF</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 py-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(var(--golden))] to-[hsl(var(--golden))]/70 flex items-center justify-center shadow-lg shadow-[hsl(var(--golden))]/20 shrink-0">
                <span className="text-[hsl(var(--golden-foreground))] font-black text-sm">NF</span>
              </div>
              <div>
                <p className="text-white font-bold text-[13px] leading-tight">Nectforma</p>
                <p className="text-[10px] text-white/40 font-medium">Back Office</p>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 relative z-10 p-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = activeModule === item.id;
            return (
              <button key={item.id} onClick={() => setActiveModule(item.id)}
                className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${isActive ? 'bg-white/[0.12] text-white shadow-sm' : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'}`}
                data-testid={`bo-nav-${item.id}`}
                title={collapsed ? item.label : undefined}>
                <item.icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-[hsl(var(--golden))]' : ''}`} />
                {!collapsed && <span>{item.label}</span>}
                {isActive && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[hsl(var(--golden))]" />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="relative z-10 p-2 border-t border-white/[0.08] space-y-1">
          <button onClick={() => setCollapsed(!collapsed)}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-2.5 px-3 py-2 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/[0.06] text-[12px] transition-colors`}>
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" /><span>Reduire</span></>}
          </button>
          <button onClick={handleLogout}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-2.5 px-3 py-2 rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-500/10 text-[12px] transition-colors`}>
            <LogOut className="h-4 w-4" />{!collapsed && <span>Deconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-background">
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
