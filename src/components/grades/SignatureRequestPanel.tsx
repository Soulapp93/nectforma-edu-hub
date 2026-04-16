import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { signatureService, SignatureRequest } from '@/services/signatureService';
import { emailNotificationService } from '@/services/emailNotificationService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEstablishment } from '@/hooks/useEstablishment';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PenTool, Send, Copy, Check, Trash2, Clock, Loader2, Link2, Mail, MailCheck } from 'lucide-react';

interface Props {
  formationId: string;
  periodId?: string | null;
}

const SIGNER_ROLES = ['Directeur', 'Responsable Pedagogique', 'President du Jury', 'Directeur des Etudes', 'Autre'];

const SignatureRequestPanel: React.FC<Props> = ({ formationId, periodId }) => {
  const { userId } = useCurrentUser();
  const { establishment } = useEstablishment();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Directeur');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const { data: formationData } = useQuery({
    queryKey: ['formation-for-sig', formationId],
    queryFn: async () => {
      const { data } = await supabase.from('formations').select('title').eq('id', formationId).single();
      return data;
    },
    enabled: !!formationId,
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['signature-requests', formationId],
    queryFn: () => signatureService.getSignatureRequests(formationId),
    enabled: !!formationId,
  });

  const createMutation = useMutation({
    mutationFn: () => signatureService.createSignatureRequest({
      formationId,
      periodId: periodId || undefined,
      establishmentId: establishment?.id || '',
      signerName: newName,
      signerEmail: newEmail,
      signerRole: newRole,
      requestedBy: userId || '',
    }),
    onSuccess: async (created) => {
      queryClient.invalidateQueries({ queryKey: ['signature-requests', formationId] });
      setShowCreate(false);
      const signUrl = getSignUrl(created.token);
      // Send email notification
      const emailResult = await emailNotificationService.notifySignatureRequest(
        newEmail,
        newName,
        newRole,
        signUrl,
        establishment?.name || 'Etablissement',
        formationData?.title || 'Formation'
      );
      if (emailResult.success) {
        toast.success('Demande de signature envoyee par email');
      } else {
        toast.success('Demande creee. Email non envoye — partagez le lien manuellement.');
      }
      setNewName('');
      setNewEmail('');
      setNewRole('Directeur');
    },
    onError: (e: any) => toast.error(e.message || 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => signatureService.deleteRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signature-requests', formationId] });
      toast.success('Demande supprimee');
    },
  });

  const getSignUrl = (token: string) => `${window.location.origin}/sign/${token}`;

  const copyLink = (req: SignatureRequest) => {
    navigator.clipboard.writeText(getSignUrl(req.token));
    setCopiedId(req.id);
    toast.success('Lien copie dans le presse-papier');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resendEmail = async (req: SignatureRequest) => {
    setResendingId(req.id);
    const signUrl = getSignUrl(req.token);
    const result = await emailNotificationService.notifySignatureRequest(
      req.signer_email,
      req.signer_name,
      req.signer_role,
      signUrl,
      establishment?.name || 'Etablissement',
      formationData?.title || 'Formation'
    );
    setResendingId(null);
    if (result.success) {
      toast.success('Email renvoye avec succes');
    } else {
      toast.error('Echec de l\'envoi de l\'email');
    }
  };

  return (
    <div className="space-y-3" data-testid="signature-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <PenTool className="h-4 w-4 text-primary" />
          Signatures des bulletins
        </h3>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 h-7 text-xs" data-testid="request-signature-btn">
          <Send className="h-3 w-3" /> Demander une signature
        </Button>
      </div>

      {/* Requests list */}
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : requests.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3 bg-muted/30 rounded-lg">
          Aucune demande de signature. Cliquez "Demander une signature" pour envoyer un lien au responsable.
        </p>
      ) : (
        <div className="space-y-2">
          {requests.map(req => (
            <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background" data-testid={`sig-request-${req.id}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${req.status === 'signed' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                {req.status === 'signed' ? <Check className="h-4 w-4 text-emerald-600" /> : <Clock className="h-4 w-4 text-amber-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{req.signer_name}</p>
                  <Badge variant={req.status === 'signed' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                    {req.status === 'signed' ? 'Signe' : 'En attente'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{req.signer_role} &bull; {req.signer_email}</p>
                {req.signed_at && (
                  <p className="text-[10px] text-muted-foreground">
                    Signe le {new Date(req.signed_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {req.status === 'signed' && req.signature_image_url && (
                  <div className="w-16 h-8 border rounded overflow-hidden bg-white">
                    <img src={req.signature_image_url} alt="Signature" className="w-full h-full object-contain" />
                  </div>
                )}
                {req.status === 'pending' && (
                  <>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => resendEmail(req)} title="Renvoyer l'email" data-testid={`resend-email-${req.id}`}>
                      {resendingId === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyLink(req)} title="Copier le lien">
                      {copiedId === req.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(req.id)} title="Supprimer">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md" data-testid="create-signature-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5 text-primary" />
              Demander une signature
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nom du signataire</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="M. Jean Dupont" className="h-9" data-testid="signer-name" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="jean.dupont@ecole.fr" className="h-9" data-testid="signer-email" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="h-9" data-testid="signer-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIGNER_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-xs text-blue-700">
              <Mail className="h-3.5 w-3.5 inline mr-1" />
              Un email contenant le lien de signature sera envoye automatiquement au signataire.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!newName || !newEmail || createMutation.isPending} className="gap-1.5" data-testid="submit-request">
              {createMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SignatureRequestPanel;
