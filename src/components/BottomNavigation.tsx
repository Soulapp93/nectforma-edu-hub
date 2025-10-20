import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  FileText, 
  Settings,
  ClipboardCheck,
  Building,
  Clock,
  UsersRound
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  label: string;
}

const BottomNavigation = () => {
  const { userRole } = useCurrentUser();

  // Vérifier s'il y a un utilisateur démo
  const demoUser = sessionStorage.getItem('demo_user');
  let effectiveRole = userRole;

  if (demoUser) {
    const userData = JSON.parse(demoUser);
    effectiveRole = userData.role;
  }

  // Navigation pour AdminPrincipal
  const principalAdminNavigation: NavItem[] = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { name: 'Administration', href: '/administration', icon: Users, label: 'Administration' },
    { name: 'Formation', href: '/formations', icon: BookOpen, label: 'Formation' },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: Calendar, label: 'Emploi du temps' },
    { name: 'Messagerie', href: '/messagerie', icon: MessageSquare, label: 'Messagerie' },
  ];

  // Navigation pour Admin
  const adminNavigation: NavItem[] = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { name: 'Administration', href: '/administration', icon: Users, label: 'Administration' },
    { name: 'Formation', href: '/formations', icon: BookOpen, label: 'Formation' },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: Calendar, label: 'Emploi du temps' },
    { name: 'Messagerie', href: '/messagerie', icon: MessageSquare, label: 'Messagerie' },
  ];

  // Navigation pour tuteurs
  const tutorNavigation: NavItem[] = [
    { name: 'Formation', href: '/formations', icon: BookOpen, label: 'Formation' },
    { name: 'Suivi Émargement', href: '/suivi-emargement', icon: ClipboardCheck, label: 'Suivi' },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: Calendar, label: 'Emploi du temps' },
    { name: 'Mon Profil', href: '/compte', icon: Settings, label: 'Compte' },
  ];

  // Navigation pour formateurs et étudiants
  const limitedNavigation: NavItem[] = [
    { name: 'Formation', href: '/formations', icon: BookOpen, label: 'Formation' },
    { name: 'Suivi Émargement', href: '/suivi-emargement', icon: ClipboardCheck, label: 'Suivi' },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: Calendar, label: 'EDT' },
    { name: 'Groupes', href: '/groupes', icon: UsersRound, label: 'Groupes' },
    { name: 'Mon Profil', href: '/compte', icon: Settings, label: 'Compte' },
  ];

  // Sélectionner la navigation selon le rôle
  const navigation = effectiveRole === 'AdminPrincipal' 
    ? principalAdminNavigation 
    : effectiveRole === 'Admin' 
    ? adminNavigation 
    : effectiveRole === 'Tuteur'
    ? tutorNavigation
    : limitedNavigation;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg md:hidden safe-area-bottom">
      <div className="grid grid-cols-5 h-16">
        {navigation.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/dashboard'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-gray-500 hover:text-primary'
                }`
              }
            >
              <Icon className="h-6 w-6" strokeWidth={2} />
              <span className="text-[10px] leading-none">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
