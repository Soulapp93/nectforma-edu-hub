import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import NotificationBell from './NotificationBell';
import { useMyContext } from '@/hooks/useMyContext';
import { useUnreadCounters } from '@/hooks/useUnreadCounters';
import { supabase } from '@/integrations/supabase/client';

const CounterBadge: React.FC<{ count: number; testId: string }> = ({ count, testId }) => {
  if (count <= 0) return null;
  return (
    <span
      data-testid={testId}
      className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[hsl(var(--golden))] text-[hsl(var(--golden-foreground))] text-[10px] font-bold flex items-center justify-center ring-2 ring-[#1a0e2a] shadow-md"
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

const TopHeaderBar = () => {
  const { user: myUser } = useMyContext();
  const { counters } = useUnreadCounters();

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

  return (
    <header className="hidden md:flex h-14 items-center justify-between nect-gradient sticky top-0 z-20 px-6">
      {/* Left: Greeting */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-white/60">Bonjour,</span>
        <span className="text-sm font-semibold text-white">{firstName}</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Groupe etablissement */}
        <NavLink
          to="/groupes"
          className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
          title="Groupe etablissement"
          data-testid="header-groupes-link"
        >
          <Users className="h-5 w-5 text-white/70" />
          <CounterBadge count={counters.groupes} testId="header-groupes-badge" />
        </NavLink>

        {/* Messagerie */}
        <NavLink
          to="/messagerie"
          className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
          title="Messagerie"
          data-testid="header-messagerie-link"
        >
          <MessageSquare className="h-5 w-5 text-white/70" />
          <CounterBadge count={counters.messagerie} testId="header-messagerie-badge" />
        </NavLink>

        {/* Notifications */}
        <NotificationBell />

        {/* Profile Avatar */}
        <NavLink to="/compte" className="flex items-center gap-2 ml-1">
          <Avatar className="w-9 h-9 ring-2 ring-white/20">
            <AvatarImage src={profilePhotoUrl || ''} alt={firstName} />
            <AvatarFallback className="bg-white/10 text-white text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </NavLink>
      </div>
    </header>
  );
};

export default TopHeaderBar;
