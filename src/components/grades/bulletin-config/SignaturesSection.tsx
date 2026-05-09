import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { SignatoryRow } from './primitives';
import type { ResolvedBulletinConfig } from '@/types/bulletinConfig';

interface Props {
  cfg: ResolvedBulletinConfig;
  setCfg: (c: ResolvedBulletinConfig) => void;
}

export const SignaturesSection: React.FC<Props> = ({ cfg, setCfg }) => (
  <TabsContent value="sign" className="space-y-4">
    <div>
      <Label className="mb-2 block">Signataires</Label>
      <div className="space-y-2">
        {(cfg.signatures_config.signatories || []).map((s, idx) => (
          <SignatoryRow
            key={idx}
            signatory={s}
            onChange={(newS) => {
              const list = [...(cfg.signatures_config.signatories || [])];
              list[idx] = newS;
              setCfg({ ...cfg, signatures_config: { ...cfg.signatures_config, signatories: list } });
            }}
            onDelete={() => {
              const list = (cfg.signatures_config.signatories || []).filter((_, i) => i !== idx);
              setCfg({ ...cfg, signatures_config: { ...cfg.signatures_config, signatories: list } });
            }}
          />
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const list = [...(cfg.signatures_config.signatories || []), { role_label: '', required: false, order: (cfg.signatures_config.signatories?.length ?? 0) + 1 }];
            setCfg({ ...cfg, signatures_config: { ...cfg.signatures_config, signatories: list } });
          }}
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter un signataire
        </Button>
      </div>
    </div>

    <div className="flex items-center justify-between border rounded p-3">
      <Label>Cachet officiel affiché</Label>
      <Switch
        checked={cfg.signatures_config.stamp_enabled !== false}
        onCheckedChange={(c) => setCfg({ ...cfg, signatures_config: { ...cfg.signatures_config, stamp_enabled: c } })}
      />
    </div>
  </TabsContent>
);
