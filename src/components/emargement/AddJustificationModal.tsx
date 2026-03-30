import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { absenceJustificationService } from '@/services/absenceJustificationService';
import { toast } from 'sonner';

interface AddJustificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  signatureId: string;
  userId: string;
  absenceDate?: string;
  absenceTitle?: string;
  onSuccess?: () => void;
}

const AddJustificationModal: React.FC<AddJustificationModalProps> = ({
  isOpen,
  onClose,
  signatureId,
  userId,
  absenceDate,
  absenceTitle,
  onSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('Le fichier ne doit pas dépasser 10 Mo');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    try {
      setLoading(true);
      await absenceJustificationService.uploadJustification(signatureId, userId, file, comment);
      toast.success('Justificatif envoyé avec succès');
      setFile(null);
      setComment('');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error uploading justification:', error);
      toast.error('Erreur lors de l\'envoi du justificatif');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Ajouter un justificatif
          </DialogTitle>
          <DialogDescription>
            {absenceTitle && absenceDate
              ? `Absence du ${new Date(absenceDate).toLocaleDateString('fr-FR')} — ${absenceTitle}`
              : 'Joindre un document justifiant votre absence'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File upload */}
          <div>
            <Label>Document justificatif *</Label>
            <div className="mt-2">
              {file ? (
                <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <FileText className="h-8 w-8 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} Ko
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="shrink-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Cliquez pour sélectionner un fichier
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, image ou document (max 10 Mo)
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Comment */}
          <div>
            <Label>Commentaire (optionnel)</Label>
            <Textarea
              className="mt-2"
              placeholder="Précisez le motif de votre absence..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !file}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                'Envoyer le justificatif'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddJustificationModal;
