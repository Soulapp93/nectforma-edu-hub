import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Users, GraduationCap, BookOpen, Calendar, ClipboardCheck } from 'lucide-react';
import EnhancedUsersList from '../components/administration/EnhancedUsersList';
import FormationsList from '../components/administration/FormationsList';
import TextBooksList from '../components/administration/TextBooksList';
import ScheduleManagement from '../components/administration/ScheduleManagement';
import AttendanceManagement from '../components/administration/AttendanceManagement';

const Administration = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['users', 'formations', 'textbooks', 'schedules', 'attendance'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/administration?tab=${tab}`);
  };

  const tabs = [
    { id: 'users', label: 'Gestion des Utilisateurs', icon: Users },
    { id: 'formations', label: 'Gestion des Formations', icon: GraduationCap },
    { id: 'textbooks', label: 'Cahiers de Texte', icon: BookOpen },
    { id: 'schedules', label: 'Emplois du Temps', icon: Calendar },
    { id: 'attendance', label: 'Émargement', icon: ClipboardCheck },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="mb-6 sm:mb-8 lg:mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 sm:mb-3">Administration</h1>
        <p className="text-base sm:text-lg text-muted-foreground">Gérez les utilisateurs, formations, rôles et emplois du temps de la plateforme.</p>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6">
        <div className="border-b border-border">
          <nav className="flex space-x-2 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {activeTab === 'users' && <EnhancedUsersList />}

      {activeTab === 'formations' && <FormationsList />}

      {activeTab === 'textbooks' && <TextBooksList />}

      {activeTab === 'schedules' && <ScheduleManagement />}

      {activeTab === 'attendance' && <AttendanceManagement />}

      {activeTab !== 'users' && activeTab !== 'formations' && activeTab !== 'textbooks' && activeTab !== 'schedules' && activeTab !== 'attendance' && (
        <div className="glass-card rounded-xl p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="h-8 w-8 text-primary">📋</div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Section en développement
            </h3>
            <p className="text-muted-foreground">
              Cette section sera développée prochainement. Restez connecté pour découvrir toutes les fonctionnalités.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Administration;
