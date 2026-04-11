import React from 'react';
import { Video, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { virtualClassService, ZoomConnection } from '@/services/virtualClassService';
import { format } from 'date-fns';

interface Props {
  zoomConnection: ZoomConnection | null;
  establishmentId: string;
  onDisconnected: () => void;
  onSetupClick: () => void;
}

export const ZoomIntegrationPanel: React.FC<Props> = ({
  zoomConnection,
  establishmentId,
  onDisconnected,
  onSetupClick,
}) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-500" />Zoom
          </CardTitle>
        </CardHeader>
        <CardContent>
          {zoomConnection ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-medium text-emerald-800 dark:text-emerald-300">Zoom connecte</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">Account ID : {zoomConnection.account_id}</p>
                    <p className="text-xs text-emerald-500">Connecte le {format(new Date(zoomConnection.connected_at), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={async () => {
                    try {
                      await virtualClassService.testZoomConnection(establishmentId);
                      toast.success('Connexion Zoom verifiee avec succes');
                    } catch (err: any) {
                      toast.error('Echec du test : ' + err.message);
                    }
                  }} data-testid="zoom-test-btn">Tester</Button>
                  <Button variant="destructive" size="sm" onClick={async () => {
                    if (!confirm('Deconnecter Zoom ?')) return;
                    await virtualClassService.disconnectZoom(establishmentId);
                    onDisconnected();
                    toast.success('Zoom deconnecte');
                  }} data-testid="zoom-disconnect-btn">Deconnecter</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Video className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground mb-4">Connectez votre compte Zoom pour creer des reunions automatiquement.</p>
              <Button onClick={onSetupClick} data-testid="zoom-setup-btn">Connecter Zoom</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Future providers */}
      <Card className="opacity-60">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Video className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Microsoft Teams</p>
              <p className="text-sm text-muted-foreground">Bientot disponible</p>
            </div>
          </div>
          <Badge variant="outline">A venir</Badge>
        </CardContent>
      </Card>
      <Card className="opacity-60">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Video className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Google Meet</p>
              <p className="text-sm text-muted-foreground">Bientot disponible</p>
            </div>
          </div>
          <Badge variant="outline">A venir</Badge>
        </CardContent>
      </Card>
    </div>
  );
};
