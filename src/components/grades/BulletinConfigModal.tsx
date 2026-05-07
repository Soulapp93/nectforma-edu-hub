import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  resolveConfigForPeriod,
  upsertConfig,
  listSystemTemplates,
  cloneTemplateToScope,
} from '@/services/bulletinConfigService';
import {
  DEFAULT_CONFIG,
  type ResolvedBulletinConfig,
  type TableColumnKey,
  type BulletinSectionKey,
  type AppreciationRange,
  type SignatoryConfig,
  type MentionConfig,
} from '@/types/bulletinConfig';
import { Sparkles, Trash2, Plus, Target, Calculator, LayoutGrid, Palette, Type, Signature as SignatureIcon, FileStack, ArrowLeft, Wand2 } from 'lucide-react';
import BulletinPreview from './BulletinPreview';
const BulletinLayoutEditor = React.lazy(() => import('./BulletinLayoutEditor'));

interface Props {
  isOpen: boolean;
  onClose: () => void;
  periodId: string;
  periodName?: string;
  formationTitle?: string;
}

const SECTIONS: { key: BulletinSectionKey; label: string }[] = [
  { key: 'header', label: 'En-tete' },
  { key: 'student_identity', label: 'Identite etudiant' },
  { key: 'grades_table', label: 'Tableau des notes' },
  { key: 'general_average', label: 'Moyenne generale' },
  { key: 'class_rank', label: 'Rang dans la classe' },
  { key: 'attendance', label: 'Assiduite' },
  { key: 'general_appreciation', label: 'Appreciation generale' },
  { key: 'decision', label: 'Decision (admis / non admis)' },
  { key: 'signatures', label: 'Signatures & cachet' },
  { key: 'legal_notice', label: 'Mentions legales' },
];

const COLUMNS: { key: TableColumnKey; label: string }[] = [
  { key: 'module', label: 'Module' },
  { key: 'instructor', label: 'Formateur' },
  { key: 'average', label: 'Moyenne' },
  { key: 'cc_average', label: 'Moyenne CC' },
  { key: 'exam_average', label: 'Moyenne Exam' },
  { key: 'coefficient', label: 'Coefficient' },
  { key: 'ects_credits', label: 'Credits ECTS' },
  { key: 'appreciation', label: 'Appreciation' },
  { key: 'class_min', label: 'Note min classe' },
  { key: 'class_max', label: 'Note max classe' },
  { key: 'class_average', label: 'Moyenne classe' },
];

const FONTS = ['Times New Roman', 'Arial', 'Garamond', 'Montserrat', 'Helvetica', 'Georgia'];

const BulletinConfigModal: React.FC<Props> = ({ isOpen, onClose, periodId, periodName, formationTitle }) => {
  const queryClient = useQueryClient();
  const [cfg, setCfg] = useState<ResolvedBulletinConfig>(DEFAULT_CONFIG);
  // Active section in the new hub navigation. 'hub' = grid of 5 cards (default landing)
  type ActiveSection = 'hub' | 'rules' | 'structure' | 'design' | 'signatures' | 'templates' | 'visual-editor';
  const [section, setSection] = useState<ActiveSection>('hub');

  // Load config + templates on open
  const { data: loadedCfg, isLoading } = useQuery({
    queryKey: ['bulletin-config-resolved', periodId],
    queryFn: () => resolveConfigForPeriod(periodId),
    enabled: isOpen && !!periodId,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['bulletin-config-templates'],
    queryFn: () => listSystemTemplates(),
    enabled: isOpen,
  });

  useEffect(() => {
    if (loadedCfg) setCfg(loadedCfg);
  }, [loadedCfg]);

  // Reset to hub each time the modal opens
  useEffect(() => {
    if (isOpen) setSection('hub');
  }, [isOpen]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      await upsertConfig(
        { level: 'period', periodId },
        {
          name: `Configuration — ${periodName || 'Periode'}`,
          sources_config: cfg.sources_config,
          calculation_rules: cfg.calculation_rules,
          layout_config: cfg.layout_config,
          design_config: cfg.design_config,
          text_config: cfg.text_config,
          signatures_config: cfg.signatures_config,
          decision_rules: cfg.decision_rules,
        },
      );
    },
    onSuccess: () => {
      // Invalidate all queries that depend on the bulletin configuration so
      // that the bulletin view + listing tables refetch immediately with the
      // latest design / rules / texts / signatures.
      queryClient.invalidateQueries({ queryKey: ['bulletin-config-resolved'] });
      queryClient.invalidateQueries({ queryKey: ['bulletin-config-templates'] });
      queryClient.invalidateQueries({ queryKey: ['computed-bulletins'] });
      queryClient.invalidateQueries({ queryKey: ['evaluations-transcripts'] });
      queryClient.invalidateQueries({ queryKey: ['combined-source-bulletins'] });
      queryClient.invalidateQueries({ queryKey: ['combined-source-results'] });
      toast.success('Configuration enregistree pour cette periode');
      onClose();
    },
    onError: (e: any) => toast.error(e.message || 'Erreur lors de la sauvegarde'),
  });

  const applyTemplate = async (templateId: string) => {
    try {
      const tpl = templates.find((t: any) => t.id === templateId);
      if (!tpl) return;
      // Merge template into current draft (user can still customize before save)
      setCfg({
        sources_config: { ...DEFAULT_CONFIG.sources_config, ...tpl.sources_config },
        calculation_rules: { ...DEFAULT_CONFIG.calculation_rules, ...tpl.calculation_rules },
        layout_config: {
          ...DEFAULT_CONFIG.layout_config,
          ...tpl.layout_config,
          sections: { ...DEFAULT_CONFIG.layout_config.sections, ...(tpl.layout_config?.sections || {}) },
        },
        design_config: { ...DEFAULT_CONFIG.design_config, ...tpl.design_config },
        text_config: { ...DEFAULT_CONFIG.text_config, ...tpl.text_config },
        signatures_config: { ...DEFAULT_CONFIG.signatures_config, ...tpl.signatures_config },
        decision_rules: { ...DEFAULT_CONFIG.decision_rules, ...tpl.decision_rules },
        source_chain: [],
      });
      toast.success(`Template "${tpl.name}" applique — n'oubliez pas de sauvegarder`);
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col p-0"
        data-testid="bulletin-config-modal"
      >
        <DialogHeader className="shrink-0 px-6 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-3" data-testid="config-modal-title">
            {section !== 'hub' && (
              <button
                onClick={() => setSection('hub')}
                className="rounded-lg p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Retour"
                data-testid="config-back-btn"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <Sparkles className="h-5 w-5 text-primary" />
            <span>
              {section === 'hub' && 'Configuration'}
              {section === 'rules' && 'Règles de calculs'}
              {section === 'structure' && 'Structure'}
              {section === 'design' && 'Design'}
              {section === 'signatures' && 'Signatures'}
              {section === 'templates' && 'Templates'}
              {section === 'visual-editor' && 'Éditeur visuel du bulletin'}
            </span>
            {periodName && <Badge variant="outline">{periodName}</Badge>}
            {formationTitle && <Badge variant="secondary" className="text-xs">{formationTitle}</Badge>}
          </DialogTitle>
          {section === 'hub' && (
            <p className="text-sm text-muted-foreground mt-1">
              Personnalisez entièrement vos bulletins de notes — chaque période garde sa propre configuration.
            </p>
          )}
        </DialogHeader>

        {/* ===== HUB (5 cards landing + live preview) ===== */}
        {section === 'hub' && (
          <div className="flex-1 overflow-y-auto px-6 py-5" data-testid="config-hub">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
              {/* LEFT — 5 cards + visual editor CTA */}
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ConfigCard
                    icon={<Calculator className="h-7 w-7" />}
                    title="Règles de calculs"
                    description="Définissez les règles de calcul des moyennes, coefficients, UE, blocs et décisions."
                    accent="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                    onClick={() => setSection('rules')}
                    testId="config-card-rules"
                  />
                  <ConfigCard
                    icon={<LayoutGrid className="h-7 w-7" />}
                    title="Structure"
                    description="Organisez la structure du bulletin : matières, colonnes et leur ordre d'affichage."
                    accent="bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                    onClick={() => setSection('structure')}
                    testId="config-card-structure"
                  />
                  <ConfigCard
                    icon={<Palette className="h-7 w-7" />}
                    title="Design"
                    description="Personnalisez l'apparence : couleurs, typographies, styles et mises en page."
                    accent="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    onClick={() => setSection('design')}
                    testId="config-card-design"
                  />
                  <ConfigCard
                    icon={<SignatureIcon className="h-7 w-7" />}
                    title="Signatures"
                    description="Ajoutez et positionnez les signatures, cachets et noms sur vos bulletins."
                    accent="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                    onClick={() => setSection('signatures')}
                    testId="config-card-signatures"
                  />
                  <ConfigCard
                    icon={<FileStack className="h-7 w-7" />}
                    title="Templates"
                    description="Créez, gérez et réutilisez vos modèles de bulletins selon les différentes périodes."
                    accent="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                    onClick={() => setSection('templates')}
                    testId="config-card-templates"
                  />
                </div>

                {/* Visual editor CTA — now opens BulletinLayoutEditor */}
                <div className="mt-4 rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-5" data-testid="visual-editor-cta">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Wand2 className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Éditeur visuel du bulletin</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Modifiez chaque élément librement : déplacez, redimensionnez, personnalisez le texte, les couleurs et les images.
                      </p>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setSection('visual-editor' as any)}
                      className="shrink-0"
                      data-testid="open-visual-editor-btn"
                    >
                      <Wand2 className="h-3.5 w-3.5 mr-1" /> Ouvrir l'éditeur
                    </Button>
                  </div>
                </div>
              </div>

              {/* RIGHT — Live preview (reflects current cfg state) */}
              <div className="hidden lg:block sticky top-0 self-start">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" /> Aperçu live
                </div>
                <BulletinPreview config={cfg} periodName={periodName} formationTitle={formationTitle} />
                <p className="text-[10px] text-muted-foreground mt-2 italic text-center">
                  Mise à jour en temps réel selon vos modifications
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ===== VISUAL EDITOR SECTION (Phase 3) ===== */}
        {section === 'visual-editor' && (
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
        )}

        {/* ===== TEMPLATES SECTION ===== */}
        {section === 'templates' && (
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
        )}

        {/* ===== EXISTING TABBED CONTENT (rules / structure / design / signatures) ===== */}
        {section !== 'hub' && section !== 'templates' && section !== 'visual-editor' && (
          <>
            {/* Templates shortcut */}
            <div className="flex items-center gap-2 border-b px-6 py-2 bg-muted/40 overflow-x-auto" data-testid="templates-shortcut">
              <span className="text-xs text-muted-foreground shrink-0">Appliquer un template :</span>
              {templates.map((t: any) => (
                <Button
                  key={t.id}
                  size="sm"
                  variant="outline"
                  onClick={() => applyTemplate(t.id)}
                  data-testid={`apply-template-${t.id}`}
                  className="shrink-0"
                >
                  {t.name.split(' —')[0]}
                </Button>
              ))}
            </div>

            {isLoading ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">Chargement...</div>
            ) : (
              <Tabs
                key={`tabs-${section}`}
                defaultValue={
                  section === 'rules' ? 'sources'
                  : section === 'structure' ? 'layout'
                  : section === 'design' ? 'design'
                  : section === 'signatures' ? 'sign'
                  : 'sources'
                }
                className="flex-1 overflow-hidden flex flex-col"
              >
                {/* Sub-tabs for rules (sources + calc) and design (design + text) */}
                {section === 'rules' && (
                  <TabsList className="grid grid-cols-2 shrink-0 mx-6 mt-3" data-testid="rules-subtabs">
                    <TabsTrigger value="sources" data-testid="tab-sources"><Target className="h-3.5 w-3.5 mr-1" /> Sources</TabsTrigger>
                    <TabsTrigger value="calc" data-testid="tab-calc"><Calculator className="h-3.5 w-3.5 mr-1" /> Calculs</TabsTrigger>
                  </TabsList>
                )}
                {section === 'design' && (
                  <TabsList className="grid grid-cols-2 shrink-0 mx-6 mt-3" data-testid="design-subtabs">
                    <TabsTrigger value="design" data-testid="tab-design"><Palette className="h-3.5 w-3.5 mr-1" /> Apparence</TabsTrigger>
                    <TabsTrigger value="text" data-testid="tab-text"><Type className="h-3.5 w-3.5 mr-1" /> Textes</TabsTrigger>
                  </TabsList>
                )}

            <div className="flex-1 overflow-y-auto mt-4 px-6">
              {/* ===== 1. SOURCES & COMBINAISONS ===== */}
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

              {/* ===== 2. CALCULS ===== */}
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
                      checked={!!(cfg.calculation_rules as any).ue_eliminatoire}
                      onCheckedChange={(c) => setCfg({ ...cfg, calculation_rules: { ...cfg.calculation_rules, ue_eliminatoire: c } as any })}
                      data-testid="rule-ue-eliminatoire-switch"
                    />
                  </div>

                  <div className="flex items-center justify-between border rounded p-3" data-testid="rule-bloc-validation">
                    <div>
                      <Label>Validation par bloc de compétences</Label>
                      <p className="text-xs text-muted-foreground mt-1">Chaque bloc doit être validé indépendamment (≥ 10) — pas de compensation entre blocs</p>
                    </div>
                    <Switch
                      checked={!!(cfg.calculation_rules as any).bloc_validation_required}
                      onCheckedChange={(c) => setCfg({ ...cfg, calculation_rules: { ...cfg.calculation_rules, bloc_validation_required: c } as any })}
                      data-testid="rule-bloc-validation-switch"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Seuil de points (validation BTS)</Label>
                      <Input
                        type="number"
                        value={(cfg.calculation_rules as any).total_points_threshold ?? 220}
                        onChange={(e) => setCfg({ ...cfg, calculation_rules: { ...cfg.calculation_rules, total_points_threshold: Number(e.target.value) } as any })}
                        placeholder="220"
                        data-testid="rule-points-threshold"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">Référence française BTS : 220 pts = moyenne 10/20</p>
                    </div>
                    <div>
                      <Label>Méthode de décision finale</Label>
                      <Select
                        value={(cfg.calculation_rules as any).decision_method || 'moyenne'}
                        onValueChange={(v) => setCfg({ ...cfg, calculation_rules: { ...cfg.calculation_rules, decision_method: v } as any })}
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

              {/* ===== 3. STRUCTURE ===== */}
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

              {/* ===== 4. DESIGN ===== */}
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

                {/* Live design preview */}
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

              {/* ===== 5. TEXTES ===== */}
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

              {/* ===== 6. SIGNATURES ===== */}
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
            </div>
          </Tabs>
            )}
          </>
        )}

        {/* Footer Save bar — hidden on hub & templates landing */}
        {(section === 'rules' || section === 'structure' || section === 'design' || section === 'signatures' || section === 'visual-editor') && (
          <div className="flex justify-end gap-2 px-6 py-3 border-t shrink-0">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              data-testid="bulletin-config-save"
            >
              {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer pour cette période'}
            </Button>
          </div>
        )}
        {section === 'hub' && (
          <div className="flex justify-end gap-2 px-6 py-3 border-t shrink-0">
            <Button variant="outline" onClick={onClose} data-testid="config-hub-close">Fermer</Button>
          </div>
        )}
        {section === 'templates' && (
          <div className="flex justify-between gap-2 px-6 py-3 border-t shrink-0">
            <Button variant="ghost" onClick={() => setSection('hub')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Retour
            </Button>
            <Button variant="outline" onClick={onClose}>Fermer</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ─── Sub-components ───────────────────────────────────────────

const ConfigCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
  onClick: () => void;
  testId: string;
}> = ({ icon, title, description, accent, onClick, testId }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-left rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all p-5 flex flex-col gap-3 group"
    data-testid={testId}
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accent}`}>
      {icon}
    </div>
    <div className="flex-1">
      <h3 className="font-semibold text-foreground text-base">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{description}</p>
    </div>
    <span className="text-sm font-medium text-primary group-hover:underline">Configurer →</span>
  </button>
);

const ColorField: React.FC<{ label: string; value?: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div>
    <Label>{label}</Label>
    <div className="flex gap-2 items-center">
      <Input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} className="w-14 h-9 p-1" />
      <Input value={value || ''} onChange={(e) => onChange(e.target.value)} className="flex-1 text-xs" />
    </div>
  </div>
);

const AppreciationRangeRow: React.FC<{
  range: AppreciationRange;
  onChange: (r: AppreciationRange) => void;
  onDelete: () => void;
}> = ({ range, onChange, onDelete }) => (
  <div className="flex gap-2 items-center">
    <Input type="number" value={range.min} onChange={(e) => onChange({ ...range, min: Number(e.target.value) })} className="w-16 text-xs" placeholder="min" />
    <span className="text-xs">à</span>
    <Input type="number" value={range.max} onChange={(e) => onChange({ ...range, max: Number(e.target.value) })} className="w-16 text-xs" placeholder="max" />
    <Input value={range.text} onChange={(e) => onChange({ ...range, text: e.target.value })} className="flex-1 text-xs" placeholder="Appréciation" />
    <Button variant="ghost" size="sm" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
  </div>
);

const MentionRow: React.FC<{
  mention: MentionConfig;
  onChange: (m: MentionConfig) => void;
  onDelete: () => void;
}> = ({ mention, onChange, onDelete }) => (
  <div className="flex gap-2 items-center">
    <Input value={mention.label} onChange={(e) => onChange({ ...mention, label: e.target.value })} className="flex-1 text-xs" placeholder="Label (Bien, TB...)" />
    <span className="text-xs">≥</span>
    <Input type="number" value={mention.threshold} onChange={(e) => onChange({ ...mention, threshold: Number(e.target.value) })} className="w-20 text-xs" />
    <Button variant="ghost" size="sm" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
  </div>
);

const SignatoryRow: React.FC<{
  signatory: SignatoryConfig;
  onChange: (s: SignatoryConfig) => void;
  onDelete: () => void;
}> = ({ signatory, onChange, onDelete }) => (
  <div className="flex gap-2 items-center border rounded p-2">
    <Input value={signatory.role_label} onChange={(e) => onChange({ ...signatory, role_label: e.target.value })} className="flex-1 text-xs" placeholder="Rôle (Directeur pédagogique, ...)" />
    <Input type="number" value={signatory.order ?? 1} onChange={(e) => onChange({ ...signatory, order: Number(e.target.value) })} className="w-16 text-xs" placeholder="Ordre" />
    <div className="flex items-center gap-1">
      <Checkbox checked={!!signatory.required} onCheckedChange={(c) => onChange({ ...signatory, required: !!c })} />
      <span className="text-xs">Obligatoire</span>
    </div>
    <Button variant="ghost" size="sm" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
  </div>
);

export default BulletinConfigModal;
