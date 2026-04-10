import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Briefcase, ShieldCheck } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

const EnhancedUsersList = React.lazy(() => import('../components/administration/EnhancedUsersList'));

const TabFallback = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
  </div>
);

interface TabDef {
  id: string;
  label: string;
  icon: LucideIcon;
}

const tabs: TabDef[] = [
  { id: 'users', label: 'Gestion des utilisateurs', icon: Users },
  { id: 'partners', label: 'Gestion des entreprises partenaires', icon: Briefcase },
];

const Administration = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabs.some(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="min-h-screen" data-testid="administration-page">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25 flex-shrink-0">
              <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Administration</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Gérez les utilisateurs et les entreprises partenaires.</p>
            </div>
          </div>
        </div>

        {/* Tab bar horizontale */}
        <div className="px-3 sm:px-4 lg:px-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max pb-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  data-testid={`tab-${tab.id}`}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        <Suspense fallback={<TabFallback />}>
          {activeTab === 'users' && <EnhancedUsersList />}
          {activeTab === 'partners' && (
            <div className="glass-card rounded-xl p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Entreprises partenaires</h3>
                <p className="text-muted-foreground">Cette section sera disponible prochainement.</p>
              </div>
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
};

export default Administration;
