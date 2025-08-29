
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  FileText, 
  Calendar1, 
  Settings,
  LogOut,
  Monitor
} from 'lucide-react';

const Sidebar = () => {
  const navigation = [
    { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
    { name: 'Administration', href: '/administration', icon: Users },
    { name: 'Formation', href: '/formations', icon: BookOpen },
    { name: 'E-Learning', href: '/e-learning', icon: Monitor },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: Calendar },
    { name: 'Messagerie', href: '/messagerie', icon: MessageSquare },
    { name: 'Émargement', href: '/emargement', icon: FileText },
    { name: 'Événements', href: '/evenements', icon: Calendar1 },
    { name: 'Coffre-fort', href: '/coffre-fort', icon: FileText },
    { name: 'Gestion du compte', href: '/compte', icon: Settings },
  ];

  return (
    <div className="h-full w-64 bg-gradient-to-b from-purple-600 to-purple-800 text-white shadow-2xl">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <span className="text-purple-600 font-bold text-lg">NF</span>
          </div>
          <div>
            <h1 className="text-xl font-bold">NECTFORMA</h1>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="px-6 py-4 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">AN</span>
          </div>
          <div>
            <p className="text-sm font-medium">Admin Nect</p>
            <p className="text-xs text-white/70">Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/20">
        <button className="flex items-center px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-colors w-full">
          <LogOut className="mr-3 h-5 w-5" />
          Déconnexion
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
