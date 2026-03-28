import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Save, Settings2, Calendar, BookOpen, Lock, Unlock, Layers, Link2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  getGradingRules,
  upsertGradingRules,
  getTeachingUnits,
  createTeachingUnit,
  deleteTeachingUnit,
  CREDITS_SYSTEMS,
  type GradingRules,
} from '@/services/gradesService';

interface GradingSettingsPanelProps {
  formationId?: string;
}

const GradingSettingsPanel: React.FC<GradingSettingsPanelProps> = ({ formationId: propFormationId }) => {
  const queryClient = useQueryClient();
  const [selectedFormation, setSelectedFormation] = useState(propFormationId || '');

  // If formationId is passed as prop, use it directly
  const effectiveFormationId = propFormationId || selectedFormation;

  // Formations (only needed if no prop)
  const { data: formations = [] } = useQuery({
    queryKey: ['formations-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('formations').select('id, title, semesters_count, duration_years').order('title');
      return data || [];
    },
    enabled: !propFormationId,
  });

  // Get selected formation details for semesters
  const { data: formationDetails } = useQuery({
    queryKey: ['formation-details-config', effectiveFormationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('formations')
        .select('id, title, semesters_count, duration_years, formation_type')
        .eq('id', effectiveFormationId)
        .single();
      return data;
    },
    enabled: !!effectiveFormationId,
  });

  useEffect(() => {
    if (!propFormationId && formations.length > 0 && !selectedFormation) {
      setSelectedFormation(formations[0].id);
    }
  }, [formations, propFormationId]);

  // Rules
  const { data: rules } = useQuery({
    queryKey: ['grading-rules', effectiveFormationId],
    queryFn: () => getGradingRules(effectiveFormationId),
    enabled: !!effectiveFormationId,
  });

  // Teaching units (sections/blocs)
  const { data: units = [] } = useQuery({
    queryKey: ['teaching-units-settings', effectiveFormationId],
    queryFn: () => getTeachingUnits(effectiveFormationId),
    enabled: !!effectiveFormationId,
  });

  // Modules for assignment
  const { data: modules = [] } = useQuery({
    queryKey: ['formation-modules-config', effectiveFormationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('formation_modules')
        .select('id, title, coefficient, teaching_unit_id, semester')
        .eq('formation_id', effectiveFormationId)
        .order('order_index');
      return data || [];
    },
    enabled: !!effectiveFormationId,
  });

  // Local state for rules
  const [localRules, setLocalRules] = useState<Partial<GradingRules>>({});
  useEffect(() => {
    setLocalRules(rules || {
      formation_id: effectiveFormationId,
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
  }, [rules, effectiveFormationId]);

  // UE form
  const [newUnit, setNewUnit] = useState({ title: '', code: '', coefficient: '1', credits: '' });

  // Semester combinations state
  const [semesterCombinations, setSemesterCombinations] = useState<Array<{ semesters: number[]; label: string }>>([]);
  const [newComboLabel, setNewComboLabel] = useState('');
  const [selectedComboSemesters, setSelectedComboSemesters] = useState<number[]>([]);

  const semestersCount = formationDetails?.semesters_count || (formationDetails?.duration_years || 1) * 2;

  const rulesMutation = useMutation({
    mutationFn: () => upsertGradingRules({ ...localRules, formation_id: effectiveFormationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading-rules'] });
      toast.success('Règles de notation enregistrées');
    },
    onError: () => toast.error('Erreur'),
  });

  const unitMutation = useMutation({
    mutationFn: () => createTeachingUnit({
      formation_id: effectiveFormationId,
      title: newUnit.title,
      code: newUnit.code || null,
      coefficient: parseFloat(newUnit.coefficient),
      credits: newUnit.credits ? parseFloat(newUnit.credits) : null,
      order_index: units.length,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teaching-units-settings'] });
      setNewUnit({ title: '', code: '', coefficient: '1', credits: '' });
      toast.success('Bloc/Section créé');
    },
    onError: () => toast.error('Erreur'),
  });

  const assignModuleToUnit = async (moduleId: string, unitId: string | null) => {
    const { error } = await supabase
      .from('formation_modules')
      .update({ teaching_unit_id: unitId })
      .eq('id', moduleId);
    if (error) {
      toast.error('Erreur lors de l\'assignation');
    } else {
      queryClient.invalidateQueries({ queryKey: ['formation-modules-config'] });
      toast.success('Module assigné');
    }
  };

  const addSemesterCombination = () => {
    if (selectedComboSemesters.length < 2 || !newComboLabel) return;
    setSemesterCombinations(prev => [...prev, { semesters: [...selectedComboSemesters].sort(), label: newComboLabel }]);
    setSelectedComboSemesters([]);
    setNewComboLabel('');
    toast.success('Combinaison de semestres ajoutée');
  };

  const toggleComboSemester = (sem: number) => {
    setSelectedComboSemesters(prev => 
      prev.includes(sem) ? prev.filter(s => s !== sem) : [...prev, sem]
    );
  };

  return (
    <div className="space-y-4">
      {/* Formation selector only if no prop */}
      {!propFormationId && (
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
      )}

      {effectiveFormationId && (
        <Tabs defaultValue="blocs" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-lg">
            <TabsTrigger value="blocs"><Layers className="h-4 w-4 mr-1" /> Blocs / Sections</TabsTrigger>
            <TabsTrigger value="rules"><Settings2 className="h-4 w-4 mr-1" /> Règles</TabsTrigger>
            <TabsTrigger value="combos"><Link2 className="h-4 w-4 mr-1" /> Combinaisons</TabsTrigger>
          </TabsList>

          {/* Blocs / Sections */}
          <TabsContent value="blocs">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Organisation des modules par bloc / section</CardTitle>
                <CardDescription>
                  Créez des blocs (ex : Épreuves écrites, Épreuves orales, UE1, UE2...) et assignez-y vos modules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Existing blocs */}
                {units.length > 0 && (
                  <div className="space-y-3">
                    {units.map((u) => {
                      const assignedModules = modules.filter(m => m.teaching_unit_id === u.id);
                      return (
                        <div key={u.id} className="rounded-xl border border-border bg-muted/20 overflow-hidden">
                          <div className="flex items-center justify-between p-3 bg-muted/40">
                            <div>
                              <p className="font-semibold text-sm">{u.title} {u.code ? `(${u.code})` : ''}</p>
                              <p className="text-xs text-muted-foreground">Coef. {u.coefficient} {u.credits ? `• ${u.credits} crédits` : ''} • {assignedModules.length} module(s)</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => {
                                if (confirm('Supprimer ce bloc ?')) {
                                  deleteTeachingUnit(u.id).then(() => {
                                    queryClient.invalidateQueries({ queryKey: ['teaching-units-settings'] });
                                    toast.success('Bloc supprimé');
                                  });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {assignedModules.length > 0 && (
                            <div className="p-2 space-y-1">
                              {assignedModules.map(m => (
                                <div key={m.id} className="flex items-center justify-between px-3 py-1.5 text-sm bg-background rounded-lg">
                                  <span>{m.title}</span>
                                  <Button size="sm" variant="ghost" className="h-6 text-xs text-muted-foreground" onClick={() => assignModuleToUnit(m.id, null)}>
                                    Retirer
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Unassigned modules */}
                {modules.filter(m => !m.teaching_unit_id).length > 0 && units.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2 text-muted-foreground">Modules non assignés</p>
                    <div className="space-y-1">
                      {modules.filter(m => !m.teaching_unit_id).map(m => (
                        <div key={m.id} className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg text-sm">
                          <span>{m.title} <span className="text-muted-foreground">(Coef. {m.coefficient})</span></span>
                          <Select onValueChange={(unitId) => assignModuleToUnit(m.id, unitId)}>
                            <SelectTrigger className="w-40 h-7 text-xs">
                              <SelectValue placeholder="Assigner à..." />
                            </SelectTrigger>
                            <SelectContent>
                              {units.map(u => (
                                <SelectItem key={u.id} value={u.id}>{u.title}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add new bloc */}
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Ajouter un bloc / section</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
                    <div className="col-span-2 sm:col-span-1">
                      <Label>Titre</Label>
                      <Input value={newUnit.title} onChange={(e) => setNewUnit({ ...newUnit, title: e.target.value })} placeholder="Ex: Épreuves écrites" />
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
                <div className="flex items-center gap-3">
                  <Switch
                    checked={(localRules as any).has_eliminatory_threshold ?? false}
                    onCheckedChange={(v) => setLocalRules({ ...localRules, has_eliminatory_threshold: v } as any)}
                  />
                  <Label>Note éliminatoire</Label>
                </div>
                {(localRules as any).has_eliminatory_threshold && (
                  <div className="w-48">
                    <Label>Seuil éliminatoire</Label>
                    <Input
                      type="number"
                      value={(localRules as any).eliminatory_threshold ?? 6}
                      onChange={(e) => setLocalRules({ ...localRules, eliminatory_threshold: parseFloat(e.target.value) } as any)}
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

          {/* Combinaisons de semestres */}
          <TabsContent value="combos">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Combinaisons de semestres</CardTitle>
                <CardDescription>
                  Combinez plusieurs semestres pour générer un bulletin unique (ex : S1 + S2 = Bulletin Année 1)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Existing combinations */}
                {semesterCombinations.length > 0 && (
                  <div className="space-y-2">
                    {semesterCombinations.map((combo, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                        <div className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">{combo.label}</span>
                          <div className="flex gap-1 ml-2">
                            {combo.semesters.map(s => (
                              <Badge key={s} variant="secondary" className="text-xs">S{s}</Badge>
                            ))}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setSemesterCombinations(prev => prev.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new combination */}
                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-medium">Créer une combinaison</p>
                  <div>
                    <Label className="mb-2 block">Sélectionnez les semestres à combiner</Label>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 6 }, (_, i) => i + 1).map(sem => {
                        const isSelected = selectedComboSemesters.includes(sem);
                        const isAvailable = sem <= semestersCount;
                        return (
                          <button
                            key={sem}
                            onClick={() => isAvailable && toggleComboSemester(sem)}
                            disabled={!isAvailable}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                              isSelected
                                ? 'bg-primary text-primary-foreground border-primary'
                                : isAvailable
                                  ? 'bg-background border-border hover:border-primary/50 text-foreground'
                                  : 'bg-muted/30 border-border/50 text-muted-foreground/50 cursor-not-allowed'
                            }`}
                          >
                            Semestre {sem}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label>Nom du bulletin combiné</Label>
                      <Input
                        value={newComboLabel}
                        onChange={(e) => setNewComboLabel(e.target.value)}
                        placeholder="Ex : Bulletin Année 1"
                      />
                    </div>
                    <Button
                      onClick={addSemesterCombination}
                      disabled={selectedComboSemesters.length < 2 || !newComboLabel}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter
                    </Button>
                  </div>
                  {selectedComboSemesters.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Sélection :</span>
                      {selectedComboSemesters.sort((a, b) => a - b).map(s => (
                        <Badge key={s} className="bg-primary/10 text-primary">S{s}</Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">💡 Comment ça fonctionne ?</p>
                  <p>Les combinaisons permettent de générer un bulletin unique regroupant les moyennes de plusieurs semestres. Par exemple, combiner S1 et S2 créera un "Bulletin Année 1" avec la moyenne générale calculée sur les deux semestres.</p>
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
