import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { digitalSafeService } from '@/services/digitalSafeService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Folder } from 'lucide-react';

interface CreateFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId?: string;
  onSuccess: () => void;
}

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  open,
  onOpenChange,
  parentId,
  onSuccess
}) => {
  const [folderName, setFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!folderName.trim()) return;

    setIsCreating(true);
    try {
      await digitalSafeService.createFolder(folderName.trim(), parentId);
      toast({
        title: "Succès",
        description: "Dossier créé avec succès.",
      });
      setFolderName('');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erreur création dossier:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création du dossier.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Folder className="h-5 w-5 mr-2" />
            Nouveau dossier
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Nom du dossier</Label>
            <Input
              id="folder-name"
              placeholder="Entrez le nom du dossier"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isCreating}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!folderName.trim() || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFolderModal;