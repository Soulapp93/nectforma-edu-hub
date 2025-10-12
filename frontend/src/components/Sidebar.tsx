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
  LogOut,
  ClipboardCheck,
  Building,
  Eye
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
import { supabase } from '@/integrations/supabase/client';

const Sidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { userRole, userId } = useCurrentUser();
  const { userInfo, relationInfo } = useUserWithRelations();

  const handleLogout = async () => {
    // Nettoyer la session démo
    sessionStorage.removeItem('demo_user');
    
    // Déconnexion Supabase si connecté
    await supabase.auth.signOut();
    
    // Rediriger vers la page d'authentification
    window.location.href = '/auth';
  };

  // Obtenir les informations utilisateur pour l'affichage
  const getUserDisplayInfo = () => {
    const demoUser = sessionStorage.getItem('demo_user');
    if (demoUser) {
      const userData = JSON.parse(demoUser);
      return {
        name: `${userData.first_name} ${userData.last_name}`,
        role: userData.role,
        initials: `${userData.first_name[0]}${userData.last_name[0]}`,
        relationInfo: null // Les utilisateurs démo n'ont pas de relations
      };
    }
    
    if (userInfo) {
      return {
        name: `${userInfo.first_name} ${userInfo.last_name}`,
        role: userRole || 'Utilisateur',
        initials: `${userInfo.first_name[0]}${userInfo.last_name[0]}`,
        relationInfo
      };
    }
    
    return {
      name: 'Utilisateur',
      role: userRole || 'Utilisateur',
      initials: 'AN',
      relationInfo: null
    };
  };

  const userDisplayInfo = getUserDisplayInfo();
  
  // Navigation pour AdminPrincipal uniquement (avec gestion établissement et profil séparés)
  const principalAdminNavigation = [
    { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
    { name: 'Administration', href: '/administration', icon: Users },
    { name: 'Formation', href: '/formations', icon: BookOpen },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: Calendar },
    { name: 'Messagerie', href: '/messagerie', icon: MessageSquare },
    { name: 'Coffre-fort', href: '/coffre-fort', icon: FileText },
    { name: 'Gestion du compte', href: '/gestion-etablissement', icon: Building },
    { name: 'Mon Profil', href: '/compte', icon: Settings },
  ];

  // Navigation pour Admin (avec profil au lieu de gestion du compte - sans suivi émargement)
  const adminNavigation = [
    { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
    { name: 'Administration', href: '/administration', icon: Users },
    { name: 'Formation', href: '/formations', icon: BookOpen },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: Calendar },
    { name: 'Messagerie', href: '/messagerie', icon: MessageSquare },
    { name: 'Coffre-fort', href: '/coffre-fort', icon: FileText },
    { name: 'Mon Profil', href: '/compte', icon: Settings },
  ];

  // Navigation pour tuteurs (limitée)
  const tutorNavigation = [
    { name: 'Formation', href: '/formations', icon: BookOpen },
    { name: 'Suivi Émargement', href: '/suivi-emargement', icon: ClipboardCheck },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: Calendar },
    { name: 'Mon Profil', href: '/compte', icon: Settings },
  ];

  // Navigation pour les formateurs et étudiants (avec profil)
  const limitedNavigation = [
    { name: 'Formation', href: '/formations', icon: BookOpen },
    { name: 'Suivi Émargement', href: '/suivi-emargement', icon: ClipboardCheck },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: Calendar },
    { name: 'Coffre-fort', href: '/coffre-fort', icon: FileText },
    { name: 'Messagerie', href: '/messagerie', icon: MessageSquare },
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
      className={`${collapsed ? 'w-16' : 'w-64'} nect-gradient text-primary-foreground shadow-xl transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarHeader className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-foreground rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold text-lg">NF</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">NECTFORIA</h1>
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
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.href}
                        end={item.href === '/'}
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
