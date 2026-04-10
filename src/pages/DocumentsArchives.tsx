import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FolderOpen, Archive } from 'lucide-react';
import HubPageHeader, { HubTab } from '../components/HubPageHeader';

const StudentFilesManagement = React.lazy(() => import('../components/administration/StudentFilesManagement'));
const ArchivesManagement = React.lazy(() => import('../components/administration/ArchivesManagement'));

const TabFallback = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
  </div>
);

const tabs: HubTab[] = [
  { id: 'student-files', label: 'Gestion des dossiers étudiants', icon: FolderOpen },
  { id: 'archives', label: 'Gestion des archives', icon: Archive },
];

const DocumentsArchives = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('student-files');

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
    <div className="min-h-screen" data-testid="documents-archives-page">
      <HubPageHeader
        title="Documents & Archives"
        description="Dossiers étudiants et archives de l'établissement."
        icon={FolderOpen}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <div className="p-3 sm:p-6 lg:p-8">
        <Suspense fallback={<TabFallback />}>
          {activeTab === 'student-files' && <StudentFilesManagement />}
          {activeTab === 'archives' && <ArchivesManagement />}
        </Suspense>
      </div>
    </div>
  );
};

export default DocumentsArchives;
