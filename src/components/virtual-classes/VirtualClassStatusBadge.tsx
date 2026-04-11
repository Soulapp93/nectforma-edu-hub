import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';

interface Props {
  status: string;
}

export const VirtualClassStatusBadge: React.FC<Props> = ({ status }) => {
  switch (status) {
    case 'synced':
      return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 className="w-3 h-3 mr-1" />Synchronise</Badge>;
    case 'pending':
      return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
    case 'error':
      return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><AlertCircle className="w-3 h-3 mr-1" />Erreur</Badge>;
    case 'cancelled':
      return <Badge className="bg-muted text-muted-foreground"><XCircle className="w-3 h-3 mr-1" />Annule</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};
