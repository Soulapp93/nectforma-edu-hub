import React from 'react';
import type { ResolvedBulletinConfig } from '@/types/bulletinConfig';

const BulletinLayoutEditor = React.lazy(() => import('../BulletinLayoutEditor'));

interface Props {
  cfg: ResolvedBulletinConfig;
  setCfg: (c: ResolvedBulletinConfig) => void;
}

export const VisualEditorSection: React.FC<Props> = ({ cfg, setCfg }) => (
  <div className="flex-1 overflow-y-auto px-2 py-2" data-testid="visual-editor-section">
    <React.Suspense fallback={<div className="flex justify-center py-12 text-muted-foreground">Chargement de l'éditeur…</div>}>
      <BulletinLayoutEditor
        headerElements={(cfg.layout_config as any)?.layout_elements?.header || []}
        bodyElements={(cfg.layout_config as any)?.layout_elements?.body || []}
        footerElements={(cfg.layout_config as any)?.layout_elements?.footer || []}
        tableColumns={(cfg.layout_config as any)?.table_columns_v2 || []}
        tableStyle={(cfg.layout_config as any)?.table_style_v2 || {
          headerBg: cfg.design_config?.table_header_bg || '#1e40af',
          headerTextColor: cfg.design_config?.table_header_color || '#ffffff',
          rowBg: '#ffffff',
          rowAltBg: '#f8fafc',
          rowTextColor: '#1a1a2e',
          borderColor: '#cbd5e1',
          borderRadius: 8,
          fontSize: 11,
          rowHeight: 28,
        }}
        onChange={(header, body, footer) => {
          setCfg({
            ...cfg,
            layout_config: {
              ...cfg.layout_config,
              layout_elements: { header, body, footer },
            } as any,
          });
        }}
        onTableColumnsChange={(cols) => {
          setCfg({
            ...cfg,
            layout_config: { ...cfg.layout_config, table_columns_v2: cols } as any,
          });
        }}
        onTableStyleChange={(style) => {
          setCfg({
            ...cfg,
            layout_config: { ...cfg.layout_config, table_style_v2: style } as any,
          });
        }}
        primaryColor={cfg.design_config?.primary_color}
        accentColor={cfg.design_config?.accent_color}
      />
    </React.Suspense>
  </div>
);
