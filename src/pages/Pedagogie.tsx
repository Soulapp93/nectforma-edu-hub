import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarClock, BookText, GraduationCap, UsersRound, Video, BookOpen } from 'lucide-react';
import HubPageHeader, { HubTab } from '../components/HubPageHeader';

const ScheduleManagement = React.lazy(() => import('../components/administration/ScheduleManagement'));
const TextBooksList = React.lazy(() => import('../components/administration/TextBooksList'));
const FormationsList = React.lazy(() => import('../components/administration/FormationsList'));
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
          {activeTab === 'promotions' && (
            <div className="glass-card rounded-xl p-6 sm:p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UsersRound className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Gestion des promotions</h3>
                <p className="text-sm text-muted-foreground">Cette section sera disponible prochainement.</p>
              </div>
            </div>
          )}
          {activeTab === 'virtual-classes' && <VirtualClassesManagement />}
        </Suspense>
      </div>
    </div>
  );
};

export default Pedagogie;
