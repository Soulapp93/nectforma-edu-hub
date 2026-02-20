import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { workspaceService, WorkspaceDocument, WorkspaceFolder } from '@/services/workspaceService';
import { toast } from 'sonner';
import { Plus, FileText, Table2, Presentation, Image, FolderPlus, Folder, ArrowLeft, Trash2, MoreVertical, Search, LayoutGrid, List, Users, ChevronLeft, Upload, FileUp, PenLine } from 'lucide-react';
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
  { type: 'text' as const, label: 'Document texte', icon: FileText, color: 'bg-blue-500', desc: 'Comme Word' },
  { type: 'spreadsheet' as const, label: 'Tableau', icon: Table2, color: 'bg-green-500', desc: 'Comme Excel' },
  { type: 'presentation' as const, label: 'Présentation', icon: Presentation, color: 'bg-orange-500', desc: 'Comme PowerPoint' },
  { type: 'visual' as const, label: 'Visuel', icon: Image, color: 'bg-pink-500', desc: 'Comme Canva' },
  { type: 'whiteboard' as const, label: 'Tableau blanc', icon: PenLine, color: 'bg-cyan-500', desc: 'Whiteboard infini' },
];

const getDocIcon = (type: string) => {
  switch (type) {
    case 'text': return <FileText className="h-8 w-8 text-blue-500" />;
    case 'spreadsheet': return <Table2 className="h-8 w-8 text-green-500" />;
    case 'presentation': return <Presentation className="h-8 w-8 text-orange-500" />;
    case 'visual': return <Image className="h-8 w-8 text-pink-500" />;
    case 'whiteboard': return <PenLine className="h-8 w-8 text-cyan-500" />;
    default: return <FileText className="h-8 w-8 text-muted-foreground" />;
  }
};

const getDocColor = (type: string) => {
  switch (type) {
    case 'text': return 'border-blue-200 hover:border-blue-400 hover:shadow-blue-100';
    case 'spreadsheet': return 'border-green-200 hover:border-green-400 hover:shadow-green-100';
    case 'presentation': return 'border-orange-200 hover:border-orange-400 hover:shadow-orange-100';
    case 'visual': return 'border-pink-200 hover:border-pink-400 hover:shadow-pink-100';
    case 'whiteboard': return 'border-cyan-200 hover:border-cyan-400 hover:shadow-cyan-100';
    default: return '';
  }
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
    <div className="p-4 md:p-6 space-y-6 pb-24 md:pb-6">
      <PageHeader title="Espace de travail" description="Créez et gérez vos documents, tableaux et présentations" />

      {/* Tabs + actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full sm:w-auto">
          <TabsList>
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
            <Button size="sm" onClick={() => setShowNewDocModal(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Nouveau document
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowNewFolderModal(true)} className="gap-1.5">
              <FolderPlus className="h-4 w-4" /> Dossier
            </Button>
          </div>
        )}
      </div>

      {/* Search + view mode */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center border rounded-lg">
          <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9" onClick={() => setViewMode('grid')}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9" onClick={() => setViewMode('list')}>
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
        <Button variant="ghost" size="sm" onClick={navigateBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {/* Folders */}
          {filteredFolders.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Dossiers</h3>
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3' : 'space-y-2'}>
                {filteredFolders.map(folder => (
                  <Card key={folder.id} className={`cursor-pointer border-2 border-transparent hover:border-primary/30 transition-all group ${viewMode === 'list' ? 'flex items-center p-3 gap-3' : 'p-4'}`} onClick={() => navigateToFolder(folder)}>
                    <div className={`flex ${viewMode === 'grid' ? 'flex-col items-center gap-2' : 'items-center gap-3 flex-1'}`}>
                      <Folder className="h-8 w-8 text-amber-500 fill-amber-100" />
                      <span className="text-sm font-medium truncate">{folder.name}</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          <div>
            {filteredFolders.length > 0 && filteredDocs.length > 0 && (
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Documents</h3>
            )}
            {filteredDocs.length === 0 && filteredFolders.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                <div className="p-6 rounded-full bg-muted">
                  {tab === 'shared' ? <Users className="h-12 w-12 text-muted-foreground" /> : <FileText className="h-12 w-12 text-muted-foreground" />}
                </div>
                <h3 className="text-lg font-semibold">{tab === 'shared' ? 'Aucun document partagé' : 'Aucun document'}</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  {tab === 'shared' ? 'Les documents partagés avec vous apparaîtront ici' : 'Créez votre premier document pour commencer à travailler'}
                </p>
                {tab === 'mine' && (
                  <Button onClick={() => setShowNewDocModal(true)} className="gap-1.5">
                    <Plus className="h-4 w-4" /> Créer un document
                  </Button>
                )}
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3' : 'space-y-2'}>
                {filteredDocs.map(doc => (
                  <Card key={doc.id} className={`cursor-pointer border-2 transition-all group ${getDocColor(doc.document_type)} ${viewMode === 'list' ? 'flex items-center p-3 gap-3' : 'p-4'}`} onClick={() => setEditingDoc(doc)}>
                    <div className={`flex ${viewMode === 'grid' ? 'flex-col items-center gap-3' : 'items-center gap-3 flex-1'}`}>
                      <div className="relative">
                        {getDocIcon(doc.document_type)}
                        {(doc.is_shared || tab === 'shared') && (
                          <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5">
                            <Users className="h-2.5 w-2.5 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div className={viewMode === 'grid' ? 'text-center' : 'flex-1 min-w-0'}>
                        <p className="text-sm font-medium truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(doc.updated_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    {tab === 'mine' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <Dialog open={showNewDocModal} onOpenChange={(v) => { setShowNewDocModal(v); if (!v) { setSelectedDocType(null); setTemplateCategory('all'); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDocType && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedDocType(null); setTemplateCategory('all'); }}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              {selectedDocType ? `Choisir un modèle — ${DOC_TYPES.find(d => d.type === selectedDocType)?.label}` : 'Nouveau document'}
            </DialogTitle>
          </DialogHeader>

          {!selectedDocType ? (
            <div className="space-y-4 py-4 overflow-y-auto">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {DOC_TYPES.map(dt => (
                  <button key={dt.type} onClick={() => setSelectedDocType(dt.type)} className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-transparent hover:border-primary/30 hover:bg-muted/50 transition-all">
                    <div className={`p-3 rounded-xl ${dt.color} text-white`}>
                      <dt.icon className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{dt.label}</p>
                      <p className="text-xs text-muted-foreground">{dt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Import section */}
              <div className="border-t pt-4">
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
                  className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30 transition-all"
                >
                  <div className="p-2.5 rounded-lg bg-muted">
                    <FileUp className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">{importing ? 'Import en cours...' : 'Importer un fichier'}</p>
                    <p className="text-xs text-muted-foreground">Word, Excel, PowerPoint, PDF, Images</p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 flex-1 min-h-0">
              {/* Category filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setTemplateCategory('all')} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${templateCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}>
                  Tous
                </button>
                {getTemplateCategories(selectedDocType).map(cat => (
                  <button key={cat} onClick={() => setTemplateCategory(cat)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${templateCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* Templates grid */}
              <ScrollArea className="flex-1 max-h-[50vh]">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pr-3">
                  {getTemplatesByType(selectedDocType)
                    .filter(t => templateCategory === 'all' || t.category === templateCategory)
                    .map(template => (
                      <button
                        key={template.id}
                        onClick={() => handleCreateDocument(selectedDocType, template)}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-transparent hover:border-primary/30 hover:bg-muted/50 transition-all text-left group"
                      >
                        <div className="w-full aspect-[4/3] rounded-lg flex items-center justify-center text-4xl" style={{ backgroundColor: template.color + '15' }}>
                          {template.thumbnail}
                        </div>
                        <div className="w-full">
                          <p className="text-sm font-medium truncate">{template.name}</p>
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
          <div className="grid grid-cols-2 gap-3 py-4">
            <button
              onClick={() => handlePdfTargetChoice('presentation')}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-transparent hover:border-primary/30 hover:bg-muted/50 transition-all"
            >
              <Presentation className="h-8 w-8 text-orange-500" />
              <div className="text-center">
                <p className="text-sm font-medium">Présentation</p>
                <p className="text-xs text-muted-foreground">1 slide par page</p>
              </div>
            </button>
            <button
              onClick={() => handlePdfTargetChoice('visual')}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-transparent hover:border-primary/30 hover:bg-muted/50 transition-all"
            >
              <Image className="h-8 w-8 text-pink-500" />
              <div className="text-center">
                <p className="text-sm font-medium">Visuel</p>
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
          <Input placeholder="Nom du dossier" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateFolder()} autoFocus />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderModal(false)}>Annuler</Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EspaceTravail;
