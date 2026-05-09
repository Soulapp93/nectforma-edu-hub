import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sparkles, Target, Calculator } from 'lucide-react';
import type { ResolvedBulletinConfig } from '@/types/bulletinConfig';

interface Props {
  cfg: ResolvedBulletinConfig;
  setCfg: (c: ResolvedBulletinConfig) => void;
}

export const RulesTabsList: React.FC = () => (
  <TabsList className="grid grid-cols-2 shrink-0 mx-6 mt-3" data-testid="rules-subtabs">
    <TabsTrigger value="sources" data-testid="tab-sources"><Target className="h-3.5 w-3.5 mr-1" /> Sources</TabsTrigger>
    <TabsTrigger value="calc" data-testid="tab-calc"><Calculator className="h-3.5 w-3.5 mr-1" /> Calculs</TabsTrigger>
  </TabsList>
);

export const RulesSection: React.FC<Props> = ({ cfg, setCfg }) => (
  <>
    {/* ===== SOURCES & COMBINAISONS ===== */}
    <TabsContent value="sources" className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Quelles évaluations entrent dans le bulletin et comment sont-elles combinées ?
        <br />
        Le bulletin regroupe automatiquement toutes les évaluations saisies dans la période.
        Ajustez ci-dessous la portée des périodes et le mode de combinaison si nécessaire.
      </p>

      <div>
        <Label>Mode de combinaison des notes</Label>
        <Select
          value={cfg.sources_config.combination_mode || 'weighted_average'}
          onValueChange={(v: any) => setCfg({ ...cfg, sources_config: { ...cfg.sources_config, combination_mode: v } })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="weighted_average">Moyenne pondérée (par poids)</SelectItem>
            <SelectItem value="replacement">Remplacement (dernière écrase)</SelectItem>
            <SelectItem value="max">Maximum (meilleure note)</SelectItem>
            <SelectItem value="min">Minimum (pire note)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Portée des périodes</Label>
        <Select
          value={cfg.sources_config.period_scope || 'current'}
          onValueChange={(v: any) => setCfg({ ...cfg, sources_config: { ...cfg.sources_config, period_scope: v } })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Période courante uniquement</SelectItem>
            <SelectItem value="all_up_to_current">Toutes les périodes jusqu'à aujourd'hui (cumulatif)</SelectItem>
            <SelectItem value="custom">Périodes personnalisées</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </TabsContent>

    {/* ===== CALCULS ===== */}
    <TabsContent value="calc" className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Moyenne d'un module</Label>
          <Select
            value={cfg.calculation_rules.module_average_method || 'weighted_by_coefficient'}
            onValueChange={(v: any) => setCfg({ ...cfg, calculation_rules: { ...cfg.calculation_rules, module_average_method: v } })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weighted_by_coefficient">Pondérée par coefficients</SelectItem>
              <SelectItem value="simple_average">Moyenne simple</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Moyenne générale</Label>
          <Select
            value={cfg.calculation_rules.general_average_method || 'weighted_by_module_coefficient'}
            onValueChange={(v: any) => setCfg({ ...cfg, calculation_rules: { ...cfg.calculation_rules, general_average_method: v } })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weighted_by_module_coefficient">Coefficients modules</SelectItem>
              <SelectItem value="weighted_by_ects">Crédits ECTS</SelectItem>
              <SelectItem value="average_of_teaching_units">Moyenne des UE</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between border rounded p-3">
        <div>
          <Label>Compensation entre modules</Label>
          <p className="text-xs text-muted-foreground mt-1">Une bonne note compense une mauvaise</p>
        </div>
        <Switch
          checked={!!cfg.calculation_rules.compensation_allowed}
          onCheckedChange={(c) => setCfg({ ...cfg, calculation_rules: { ...cfg.calculation_rules, compensation_allowed: c } })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Seuil rattrapage auto. (&lt;)</Label>
          <Input
            type="number"
            value={cfg.calculation_rules.auto_rattrapage_threshold ?? ''}
            onChange={(e) => setCfg({ ...cfg, calculation_rules: { ...cfg.calculation_rules, auto_rattrapage_threshold: e.target.value ? Number(e.target.value) : null } })}
            placeholder="Ex: 10"
          />
        </div>
        <div>
          <Label>Note éliminatoire (&lt;)</Label>
          <Input
            type="number"
            value={cfg.calculation_rules.eliminatory_note_threshold ?? ''}
            onChange={(e) => setCfg({ ...cfg, calculation_rules: { ...cfg.calculation_rules, eliminatory_note_threshold: e.target.value ? Number(e.target.value) : null } })}
            placeholder="Aucune"
          />
        </div>
        <div>
          <Label>Barème (sur)</Label>
          <Input
            type="number"
            value={cfg.calculation_rules.scale ?? 20}
            onChange={(e) => setCfg({ ...cfg, calculation_rules: { ...cfg.calculation_rules, scale: Number(e.target.value) } })}
          />
        </div>
        <div>
          <Label>Décimales</Label>
          <Input
            type="number"
            value={cfg.calculation_rules.rounding_decimals ?? 2}
            onChange={(e) => setCfg({ ...cfg, calculation_rules: { ...cfg.calculation_rules, rounding_decimals: Number(e.target.value) } })}
          />
        </div>
      </div>

      {/* ===== Phase 4 — Règles avancées ===== */}
      <div className="border-t pt-4 mt-4 space-y-3" data-testid="advanced-rules-section">
        <Label className="text-sm font-semibold flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Règles avancées
        </Label>

        <div className="flex items-center justify-between border rounded p-3" data-testid="rule-ue-eliminatoire">
          <div>
            <Label>UE éliminatoire</Label>
            <p className="text-xs text-muted-foreground mt-1">Une UE non validée bloque l'admission, même si la moyenne générale est ≥ 10</p>
          </div>
          <Switch
            checked={!!cfg.calculation_rules.ue_eliminatoire}
            onCheckedChange={(c) => setCfg({ ...cfg, calculation_rules: { ...cfg.calculation_rules, ue_eliminatoire: c } })}
            data-testid="rule-ue-eliminatoire-switch"
          />
        </div>

        <div className="flex items-center justify-between border rounded p-3" data-testid="rule-bloc-validation">
          <div>
            <Label>Validation par bloc de compétences</Label>
            <p className="text-xs text-muted-foreground mt-1">Chaque bloc doit être validé indépendamment (≥ 10) — pas de compensation entre blocs</p>
          </div>
          <Switch
            checked={!!cfg.calculation_rules.bloc_validation_required}
            onCheckedChange={(c) => setCfg({ ...cfg, calculation_rules: { ...cfg.calculation_rules, bloc_validation_required: c } })}
            data-testid="rule-bloc-validation-switch"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Seuil de points (validation BTS)</Label>
            <Input
              type="number"
              value={cfg.calculation_rules.total_points_threshold ?? 220}
              onChange={(e) => setCfg({ ...cfg, calculation_rules: { ...cfg.calculation_rules, total_points_threshold: Number(e.target.value) } })}
              placeholder="220"
              data-testid="rule-points-threshold"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Référence française BTS : 220 pts = moyenne 10/20</p>
          </div>
          <div>
            <Label>Méthode de décision finale</Label>
            <Select
              value={cfg.calculation_rules.decision_method || 'moyenne'}
              onValueChange={(v) => setCfg({ ...cfg, calculation_rules: { ...cfg.calculation_rules, decision_method: v as 'moyenne' | 'points' | 'hybrid' } })}
            >
              <SelectTrigger data-testid="rule-decision-method"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="moyenne">Sur la moyenne (≥ seuil)</SelectItem>
                <SelectItem value="points">Sur le total des points</SelectItem>
                <SelectItem value="hybrid">Moyenne + UE/blocs validés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </TabsContent>
  </>
);
