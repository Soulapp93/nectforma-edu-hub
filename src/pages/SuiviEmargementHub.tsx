import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardCheck, AlertTriangle } from 'lucide-react';
import HubPageHeader, { HubTab } from '../components/HubPageHeader';

const AttendanceManagement = React.lazy(() => import('../components/administration/AttendanceManagement'));
const AbsenceManagement = React.lazy(() => import('../components/administration/AbsenceManagement'));

const TabFallback = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
  </div>
);

const tabs: HubTab[] = [
  { id: 'attendance', label: 'Gestion des émargements', icon: ClipboardCheck },
  { id: 'absences', label: 'Gestion des absences', icon: AlertTriangle },
];

const SuiviEmargementHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('attendance');

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
    <div className="min-h-screen" data-testid="suivi-emargement-hub-page">
      <HubPageHeader
        title="Suivi & Émargement"
        description="Gérez les émargements et les absences."
        icon={ClipboardCheck}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <div className="p-3 sm:p-6 lg:p-8">
        <Suspense fallback={<TabFallback />}>
          {activeTab === 'attendance' && <AttendanceManagement />}
          {activeTab === 'absences' && <AbsenceManagement />}
        </Suspense>
      </div>
    </div>
  );
};

export default SuiviEmargementHub;
