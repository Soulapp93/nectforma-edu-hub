import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, Calendar, Clock, BookOpen, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import SignaturePad from '@/components/ui/signature-pad';

interface LinkAttendanceSigningProps {
  isOpen: boolean;
  onClose: () => void;
  linkToken: string;
  onSigned?: () => void;
}

const LinkAttendanceSigning: React.FC<LinkAttendanceSigningProps> = ({
  isOpen,
  onClose,
  linkToken,
  onSigned,
}) => {
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [linkData, setLinkData] = useState<any>(null);
  const [sheetData, setSheetData] = useState<any>(null);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && linkToken) {
      validateAndLoad();
    }
  }, [isOpen, linkToken]);

  const validateAndLoad = async () => {
    setLoading(true);
    setError(null);
    try {
      // Validate the token
      const { data: validationResult, error: valError } = await (supabase.rpc as any)(
        'validate_student_link_token',
        { token_param: linkToken }
      );

      if (valError) throw valError;

      const result = Array.isArray(validationResult) ? validationResult[0] : validationResult;

      if (!result?.is_valid) {
        setError(result?.error_message || 'Token invalide');
        setLoading(false);
        return;
      }

      setLinkData(result);

      // Load the attendance sheet details
      const { data: sheet, error: sheetError } = await supabase
        .from('attendance_sheets')
        .select('*, formations(title, level)')
        .eq('id', result.sheet_id)
        .single();

      if (sheetError) throw sheetError;
      setSheetData(sheet);

      // Load saved signature from profile
      const { data: userSig } = await supabase
        .from('user_signatures' as any)
        .select('signature_data')
        .eq('user_id', result.student_id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (userSig) {
        setSavedSignature((userSig as any).signature_data);
      }
    } catch (err: any) {
      console.error('Error validating link token:', err);
      setError(err.message || 'Erreur de validation');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (signatureData: string) => {
    if (!linkData || !sheetData) return;
    setSigning(true);
    try {
      // 1. Check if already signed
      const { data: existing } = await supabase
        .from('attendance_signatures')
        .select('id')
        .eq('attendance_sheet_id', linkData.sheet_id)
        .eq('user_id', linkData.student_id)
        .eq('present', true)
        .maybeSingle();

      if (existing) {
        toast.info('Vous avez déjà signé cette feuille d\'émargement');
        setSuccess(true);
        return;
      }

      // 2. Upsert the signature (may already exist as absent -> update to present)
      const { data: existingSig } = await supabase
        .from('attendance_signatures')
        .select('id')
        .eq('attendance_sheet_id', linkData.sheet_id)
        .eq('user_id', linkData.student_id)
        .maybeSingle();

      if (existingSig) {
        await supabase
          .from('attendance_signatures')
          .update({
            present: true,
            signature_data: signatureData,
            signed_at: new Date().toISOString(),
          })
          .eq('id', existingSig.id);
      } else {
        await supabase.from('attendance_signatures').insert({
          attendance_sheet_id: linkData.sheet_id,
          user_id: linkData.student_id,
          user_type: 'student',
          present: true,
          signature_data: signatureData,
          signed_at: new Date().toISOString(),
        });
      }

      // 3. Mark the link as used
      await supabase
        .from('attendance_student_links' as any)
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq('id', linkData.link_id);

      // 4. Save signature to user_signatures for reuse
      if (signatureData && signatureData.trim() !== '') {
        await supabase.from('user_signatures' as any).upsert(
          { user_id: linkData.student_id, signature_data: signatureData },
          { onConflict: 'user_id' }
        );
      }

      setSuccess(true);
      toast.success('Émargement signé avec succès !');
      onSigned?.();
    } catch (err: any) {
      console.error('Error signing:', err);
      toast.error(`Erreur lors de la signature: ${err.message}`);
    } finally {
      setSigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Signature d'émargement
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">Vérification du lien...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Lien invalide</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={onClose} className="mt-6">
              Fermer
            </Button>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Émargement signé !
            </h3>
            <p className="text-muted-foreground">
              Votre signature a été enregistrée avec succès.
            </p>
            <Button onClick={onClose} className="mt-6">
              Fermer
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Session info */}
            {sheetData && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 space-y-2">
                  <p className="font-semibold text-foreground">{sheetData.title}</p>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(sheetData.date), 'EEEE d MMMM yyyy', { locale: fr })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {sheetData.start_time?.substring(0, 5)} - {sheetData.end_time?.substring(0, 5)}
                    </span>
                  </div>
                  <Badge variant="secondary">
                    {(sheetData.formations as any)?.title || 'Formation'}
                  </Badge>
                </CardContent>
              </Card>
            )}

            {/* Signature pad */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {savedSignature
                  ? 'Votre signature enregistrée est pré-chargée. Vous pouvez la modifier si nécessaire.'
                  : 'Signez dans le cadre ci-dessous pour confirmer votre présence.'}
              </p>
              <SignaturePad
                onSave={handleSign}
                onCancel={onClose}
                initialSignature={savedSignature || undefined}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LinkAttendanceSigning;
