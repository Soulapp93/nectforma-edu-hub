import React from 'react';
import { Copy, ExternalLink, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { VirtualClass } from '@/services/virtualClassService';
import { format } from 'date-fns';

interface Props {
  open: boolean;
  onClose: () => void;
  vc: VirtualClass;
}

export const VirtualClassDetailModal: React.FC<Props> = ({ open, onClose, vc }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{vc.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Date & Heure</Label>
              <p className="text-sm font-medium">{format(new Date(vc.scheduled_at), "dd/MM/yyyy 'a' HH:mm")}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Duree</Label>
              <p className="text-sm font-medium">{vc.duration} minutes</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Fournisseur</Label>
              <p className="text-sm font-medium capitalize">{vc.provider}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Statut</Label>
              <div className="mt-0.5">
                {vc.status === 'synced' && <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 mr-1" />Synchronise</Badge>}
                {vc.status === 'pending' && <Badge className="bg-amber-100 text-amber-700"><Clock className="w-3 h-3 mr-1" />En attente</Badge>}
                {vc.status === 'error' && <Badge className="bg-red-100 text-red-700"><AlertCircle className="w-3 h-3 mr-1" />Erreur</Badge>}
                {vc.status === 'cancelled' && <Badge variant="secondary">Annule</Badge>}
              </div>
            </div>
          </div>
          {vc.description && (
            <div>
              <Label className="text-muted-foreground text-xs">Description</Label>
              <p className="text-sm">{vc.description}</p>
            </div>
          )}
          {vc.join_url && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <Label className="text-muted-foreground text-xs">Lien de participation</Label>
              <div className="flex items-center gap-2">
                <Input value={vc.join_url} readOnly className="text-xs" />
                <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(vc.join_url!); toast.success('Copie'); }}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" asChild>
                  <a href={vc.join_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a>
                </Button>
              </div>
              {vc.password && (
                <p className="text-xs text-muted-foreground">Mot de passe : <span className="font-mono">{vc.password}</span></p>
              )}
            </div>
          )}
          {vc.error_message && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />{vc.error_message}
              </p>
            </div>
          )}
          {vc.last_sync_at && (
            <p className="text-xs text-muted-foreground">
              Derniere synchronisation : {format(new Date(vc.last_sync_at), 'dd/MM/yyyy HH:mm:ss')}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
