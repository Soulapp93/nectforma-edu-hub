import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, BookOpen, Calendar, MessageSquare, FileText, 
  Settings, LogOut, ClipboardCheck, Building, ChevronDown, ChevronRight, 
  Clock, UsersRound, PanelLeftClose, PanelLeft 
} from 'lucide-react';
import { 
  Sidebar as SidebarWrapper, SidebarContent, SidebarGroup, SidebarGroupContent, 
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, 
  SidebarHeader, SidebarFooter, useSidebar 
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser, useUserWithRelations } from '@/hooks/useCurrentUser';
import { useEstablishment } from '@/hooks/useEstablishment';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  subItems?: NavigationItem[];
}

const Sidebar = () => {
  const { state, toggleSidebar } = useSidebar();
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
    { name: 'Gestion des utilisateurs', href: '/administration?tab=users', icon: Users },
    { name: 'Gestion des formations', href: '/administration?tab=formations', icon: BookOpen },
    { name: 'Gestion des Cahiers de Texte', href: '/administration?tab=textbooks', icon: FileText },
    { name: 'Gestion des Emplois du Temps', href: '/administration?tab=schedules', icon: Clock },
    { name: 'Feuilles d\'émargement', href: '/administration?tab=attendance', icon: ClipboardCheck }
  ];

  const principalAdminNavigation: NavigationItem[] = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Administration', href: '/administration', icon: Users, subItems: administrationSubItems },
    { name: 'Formation', href: '/formations', icon: BookOpen },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: Calendar },
    { name: 'Messagerie', href: '/messagerie', icon: MessageSquare },
    { name: 'Groupes', href: '/groupes', icon: UsersRound },
    { name: 'Gestion du compte', href: '/gestion-etablissement', icon: Building },
    { name: 'Mon Profil', href: '/compte', icon: Settings }
  ];

  const adminNavigation: NavigationItem[] = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Administration', href: '/administration', icon: Users, subItems: administrationSubItems },
    { name: 'Formation', href: '/formations', icon: BookOpen },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: Calendar },
    { name: 'Messagerie', href: '/messagerie', icon: MessageSquare },
    { name: 'Groupes', href: '/groupes', icon: UsersRound },
    { name: 'Mon Profil', href: '/compte', icon: Settings }
  ];

  const tutorNavigation: NavigationItem[] = [
    { name: 'Formation Apprenti', href: '/formations', icon: BookOpen },
    { name: 'Suivi Émargement Apprenti', href: '/suivi-emargement', icon: ClipboardCheck },
    { name: 'Emploi du temps Apprenti', href: '/emploi-temps', icon: Calendar },
    { name: 'Mon Profil', href: '/compte', icon: Settings }
  ];

  const limitedNavigation: NavigationItem[] = [
    { name: 'Formation', href: '/formations', icon: BookOpen },
    { name: 'Suivi Émargement', href: '/suivi-emargement', icon: ClipboardCheck },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: Calendar },
    { name: 'Messagerie', href: '/messagerie', icon: MessageSquare },
    { name: 'Groupes', href: '/groupes', icon: UsersRound },
    { name: 'Mon Profil', href: '/compte', icon: Settings }
  ];

  const navigation = userRole === 'AdminPrincipal' 
    ? principalAdminNavigation 
    : userRole === 'Admin' 
    ? adminNavigation 
    : userRole === 'Tuteur' 
    ? tutorNavigation 
    : limitedNavigation;

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarWrapper 
        className={`${collapsed ? 'w-[72px]' : 'w-72'} text-white shadow-2xl transition-all duration-300 ease-in-out border-r-0`} 
        collapsible="icon"
        style={{
          background: 'linear-gradient(180deg, hsl(262, 83%, 55%) 0%, hsl(270, 70%, 45%) 100%)'
        }}
      >
        {/* Header */}
        <SidebarHeader className={`${collapsed ? 'p-3' : 'p-5'} transition-all duration-300`}>
          <div className="flex flex-col gap-4">
            {/* Logo + Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
                  <span className="text-primary font-black text-lg tracking-tight">N</span>
                </div>
                {!collapsed && (
                  <h1 className="text-xl font-bold tracking-wide text-white">NECTFY</h1>
                )}
              </div>
              
              {/* Bouton Toggle Moderne */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-200 hover:scale-105"
              >
                {collapsed ? (
                  <PanelLeft className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Establishment */}
            {establishment && (
              <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} pt-4 border-t border-white/15`}>
                {establishment.logo_url ? (
                  <img 
                    src={establishment.logo_url} 
                    alt={establishment.name} 
                    className="w-10 h-10 rounded-xl object-cover flex-shrink-0 bg-white shadow-md" 
                  />
                ) : (
                  <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                )}
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{establishment.name}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="px-3 py-4">
          {/* User Profile Card */}
          <div className={`mb-6 p-3 rounded-2xl bg-white/10 backdrop-blur-sm ${collapsed ? 'flex justify-center' : ''}`}>
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-white/30 to-white/10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
                <span className="text-sm font-bold text-white">{userDisplayInfo.initials}</span>
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{userDisplayInfo.name}</p>
                  <p className="text-xs text-white/60 font-medium">{userDisplayInfo.role}</p>
                  {userDisplayInfo.relationInfo && (
                    <div className="text-xs text-white/50 mt-0.5">
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
            {!collapsed && (
              <SidebarGroupLabel className="text-white/50 px-3 py-2 text-xs font-semibold uppercase tracking-wider">
                Navigation
              </SidebarGroupLabel>
            )}
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
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button 
                                onClick={() => setAdminExpanded(!adminExpanded)} 
                                className={`flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                                  isAdminRoute 
                                    ? 'bg-white/20 text-white shadow-lg shadow-black/10' 
                                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                    isAdminRoute ? 'bg-white/20' : 'bg-white/5'
                                  }`}>
                                    <Icon className="h-[18px] w-[18px]" />
                                  </div>
                                  {!collapsed && <span className="font-medium">{item.name}</span>}
                                </div>
                                {!collapsed && (
                                  <div className={`transition-transform duration-200 ${adminExpanded ? 'rotate-180' : ''}`}>
                                    <ChevronDown className="h-4 w-4 text-white/60" />
                                  </div>
                                )}
                              </button>
                            </TooltipTrigger>
                            {collapsed && (
                              <TooltipContent side="right" className="font-medium">
                                {item.name}
                              </TooltipContent>
                            )}
                          </Tooltip>
                          
                          {!collapsed && adminExpanded && (
                            <div className="ml-4 mt-2 space-y-1 border-l-2 border-white/20 pl-4">
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
                                    className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                                      isSubActive 
                                        ? 'bg-white/15 text-white font-medium' 
                                        : 'text-white/60 hover:bg-white/10 hover:text-white'
                                    }`}
                                  >
                                    <SubIcon className="h-4 w-4 flex-shrink-0" />
                                    <span className="text-xs font-medium">{subItem.name}</span>
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <NavLink 
                              to={item.href} 
                              end={item.href === '/' || item.href === '/dashboard'} 
                              className={({ isActive }) => 
                                `flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group relative ${
                                  isActive 
                                    ? 'bg-white/20 text-white shadow-lg shadow-black/10' 
                                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                                }`
                              }
                            >
                              {({ isActive }) => (
                                <>
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                      isActive ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'
                                    }`}>
                                      <Icon className="h-[18px] w-[18px]" />
                                    </div>
                                    {!collapsed && <span className="font-medium">{item.name}</span>}
                                  </div>
                                  {badgeCount > 0 && !collapsed && (
                                    <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 text-xs min-w-[22px] h-5 px-1.5 flex items-center justify-center rounded-full font-bold shadow-lg">
                                      {badgeCount > 99 ? '99+' : badgeCount}
                                    </Badge>
                                  )}
                                  {badgeCount > 0 && collapsed && (
                                    <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                                      {badgeCount > 99 ? '99+' : badgeCount}
                                    </span>
                                  )}
                                </>
                              )}
                            </NavLink>
                          </TooltipTrigger>
                          {collapsed && (
                            <TooltipContent side="right" className="font-medium">
                              {item.name}
                              {badgeCount > 0 && ` (${badgeCount})`}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-3 border-t border-white/10">
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-red-500/20 hover:text-red-200 rounded-xl transition-all duration-200 w-full group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-red-500/30 flex items-center justify-center transition-all">
                  <LogOut className="h-[18px] w-[18px]" />
                </div>
                {!collapsed && <span className="font-medium">Déconnexion</span>}
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="font-medium">
                Déconnexion
              </TooltipContent>
            )}
          </Tooltip>
        </SidebarFooter>
      </SidebarWrapper>
    </TooltipProvider>
  );
};

export default Sidebar;