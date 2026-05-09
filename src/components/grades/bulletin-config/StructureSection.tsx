import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { TabsContent } from '@/components/ui/tabs';
import { SECTIONS, COLUMNS } from './constants';
import type { ResolvedBulletinConfig } from '@/types/bulletinConfig';

interface Props {
  cfg: ResolvedBulletinConfig;
  setCfg: (c: ResolvedBulletinConfig) => void;
}

export const StructureSection: React.FC<Props> = ({ cfg, setCfg }) => (
  <TabsContent value="layout" className="space-y-4">
    <div>
      <Label className="mb-2 block">Sections affichées</Label>
      <div className="grid grid-cols-2 gap-2 border rounded p-2">
        {SECTIONS.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <Checkbox
              checked={cfg.layout_config.sections?.[s.key] !== false}
              onCheckedChange={(c) => setCfg({
                ...cfg,
                layout_config: { ...cfg.layout_config, sections: { ...(cfg.layout_config.sections || {}), [s.key]: !!c } },
              })}
            />
            <span className="text-xs">{s.label}</span>
          </div>
        ))}
      </div>
    </div>

    <div>
      <Label className="mb-2 block">Colonnes du tableau</Label>
      <p className="text-xs text-muted-foreground mb-2">
        Glissez-déposez les colonnes sélectionnées pour les réordonner. Cliquez sur une colonne disponible pour l'ajouter à la fin.
      </p>

      {/* Selected columns (drag to reorder) */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground mb-1">Colonnes affichées (ordre du tableau)</p>
        <div className="flex flex-wrap gap-1.5 border rounded p-2 min-h-[44px] bg-muted/20" data-testid="selected-columns-zone">
          {(cfg.layout_config.table_columns || []).length === 0 && (
            <span className="text-xs text-muted-foreground italic px-1">Aucune colonne — sélectionnez ci-dessous</span>
          )}
          {(cfg.layout_config.table_columns || []).map((colKey, idx) => {
            const col = COLUMNS.find((c) => c.key === colKey);
            if (!col) return null;
            return (
              <div
                key={col.key}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', String(idx));
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                  if (Number.isNaN(fromIdx) || fromIdx === idx) return;
                  const next = [...(cfg.layout_config.table_columns || [])];
                  const [moved] = next.splice(fromIdx, 1);
                  next.splice(idx, 0, moved);
                  setCfg({ ...cfg, layout_config: { ...cfg.layout_config, table_columns: next } });
                }}
                className="flex items-center gap-1 px-2 py-1 rounded border bg-card text-xs cursor-move hover:bg-primary/5 active:scale-95 transition-transform select-none"
                data-testid={`selected-column-${col.key}`}
                title="Glisser pour réordonner"
              >
                <span className="text-muted-foreground">≡</span>
                <span className="font-medium">{col.label}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = (cfg.layout_config.table_columns || []).filter((x) => x !== col.key);
                    setCfg({ ...cfg, layout_config: { ...cfg.layout_config, table_columns: next } });
                  }}
                  className="ml-1 text-muted-foreground hover:text-destructive"
                  data-testid={`remove-column-${col.key}`}
                  aria-label={`Retirer ${col.label}`}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Available columns to add */}
      <div className="mt-3">
        <p className="text-[11px] font-semibold text-muted-foreground mb-1">Colonnes disponibles</p>
        <div className="flex flex-wrap gap-1.5">
          {COLUMNS.filter((c) => !(cfg.layout_config.table_columns || []).includes(c.key)).map((col) => (
            <button
              key={col.key}
              type="button"
              onClick={() => {
                const next = [...(cfg.layout_config.table_columns || []), col.key];
                setCfg({ ...cfg, layout_config: { ...cfg.layout_config, table_columns: next } });
              }}
              className="px-2 py-1 rounded border border-dashed text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              data-testid={`add-column-${col.key}`}
            >
              + {col.label}
            </button>
          ))}
          {COLUMNS.every((c) => (cfg.layout_config.table_columns || []).includes(c.key)) && (
            <span className="text-xs text-muted-foreground italic px-1">Toutes les colonnes sont sélectionnées</span>
          )}
        </div>
      </div>

      {/* Live preview of the column header row */}
      <div className="mt-3">
        <p className="text-[11px] font-semibold text-muted-foreground mb-1">Aperçu de l'en-tête</p>
        <div className="overflow-x-auto border rounded">
          <table className="w-full text-[11px]">
            <thead>
              <tr style={{ background: cfg.design_config.primary_color || '#1a1a2e', color: '#fff' }}>
                {(cfg.layout_config.table_columns || []).map((colKey) => {
                  const col = COLUMNS.find((c) => c.key === colKey);
                  return col ? (
                    <th key={col.key} className="px-2 py-1 text-left font-semibold whitespace-nowrap">
                      {col.label}
                    </th>
                  ) : null;
                })}
                {(cfg.layout_config.table_columns || []).length === 0 && (
                  <th className="px-2 py-2 text-center italic font-normal">Aucune colonne</th>
                )}
              </tr>
            </thead>
          </table>
        </div>
      </div>
    </div>

    <div className="flex items-center justify-between border rounded p-3">
      <div>
        <Label>Regrouper par Unité d'Enseignement (UE)</Label>
        <p className="text-xs text-muted-foreground mt-1">Affiche les modules groupés par UE avec sous-totaux</p>
      </div>
      <Switch
        checked={!!cfg.layout_config.group_by_teaching_unit}
        onCheckedChange={(c) => setCfg({ ...cfg, layout_config: { ...cfg.layout_config, group_by_teaching_unit: c } })}
      />
    </div>
  </TabsContent>
);
