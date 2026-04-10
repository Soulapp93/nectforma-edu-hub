import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, 
  GraduationCap,
  CalendarClock,
  Mail,
  UserCircle,
  LogOut,
  ClipboardCheck,
  Building2,
  ChevronRight,
  UsersRound,
  ShieldCheck,
  PanelLeftClose,
  PanelLeft,
  FolderKanban,
  Award,
  Headphones,
  HelpCircle,
  FolderOpen,
  BookOpen,
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

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  matchPrefix?: string;
}

const Sidebar = () => {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';
  const { userRole } = useCurrentUser();
  const { user: myUser, establishment: myEstablishment, role: contextRole } = useMyContext();
  const { establishment } = useEstablishment();
  const { counts: unreadCounts } = useUnreadMessages();
  const location = useLocation();

  const establishmentName = establishment?.name || myEstablishment?.name || '';
  const establishmentLogoRaw = establishment?.logo_url || null;
  const establishmentLogoUrl = establishmentLogoRaw ? (
    establishmentLogoRaw.startsWith('http') ? establishmentLogoRaw : supabase.storage.from('avatars').getPublicUrl(establishmentLogoRaw).data?.publicUrl || null
  ) : null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  const getResolvedPhotoUrl = (profilePhotoUrl: string | null | undefined): string | null => {
    if (!profilePhotoUrl) return null;
    if (profilePhotoUrl.startsWith('http://') || profilePhotoUrl.startsWith('https://')) return profilePhotoUrl;
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
      };
    }
    return { name: 'Utilisateur', role: contextRole || userRole || 'Utilisateur', initials: 'U', profilePhotoUrl: null };
  };

  const userDisplayInfo = getUserDisplayInfo();

  // ─── Navigation AdminPrincipal : plate, liens directs vers pages hub ───
  const principalAdminNav: NavItem[] = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Administration', href: '/administration', icon: ShieldCheck, matchPrefix: '/administration' },
    { name: 'Pédagogie', href: '/pedagogie', icon: BookOpen, matchPrefix: '/pedagogie' },
    { name: 'Suivi & Émargement', href: '/suivi-emargement-admin', icon: ClipboardCheck, matchPrefix: '/suivi-emargement-admin' },
    { name: 'Notes & Diplômes', href: '/notes-admin', icon: Award, matchPrefix: '/notes-admin' },
    { name: 'Communication', href: '/communication', icon: Mail, matchPrefix: '/communication' },
    { name: 'Documents & Archives', href: '/documents-archives', icon: FolderOpen, matchPrefix: '/documents-archives' },
    { name: 'Espace de travail', href: '/espace-travail', icon: FolderKanban },
    { name: 'Gestion du compte', href: '/gestion-etablissement', icon: Building2 },
    { name: 'Profil', href: '/compte', icon: UserCircle },
  ];

  // ─── Navigation Admin (sans Gestion du compte) ───
  const adminNav: NavItem[] = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Administration', href: '/administration', icon: ShieldCheck, matchPrefix: '/administration' },
    { name: 'Pédagogie', href: '/pedagogie', icon: BookOpen, matchPrefix: '/pedagogie' },
    { name: 'Suivi & Émargement', href: '/suivi-emargement-admin', icon: ClipboardCheck, matchPrefix: '/suivi-emargement-admin' },
    { name: 'Notes & Diplômes', href: '/notes-admin', icon: Award, matchPrefix: '/notes-admin' },
    { name: 'Communication', href: '/communication', icon: Mail, matchPrefix: '/communication' },
    { name: 'Documents & Archives', href: '/documents-archives', icon: FolderOpen, matchPrefix: '/documents-archives' },
    { name: 'Espace de travail', href: '/espace-travail', icon: FolderKanban },
    { name: 'Profil', href: '/compte', icon: UserCircle },
  ];

  // ─── Navigation Tuteur ───
  const tutorNav: NavItem[] = [
    { name: 'Formation apprenti', href: '/formations', icon: GraduationCap },
    { name: 'Notes apprenti', href: '/notes', icon: Award },
    { name: 'Suivi émargement', href: '/suivi-emargement', icon: ClipboardCheck },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: CalendarClock },
    { name: 'Mon profil', href: '/compte', icon: UserCircle },
  ];

  // ─── Navigation Formateur / Étudiant ───
  const limitedNav: NavItem[] = [
    { name: 'Formations', href: '/formations', icon: GraduationCap },
    { name: 'Notes', href: '/notes', icon: Award },
    { name: 'Suivi émargement', href: '/suivi-emargement', icon: ClipboardCheck },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: CalendarClock },
    { name: 'Messagerie', href: '/messagerie', icon: Mail },
    { name: 'Groupes', href: '/groupes', icon: UsersRound },
    { name: 'Espace de travail', href: '/espace-travail', icon: FolderKanban },
    { name: 'Mon profil', href: '/compte', icon: UserCircle },
  ];

  const navItems = userRole === 'AdminPrincipal'
    ? principalAdminNav
    : userRole === 'Admin'
    ? adminNav
    : userRole === 'Tuteur'
    ? tutorNav
    : limitedNav;

  // ─── Helpers ───
  const isItemActive = (item: NavItem): boolean => {
    if (item.matchPrefix) {
      return location.pathname.startsWith(item.matchPrefix);
    }
    return location.pathname === item.href;
  };

  const getBadgeCount = (href: string) => {
    if (href === '/messagerie' || href === '/communication') return unreadCounts.messagerie + (unreadCounts.groupes || 0);
    if (href === '/groupes') return unreadCounts.groupes;
    return 0;
  };

  // ─── Render ───
  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = isItemActive(item);
    const badgeCount = getBadgeCount(item.href);

    return (
      <NavLink
        key={item.name}
        to={item.href}
        end={item.href === '/dashboard'}
        data-testid={`nav-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
        className={`
          flex items-center ${collapsed ? 'justify-center' : 'justify-between'} 
          px-3 py-2.5 
          text-[13px] font-semibold 
          rounded-xl 
          transition-all duration-200 
          relative
          ${isActive
            ? 'nect-glass font-bold'
            : 'text-white/80 hover:bg-white/[0.08] hover:text-white'
          }
        `}
        title={collapsed ? item.name : undefined}
      >
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <Icon className="h-[18px] w-[18px] flex-shrink-0" />
          {!collapsed && <span>{item.name}</span>}
        </div>
        {!collapsed && isActive && badgeCount === 0 && (
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-white/50" />
        )}
        {badgeCount > 0 && !collapsed && (
          <Badge className="bg-emerald-500 text-white hover:bg-emerald-500/90 text-[10px] min-w-[20px] h-5 flex items-center justify-center rounded-full font-semibold">
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
  };

  return (
    <SidebarWrapper 
      className="nect-gradient sidebar-glow border-r-0 overflow-hidden"
      collapsible="icon"
    >
      {/* Header */}
      <SidebarHeader className="relative z-10 px-4 pt-5 pb-3">
        <div className="flex flex-col gap-3">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
            <NectformaLogo variant="light" size={collapsed ? 'sm' : 'md'} showIcon={true} />
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
        {/* Establishment Card */}
        <div className={`mb-4 p-3 rounded-2xl bg-white/[0.08] border border-white/10 ${collapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="relative flex-shrink-0">
              {establishmentLogoUrl ? (
                <Avatar className="w-11 h-11 ring-2 ring-white/20">
                  <AvatarImage src={establishmentLogoUrl} alt={establishmentName} />
                  <AvatarFallback className="bg-white/15 text-white text-xs font-semibold">
                    {establishmentName?.[0]?.toUpperCase() || 'E'}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center ring-2 ring-white/20">
                  <Building2 className="w-6 h-6 text-white/80" />
                </div>
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-white truncate leading-tight uppercase tracking-wider">
                  {establishmentName || 'Établissement'}
                </p>
                <p className="text-[11px] text-white/50 font-medium mt-0.5">
                  {establishment?.type || 'Plateforme éducative'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation plate */}
        <nav className="space-y-0.5" data-testid="sidebar-navigation">
          {navItems.map(renderNavItem)}
        </nav>

        {/* Support Card */}
        {!collapsed && (
          <div className="mt-6 p-4 rounded-2xl bg-white/[0.08] border border-white/10" data-testid="support-card">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-full bg-golden/20 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-golden" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-white">Support</p>
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
          data-testid="logout-button"
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
