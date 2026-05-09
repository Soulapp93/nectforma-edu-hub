import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Props {
  templates: any[];
  applyTemplate: (id: string) => void;
}

export const TemplatesSection: React.FC<Props> = ({ templates, applyTemplate }) => (
  <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4" data-testid="templates-section">
    <p className="text-sm text-muted-foreground">
      Choisissez un template pour cette période, ou repartez d'un modèle système. Chaque période garde sa propre configuration.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {templates.map((t: any) => (
        <div key={t.id} className="border rounded-xl p-4 hover:border-primary/40 hover:shadow-sm transition-all" data-testid={`template-card-${t.id}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground truncate">{t.name.split(' —')[0]}</h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description || 'Modèle système prêt à l\'emploi.'}</p>
            </div>
            <Badge variant="outline" className="shrink-0 text-[10px]">Système</Badge>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="default" onClick={() => applyTemplate(t.id)} className="flex-1" data-testid={`template-apply-${t.id}`}>
              Appliquer
            </Button>
          </div>
        </div>
      ))}
      {templates.length === 0 && (
        <p className="text-sm italic text-muted-foreground col-span-2 text-center py-8 border-2 border-dashed rounded-xl">
          Aucun template système disponible.
        </p>
      )}
    </div>
    <div className="rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
      <strong className="text-foreground">À venir :</strong> sauvegarder votre configuration actuelle comme template personnalisé, dupliquer, versionner et lier à plusieurs périodes.
    </div>
  </div>
);
