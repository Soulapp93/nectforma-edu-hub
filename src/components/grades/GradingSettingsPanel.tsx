import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Save, Settings2, Calendar, BookOpen, Lock, Unlock } from 'lucide-react';
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
  PERIOD_TYPES,
  CREDITS_SYSTEMS,
  type GradingRules,
  type EvaluationPeriod,
  type TeachingUnit,
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
    });
  }, [rules, selectedFormation]);

  // Period form
  const [newPeriod, setNewPeriod] = useState({ name: '', period_type: 'semestre', start_date: '', end_date: '' });
  // UE form
  const [newUnit, setNewUnit] = useState({ title: '', code: '', coefficient: '1', credits: '' });

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
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teaching-units-settings'] });
      setNewUnit({ title: '', code: '', coefficient: '1', credits: '' });
      toast.success('UE créée');
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
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="rules"><Settings2 className="h-4 w-4 mr-1" /> Règles</TabsTrigger>
            <TabsTrigger value="periods"><Calendar className="h-4 w-4 mr-1" /> Périodes</TabsTrigger>
            <TabsTrigger value="units"><BookOpen className="h-4 w-4 mr-1" /> UE</TabsTrigger>
          </TabsList>

          {/* Règles de notation */}
          <TabsContent value="rules">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Règles de notation</CardTitle>
                <CardDescription>Définissez les seuils et paramètres de validation</CardDescription>
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
                <div className="flex items-center gap-3">
                  <Switch
                    checked={localRules.allow_compensation ?? true}
                    onCheckedChange={(v) => setLocalRules({ ...localRules, allow_compensation: v })}
                  />
                  <Label>Autoriser la compensation entre modules</Label>
                </div>
                {localRules.allow_compensation && (
                  <div className="w-48">
                    <Label>Seuil minimum compensation</Label>
                    <Input
                      type="number"
                      value={localRules.compensation_threshold ?? 8}
                      onChange={(e) => setLocalRules({ ...localRules, compensation_threshold: parseFloat(e.target.value) })}
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

          {/* Périodes */}
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

          {/* UE */}
          <TabsContent value="units">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Unités d'enseignement</CardTitle>
                <CardDescription>Regroupez les modules en UE (optionnel)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {units.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                    <div>
                      <p className="font-medium">{u.title} {u.code ? `(${u.code})` : ''}</p>
                      <p className="text-xs text-muted-foreground">Coef. {u.coefficient} {u.credits ? `• ${u.credits} crédits` : ''}</p>
                    </div>
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
                ))}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end border-t pt-4">
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
        </Tabs>
      )}
    </div>
  );
};

export default GradingSettingsPanel;
