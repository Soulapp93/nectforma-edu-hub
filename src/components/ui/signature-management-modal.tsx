import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PenTool, Upload, Save, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import SignaturePad from './signature-pad';

interface SignatureManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSignature?: string | null;
  onSave: (signatureData: string) => Promise<void>;
  title: string;
}

const SignatureManagementModal: React.FC<SignatureManagementModalProps> = ({
  isOpen,
  onClose,
  currentSignature,
  onSave,
  title
}) => {
  const [mode, setMode] = useState<'view' | 'create' | 'upload'>('view');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSignature = async (signatureData: string) => {
    try {
      setLoading(true);
      console.log('Modal: Sauvegarde signature, longueur:', signatureData.length);
      await onSave(signatureData);
      toast.success('Signature enregistrée avec succès');
      setMode('view');
      // Forcer une petite pause pour permettre la mise à jour du parent
      setTimeout(() => {
        console.log('Modal: Signature sauvegardée, currentSignature:', currentSignature?.length || 'null');
      }, 100);
    } catch (error) {
      console.error('Modal: Erreur sauvegarde signature:', error);
      toast.error('Erreur lors de l\'enregistrement de la signature');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          handleSaveSignature(result);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('Veuillez sélectionner un fichier image');
      }
    }
  };

  const handleDeleteSignature = async () => {
    try {
      setLoading(true);
      await onSave('');
      toast.success('Signature supprimée avec succès');
      setMode('view');
    } catch (error) {
      toast.error('Erreur lors de la suppression de la signature');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-sm sm:text-base">
            <PenTool className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
            <span className="truncate">{title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {mode === 'view' && (
            <div className="space-y-4">
              {currentSignature ? (
                <Card>
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg">Signature actuelle</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6">
                    <div className="flex justify-center mb-4">
                      <div className="border-2 border-gray-200 rounded-lg p-2 sm:p-4 bg-white w-full max-w-xs sm:max-w-md">
                        <img 
                          src={currentSignature} 
                          alt="Signature actuelle" 
                          className="w-full h-auto object-contain"
                          style={{ maxHeight: '120px' }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => setMode('create')}
                        className="flex items-center justify-center text-sm"
                        size="sm"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center text-sm"
                        size="sm"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Remplacer
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteSignature}
                        disabled={loading}
                        className="flex items-center justify-center text-sm"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                    <div className="text-center py-4 sm:py-8">
                      <PenTool className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                      <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
                        Aucune signature enregistrée
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4 px-2">
                        Enregistrez votre signature pour l'apposer automatiquement lors des validations.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Button
                          onClick={() => setMode('create')}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
                          size="sm"
                        >
                          <PenTool className="h-4 w-4 mr-2" />
                          <span className="sm:inline">Créer</span>
                          <span className="hidden sm:inline ml-1">une signature</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          size="sm"
                          className="text-sm"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          <span className="sm:inline">Importer</span>
                          <span className="hidden sm:inline ml-1">une image</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {mode === 'create' && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">Créer votre signature</CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  <div className="w-full overflow-x-auto">
                    <SignaturePad
                      width={Math.min(500, window.innerWidth - 80)}
                      height={180}
                      onSave={handleSaveSignature}
                      onCancel={() => setMode('view')}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {mode === 'view' && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignatureManagementModal;