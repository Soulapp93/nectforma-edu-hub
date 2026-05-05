import { logger } from '@/utils/logger';
import React, { useState, useRef } from 'react';
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
  Video,
  Send,
  Loader2,
  Paperclip,
  Mic,
  MicOff,
  X,
  FileText,
  Image as ImageIcon,
  MessageSquare,
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
import { useUnreadCounters } from '@/hooks/useUnreadCounters';
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
  const { counters: liveCounters } = useUnreadCounters();
  const location = useLocation();

  const establishmentName = establishment?.name || myEstablishment?.name || '';
  const establishmentLogoRaw = establishment?.logo_url || null;
  const establishmentLogoUrl = establishmentLogoRaw ? (
    establishmentLogoRaw.startsWith('http') ? establishmentLogoRaw : supabase.storage.from('avatars').getPublicUrl(establishmentLogoRaw).data?.publicUrl || null
  ) : null;

  // Support ticket state
  const [showSupport, setShowSupport] = useState(false);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [sendingSupport, setSendingSupport] = useState(false);
  const [supportSent, setSupportSent] = useState(false);
  const [supportFiles, setSupportFiles] = useState<{ name: string; url: string; type: string }[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingFile(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop();
        const path = `support/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('avatars').upload(path, file);
        if (error) { logger.error(error); continue; }
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        setSupportFiles(prev => [...prev, { name: file.name, url: data.publicUrl, type: file.type }]);
      }
    } catch (err) { logger.error(err); }
    finally { setUploadingFile(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const removeFile = (idx: number) => setSupportFiles(prev => prev.filter((_, i) => i !== idx));

  const toggleVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('La saisie vocale n\'est pas supportee par votre navigateur.'); return; }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    let finalTranscript = '';
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setSupportMessage(prev => {
        const base = prev.replace(/\[...\]$/, '').trimEnd();
        const combined = base ? `${base} ${finalTranscript}${interim ? `[...]` : ''}` : `${finalTranscript}${interim ? `[...]` : ''}`;
        return combined.trimStart();
      });
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    setIsRecording(true);
  };

  const handleSendSupport = async () => {
    if (!supportSubject.trim() || !supportMessage.trim()) return;
    setSendingSupport(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const description = supportFiles.length > 0
        ? `${supportMessage}\n\n---\nPieces jointes:\n${supportFiles.map(f => `- [${f.name}](${f.url})`).join('\n')}`
        : supportMessage;
      await supabase.from('support_tickets').insert({
        establishment_id: establishment?.id || null,
        created_by: user?.id,
        subject: supportSubject,
        description,
        status: 'open',
        priority: 'medium',
        category: 'general',
      } as any);
      setSupportSent(true);
      setSupportSubject('');
      setSupportMessage('');
      setSupportFiles([]);
      setTimeout(() => { setSupportSent(false); setShowSupport(false); }, 2000);
    } catch (e) {
      logger.error(e);
    } finally {
      setSendingSupport(false);
    }
  };

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
    { name: 'Gestion compte établissement', href: '/gestion-etablissement', icon: Building2 },
    { name: 'Mon profil', href: '/compte', icon: UserCircle },
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
    { name: 'Mon profil', href: '/compte', icon: UserCircle },
  ];

  // ─── Navigation Tuteur ───
  const tutorNav: NavItem[] = [
    { name: 'Formation apprenti', href: '/formations', icon: GraduationCap },
    { name: 'Notes apprenti', href: '/notes', icon: Award },
    { name: 'Classes virtuelles', href: '/classes-virtuelles', icon: Video },
    { name: 'Suivi émargement', href: '/suivi-emargement', icon: ClipboardCheck },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: CalendarClock },
    { name: 'Mon profil', href: '/compte', icon: UserCircle },
  ];

  // ─── Navigation Formateur / Étudiant ───
  const limitedNav: NavItem[] = [
    { name: 'Formations', href: '/formations', icon: GraduationCap },
    { name: 'Notes', href: '/notes', icon: Award },
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
          flex items-center ${collapsed ? 'justify-center' : 'gap-3'} 
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
        <Icon className="h-[18px] w-[18px] flex-shrink-0" />
        {!collapsed && <span className="leading-tight">{item.name}</span>}
        {badgeCount > 0 && !collapsed && (
          <Badge className="ml-auto bg-emerald-500 text-white hover:bg-emerald-500/90 text-[10px] min-w-[20px] h-5 flex items-center justify-center rounded-full font-semibold">
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
            {showSupport ? (
              <div className="space-y-2.5">
                {supportSent ? (
                  <div className="text-center py-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                      <Send className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-sm font-semibold text-white">Demande envoyee !</p>
                    <p className="text-[11px] text-white/50">Notre equipe vous repondra rapidement.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-bold text-white">Contacter le support</p>
                      <button onClick={() => { setShowSupport(false); setSupportFiles([]); }} className="text-white/40 hover:text-white text-xs">Fermer</button>
                    </div>
                    <input
                      type="text"
                      value={supportSubject}
                      onChange={e => setSupportSubject(e.target.value)}
                      placeholder="Sujet de votre demande..."
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-white/30 text-xs focus:outline-none focus:ring-1 focus:ring-golden"
                      data-testid="support-subject-input"
                    />
                    <div className="relative">
                      <textarea
                        value={supportMessage}
                        onChange={e => setSupportMessage(e.target.value)}
                        placeholder="Decrivez votre probleme ou question..."
                        rows={3}
                        className="w-full px-3 py-2 pr-16 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-white/30 text-xs focus:outline-none focus:ring-1 focus:ring-golden resize-none"
                        data-testid="support-message-input"
                      />
                      {/* Voice + File buttons inside textarea */}
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        <button
                          type="button"
                          onClick={toggleVoiceRecording}
                          className={`p-1.5 rounded-lg transition-colors ${isRecording ? 'bg-red-500/30 text-red-400 animate-pulse' : 'bg-white/10 text-white/50 hover:text-white/80 hover:bg-white/20'}`}
                          title={isRecording ? 'Arreter l\'enregistrement' : 'Saisie vocale'}
                          data-testid="support-voice-btn"
                        >
                          {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-1.5 rounded-lg bg-white/10 text-white/50 hover:text-white/80 hover:bg-white/20 transition-colors"
                          title="Joindre un fichier"
                          data-testid="support-attach-btn"
                        >
                          {uploadingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileUpload} className="hidden" data-testid="support-file-input" />
                    </div>
                    {/* Recording indicator */}
                    {isRecording && (
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] text-red-400 font-medium">Ecoute en cours... Parlez</span>
                      </div>
                    )}
                    {/* Attached files */}
                    {supportFiles.length > 0 && (
                      <div className="space-y-1" data-testid="support-files-list">
                        {supportFiles.map((f, idx) => (
                          <div key={idx} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10">
                            {f.type.startsWith('image/') ? <ImageIcon className="w-3 h-3 text-blue-400 shrink-0" /> : <FileText className="w-3 h-3 text-amber-400 shrink-0" />}
                            <span className="text-[10px] text-white/70 truncate flex-1">{f.name}</span>
                            <button onClick={() => removeFile(idx)} className="text-white/30 hover:text-red-400 shrink-0"><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={handleSendSupport}
                      disabled={!supportSubject.trim() || !supportMessage.trim() || sendingSupport}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-golden text-golden-foreground text-[13px] font-bold hover:bg-golden/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="support-send-btn"
                    >
                      {sendingSupport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Envoyer{supportFiles.length > 0 ? ` (${supportFiles.length} fichier${supportFiles.length > 1 ? 's' : ''})` : ''}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
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
                  <button
                    onClick={() => setShowSupport(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-golden text-golden-foreground text-[13px] font-bold hover:bg-golden/90 transition-colors"
                    data-testid="support-open-btn"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Aide
                  </button>
                  <NavLink to="/support" className="relative p-2.5 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-colors" title="Mes tickets" data-testid="support-tickets-link">
                    <MessageSquare className="w-5 h-5" />
                    {liveCounters.support > 0 && (
                      <span
                        data-testid="support-tickets-badge"
                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[hsl(var(--golden))] text-[hsl(var(--golden-foreground))] text-[10px] font-bold flex items-center justify-center ring-2 ring-[#1a0e2a] shadow-md"
                      >
                        {liveCounters.support > 99 ? '99+' : liveCounters.support}
                      </span>
                    )}
                  </NavLink>
                </div>
              </>
            )}
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
