import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/hooks/useEstablishment';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ProductionFileViewer from '@/components/ui/viewers/ProductionFileViewer';
import {
  FolderOpen, Plus, Search, Trash2, Download, Upload, File,
  Folder, FolderPlus, ChevronRight, ArrowLeft, MoreVertical,
  FileText, FileImage, FileSpreadsheet, FileArchive, FileVideo,
  Pencil, HardDrive, X, Eye,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DocFolder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  created_at: string;
}

interface DocFile {
  id: string;
  name: string;
  original_name: string;
  file_path: string;
  file_url: string;
  file_size: number;
  content_type: string;
  folder_id: string | null;
  created_at: string;
}

const FILE_ICONS: Record<string, React.ComponentType<any>> = {
  'application/pdf': FileText,
  'image/': FileImage,
  'video/': FileVideo,
  'application/zip': FileArchive,
  'application/x-rar': FileArchive,
  'application/vnd.openxmlformats-officedocument.spreadsheetml': FileSpreadsheet,
  'application/vnd.ms-excel': FileSpreadsheet,
  'text/csv': FileSpreadsheet,
};

const FILE_COLORS: Record<string, string> = {
  'application/pdf': 'text-red-500',
  'image/': 'text-emerald-500',
  'video/': 'text-purple-500',
  'application/zip': 'text-amber-500',
  'application/vnd.openxmlformats-officedocument.spreadsheetml': 'text-green-600',
  'text/csv': 'text-green-600',
};

function getFileIcon(contentType: string): React.ComponentType<any> {
  for (const [key, icon] of Object.entries(FILE_ICONS)) {
    if (contentType.startsWith(key)) return icon;
  }
  return File;
}

function getFileColor(contentType: string): string {
  for (const [key, color] of Object.entries(FILE_COLORS)) {
    if (contentType.startsWith(key)) return color;
  }
  return 'text-blue-500';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

const EstablishmentDocuments: React.FC = () => {
  const { establishment } = useEstablishment();
  const { userId } = useCurrentUser();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'Racine' }]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameTarget, setRenameTarget] = useState<{ id: string; type: 'folder' | 'file'; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'folder' | 'file'; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [viewerFile, setViewerFile] = useState<{ url: string; name: string } | null>(null);

  const estId = establishment?.id || '';

  // Fetch folders
  const { data: folders = [], isLoading: loadingFolders } = useQuery({
    queryKey: ['est-doc-folders', estId, currentFolderId],
    queryFn: async () => {
      let query = supabase
        .from('digital_safe_folders')
        .select('id, name, parent_folder_id, created_at')
        .eq('establishment_id', estId)
        .order('name');

      if (currentFolderId) {
        query = query.eq('parent_folder_id', currentFolderId);
      } else {
        query = query.is('parent_folder_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as DocFolder[];
    },
    enabled: !!estId,
  });

  // Fetch files
  const { data: files = [], isLoading: loadingFiles } = useQuery({
    queryKey: ['est-doc-files', estId, currentFolderId],
    queryFn: async () => {
      let query = supabase
        .from('digital_safe_files')
        .select('id, name, original_name, file_path, file_url, file_size, content_type, folder_id, created_at')
        .eq('establishment_id', estId)
        .order('name');

      if (currentFolderId) {
        query = query.eq('folder_id', currentFolderId);
      } else {
        query = query.is('folder_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as DocFile[];
    },
    enabled: !!estId,
  });

  // Stats
  const { data: stats } = useQuery({
    queryKey: ['est-doc-stats', estId],
    queryFn: async () => {
      const { count: folderCount } = await supabase
        .from('digital_safe_folders')
        .select('id', { count: 'exact', head: true })
        .eq('establishment_id', estId);
      const { data: allFiles } = await supabase
        .from('digital_safe_files')
        .select('file_size')
        .eq('establishment_id', estId);
      const totalSize = (allFiles || []).reduce((s: number, f: any) => s + (f.file_size || 0), 0);
      return { folders: folderCount || 0, files: (allFiles || []).length, totalSize };
    },
    enabled: !!estId,
  });

  // Filtered
  const filteredFolders = useMemo(() => {
    if (!searchTerm) return folders;
    const l = searchTerm.toLowerCase();
    return folders.filter(f => f.name.toLowerCase().includes(l));
  }, [folders, searchTerm]);

  const filteredFiles = useMemo(() => {
    if (!searchTerm) return files;
    const l = searchTerm.toLowerCase();
    return files.filter(f => f.name.toLowerCase().includes(l) || f.original_name.toLowerCase().includes(l));
  }, [files, searchTerm]);

  // Navigate to folder
  const navigateToFolder = useCallback((folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    setBreadcrumbs(prev => [...prev, { id: folderId, name: folderName }]);
    setSearchTerm('');
  }, []);

  const navigateToBreadcrumb = useCallback((index: number) => {
    const target = breadcrumbs[index];
    setCurrentFolderId(target.id);
    setBreadcrumbs(prev => prev.slice(0, index + 1));
    setSearchTerm('');
  }, [breadcrumbs]);

  // Create folder
  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from('digital_safe_folders').insert({
        name,
        parent_folder_id: currentFolderId,
        user_id: userId,
        establishment_id: estId,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['est-doc-folders'] });
      queryClient.invalidateQueries({ queryKey: ['est-doc-stats'] });
      toast.success('Dossier créé');
      setShowNewFolder(false);
      setNewFolderName('');
    },
    onError: () => toast.error('Erreur lors de la création du dossier'),
  });

  // Rename
  const renameMutation = useMutation({
    mutationFn: async ({ id, type, name }: { id: string; type: 'folder' | 'file'; name: string }) => {
      const table = type === 'folder' ? 'digital_safe_folders' : 'digital_safe_files';
      const { error } = await supabase.from(table).update({ name } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['est-doc-folders'] });
      queryClient.invalidateQueries({ queryKey: ['est-doc-files'] });
      toast.success('Renommé avec succès');
      setRenameTarget(null);
    },
    onError: () => toast.error('Erreur lors du renommage'),
  });

  // Delete folder
  const deleteFolderMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete child files in storage first
      const { data: childFiles } = await supabase
        .from('digital_safe_files')
        .select('id, file_path')
        .eq('folder_id', id);
      if (childFiles && childFiles.length > 0) {
        const paths = childFiles.map((f: any) => f.file_path).filter(Boolean);
        if (paths.length > 0) {
          await supabase.storage.from('establishment-docs').remove(paths);
        }
        await supabase.from('digital_safe_files').delete().eq('folder_id', id);
      }
      // Delete child folders recursively (simplified - one level)
      const { data: childFolders } = await supabase
        .from('digital_safe_folders')
        .select('id')
        .eq('parent_folder_id', id);
      for (const cf of (childFolders || [])) {
        await supabase.from('digital_safe_files').delete().eq('folder_id', cf.id);
        await supabase.from('digital_safe_folders').delete().eq('id', cf.id);
      }
      const { error } = await supabase.from('digital_safe_folders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['est-doc-folders'] });
      queryClient.invalidateQueries({ queryKey: ['est-doc-files'] });
      queryClient.invalidateQueries({ queryKey: ['est-doc-stats'] });
      toast.success('Dossier supprimé');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  // Delete file
  const deleteFileMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: fileData } = await supabase
        .from('digital_safe_files')
        .select('file_path')
        .eq('id', id)
        .single();
      if (fileData?.file_path) {
        await supabase.storage.from('establishment-docs').remove([fileData.file_path]);
      }
      const { error } = await supabase.from('digital_safe_files').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['est-doc-files'] });
      queryClient.invalidateQueries({ queryKey: ['est-doc-stats'] });
      toast.success('Fichier supprimé');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  // Upload file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    let uploaded = 0;
    const totalFiles = selectedFiles.length;

    try {
      for (let i = 0; i < totalFiles; i++) {
        const file = selectedFiles[i];
        const ext = file.name.split('.').pop() || '';
        const storagePath = `${estId}/${currentFolderId || 'root'}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('establishment-docs')
          .upload(storagePath, file, { contentType: file.type });

        if (uploadError) {
          toast.error(`Erreur upload "${file.name}": ${uploadError.message}`);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('establishment-docs')
          .getPublicUrl(storagePath);

        // Insert DB record
        const { error: dbError } = await supabase.from('digital_safe_files').insert({
          name: file.name,
          original_name: file.name,
          file_path: storagePath,
          file_url: urlData.publicUrl,
          file_size: file.size,
          content_type: file.type || 'application/octet-stream',
          folder_id: currentFolderId,
          user_id: userId,
          establishment_id: estId,
        } as any);

        if (dbError) {
          toast.error(`Erreur enregistrement "${file.name}"`);
          continue;
        }
        uploaded++;
      }

      if (uploaded > 0) {
        toast.success(`${uploaded} fichier${uploaded > 1 ? 's' : ''} ajouté${uploaded > 1 ? 's' : ''}`);
        queryClient.invalidateQueries({ queryKey: ['est-doc-files'] });
        queryClient.invalidateQueries({ queryKey: ['est-doc-stats'] });
      }
    } catch {
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Download
  const handleDownload = async (file: DocFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('establishment-docs')
        .download(file.file_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_name || file.name;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Téléchargement lancé');
    } catch {
      // Fallback to public URL
      window.open(file.file_url, '_blank');
    }
  };

  const isLoading = loadingFolders || loadingFiles;
  if (isLoading && folders.length === 0 && files.length === 0) {
    return <LoadingState message="Chargement des documents..." />;
  }

  return (
    <div className="space-y-4 sm:space-y-6" data-testid="establishment-documents">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileUpload}
        data-testid="file-upload-input"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 sm:p-4 flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <Folder className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          </div>
          <div><p className="text-lg sm:text-2xl font-bold">{stats?.folders ?? 0}</p><p className="text-[10px] sm:text-xs text-muted-foreground">Dossiers</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-3 sm:p-4 flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
            <File className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
          </div>
          <div><p className="text-lg sm:text-2xl font-bold">{stats?.files ?? 0}</p><p className="text-[10px] sm:text-xs text-muted-foreground">Fichiers</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-3 sm:p-4 flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
            <HardDrive className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
          </div>
          <div><p className="text-lg sm:text-2xl font-bold">{formatFileSize(stats?.totalSize ?? 0)}</p><p className="text-[10px] sm:text-xs text-muted-foreground">Espace utilisé</p></div>
        </CardContent></Card>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {breadcrumbs.map((bc, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
            <button
              onClick={() => navigateToBreadcrumb(idx)}
              data-testid={`breadcrumb-${idx}`}
              className={`px-2 py-1 rounded-md whitespace-nowrap transition-colors flex-shrink-0 ${
                idx === breadcrumbs.length - 1
                  ? 'font-semibold text-foreground bg-muted'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {idx === 0 && <FolderOpen className="h-3.5 w-3.5 inline mr-1" />}
              {bc.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un fichier ou dossier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="doc-search"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowNewFolder(true)} className="gap-2" data-testid="new-folder-btn">
            <FolderPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouveau dossier</span>
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2" data-testid="upload-btn">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">{uploading ? 'Upload...' : 'Ajouter un fichier'}</span>
            <span className="sm:hidden">{uploading ? '...' : 'Ajouter'}</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      {filteredFolders.length === 0 && filteredFiles.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={currentFolderId ? 'Ce dossier est vide' : 'Aucun document'}
          description={currentFolderId ? 'Ajoutez des fichiers ou créez un sous-dossier.' : "Commencez par créer un dossier ou ajouter un fichier."}
        />
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {/* Folders */}
            {filteredFolders.map((folder) => (
              <div
                key={folder.id}
                className="flex items-center gap-3 px-3 sm:px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer group"
                data-testid={`folder-${folder.id}`}
              >
                <div
                  className="flex items-center gap-3 flex-1 min-w-0"
                  onClick={() => navigateToFolder(folder.id, folder.name)}
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <Folder className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{folder.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(folder.created_at), 'dd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" data-testid={`folder-menu-${folder.id}`}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setRenameTarget({ id: folder.id, type: 'folder', name: folder.name }); setRenameValue(folder.name); }}>
                      <Pencil className="h-4 w-4 mr-2" />Renommer
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget({ id: folder.id, type: 'folder', name: folder.name })}>
                      <Trash2 className="h-4 w-4 mr-2" />Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}

            {/* Files */}
            {filteredFiles.map((file) => {
              const FileIcon = getFileIcon(file.content_type);
              const fileColor = getFileColor(file.content_type);
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 px-3 sm:px-4 py-3 hover:bg-muted/30 transition-colors group cursor-pointer"
                  data-testid={`file-${file.id}`}
                  onClick={() => setViewerFile({ url: file.file_url, name: file.original_name || file.name })}
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-muted/50 flex items-center justify-center flex-shrink-0">
                    <FileIcon className={`h-5 w-5 ${fileColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.original_name || file.name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{formatFileSize(file.file_size)}</span>
                      <span>·</span>
                      <span>{format(new Date(file.created_at), 'dd MMM yyyy', { locale: fr })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setViewerFile({ url: file.file_url, name: file.original_name || file.name }); }} title="Visualiser" data-testid={`view-${file.id}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleDownload(file); }} data-testid={`download-${file.id}`}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`file-menu-${file.id}`} onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewerFile({ url: file.file_url, name: file.original_name || file.name })}>
                          <Eye className="h-4 w-4 mr-2" />Visualiser
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(file)}>
                          <Download className="h-4 w-4 mr-2" />Télécharger
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setRenameTarget({ id: file.id, type: 'file', name: file.name }); setRenameValue(file.name); }}>
                          <Pencil className="h-4 w-4 mr-2" />Renommer
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget({ id: file.id, type: 'file', name: file.name })}>
                          <Trash2 className="h-4 w-4 mr-2" />Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* New Folder Modal */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent className="max-w-sm" data-testid="new-folder-modal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FolderPlus className="h-5 w-5 text-primary" />Nouveau dossier</DialogTitle>
          </DialogHeader>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nom du dossier</label>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Ex: Règlement intérieur"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && newFolderName.trim()) createFolderMutation.mutate(newFolderName.trim()); }}
              data-testid="new-folder-input"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}>Annuler</Button>
            <Button
              onClick={() => newFolderName.trim() && createFolderMutation.mutate(newFolderName.trim())}
              disabled={!newFolderName.trim() || createFolderMutation.isPending}
              data-testid="create-folder-btn"
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Modal */}
      <Dialog open={!!renameTarget} onOpenChange={() => setRenameTarget(null)}>
        <DialogContent className="max-w-sm" data-testid="rename-modal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5 text-primary" />Renommer</DialogTitle>
          </DialogHeader>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nouveau nom</label>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && renameValue.trim() && renameTarget)
                  renameMutation.mutate({ id: renameTarget.id, type: renameTarget.type, name: renameValue.trim() });
              }}
              data-testid="rename-input"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRenameTarget(null)}>Annuler</Button>
            <Button
              onClick={() => renameTarget && renameValue.trim() && renameMutation.mutate({ id: renameTarget.id, type: renameTarget.type, name: renameValue.trim() })}
              disabled={!renameValue.trim() || renameMutation.isPending}
              data-testid="confirm-rename-btn"
            >
              Renommer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm" data-testid="delete-modal">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Êtes-vous sûr de vouloir supprimer {deleteTarget?.type === 'folder' ? 'le dossier' : 'le fichier'} <strong>"{deleteTarget?.name}"</strong> ?
            {deleteTarget?.type === 'folder' && ' Tous les fichiers et sous-dossiers seront également supprimés.'}
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleteTarget) return;
                if (deleteTarget.type === 'folder') deleteFolderMutation.mutate(deleteTarget.id);
                else deleteFileMutation.mutate(deleteTarget.id);
              }}
              disabled={deleteFolderMutation.isPending || deleteFileMutation.isPending}
              data-testid="confirm-delete-btn"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Viewer */}
      <ProductionFileViewer
        fileUrl={viewerFile?.url || ''}
        fileName={viewerFile?.name || ''}
        isOpen={!!viewerFile}
        onClose={() => setViewerFile(null)}
      />
    </div>
  );
};

export default EstablishmentDocuments;
