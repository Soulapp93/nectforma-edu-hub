import React, { useState, useCallback, useRef, useEffect } from 'react';
import { WorkspaceDocument } from '@/services/workspaceService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  ArrowLeft, Save, Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Heading1, Heading2, Heading3,
  Undo2, Redo2, Link, Image, Code, Quote, Minus,
  Type, Palette
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
  const [title, setTitle] = useState(doc.title);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (editorRef.current && doc.content?.html) {
      editorRef.current.innerHTML = doc.content.html;
    }
  }, []);

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
      });
      toast.success('Document sauvegardé');
    } catch {
      toast.error('Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  }, [doc, title, onSave]);

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
        <span className="text-xs text-muted-foreground hidden sm:block">
          {saving ? 'Sauvegarde...' : 'Auto-sauvegarde activée'}
        </span>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
          <Save className="h-4 w-4" /> Sauvegarder
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-0.5 px-4 py-1.5 border-b bg-card/50 overflow-x-auto">
        <ToolbarButton onClick={() => execCommand('undo')} title="Annuler"><Undo2 className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand('redo')} title="Rétablir"><Redo2 className="h-4 w-4" /></ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />

        {/* Font size */}
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

        {/* Text color */}
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

      {/* Editor area */}
      <div className="flex-1 overflow-auto bg-muted/20 flex justify-center py-8 px-4">
        <div className="w-full max-w-[816px] min-h-[1056px] bg-white dark:bg-card shadow-lg rounded-sm p-16 border">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleAutoSave}
            className="outline-none min-h-full prose prose-sm max-w-none dark:prose-invert
              [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4
              [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3
              [&_h3]:text-xl [&_h3]:font-medium [&_h3]:mb-2
              [&_p]:mb-2 [&_p]:leading-relaxed
              [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
              [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-sm
              [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6
              [&_a]:text-primary [&_a]:underline
              [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-4
              [&_hr]:my-6 [&_hr]:border-border"
            style={{ fontSize: '14px', lineHeight: '1.7' }}
          />
        </div>
      </div>
    </div>
  );
};

export default WorkspaceTextEditor;
