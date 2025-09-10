import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import SignaturePad from '@/components/ui/signature-pad';
import { CheckCircle2, FileText } from 'lucide-react';
import { AttendanceSheet } from '@/services/attendanceService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface AdminValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceSheet: AttendanceSheet;
  onValidate: (signatureData?: string) => Promise<void>;
}

const AdminValidationModal: React.FC<AdminValidationModalProps> = ({
  isOpen,
  onClose,
  attendanceSheet,
  onValidate
}) => {
  const [showSignature, setShowSignature] = useState(false);
  const [validating, setValidating] = useState(false);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const { userId } = useCurrentUser();

  // Charger la signature sauvegardée de l'admin
  useEffect(() => {
    const loadSavedSignature = async () => {
      if (!isOpen || !userId) return;
      
      try {
        const { data, error } = await supabase
          .from('user_signatures')
          .select('signature_data')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.error('Error loading admin signature:', error);
          return;
        }

        if (data?.signature_data) {
          setSavedSignature(data.signature_data);
        }
      } catch (error) {
        console.error('Error loading admin signature:', error);
      }
    };

    loadSavedSignature();
  }, [isOpen, userId]);

  const handleStartSigning = () => {
    setShowSignature(true);
  };

  const handleValidate = async (signatureData?: string) => {
    try {
      setValidating(true);
      await onValidate(signatureData);
      toast.success('Feuille d\'émargement validée et archivée');
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la validation');
    } finally {
      setValidating(false);
    }
  };

  const handleCancelSignature = () => {
    setShowSignature(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Validation Administrative
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations de la séance */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Informations de la séance</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Formation :</span>
                <p className="font-medium">{attendanceSheet.formations?.title}</p>
              </div>
              <div>
                <span className="text-gray-600">Date :</span>
                <p className="font-medium">
                  {format(new Date(attendanceSheet.date), 'EEEE d MMMM yyyy', { locale: fr })}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Horaires :</span>
                <p className="font-medium">
                  {attendanceSheet.start_time} - {attendanceSheet.end_time}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Formateur :</span>
                <p className="font-medium">
                  {attendanceSheet.instructor?.first_name} {attendanceSheet.instructor?.last_name}
                </p>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {attendanceSheet.signatures?.filter(s => s.present).length || 0}
              </div>
              <div className="text-sm text-green-700">Présents</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {attendanceSheet.signatures?.filter(s => !s.present).length || 0}
              </div>
              <div className="text-sm text-red-700">Absents</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {attendanceSheet.signatures?.length || 0}
              </div>
              <div className="text-sm text-blue-700">Total signatures</div>
            </div>
          </div>

          {!showSignature ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center mb-4">
                <FileText className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold">Validation de la feuille d'émargement</h3>
              <p className="text-gray-600 mb-6">
                En validant cette feuille, vous confirmez que toutes les présences ont été vérifiées
                et que les motifs d'absence sont corrects. La feuille sera archivée automatiquement.
              </p>
              
              <div className="flex justify-center space-x-3">
                <Button variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button variant="outline" onClick={() => handleValidate()}>
                  Valider sans signature
                </Button>
                <Button onClick={handleStartSigning} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Valider & Signer
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">Signature Administrative</h3>
              <p className="text-gray-600 mb-4">
                Signez pour confirmer la validation de cette feuille d'émargement
              </p>
              
              <SignaturePad
                onSave={handleValidate}
                onCancel={handleCancelSignature}
                initialSignature={savedSignature || undefined}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminValidationModal;