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
      await onSave(signatureData);
      toast.success('Signature enregistrée avec succès');
      setMode('view');
    } catch (error) {
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <PenTool className="h-5 w-5 mr-2" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {mode === 'view' && (
            <div className="space-y-4">
              {currentSignature ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Signature actuelle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center mb-4">
                      <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                        <img 
                          src={currentSignature} 
                          alt="Signature actuelle" 
                          className="max-w-full h-auto"
                          style={{ maxHeight: '150px' }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => setMode('create')}
                        className="flex items-center"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Remplacer
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteSignature}
                        disabled={loading}
                        className="flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <PenTool className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Aucune signature enregistrée
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Enregistrez votre signature pour l'apposer automatiquement lors des validations.
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={() => setMode('create')}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <PenTool className="h-4 w-4 mr-2" />
                          Créer une signature
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Importer une image
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
                <CardHeader>
                  <CardTitle className="text-lg">Créer votre signature</CardTitle>
                </CardHeader>
                <CardContent>
                  <SignaturePad
                    width={500}
                    height={200}
                    onSave={handleSaveSignature}
                    onCancel={() => setMode('view')}
                  />
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