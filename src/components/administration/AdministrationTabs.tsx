
import React from 'react';
import { Users, BookOpen, Shield, Clock, FileText, CalendarDays } from 'lucide-react';

interface Tab {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
}

interface AdministrationTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const AdministrationTabs: React.FC<AdministrationTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs: Tab[] = [
    { id: 'users', name: 'Gestion des utilisateurs', icon: Users },
    { id: 'formations', name: 'Gestion des formations', icon: BookOpen },
    { id: 'textbooks', name: 'Gestion des Cahiers de Texte', icon: FileText },
    { id: 'schedules', name: 'Gestion des Emplois du Temps', icon: Clock },
    { id: 'emploi-du-temps', name: 'Emploi du Temps', icon: CalendarDays },
    { id: 'roles', name: 'Gestion des rôles', icon: Shield },
  ];

  return (
    <div className="mb-8">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AdministrationTabs;
