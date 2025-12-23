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
  
  const administrationSubItems = [
    { name: 'Utilisateurs', href: '/administration?tab=users', icon: Users },
    { name: 'Formations', href: '/administration?tab=formations', icon: BookOpen },
    { name: 'Cahiers de Texte', href: '/administration?tab=textbooks', icon: FileText },
    { name: 'Emplois du Temps', href: '/administration?tab=schedules', icon: Clock },
    { name: 'Émargement', href: '/administration?tab=attendance', icon: ClipboardCheck },
  ];
  
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

  const adminNavigation: NavigationItem[] = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Administration', href: '/administration', icon: Users, subItems: administrationSubItems },
    { name: 'Formation', href: '/formations', icon: BookOpen },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: Calendar },
    { name: 'Messagerie', href: '/messagerie', icon: MessageSquare },
    { name: 'Groupes', href: '/groupes', icon: UsersRound },
    { name: 'Mon Profil', href: '/compte', icon: Settings },
  ];

  const tutorNavigation: NavigationItem[] = [
    { name: 'Formation Apprenti', href: '/formations', icon: BookOpen },
    { name: 'Suivi Émargement', href: '/suivi-emargement', icon: ClipboardCheck },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: Calendar },
    { name: 'Mon Profil', href: '/compte', icon: Settings },
  ];

  const limitedNavigation: NavigationItem[] = [
    { name: 'Formation', href: '/formations', icon: BookOpen },
    { name: 'Suivi Émargement', href: '/suivi-emargement', icon: ClipboardCheck },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: Calendar },
    { name: 'Messagerie', href: '/messagerie', icon: MessageSquare },
    { name: 'Groupes', href: '/groupes', icon: UsersRound },
    { name: 'Mon Profil', href: '/compte', icon: Settings },
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
      className={`${collapsed ? 'w-16' : 'w-72'} bg-background border-r border-border/40 transition-all duration-300 ease-in-out`}
      collapsible="icon"
    >
      {/* Header avec logo NECTFY */}
      <SidebarHeader className="px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-bold text-lg">N</span>
          </div>
          {!collapsed && (
            <span className="text-xl font-semibold tracking-tight text-foreground">NECTFY</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        {/* Établissement */}
        {establishment && (
          <div className={`mx-3 mb-6 p-3 rounded-xl bg-muted/50 ${collapsed ? 'flex justify-center' : ''}`}>
            <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
              {establishment.logo_url ? (
                <img 
                  src={establishment.logo_url} 
                  alt={establishment.name}
                  className="w-9 h-9 rounded-lg object-cover bg-background shadow-sm"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center shadow-sm">
                  <Building className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              {!collapsed && (
                <p className="text-sm font-medium text-foreground truncate">{establishment.name}</p>
              )}
            </div>
          </div>
        )}

        {/* Profil utilisateur */}
        <div className={`mx-3 mb-6 ${collapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">{userDisplayInfo.initials}</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{userDisplayInfo.name}</p>
                <p className="text-xs text-muted-foreground">{userDisplayInfo.role}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Menu
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
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
                          className={`flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                            isAdminRoute
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                          title={collapsed ? item.name : undefined}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            {!collapsed && <span>{item.name}</span>}
                          </div>
                          {!collapsed && (
                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${adminExpanded ? '' : '-rotate-90'}`} />
                          )}
                        </button>
                        
                        {!collapsed && adminExpanded && (
                          <div className="mt-1 ml-4 pl-4 border-l border-border/40 space-y-1">
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
                                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                                    isSubActive
                                      ? 'text-primary font-medium'
                                      : 'text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  <SubIcon className="h-4 w-4 flex-shrink-0" />
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
                          `flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`
                        }
                        title={collapsed ? item.name : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          {!collapsed && <span>{item.name}</span>}
                        </div>
                        {badgeCount > 0 && !collapsed && (
                          <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </Badge>
                        )}
                        {badgeCount > 0 && collapsed && (
                          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
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

      <SidebarFooter className="p-3 mt-auto">
        <div className="border-t border-border/40 pt-4">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-200 w-full"
            title={collapsed ? 'Déconnexion' : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </SidebarFooter>
    </SidebarWrapper>
  );
};

export default Sidebar;