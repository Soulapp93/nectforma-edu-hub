import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, GraduationCap, ChevronDown, ChevronRight, BookOpen, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { teachingUnitService, type TeachingUnit } from '@/services/teachingUnitService';
import { moduleService } from '@/services/moduleService';
import { toast } from 'sonner';

interface Props {
  formationId: string;
  onMatiereEdit?: (matiere: any) => void;
}

/**
 * UE → Matières manager.
 *
 * Renders the full hierarchy for one formation:
 *   • UE list with order, title, code, credits
 *   • Each UE expands to show its matières (formation_modules)
 *   • Add/edit/delete UE
 *   • Add a matière to a UE (opens parent's matiere editor)
 *   • Reassign a matière to another UE
 */
const UEManagerPanel: React.FC<Props> = ({ formationId, onMatiereEdit }) => {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingUEId, setEditingUEId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; code: string; credits: string }>({ title: '', code: '', credits: '' });

  const { data: ues = [] } = useQuery<TeachingUnit[]>({
    queryKey: ['teaching-units', formationId],
    queryFn: () => teachingUnitService.listForFormation(formationId),
    enabled: !!formationId,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['formation-modules-with-ue', formationId],
    queryFn: () => moduleService.getFormationModules(formationId),
    enabled: !!formationId,
  });

  const matieresByUE = React.useMemo(() => {
    const m = new Map<string, any[]>();
    for (const mod of modules) {
      const k = mod.teaching_unit_id || '_unassigned';
      const arr = m.get(k) || [];
      arr.push(mod);
      m.set(k, arr);
    }
    // Sort by order_index inside each UE
    for (const [k, v] of m) v.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
    return m;
  }, [modules]);

  const createUE = useMutation({
    mutationFn: () => teachingUnitService.create({
      formation_id: formationId,
      title: `UE ${ues.length + 1}`,
      code: `UE${ues.length + 1}`,
      order_index: ues.length,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teaching-units', formationId] });
      toast.success('Unité d\'enseignement créée');
    },
    onError: (e: any) => toast.error(e.message || 'Erreur lors de la création'),
  });

  const updateUE = useMutation({
    mutationFn: async () => {
      if (!editingUEId) return;
      const credits = editForm.credits ? parseFloat(editForm.credits) : null;
      await teachingUnitService.update(editingUEId, {
        title: editForm.title,
        code: editForm.code || null,
        credits,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teaching-units', formationId] });
      setEditingUEId(null);
      toast.success('UE mise à jour');
    },
    onError: (e: any) => toast.error(e.message || 'Erreur lors de la mise à jour'),
  });

  const deleteUE = useMutation({
    mutationFn: (id: string) => teachingUnitService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teaching-units', formationId] });
      toast.success('UE supprimée');
    },
    onError: (e: any) => toast.error(e.message || 'Suppression impossible'),
  });

  const reassign = useMutation({
    mutationFn: ({ moduleId, ueId }: { moduleId: string; ueId: string | null }) =>
      teachingUnitService.assignMatiereToUE(moduleId, ueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formation-modules-with-ue', formationId] });
      toast.success('Matière déplacée');
    },
  });

  const startEditing = (ue: TeachingUnit) => {
    setEditingUEId(ue.id);
    setEditForm({ title: ue.title, code: ue.code || '', credits: ue.credits != null ? String(ue.credits) : '' });
  };

  const toggle = (ueId: string) => setExpanded((p) => ({ ...p, [ueId]: !p[ueId] }));

  const unassigned = matieresByUE.get('_unassigned') || [];

  return (
    <div className="space-y-3" data-testid="ue-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Unités d'enseignement (UE) & Matières</h3>
          <Badge variant="outline" className="text-[10px]">{ues.length} UE · {modules.length} matières</Badge>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => createUE.mutate()}
          disabled={createUE.isPending}
          className="gap-1.5"
          data-testid="add-ue-btn"
        >
          <Plus className="h-3.5 w-3.5" />
          Nouvelle UE
        </Button>
      </div>

      {/* UE list */}
      {ues.length === 0 && unassigned.length === 0 ? (
        <Card className="p-6 text-center bg-muted/20">
          <GraduationCap className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Aucune UE</p>
          <p className="text-xs text-muted-foreground/70 mb-3">
            Créez une UE pour regrouper les matières de votre formation.
          </p>
          <Button type="button" size="sm" onClick={() => createUE.mutate()} disabled={createUE.isPending}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Créer la première UE
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {ues.map((ue) => {
            const isExpanded = expanded[ue.id] !== false; // default open
            const matieres = matieresByUE.get(ue.id) || [];
            const isEditing = editingUEId === ue.id;
            return (
              <Card key={ue.id} className="overflow-hidden border-l-4 border-l-primary/50" data-testid={`ue-card-${ue.id}`}>
                {/* UE header */}
                <div className="p-3 bg-muted/40 flex items-center gap-2">
                  <button type="button" onClick={() => toggle(ue.id)} className="text-muted-foreground hover:text-foreground">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  {isEditing ? (
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <Input
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="Titre de l'UE"
                        className="h-8 text-sm"
                        data-testid={`ue-title-input-${ue.id}`}
                      />
                      <Input
                        value={editForm.code}
                        onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                        placeholder="Code (UE1, UE2...)"
                        className="h-8 text-sm"
                      />
                      <Input
                        type="number"
                        value={editForm.credits}
                        onChange={(e) => setEditForm({ ...editForm, credits: e.target.value })}
                        placeholder="ECTS (optionnel)"
                        className="h-8 text-sm"
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">{ue.title}</span>
                      {ue.code && <Badge variant="outline" className="text-[10px]">{ue.code}</Badge>}
                      {ue.credits != null && <Badge variant="secondary" className="text-[10px]">{ue.credits} ECTS</Badge>}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {matieres.length} matière{matieres.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <Button type="button" size="sm" onClick={() => updateUE.mutate()} className="h-7 px-2 text-xs">Sauver</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setEditingUEId(null)} className="h-7 px-2 text-xs">Annuler</Button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEditing(ue)}
                          className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary"
                          title="Renommer cette UE"
                          data-testid={`edit-ue-${ue.id}`}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (matieres.length > 0) {
                              toast.error(`Impossible : ${matieres.length} matière(s) y sont rattachées`);
                              return;
                            }
                            if (window.confirm(`Supprimer l'UE "${ue.title}" ?`)) {
                              deleteUE.mutate(ue.id);
                            }
                          }}
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          title="Supprimer cette UE"
                          data-testid={`delete-ue-${ue.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Matières list */}
                {isExpanded && (
                  <div className="p-2 space-y-1.5">
                    {matieres.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic px-2 py-3 text-center">
                        Aucune matière dans cette UE — utilisez la section "Matières" en bas pour en créer ou en déplacer.
                      </p>
                    ) : matieres.map((m: any) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded border bg-background hover:bg-muted/30 text-sm"
                        data-testid={`matiere-row-${m.id}`}
                      >
                        <span className="flex-1 font-medium">{m.title}</span>
                        <Badge variant="outline" className="text-[10px]">coef {m.coefficient || 1}</Badge>
                        {m.duration_hours > 0 && (
                          <Badge variant="secondary" className="text-[10px]">{m.duration_hours}h</Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px]">
                          {(m.module_instructors?.length || m.instructors?.length || 0)} formateur{(m.module_instructors?.length || m.instructors?.length || 0) > 1 ? 's' : ''}
                        </Badge>
                        {/* Reassignment dropdown */}
                        <select
                          value={ue.id}
                          onChange={(e) => reassign.mutate({ moduleId: m.id, ueId: e.target.value || null })}
                          className="text-[10px] px-1.5 py-0.5 border rounded bg-background"
                          title="Déplacer vers une autre UE"
                          data-testid={`matiere-move-${m.id}`}
                        >
                          {ues.map((u) => (
                            <option key={u.id} value={u.id}>{u.title}</option>
                          ))}
                        </select>
                        {onMatiereEdit && (
                          <button
                            type="button"
                            onClick={() => onMatiereEdit(m)}
                            className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary"
                            title="Éditer la matière"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Unassigned matières (legacy / freshly created without UE) */}
      {unassigned.length > 0 && (
        <Card className="border-dashed border-amber-300 bg-amber-50/30 p-2.5">
          <p className="text-xs font-semibold text-amber-700 mb-2 px-1">
            ⚠ {unassigned.length} matière(s) non rattachée(s) à une UE
          </p>
          <div className="space-y-1">
            {unassigned.map((m: any) => (
              <div key={m.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-background text-sm">
                <span className="flex-1 font-medium">{m.title}</span>
                <Badge variant="outline" className="text-[10px]">coef {m.coefficient || 1}</Badge>
                <select
                  value=""
                  onChange={(e) => e.target.value && reassign.mutate({ moduleId: m.id, ueId: e.target.value })}
                  className="text-[10px] px-1.5 py-1 border rounded bg-background"
                  data-testid={`unassigned-move-${m.id}`}
                >
                  <option value="">Affecter à une UE…</option>
                  {ues.map((u) => (
                    <option key={u.id} value={u.id}>{u.title}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default UEManagerPanel;
