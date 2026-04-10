import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMyContext } from '@/hooks/useMyContext';
import { supabase } from '@/integrations/supabase/client';

import MobileDrawerMenu from './MobileDrawerMenu';
import NectformaLogo from './NectformaLogo';

const MobileHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user: myUser } = useMyContext();
  
  const mainPages = ['/dashboard', '/formations', '/emploi-temps', '/messagerie', '/groupes', '/administration', '/compte', '/pedagogie', '/suivi-emargement-admin', '/notes-admin', '/communication', '/documents-archives', '/espace-travail', '/gestion-etablissement', '/suivi-emargement', '/notes'];
  const canGoBack = !mainPages.includes(location.pathname) && location.pathname !== '/';
  
  const getResolvedPhotoUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const { data } = supabase.storage.from('avatars').getPublicUrl(url);
    return data?.publicUrl || null;
  };

  const firstName = myUser?.first_name || 'Utilisateur';
  const initials = `${myUser?.first_name?.[0] || ''}${myUser?.last_name?.[0] || ''}`.toUpperCase() || 'U';
  const photoUrl = getResolvedPhotoUrl(myUser?.profile_photo_url);

  return (
    <>
      <header className="md:hidden h-14 flex items-center justify-between border-b border-border/60 bg-primary px-3 sticky top-0 z-40 safe-area-top">
        {/* Left: Menu or Back */}
        <div className="flex items-center gap-2">
          {canGoBack ? (
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/10 transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft className="h-5 w-5 text-primary-foreground" />
            </button>
          ) : (
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/10 transition-colors"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5 text-primary-foreground" />
            </button>
          )}
          <NectformaLogo variant="light" size="sm" showIcon={true} className="" />
        </div>
        
        {/* Right: Notifications + Avatar */}
        <div className="flex items-center gap-2">
          <NotificationBell />
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8 ring-1 ring-white/20">
              <AvatarImage src={photoUrl || ''} alt={firstName} />
              <AvatarFallback className="bg-white/15 text-white text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden min-[400px]:block">
              <p className="text-[10px] text-white/60 leading-tight">Bonjour,</p>
              <p className="text-xs font-bold text-white leading-tight">{firstName}</p>
            </div>
          </div>
        </div>
      </header>
      
      <MobileDrawerMenu 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </>
  );
};

export default MobileHeader;