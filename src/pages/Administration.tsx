import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdministrationTabs from '../components/administration/AdministrationTabs';
import EnhancedUsersList from '../components/administration/EnhancedUsersList';
import FormationsList from '../components/administration/FormationsList';
import TextBooksList from '../components/administration/TextBooksList';
import SimpleScheduleManagement from '../components/administration/SimpleScheduleManagement';
import AttendanceManagement from '../components/administration/AttendanceManagement';

const Administration = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['users', 'formations', 'textbooks', 'schedules', 'attendance'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Administration</h1>
        <p className="text-gray-600">Gérez les utilisateurs, formations, rôles et emplois du temps de la plateforme.</p>
      </div>

      <AdministrationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'users' && <EnhancedUsersList />}

      {activeTab === 'formations' && <FormationsList />}

      {activeTab === 'textbooks' && <TextBooksList />}

      {activeTab === 'schedules' && <SimpleScheduleManagement />}

      {activeTab === 'attendance' && <AttendanceManagement />}

      {activeTab !== 'users' && activeTab !== 'formations' && activeTab !== 'textbooks' && activeTab !== 'schedules' && activeTab !== 'attendance' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="h-8 w-8 text-purple-600">📋</div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Section en développement
            </h3>
            <p className="text-gray-600">
              Cette section sera développée prochainement. Restez connecté pour découvrir toutes les fonctionnalités.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Administration;
