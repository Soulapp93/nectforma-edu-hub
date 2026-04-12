import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarClock, BookText, GraduationCap, UsersRound, Video, BookOpen } from 'lucide-react';
import HubPageHeader, { HubTab } from '../components/HubPageHeader';

const ScheduleManagement = React.lazy(() => import('../components/administration/ScheduleManagement'));
const TextBooksList = React.lazy(() => import('../components/administration/TextBooksList'));
const FormationsList = React.lazy(() => import('../components/administration/FormationsList'));
const PromotionsList = React.lazy(() => import('../components/administration/PromotionsList'));
const VirtualClassesManagement = React.lazy(() => import('../components/administration/VirtualClassesManagement'));

const TabFallback = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
  </div>
);

const tabs: HubTab[] = [
  { id: 'schedules', label: 'Gestion des emplois du temps', icon: CalendarClock },
  { id: 'textbooks', label: 'Gestion des cahiers de textes', icon: BookText },
  { id: 'formations', label: 'Gestion des formations', icon: GraduationCap },
  { id: 'promotions', label: 'Gestion des promotions', icon: UsersRound },
  { id: 'virtual-classes', label: 'Gestion des classes virtuelles', icon: Video },
];

const Pedagogie = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('schedules');

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
    <div className="min-h-screen" data-testid="pedagogie-page">
      <HubPageHeader
        title="Pédagogie"
        description="Gérez les emplois du temps, formations, cahiers de textes et classes virtuelles."
        icon={BookOpen}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <div className="p-3 sm:p-6 lg:p-8">
        <Suspense fallback={<TabFallback />}>
          {activeTab === 'schedules' && <ScheduleManagement />}
          {activeTab === 'textbooks' && <TextBooksList />}
          {activeTab === 'formations' && <FormationsList />}
          {activeTab === 'promotions' && <PromotionsList />}
          {activeTab === 'virtual-classes' && <VirtualClassesManagement />}
        </Suspense>
      </div>
    </div>
  );
};

export default Pedagogie;
