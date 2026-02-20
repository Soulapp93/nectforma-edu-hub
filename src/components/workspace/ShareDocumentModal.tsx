import React, { useState, useCallback, useEffect } from 'react';
import { workspaceService } from '@/services/workspaceService';
import { supabase } from '@/integrations/supabase/client';
import { useMyContext } from '@/hooks/useMyContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Share2, Users, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface ShareDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  userId: string;
}

const ShareDocumentModal: React.FC<ShareDocumentModalProps> = ({ open, onOpenChange, documentId, userId }) => {
  const { establishment } = useMyContext();
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'view' | 'edit'>('edit');
  const [shares, setShares] = useState<any[]>([]);
  const [sharesUsers, setSharesUsers] = useState<Record<string, string>>({});

  const loadShares = useCallback(async () => {
    try {
      const data = await workspaceService.getDocumentShares(documentId);
      setShares(data);
      if (data.length > 0) {
        const userIds = [...new Set(data.map((s: any) => s.shared_with_id))];
        const { data: users } = await (supabase as any)
          .from('users').select('id, first_name, last_name, email').in('id', userIds);
        if (users) {
          const map: Record<string, string> = {};
          users.forEach((u: any) => { map[u.id] = `${u.first_name} ${u.last_name} (${u.email})`; });
          setSharesUsers(map);
        }
      }
    } catch { /* ignore */ }
  }, [documentId]);

  useEffect(() => { if (open) loadShares(); }, [open, loadShares]);

  const handleShare = async () => {
    if (!shareEmail.trim() || !userId) return;
    try {
      const { data: users } = await (supabase as any)
        .from('users').select('id').eq('email', shareEmail.trim()).eq('establishment_id', establishment?.id);
      let targetUserId = users?.[0]?.id;
      if (!targetUserId) {
        const { data: tutors } = await (supabase as any)
          .from('tutors').select('id').eq('email', shareEmail.trim()).eq('establishment_id', establishment?.id);
        targetUserId = tutors?.[0]?.id;
      }
      if (!targetUserId) { toast.error('Utilisateur non trouvé'); return; }
      if (targetUserId === userId) { toast.error('Vous ne pouvez pas partager avec vous-même'); return; }
      await workspaceService.shareDocument(documentId, targetUserId, userId, sharePermission);
      setShareEmail('');
      loadShares();
      toast.success('Document partagé');
    } catch { toast.error('Erreur lors du partage'); }
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" /> Partager le document
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex gap-2">
            <Input
              placeholder="Email de l'utilisateur"
              value={shareEmail}
              onChange={e => setShareEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleShare()}
              className="flex-1"
            />
            <Select value={sharePermission} onValueChange={(v) => setSharePermission(v as 'view' | 'edit')}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">Lecture</SelectItem>
                <SelectItem value="edit">Édition</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleShare} size="icon">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
          {shares.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Partagé avec</h4>
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDocumentModal;
