import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import NectformaLogo from './NectformaLogo';
import { 
  X, 
  LayoutDashboard, 
  GraduationCap,
  CalendarClock,
  Mail,
  UserCircle,
  LogOut,
  ClipboardCheck,
  Building2,
  UsersRound,
  ShieldCheck,
  FolderKanban,
  Award,
  FolderOpen,
  BookOpen,
  Video,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMyContext } from '@/hooks/useMyContext';
import { useEstablishment } from '@/hooks/useEstablishment';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MobileDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  matchPrefix?: string;
}

const MobileDrawerMenu: React.FC<MobileDrawerMenuProps> = ({ isOpen, onClose }) => {
  const { userRole } = useCurrentUser();
  const { user: myUser, relation: myRelation, establishment: myEstablishment, role: contextRole } = useMyContext();
  const { establishment } = useEstablishment();
  const { counts: unreadCounts } = useUnreadMessages();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Déconnexion réussie');
      navigate('/auth');
      onClose();
    } catch {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const getResolvedPhotoUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const { data } = supabase.storage.from('avatars').getPublicUrl(url);
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
    return { name: 'Utilisateur', role: contextRole || userRole || 'Utilisateur', initials: 'U', profilePhotoUrl: null, relationInfo: null };
  };

  const userDisplayInfo = getUserDisplayInfo();

  // ─── Navigation identique à la sidebar desktop ───

  const principalAdminNav: NavItem[] = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Administration', href: '/administration', icon: ShieldCheck, matchPrefix: '/administration' },
    { name: 'Pédagogie', href: '/pedagogie', icon: BookOpen, matchPrefix: '/pedagogie' },
    { name: 'Suivi & Émargement', href: '/suivi-emargement-admin', icon: ClipboardCheck, matchPrefix: '/suivi-emargement-admin' },
    { name: 'Notes & Diplômes', href: '/notes-admin', icon: Award, matchPrefix: '/notes-admin' },
    { name: 'Communication', href: '/communication', icon: Mail, matchPrefix: '/communication' },
    { name: 'Documents & Archives', href: '/documents-archives', icon: FolderOpen, matchPrefix: '/documents-archives' },
    { name: 'Espace de travail', href: '/espace-travail', icon: FolderKanban },
    { name: 'Gestion compte établissement', href: '/gestion-etablissement', icon: Building2 },
    { name: 'Mon profil', href: '/compte', icon: UserCircle },
  ];

  const adminNav: NavItem[] = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Administration', href: '/administration', icon: ShieldCheck, matchPrefix: '/administration' },
    { name: 'Pédagogie', href: '/pedagogie', icon: BookOpen, matchPrefix: '/pedagogie' },
    { name: 'Suivi & Émargement', href: '/suivi-emargement-admin', icon: ClipboardCheck, matchPrefix: '/suivi-emargement-admin' },
    { name: 'Notes & Diplômes', href: '/notes-admin', icon: Award, matchPrefix: '/notes-admin' },
    { name: 'Communication', href: '/communication', icon: Mail, matchPrefix: '/communication' },
    { name: 'Documents & Archives', href: '/documents-archives', icon: FolderOpen, matchPrefix: '/documents-archives' },
    { name: 'Espace de travail', href: '/espace-travail', icon: FolderKanban },
    { name: 'Mon profil', href: '/compte', icon: UserCircle },
  ];

  const tutorNav: NavItem[] = [
    { name: 'Formation apprenti', href: '/formations', icon: GraduationCap },
    { name: 'Notes apprenti', href: '/notes', icon: Award },
    { name: 'Classes virtuelles', href: '/classes-virtuelles', icon: Video },
    { name: 'Suivi émargement', href: '/suivi-emargement', icon: ClipboardCheck },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: CalendarClock },
    { name: 'Mon profil', href: '/compte', icon: UserCircle },
  ];

  const limitedNav: NavItem[] = [
    { name: 'Formations', href: '/formations', icon: GraduationCap },
    {
      name: userRole === 'Formateur' ? 'Saisie des notes' : 'Notes et relevés',
      href: '/notes',
      icon: Award,
    },
    { name: 'Classes virtuelles', href: '/classes-virtuelles', icon: Video },
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

  const isItemActive = (item: NavItem): boolean => {
    if (item.matchPrefix) return location.pathname.startsWith(item.matchPrefix);
    return location.pathname === item.href;
  };

  const getBadgeCount = (href: string) => {
    if (href === '/messagerie' || href === '/communication') return (unreadCounts.messagerie || 0) + (unreadCounts.groupes || 0);
    if (href === '/groupes') return unreadCounts.groupes;
    return 0;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-[60] md:hidden"
        onClick={onClose}
        data-testid="mobile-backdrop"
      />
      
      {/* Drawer */}
      <div 
        className="fixed inset-y-0 left-0 w-[80%] max-w-[300px] nect-gradient z-[70] md:hidden shadow-2xl flex flex-col overflow-hidden rounded-r-2xl"
        data-testid="mobile-drawer"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/10 pointer-events-none rounded-r-2xl z-0" />
        
        {/* Header */}
        <div className="relative z-10 px-4 pt-safe-top pb-3">
          <div className="flex items-center justify-between pt-4">
            <NectformaLogo variant="light" size="md" />
            <button
              onClick={onClose}
              data-testid="mobile-menu-close"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
            >
              <X className="w-5 h-5 text-white/80" />
            </button>
          </div>
          
          {/* Establishment */}
          {establishment && (
            <div className="flex items-center gap-2.5 mt-3 p-2.5 rounded-xl bg-white/[0.08] border border-white/10">
              {establishment.logo_url ? (
                <img 
                  src={establishment.logo_url} 
                  alt={establishment.name}
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/20"
                />
              ) : (
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white/70" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate uppercase tracking-wider">{establishment.name}</p>
                <p className="text-[10px] text-white/50">{establishment.type || 'Organisme de formation'}</p>
              </div>
            </div>
          )}
        </div>

        {/* User Card */}
        <div className="relative z-10 px-4 pb-3">
          <div className="p-3 rounded-xl bg-white/10 border border-white/5">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 ring-2 ring-white/20">
                <AvatarImage src={userDisplayInfo.profilePhotoUrl || ''} alt={userDisplayInfo.name} />
                <AvatarFallback className="bg-white/20 text-white text-xs font-semibold">
                  {userDisplayInfo.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{userDisplayInfo.name}</p>
                <p className="text-[11px] text-white/60 font-medium">{userDisplayInfo.role}</p>
              </div>
            </div>
            {userDisplayInfo.relationInfo && (
              <div className="mt-2 p-2 rounded-lg bg-white/5 border border-white/10">
                {userDisplayInfo.relationInfo.type === 'tutor' ? (
                  <div>
                    <p className="text-[10px] text-white/70 font-medium">Mon tuteur</p>
                    <p className="text-[11px] text-white font-medium truncate">{userDisplayInfo.relationInfo.name}</p>
                    {userDisplayInfo.relationInfo.company && (
                      <p className="text-[10px] text-white/50 truncate">{userDisplayInfo.relationInfo.company}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] text-white/70 font-medium">Mon apprenti</p>
                    <p className="text-[11px] text-white font-medium truncate">{userDisplayInfo.relationInfo.name}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation - identique au desktop */}
        <nav 
          className="relative z-10 flex-1 overflow-y-auto px-4 space-y-1 pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          data-testid="mobile-navigation"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);
            const badgeCount = getBadgeCount(item.href);
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onClose}
                end={item.href === '/dashboard'}
                data-testid={`mobile-nav-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                className={`
                  flex items-center gap-3 
                  px-3 py-3 
                  text-[14px] font-semibold 
                  rounded-xl 
                  transition-all duration-200 
                  active:scale-[0.97]
                  ${isActive
                    ? 'nect-glass'
                    : 'text-white/80 hover:bg-white/[0.08] active:bg-white/15'
                  }
                `}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1 leading-tight">{item.name}</span>
                {badgeCount > 0 && (
                  <Badge className="bg-emerald-500 text-white hover:bg-emerald-500/90 text-[10px] min-w-[22px] h-5 flex items-center justify-center rounded-full font-bold">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </Badge>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="relative z-10 p-4 border-t border-white/10 pb-safe-bottom">
          <button
            onClick={handleLogout}
            data-testid="mobile-logout"
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 bg-white/10 text-white rounded-xl hover:bg-white/20 active:bg-white/25 transition-colors font-semibold text-[14px]"
          >
            <LogOut className="h-5 w-5" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileDrawerMenu;
