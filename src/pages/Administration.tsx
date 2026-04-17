import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, FolderOpen, ShieldCheck, CreditCard } from 'lucide-react';
import HubPageHeader, { HubTab } from '../components/HubPageHeader';

const EnhancedUsersList = React.lazy(() => import('../components/administration/EnhancedUsersList'));
const DossiersAdministratifs = React.lazy(() => import('../components/administration/DossiersAdministratifs'));
const StudentCardManagement = React.lazy(() => import('../components/administration/StudentCardManagement'));

const TabFallback = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
  </div>
);

const tabs: HubTab[] = [
  { id: 'users', label: 'Gestion des utilisateurs', icon: Users },
  { id: 'dossiers', label: 'Dossiers administratifs', icon: FolderOpen },
  { id: 'cards', label: 'Gestion des cartes etudiantes', icon: CreditCard },
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
        description="Gerez les utilisateurs et les dossiers administratifs."
        icon={ShieldCheck}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <div className="p-3 sm:p-6 lg:p-8">
        <Suspense fallback={<TabFallback />}>
          {activeTab === 'users' && <EnhancedUsersList />}
          {activeTab === 'dossiers' && <DossiersAdministratifs />}
          {activeTab === 'cards' && <StudentCardManagement />}
        </Suspense>
      </div>
    </div>
  );
};

export default Administration;
