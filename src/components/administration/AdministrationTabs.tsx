
import React from 'react';
import { Users, BookOpen, Clock, FileText, ClipboardCheck } from 'lucide-react';

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
    { id: 'attendance', name: 'Feuilles d\'émargement', icon: ClipboardCheck },
  ];

  return (
    <div className="mb-8">
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
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
