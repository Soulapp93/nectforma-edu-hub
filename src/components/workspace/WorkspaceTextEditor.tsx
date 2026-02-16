import React, { useState, useCallback, useRef, useEffect } from 'react';
import { WorkspaceDocument, workspaceService } from '@/services/workspaceService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMyContext } from '@/hooks/useMyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft, Save, Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Heading1, Heading2, Heading3,
  Undo2, Redo2, Link, Image, Code, Quote, Minus,
  Type, Palette, Share2, Users, Trash2, UserPlus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props {
  document: WorkspaceDocument;
  onSave: (doc: WorkspaceDocument) => Promise<void>;
  onClose: () => void;
}

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'];
const COLORS = ['#000000', '#374151', '#6B7280', '#DC2626', '#EA580C', '#D97706', '#16A34A', '#2563EB', '#7C3AED', '#DB2777'];

const WorkspaceTextEditor: React.FC<Props> = ({ document: doc, onSave, onClose }) => {
  const { userId } = useCurrentUser();
  const { establishment } = useMyContext();
  const [title, setTitle] = useState(doc.title);
  const [saving, setSaving] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'view' | 'edit'>('edit');
  const [shares, setShares] = useState<any[]>([]);
  const [sharesUsers, setSharesUsers] = useState<Record<string, string>>({});
  const editorRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (editorRef.current && doc.content?.html) {
      editorRef.current.innerHTML = doc.content.html;
    }
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = workspaceService.subscribeToDocument(doc.id, (payload) => {
      if (payload.new && payload.new.content?.html && editorRef.current) {
        // Only update if change came from someone else
        if (payload.new.last_edited_by && payload.new.last_edited_by !== userId) {
          const currentScroll = editorRef.current.scrollTop;
          editorRef.current.innerHTML = payload.new.content.html;
          editorRef.current.scrollTop = currentScroll;
          if (payload.new.title !== title) setTitle(payload.new.title);
          toast.info('Document mis à jour par un collaborateur');
        }
      }
    });
    return () => { supabase.removeChannel(channel); };
  }, [doc.id, userId]);

  const execCommand = (command: string, value?: string) => {
    window.document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleSave = useCallback(async () => {
    if (!editorRef.current) return;
    setSaving(true);
    try {
      await onSave({
        ...doc,
        title,
        content: { html: editorRef.current.innerHTML },
        last_edited_by: userId || null,
      });
      toast.success('Document sauvegardé');
    } catch {
      toast.error('Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  }, [doc, title, onSave, userId]);

  const handleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      handleSave();
    }, 3000);
  }, [handleSave]);

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  const insertLink = () => {
    const url = prompt('URL du lien :');
    if (url) execCommand('createLink', url);
  };

  const insertImage = () => {
    const url = prompt("URL de l'image :");
    if (url) execCommand('insertImage', url);
  };

  // Share functions
  const loadShares = useCallback(async () => {
    try {
      const data = await workspaceService.getDocumentShares(doc.id);
      setShares(data);
      // Fetch user names for shares
      if (data.length > 0) {
        const userIds = [...new Set(data.map((s: any) => s.shared_with_id))];
        const { data: users } = await (supabase as any)
          .from('users')
          .select('id, first_name, last_name, email')
          .in('id', userIds);
        if (users) {
          const map: Record<string, string> = {};
          users.forEach((u: any) => { map[u.id] = `${u.first_name} ${u.last_name} (${u.email})`; });
          setSharesUsers(map);
        }
      }
    } catch { /* ignore */ }
  }, [doc.id]);

  useEffect(() => { if (showShareModal) loadShares(); }, [showShareModal, loadShares]);

  const handleShare = async () => {
    if (!shareEmail.trim() || !userId) return;
    try {
      // Find user by email in same establishment
      const { data: users } = await (supabase as any)
        .from('users')
        .select('id, first_name, last_name')
        .eq('email', shareEmail.trim())
        .eq('establishment_id', establishment?.id);

      let targetUserId: string | null = null;
      if (users && users.length > 0) {
        targetUserId = users[0].id;
      } else {
        // Check tutors table
        const { data: tutors } = await (supabase as any)
          .from('tutors')
          .select('id, first_name, last_name')
          .eq('email', shareEmail.trim())
          .eq('establishment_id', establishment?.id);
        if (tutors && tutors.length > 0) {
          targetUserId = tutors[0].id;
        }
      }

      if (!targetUserId) {
        toast.error('Utilisateur non trouvé dans votre établissement');
        return;
      }

      if (targetUserId === userId) {
        toast.error('Vous ne pouvez pas partager avec vous-même');
        return;
      }

      await workspaceService.shareDocument(doc.id, targetUserId, userId, sharePermission);
      setShareEmail('');
      loadShares();
      toast.success('Document partagé avec succès');
    } catch (err) {
      toast.error('Erreur lors du partage');
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      await workspaceService.removeShare(shareId);
      loadShares();
      toast.success('Partage supprimé');
    } catch {
      toast.error('Erreur');
    }
  };

  const isOwner = doc.owner_id === userId;

  const ToolbarButton = ({ onClick, active, children, title: t }: { onClick: () => void; active?: boolean; children: React.ReactNode; title?: string }) => (
    <button
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className={`p-1.5 rounded-md transition-colors ${active ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'}`}
      title={t}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="max-w-md border-none shadow-none text-lg font-semibold focus-visible:ring-0 px-1"
          placeholder="Titre du document"
        />
        <div className="flex-1" />
        {doc.is_shared && (
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" /> Partagé
          </Badge>
        )}
        <span className="text-xs text-muted-foreground hidden sm:block">
          {saving ? 'Sauvegarde...' : 'Auto-sauvegarde activée'}
        </span>
        {isOwner && (
          <Button size="sm" variant="outline" onClick={() => setShowShareModal(true)} className="gap-1.5">
            <Share2 className="h-4 w-4" /> Partager
          </Button>
        )}
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
          <Save className="h-4 w-4" /> Sauvegarder
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-0.5 px-4 py-1.5 border-b bg-card/50 overflow-x-auto">
        <ToolbarButton onClick={() => execCommand('undo')} title="Annuler"><Undo2 className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand('redo')} title="Rétablir"><Redo2 className="h-4 w-4" /></ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-muted text-sm">
              <Type className="h-4 w-4" /> Taille
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {FONT_SIZES.map(size => (
              <DropdownMenuItem key={size} onClick={() => execCommand('fontSize', '7')} style={{ fontSize: size }}>
                {size}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton onClick={() => execCommand('bold')} title="Gras"><Bold className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand('italic')} title="Italique"><Italic className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand('underline')} title="Souligné"><Underline className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand('strikeThrough')} title="Barré"><Strikethrough className="h-4 w-4" /></ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-muted text-sm">
              <Palette className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <div className="grid grid-cols-5 gap-1 p-2">
              {COLORS.map(color => (
                <button key={color} onClick={() => execCommand('foreColor', color)} className="w-6 h-6 rounded-full border" style={{ backgroundColor: color }} />
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton onClick={() => execCommand('formatBlock', '<h1>')} title="Titre 1"><Heading1 className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand('formatBlock', '<h2>')} title="Titre 2"><Heading2 className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand('formatBlock', '<h3>')} title="Titre 3"><Heading3 className="h-4 w-4" /></ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton onClick={() => execCommand('justifyLeft')} title="Gauche"><AlignLeft className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand('justifyCenter')} title="Centrer"><AlignCenter className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand('justifyRight')} title="Droite"><AlignRight className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand('justifyFull')} title="Justifier"><AlignJustify className="h-4 w-4" /></ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton onClick={() => execCommand('insertUnorderedList')} title="Liste"><List className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand('insertOrderedList')} title="Liste numérotée"><ListOrdered className="h-4 w-4" /></ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton onClick={insertLink} title="Lien"><Link className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={insertImage} title="Image"><Image className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand('formatBlock', '<blockquote>')} title="Citation"><Quote className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand('insertHorizontalRule')} title="Ligne horizontale"><Minus className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand('formatBlock', '<pre>')} title="Code"><Code className="h-4 w-4" /></ToolbarButton>
      </div>

      {/* Editor area - Word-like paginated view */}
      <div className="flex-1 overflow-auto bg-muted/30 py-8 px-4">
        <div className="flex flex-col items-center gap-8">
          <div
            className="word-page bg-white dark:bg-card shadow-[0_2px_10px_rgba(0,0,0,0.12)] border border-border/40"
            style={{
              width: '816px',
              maxWidth: '100%',
              minHeight: '1056px',
              padding: '96px 72px',
              position: 'relative',
              boxSizing: 'border-box',
            }}
          >
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleAutoSave}
              className="outline-none prose prose-sm max-w-none dark:prose-invert
                [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-2
                [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-2
                [&_h3]:text-xl [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:mt-1
                [&_p]:mb-2 [&_p]:leading-relaxed
                [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
                [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-sm [&_pre]:whitespace-pre-wrap
                [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6
                [&_a]:text-primary [&_a]:underline
                [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-4
                [&_hr]:my-6 [&_hr]:border-border
                [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:p-2
                [&_div]:mb-1"
              style={{
                fontSize: '14px',
                lineHeight: '1.7',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                minHeight: 'calc(1056px - 192px)',
                columnFill: 'auto',
              }}
            />
          </div>
        </div>
        {/* CSS for Word-like pagination on print and visual page breaks */}
        <style>{`
          .word-page {
            break-after: page;
          }
          @media print {
            .word-page {
              page-break-after: always;
              box-shadow: none !important;
              border: none !important;
              margin: 0 !important;
              padding: 2.54cm !important;
            }
          }
          [contenteditable] hr {
            page-break-after: always;
            break-after: page;
          }
        `}</style>
      </div>

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
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
    </div>
  );
};

export default WorkspaceTextEditor;
