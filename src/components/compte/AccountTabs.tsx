
import React from 'react';
import { User, Building } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface Tab {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
}

interface AccountTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const AccountTabs: React.FC<AccountTabsProps> = ({ activeTab, onTabChange }) => {
  const { userRole } = useCurrentUser();
  
  // Tabs pour l'administrateur principal seulement
  const principalAdminTabs: Tab[] = [
    { id: 'establishment', name: 'Établissement', icon: Building },
  ];
  
  // Tabs pour tous les autres utilisateurs (formateur, étudiant)
  const regularUserTabs: Tab[] = [
    { id: 'profile', name: 'Profil', icon: User },
  ];
  
  // Déterminer quels onglets afficher selon le rôle
  // AdminPrincipal = accès à l'établissement (gestion du compte)
  // Tous les autres (Admin, Formateur, Étudiant) = accès au profil
  const tabs = userRole === 'AdminPrincipal' 
    ? principalAdminTabs 
    : regularUserTabs;

  // Si aucun onglet disponible, ne rien afficher
  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="lg:w-64">
      <nav className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors mb-2 ${
                activeTab === tab.id
                  ? 'bg-purple-50 text-purple-600 border-purple-200'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-5 w-5 mr-3" />
              {tab.name}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default AccountTabs;
