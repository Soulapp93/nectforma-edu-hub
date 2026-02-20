import React, { useState, useCallback, useEffect, useRef } from 'react';
import { workspaceService } from '@/services/workspaceService';
import { supabase } from '@/integrations/supabase/client';
import { useMyContext } from '@/hooks/useMyContext';
import { useFormations } from '@/hooks/useFormations';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Share2, Users, Trash2, UserPlus, X, Search, GraduationCap, User } from 'lucide-react';
import { toast } from 'sonner';

interface ShareDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  userId: string;
}

interface UserSuggestion {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
}

const ShareDocumentModal: React.FC<ShareDocumentModalProps> = ({ open, onOpenChange, documentId, userId }) => {
  const { establishment } = useMyContext();
  const { formations } = useFormations();
  const [sharePermission, setSharePermission] = useState<'view' | 'edit'>('edit');
  const [shares, setShares] = useState<any[]>([]);
  const [sharesUsers, setSharesUsers] = useState<Record<string, string>>({});

  // Search & selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [shareMode, setShareMode] = useState<'individual' | 'class'>('individual');
  const [selectedFormationId, setSelectedFormationId] = useState<string>('');
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search users when query changes
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2 || !establishment?.id) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const query = searchQuery.trim().toLowerCase();

        // Search in users table
        const { data: users } = await (supabase as any)
          .from('users')
          .select('id, first_name, last_name, email, role')
          .eq('establishment_id', establishment.id)
          .neq('id', userId)
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
          .limit(10);

        // Search in tutors table
        const { data: tutors } = await (supabase as any)
          .from('tutors')
          .select('id, first_name, last_name, email')
          .eq('establishment_id', establishment.id)
          .neq('id', userId)
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
          .limit(5);

        const allSuggestions: UserSuggestion[] = [
          ...(users || []).map((u: any) => ({ ...u, role: u.role })),
          ...(tutors || []).map((t: any) => ({ ...t, role: 'Tuteur' })),
        ];

        // Filter out already selected users and already shared users
        const selectedIds = new Set(selectedUsers.map(u => u.id));
        const sharedIds = new Set(shares.map(s => s.shared_with_id));
        const filtered = allSuggestions.filter(u => !selectedIds.has(u.id) && !sharedIds.has(u.id));

        setSuggestions(filtered);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, establishment?.id, userId, selectedUsers, shares]);

  const loadShares = useCallback(async () => {
    try {
      const data = await workspaceService.getDocumentShares(documentId);
      setShares(data);
      if (data.length > 0) {
        const userIds = [...new Set(data.map((s: any) => s.shared_with_id))];
        const { data: users } = await (supabase as any)
          .from('users').select('id, first_name, last_name, email').in('id', userIds);
        const { data: tutors } = await (supabase as any)
          .from('tutors').select('id, first_name, last_name, email').in('id', userIds);
        const map: Record<string, string> = {};
        (users || []).forEach((u: any) => { map[u.id] = `${u.first_name} ${u.last_name} (${u.email})`; });
        (tutors || []).forEach((t: any) => { if (!map[t.id]) map[t.id] = `${t.first_name} ${t.last_name} (${t.email})`; });
        setSharesUsers(map);
      }
    } catch { /* ignore */ }
  }, [documentId]);

  useEffect(() => {
    if (open) {
      loadShares();
      setSelectedUsers([]);
      setSearchQuery('');
      setSelectedFormationId('');
    }
  }, [open, loadShares]);

  const handleSelectUser = (user: UserSuggestion) => {
    setSelectedUsers(prev => [...prev, user]);
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleRemoveSelected = (id: string) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleShareIndividual = async () => {
    if (selectedUsers.length === 0 && !searchQuery.trim()) return;

    try {
      // If there's a manual email in the search field, try to resolve it
      if (searchQuery.trim() && selectedUsers.length === 0) {
        const email = searchQuery.trim();
        const { data: users } = await (supabase as any)
          .from('users').select('id').eq('email', email).eq('establishment_id', establishment?.id);
        let targetId = users?.[0]?.id;
        if (!targetId) {
          const { data: tutors } = await (supabase as any)
            .from('tutors').select('id').eq('email', email).eq('establishment_id', establishment?.id);
          targetId = tutors?.[0]?.id;
        }
        if (!targetId) { toast.error('Utilisateur non trouvé avec cet email'); return; }
        if (targetId === userId) { toast.error('Vous ne pouvez pas partager avec vous-même'); return; }
        await workspaceService.shareDocument(documentId, targetId, userId, sharePermission);
        setSearchQuery('');
        loadShares();
        toast.success('Document partagé');
        return;
      }

      // Share with all selected users
      let successCount = 0;
      let errorCount = 0;
      for (const user of selectedUsers) {
        try {
          await workspaceService.shareDocument(documentId, user.id, userId, sharePermission);
          successCount++;
        } catch {
          errorCount++;
        }
      }

      setSelectedUsers([]);
      setSearchQuery('');
      loadShares();

      if (successCount > 0) toast.success(`Document partagé avec ${successCount} utilisateur${successCount > 1 ? 's' : ''}`);
      if (errorCount > 0) toast.error(`${errorCount} erreur${errorCount > 1 ? 's' : ''} lors du partage`);
    } catch {
      toast.error('Erreur lors du partage');
    }
  };

  const handleShareWithClass = async () => {
    if (!selectedFormationId) { toast.error('Veuillez sélectionner une formation'); return; }

    try {
      const { data: students, error } = await (supabase as any).rpc('get_formation_students', {
        formation_id_param: selectedFormationId
      });

      if (error) throw error;
      if (!students || students.length === 0) { toast.error('Aucun étudiant dans cette formation'); return; }

      const sharedIds = new Set(shares.map(s => s.shared_with_id));
      const toShare = students.filter((s: any) => s.user_id !== userId && !sharedIds.has(s.user_id));

      if (toShare.length === 0) { toast.info('Tous les étudiants ont déjà accès'); return; }

      let successCount = 0;
      for (const student of toShare) {
        try {
          await workspaceService.shareDocument(documentId, student.user_id, userId, sharePermission);
          successCount++;
        } catch { /* skip duplicates */ }
      }

      loadShares();
      setSelectedFormationId('');
      toast.success(`Document partagé avec ${successCount} étudiant${successCount > 1 ? 's' : ''}`);
    } catch {
      toast.error('Erreur lors du partage avec la classe');
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      await workspaceService.removeShare(shareId);
      loadShares();
      toast.success('Partage supprimé');
    } catch { toast.error('Erreur'); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" /> Partager le document
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <Button
              variant={shareMode === 'individual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShareMode('individual')}
              className="flex-1"
            >
              <User className="h-4 w-4 mr-1.5" /> Individuel
            </Button>
            <Button
              variant={shareMode === 'class' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShareMode('class')}
              className="flex-1"
            >
              <GraduationCap className="h-4 w-4 mr-1.5" /> Toute la classe
            </Button>
          </div>

          {/* Permission selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Permission :</span>
            <Select value={sharePermission} onValueChange={(v) => setSharePermission(v as 'view' | 'edit')}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">Lecture</SelectItem>
                <SelectItem value="edit">Édition</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {shareMode === 'individual' ? (
            <div className="space-y-3">
              {/* Selected users chips */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedUsers.map(user => (
                    <Badge key={user.id} variant="secondary" className="flex items-center gap-1 pr-1">
                      <span className="text-xs">{user.first_name} {user.last_name}</span>
                      <button onClick={() => handleRemoveSelected(user.id)} className="hover:bg-muted rounded-full p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Search input with autocomplete */}
              <div ref={searchRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={inputRef}
                    placeholder="Rechercher par nom, prénom ou email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && suggestions.length === 0 && searchQuery.includes('@')) {
                        handleShareIndividual();
                      }
                    }}
                    className="pl-9"
                  />
                </div>

                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.map(user => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent text-left transition-colors"
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-medium text-primary">
                            {user.first_name[0]}{user.last_name[0]}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{user.first_name} {user.last_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        {user.role && (
                          <Badge variant="outline" className="text-[10px] shrink-0">{user.role}</Badge>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {showSuggestions && isSearching && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg p-3">
                    <p className="text-sm text-muted-foreground text-center">Recherche en cours...</p>
                  </div>
                )}
              </div>

              <Button onClick={handleShareIndividual} disabled={selectedUsers.length === 0 && !searchQuery.trim()} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                {selectedUsers.length > 0
                  ? `Partager avec ${selectedUsers.length} utilisateur${selectedUsers.length > 1 ? 's' : ''}`
                  : 'Partager'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Select value={selectedFormationId} onValueChange={setSelectedFormationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une formation..." />
                </SelectTrigger>
                <SelectContent>
                  {formations.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        {f.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={handleShareWithClass} disabled={!selectedFormationId} className="w-full">
                <Users className="h-4 w-4 mr-2" /> Partager avec toute la classe
              </Button>
            </div>
          )}

          {/* Existing shares */}
          {shares.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">Partagé avec ({shares.length})</h4>
              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {shares.map(share => (
                  <div key={share.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{sharesUsers[share.shared_with_id] || share.shared_with_id}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {share.permission === 'edit' ? 'Édition' : 'Lecture'}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleRemoveShare(share.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDocumentModal;
