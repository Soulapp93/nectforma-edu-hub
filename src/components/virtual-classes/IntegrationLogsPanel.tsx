import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IntegrationLog } from '@/services/virtualClassService';
import { format } from 'date-fns';

interface Props {
  logs: IntegrationLog[];
}

export const IntegrationLogsPanel: React.FC<Props> = ({ logs }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Journal d'integration</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Aucune activite enregistree.</p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto" data-testid="integration-logs-list">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${log.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{log.action.replace(/_/g, ' ')}</span>
                    <Badge variant="outline" className="text-xs capitalize">{log.provider}</Badge>
                    {log.status === 'error' && <Badge variant="destructive" className="text-xs">Erreur</Badge>}
                  </div>
                  {log.error_message && <p className="text-xs text-destructive mt-1">{log.error_message}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
