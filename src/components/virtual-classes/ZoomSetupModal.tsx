import React, { useState } from 'react';
import { Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { virtualClassService, ZoomConnection } from '@/services/virtualClassService';

interface Props {
  open: boolean;
  onClose: () => void;
  establishmentId: string;
  onConnected: (conn: ZoomConnection) => void;
}

export const ZoomSetupModal: React.FC<Props> = ({ open, onClose, establishmentId, onConnected }) => {
  const [accountId, setAccountId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [saving, setSaving] = useState(false);

  const handleConnect = async () => {
    if (!accountId || !clientId || !clientSecret) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setSaving(true);
    try {
      const conn = await virtualClassService.saveZoomConnection(establishmentId, {
        account_id: accountId,
        client_id: clientId,
        client_secret: clientSecret,
      });

      try {
        await virtualClassService.testZoomConnection(establishmentId);
        toast.success('Zoom connecte et verifie avec succes !');
      } catch {
        toast.success('Connexion enregistree. Le test sera effectue lors de la prochaine utilisation.');
      }

      onConnected(conn);
      onClose();
      setAccountId(''); setClientId(''); setClientSecret('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-500" />Connecter Zoom
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm space-y-2">
            <p className="font-medium text-blue-800 dark:text-blue-300">Configuration Server-to-Server OAuth</p>
            <ol className="list-decimal list-inside text-blue-700 dark:text-blue-400 space-y-1 text-xs">
              <li>Connectez-vous au <a href="https://marketplace.zoom.us" target="_blank" rel="noopener noreferrer" className="underline">Zoom Marketplace</a></li>
              <li>Creez une application "Server-to-Server OAuth"</li>
              <li>Activez les scopes : <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">meeting:write:admin</code>, <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">meeting:read:admin</code></li>
              <li>Copiez les identifiants ci-dessous</li>
            </ol>
          </div>
          <div>
            <Label>Account ID *</Label>
            <Input value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="Votre Account ID Zoom" data-testid="zoom-account-id" />
          </div>
          <div>
            <Label>Client ID *</Label>
            <Input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="Votre Client ID" data-testid="zoom-client-id" />
          </div>
          <div>
            <Label>Client Secret *</Label>
            <Input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} placeholder="Votre Client Secret" data-testid="zoom-client-secret" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleConnect} disabled={saving} data-testid="zoom-connect-btn">
            {saving ? 'Connexion...' : 'Connecter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
