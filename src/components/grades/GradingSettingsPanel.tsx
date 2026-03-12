import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Save, Settings2, Calendar, BookOpen, Lock, Unlock, Layers, Shield, GraduationCap, Ruler, FileText, Palette, Eye, Copy } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEstablishment } from '@/hooks/useEstablishment';
import { toast } from 'sonner';
import {
  getGradingRules,
  upsertGradingRules,
  getEvaluationPeriods,
  createEvaluationPeriod,
  deleteEvaluationPeriod,
  togglePeriodLock,
  getTeachingUnits,
  createTeachingUnit,
  deleteTeachingUnit,
  updateTeachingUnit,
  getCompetencyBlocks,
  createCompetencyBlock,
  deleteCompetencyBlock,
  updateModuleEvaluationMode,
  getGradingScales,
  createGradingScale,
  deleteGradingScale,
  getTranscriptTemplates,
  createTranscriptTemplate,
  deleteTranscriptTemplate,
  updateTranscriptTemplate,
  PERIOD_TYPES,
  CREDITS_SYSTEMS,
  EVALUATION_MODES,
  COMPENSATION_MODES,
  SCALE_TYPES,
  PRESET_TEMPLATES,
  getDefaultHeaderConfig,
  getDefaultColumnsConfig,
  getDefaultFooterConfig,
  getDefaultStyleConfig,
  type GradingRules,
  type EvaluationPeriod,
  type TeachingUnit,
  type CompetencyBlock,
  type GradingScale,
  type ScaleLevel,
  type TranscriptTemplate,
} from '@/services/gradesService';

const GradingSettingsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const { establishment } = useEstablishment();
  const [selectedFormation, setSelectedFormation] = useState('');

  const { data: formations = [] } = useQuery({
    queryKey: ['formations-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('formations').select('id, title').order('title');
      return data || [];
    },
  });

  useEffect(() => {
    if (formations.length > 0 && !selectedFormation) setSelectedFormation(formations[0].id);
  }, [formations]);

  // Queries
  const { data: rules } = useQuery({
    queryKey: ['grading-rules', selectedFormation],
    queryFn: () => getGradingRules(selectedFormation),
    enabled: !!selectedFormation,
  });

  const { data: periods = [] } = useQuery({
    queryKey: ['evaluation-periods-settings', selectedFormation],
    queryFn: () => getEvaluationPeriods(selectedFormation),
    enabled: !!selectedFormation,
  });

  const { data: units = [] } = useQuery({
    queryKey: ['teaching-units-settings', selectedFormation],
    queryFn: () => getTeachingUnits(selectedFormation),
    enabled: !!selectedFormation,
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ['competency-blocks-settings', selectedFormation],
    queryFn: () => getCompetencyBlocks(selectedFormation),
    enabled: !!selectedFormation,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['modules-settings', selectedFormation],
    queryFn: async () => {
      const { data } = await supabase
        .from('formation_modules')
        .select('id, title, coefficient, evaluation_mode, teaching_unit_id')
        .eq('formation_id', selectedFormation)
        .order('order_index');
      return data || [];
    },
    enabled: !!selectedFormation,
  });

  const { data: scales = [] } = useQuery({
    queryKey: ['grading-scales', establishment?.id],
    queryFn: () => getGradingScales(establishment!.id),
    enabled: !!establishment?.id,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['transcript-templates', establishment?.id],
    queryFn: () => getTranscriptTemplates(establishment!.id),
    enabled: !!establishment?.id,
  });

  // Local rules state
  const [localRules, setLocalRules] = useState<Partial<GradingRules>>({});
  useEffect(() => {
    setLocalRules(rules || {
      formation_id: selectedFormation,
      validation_threshold: 10,
      allow_compensation: true,
      compensation_threshold: 8,
      credits_system: 'none',
      credits_per_semester: 30,
      mention_passable_threshold: 10,
      mention_ab_threshold: 12,
      mention_bien_threshold: 14,
      mention_tb_threshold: 16,
      compensation_mode: 'intra_block',
      allow_inter_block_compensation: false,
      eliminatory_threshold: null,
      has_eliminatory_threshold: false,
      scale_id: null,
      transcript_template_id: null,
    });
  }, [rules, selectedFormation]);

  // Form states
  const [newPeriod, setNewPeriod] = useState({ name: '', period_type: 'semestre', start_date: '', end_date: '' });
  const [newUnit, setNewUnit] = useState({ title: '', code: '', coefficient: '1', credits: '', block_id: '' });
  const [newBlock, setNewBlock] = useState({ title: '', code: '', coefficient: '1', description: '' });
  const [newScale, setNewScale] = useState({ name: '', scale_type: 'numeric_20', max_value: '20', passing_value: '10' });
  const [newScaleLevels, setNewScaleLevels] = useState<ScaleLevel[]>([]);

  // Mutations
  const rulesMutation = useMutation({
    mutationFn: () => upsertGradingRules({ ...localRules, formation_id: selectedFormation }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading-rules'] });
      toast.success('Règles de notation enregistrées');
    },
    onError: () => toast.error('Erreur'),
  });

  const periodMutation = useMutation({
    mutationFn: () => createEvaluationPeriod({
      formation_id: selectedFormation,
      name: newPeriod.name,
      period_type: newPeriod.period_type,
      start_date: newPeriod.start_date,
      end_date: newPeriod.end_date,
      order_index: periods.length,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluation-periods-settings'] });
      setNewPeriod({ name: '', period_type: 'semestre', start_date: '', end_date: '' });
      toast.success('Période créée');
    },
    onError: () => toast.error('Erreur'),
  });

  const unitMutation = useMutation({
    mutationFn: () => createTeachingUnit({
      formation_id: selectedFormation,
      title: newUnit.title,
      code: newUnit.code || null,
      coefficient: parseFloat(newUnit.coefficient),
      credits: newUnit.credits ? parseFloat(newUnit.credits) : null,
      order_index: units.length,
      block_id: newUnit.block_id || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teaching-units-settings'] });
      setNewUnit({ title: '', code: '', coefficient: '1', credits: '', block_id: '' });
      toast.success('UE créée');
    },
    onError: () => toast.error('Erreur'),
  });

  const blockMutation = useMutation({
    mutationFn: () => createCompetencyBlock({
      formation_id: selectedFormation,
      title: newBlock.title,
      code: newBlock.code || null,
      coefficient: parseFloat(newBlock.coefficient),
      description: newBlock.description || null,
      order_index: blocks.length,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competency-blocks-settings'] });
      setNewBlock({ title: '', code: '', coefficient: '1', description: '' });
      toast.success('Bloc de compétences créé');
    },
    onError: () => toast.error('Erreur'),
  });

  const evalModeMutation = useMutation({
    mutationFn: ({ moduleId, mode }: { moduleId: string; mode: string }) => updateModuleEvaluationMode(moduleId, mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules-settings'] });
      toast.success('Mode d\'évaluation mis à jour');
    },
    onError: () => toast.error('Erreur'),
  });

  const scaleMutation = useMutation({
    mutationFn: () => createGradingScale({
      establishment_id: establishment!.id,
      name: newScale.name,
      scale_type: newScale.scale_type,
      max_value: parseFloat(newScale.max_value),
      passing_value: parseFloat(newScale.passing_value),
      scale_levels: newScale.scale_type === 'custom' ? newScaleLevels : [],
      is_default: scales.length === 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading-scales'] });
      setNewScale({ name: '', scale_type: 'numeric_20', max_value: '20', passing_value: '10' });
      setNewScaleLevels([]);
      toast.success('Barème créé');
    },
    onError: () => toast.error('Erreur'),
  });

  const templateFromPresetMutation = useMutation({
    mutationFn: (preset: typeof PRESET_TEMPLATES[0]) => createTranscriptTemplate({
      establishment_id: establishment!.id,
      name: preset.name,
      description: preset.description,
      template_type: preset.type,
      is_default: templates.length === 0,
      ...preset.config,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transcript-templates'] });
      toast.success('Modèle de relevé créé');
    },
    onError: () => toast.error('Erreur'),
  });

  const addScaleLevel = () => {
    setNewScaleLevels([...newScaleLevels, { label: '', min_value: 0, max_value: 20, is_passing: false }]);
  };

  const updateScaleLevel = (idx: number, field: keyof ScaleLevel, value: any) => {
    const updated = [...newScaleLevels];
    (updated[idx] as any)[field] = value;
    setNewScaleLevels(updated);
  };

  const removeScaleLevel = (idx: number) => {
    setNewScaleLevels(newScaleLevels.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <Select value={selectedFormation} onValueChange={setSelectedFormation}>
        <SelectTrigger className="w-full sm:w-72">
          <SelectValue placeholder="Formation" />
        </SelectTrigger>
        <SelectContent>
          {formations.map((f: any) => (
            <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedFormation && (
        <Tabs defaultValue="rules" className="space-y-4">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex gap-1 w-auto">
              <TabsTrigger value="rules"><Settings2 className="h-4 w-4 mr-1" /> Règles</TabsTrigger>
              <TabsTrigger value="scales"><Ruler className="h-4 w-4 mr-1" /> Barèmes</TabsTrigger>
              <TabsTrigger value="compensation"><Shield className="h-4 w-4 mr-1" /> Compensation</TabsTrigger>
              <TabsTrigger value="blocks"><Layers className="h-4 w-4 mr-1" /> Blocs</TabsTrigger>
              <TabsTrigger value="units"><BookOpen className="h-4 w-4 mr-1" /> UE</TabsTrigger>
              <TabsTrigger value="eval-modes"><GraduationCap className="h-4 w-4 mr-1" /> Modules</TabsTrigger>
              <TabsTrigger value="periods"><Calendar className="h-4 w-4 mr-1" /> Périodes</TabsTrigger>
              <TabsTrigger value="templates"><FileText className="h-4 w-4 mr-1" /> Relevés</TabsTrigger>
            </TabsList>
          </div>

          {/* ==================== RÈGLES ==================== */}
          <TabsContent value="rules">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Règles de notation</CardTitle>
                <CardDescription>Seuils de validation, mentions et barème par défaut</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Seuil de validation</Label>
                    <Input
                      type="number"
                      value={localRules.validation_threshold ?? 10}
                      onChange={(e) => setLocalRules({ ...localRules, validation_threshold: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Système de crédits</Label>
                    <Select
                      value={localRules.credits_system || 'none'}
                      onValueChange={(v) => setLocalRules({ ...localRules, credits_system: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CREDITS_SYSTEMS.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {scales.length > 0 && (
                    <div>
                      <Label>Barème par défaut</Label>
                      <Select
                        value={localRules.scale_id || 'none'}
                        onValueChange={(v) => setLocalRules({ ...localRules, scale_id: v === 'none' ? null : v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Standard /20</SelectItem>
                          {scales.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                {localRules.credits_system !== 'none' && (
                  <div className="w-48">
                    <Label>Crédits par semestre</Label>
                    <Input
                      type="number"
                      value={localRules.credits_per_semester ?? 30}
                      onChange={(e) => setLocalRules({ ...localRules, credits_per_semester: parseInt(e.target.value) })}
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <Label>Passable ≥</Label>
                    <Input type="number" value={localRules.mention_passable_threshold ?? 10} onChange={(e) => setLocalRules({ ...localRules, mention_passable_threshold: parseFloat(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Assez Bien ≥</Label>
                    <Input type="number" value={localRules.mention_ab_threshold ?? 12} onChange={(e) => setLocalRules({ ...localRules, mention_ab_threshold: parseFloat(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Bien ≥</Label>
                    <Input type="number" value={localRules.mention_bien_threshold ?? 14} onChange={(e) => setLocalRules({ ...localRules, mention_bien_threshold: parseFloat(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Très Bien ≥</Label>
                    <Input type="number" value={localRules.mention_tb_threshold ?? 16} onChange={(e) => setLocalRules({ ...localRules, mention_tb_threshold: parseFloat(e.target.value) })} />
                  </div>
                </div>
                {templates.length > 0 && (
                  <div className="w-72">
                    <Label>Modèle de relevé de notes</Label>
                    <Select
                      value={localRules.transcript_template_id || 'none'}
                      onValueChange={(v) => setLocalRules({ ...localRules, transcript_template_id: v === 'none' ? null : v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Par défaut</SelectItem>
                        {templates.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button onClick={() => rulesMutation.mutate()} disabled={rulesMutation.isPending} className="gap-2">
                  <Save className="h-4 w-4" />
                  Enregistrer
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== BARÈMES ==================== */}
          <TabsContent value="scales">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Barèmes de notation</CardTitle>
                <CardDescription>Créez vos propres échelles de notation (/20, /100, lettres, compétences, personnalisé)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing scales */}
                {scales.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{s.name}</p>
                        <Badge variant="secondary" className="text-[10px]">
                          {SCALE_TYPES.find(st => st.value === s.scale_type)?.label || s.scale_type}
                        </Badge>
                        {s.is_default && <Badge className="text-[10px] bg-primary/20 text-primary">Par défaut</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Max: {s.max_value} • Passage: {s.passing_value}
                        {s.scale_levels?.length > 0 && ` • ${s.scale_levels.length} niveaux`}
                      </p>
                    </div>
                    <Button
                      size="sm" variant="ghost" className="text-destructive"
                      onClick={() => {
                        if (confirm('Supprimer ce barème ?')) {
                          deleteGradingScale(s.id).then(() => {
                            queryClient.invalidateQueries({ queryKey: ['grading-scales'] });
                            toast.success('Barème supprimé');
                          });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {/* Quick create from presets */}
                {scales.length === 0 && (
                  <div className="p-4 rounded-lg border border-dashed border-primary/30 bg-primary/5">
                    <p className="text-sm font-medium mb-3">Barèmes prédéfinis — cliquez pour ajouter :</p>
                    <div className="flex flex-wrap gap-2">
                      {SCALE_TYPES.map(st => (
                        <Button
                          key={st.value}
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            createGradingScale({
                              establishment_id: establishment!.id,
                              name: st.label,
                              scale_type: st.value,
                              max_value: st.value === 'numeric_100' ? 100 : 20,
                              passing_value: st.value === 'numeric_100' ? 50 : 10,
                              scale_levels: [],
                              is_default: scales.length === 0,
                            }).then(() => {
                              queryClient.invalidateQueries({ queryKey: ['grading-scales'] });
                              toast.success(`Barème "${st.label}" créé`);
                            });
                          }}
                          className="gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          {st.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom scale form */}
                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-medium">Créer un barème personnalisé</p>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div>
                      <Label>Nom</Label>
                      <Input value={newScale.name} onChange={(e) => setNewScale({ ...newScale, name: e.target.value })} placeholder="Mon barème" />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select value={newScale.scale_type} onValueChange={(v) => setNewScale({ ...newScale, scale_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SCALE_TYPES.map(st => (
                            <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Valeur max</Label>
                      <Input type="number" value={newScale.max_value} onChange={(e) => setNewScale({ ...newScale, max_value: e.target.value })} />
                    </div>
                    <Button
                      onClick={() => scaleMutation.mutate()}
                      disabled={!newScale.name || scaleMutation.isPending}
                      className="gap-1"
                    >
                      <Plus className="h-4 w-4" /> Créer
                    </Button>
                  </div>

                  {newScale.scale_type === 'custom' && (
                    <div className="space-y-2 p-3 rounded-lg bg-muted/20 border">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Niveaux de l'échelle</Label>
                        <Button size="sm" variant="outline" onClick={addScaleLevel} className="gap-1">
                          <Plus className="h-3 w-3" /> Ajouter
                        </Button>
                      </div>
                      {newScaleLevels.map((level, idx) => (
                        <div key={idx} className="grid grid-cols-5 gap-2 items-center">
                          <Input placeholder="Libellé" value={level.label} onChange={(e) => updateScaleLevel(idx, 'label', e.target.value)} className="col-span-2" />
                          <Input type="number" placeholder="Min" value={level.min_value} onChange={(e) => updateScaleLevel(idx, 'min_value', parseFloat(e.target.value))} />
                          <Input type="number" placeholder="Max" value={level.max_value} onChange={(e) => updateScaleLevel(idx, 'max_value', parseFloat(e.target.value))} />
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeScaleLevel(idx)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== COMPENSATION ==================== */}
          <TabsContent value="compensation">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Règles de compensation</CardTitle>
                <CardDescription>Configurez comment les modules et blocs se compensent entre eux</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={localRules.allow_compensation ?? true}
                    onCheckedChange={(v) => setLocalRules({ ...localRules, allow_compensation: v })}
                  />
                  <Label className="font-medium">Autoriser la compensation</Label>
                </div>

                {localRules.allow_compensation && (
                  <>
                    <div>
                      <Label>Mode de compensation</Label>
                      <Select
                        value={localRules.compensation_mode || 'intra_block'}
                        onValueChange={(v) => setLocalRules({ ...localRules, compensation_mode: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {COMPENSATION_MODES.filter(m => m.value !== 'none').map(m => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        {localRules.compensation_mode === 'intra_block' && 'Les modules se compensent au sein d\'un même bloc/UE'}
                        {localRules.compensation_mode === 'inter_block' && 'Les blocs de compétences se compensent entre eux'}
                        {localRules.compensation_mode === 'both' && 'Compensation entre modules dans un bloc ET entre blocs'}
                      </p>
                    </div>

                    <div className="w-64">
                      <Label>Seuil minimum pour la compensation</Label>
                      <Input
                        type="number"
                        value={localRules.compensation_threshold ?? 8}
                        onChange={(e) => setLocalRules({ ...localRules, compensation_threshold: parseFloat(e.target.value) })}
                      />
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={localRules.has_eliminatory_threshold ?? false}
                          onCheckedChange={(v) => setLocalRules({ ...localRules, has_eliminatory_threshold: v })}
                        />
                        <Label className="font-medium">Activer un seuil éliminatoire</Label>
                      </div>
                      {localRules.has_eliminatory_threshold && (
                        <div className="w-64">
                          <Label>Seuil éliminatoire</Label>
                          <Input
                            type="number"
                            value={localRules.eliminatory_threshold ?? 6}
                            onChange={(e) => setLocalRules({ ...localRules, eliminatory_threshold: parseFloat(e.target.value) })}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            En dessous de cette note, aucune compensation n'est possible
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <Button onClick={() => rulesMutation.mutate()} disabled={rulesMutation.isPending} className="gap-2">
                  <Save className="h-4 w-4" />
                  Enregistrer
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== BLOCS DE COMPÉTENCES ==================== */}
          <TabsContent value="blocks">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Blocs de compétences</CardTitle>
                <CardDescription>Regroupez les UE en blocs de compétences pour la validation par bloc</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {blocks.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                    <div>
                      <p className="font-medium">{b.title} {b.code ? `(${b.code})` : ''}</p>
                      <p className="text-xs text-muted-foreground">
                        Coef. {b.coefficient}
                        {b.description ? ` • ${b.description}` : ''}
                      </p>
                      <div className="flex gap-1 mt-1">
                        {units.filter(u => u.block_id === b.id).map(u => (
                          <Badge key={u.id} variant="secondary" className="text-[10px]">{u.title}</Badge>
                        ))}
                        {units.filter(u => u.block_id === b.id).length === 0 && (
                          <span className="text-[10px] text-muted-foreground italic">Aucune UE rattachée</span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm" variant="ghost" className="text-destructive"
                      onClick={() => {
                        if (confirm('Supprimer ce bloc ?')) {
                          deleteCompetencyBlock(b.id).then(() => {
                            queryClient.invalidateQueries({ queryKey: ['competency-blocks-settings'] });
                            toast.success('Bloc supprimé');
                          });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end border-t pt-4">
                  <div>
                    <Label>Titre</Label>
                    <Input value={newBlock.title} onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })} placeholder="Bloc 1 - Activité commerciale" />
                  </div>
                  <div>
                    <Label>Code</Label>
                    <Input value={newBlock.code} onChange={(e) => setNewBlock({ ...newBlock, code: e.target.value })} placeholder="BC1" />
                  </div>
                  <div>
                    <Label>Coefficient</Label>
                    <Input type="number" value={newBlock.coefficient} onChange={(e) => setNewBlock({ ...newBlock, coefficient: e.target.value })} />
                  </div>
                  <Button
                    size="icon" className="mt-6"
                    onClick={() => blockMutation.mutate()}
                    disabled={!newBlock.title}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== UE ==================== */}
          <TabsContent value="units">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Unités d'enseignement</CardTitle>
                <CardDescription>Regroupez les modules en UE et rattachez-les à des blocs de compétences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {units.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                    <div>
                      <p className="font-medium">{u.title} {u.code ? `(${u.code})` : ''}</p>
                      <p className="text-xs text-muted-foreground">
                        Coef. {u.coefficient} {u.credits ? `• ${u.credits} crédits` : ''}
                        {u.block_id ? ` • Bloc: ${blocks.find(b => b.id === u.block_id)?.title || '—'}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {blocks.length > 0 && (
                        <Select
                          value={u.block_id || 'none'}
                          onValueChange={(v) => {
                            updateTeachingUnit(u.id, { block_id: v === 'none' ? null : v } as any).then(() => {
                              queryClient.invalidateQueries({ queryKey: ['teaching-units-settings'] });
                              toast.success('UE rattachée au bloc');
                            });
                          }}
                        >
                          <SelectTrigger className="w-36 h-8 text-xs">
                            <SelectValue placeholder="Bloc" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Aucun bloc</SelectItem>
                            {blocks.map(b => (
                              <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button
                        size="sm" variant="ghost" className="text-destructive"
                        onClick={() => {
                          if (confirm('Supprimer cette UE ?')) {
                            deleteTeachingUnit(u.id).then(() => {
                              queryClient.invalidateQueries({ queryKey: ['teaching-units-settings'] });
                              toast.success('UE supprimée');
                            });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 items-end border-t pt-4">
                  <div className="col-span-2 sm:col-span-1">
                    <Label>Titre</Label>
                    <Input value={newUnit.title} onChange={(e) => setNewUnit({ ...newUnit, title: e.target.value })} placeholder="UE1" />
                  </div>
                  <div>
                    <Label>Code</Label>
                    <Input value={newUnit.code} onChange={(e) => setNewUnit({ ...newUnit, code: e.target.value })} placeholder="UE1" />
                  </div>
                  <div>
                    <Label>Coefficient</Label>
                    <Input type="number" value={newUnit.coefficient} onChange={(e) => setNewUnit({ ...newUnit, coefficient: e.target.value })} />
                  </div>
                  <div>
                    <Label>Crédits</Label>
                    <Input type="number" value={newUnit.credits} onChange={(e) => setNewUnit({ ...newUnit, credits: e.target.value })} placeholder="Opt." />
                  </div>
                  {blocks.length > 0 && (
                    <div>
                      <Label>Bloc</Label>
                      <Select value={newUnit.block_id || 'none'} onValueChange={(v) => setNewUnit({ ...newUnit, block_id: v === 'none' ? '' : v })}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Bloc" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun</SelectItem>
                          {blocks.map(b => (
                            <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button
                    size="icon" className="mt-6"
                    onClick={() => unitMutation.mutate()}
                    disabled={!newUnit.title}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== MODES D'ÉVALUATION PAR MODULE ==================== */}
          <TabsContent value="eval-modes">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mode d'évaluation par module</CardTitle>
                <CardDescription>Définissez si chaque module utilise le contrôle continu, l'examen blanc ou les deux</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {modules.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Aucun module configuré pour cette formation</p>
                ) : (
                  modules.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                      <div>
                        <p className="font-medium text-sm">{m.title}</p>
                        <p className="text-xs text-muted-foreground">Coef. {m.coefficient}</p>
                      </div>
                      <Select
                        value={m.evaluation_mode || 'both'}
                        onValueChange={(v) => evalModeMutation.mutate({ moduleId: m.id, mode: v })}
                      >
                        <SelectTrigger className="w-56 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EVALUATION_MODES.map(em => (
                            <SelectItem key={em.value} value={em.value}>{em.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== PÉRIODES ==================== */}
          <TabsContent value="periods">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Périodes d'évaluation</CardTitle>
                <CardDescription>Créez des semestres, trimestres ou périodes personnalisées</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {periods.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {PERIOD_TYPES.find(pt => pt.value === p.period_type)?.label} • {p.start_date} → {p.end_date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => {
                          togglePeriodLock(p.id, !p.is_locked).then(() => {
                            queryClient.invalidateQueries({ queryKey: ['evaluation-periods-settings'] });
                            toast.success(p.is_locked ? 'Période déverrouillée' : 'Période verrouillée');
                          });
                        }}
                      >
                        {p.is_locked ? <Lock className="h-4 w-4 text-red-500" /> : <Unlock className="h-4 w-4 text-green-500" />}
                      </Button>
                      <Button
                        size="sm" variant="ghost" className="text-destructive"
                        onClick={() => {
                          if (confirm('Supprimer cette période ?')) {
                            deleteEvaluationPeriod(p.id).then(() => {
                              queryClient.invalidateQueries({ queryKey: ['evaluation-periods-settings'] });
                              toast.success('Supprimée');
                            });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end border-t pt-4">
                  <div>
                    <Label>Nom</Label>
                    <Input value={newPeriod.name} onChange={(e) => setNewPeriod({ ...newPeriod, name: e.target.value })} placeholder="Semestre 1" />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={newPeriod.period_type} onValueChange={(v) => setNewPeriod({ ...newPeriod, period_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PERIOD_TYPES.map(pt => (
                          <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Début</Label>
                    <Input type="date" value={newPeriod.start_date} onChange={(e) => setNewPeriod({ ...newPeriod, start_date: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label>Fin</Label>
                      <Input type="date" value={newPeriod.end_date} onChange={(e) => setNewPeriod({ ...newPeriod, end_date: e.target.value })} />
                    </div>
                    <Button
                      size="icon" className="mt-6"
                      onClick={() => periodMutation.mutate()}
                      disabled={!newPeriod.name || !newPeriod.start_date || !newPeriod.end_date}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== TEMPLATES DE RELEVÉS ==================== */}
          <TabsContent value="templates">
            <div className="space-y-4">
              {/* Existing templates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Modèles de relevés de notes</CardTitle>
                  <CardDescription>Sélectionnez un modèle prédéfini ou personnalisez les colonnes et le style de vos bulletins</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {templates.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{t.name}</p>
                          <Badge variant="secondary" className="text-[10px]">{t.template_type}</Badge>
                          {t.is_default && <Badge className="text-[10px] bg-primary/20 text-primary">Par défaut</Badge>}
                        </div>
                        {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {(t.columns_config || []).filter((c: any) => c.enabled).map((c: any) => (
                            <Badge key={c.key} variant="outline" className="text-[9px]">{c.label}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm" variant="ghost" className="text-destructive"
                          onClick={() => {
                            if (confirm('Supprimer ce modèle ?')) {
                              deleteTranscriptTemplate(t.id).then(() => {
                                queryClient.invalidateQueries({ queryKey: ['transcript-templates'] });
                                toast.success('Modèle supprimé');
                              });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {templates.length === 0 && (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      Aucun modèle créé. Choisissez un modèle prédéfini ci-dessous pour commencer.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Preset templates gallery */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Modèles prédéfinis</CardTitle>
                  <CardDescription>Cliquez pour ajouter un modèle de relevé de notes à votre établissement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {PRESET_TEMPLATES.map((preset, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg border border-border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => templateFromPresetMutation.mutate(preset)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{preset.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
                          </div>
                          <Copy className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex gap-1 mt-3 flex-wrap">
                          {(preset.config.columns_config || []).filter((c: any) => c.enabled).map((c: any, i: number) => (
                            <Badge key={i} variant="outline" className="text-[9px]">{c.label}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default GradingSettingsPanel;
