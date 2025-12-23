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
  UsersRound,
  GraduationCap,
  CalendarDays,
  Mail,
  UserCircle,
  Building2,
  FileCheck
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
  useSidebar 
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
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

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
    { name: 'Gestion des formations', href: '/administration?tab=formations', icon: GraduationCap },
    { name: 'Cahiers de Texte', href: '/administration?tab=textbooks', icon: FileText },
    { name: 'Emplois du Temps', href: '/administration?tab=schedules', icon: CalendarDays },
    { name: 'Feuilles d\'émargement', href: '/administration?tab=attendance', icon: FileCheck }
  ];

  // Navigation pour AdminPrincipal
  const principalAdminNavigation: NavigationItem[] = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Administration', href: '/administration', icon: Users, subItems: administrationSubItems },
    { name: 'Formations', href: '/formations', icon: GraduationCap },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: CalendarDays },
    { name: 'Messagerie', href: '/messagerie', icon: Mail },
    { name: 'Groupes', href: '/groupes', icon: UsersRound },
    { name: 'Gestion du compte', href: '/gestion-etablissement', icon: Building2 },
    { name: 'Mon Profil', href: '/compte', icon: UserCircle }
  ];

  // Navigation pour Admin
  const adminNavigation: NavigationItem[] = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Administration', href: '/administration', icon: Users, subItems: administrationSubItems },
    { name: 'Formations', href: '/formations', icon: GraduationCap },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: CalendarDays },
    { name: 'Messagerie', href: '/messagerie', icon: Mail },
    { name: 'Groupes', href: '/groupes', icon: UsersRound },
    { name: 'Mon Profil', href: '/compte', icon: UserCircle }
  ];

  // Navigation pour tuteurs
  const tutorNavigation: NavigationItem[] = [
    { name: 'Formation Apprenti', href: '/formations', icon: GraduationCap },
    { name: 'Suivi Émargement', href: '/suivi-emargement', icon: FileCheck },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: CalendarDays },
    { name: 'Mon Profil', href: '/compte', icon: UserCircle }
  ];

  // Navigation pour formateurs et étudiants
  const limitedNavigation: NavigationItem[] = [
    { name: 'Formations', href: '/formations', icon: GraduationCap },
    { name: 'Suivi Émargement', href: '/suivi-emargement', icon: FileCheck },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: CalendarDays },
    { name: 'Messagerie', href: '/messagerie', icon: Mail },
    { name: 'Groupes', href: '/groupes', icon: UsersRound },
    { name: 'Mon Profil', href: '/compte', icon: UserCircle }
  ];

  const navigation = userRole === 'AdminPrincipal' 
    ? principalAdminNavigation 
    : userRole === 'Admin' 
      ? adminNavigation 
      : userRole === 'Tuteur' 
        ? tutorNavigation 
        : limitedNavigation;

  return (
    <SidebarWrapper 
      className={`${collapsed ? 'w-16' : 'w-72'} border-r-2 border-sidebar-border shadow-xl transition-all duration-300`}
      collapsible="icon"
      style={{
        background: 'linear-gradient(180deg, hsl(270 60% 98%), hsl(262 50% 96%))',
        boxShadow: '4px 0 24px rgba(139, 92, 246, 0.08)'
      }}
    >
      <SidebarHeader className="p-5 border-b border-sidebar-border">
        <div className="flex flex-col gap-4">
          {/* NECTFY Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-white font-bold text-xl font-display">N</span>
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-2xl font-bold text-primary font-display tracking-tight">NECTFY</h1>
              </div>
            )}
          </div>
          
          {/* Establishment Logo and Name */}
          {establishment && (
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} pt-3 border-t border-sidebar-border`}>
              {establishment.logo_url ? (
                <img 
                  src={establishment.logo_url} 
                  alt={establishment.name} 
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border-2 border-primary/20 shadow-sm" 
                />
              ) : (
                <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-violet-200">
                  <Building2 className="w-5 h-5 text-violet-600" />
                </div>
              )}
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-violet-700 truncate">{establishment.name}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        {/* User Profile */}
        <div className="px-3 py-4 mb-4 bg-violet-100 rounded-xl border border-violet-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-sm font-bold text-white">{userDisplayInfo.initials}</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-violet-700 truncate">{userDisplayInfo.name}</p>
                <p className="text-xs text-violet-500 font-medium">{userDisplayInfo.role}</p>
                {userDisplayInfo.relationInfo && (
                  <div className="text-xs text-violet-400 mt-0.5">
                    {userDisplayInfo.relationInfo.type === 'tutor' 
                      ? <span>🏢 {userDisplayInfo.relationInfo.name}</span> 
                      : <span>👨‍🎓 {userDisplayInfo.relationInfo.name}</span>
                    }
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-violet-400 px-3 py-2 text-xs font-bold uppercase tracking-wider">
            {!collapsed ? 'Navigation' : ''}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigation.map(item => {
                const Icon = item.icon;
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isAdminRoute = location.pathname === '/administration';

                if (hasSubItems) {
                  return (
                    <SidebarMenuItem key={item.name}>
                      <div>
                        <button 
                          onClick={() => setAdminExpanded(!adminExpanded)} 
                          className={`flex items-center justify-between w-full px-3 py-3 text-base font-semibold rounded-xl transition-all duration-200 ${
                            isAdminRoute 
                              ? 'bg-primary text-white shadow-md' 
                              : 'text-violet-600 hover:bg-violet-100 hover:shadow-sm'
                          }`}
                          title={collapsed ? item.name : undefined}
                        >
                          <div className="flex items-center">
                            <Icon className={`${collapsed ? 'mx-auto' : 'mr-3'} h-5 w-5 flex-shrink-0`} strokeWidth={2.5} />
                            {!collapsed && <span>{item.name}</span>}
                          </div>
                          {!collapsed && (
                            adminExpanded 
                              ? <ChevronDown className="h-4 w-4" /> 
                              : <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        
                        {!collapsed && adminExpanded && (
                          <div className="ml-4 mt-2 space-y-1 border-l-2 border-violet-200 pl-3">
                            {item.subItems?.map(subItem => {
                              const SubIcon = subItem.icon;
                              const searchParams = new URLSearchParams(subItem.href.split('?')[1]);
                              const tabParam = searchParams.get('tab');
                              const currentTab = new URLSearchParams(location.search).get('tab');
                              const isSubActive = isAdminRoute && currentTab === tabParam;
                              
                              return (
                                <NavLink 
                                  key={subItem.name} 
                                  to={subItem.href} 
                              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                                    isSubActive 
                                      ? 'bg-violet-100 text-violet-700 border border-violet-300' 
                                      : 'text-violet-600 hover:bg-violet-50 hover:text-violet-700'
                                  }`}
                                >
                                  <SubIcon className="mr-3 h-4 w-4 flex-shrink-0" strokeWidth={2} />
                                  <span>{subItem.name}</span>
                                </NavLink>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </SidebarMenuItem>
                  );
                }

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
                          `flex items-center justify-between px-3 py-3 text-base font-semibold rounded-xl transition-all duration-200 ${
                            isActive 
                              ? 'bg-primary text-white shadow-md' 
                              : 'text-violet-600 hover:bg-violet-100 hover:shadow-sm'
                          }`
                        }
                        title={collapsed ? item.name : undefined}
                      >
                        <div className="flex items-center">
                          <Icon className={`${collapsed ? 'mx-auto' : 'mr-3'} h-5 w-5 flex-shrink-0`} strokeWidth={2.5} />
                          {!collapsed && <span>{item.name}</span>}
                        </div>
                        {badgeCount > 0 && !collapsed && (
                          <Badge className="ml-auto bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 text-xs min-w-[22px] h-5 flex items-center justify-center shadow-sm border-0">
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </Badge>
                        )}
                        {badgeCount > 0 && collapsed && (
                          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-sm">
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

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <button 
          onClick={handleLogout} 
          className="flex items-center px-3 py-3 text-base font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 w-full group"
          title={collapsed ? 'Déconnexion' : undefined}
        >
          <LogOut className={`${collapsed ? 'mx-auto' : 'mr-3'} h-5 w-5 flex-shrink-0 group-hover:rotate-12 transition-transform`} strokeWidth={2.5} />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </SidebarFooter>
    </SidebarWrapper>
  );
};

export default Sidebar;
