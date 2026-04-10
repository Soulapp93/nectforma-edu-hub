import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, UsersRound } from 'lucide-react';
import HubPageHeader, { HubTab } from '../components/HubPageHeader';

const Messagerie = React.lazy(() => import('./Messagerie'));
const Groupes = React.lazy(() => import('./Groupes'));

const TabFallback = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
  </div>
);

const tabs: HubTab[] = [
  { id: 'messagerie', label: 'Messagerie', icon: Mail },
  { id: 'groupes', label: 'Gestion des groupes', icon: UsersRound },
];

const CommunicationHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('messagerie');

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
    <div className="min-h-screen" data-testid="communication-hub-page">
      <HubPageHeader
        title="Communication"
        description="Messagerie et groupes d'établissements."
        icon={Mail}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <div className="p-3 sm:p-6 lg:p-8">
        <Suspense fallback={<TabFallback />}>
          {activeTab === 'messagerie' && <Messagerie />}
          {activeTab === 'groupes' && <Groupes />}
        </Suspense>
      </div>
    </div>
  );
};

export default CommunicationHub;
