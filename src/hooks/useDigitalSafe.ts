import { useState, useEffect } from 'react';
import { digitalSafeService, DigitalSafeFolder, DigitalSafeFile } from '@/services/digitalSafeService';
import { useToast } from '@/hooks/use-toast';

export const useDigitalSafe = () => {
  const [folders, setFolders] = useState<DigitalSafeFolder[]>([]);
  const [files, setFiles] = useState<DigitalSafeFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 0 });
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [foldersData, filesData, storageData] = await Promise.all([
        digitalSafeService.getFolders(currentFolder || undefined),
        digitalSafeService.getFiles(currentFolder || undefined),
        digitalSafeService.getStorageInfo()
      ]);
      
      setFolders(foldersData);
      setFiles(filesData);
      setStorageInfo(storageData);
    } catch (error: any) {
      console.error('Erreur chargement données:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du chargement des données.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      await digitalSafeService.deleteFile(fileId);
      toast({
        title: "Succès",
        description: "Fichier supprimé avec succès.",
      });
      await loadData(); // Recharger les données
    } catch (error: any) {
      console.error('Erreur suppression fichier:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression du fichier.",
        variant: "destructive",
      });
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      await digitalSafeService.deleteFolder(folderId);
      toast({
        title: "Succès",
        description: "Dossier supprimé avec succès.",
      });
      await loadData(); // Recharger les données
    } catch (error: any) {
      console.error('Erreur suppression dossier:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression du dossier.",
        variant: "destructive",
      });
    }
  };

  const downloadFile = async (file: DigitalSafeFile) => {
    try {
      await digitalSafeService.downloadFile(file.file_url, file.original_name);
      toast({
        title: "Succès",
        description: "Téléchargement commencé.",
      });
    } catch (error: any) {
      console.error('Erreur téléchargement:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du téléchargement.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadData();
  }, [currentFolder]);

  return {
    folders,
    files,
    currentFolder,
    setCurrentFolder,
    loading,
    storageInfo,
    loadData,
    deleteFile,
    deleteFolder,
    downloadFile
  };
};