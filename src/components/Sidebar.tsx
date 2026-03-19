import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, 
  Users, 
  GraduationCap,
  CalendarClock,
  Mail,
  BookText, 
  UserCircle,
  LogOut,
  ClipboardCheck,
  Building2,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  UsersRound,
  ShieldCheck,
  PanelLeftClose,
  PanelLeft,
  FolderKanban,
  Award,
  Headphones,
  HelpCircle,
} from 'lucide-react';
import {
  Sidebar as SidebarWrapper,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMyContext } from '@/hooks/useMyContext';
import { useEstablishment } from '@/hooks/useEstablishment';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { supabase } from '@/integrations/supabase/client';
import NectformaLogo from './NectformaLogo';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  subItems?: NavigationItem[];
}

const Sidebar = () => {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';
  const { userRole } = useCurrentUser();
  const { user: myUser, relation: myRelation, establishment: myEstablishment, role: contextRole } = useMyContext();
  const { establishment } = useEstablishment();
  const { counts: unreadCounts } = useUnreadMessages();
  const location = useLocation();
  const [adminExpanded, setAdminExpanded] = useState(location.pathname === '/administration');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  const getResolvedPhotoUrl = (profilePhotoUrl: string | null | undefined): string | null => {
    if (!profilePhotoUrl) return null;
    if (profilePhotoUrl.startsWith('http://') || profilePhotoUrl.startsWith('https://')) {
      return profilePhotoUrl;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(profilePhotoUrl);
    return data?.publicUrl || null;
  };

  const getUserDisplayInfo = () => {
    if (myUser) {
      return {
        name: `${myUser.first_name} ${myUser.last_name}`,
        role: contextRole || userRole || 'Utilisateur',
        initials: `${myUser.first_name?.[0] || ''}${myUser.last_name?.[0] || ''}`.toUpperCase() || 'U',
        profilePhotoUrl: getResolvedPhotoUrl(myUser.profile_photo_url),
        relationInfo: myRelation
      };
    }
    return {
      name: 'Utilisateur',
      role: contextRole || userRole || 'Utilisateur',
      initials: 'U',
      profilePhotoUrl: null,
      relationInfo: null
    };
  };

  const userDisplayInfo = getUserDisplayInfo();
  
  const administrationSubItems = [
    { name: 'Gestion des utilisateurs', href: '/administration?tab=users', icon: Users },
    { name: 'Gestion des formations', href: '/administration?tab=formations', icon: GraduationCap },
    { name: 'Cahiers de texte', href: '/administration?tab=textbooks', icon: BookText },
    { name: 'Emplois du temps', href: '/administration?tab=schedules', icon: CalendarDays },
    { name: 'Feuilles d\'émargement', href: '/administration?tab=attendance', icon: ClipboardCheck },
  ];
  
  const principalAdminNavigation: NavigationItem[] = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Administration', href: '/administration', icon: ShieldCheck, subItems: administrationSubItems },
    { name: 'Formations', href: '/formations', icon: GraduationCap },
    { name: 'Notes & Évaluations', href: '/notes', icon: Award },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: CalendarClock },
    { name: 'Messagerie', href: '/messagerie', icon: Mail },
    { name: 'Groupes', href: '/groupes', icon: UsersRound },
    { name: 'Espace de travail', href: '/espace-travail', icon: FolderKanban },
    { name: 'Gestion du compte', href: '/gestion-etablissement', icon: Building2 },
    { name: 'Mon profil', href: '/compte', icon: UserCircle },
  ];

  const adminNavigation: NavigationItem[] = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Administration', href: '/administration', icon: ShieldCheck, subItems: administrationSubItems },
    { name: 'Formations', href: '/formations', icon: GraduationCap },
    { name: 'Notes & Évaluations', href: '/notes', icon: Award },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: CalendarClock },
    { name: 'Messagerie', href: '/messagerie', icon: Mail },
    { name: 'Groupes', href: '/groupes', icon: UsersRound },
    { name: 'Espace de travail', href: '/espace-travail', icon: FolderKanban },
    { name: 'Mon profil', href: '/compte', icon: UserCircle },
  ];

  const tutorNavigation: NavigationItem[] = [
    { name: 'Formation apprenti', href: '/formations', icon: GraduationCap },
    { name: 'Notes apprenti', href: '/notes', icon: Award },
    { name: 'Suivi émargement apprenti', href: '/suivi-emargement', icon: ClipboardCheck },
    { name: 'Emploi du temps apprenti', href: '/emploi-temps', icon: CalendarClock },
    { name: 'Mon profil', href: '/compte', icon: UserCircle },
  ];

  const limitedNavigation: NavigationItem[] = [
    { name: 'Formations', href: '/formations', icon: GraduationCap },
    { name: 'Notes', href: '/notes', icon: Award },
    { name: 'Suivi émargement', href: '/suivi-emargement', icon: ClipboardCheck },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: CalendarClock },
    { name: 'Messagerie', href: '/messagerie', icon: Mail },
    { name: 'Groupes', href: '/groupes', icon: UsersRound },
    { name: 'Espace de travail', href: '/espace-travail', icon: FolderKanban },
    { name: 'Mon profil', href: '/compte', icon: UserCircle },
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
      className="nect-gradient text-white shadow-2xl border-r-0 overflow-hidden"
      collapsible="icon"
    >
      {/* Subtle inner glow effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/20 pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[hsl(260,80%,40%)]/20 to-transparent pointer-events-none z-0" />
      
      {/* Header */}
      <SidebarHeader className="relative z-10 px-3 pt-5 pb-4">
        <div className="flex flex-col gap-3">
          {/* Logo Row with Collapse Button */}
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-3">
              <NectformaLogo variant="light" size={collapsed ? 'sm' : 'md'} showIcon={true} />
            </div>
            
            {!collapsed && (
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 group"
                title="Réduire le menu"
              >
                <PanelLeftClose className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
              </button>
            )}
          </div>
          
          {collapsed && (
            <button
              onClick={toggleSidebar}
              className="mx-auto p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 group"
              title="Ouvrir le menu"
            >
              <PanelLeft className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
            </button>
          )}
          
          {/* Establishment info */}
          {!collapsed && establishment && (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/10 border border-white/10">
              {establishment.logo_url ? (
                <img 
                  src={establishment.logo_url} 
                  alt={establishment.name}
                  className="w-6 h-6 rounded-md object-cover ring-1 ring-white/20"
                />
              ) : (
                <div className="w-6 h-6 bg-white/15 rounded-md flex items-center justify-center">
                  <Building2 className="w-3 h-3 text-white/80" />
                </div>
              )}
              <p className="text-[11px] font-semibold text-white/90 truncate flex-1 uppercase tracking-wider">{establishment.name}</p>
            </div>
          )}
          
          {collapsed && establishment && (
            <div className="flex justify-center">
              {establishment.logo_url ? (
                <img 
                  src={establishment.logo_url} 
                  alt={establishment.name}
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/20"
                  title={establishment.name}
                />
              ) : (
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center ring-1 ring-white/20" title={establishment.name}>
                  <Building2 className="w-4 h-4 text-white/70" />
                </div>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="relative z-10 px-3">
        {/* User Profile Card - PCA PREAD style */}
        <div className={`mb-5 ${collapsed ? 'flex justify-center' : ''}`}>
          <NavLink
            to="/compte"
            className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-3 rounded-2xl bg-white/8 border border-white/10 hover:bg-white/12 transition-all duration-200`}
          >
            <div className="relative flex-shrink-0">
              <Avatar className="w-10 h-10 ring-2 ring-white/25" title={collapsed ? userDisplayInfo.name : undefined}>
                <AvatarImage src={userDisplayInfo.profilePhotoUrl || ''} alt={userDisplayInfo.name} />
                <AvatarFallback className="bg-white/15 text-white text-xs font-semibold">
                  {userDisplayInfo.initials}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[hsl(235,55%,18%)]" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white truncate leading-tight">{userDisplayInfo.name}</p>
                  <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    En ligne
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/40 flex-shrink-0" />
              </div>
            )}
          </NavLink>
        </div>

        {/* Navigation section label */}
        {!collapsed && (
          <p className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.15em] px-3 mb-2">Menu principal</p>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
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
                          className={`
                            flex items-center ${collapsed ? 'justify-center' : 'justify-between'} 
                            w-full px-3 py-2.5 
                            text-[13px] font-medium 
                            rounded-full 
                            transition-all duration-200 
                            ${isAdminRoute
                              ? 'bg-white/10 border border-white/20 text-white'
                              : 'text-white/65 hover:bg-white/6 hover:text-white/90'
                            }
                          `}
                          title={collapsed ? item.name : undefined}
                        >
                          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                            <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                            {!collapsed && <span>{item.name}</span>}
                          </div>
                          {!collapsed && (
                            <div className={`transition-transform duration-200 ${adminExpanded ? 'rotate-180' : ''}`}>
                              <ChevronDown className="h-4 w-4 text-white/50" />
                            </div>
                          )}
                        </button>
                        
                        {!collapsed && adminExpanded && (
                          <div className="ml-5 mt-1.5 space-y-0.5 border-l border-white/10 pl-3">
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
                                  className={`
                                    flex items-center justify-between
                                    gap-2 
                                    px-3 py-1.5 
                                    text-[11px] 
                                    rounded-lg 
                                    transition-all duration-200 
                                    whitespace-nowrap
                                    ${isSubActive
                                      ? 'bg-white/10 text-white font-medium'
                                      : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                                    }
                                  `}
                                >
                                  <div className="flex items-center gap-2">
                                    <SubIcon className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span>{subItem.name}</span>
                                  </div>
                                  <ChevronRight className="h-3 w-3 text-white/30" />
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
                          `
                            flex items-center ${collapsed ? 'justify-center' : 'justify-between'} 
                            px-3 py-2.5 
                            text-[13px] font-medium 
                            rounded-full 
                            transition-all duration-200 
                            relative
                            ${isActive
                              ? 'bg-white/10 border border-white/20 text-white font-semibold'
                              : 'text-white/65 hover:bg-white/6 hover:text-white/90 border border-transparent'
                            }
                          `
                        }
                        title={collapsed ? item.name : undefined}
                      >
                        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                          <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                          {!collapsed && <span>{item.name}</span>}
                        </div>
                        {!collapsed && (
                          <div className="flex items-center gap-2">
                            {badgeCount > 0 && (
                              <Badge 
                                className="bg-accent text-accent-foreground hover:bg-accent/90 text-[10px] min-w-[20px] h-5 flex items-center justify-center rounded-full font-semibold shadow-sm"
                              >
                                {badgeCount > 99 ? '99+' : badgeCount}
                              </Badge>
                            )}
                            <ChevronRight className="h-3.5 w-3.5 text-white/30" />
                          </div>
                        )}
                        {badgeCount > 0 && collapsed && (
                          <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[9px] min-w-[16px] h-4 rounded-full flex items-center justify-center font-semibold shadow-sm">
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

      <SidebarFooter className="relative z-10 px-3 pb-4 pt-2 space-y-3">
        {/* Support Card - PCA PREAD style */}
        {!collapsed && (
          <div className="p-4 rounded-2xl bg-white/8 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Headphones className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-white">Besoin d'aide ?</p>
                <p className="text-[10px] text-white/50">Contactez le support</p>
              </div>
            </div>
            <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-[11px] font-medium text-white/80 hover:bg-white/15 hover:text-white transition-all duration-200">
              <HelpCircle className="w-3.5 h-3.5" />
              Assistance
            </button>
          </div>
        )}

        {collapsed && (
          <div className="flex justify-center">
            <button 
              className="p-2 rounded-xl bg-white/8 border border-white/10 hover:bg-white/15 transition-all duration-200"
              title="Assistance"
            >
              <Headphones className="w-4 h-4 text-white/60" />
            </button>
          </div>
        )}
        
        {/* Logout */}
        <button 
          onClick={handleLogout}
          className={`
            flex items-center ${collapsed ? 'justify-center' : 'gap-3'} 
            w-full px-3 py-2.5 
            text-[13px] font-medium 
            text-white/50 
            rounded-full 
            hover:bg-white/8 hover:text-white/80 
            transition-all duration-200
            border border-transparent
          `}
          title={collapsed ? "Déconnexion" : undefined}
        >
          <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </SidebarFooter>
    </SidebarWrapper>
  );
};

export default Sidebar;
