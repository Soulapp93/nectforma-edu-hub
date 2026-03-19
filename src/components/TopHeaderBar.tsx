import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import NotificationBell from './NotificationBell';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMyContext } from '@/hooks/useMyContext';
import { supabase } from '@/integrations/supabase/client';

const TopHeaderBar = () => {
  const { user: myUser, role: contextRole } = useMyContext();
  const { userRole } = useCurrentUser();

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
    <header className="hidden md:flex h-14 items-center justify-between nect-gradient sticky top-0 z-20 px-6 border-b border-white/10">
      {/* Left: Greeting */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-white/60">Bonjour,</span>
        <span className="text-sm font-semibold text-white">{firstName}</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Chat / Messagerie */}
        <NavLink
          to="/messagerie"
          className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
          title="Messagerie"
        >
          <MessageSquare className="h-5 w-5 text-white/70" />
        </NavLink>

        {/* Notifications */}
        <NotificationBell />

        {/* Profile Avatar */}
        <NavLink to="/compte" className="flex items-center gap-2 ml-1">
          <Avatar className="w-9 h-9 ring-2 ring-primary/20">
            <AvatarImage src={profilePhotoUrl || ''} alt={firstName} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </NavLink>
      </div>
    </header>
  );
};

export default TopHeaderBar;
