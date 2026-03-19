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
        lastName: myUser.last_name?.toUpperCase() || '',
        firstName: myUser.first_name || '',
        role: contextRole || userRole || 'Utilisateur',
        initials: `${myUser.first_name?.[0] || ''}${myUser.last_name?.[0] || ''}`.toUpperCase() || 'U',
        profilePhotoUrl: getResolvedPhotoUrl(myUser.profile_photo_url),
        relationInfo: myRelation
      };
    }
    return {
      name: 'Utilisateur',
      lastName: '',
      firstName: 'Utilisateur',
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
      className="nect-gradient sidebar-glow border-r-0 overflow-hidden"
      collapsible="icon"
    >
      {/* Header */}
      <SidebarHeader className="relative z-10 px-4 pt-5 pb-3">
        <div className="flex flex-col gap-3">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-3">
              <NectformaLogo variant="light" size={collapsed ? 'sm' : 'md'} showIcon={true} />
            </div>
            {!collapsed && (
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200"
                title="Réduire le menu"
              >
                <PanelLeftClose className="w-4 h-4 text-white/70 hover:text-white transition-colors" />
              </button>
            )}
          </div>
          {collapsed && (
            <button
              onClick={toggleSidebar}
              className="mx-auto p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200"
              title="Ouvrir le menu"
            >
              <PanelLeft className="w-4 h-4 text-white/70 hover:text-white transition-colors" />
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="relative z-10 px-3">
        {/* User Profile Card */}
        <div className={`mb-5 p-3 rounded-2xl bg-white/[0.08] border border-white/10 ${collapsed ? 'flex justify-center' : ''}`}>
          <NavLink to="/compte" className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="relative flex-shrink-0">
              <Avatar className="w-11 h-11 ring-2 ring-white/20" title={collapsed ? userDisplayInfo.name : undefined}>
                <AvatarImage src={userDisplayInfo.profilePhotoUrl || ''} alt={userDisplayInfo.name} />
                <AvatarFallback className="bg-white/15 text-white text-xs font-semibold">
                  {userDisplayInfo.initials}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[hsl(240,60%,12%)]" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-bold text-white truncate leading-tight">{userDisplayInfo.firstName}</p>
                  <p className="text-[14px] font-extrabold text-white truncate leading-tight uppercase tracking-wide">{userDisplayInfo.lastName}</p>
                  <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    En ligne
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/40 flex-shrink-0" />
              </div>
            )}
          </NavLink>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isActive = hasSubItems 
              ? location.pathname === '/administration'
              : location.pathname === item.href || (item.href === '/dashboard' && location.pathname === '/dashboard');
            
            const getBadgeCount = () => {
              if (item.href === '/messagerie') return unreadCounts.messagerie;
              if (item.href === '/groupes') return unreadCounts.groupes;
              return 0;
            };
            const badgeCount = getBadgeCount();

            if (hasSubItems) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => setAdminExpanded(!adminExpanded)}
                    className={`
                      flex items-center ${collapsed ? 'justify-center' : 'justify-between'} 
                      w-full px-3 py-2.5 
                      text-[14px] font-medium 
                      rounded-xl 
                      transition-all duration-200 
                      ${isActive
                        ? 'nect-glass font-semibold'
                        : 'text-white/80 hover:bg-white/[0.08] hover:text-white'
                      }
                    `}
                    title={collapsed ? item.name : undefined}
                  >
                    <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span>{item.name}</span>}
                    </div>
                    {!collapsed && (
                      <div className={`transition-transform duration-200 ${adminExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    )}
                  </button>
                  
                  {!collapsed && adminExpanded && (
                    <div className="ml-5 mt-1.5 space-y-0.5 border-l-2 border-white/15 pl-3">
                      {item.subItems!.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const searchParams = new URLSearchParams(subItem.href.split('?')[1]);
                        const tabParam = searchParams.get('tab');
                        const currentTab = new URLSearchParams(location.search).get('tab');
                        const isSubActive = location.pathname === '/administration' && currentTab === tabParam;
                        
                        return (
                          <NavLink
                            key={subItem.name}
                            to={subItem.href}
                            className={`
                              flex items-center gap-2.5 
                              px-3 py-1.5 
                              text-[12px] 
                              rounded-lg 
                              transition-all duration-200 
                              whitespace-nowrap
                              ${isSubActive
                                ? 'bg-white/15 text-white font-semibold'
                                : 'text-white/60 hover:bg-white/[0.08] hover:text-white'
                              }
                            `}
                          >
                            <SubIcon className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{subItem.name}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/' || item.href === '/dashboard'}
                className={`
                  flex items-center ${collapsed ? 'justify-center' : 'justify-between'} 
                  px-3 py-2.5 
                  text-[14px] font-medium 
                  rounded-xl 
                  transition-all duration-200 
                  relative
                  ${isActive
                    ? 'nect-glass font-semibold'
                    : 'text-white/80 hover:bg-white/[0.08] hover:text-white'
                  }
                `}
                title={collapsed ? item.name : undefined}
              >
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </div>
                {!collapsed && isActive && (
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                )}
                {badgeCount > 0 && !collapsed && (
                  <Badge 
                    className="bg-emerald-500 text-white hover:bg-emerald-500/90 text-[10px] min-w-[20px] h-5 flex items-center justify-center rounded-full font-semibold"
                  >
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </Badge>
                )}
                {badgeCount > 0 && collapsed && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] min-w-[16px] h-4 rounded-full flex items-center justify-center font-semibold">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Help Card */}
        {!collapsed && (
          <div className="mt-6 mx-0 p-4 rounded-2xl bg-white/[0.08] border border-white/10">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-full bg-golden/20 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-golden" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-white">Besoin d'aide ?</p>
                <p className="text-[11px] text-white/50">Contactez le support</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-golden text-golden-foreground text-[13px] font-bold hover:bg-golden/90 transition-colors">
                <HelpCircle className="w-4 h-4" />
                Aide
              </button>
              <button className="p-2.5 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-colors">
                <Headphones className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="relative z-10 p-3 border-t border-white/[0.08]">
        <button 
          onClick={handleLogout}
          className={`
            flex items-center ${collapsed ? 'justify-center' : 'gap-3'} 
            w-full px-3 py-2.5 
            text-[14px] font-medium 
            text-white/70 
            rounded-xl 
            hover:bg-white/[0.08] hover:text-white 
            transition-all duration-200
          `}
          title={collapsed ? "Déconnexion" : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Se déconnecter</span>}
        </button>
      </SidebarFooter>
    </SidebarWrapper>
  );
};

export default Sidebar;