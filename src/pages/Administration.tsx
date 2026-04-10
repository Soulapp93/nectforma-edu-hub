import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Briefcase, ShieldCheck } from 'lucide-react';
import HubPageHeader, { HubTab } from '../components/HubPageHeader';

const EnhancedUsersList = React.lazy(() => import('../components/administration/EnhancedUsersList'));

const TabFallback = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
  </div>
);

const tabs: HubTab[] = [
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
      <HubPageHeader
        title="Administration"
        description="Gérez les utilisateurs et les entreprises partenaires."
        icon={ShieldCheck}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <div className="p-3 sm:p-6 lg:p-8">
        <Suspense fallback={<TabFallback />}>
          {activeTab === 'users' && <EnhancedUsersList />}
          {activeTab === 'partners' && (
            <div className="glass-card rounded-xl p-6 sm:p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Entreprises partenaires</h3>
                <p className="text-sm text-muted-foreground">Cette section sera disponible prochainement.</p>
              </div>
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
};

export default Administration;
