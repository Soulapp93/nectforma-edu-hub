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
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { supabase } from '@/integrations/supabase/client';

const Sidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { userRole, userId } = useCurrentUser();

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
        initials: `${userData.first_name[0]}${userData.last_name[0]}`
      };
    }
    return {
      name: 'Utilisateur',
      role: userRole || 'Utilisateur',
      initials: 'AN'
    };
  };

  const userInfo = getUserDisplayInfo();
  
  // Navigation pour AdminPrincipal uniquement (avec gestion du compte)
  const principalAdminNavigation = [
    { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
    { name: 'Administration', href: '/administration', icon: Users },
    { name: 'Formation', href: '/formations', icon: BookOpen },
    { name: 'E-Learning', href: '/e-learning', icon: Monitor },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: Calendar },
    { name: 'Messagerie', href: '/messagerie', icon: MessageSquare },
    { name: 'Événements', href: '/evenements', icon: Calendar1 },
    { name: 'Coffre-fort', href: '/coffre-fort', icon: FileText },
    { name: 'Gestion du compte', href: '/compte', icon: Settings },
  ];

  // Navigation pour Admin (avec profil au lieu de gestion du compte)
  const adminNavigation = [
    { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
    { name: 'Administration', href: '/administration', icon: Users },
    { name: 'Formation', href: '/formations', icon: BookOpen },
    { name: 'E-Learning', href: '/e-learning', icon: Monitor },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: Calendar },
    { name: 'Messagerie', href: '/messagerie', icon: MessageSquare },
    { name: 'Événements', href: '/evenements', icon: Calendar1 },
    { name: 'Coffre-fort', href: '/coffre-fort', icon: FileText },
    { name: 'Mon Profil', href: '/compte', icon: Settings },
  ];

  // Navigation limitée pour les formateurs et étudiants (avec profil)
  const limitedNavigation = [
    { name: 'Formation', href: '/formations', icon: BookOpen },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: Calendar },
    { name: 'Émargement', href: '/emargement', icon: FileText },
    { name: 'Événements', href: '/evenements', icon: Calendar1 },
    { name: 'Coffre-fort', href: '/coffre-fort', icon: FileText },
    { name: 'Messagerie', href: '/messagerie', icon: MessageSquare },
    { name: 'E-Learning', href: '/e-learning', icon: Monitor },
    { name: 'Mon Profil', href: '/compte', icon: Settings },
  ];

  // Sélectionner la navigation selon le rôle
  const navigation = userRole === 'AdminPrincipal' 
    ? principalAdminNavigation 
    : userRole === 'Admin' 
    ? adminNavigation 
    : limitedNavigation;

  return (
    <SidebarWrapper 
      className={`${collapsed ? 'w-16' : 'w-64'} !bg-gradient-to-b !from-purple-600 !to-purple-800 text-white shadow-2xl transition-all duration-300`}
      style={{
        background: 'linear-gradient(180deg, #9333ea 0%, #7c3aed 100%)',
        color: 'white'
      }}
      collapsible="icon"
    >
      <SidebarHeader className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-purple-600 font-bold text-lg">NF</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold">NECTFORIA</h1>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* User Profile */}
        <div className="px-6 py-4 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium">{userInfo.initials}</span>
            </div>
            {!collapsed && (
              <div>
                <p className="text-sm font-medium">{userInfo.name}</p>
                <p className="text-xs text-white/70">{userInfo.role}</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-white/70 px-4 py-2">
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
                              ? 'bg-white/20 text-white'
                              : 'text-white/80 hover:bg-white/10 hover:text-white'
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

      <SidebarFooter className="p-4 border-t border-white/20">
        <button 
          onClick={handleLogout}
          className="flex items-center px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-colors w-full"
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
