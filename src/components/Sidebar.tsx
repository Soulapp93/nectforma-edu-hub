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
  UsersRound,
  ShieldCheck,
  PanelLeftClose,
  PanelLeft,
  FolderKanban,
  Award,
  Headphones,
  HelpCircle,
  FolderOpen,
  Archive,
  Video,
  AlertTriangle,
  Briefcase,
  BookOpen,
  Medal,
  FileText,
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
}

interface SidebarEntry {
  type: 'standalone' | 'category';
  label: string;
  icon: React.ComponentType<any>;
  href?: string;
  items?: NavItem[];
}

const Sidebar = () => {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';
  const { userRole } = useCurrentUser();
  const { user: myUser, relation: myRelation, establishment: myEstablishment, role: contextRole } = useMyContext();
  const { establishment } = useEstablishment();
  const { counts: unreadCounts } = useUnreadMessages();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

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

  const toggleSection = (label: string) => {
    setExpandedSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  // ─── Navigation AdminPrincipal ───
  const principalAdminEntries: SidebarEntry[] = [
    { type: 'standalone', label: 'Tableau de bord', icon: LayoutDashboard, href: '/dashboard' },
    {
      type: 'category', label: 'Administration', icon: ShieldCheck,
      items: [
        { name: 'Gestion des utilisateurs', href: '/administration?tab=users', icon: Users },
        { name: 'Entreprises partenaires', href: '/administration?tab=partners', icon: Briefcase },
      ],
    },
    {
      type: 'category', label: 'Pédagogie', icon: BookOpen,
      items: [
        { name: 'Emplois du temps', href: '/emploi-temps', icon: CalendarClock },
        { name: 'Cahiers de textes', href: '/administration?tab=textbooks', icon: BookText },
        { name: 'Gestion des formations', href: '/administration?tab=formations', icon: GraduationCap },
        { name: 'Gestion des promotions', href: '/formations', icon: UsersRound },
        { name: 'Classe virtuelle', href: '/administration?tab=virtual-classes', icon: Video },
      ],
    },
    {
      type: 'category', label: 'Suivi & Émargement', icon: ClipboardCheck,
      items: [
        { name: "Gestion des émargements", href: '/administration?tab=attendance', icon: ClipboardCheck },
        { name: 'Gestion des absences', href: '/administration?tab=absences', icon: AlertTriangle },
      ],
    },
    {
      type: 'category', label: 'Notes, Relevés & Diplômes', icon: Award,
      items: [
        { name: 'Notes et relevés', href: '/notes', icon: FileText },
        { name: 'Gestion des diplômes', href: '/notes?tab=diplomas', icon: Medal },
      ],
    },
    {
      type: 'category', label: 'Communication', icon: Mail,
      items: [
        { name: 'Messagerie', href: '/messagerie', icon: Mail },
        { name: 'Groupe établissements', href: '/groupes', icon: UsersRound },
      ],
    },
    { type: 'standalone', label: 'Documents & Archives', icon: FolderOpen, href: '/administration?tab=student-files' },
    { type: 'standalone', label: 'Espace de travail', icon: FolderKanban, href: '/espace-travail' },
    { type: 'standalone', label: 'Gestion du compte', icon: Building2, href: '/gestion-etablissement' },
    { type: 'standalone', label: 'Profil', icon: UserCircle, href: '/compte' },
  ];

  // ─── Navigation Admin ───
  const adminEntries: SidebarEntry[] = [
    { type: 'standalone', label: 'Tableau de bord', icon: LayoutDashboard, href: '/dashboard' },
    {
      type: 'category', label: 'Administration', icon: ShieldCheck,
      items: [
        { name: 'Gestion des utilisateurs', href: '/administration?tab=users', icon: Users },
        { name: 'Entreprises partenaires', href: '/administration?tab=partners', icon: Briefcase },
      ],
    },
    {
      type: 'category', label: 'Pédagogie', icon: BookOpen,
      items: [
        { name: 'Emplois du temps', href: '/emploi-temps', icon: CalendarClock },
        { name: 'Cahiers de textes', href: '/administration?tab=textbooks', icon: BookText },
        { name: 'Gestion des formations', href: '/administration?tab=formations', icon: GraduationCap },
        { name: 'Gestion des promotions', href: '/formations', icon: UsersRound },
        { name: 'Classe virtuelle', href: '/administration?tab=virtual-classes', icon: Video },
      ],
    },
    {
      type: 'category', label: 'Suivi & Émargement', icon: ClipboardCheck,
      items: [
        { name: "Gestion des émargements", href: '/administration?tab=attendance', icon: ClipboardCheck },
        { name: 'Gestion des absences', href: '/administration?tab=absences', icon: AlertTriangle },
      ],
    },
    {
      type: 'category', label: 'Notes, Relevés & Diplômes', icon: Award,
      items: [
        { name: 'Notes et relevés', href: '/notes', icon: FileText },
        { name: 'Gestion des diplômes', href: '/notes?tab=diplomas', icon: Medal },
      ],
    },
    {
      type: 'category', label: 'Communication', icon: Mail,
      items: [
        { name: 'Messagerie', href: '/messagerie', icon: Mail },
        { name: 'Groupe établissements', href: '/groupes', icon: UsersRound },
      ],
    },
    { type: 'standalone', label: 'Documents & Archives', icon: FolderOpen, href: '/administration?tab=student-files' },
    { type: 'standalone', label: 'Espace de travail', icon: FolderKanban, href: '/espace-travail' },
    { type: 'standalone', label: 'Profil', icon: UserCircle, href: '/compte' },
  ];

  // ─── Navigation plate Tuteur (pas de catégories) ───
  const tutorFlatNav: NavItem[] = [
    { name: 'Formation apprenti', href: '/formations', icon: GraduationCap },
    { name: 'Notes apprenti', href: '/notes', icon: Award },
    { name: 'Suivi émargement apprenti', href: '/suivi-emargement', icon: ClipboardCheck },
    { name: 'Emploi du temps apprenti', href: '/emploi-temps', icon: CalendarClock },
    { name: 'Mon profil', href: '/compte', icon: UserCircle },
  ];

  // ─── Navigation plate Formateur / Étudiant (pas de catégories) ───
  const limitedFlatNav: NavItem[] = [
    { name: 'Formations', href: '/formations', icon: GraduationCap },
    { name: 'Notes', href: '/notes', icon: Award },
    { name: 'Suivi émargement', href: '/suivi-emargement', icon: ClipboardCheck },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: CalendarClock },
    { name: 'Messagerie', href: '/messagerie', icon: Mail },
    { name: 'Groupes', href: '/groupes', icon: UsersRound },
    { name: 'Espace de travail', href: '/espace-travail', icon: FolderKanban },
    { name: 'Mon profil', href: '/compte', icon: UserCircle },
  ];

  const isAdmin = userRole === 'AdminPrincipal' || userRole === 'Admin';

  const entries = userRole === 'AdminPrincipal'
    ? principalAdminEntries
    : userRole === 'Admin'
    ? adminEntries
    : null;

  const flatNav = userRole === 'Tuteur'
    ? tutorFlatNav
    : !isAdmin
    ? limitedFlatNav
    : null;

  // ─── Helpers ───

  const isItemActive = (href: string): boolean => {
    const itemPath = href.split('?')[0];
    const itemParams = new URLSearchParams(href.split('?')[1] || '');
    const itemTab = itemParams.get('tab');
    const currentTab = new URLSearchParams(location.search).get('tab');
    if (itemTab) return location.pathname === itemPath && currentTab === itemTab;
    return location.pathname === itemPath;
  };

  const isCategoryActive = (entry: SidebarEntry): boolean => {
    if (!entry.items) return false;
    return entry.items.some(item => isItemActive(item.href));
  };

  const getBadgeCount = (href: string) => {
    if (href === '/messagerie') return unreadCounts.messagerie;
    if (href === '/groupes') return unreadCounts.groupes;
    return 0;
  };

  const getCategoryBadgeCount = (entry: SidebarEntry): number => {
    if (!entry.items) return 0;
    return entry.items.reduce((sum, item) => sum + getBadgeCount(item.href), 0);
  };

  // ─── Render functions ───

  const renderSubItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = isItemActive(item.href);
    const badgeCount = getBadgeCount(item.href);

    return (
      <NavLink
        key={item.name}
        to={item.href}
        data-testid={`nav-sub-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
        className={`
          flex items-center gap-2.5 
          px-3 py-1.5 
          text-[12px] 
          rounded-lg 
          transition-all duration-200 
          whitespace-nowrap
          ${isActive
            ? 'bg-white/15 text-white font-semibold'
            : 'text-white/60 hover:bg-white/[0.08] hover:text-white'
          }
        `}
      >
        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="flex-1 truncate">{item.name}</span>
        {badgeCount > 0 && (
          <Badge className="bg-emerald-500 text-white hover:bg-emerald-500/90 text-[9px] min-w-[18px] h-4 flex items-center justify-center rounded-full font-semibold">
            {badgeCount > 99 ? '99+' : badgeCount}
          </Badge>
        )}
      </NavLink>
    );
  };

  // ─── Render flat nav item (Formateur, Étudiant, Tuteur) ───
  const renderFlatNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = isItemActive(item.href);
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
        {!collapsed && isActive && !badgeCount && (
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
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

  const renderEntry = (entry: SidebarEntry, index: number) => {
    const Icon = entry.icon;

    // ─── Standalone item ───
    if (entry.type === 'standalone') {
      const isActive = isItemActive(entry.href!);
      const badgeCount = getBadgeCount(entry.href!);

      return (
        <NavLink
          key={entry.label}
          to={entry.href!}
          end={entry.href === '/dashboard'}
          data-testid={`nav-${entry.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
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
          title={collapsed ? entry.label : undefined}
        >
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <Icon className="h-[18px] w-[18px] flex-shrink-0" />
            {!collapsed && <span>{entry.label}</span>}
          </div>
          {!collapsed && isActive && !badgeCount && (
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
    }

    // ─── Category with sub-items ───
    const isExpanded = !!expandedSections[entry.label];
    const isActive = isCategoryActive(entry);
    const categoryBadge = getCategoryBadgeCount(entry);

    return (
      <div key={entry.label}>
        <button
          onClick={() => toggleSection(entry.label)}
          data-testid={`nav-cat-${entry.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
          className={`
            flex items-center ${collapsed ? 'justify-center' : 'justify-between'} 
            w-full px-3 py-2.5 
            text-[13px] font-semibold 
            rounded-xl 
            transition-all duration-200 
            ${isActive
              ? 'nect-glass font-bold'
              : 'text-white/80 hover:bg-white/[0.08] hover:text-white'
            }
          `}
          title={collapsed ? entry.label : undefined}
        >
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <Icon className="h-[18px] w-[18px] flex-shrink-0" />
            {!collapsed && <span>{entry.label}</span>}
          </div>
          {!collapsed && (
            <div className="flex items-center gap-1.5">
              {categoryBadge > 0 && (
                <Badge className="bg-emerald-500 text-white hover:bg-emerald-500/90 text-[9px] min-w-[18px] h-4 flex items-center justify-center rounded-full font-semibold">
                  {categoryBadge > 99 ? '99+' : categoryBadge}
                </Badge>
              )}
              <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                <ChevronDown className="h-4 w-4 text-white/50" />
              </div>
            </div>
          )}
        </button>

        {!collapsed && isExpanded && entry.items && (
          <div className="ml-5 mt-1 space-y-0.5 border-l-2 border-white/15 pl-3 mb-1">
            {entry.items.map(renderSubItem)}
          </div>
        )}
      </div>
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
        {/* Establishment Logo Card */}
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

        {/* Navigation */}
        <nav className="space-y-0.5" data-testid="sidebar-navigation">
          {/* Admin : navigation par catégories */}
          {entries && entries.map((entry, idx) => renderEntry(entry, idx))}
          {/* Non-admin : navigation plate */}
          {flatNav && flatNav.map(renderFlatNavItem)}
        </nav>

        {/* Support / Help Card */}
        {!collapsed && (
          <div className="mt-6 mx-0 p-4 rounded-2xl bg-white/[0.08] border border-white/10" data-testid="support-card">
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
