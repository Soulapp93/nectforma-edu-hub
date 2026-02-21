import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { workspaceService, WorkspaceDocument, WorkspaceFolder } from '@/services/workspaceService';
import { toast } from 'sonner';
import { Plus, FileText, Table2, Presentation, Image, FolderPlus, Folder, ArrowLeft, Trash2, MoreVertical, Search, LayoutGrid, List, Users, ChevronLeft, Upload, FileUp, PenLine, FolderKanban } from 'lucide-react';
import { getTemplatesByType, getTemplateCategories, DocumentTemplate } from '@/data/workspaceTemplates';
import { fileImportService } from '@/services/fileImportService';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import WorkspaceTextEditor from '@/components/workspace/WorkspaceTextEditor';
import WorkspaceSpreadsheetEditor from '@/components/workspace/WorkspaceSpreadsheetEditor';
import WorkspacePresentationEditor from '@/components/workspace/WorkspacePresentationEditor';
import WorkspaceVisualEditor from '@/components/workspace/WorkspaceVisualEditor';
import WorkspaceWhiteboardEditor from '@/components/workspace/WorkspaceWhiteboardEditor';

const DOC_TYPES = [
  { type: 'text' as const, label: 'Document texte', icon: FileText, color: 'from-blue-500 to-blue-600', bgLight: 'bg-blue-50 dark:bg-blue-950/30', textColor: 'text-blue-600 dark:text-blue-400', borderColor: 'border-primary/40', cardBg: 'bg-primary/5 dark:bg-primary/10', desc: 'Comme Word' },
  { type: 'spreadsheet' as const, label: 'Tableau', icon: Table2, color: 'from-emerald-500 to-emerald-600', bgLight: 'bg-emerald-50 dark:bg-emerald-950/30', textColor: 'text-emerald-600 dark:text-emerald-400', borderColor: 'border-primary/40', cardBg: 'bg-primary/5 dark:bg-primary/10', desc: 'Comme Excel' },
  { type: 'presentation' as const, label: 'Présentation', icon: Presentation, color: 'from-orange-500 to-orange-600', bgLight: 'bg-orange-50 dark:bg-orange-950/30', textColor: 'text-orange-600 dark:text-orange-400', borderColor: 'border-primary/40', cardBg: 'bg-primary/5 dark:bg-primary/10', desc: 'Comme PowerPoint' },
  { type: 'visual' as const, label: 'Visuel', icon: Image, color: 'from-pink-500 to-pink-600', bgLight: 'bg-pink-50 dark:bg-pink-950/30', textColor: 'text-pink-600 dark:text-pink-400', borderColor: 'border-primary/40', cardBg: 'bg-primary/5 dark:bg-primary/10', desc: 'Comme Canva' },
  { type: 'whiteboard' as const, label: 'Tableau blanc', icon: PenLine, color: 'from-cyan-500 to-cyan-600', bgLight: 'bg-cyan-50 dark:bg-cyan-950/30', textColor: 'text-cyan-600 dark:text-cyan-400', borderColor: 'border-primary/40', cardBg: 'bg-primary/5 dark:bg-primary/10', desc: 'Whiteboard infini' },
];

const getDocMeta = (type: string) => {
  return DOC_TYPES.find(d => d.type === type) || DOC_TYPES[0];
};

const getDocIcon = (type: string) => {
  const meta = getDocMeta(type);
  const Icon = meta.icon;
  return (
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center shadow-sm`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
  );
};

const EspaceTravail = () => {
  const { userId } = useCurrentUser();
  const [documents, setDocuments] = useState<WorkspaceDocument[]>([]);
  const [sharedDocuments, setSharedDocuments] = useState<WorkspaceDocument[]>([]);
  const [folders, setFolders] = useState<WorkspaceFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [tab, setTab] = useState<'mine' | 'shared'>('mine');
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingDoc, setEditingDoc] = useState<WorkspaceDocument | null>(null);
  const [folderPath, setFolderPath] = useState<WorkspaceFolder[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<WorkspaceDocument['document_type'] | null>(null);
  const [templateCategory, setTemplateCategory] = useState<string>('all');
  const [importing, setImporting] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [showPdfTargetChoice, setShowPdfTargetChoice] = useState(false);
  const [pendingPdfFile, setPendingPdfFile] = useState<File | null>(null);

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [foldersData, docsData, sharedData] = await Promise.all([
        workspaceService.getFolders(userId),
        workspaceService.getDocuments(userId, currentFolderId),
        workspaceService.getSharedDocuments(userId),
      ]);
      setFolders(foldersData.filter(f => f.parent_id === currentFolderId));
      setDocuments(docsData);
      setSharedDocuments(sharedData);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [userId, currentFolderId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateDocument = async (type: WorkspaceDocument['document_type'], template?: DocumentTemplate) => {
    if (!userId) return;
    try {
      const defaultContent = template?.content || (type === 'text' ? { html: '' } : type === 'spreadsheet' ? { cells: {}, numRows: 50, numCols: 26 } : type === 'presentation' ? { slides: [{ id: '1', elements: [], background: '#ffffff' }] } : type === 'whiteboard' ? { elements: [], background: '#ffffff', gridVisible: true } : { width: 1080, height: 1080, background: '#ffffff', elements: [] });
      const doc = await workspaceService.createDocument({
        title: template?.name && template.id.indexOf('blank') === -1 ? template.name : 'Sans titre',
        document_type: type,
        content: defaultContent,
        folder_id: currentFolderId,
        owner_id: userId,
        owner_type: 'user',
      });
      setShowNewDocModal(false);
      setSelectedDocType(null);
      setTemplateCategory('all');
      setEditingDoc(doc);
      toast.success('Document créé');
    } catch (err: any) {
      console.error('Create document error:', err);
      toast.error(`Erreur: ${err?.message || 'Erreur inconnue'}`);
    }
  };

  const handleImportFile = async (file: File, forceType?: 'presentation' | 'visual') => {
    if (!userId) return;
    setImporting(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let docType: WorkspaceDocument['document_type'];
      let content: any;
      const docTitle = file.name.replace(/\.[^.]+$/, '');

      if (ext === 'pdf') {
        if (!forceType) {
          setPendingPdfFile(file);
          setShowPdfTargetChoice(true);
          setImporting(false);
          return;
        }
        docType = forceType;
        if (forceType === 'presentation') {
          content = await fileImportService.importPdfAsPresentation(file);
        } else {
          content = await fileImportService.importPdfAsVisual(file);
        }
      } else if (ext === 'docx' || ext === 'doc') {
        docType = 'text';
        content = await fileImportService.importDocx(file);
      } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        docType = 'spreadsheet';
        content = await fileImportService.importXlsx(file);
      } else if (ext === 'pptx' || ext === 'ppt') {
        docType = 'presentation';
        content = await fileImportService.importPptx(file);
      } else if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '')) {
        docType = 'visual';
        content = await fileImportService.importImageAsVisual(file);
      } else {
        toast.error('Format de fichier non supporté');
        setImporting(false);
        return;
      }

      const doc = await workspaceService.createDocument({
        title: docTitle,
        document_type: docType,
        content,
        folder_id: currentFolderId,
        owner_id: userId,
        owner_type: 'user',
      });
      setShowNewDocModal(false);
      setSelectedDocType(null);
      setTemplateCategory('all');
      setEditingDoc(doc);
      toast.success(`"${docTitle}" importé avec succès`);
    } catch (err: any) {
      console.error('Import error:', err);
      toast.error(`Erreur d'import: ${err?.message || 'Erreur inconnue'}`);
    } finally {
      setImporting(false);
      if (importFileRef.current) importFileRef.current.value = '';
    }
  };

  const handlePdfTargetChoice = async (target: 'presentation' | 'visual') => {
    setShowPdfTargetChoice(false);
    if (pendingPdfFile) {
      await handleImportFile(pendingPdfFile, target);
      setPendingPdfFile(null);
    }
  };

  const handleCreateFolder = async () => {
    if (!userId || !newFolderName.trim()) return;
    try {
      await workspaceService.createFolder({
        name: newFolderName.trim(),
        parent_id: currentFolderId,
        owner_id: userId,
        owner_type: 'user',
      });
      setNewFolderName('');
      setShowNewFolderModal(false);
      loadData();
      toast.success('Dossier créé');
    } catch (err) {
      toast.error('Erreur lors de la création du dossier');
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      await workspaceService.deleteDocument(id);
      loadData();
      toast.success('Document supprimé');
    } catch { toast.error('Erreur'); }
  };

  const handleDeleteFolder = async (id: string) => {
    try {
      await workspaceService.deleteFolder(id);
      loadData();
      toast.success('Dossier supprimé');
    } catch { toast.error('Erreur'); }
  };

  const navigateToFolder = (folder: WorkspaceFolder) => {
    setFolderPath(prev => [...prev, folder]);
    setCurrentFolderId(folder.id);
  };

  const navigateBack = () => {
    const newPath = [...folderPath];
    newPath.pop();
    setFolderPath(newPath);
    setCurrentFolderId(newPath.length > 0 ? newPath[newPath.length - 1].id : null);
  };

  const navigateToRoot = () => {
    setFolderPath([]);
    setCurrentFolderId(null);
  };

  const handleSaveDocument = async (doc: WorkspaceDocument) => {
    try {
      await workspaceService.updateDocument(doc.id, { title: doc.title, content: doc.content, last_edited_by: userId });
      setEditingDoc(doc);
    } catch { toast.error('Erreur de sauvegarde'); }
  };

  const displayDocs = tab === 'mine' ? documents : sharedDocuments;
  const filteredDocs = displayDocs.filter(d => d.title.toLowerCase().includes(search.toLowerCase()));
  const filteredFolders = tab === 'mine' ? folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase())) : [];

  if (editingDoc) {
    const editorProps = {
      document: editingDoc,
      onSave: handleSaveDocument,
      onClose: () => { setEditingDoc(null); loadData(); },
    };

    switch (editingDoc.document_type) {
      case 'text': return <WorkspaceTextEditor {...editorProps} />;
      case 'spreadsheet': return <WorkspaceSpreadsheetEditor {...editorProps} />;
      case 'presentation': return <WorkspacePresentationEditor {...editorProps} />;
      case 'visual': return <WorkspaceVisualEditor {...editorProps} />;
      case 'whiteboard': return <WorkspaceWhiteboardEditor {...editorProps} />;
      default: return <WorkspaceTextEditor {...editorProps} />;
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 min-h-screen pb-24 md:pb-6">
      <PageHeader
        title="Espace de travail"
        description="Créez et gérez vos documents, tableaux et présentations"
        icon={FolderKanban}
      />

      {/* Tabs + actions */}
      <div className="glass-card rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full sm:w-auto">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="mine">Mes documents</TabsTrigger>
              <TabsTrigger value="shared" className="gap-1.5">
                <Users className="h-3.5 w-3.5" /> Partagés avec moi
                {sharedDocuments.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{sharedDocuments.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {tab === 'mine' && (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setShowNewDocModal(true)} className="gap-1.5 rounded-xl shadow-sm">
                <Plus className="h-4 w-4" /> Nouveau document
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowNewFolderModal(true)} className="gap-1.5 rounded-xl">
                <FolderPlus className="h-4 w-4" /> Dossier
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Search + view mode */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl" />
        </div>
        <div className="flex items-center border border-border rounded-xl overflow-hidden">
          <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9 rounded-none" onClick={() => setViewMode('grid')}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9 rounded-none" onClick={() => setViewMode('list')}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      {tab === 'mine' && folderPath.length > 0 && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <button onClick={navigateToRoot} className="hover:text-foreground transition-colors font-medium">Racine</button>
          {folderPath.map((f, i) => (
            <React.Fragment key={f.id}>
              <span>/</span>
              <button onClick={() => { setFolderPath(folderPath.slice(0, i + 1)); setCurrentFolderId(f.id); }} className="hover:text-foreground transition-colors font-medium">{f.name}</button>
            </React.Fragment>
          ))}
        </div>
      )}

      {tab === 'mine' && currentFolderId && (
        <Button variant="ghost" size="sm" onClick={navigateBack} className="gap-1.5 rounded-xl">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
      )}

      {loading ? (
        <div className="glass-card rounded-2xl p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded-lg w-32"></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Folders */}
          {filteredFolders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Dossiers</h3>
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4' : 'space-y-2'}>
                {filteredFolders.map(folder => (
                  <div
                    key={folder.id}
                    className={`rounded-2xl cursor-pointer group transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 border-2 border-primary/20 bg-primary/5 dark:bg-primary/10 backdrop-blur-sm ${viewMode === 'list' ? 'flex items-center p-3 gap-3' : 'p-5'}`}
                    onClick={() => navigateToFolder(folder)}
                  >
                    <div className={`flex ${viewMode === 'grid' ? 'flex-col items-center gap-3' : 'items-center gap-3 flex-1'}`}>
                      <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                        <Folder className="h-6 w-6 text-amber-500 fill-amber-200 dark:fill-amber-800" />
                      </div>
                      <span className="text-sm font-medium truncate text-foreground">{folder.name}</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="space-y-3">
            {filteredFolders.length > 0 && filteredDocs.length > 0 && (
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Documents</h3>
            )}
            {filteredDocs.length === 0 && filteredFolders.length === 0 ? (
              <div className="glass-card rounded-2xl flex flex-col items-center justify-center min-h-[40vh] gap-4 p-8">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10">
                  {tab === 'shared' ? <Users className="h-12 w-12 text-primary" /> : <FileText className="h-12 w-12 text-primary" />}
                </div>
                <h3 className="text-lg font-semibold text-foreground">{tab === 'shared' ? 'Aucun document partagé' : 'Aucun document'}</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  {tab === 'shared' ? 'Les documents partagés avec vous apparaîtront ici' : 'Créez votre premier document pour commencer à travailler'}
                </p>
                {tab === 'mine' && (
                  <Button onClick={() => setShowNewDocModal(true)} className="gap-1.5 rounded-xl">
                    <Plus className="h-4 w-4" /> Créer un document
                  </Button>
                )}
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4' : 'space-y-2'}>
                {filteredDocs.map(doc => {
                  const meta = getDocMeta(doc.document_type);
                  return (
                    <div
                      key={doc.id}
                      className={`rounded-2xl cursor-pointer group transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 border-2 ${meta.borderColor} ${meta.cardBg} backdrop-blur-sm ${viewMode === 'list' ? 'flex items-center p-3 gap-3' : 'p-5'}`}
                      onClick={() => setEditingDoc(doc)}
                    >
                      <div className={`flex ${viewMode === 'grid' ? 'flex-col items-center gap-3' : 'items-center gap-3 flex-1'}`}>
                        <div className="relative">
                          {getDocIcon(doc.document_type)}
                          {(doc.is_shared || tab === 'shared') && (
                            <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5 shadow-sm">
                              <Users className="h-2.5 w-2.5 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <div className={viewMode === 'grid' ? 'text-center w-full' : 'flex-1 min-w-0'}>
                          <p className="text-sm font-medium truncate text-foreground">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">{new Date(doc.updated_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                      {tab === 'mine' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc.id); }} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Document Modal */}
      <Dialog open={showNewDocModal} onOpenChange={(v) => { setShowNewDocModal(v); if (!v) { setSelectedDocType(null); setTemplateCategory('all'); } }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col border-2 border-primary/30">
          <DialogHeader className="bg-gradient-to-r from-primary to-primary/80 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-2xl">
            <DialogTitle className="flex items-center gap-2 text-white">
              {selectedDocType && (
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-white hover:bg-white/20" onClick={() => { setSelectedDocType(null); setTemplateCategory('all'); }}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <FolderKanban className="h-5 w-5" />
              {selectedDocType ? `Choisir un modèle — ${DOC_TYPES.find(d => d.type === selectedDocType)?.label}` : 'Nouveau document'}
            </DialogTitle>
            <p className="text-white/70 text-sm">
              {selectedDocType ? 'Sélectionnez un modèle pour commencer' : 'Créer un nouveau document'}
            </p>
          </DialogHeader>

          {!selectedDocType ? (
            <div className="space-y-5 py-4 overflow-y-auto">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {DOC_TYPES.map(dt => (
                  <button
                    key={dt.type}
                    onClick={() => setSelectedDocType(dt.type)}
                    className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    <div className={`p-3.5 rounded-xl bg-gradient-to-br ${dt.color} text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all`}>
                      <dt.icon className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-primary">{dt.label}</p>
                      <p className="text-xs text-muted-foreground">{dt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Import section */}
              <div className="border-t border-primary/15 pt-5">
                <input
                  ref={importFileRef}
                  type="file"
                  accept={fileImportService.getAllAcceptedExtensions()}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImportFile(file);
                  }}
                />
                <button
                  onClick={() => importFileRef.current?.click()}
                  disabled={importing}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-primary/25 hover:border-primary/60 hover:bg-primary/5 transition-all"
                >
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <FileUp className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-primary">{importing ? 'Import en cours...' : 'Importer un fichier'}</p>
                    <p className="text-xs text-muted-foreground">Word, Excel, PowerPoint, PDF, Images</p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 flex-1 min-h-0">
              {/* Category filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setTemplateCategory('all')} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${templateCategory === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}>
                  Tous
                </button>
                {getTemplateCategories(selectedDocType).map(cat => (
                  <button key={cat} onClick={() => setTemplateCategory(cat)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${templateCategory === cat ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* Templates grid */}
              <ScrollArea className="flex-1 max-h-[50vh]">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pr-3">
                  {getTemplatesByType(selectedDocType)
                    .filter(t => templateCategory === 'all' || t.category === templateCategory)
                    .map(template => (
                      <button
                        key={template.id}
                        onClick={() => handleCreateDocument(selectedDocType, template)}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all text-left group"
                      >
                        <div className="w-full aspect-[4/3] rounded-xl flex items-center justify-center text-4xl" style={{ backgroundColor: template.color + '15' }}>
                          {template.thumbnail}
                        </div>
                        <div className="w-full">
                          <p className="text-sm font-medium truncate text-foreground">{template.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                        </div>
                      </button>
                    ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF target choice dialog */}
      <Dialog open={showPdfTargetChoice} onOpenChange={(v) => { setShowPdfTargetChoice(v); if (!v) setPendingPdfFile(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ouvrir le PDF en tant que…</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <button
              onClick={() => handlePdfTargetChoice('presentation')}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-transparent hover:border-primary/30 hover:bg-muted/50 transition-all"
            >
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-sm">
                <Presentation className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Présentation</p>
                <p className="text-xs text-muted-foreground">1 slide par page</p>
              </div>
            </button>
            <button
              onClick={() => handlePdfTargetChoice('visual')}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-transparent hover:border-primary/30 hover:bg-muted/50 transition-all"
            >
              <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-sm">
                <Image className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Visuel</p>
                <p className="text-xs text-muted-foreground">Première page éditable</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewFolderModal} onOpenChange={setShowNewFolderModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nouveau dossier</DialogTitle>
          </DialogHeader>
          <Input placeholder="Nom du dossier" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateFolder()} autoFocus className="rounded-xl" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderModal(false)} className="rounded-xl">Annuler</Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()} className="rounded-xl">Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EspaceTravail;
