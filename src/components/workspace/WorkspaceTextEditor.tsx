import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { WorkspaceDocument, workspaceService } from '@/services/workspaceService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { fileImportService } from '@/services/fileImportService';
import { useMyContext } from '@/hooks/useMyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft, Save, Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Undo2, Redo2, Link, Image, Code, Quote, Minus,
  Type, Palette, Share2, Users, Trash2, UserPlus, Printer,
  Search, Replace, Table, Indent, Outdent, Superscript, Subscript,
  Highlighter, ZoomIn, ZoomOut, FileDown, ChevronDown, MoreHorizontal,
  PaintBucket, Pilcrow, Heading1, Heading2, Heading3, Heading4,
  RemoveFormatting, Copy, Clipboard, Scissors, RotateCcw, RotateCw,
  Maximize, SpellCheck, ListChecks, SeparatorHorizontal, Upload
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';

interface Props {
  document: WorkspaceDocument;
  onSave: (doc: WorkspaceDocument) => Promise<void>;
  onClose: () => void;
}

const FONT_FAMILIES = [
  'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  'Trebuchet MS', 'Garamond', 'Comic Sans MS', 'Impact', 'Lucida Console',
  'Tahoma', 'Palatino Linotype', 'Century Gothic', 'Bookman Old Style',
  'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Raleway',
];

const FONT_SIZES = [
  { label: '8', value: '1' },
  { label: '10', value: '2' },
  { label: '12', value: '3' },
  { label: '14', value: '4' },
  { label: '18', value: '5' },
  { label: '24', value: '6' },
  { label: '36', value: '7' },
];

const COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF',
  '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF',
  '#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC',
  '#DD7E6B', '#EA9999', '#F9CB9C', '#FFE599', '#B6D7A8', '#A2C4C9', '#A4C2F4', '#9FC5E8', '#B4A7D6', '#D5A6BD',
  '#CC4125', '#E06666', '#F6B26B', '#FFD966', '#93C47D', '#76A5AF', '#6D9EEB', '#6FA8DC', '#8E7CC3', '#C27BA0',
  '#A61C00', '#CC0000', '#E69138', '#F1C232', '#6AA84F', '#45818E', '#3C78D8', '#3D85C6', '#674EA7', '#A64D79',
  '#85200C', '#990000', '#B45F06', '#BF9000', '#38761D', '#134F5C', '#1155CC', '#0B5394', '#351C75', '#741B47',
  '#5B0F00', '#660000', '#783F04', '#7F6000', '#274E13', '#0C343D', '#1C4587', '#073763', '#20124D', '#4C1130',
];

const LINE_SPACINGS = [
  { label: 'Simple', value: '1' },
  { label: '1,15', value: '1.15' },
  { label: '1,5', value: '1.5' },
  { label: 'Double', value: '2' },
  { label: '2,5', value: '2.5' },
  { label: 'Triple', value: '3' },
];

const HEADING_OPTIONS = [
  { label: 'Texte normal', tag: 'p' },
  { label: 'Titre 1', tag: 'h1' },
  { label: 'Titre 2', tag: 'h2' },
  { label: 'Titre 3', tag: 'h3' },
  { label: 'Titre 4', tag: 'h4' },
  { label: 'Titre 5', tag: 'h5' },
  { label: 'Titre 6', tag: 'h6' },
];

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [importingFile, setImportingFile] = useState(false);

  // UI state
  const [zoom, setZoom] = useState(100);
  const [currentFont, setCurrentFont] = useState('Arial');
  const [currentSize, setCurrentSize] = useState('3');
  const [currentHeading, setCurrentHeading] = useState('p');
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [wordCount, setWordCount] = useState({ words: 0, chars: 0, pages: 1 });
  const [showRuler, setShowRuler] = useState(true);
  const [lineSpacing, setLineSpacing] = useState('1.15');
  const [showWordCount, setShowWordCount] = useState(true);

  // Ruler indent state (in cm, page width = 21cm)
  const [leftIndent, setLeftIndent] = useState(1.5); // marge gauche
  const [rightIndent, setRightIndent] = useState(1.5); // marge droite
  const [firstLineIndent, setFirstLineIndent] = useState(0); // retrait première ligne (relatif à leftIndent)
  const rulerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && doc.content?.html) {
      editorRef.current.innerHTML = doc.content.html;
      updateWordCount();
    }
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = workspaceService.subscribeToDocument(doc.id, (payload) => {
      if (payload.new && payload.new.content?.html && editorRef.current) {
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

  const execCommand = useCallback((command: string, value?: string) => {
    window.document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateSelectionState();
  }, []);

  const updateWordCount = useCallback(() => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const pages = Math.max(1, Math.ceil((editorRef.current.scrollHeight || 1) / 1056));
    setWordCount({ words, chars, pages });
  }, []);

  const updateSelectionState = useCallback(() => {
    try {
      const font = window.document.queryCommandValue('fontName')?.replace(/["']/g, '') || 'Arial';
      const size = window.document.queryCommandValue('fontSize') || '3';
      setCurrentFont(font);
      setCurrentSize(size);

      const block = window.document.queryCommandValue('formatBlock');
      if (block) {
        const tag = block.toLowerCase().replace(/[<>]/g, '');
        setCurrentHeading(tag || 'p');
      }
    } catch { /* ignore */ }
  }, []);

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
    updateWordCount();
    updateSelectionState();
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      handleSave();
    }, 3000);
  }, [handleSave, updateWordCount, updateSelectionState]);

  useEffect(() => {
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setShowFindReplace(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowFindReplace(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  // Selection change tracker
  useEffect(() => {
    const handler = () => updateSelectionState();
    window.document.addEventListener('selectionchange', handler);
    return () => window.document.removeEventListener('selectionchange', handler);
  }, [updateSelectionState]);

  const insertLink = () => {
    const url = prompt('URL du lien :');
    if (url) execCommand('createLink', url);
  };

  const insertImageFromUrl = () => {
    const url = prompt("URL de l'image :");
    if (url) execCommand('insertImage', url);
  };

  const insertImageFromFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        execCommand('insertImage', reader.result as string);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const insertTable = (rows: number, cols: number) => {
    let html = '<table style="width:100%;border-collapse:collapse;margin:12px 0;">';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        const tag = r === 0 ? 'th' : 'td';
        html += `<${tag} style="border:1px solid #d1d5db;padding:8px 12px;min-width:80px;${r === 0 ? 'background:#f3f4f6;font-weight:600;' : ''}">${r === 0 ? `Col ${c + 1}` : '&nbsp;'}</${tag}>`;
      }
      html += '</tr>';
    }
    html += '</table><p><br></p>';
    window.document.execCommand('insertHTML', false, html);
    editorRef.current?.focus();
  };

  const insertCheckList = () => {
    const html = `
      <div style="display:flex;align-items:flex-start;gap:8px;margin:4px 0;">
        <input type="checkbox" style="margin-top:4px;cursor:pointer;width:16px;height:16px;" />
        <span>Élément de la liste</span>
      </div>`;
    window.document.execCommand('insertHTML', false, html);
    editorRef.current?.focus();
  };

  const setLineSpacingValue = (value: string) => {
    setLineSpacing(value);
    if (editorRef.current) {
      editorRef.current.style.lineHeight = value;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // Use print dialog as PDF export
    window.print();
  };

  const handleFind = () => {
    if (!findText || !editorRef.current) return;
    const selection = window.getSelection();
    if (!selection) return;
    
    // Clear previous highlights
    const content = editorRef.current.innerHTML;
    const cleaned = content.replace(/<mark class="find-highlight"[^>]*>(.*?)<\/mark>/g, '$1');
    
    // Highlight matches
    if (findText.trim()) {
      const regex = new RegExp(`(${findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const highlighted = cleaned.replace(regex, '<mark class="find-highlight" style="background:#FBBC04;padding:0 1px;border-radius:2px;">$1</mark>');
      editorRef.current.innerHTML = highlighted;
    } else {
      editorRef.current.innerHTML = cleaned;
    }
  };

  const handleReplace = () => {
    if (!editorRef.current || !findText) return;
    const content = editorRef.current.innerHTML;
    const cleaned = content.replace(/<mark class="find-highlight"[^>]*>(.*?)<\/mark>/g, '$1');
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    editorRef.current.innerHTML = cleaned.replace(regex, replaceText);
    handleFind();
  };

  const handleReplaceAll = () => {
    if (!editorRef.current || !findText) return;
    const content = editorRef.current.innerHTML;
    const cleaned = content.replace(/<mark class="find-highlight"[^>]*>(.*?)<\/mark>/g, '$1');
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    editorRef.current.innerHTML = cleaned.replace(regex, replaceText);
    toast.success('Toutes les occurrences remplacées');
  };

  const closeFindReplace = () => {
    setShowFindReplace(false);
    if (editorRef.current) {
      editorRef.current.innerHTML = editorRef.current.innerHTML.replace(
        /<mark class="find-highlight"[^>]*>(.*?)<\/mark>/g, '$1'
      );
    }
  };

  const clearFormatting = () => {
    execCommand('removeFormat');
    execCommand('formatBlock', '<p>');
  };

  const insertPageBreak = () => {
    const html = '<div style="page-break-after:always;border-bottom:2px dashed #d1d5db;margin:24px 0;"></div><p><br></p>';
    window.document.execCommand('insertHTML', false, html);
    editorRef.current?.focus();
  };

  const insertDate = () => {
    const date = new Date().toLocaleDateString('fr-FR', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    window.document.execCommand('insertText', false, date);
    editorRef.current?.focus();
  };

  const handleImportDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportingFile(true);
    try {
      const result = await fileImportService.importDocx(file);
      if (editorRef.current) {
        editorRef.current.innerHTML = result.html;
        updateWordCount();
        handleAutoSave();
        toast.success(`"${file.name}" importé avec succès`);
      }
    } catch (err: any) {
      toast.error(`Erreur d'import: ${err?.message || 'Erreur'}`);
    } finally {
      setImportingFile(false);
      if (importFileRef.current) importFileRef.current.value = '';
    }
  };

  // Share functions
  const loadShares = useCallback(async () => {
    try {
      const data = await workspaceService.getDocumentShares(doc.id);
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
  }, [doc.id]);

  useEffect(() => { if (showShareModal) loadShares(); }, [showShareModal, loadShares]);

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
      await workspaceService.shareDocument(doc.id, targetUserId, userId, sharePermission);
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

  const isOwner = doc.owner_id === userId;

  // Tiny toolbar button
  const TB = ({ onClick, active, children, title: t }: { onClick: () => void; active?: boolean; children: React.ReactNode; title?: string }) => (
    <button
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className={`p-1 rounded transition-colors ${active ? 'bg-primary/15 text-primary' : 'hover:bg-muted text-foreground/80'}`}
      title={t}
      type="button"
    >
      {children}
    </button>
  );

  // Color picker grid
  const ColorPicker = ({ onSelect, title: t }: { onSelect: (c: string) => void; title: string }) => (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-1 rounded hover:bg-muted text-foreground/80 transition-colors" title={t} type="button">
          {t === 'Couleur du texte' ? <Type className="h-3.5 w-3.5" /> : <Highlighter className="h-3.5 w-3.5" />}
          <div className="h-0.5 w-3.5 mx-auto mt-px rounded" style={{ backgroundColor: t === 'Couleur du texte' ? '#000' : '#FBBC04' }} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="grid grid-cols-10 gap-0.5">
          {COLORS.map(c => (
            <button
              key={c}
              className="w-5 h-5 rounded-sm border border-border/50 hover:scale-125 transition-transform"
              style={{ backgroundColor: c }}
              onClick={() => onSelect(c)}
              type="button"
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );

  // Store targeted blocks so ruler drag doesn't lose them when focus moves
  const targetBlocksRef = useRef<Set<HTMLElement>>(new Set());

  // Capture selected blocks from current selection
  const captureSelectedBlocks = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) return;
    const range = sel.getRangeAt(0);
    const container = editorRef.current;
    if (!container.contains(range.startContainer)) return;

    const getBlockParent = (node: Node): HTMLElement | null => {
      let current: Node | null = node;
      while (current && current !== container) {
        if (current instanceof HTMLElement) {
          const display = window.getComputedStyle(current).display;
          if (display === 'block' || display === 'list-item') return current;
        }
        current = current.parentNode;
      }
      return null;
    };

    const startBlock = getBlockParent(range.startContainer);
    const endBlock = getBlockParent(range.endContainer);
    const blocks = new Set<HTMLElement>();
    if (startBlock) blocks.add(startBlock);
    if (endBlock) blocks.add(endBlock);

    if (startBlock && endBlock && startBlock !== endBlock) {
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
        acceptNode: (node) => {
          if (node instanceof HTMLElement) {
            const display = window.getComputedStyle(node).display;
            if ((display === 'block' || display === 'list-item') && node.parentElement === container) {
              return NodeFilter.FILTER_ACCEPT;
            }
          }
          return NodeFilter.FILTER_SKIP;
        }
      });
      let inRange = false;
      let current = walker.nextNode();
      while (current) {
        if (current === startBlock) inRange = true;
        if (inRange && current instanceof HTMLElement) blocks.add(current);
        if (current === endBlock) break;
        current = walker.nextNode();
      }
    }

    if (blocks.size > 0) {
      targetBlocksRef.current = blocks;
    }
  }, []);

  // Apply indents to the saved target blocks
  const applyIndentsToTargetBlocks = useCallback((li: number, ri: number, fli: number) => {
    const pxPerCm = 816 / 21;
    const blocks = targetBlocksRef.current;
    if (blocks.size === 0) return;
    blocks.forEach(block => {
      block.style.marginLeft = `${li * pxPerCm}px`;
      block.style.marginRight = `${ri * pxPerCm}px`;
      block.style.textIndent = `${fli * pxPerCm}px`;
    });
  }, []);

  const RULER_PAGE_WIDTH_CM = 21;

  const handleRulerDrag = useCallback((type: 'left' | 'right' | 'firstLine', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Capture the currently selected blocks BEFORE focus is lost
    captureSelectedBlocks();

    const rulerEl = rulerRef.current;
    if (!rulerEl) return;

    const startX = e.clientX;
    const startValue = type === 'left' ? leftIndent : type === 'right' ? rightIndent : firstLineIndent;
    const rulerRect = rulerEl.getBoundingClientRect();
    const pxPerCm = rulerRect.width / RULER_PAGE_WIDTH_CM;

    let currentLeft = leftIndent;
    let currentRight = rightIndent;
    let currentFirst = firstLineIndent;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      let newVal: number;

      if (type === 'right') {
        newVal = Math.max(0, Math.min(RULER_PAGE_WIDTH_CM / 2, startValue - dx / pxPerCm));
      } else if (type === 'left') {
        newVal = Math.max(0, Math.min(RULER_PAGE_WIDTH_CM / 2, startValue + dx / pxPerCm));
      } else {
        newVal = Math.max(-5, Math.min(10, startValue + dx / pxPerCm));
      }
      newVal = Math.round(newVal * 4) / 4;

      if (type === 'left') { currentLeft = newVal; setLeftIndent(newVal); }
      else if (type === 'right') { currentRight = newVal; setRightIndent(newVal); }
      else { currentFirst = newVal; setFirstLineIndent(newVal); }

      // Apply in real-time to saved blocks
      applyIndentsToTargetBlocks(currentLeft, currentRight, currentFirst);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [leftIndent, rightIndent, firstLineIndent, captureSelectedBlocks, applyIndentsToTargetBlocks]);

  const rulerMarks = useMemo(() => {
    const marks = [];
    for (let i = 0; i <= 21; i++) {
      marks.push(
        <React.Fragment key={i}>
          {/* Main number */}
          <div className="absolute select-none flex flex-col items-center" style={{ left: `${(i / 21) * 100}%`, transform: 'translateX(-50%)', top: 0, height: '100%' }}>
            <span className="text-[8px] text-muted-foreground/70 leading-none mt-px">{i}</span>
            <div className="w-px h-1.5 bg-muted-foreground/40 mt-auto" />
          </div>
          {/* Half marks */}
          {i < 21 && (
            <div className="absolute" style={{ left: `${((i + 0.5) / 21) * 100}%`, bottom: 0, transform: 'translateX(-50%)' }}>
              <div className="w-px h-1 bg-muted-foreground/25" />
            </div>
          )}
          {/* Quarter marks */}
          {i < 21 && [0.25, 0.75].map(q => (
            <div key={q} className="absolute" style={{ left: `${((i + q) / 21) * 100}%`, bottom: 0, transform: 'translateX(-50%)' }}>
              <div className="w-px h-0.5 bg-muted-foreground/15" />
            </div>
          ))}
        </React.Fragment>
      );
    }
    return marks;
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background print:h-auto print:overflow-visible">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
      <input ref={importFileRef} type="file" accept=".docx,.doc" className="hidden" onChange={handleImportDocx} />

      {/* Google Docs style menu bar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b bg-card print:hidden">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="max-w-xs border-none shadow-none text-base font-semibold focus-visible:ring-0 px-1 h-8"
          placeholder="Sans titre"
        />
        <div className="flex-1" />
        {doc.is_shared && (
          <Badge variant="secondary" className="gap-1 text-xs h-6">
            <Users className="h-3 w-3" /> Partagé
          </Badge>
        )}
        <span className="text-[11px] text-muted-foreground hidden sm:block">
          {saving ? 'Enregistrement...' : '✓ Enregistré'}
        </span>
        {isOwner && (
          <Button size="sm" variant="outline" onClick={() => setShowShareModal(true)} className="gap-1 h-7 text-xs">
            <Share2 className="h-3.5 w-3.5" /> Partager
          </Button>
        )}
      </div>

      {/* Menu bar - Google Docs style */}
      <div className="flex items-center gap-0.5 px-3 py-0.5 border-b bg-card text-xs print:hidden">
        {/* Fichier */}
        <DropdownMenu>
          <DropdownMenuTrigger className="px-2 py-1 rounded hover:bg-muted transition-colors">Fichier</DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[200px]">
            <DropdownMenuItem onClick={handleSave}><Save className="h-3.5 w-3.5 mr-2" />Enregistrer <span className="ml-auto text-muted-foreground text-[10px]">Ctrl+S</span></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => importFileRef.current?.click()} disabled={importingFile}>
              <Upload className="h-3.5 w-3.5 mr-2" />{importingFile ? 'Import en cours...' : 'Importer un fichier Word'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handlePrint}><Printer className="h-3.5 w-3.5 mr-2" />Imprimer <span className="ml-auto text-muted-foreground text-[10px]">Ctrl+P</span></DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF}><FileDown className="h-3.5 w-3.5 mr-2" />Exporter en PDF</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onClose}><ArrowLeft className="h-3.5 w-3.5 mr-2" />Fermer</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Édition */}
        <DropdownMenu>
          <DropdownMenuTrigger className="px-2 py-1 rounded hover:bg-muted transition-colors">Édition</DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[200px]">
            <DropdownMenuItem onClick={() => execCommand('undo')}><Undo2 className="h-3.5 w-3.5 mr-2" />Annuler <span className="ml-auto text-muted-foreground text-[10px]">Ctrl+Z</span></DropdownMenuItem>
            <DropdownMenuItem onClick={() => execCommand('redo')}><Redo2 className="h-3.5 w-3.5 mr-2" />Rétablir <span className="ml-auto text-muted-foreground text-[10px]">Ctrl+Y</span></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => execCommand('cut')}><Scissors className="h-3.5 w-3.5 mr-2" />Couper <span className="ml-auto text-muted-foreground text-[10px]">Ctrl+X</span></DropdownMenuItem>
            <DropdownMenuItem onClick={() => execCommand('copy')}><Copy className="h-3.5 w-3.5 mr-2" />Copier <span className="ml-auto text-muted-foreground text-[10px]">Ctrl+C</span></DropdownMenuItem>
            <DropdownMenuItem onClick={() => execCommand('paste')}><Clipboard className="h-3.5 w-3.5 mr-2" />Coller <span className="ml-auto text-muted-foreground text-[10px]">Ctrl+V</span></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowFindReplace(true)}><Search className="h-3.5 w-3.5 mr-2" />Rechercher et remplacer <span className="ml-auto text-muted-foreground text-[10px]">Ctrl+H</span></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => execCommand('selectAll')}>Tout sélectionner <span className="ml-auto text-muted-foreground text-[10px]">Ctrl+A</span></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Affichage */}
        <DropdownMenu>
          <DropdownMenuTrigger className="px-2 py-1 rounded hover:bg-muted transition-colors">Affichage</DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[200px]">
            <DropdownMenuItem onClick={() => setShowRuler(!showRuler)}>
              {showRuler ? '✓ ' : '  '}Règle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowWordCount(!showWordCount)}>
              {showWordCount ? '✓ ' : '  '}Compteur de mots
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><ZoomIn className="h-3.5 w-3.5 mr-2" />Zoom</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {[50, 75, 90, 100, 110, 125, 150, 200].map(z => (
                  <DropdownMenuItem key={z} onClick={() => setZoom(z)}>{zoom === z ? '✓ ' : '  '}{z}%</DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { if (editorRef.current) editorRef.current.requestFullscreen?.(); }}>
              <Maximize className="h-3.5 w-3.5 mr-2" />Plein écran
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Insertion */}
        <DropdownMenu>
          <DropdownMenuTrigger className="px-2 py-1 rounded hover:bg-muted transition-colors">Insertion</DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[200px]">
            <DropdownMenuItem onClick={insertImageFromFile}><Image className="h-3.5 w-3.5 mr-2" />Image (fichier)</DropdownMenuItem>
            <DropdownMenuItem onClick={insertImageFromUrl}><Image className="h-3.5 w-3.5 mr-2" />Image (URL)</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><Table className="h-3.5 w-3.5 mr-2" />Tableau</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <div className="p-2">
                  <p className="text-xs text-muted-foreground mb-2">Taille du tableau</p>
                  <div className="grid grid-cols-5 gap-0.5">
                    {[1,2,3,4,5].map(r => [1,2,3,4,5].map(c => (
                      <button
                        key={`${r}-${c}`}
                        className="w-6 h-6 border border-border rounded-sm hover:bg-primary/20 transition-colors text-[9px]"
                        onClick={() => insertTable(r, c)}
                        title={`${r}×${c}`}
                        type="button"
                      />
                    )))}
                  </div>
                  <div className="mt-2 flex gap-1">
                    <button className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80" onClick={() => insertTable(3, 3)} type="button">3×3</button>
                    <button className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80" onClick={() => insertTable(5, 5)} type="button">5×5</button>
                    <button className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80" onClick={() => insertTable(10, 5)} type="button">10×5</button>
                  </div>
                </div>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={insertLink}><Link className="h-3.5 w-3.5 mr-2" />Lien</DropdownMenuItem>
            <DropdownMenuItem onClick={() => execCommand('insertHorizontalRule')}><SeparatorHorizontal className="h-3.5 w-3.5 mr-2" />Ligne horizontale</DropdownMenuItem>
            <DropdownMenuItem onClick={insertPageBreak}><Minus className="h-3.5 w-3.5 mr-2" />Saut de page</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={insertCheckList}><ListChecks className="h-3.5 w-3.5 mr-2" />Liste de tâches</DropdownMenuItem>
            <DropdownMenuItem onClick={insertDate}><Type className="h-3.5 w-3.5 mr-2" />Date du jour</DropdownMenuItem>
            <DropdownMenuItem onClick={() => { const c = prompt('Caractère spécial :'); if (c) window.document.execCommand('insertText', false, c); }}>
              Caractère spécial
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Format */}
        <DropdownMenu>
          <DropdownMenuTrigger className="px-2 py-1 rounded hover:bg-muted transition-colors">Format</DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[200px]">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Texte</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => execCommand('bold')}>Gras <span className="ml-auto text-[10px] text-muted-foreground">Ctrl+B</span></DropdownMenuItem>
                <DropdownMenuItem onClick={() => execCommand('italic')}>Italique <span className="ml-auto text-[10px] text-muted-foreground">Ctrl+I</span></DropdownMenuItem>
                <DropdownMenuItem onClick={() => execCommand('underline')}>Souligné <span className="ml-auto text-[10px] text-muted-foreground">Ctrl+U</span></DropdownMenuItem>
                <DropdownMenuItem onClick={() => execCommand('strikeThrough')}>Barré</DropdownMenuItem>
                <DropdownMenuItem onClick={() => execCommand('superscript')}>Exposant</DropdownMenuItem>
                <DropdownMenuItem onClick={() => execCommand('subscript')}>Indice</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Style de paragraphe</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {HEADING_OPTIONS.map(h => (
                  <DropdownMenuItem key={h.tag} onClick={() => execCommand('formatBlock', `<${h.tag}>`)}>{h.label}</DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Alignement</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => execCommand('justifyLeft')}>Gauche</DropdownMenuItem>
                <DropdownMenuItem onClick={() => execCommand('justifyCenter')}>Centrer</DropdownMenuItem>
                <DropdownMenuItem onClick={() => execCommand('justifyRight')}>Droite</DropdownMenuItem>
                <DropdownMenuItem onClick={() => execCommand('justifyFull')}>Justifier</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Interligne</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {LINE_SPACINGS.map(s => (
                  <DropdownMenuItem key={s.value} onClick={() => setLineSpacingValue(s.value)}>
                    {lineSpacing === s.value ? '✓ ' : '  '}{s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={clearFormatting}><RemoveFormatting className="h-3.5 w-3.5 mr-2" />Effacer la mise en forme</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Outils */}
        <DropdownMenu>
          <DropdownMenuTrigger className="px-2 py-1 rounded hover:bg-muted transition-colors">Outils</DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[200px]">
            <DropdownMenuItem onClick={() => setShowFindReplace(true)}><Search className="h-3.5 w-3.5 mr-2" />Rechercher et remplacer</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              const text = editorRef.current?.innerText || '';
              const wc = text.trim() ? text.trim().split(/\s+/).length : 0;
              toast.info(`${wc} mots · ${text.length} caractères · ~${wordCount.pages} pages`);
            }}>
              <Type className="h-3.5 w-3.5 mr-2" />Nombre de mots
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Toolbar - Google Docs style */}
      <div className="flex items-center flex-wrap gap-0.5 px-2 py-1 border-b bg-muted/30 overflow-x-auto print:hidden">
        <TB onClick={() => execCommand('undo')} title="Annuler (Ctrl+Z)"><Undo2 className="h-3.5 w-3.5" /></TB>
        <TB onClick={() => execCommand('redo')} title="Rétablir (Ctrl+Y)"><Redo2 className="h-3.5 w-3.5" /></TB>
        <TB onClick={handlePrint} title="Imprimer"><Printer className="h-3.5 w-3.5" /></TB>
        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Zoom */}
        <div className="flex items-center gap-0.5">
          <TB onClick={() => setZoom(Math.max(25, zoom - 10))} title="Zoom -"><ZoomOut className="h-3.5 w-3.5" /></TB>
          <span className="text-[11px] text-muted-foreground w-8 text-center select-none">{zoom}%</span>
          <TB onClick={() => setZoom(Math.min(200, zoom + 10))} title="Zoom +"><ZoomIn className="h-3.5 w-3.5" /></TB>
        </div>
        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Heading selector */}
        <select
          value={currentHeading}
          onChange={e => execCommand('formatBlock', `<${e.target.value}>`)}
          className="h-6 text-[11px] bg-transparent border border-border/50 rounded px-1 hover:bg-muted focus:outline-none focus:ring-1 focus:ring-primary/30 min-w-[100px]"
        >
          {HEADING_OPTIONS.map(h => (
            <option key={h.tag} value={h.tag}>{h.label}</option>
          ))}
        </select>
        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Font family */}
        <select
          value={currentFont}
          onChange={e => { setCurrentFont(e.target.value); execCommand('fontName', e.target.value); }}
          className="h-6 text-[11px] bg-transparent border border-border/50 rounded px-1 hover:bg-muted focus:outline-none focus:ring-1 focus:ring-primary/30 min-w-[110px]"
        >
          {FONT_FAMILIES.map(f => (
            <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
          ))}
        </select>
        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Font size */}
        <select
          value={currentSize}
          onChange={e => { setCurrentSize(e.target.value); execCommand('fontSize', e.target.value); }}
          className="h-6 text-[11px] bg-transparent border border-border/50 rounded px-1 hover:bg-muted focus:outline-none focus:ring-1 focus:ring-primary/30 w-12"
        >
          {FONT_SIZES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Text formatting */}
        <TB onClick={() => execCommand('bold')} title="Gras (Ctrl+B)"><Bold className="h-3.5 w-3.5" /></TB>
        <TB onClick={() => execCommand('italic')} title="Italique (Ctrl+I)"><Italic className="h-3.5 w-3.5" /></TB>
        <TB onClick={() => execCommand('underline')} title="Souligné (Ctrl+U)"><Underline className="h-3.5 w-3.5" /></TB>
        <TB onClick={() => execCommand('strikeThrough')} title="Barré"><Strikethrough className="h-3.5 w-3.5" /></TB>

        {/* Text & highlight color */}
        <ColorPicker onSelect={(c) => execCommand('foreColor', c)} title="Couleur du texte" />
        <ColorPicker onSelect={(c) => execCommand('hiliteColor', c)} title="Surlignage" />
        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Superscript / Subscript */}
        <TB onClick={() => execCommand('superscript')} title="Exposant"><Superscript className="h-3.5 w-3.5" /></TB>
        <TB onClick={() => execCommand('subscript')} title="Indice"><Subscript className="h-3.5 w-3.5" /></TB>
        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Links & Images */}
        <TB onClick={insertLink} title="Lien"><Link className="h-3.5 w-3.5" /></TB>
        <TB onClick={insertImageFromFile} title="Image"><Image className="h-3.5 w-3.5" /></TB>
        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Alignment */}
        <TB onClick={() => execCommand('justifyLeft')} title="Aligner à gauche"><AlignLeft className="h-3.5 w-3.5" /></TB>
        <TB onClick={() => execCommand('justifyCenter')} title="Centrer"><AlignCenter className="h-3.5 w-3.5" /></TB>
        <TB onClick={() => execCommand('justifyRight')} title="Aligner à droite"><AlignRight className="h-3.5 w-3.5" /></TB>
        <TB onClick={() => execCommand('justifyFull')} title="Justifier"><AlignJustify className="h-3.5 w-3.5" /></TB>
        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Line spacing */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded hover:bg-muted text-foreground/80 transition-colors flex items-center gap-0.5" title="Interligne" type="button">
              <Pilcrow className="h-3.5 w-3.5" />
              <ChevronDown className="h-2.5 w-2.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {LINE_SPACINGS.map(s => (
              <DropdownMenuItem key={s.value} onClick={() => setLineSpacingValue(s.value)}>
                {lineSpacing === s.value ? '✓ ' : '  '}{s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Lists */}
        <TB onClick={() => execCommand('insertUnorderedList')} title="Liste à puces"><List className="h-3.5 w-3.5" /></TB>
        <TB onClick={() => execCommand('insertOrderedList')} title="Liste numérotée"><ListOrdered className="h-3.5 w-3.5" /></TB>
        <TB onClick={insertCheckList} title="Liste de tâches"><ListChecks className="h-3.5 w-3.5" /></TB>
        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Indent */}
        <TB onClick={() => execCommand('outdent')} title="Diminuer le retrait"><Outdent className="h-3.5 w-3.5" /></TB>
        <TB onClick={() => execCommand('indent')} title="Augmenter le retrait"><Indent className="h-3.5 w-3.5" /></TB>
        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Block format */}
        <TB onClick={() => execCommand('formatBlock', '<blockquote>')} title="Citation"><Quote className="h-3.5 w-3.5" /></TB>
        <TB onClick={() => execCommand('formatBlock', '<pre>')} title="Code"><Code className="h-3.5 w-3.5" /></TB>
        <TB onClick={() => execCommand('insertHorizontalRule')} title="Ligne horizontale"><Minus className="h-3.5 w-3.5" /></TB>
        <TB onClick={clearFormatting} title="Effacer la mise en forme"><RemoveFormatting className="h-3.5 w-3.5" /></TB>
      </div>

      {/* Find & Replace bar */}
      {showFindReplace && (
        <div className="flex items-center gap-2 px-4 py-2 border-b bg-card/80 print:hidden">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            value={findText}
            onChange={e => setFindText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleFind()}
            placeholder="Rechercher..."
            className="h-7 text-sm max-w-[200px]"
          />
          <Input
            value={replaceText}
            onChange={e => setReplaceText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleReplace()}
            placeholder="Remplacer par..."
            className="h-7 text-sm max-w-[200px]"
          />
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleFind}>Rechercher</Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleReplace}>Remplacer</Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleReplaceAll}>Tout remplacer</Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={closeFindReplace}>✕</Button>
        </div>
      )}

      {/* Ruler with draggable indent markers */}
      {showRuler && (
        <div className="bg-muted/20 border-b print:hidden" style={{ maxWidth: `${816 * (zoom / 100)}px`, margin: '0 auto', width: '100%' }}>
          <div ref={rulerRef} className="relative h-6 w-full select-none">
            {/* Ruler background with marks */}
            <div className="absolute inset-0">
              {rulerMarks}
            </div>

            {/* Active area highlight (between margins) */}
            <div
              className="absolute top-0 bottom-0 bg-background/60"
              style={{
                left: `${(leftIndent / 21) * 100}%`,
                right: `${(rightIndent / 21) * 100}%`,
              }}
            />

            {/* First-line indent marker (downward triangle) */}
            <div
              className="absolute cursor-ew-resize z-20 group"
              style={{
                left: `${((leftIndent + firstLineIndent) / 21) * 100}%`,
                top: 0,
                transform: 'translateX(-50%)',
              }}
              onMouseDown={(e) => handleRulerDrag('firstLine', e)}
              title="Retrait de première ligne"
            >
              <svg width="12" height="8" viewBox="0 0 12 8" className="text-primary group-hover:text-primary/80">
                <polygon points="6,8 0,0 12,0" fill="currentColor" />
              </svg>
            </div>

            {/* Left indent marker (upward triangle + rectangle) */}
            <div
              className="absolute cursor-ew-resize z-20 group"
              style={{
                left: `${(leftIndent / 21) * 100}%`,
                bottom: 0,
                transform: 'translateX(-50%)',
              }}
              onMouseDown={(e) => handleRulerDrag('left', e)}
              title="Retrait gauche"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" className="text-primary group-hover:text-primary/80">
                <polygon points="0,0 12,0 6,6" fill="currentColor" />
                <rect x="3" y="7" width="6" height="4" rx="0.5" fill="currentColor" />
              </svg>
            </div>

            {/* Right indent marker (upward triangle) */}
            <div
              className="absolute cursor-ew-resize z-20 group"
              style={{
                left: `${((21 - rightIndent) / 21) * 100}%`,
                bottom: 0,
                transform: 'translateX(-50%)',
              }}
              onMouseDown={(e) => handleRulerDrag('right', e)}
              title="Retrait droit"
            >
              <svg width="12" height="8" viewBox="0 0 12 8" className="text-primary group-hover:text-primary/80">
                <polygon points="0,0 12,0 6,8" fill="currentColor" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Editor area - Google Docs page view */}
      <div className="flex-1 overflow-auto py-6 px-4 print:py-0 print:px-0 print:overflow-visible" style={{ backgroundColor: '#f0f0f0' }}>
        <div className="flex flex-col items-center">
          <div
            className="word-pages-container"
            style={{
              width: `${816 * (zoom / 100)}px`,
              maxWidth: '100%',
              position: 'relative',
              transform: `scale(1)`,
              transformOrigin: 'top center',
            }}
          >
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleAutoSave}
              onClick={updateSelectionState}
              onKeyUp={updateSelectionState}
              className="outline-none prose prose-sm max-w-none dark:prose-invert word-editable-area
                [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-2 [&_h1]:leading-tight
                [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-2
                [&_h3]:text-xl [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:mt-1
                [&_h4]:text-lg [&_h4]:font-medium [&_h4]:mb-2
                [&_h5]:text-base [&_h5]:font-medium [&_h5]:mb-1
                [&_h6]:text-sm [&_h6]:font-medium [&_h6]:mb-1
                [&_p]:mb-2 [&_p]:leading-relaxed
                [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-4 [&_blockquote]:bg-muted/30 [&_blockquote]:py-2 [&_blockquote]:rounded-r
                [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-sm [&_pre]:whitespace-pre-wrap [&_pre]:my-4
                [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6
                [&_a]:text-primary [&_a]:underline [&_a]:cursor-pointer
                [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-4 [&_img]:cursor-pointer [&_img]:hover:shadow-lg [&_img]:transition-shadow
                [&_hr]:my-6 [&_hr]:border-border
                [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 
                [&_td]:border [&_td]:border-border [&_td]:p-2 [&_td]:min-w-[60px]
                [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted/50 [&_th]:font-semibold
                [&_div]:mb-0.5"
              style={{
                fontSize: '14px',
                lineHeight: lineSpacing,
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            />
          </div>
        </div>
        <style>{`
          .word-pages-container {
            --page-height: 1056px;
            --page-padding-y: 96px;
            --page-padding-x: 72px;
            --page-gap: 32px;
          }

          .word-editable-area {
            padding: 0 var(--page-padding-x);
            min-height: var(--page-height);
            position: relative;
            background-color: #f0f0f0;
            background-image:
              repeating-linear-gradient(
                to bottom,
                white 0px,
                white var(--page-height),
                #f0f0f0 var(--page-height),
                #f0f0f0 calc(var(--page-height) + var(--page-gap))
              );
            background-size: 100% calc(var(--page-height) + var(--page-gap));
            background-repeat: repeat-y;
            box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06);
          }

          .word-pages-container::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            pointer-events: none;
            z-index: 1;
            background-image:
              repeating-linear-gradient(
                to bottom,
                white 0px,
                white var(--page-padding-y),
                transparent var(--page-padding-y),
                transparent calc(var(--page-height) - var(--page-padding-y)),
                white calc(var(--page-height) - var(--page-padding-y)),
                white var(--page-height),
                #f0f0f0 var(--page-height),
                #f0f0f0 calc(var(--page-height) + var(--page-gap))
              );
            background-size: 100% calc(var(--page-height) + var(--page-gap));
            background-repeat: repeat-y;
          }

          .word-pages-container::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            pointer-events: none;
            z-index: 2;
            background-image:
              repeating-linear-gradient(
                to bottom,
                transparent 0px,
                transparent calc(var(--page-height) - 1px),
                rgba(0,0,0,0.08) var(--page-height),
                transparent calc(var(--page-height) + 1px),
                transparent calc(var(--page-height) + var(--page-gap) - 1px),
                rgba(0,0,0,0.06) calc(var(--page-height) + var(--page-gap)),
                transparent calc(var(--page-height) + var(--page-gap) + 1px)
              );
            background-size: 100% calc(var(--page-height) + var(--page-gap));
            background-repeat: repeat-y;
          }

          @media print {
            .word-editable-area {
              background-image: none !important;
              box-shadow: none !important;
              border: none !important;
              padding: 2.54cm !important;
            }
            .word-pages-container::after,
            .word-pages-container::before { display: none; }
          }

          .dark .word-editable-area {
            background-color: #2a2a2a;
            background-image:
              repeating-linear-gradient(
                to bottom,
                hsl(var(--card)) 0px,
                hsl(var(--card)) var(--page-height),
                #2a2a2a var(--page-height),
                #2a2a2a calc(var(--page-height) + var(--page-gap))
              );
          }

          .dark .word-pages-container::after {
            background-image:
              repeating-linear-gradient(
                to bottom,
                hsl(var(--card)) 0px,
                hsl(var(--card)) var(--page-padding-y),
                transparent var(--page-padding-y),
                transparent calc(var(--page-height) - var(--page-padding-y)),
                hsl(var(--card)) calc(var(--page-height) - var(--page-padding-y)),
                hsl(var(--card)) var(--page-height),
                #2a2a2a var(--page-height),
                #2a2a2a calc(var(--page-height) + var(--page-gap))
              );
          }
        `}</style>
      </div>

      {/* Bottom status bar - Google Docs style */}
      {showWordCount && (
        <div className="flex items-center justify-between px-4 py-1 border-t bg-card text-[11px] text-muted-foreground print:hidden">
          <div className="flex items-center gap-4">
            <span>{wordCount.words} mots</span>
            <span>{wordCount.chars} caractères</span>
            <span>Page {wordCount.pages}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Zoom: {zoom}%</span>
            <span>Interligne: {lineSpacing}</span>
          </div>
        </div>
      )}

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
