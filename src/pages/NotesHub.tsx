import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Medal, Award } from 'lucide-react';
import HubPageHeader, { HubTab } from '../components/HubPageHeader';

const Notes = React.lazy(() => import('./Notes'));
const DiplomaManagement = React.lazy(() => import('../components/grades/DiplomaManagement'));

const TabFallback = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
  </div>
);

const tabs: HubTab[] = [
  { id: 'notes', label: 'Gestion des notes et relevés', icon: FileText },
  { id: 'diplomas', label: 'Gestion des diplômes', icon: Medal },
];

const NotesHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('notes');

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
    <div className="min-h-screen" data-testid="notes-hub-page">
      <HubPageHeader
        title="Notes, Relevés & Diplômes"
        description="Gérez les notes, relevés de notes et diplômes."
        icon={Award}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <div className="p-3 sm:p-6 lg:p-8">
        <Suspense fallback={<TabFallback />}>
          {activeTab === 'notes' && <Notes />}
          {activeTab === 'diplomas' && <DiplomaManagement />}
        </Suspense>
      </div>
    </div>
  );
};

export default NotesHub;
