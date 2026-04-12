import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, FileText, Calendar, Clock, User, ExternalLink, Loader2 } from 'lucide-react';
import { absenceJustificationService } from '@/services/absenceJustificationService';
import { notificationService } from '@/services/notificationService';
import { toast } from 'sonner';
import ProductionFileViewer from '@/components/ui/viewers/ProductionFileViewer';

interface AbsenceReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  signatureId: string;
  adminUserId: string;
  onReviewed?: () => void;
}

const AbsenceReviewModal: React.FC<AbsenceReviewModalProps> = ({
  isOpen,
  onClose,
  signatureId,
  adminUserId,
  onReviewed
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [details, setDetails] = useState<any>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);

  useEffect(() => {
    if (isOpen && signatureId) {
      loadDetails();
    }
  }, [isOpen, signatureId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const data = await absenceJustificationService.getAbsenceDetails(signatureId);
      setDetails(data);
    } catch (error) {
      console.error('Error loading absence details:', error);
      toast.error('Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (decision: 'validated' | 'rejected') => {
    if (!details?.justification?.id) return;

    try {
      setSubmitting(true);
      await absenceJustificationService.reviewJustification(
        details.justification.id,
        adminUserId,
        decision,
        reviewComment
      );

      // Send notification to user
      const statusText = decision === 'validated' ? 'validé' : 'rejeté';
      try {
        await notificationService.notifyUser(
          details.signature.user_id,
          `Justificatif d'absence ${statusText}`,
          `Votre justificatif pour l'absence du ${new Date(details.signature.attendance_sheets.date).toLocaleDateString('fr-FR')} a été ${statusText}.${reviewComment ? ` Commentaire: ${reviewComment}` : ''}`,
          'attendance'
        );
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
      }

      toast.success(`Justificatif ${statusText} avec succès`);
      setReviewComment('');
      onReviewed?.();
      onClose();
    } catch (error) {
      console.error('Error reviewing justification:', error);
      toast.error('Erreur lors du traitement');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      pending: { label: 'En attente', className: 'bg-amber-100 text-amber-800' },
      validated: { label: 'Validé', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejeté', className: 'bg-red-100 text-red-800' }
    };
    const info = map[status] || map.pending;
    return <Badge className={info.className}>{info.label}</Badge>;
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Détails de l'absence
          </DialogTitle>
          <DialogDescription>
            Examiner le justificatif et valider ou rejeter
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : details ? (
          <div className="space-y-4">
            {/* Info étudiant/formateur */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {details.userInfo?.first_name} {details.userInfo?.last_name}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {details.userInfo?.role}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(details.signature.attendance_sheets?.date).toLocaleDateString('fr-FR', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {details.signature.attendance_sheets?.start_time?.substring(0, 5)} — {details.signature.attendance_sheets?.end_time?.substring(0, 5)}
                </div>
                <p className="text-sm font-medium text-primary">
                  {details.signature.attendance_sheets?.title}
                </p>
                {details.signature.absence_reason && (
                  <p className="text-sm text-muted-foreground">
                    Motif: {details.signature.absence_reason}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Justificatif */}
            {details.justification ? (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Justificatif joint</h4>
                    {getStatusBadge(details.justification.status)}
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <FileText className="h-8 w-8 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{details.justification.file_name}</p>
                      {details.justification.file_size && (
                        <p className="text-xs text-muted-foreground">
                          {(details.justification.file_size / 1024).toFixed(1)} Ko
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFileViewer(true)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                  </div>
                  {details.justification.comment && (
                    <p className="text-sm text-muted-foreground italic">
                      « {details.justification.comment} »
                    </p>
                  )}

                  {/* Review section - only for pending */}
                  {details.justification.status === 'pending' && (
                    <div className="space-y-3 pt-3 border-t">
                      <div>
                        <Label>Commentaire de révision (optionnel)</Label>
                        <Textarea
                          className="mt-2"
                          placeholder="Ajouter un commentaire..."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-3 justify-end">
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => handleReview('rejected')}
                          disabled={submitting}
                        >
                          {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                          Rejeter
                        </Button>
                        <Button
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleReview('validated')}
                          disabled={submitting}
                        >
                          {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                          Valider
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Already reviewed */}
                  {details.justification.status !== 'pending' && details.justification.review_comment && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Commentaire admin :</span> {details.justification.review_comment}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun justificatif joint</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">Données introuvables</p>
        )}
      </DialogContent>
    </Dialog>

    {/* File Viewer for justification */}
    {details?.justification?.file_url && (
      <ProductionFileViewer
        fileUrl={details.justification.file_url}
        fileName={details.justification.file_name || 'Justificatif'}
        isOpen={showFileViewer}
        onClose={() => setShowFileViewer(false)}
      />
    )}
    </>
  );
};

export default AbsenceReviewModal;
