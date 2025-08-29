
import React from 'react';
import { User, Mail, Phone, MapPin, Lock, Bell, Shield, CreditCard, Users, Building } from 'lucide-react';

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
  const tabs: Tab[] = [
    { id: 'profile', name: 'Profil', icon: User },
    { id: 'establishment', name: 'Établissement', icon: Building },
    { id: 'security', name: 'Sécurité', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'subscription', name: 'Abonnement', icon: CreditCard },
    { id: 'team', name: 'Équipe', icon: Users },
  ];

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
