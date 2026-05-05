import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import NotificationBell from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { useMyContext } from '@/hooks/useMyContext';
import { useUnreadCounters } from '@/hooks/useUnreadCounters';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';

const CounterBadge: React.FC<{ count: number; testId: string }> = ({ count, testId }) => {
  if (count <= 0) return null;
  return (
    <span
      data-testid={testId}
      className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[hsl(var(--golden))] text-[hsl(var(--golden-foreground))] text-[10px] font-bold flex items-center justify-center ring-2 ring-background shadow-md"
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

const TopHeaderBar = () => {
  const { user: myUser } = useMyContext();
  const { counters } = useUnreadCounters();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const getResolvedPhotoUrl = (profilePhotoUrl: string | null | undefined): string | null => {
    if (!profilePhotoUrl) return null;
    if (profilePhotoUrl.startsWith('http://') || profilePhotoUrl.startsWith('https://')) {
      return profilePhotoUrl;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(profilePhotoUrl);
    return data?.publicUrl || null;
  };

  const firstName = myUser?.first_name || 'Utilisateur';
  const lastName = myUser?.last_name || '';
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  const profilePhotoUrl = getResolvedPhotoUrl(myUser?.profile_photo_url);

  const iconClass = isDark ? 'text-white/70 hover:text-white' : 'text-slate-500 hover:text-slate-900';
  const iconBtnClass = isDark
    ? 'relative p-2 rounded-full hover:bg-white/10 transition-colors'
    : 'relative p-2 rounded-full hover:bg-slate-100 transition-colors';

  return (
    <header className="hidden md:flex h-14 items-center justify-between nect-topbar sticky top-0 z-20 px-6">
      {/* Left: Greeting */}
      <div className="flex items-center gap-2">
        <span className={`text-sm ${isDark ? 'text-white/60' : 'text-slate-400'}`}>Bonjour,</span>
        <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{firstName}</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Groupes */}
        <NavLink to="/groupes" className={iconBtnClass} title="Groupes" data-testid="header-groupes-link">
          <Users className={`h-5 w-5 ${iconClass}`} />
          <CounterBadge count={counters.groupes} testId="header-groupes-badge" />
        </NavLink>

        {/* Messagerie */}
        <NavLink to="/messagerie" className={iconBtnClass} title="Messagerie" data-testid="header-messagerie-link">
          <MessageSquare className={`h-5 w-5 ${iconClass}`} />
          <CounterBadge count={counters.messagerie} testId="header-messagerie-badge" />
        </NavLink>

        {/* Notifications */}
        <NotificationBell />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Profile Avatar */}
        <NavLink to="/compte" className="flex items-center gap-2 ml-1">
          <Avatar className={`w-9 h-9 ring-2 ${isDark ? 'ring-white/20' : 'ring-slate-200'}`}>
            <AvatarImage src={profilePhotoUrl || ''} alt={firstName} />
            <AvatarFallback className={`text-xs font-semibold ${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {initials}
            </AvatarFallback>
          </Avatar>
        </NavLink>
      </div>
    </header>
  );
};

export default TopHeaderBar;
