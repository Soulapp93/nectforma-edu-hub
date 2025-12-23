import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  FileText, 
  Settings,
  LogOut,
  ClipboardCheck,
  Building,
  ChevronDown,
  ChevronRight,
  Clock,
  UsersRound
} from 'lucide-react';
import {
  Sidebar as SidebarWrapper,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser, useUserWithRelations } from '@/hooks/useCurrentUser';
import { useEstablishment } from '@/hooks/useEstablishment';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { supabase } from '@/integrations/supabase/client';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  subItems?: NavigationItem[];
}

const Sidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { userRole, userId } = useCurrentUser();
  const { userInfo, relationInfo } = useUserWithRelations();
  const { establishment } = useEstablishment();
  const { counts: unreadCounts } = useUnreadMessages();
  const location = useLocation();
  const [adminExpanded, setAdminExpanded] = useState(location.pathname === '/administration');

  const handleLogout = async () => {
    // Déconnexion Supabase
    await supabase.auth.signOut();
    
    // Rediriger vers la page d'authentification
    window.location.href = '/auth';
  };

  // Obtenir les informations utilisateur pour l'affichage
  const getUserDisplayInfo = () => {
    if (userInfo) {
      return {
        name: `${userInfo.first_name} ${userInfo.last_name}`,
        role: userRole || 'Utilisateur',
        initials: `${userInfo.first_name?.[0] || ''}${userInfo.last_name?.[0] || ''}`.toUpperCase() || 'U',
        relationInfo
      };
    }
    
    return {
      name: 'Utilisateur',
      role: userRole || 'Utilisateur',
      initials: 'U',
      relationInfo: null
    };
  };

  const userDisplayInfo = getUserDisplayInfo();
  
  // Sous-onglets de l'administration
  const administrationSubItems = [
    { name: 'Gestion des utilisateurs', href: '/administration?tab=users', icon: Users },
    { name: 'Gestion des formations', href: '/administration?tab=formations', icon: BookOpen },
    { name: 'Gestion des Cahiers de Texte', href: '/administration?tab=textbooks', icon: FileText },
    { name: 'Gestion des Emplois du Temps', href: '/administration?tab=schedules', icon: Clock },
    { name: 'Feuilles d\'émargement', href: '/administration?tab=attendance', icon: ClipboardCheck },
  ];
  
  // Navigation pour AdminPrincipal uniquement (avec gestion établissement et profil séparés)
  const principalAdminNavigation: NavigationItem[] = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Administration', href: '/administration', icon: Users, subItems: administrationSubItems },
    { name: 'Formation', href: '/formations', icon: BookOpen },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: Calendar },
    { name: 'Messagerie', href: '/messagerie', icon: MessageSquare },
    { name: 'Groupes', href: '/groupes', icon: UsersRound },
    { name: 'Gestion du compte', href: '/gestion-etablissement', icon: Building },
    { name: 'Mon Profil', href: '/compte', icon: Settings },
  ];

  // Navigation pour Admin (SANS gestion du compte - réservé à AdminPrincipal)
  const adminNavigation: NavigationItem[] = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Administration', href: '/administration', icon: Users, subItems: administrationSubItems },
    { name: 'Formation', href: '/formations', icon: BookOpen },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: Calendar },
    { name: 'Messagerie', href: '/messagerie', icon: MessageSquare },
    { name: 'Groupes', href: '/groupes', icon: UsersRound },
    { name: 'Mon Profil', href: '/compte', icon: Settings },
  ];

  // Navigation pour tuteurs (4 onglets - vue apprenti uniquement, pas de tableau de bord)
  const tutorNavigation: NavigationItem[] = [
    { name: 'Formation Apprenti', href: '/formations', icon: BookOpen },
    { name: 'Suivi Émargement Apprenti', href: '/suivi-emargement', icon: ClipboardCheck },
    { name: 'Emploi du temps Apprenti', href: '/emploi-temps', icon: Calendar },
    { name: 'Mon Profil', href: '/compte', icon: Settings },
  ];

  // Navigation pour les formateurs et étudiants (avec profil)
  const limitedNavigation: NavigationItem[] = [
    { name: 'Formation', href: '/formations', icon: BookOpen },
    { name: 'Suivi Émargement', href: '/suivi-emargement', icon: ClipboardCheck },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: Calendar },
    { name: 'Messagerie', href: '/messagerie', icon: MessageSquare },
    { name: 'Groupes', href: '/groupes', icon: UsersRound },
    { name: 'Mon Profil', href: '/compte', icon: Settings },
  ];

  // Sélectionner la navigation selon le rôle
  const navigation = userRole === 'AdminPrincipal' 
    ? principalAdminNavigation 
    : userRole === 'Admin' 
    ? adminNavigation 
    : userRole === 'Tuteur'
    ? tutorNavigation
    : limitedNavigation;

  return (
    <SidebarWrapper 
      className={`${collapsed ? 'w-16' : 'w-64'} nect-gradient sidebar-glow text-white shadow-2xl transition-all duration-300 overflow-hidden`}
      collapsible="icon"
    >
      {/* Header with Logo */}
      <SidebarHeader className="relative z-10 px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          {/* Logo Container with glow effect */}
          <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-violet-600 to-purple-600 font-bold text-xl">NF</span>
          </div>
          {!collapsed && (
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-white tracking-wide">NECTFORMA</h1>
              {/* Collapse chevron */}
              <ChevronRight className="ml-auto h-4 w-4 text-white/60" />
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="relative z-10">
        {/* User Profile Card */}
        <div className="mx-4 mb-6 p-3 rounded-xl bg-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 border border-white/30">
              <span className="text-sm font-semibold text-white">{userDisplayInfo.initials}</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{userDisplayInfo.name}</p>
                <p className="text-xs text-white/70">{userDisplayInfo.role}</p>
                {userDisplayInfo.relationInfo && (
                  <p className="text-xs text-white/60 mt-0.5 truncate">
                    {userDisplayInfo.relationInfo.type === 'tutor' 
                      ? `🏢 ${userDisplayInfo.relationInfo.name}`
                      : `👨‍🎓 ${userDisplayInfo.relationInfo.name}`
                    }
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="px-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isAdminRoute = location.pathname === '/administration';
                
                if (hasSubItems) {
                  return (
                    <SidebarMenuItem key={item.name}>
                      <div>
                        <button
                          onClick={() => setAdminExpanded(!adminExpanded)}
                          className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                            isAdminRoute
                              ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                              : 'text-white/90 hover:bg-white/10'
                          }`}
                          title={collapsed ? item.name : undefined}
                        >
                          <div className="flex items-center">
                            <Icon className={`${collapsed ? 'mx-auto' : 'mr-3'} h-5 w-5 flex-shrink-0`} />
                            {!collapsed && <span>{item.name}</span>}
                          </div>
                          {!collapsed && (
                            adminExpanded ? 
                              <ChevronDown className="h-4 w-4 text-white/70" /> : 
                              <ChevronRight className="h-4 w-4 text-white/70" />
                          )}
                        </button>
                        
                        {!collapsed && adminExpanded && (
                          <div className="ml-6 mt-1 space-y-0.5">
                            {item.subItems.map((subItem) => {
                              const SubIcon = subItem.icon;
                              const searchParams = new URLSearchParams(subItem.href.split('?')[1]);
                              const tabParam = searchParams.get('tab');
                              const currentTab = new URLSearchParams(location.search).get('tab');
                              const isSubActive = isAdminRoute && currentTab === tabParam;
                              
                              return (
                                <NavLink
                                  key={subItem.name}
                                  to={subItem.href}
                                  className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                                    isSubActive
                                      ? 'bg-white/15 text-white font-medium'
                                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                                  }`}
                                >
                                  <SubIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                                  <span className="text-xs">{subItem.name}</span>
                                </NavLink>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </SidebarMenuItem>
                  );
                }
                
                // Déterminer le badge pour cet item
                const getBadgeCount = () => {
                  if (item.href === '/messagerie') return unreadCounts.messagerie;
                  if (item.href === '/groupes') return unreadCounts.groupes;
                  return 0;
                };
                const badgeCount = getBadgeCount();
                
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.href}
                        end={item.href === '/' || item.href === '/dashboard'}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                            isActive
                              ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                              : 'text-white/90 hover:bg-white/10'
                          }`
                        }
                        title={collapsed ? item.name : undefined}
                      >
                        <div className="flex items-center">
                          <Icon className={`${collapsed ? 'mx-auto' : 'mr-3'} h-5 w-5 flex-shrink-0`} />
                          {!collapsed && <span>{item.name}</span>}
                        </div>
                        {badgeCount > 0 && !collapsed && (
                          <Badge 
                            className="ml-auto bg-emerald-500 text-white hover:bg-emerald-600 text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full"
                          >
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </Badge>
                        )}
                        {badgeCount > 0 && collapsed && (
                          <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] min-w-[16px] h-4 rounded-full flex items-center justify-center">
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="relative z-10 p-4 border-t border-white/10">
        <button 
          onClick={handleLogout}
          className="flex items-center px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white rounded-xl transition-all duration-200 w-full"
          title={collapsed ? 'Déconnexion' : undefined}
        >
          <LogOut className={`${collapsed ? 'mx-auto' : 'mr-3'} h-5 w-5 flex-shrink-0`} />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </SidebarFooter>
    </SidebarWrapper>
  );
};

export default Sidebar;
