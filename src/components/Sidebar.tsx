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
import { useCurrentUser, useUserWithRelations } from '@/hooks/useCurrentUser';
import { useEstablishment } from '@/hooks/useEstablishment';
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

  // Navigation pour tuteurs (limitée - 4 onglets uniquement)
  const tutorNavigation: NavigationItem[] = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Formation', href: '/formations', icon: BookOpen },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: Calendar },
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
      className={`${collapsed ? 'w-16' : 'w-64'} nect-gradient text-primary-foreground shadow-xl transition-all duration-300 bg-opacity-100`}
      collapsible="icon"
      style={{ backgroundColor: 'hsl(var(--nect-purple-from))' }}
    >
      <SidebarHeader className="p-6">
        <div className="flex flex-col gap-4">
          {/* NECTFY Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-foreground rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-lg">N</span>
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-xl font-bold text-primary-foreground">NECTFY</h1>
              </div>
            )}
          </div>
          
          {/* Establishment Logo and Name */}
          {establishment && (
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} pt-2 border-t border-primary-foreground/20`}>
              {establishment.logo_url ? (
                <img 
                  src={establishment.logo_url} 
                  alt={establishment.name}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-white"
                />
              ) : (
                <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary-foreground truncate">{establishment.name}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* User Profile */}
        <div className="px-6 py-4 border-b border-primary-foreground/20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-primary-foreground">{userDisplayInfo.initials}</span>
            </div>
            {!collapsed && (
              <div className="flex-1">
                <p className="text-sm font-medium text-primary-foreground">{userDisplayInfo.name}</p>
                <p className="text-xs text-primary-foreground/70">{userDisplayInfo.role}</p>
                {userDisplayInfo.relationInfo && (
                  <div className="text-xs text-primary-foreground/60 mt-1">
                    {userDisplayInfo.relationInfo.type === 'tutor' ? (
                      <span>🏢 Tuteur: {userDisplayInfo.relationInfo.name}</span>
                    ) : (
                      <span>👨‍🎓 Apprenti: {userDisplayInfo.relationInfo.name}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-primary-foreground/70 px-4 py-2">
            {!collapsed ? 'Navigation' : ''}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-4 space-y-1">
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
                          className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            isAdminRoute
                              ? 'nect-glass text-primary-foreground'
                              : 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground'
                          }`}
                          title={collapsed ? item.name : undefined}
                        >
                          <div className="flex items-center">
                            <Icon className={`${collapsed ? 'mx-auto' : 'mr-3'} h-5 w-5 flex-shrink-0`} />
                            {!collapsed && <span>{item.name}</span>}
                          </div>
                          {!collapsed && (
                            adminExpanded ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        
                        {!collapsed && adminExpanded && (
                          <div className="ml-6 mt-1 space-y-1">
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
                                  className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                                    isSubActive
                                      ? 'bg-primary-foreground/20 text-primary-foreground font-medium'
                                      : 'text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground'
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
                
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.href}
                        end={item.href === '/' || item.href === '/dashboard'}
                        className={({ isActive }) =>
                          `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            isActive
                              ? 'nect-glass text-primary-foreground'
                              : 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground'
                          }`
                        }
                        title={collapsed ? item.name : undefined}
                      >
                        <Icon className={`${collapsed ? 'mx-auto' : 'mr-3'} h-5 w-5 flex-shrink-0`} />
                        {!collapsed && <span>{item.name}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-primary-foreground/20">
        <button 
          onClick={handleLogout}
          className="flex items-center px-3 py-2 text-sm font-medium text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground rounded-lg transition-colors w-full"
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
