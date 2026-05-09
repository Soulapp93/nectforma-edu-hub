import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Palette, Type, Plus } from 'lucide-react';
import { ColorField, AppreciationRangeRow, MentionRow } from './primitives';
import { FONTS } from './constants';
import type { ResolvedBulletinConfig } from '@/types/bulletinConfig';

interface Props {
  cfg: ResolvedBulletinConfig;
  setCfg: (c: ResolvedBulletinConfig) => void;
}

export const DesignTabsList: React.FC = () => (
  <TabsList className="grid grid-cols-2 shrink-0 mx-6 mt-3" data-testid="design-subtabs">
    <TabsTrigger value="design" data-testid="tab-design"><Palette className="h-3.5 w-3.5 mr-1" /> Apparence</TabsTrigger>
    <TabsTrigger value="text" data-testid="tab-text"><Type className="h-3.5 w-3.5 mr-1" /> Textes</TabsTrigger>
  </TabsList>
);

export const DesignSection: React.FC<Props> = ({ cfg, setCfg }) => (
  <>
    <TabsContent value="design" className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <ColorField label="Couleur primaire" value={cfg.design_config.primary_color} onChange={(v) => setCfg({ ...cfg, design_config: { ...cfg.design_config, primary_color: v } })} />
        <ColorField label="Couleur accent" value={cfg.design_config.accent_color} onChange={(v) => setCfg({ ...cfg, design_config: { ...cfg.design_config, accent_color: v } })} />
        <ColorField label="Couleur admis" value={cfg.design_config.success_color} onChange={(v) => setCfg({ ...cfg, design_config: { ...cfg.design_config, success_color: v } })} />
        <ColorField label="Couleur non admis" value={cfg.design_config.error_color} onChange={(v) => setCfg({ ...cfg, design_config: { ...cfg.design_config, error_color: v } })} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Police</Label>
          <Select
            value={cfg.design_config.font_family || 'Times New Roman'}
            onValueChange={(v) => setCfg({ ...cfg, design_config: { ...cfg.design_config, font_family: v } })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FONTS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Format</Label>
          <Select
            value={cfg.design_config.page_format || 'A4'}
            onValueChange={(v: any) => setCfg({ ...cfg, design_config: { ...cfg.design_config, page_format: v } })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="A4">A4</SelectItem>
              <SelectItem value="A3">A3</SelectItem>
              <SelectItem value="Letter">Letter (US)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Orientation</Label>
          <Select
            value={cfg.design_config.orientation || 'portrait'}
            onValueChange={(v: any) => setCfg({ ...cfg, design_config: { ...cfg.design_config, orientation: v } })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="portrait">Portrait</SelectItem>
              <SelectItem value="landscape">Paysage</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-between border rounded p-3">
        <div className="flex-1">
          <Label>Filigrane "DOCUMENT OFFICIEL"</Label>
          {cfg.design_config.watermark_enabled && (
            <Input
              className="mt-2 h-8 text-xs"
              placeholder="Texte du filigrane"
              value={cfg.design_config.watermark_text || ''}
              onChange={(e) => setCfg({ ...cfg, design_config: { ...cfg.design_config, watermark_text: e.target.value } })}
              data-testid="watermark-text-input"
            />
          )}
        </div>
        <Switch
          checked={!!cfg.design_config.watermark_enabled}
          onCheckedChange={(c) => setCfg({ ...cfg, design_config: { ...cfg.design_config, watermark_enabled: c } })}
        />
      </div>
      <div className="flex items-center justify-between border rounded p-3">
        <div>
          <Label>QR code de vérification</Label>
        </div>
        <Switch
          checked={!!cfg.design_config.qr_code_enabled}
          onCheckedChange={(c) => setCfg({ ...cfg, design_config: { ...cfg.design_config, qr_code_enabled: c } })}
        />
      </div>

      <div className="border rounded p-3 bg-muted/20">
        <p className="text-[11px] font-semibold text-muted-foreground mb-2">Aperçu du style</p>
        <div
          className="rounded border bg-white p-3"
          style={{
            fontFamily: `${cfg.design_config.font_family || 'Times New Roman'}, serif`,
            color: cfg.design_config.primary_color || '#1a1a2e',
            borderColor: cfg.design_config.primary_color || '#1a1a2e',
            position: 'relative',
            overflow: 'hidden',
          }}
          data-testid="design-preview"
        >
          {cfg.design_config.watermark_enabled && cfg.design_config.watermark_text && (
            <span
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: 4,
                color: cfg.design_config.primary_color || '#1a1a2e',
                opacity: 0.08,
                transform: 'rotate(-20deg)',
              }}
            >
              {cfg.design_config.watermark_text}
            </span>
          )}
          <p className="text-base font-bold tracking-wide">
            {cfg.text_config.main_title || 'BULLETIN DE NOTES'}
          </p>
          <div className="mt-2 flex gap-2 items-center">
            <span
              className="text-xs px-2 py-0.5 rounded font-bold"
              style={{ background: cfg.design_config.success_color || '#16a34a', color: '#fff' }}
            >
              {cfg.decision_rules.admitted_label || 'ADMIS(E)'}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded font-bold"
              style={{ background: cfg.design_config.error_color || '#dc2626', color: '#fff' }}
            >
              {cfg.decision_rules.not_admitted_label || 'NON ADMIS(E)'}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded font-bold ml-auto"
              style={{ background: cfg.design_config.accent_color || '#c8a94e', color: '#1a1a2e' }}
            >
              Accent
            </span>
          </div>
        </div>
      </div>
    </TabsContent>

    {/* ===== TEXTES ===== */}
    <TabsContent value="text" className="space-y-4">
      <div>
        <Label>Titre principal</Label>
        <Input
          value={cfg.text_config.main_title || ''}
          onChange={(e) => setCfg({ ...cfg, text_config: { ...cfg.text_config, main_title: e.target.value } })}
          placeholder="BULLETIN DE NOTES"
        />
      </div>
      <div>
        <Label>Mentions légales (pied de page)</Label>
        <Textarea
          value={cfg.text_config.legal_notice || ''}
          onChange={(e) => setCfg({ ...cfg, text_config: { ...cfg.text_config, legal_notice: e.target.value } })}
          rows={2}
        />
      </div>
      <div>
        <Label className="mb-2 block">Appréciations automatiques par tranche de moyenne</Label>
        <div className="space-y-2">
          {(cfg.text_config.appreciation_ranges || []).map((r, idx) => (
            <AppreciationRangeRow
              key={idx}
              range={r}
              onChange={(newR) => {
                const list = [...(cfg.text_config.appreciation_ranges || [])];
                list[idx] = newR;
                setCfg({ ...cfg, text_config: { ...cfg.text_config, appreciation_ranges: list } });
              }}
              onDelete={() => {
                const list = (cfg.text_config.appreciation_ranges || []).filter((_, i) => i !== idx);
                setCfg({ ...cfg, text_config: { ...cfg.text_config, appreciation_ranges: list } });
              }}
            />
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const list = [...(cfg.text_config.appreciation_ranges || []), { min: 0, max: 10, text: '' }];
              setCfg({ ...cfg, text_config: { ...cfg.text_config, appreciation_ranges: list } });
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter une tranche
          </Button>
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Décisions & mentions</Label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">Seuil admission</Label>
            <Input
              type="number"
              value={cfg.decision_rules.admission_threshold ?? 10}
              onChange={(e) => setCfg({ ...cfg, decision_rules: { ...cfg.decision_rules, admission_threshold: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label className="text-xs">Label admis</Label>
            <Input
              value={cfg.decision_rules.admitted_label || ''}
              onChange={(e) => setCfg({ ...cfg, decision_rules: { ...cfg.decision_rules, admitted_label: e.target.value } })}
            />
          </div>
          <div>
            <Label className="text-xs">Label non admis</Label>
            <Input
              value={cfg.decision_rules.not_admitted_label || ''}
              onChange={(e) => setCfg({ ...cfg, decision_rules: { ...cfg.decision_rules, not_admitted_label: e.target.value } })}
            />
          </div>
        </div>
        <Label className="text-xs mt-3 mb-2 block">Mentions (Passable, AB, B, TB...)</Label>
        <div className="space-y-1">
          {(cfg.decision_rules.mentions || []).map((m, idx) => (
            <MentionRow
              key={idx}
              mention={m}
              onChange={(newM) => {
                const list = [...(cfg.decision_rules.mentions || [])];
                list[idx] = newM;
                setCfg({ ...cfg, decision_rules: { ...cfg.decision_rules, mentions: list } });
              }}
              onDelete={() => {
                const list = (cfg.decision_rules.mentions || []).filter((_, i) => i !== idx);
                setCfg({ ...cfg, decision_rules: { ...cfg.decision_rules, mentions: list } });
              }}
            />
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const list = [...(cfg.decision_rules.mentions || []), { label: '', threshold: 10 }];
              setCfg({ ...cfg, decision_rules: { ...cfg.decision_rules, mentions: list } });
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter une mention
          </Button>
        </div>
      </div>
    </TabsContent>
  </>
);
