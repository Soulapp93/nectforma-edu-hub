import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import EnhancedUsersList from '../components/administration/EnhancedUsersList';
import FormationsList from '../components/administration/FormationsList';
import TextBooksList from '../components/administration/TextBooksList';
import ScheduleManagement from '../components/administration/ScheduleManagement';
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

  const getPageTitle = () => {
    switch (activeTab) {
      case 'users': return 'Gestion des Utilisateurs';
      case 'formations': return 'Gestion des Formations';
      case 'textbooks': return 'Gestion des Cahiers de Texte';
      case 'schedules': return 'Gestion des Emplois du Temps';
      case 'attendance': return 'Feuilles d\'émargement';
      default: return 'Administration';
    }
  };

  const getPageDescription = () => {
    switch (activeTab) {
      case 'users': return 'Gérez les comptes utilisateurs de la plateforme.';
      case 'formations': return 'Créez et gérez les formations proposées.';
      case 'textbooks': return 'Consultez et gérez les cahiers de texte.';
      case 'schedules': return 'Organisez les emplois du temps des formations.';
      case 'attendance': return 'Validez et gérez les feuilles d\'émargement.';
      default: return 'Gérez les utilisateurs, formations, rôles et emplois du temps de la plateforme.';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen gradient-surface">
      <div className="page-header">
        <h1 className="page-title">{getPageTitle()}</h1>
        <p className="page-description">{getPageDescription()}</p>
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
