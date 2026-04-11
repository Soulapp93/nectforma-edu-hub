import React from 'react';
import { Video, Plus, RefreshCw, Copy, ExternalLink, Eye, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { VirtualClass } from '@/services/virtualClassService';
import { VirtualClassStatusBadge } from './VirtualClassStatusBadge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  virtualClasses: VirtualClass[];
  onCopyLink: (url: string) => void;
  onDelete: (vc: VirtualClass) => void;
  onRetry: (vc: VirtualClass) => void;
  onShowDetail: (vc: VirtualClass) => void;
  onRefresh: () => void;
  onCreateNew: () => void;
}

export const VirtualClassList: React.FC<Props> = ({
  virtualClasses,
  onCopyLink,
  onDelete,
  onRetry,
  onShowDetail,
  onRefresh,
  onCreateNew,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {virtualClasses.length} classe{virtualClasses.length > 1 ? 's' : ''} virtuelle{virtualClasses.length > 1 ? 's' : ''}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} data-testid="vc-refresh-btn">
            <RefreshCw className="w-4 h-4 mr-1" />Actualiser
          </Button>
          <Button size="sm" onClick={onCreateNew} data-testid="vc-create-btn">
            <Plus className="w-4 h-4 mr-1" />Nouvelle classe
          </Button>
        </div>
      </div>

      {virtualClasses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune classe virtuelle</h3>
            <p className="text-muted-foreground mb-4">Créez votre première classe virtuelle avec intégration Zoom.</p>
            <Button onClick={onCreateNew}><Plus className="w-4 h-4 mr-1" />Créer une classe</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {virtualClasses.map((vc) => (
            <Card key={vc.id} className="hover:shadow-md transition-shadow" data-testid={`vc-card-${vc.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground truncate">{vc.title}</h4>
                      <VirtualClassStatusBadge status={vc.status} />
                      <Badge variant="outline" className="capitalize">{vc.provider}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(vc.scheduled_at), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })} — {vc.duration} min
                    </p>
                    {vc.error_message && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />{vc.error_message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {vc.join_url && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => onCopyLink(vc.join_url!)} title="Copier le lien">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="Ouvrir">
                          <a href={vc.join_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a>
                        </Button>
                      </>
                    )}
                    {vc.status === 'error' && (
                      <Button variant="ghost" size="icon" onClick={() => onRetry(vc)} title="Relancer"><RefreshCw className="w-4 h-4" /></Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => onShowDetail(vc)} title="Détails"><Eye className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(vc)} className="text-destructive" title="Supprimer"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
