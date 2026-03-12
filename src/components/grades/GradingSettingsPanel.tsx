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
import { Plus, Trash2, Save, Settings2, Calendar, BookOpen, Lock, Unlock, Layers, Shield, GraduationCap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  PERIOD_TYPES,
  CREDITS_SYSTEMS,
  EVALUATION_MODES,
  COMPENSATION_MODES,
  type GradingRules,
  type EvaluationPeriod,
  type TeachingUnit,
  type CompetencyBlock,
} from '@/services/gradesService';

const GradingSettingsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedFormation, setSelectedFormation] = useState('');

  // Formations
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

  // Rules
  const { data: rules } = useQuery({
    queryKey: ['grading-rules', selectedFormation],
    queryFn: () => getGradingRules(selectedFormation),
    enabled: !!selectedFormation,
  });

  // Periods
  const { data: periods = [] } = useQuery({
    queryKey: ['evaluation-periods-settings', selectedFormation],
    queryFn: () => getEvaluationPeriods(selectedFormation),
    enabled: !!selectedFormation,
  });

  // Teaching units
  const { data: units = [] } = useQuery({
    queryKey: ['teaching-units-settings', selectedFormation],
    queryFn: () => getTeachingUnits(selectedFormation),
    enabled: !!selectedFormation,
  });

  // Competency blocks
  const { data: blocks = [] } = useQuery({
    queryKey: ['competency-blocks-settings', selectedFormation],
    queryFn: () => getCompetencyBlocks(selectedFormation),
    enabled: !!selectedFormation,
  });

  // Modules
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

  // Local state for rules form
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
    });
  }, [rules, selectedFormation]);

  // Period form
  const [newPeriod, setNewPeriod] = useState({ name: '', period_type: 'semestre', start_date: '', end_date: '' });
  // UE form
  const [newUnit, setNewUnit] = useState({ title: '', code: '', coefficient: '1', credits: '', block_id: '' });
  // Block form
  const [newBlock, setNewBlock] = useState({ title: '', code: '', coefficient: '1', description: '' });

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
          <TabsList className="flex flex-wrap gap-1 w-full max-w-2xl">
            <TabsTrigger value="rules"><Settings2 className="h-4 w-4 mr-1" /> Règles</TabsTrigger>
            <TabsTrigger value="compensation"><Shield className="h-4 w-4 mr-1" /> Compensation</TabsTrigger>
            <TabsTrigger value="blocks"><Layers className="h-4 w-4 mr-1" /> Blocs</TabsTrigger>
            <TabsTrigger value="units"><BookOpen className="h-4 w-4 mr-1" /> UE</TabsTrigger>
            <TabsTrigger value="eval-modes"><GraduationCap className="h-4 w-4 mr-1" /> Modules</TabsTrigger>
            <TabsTrigger value="periods"><Calendar className="h-4 w-4 mr-1" /> Périodes</TabsTrigger>
          </TabsList>

          {/* ==================== RÈGLES ==================== */}
          <TabsContent value="rules">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Règles de notation</CardTitle>
                <CardDescription>Seuils de validation et mentions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Seuil de validation (/20)</Label>
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
                <Button onClick={() => rulesMutation.mutate()} disabled={rulesMutation.isPending} className="gap-2">
                  <Save className="h-4 w-4" />
                  Enregistrer
                </Button>
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
                      <Label>Seuil minimum pour la compensation (/20)</Label>
                      <Input
                        type="number"
                        value={localRules.compensation_threshold ?? 8}
                        onChange={(e) => setLocalRules({ ...localRules, compensation_threshold: parseFloat(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Note en dessous de laquelle la compensation s'applique (rattrapage)
                      </p>
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
                          <Label>Seuil éliminatoire (/20)</Label>
                          <Input
                            type="number"
                            value={localRules.eliminatory_threshold ?? 6}
                            onChange={(e) => setLocalRules({ ...localRules, eliminatory_threshold: parseFloat(e.target.value) })}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            En dessous de cette note, aucune compensation n'est possible (éliminatoire)
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
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
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
                    size="icon"
                    className="mt-6"
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
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
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
                    size="icon"
                    className="mt-6"
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
                        size="sm"
                        variant="ghost"
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
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
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
                      size="icon"
                      className="mt-6"
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
        </Tabs>
      )}
    </div>
  );
};

export default GradingSettingsPanel;
