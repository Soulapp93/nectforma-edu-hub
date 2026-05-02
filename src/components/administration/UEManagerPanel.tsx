import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, GraduationCap, ChevronDown, ChevronRight, BookOpen, Edit2, Save, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { teachingUnitService, type TeachingUnit } from '@/services/teachingUnitService';
import { moduleService } from '@/services/moduleService';
import { useInstructors } from '@/hooks/useInstructors';
import { toast } from 'sonner';

interface Props {
  formationId: string;
}

interface MatiereDraft {
  title: string;
  coefficient: number;
  duration_hours: number;
  instructorIds: string[];
}

const emptyDraft = (): MatiereDraft => ({ title: '', coefficient: 1, duration_hours: 0, instructorIds: [] });

/**
 * Hierarchy manager: Formation → UE → Matières.
 * Self-contained: handles UE CRUD + Matière CRUD inline. No outer "module list" needed.
 */
const UEManagerPanel: React.FC<Props> = ({ formationId }) => {
  const queryClient = useQueryClient();
  const { instructors } = useInstructors();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingUEId, setEditingUEId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; code: string; credits: string }>({ title: '', code: '', credits: '' });

  const [addingMatiereInUE, setAddingMatiereInUE] = useState<string | null>(null);
  const [matiereDraft, setMatiereDraft] = useState<MatiereDraft>(emptyDraft());

  const [editingMatiereId, setEditingMatiereId] = useState<string | null>(null);
  const [matiereEdit, setMatiereEdit] = useState<MatiereDraft>(emptyDraft());

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
    for (const [, v] of m) v.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
    return m;
  }, [modules]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['teaching-units', formationId] });
    queryClient.invalidateQueries({ queryKey: ['formation-modules-with-ue', formationId] });
    queryClient.invalidateQueries({ queryKey: ['formation-modules', formationId] });
  };

  const createUE = useMutation({
    mutationFn: () => teachingUnitService.create({
      formation_id: formationId,
      title: `UE ${ues.length + 1}`,
      code: `UE${ues.length + 1}`,
      order_index: ues.length,
    }),
    onSuccess: () => {
      invalidateAll();
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
      invalidateAll();
      setEditingUEId(null);
      toast.success('UE mise à jour');
    },
    onError: (e: any) => toast.error(e.message || 'Erreur lors de la mise à jour'),
  });

  const deleteUE = useMutation({
    mutationFn: (id: string) => teachingUnitService.delete(id),
    onSuccess: () => { invalidateAll(); toast.success('UE supprimée'); },
    onError: (e: any) => toast.error(e.message || 'Suppression impossible'),
  });

  const reassign = useMutation({
    mutationFn: ({ moduleId, ueId }: { moduleId: string; ueId: string | null }) =>
      teachingUnitService.assignMatiereToUE(moduleId, ueId),
    onSuccess: () => { invalidateAll(); toast.success('Matière déplacée'); },
  });

  const createMatiere = useMutation({
    mutationFn: async ({ ueId, draft }: { ueId: string; draft: MatiereDraft }) => {
      const orderIndex = (matieresByUE.get(ueId) || []).length;
      const created = await moduleService.createModule({
        formation_id: formationId,
        title: draft.title.trim(),
        description: '',
        duration_hours: draft.duration_hours || 0,
        coefficient: draft.coefficient || 1,
        order_index: orderIndex,
      } as any, draft.instructorIds);
      await teachingUnitService.assignMatiereToUE(created.id, ueId);
      return created;
    },
    onSuccess: () => {
      invalidateAll();
      setAddingMatiereInUE(null);
      setMatiereDraft(emptyDraft());
      toast.success('Matière ajoutée');
    },
    onError: (e: any) => toast.error(e.message || 'Erreur lors de l\'ajout'),
  });

  const updateMatiere = useMutation({
    mutationFn: async ({ moduleId, draft, orderIndex }: { moduleId: string; draft: MatiereDraft; orderIndex: number }) => {
      await moduleService.updateModule(moduleId, {
        title: draft.title.trim(),
        order_index: orderIndex,
        duration_hours: draft.duration_hours || 0,
      } as any, draft.instructorIds);
      // Update coefficient via direct query (not in updateModule signature)
      const { supabase } = await import('@/integrations/supabase/client');
      await (supabase as any).from('formation_modules').update({ coefficient: draft.coefficient || 1 }).eq('id', moduleId);
    },
    onSuccess: () => {
      invalidateAll();
      setEditingMatiereId(null);
      toast.success('Matière mise à jour');
    },
    onError: (e: any) => toast.error(e.message || 'Erreur'),
  });

  const deleteMatiere = useMutation({
    mutationFn: (moduleId: string) => moduleService.deleteModule(moduleId),
    onSuccess: () => { invalidateAll(); toast.success('Matière supprimée'); },
    onError: (e: any) => toast.error(e.message || 'Erreur'),
  });

  const startEditingUE = (ue: TeachingUnit) => {
    setEditingUEId(ue.id);
    setEditForm({ title: ue.title, code: ue.code || '', credits: ue.credits != null ? String(ue.credits) : '' });
  };

  const startAddingMatiere = (ueId: string) => {
    setEditingMatiereId(null);
    setAddingMatiereInUE(ueId);
    setMatiereDraft(emptyDraft());
    setExpanded((p) => ({ ...p, [ueId]: true }));
  };

  const startEditingMatiere = (m: any) => {
    setAddingMatiereInUE(null);
    setEditingMatiereId(m.id);
    setMatiereEdit({
      title: m.title || '',
      coefficient: m.coefficient ?? 1,
      duration_hours: m.duration_hours || 0,
      instructorIds: (m.module_instructors || []).map((mi: any) => mi.instructor_id),
    });
  };

  const toggle = (ueId: string) => setExpanded((p) => ({ ...p, [ueId]: p[ueId] === undefined ? false : !p[ueId] }));
  const isExpanded = (ueId: string) => expanded[ueId] !== false;

  const unassigned = matieresByUE.get('_unassigned') || [];

  const renderInstructorPicker = (selectedIds: string[], onChange: (ids: string[]) => void, testid: string) => (
    <div className="max-h-24 overflow-y-auto border border-primary/20 rounded p-1.5 bg-background">
      {instructors.length === 0 ? (
        <p className="text-[11px] text-muted-foreground px-1">Aucun formateur disponible</p>
      ) : instructors.map((ins) => (
        <label key={ins.id} className="flex items-center gap-1.5 px-1 py-0.5 hover:bg-muted/40 rounded cursor-pointer text-xs">
          <input
            type="checkbox"
            checked={selectedIds.includes(ins.id)}
            onChange={() => {
              const next = selectedIds.includes(ins.id)
                ? selectedIds.filter((x) => x !== ins.id)
                : [...selectedIds, ins.id];
              onChange(next);
            }}
            className="rounded border-primary/30"
            data-testid={`${testid}-${ins.id}`}
          />
          {ins.first_name} {ins.last_name}
        </label>
      ))}
    </div>
  );

  const renderMatiereForm = (
    draft: MatiereDraft,
    setDraft: (d: MatiereDraft) => void,
    onSave: () => void,
    onCancel: () => void,
    isPending: boolean,
    testid: string,
  ) => (
    <div className="border-2 border-primary/40 rounded-lg p-3 bg-primary/5 space-y-2.5" data-testid={testid}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="md:col-span-3">
          <label className="block text-[11px] font-medium text-foreground mb-1">Titre de la matière *</label>
          <Input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Ex: SEO, Mathématiques, Anglais..."
            className="h-8 text-sm"
            data-testid={`${testid}-title`}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-foreground mb-1">Coefficient</label>
          <Input
            type="number"
            min="0.5"
            step="0.5"
            value={draft.coefficient}
            onChange={(e) => setDraft({ ...draft, coefficient: Number(e.target.value) })}
            className="h-8 text-sm"
            data-testid={`${testid}-coef`}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-foreground mb-1">Durée (h)</label>
          <Input
            type="number"
            min="0"
            value={draft.duration_hours}
            onChange={(e) => setDraft({ ...draft, duration_hours: Number(e.target.value) })}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-foreground mb-1 flex items-center gap-1">
            <User className="h-3 w-3" /> Formateur(s)
          </label>
          {renderInstructorPicker(draft.instructorIds, (ids) => setDraft({ ...draft, instructorIds: ids }), `${testid}-instr`)}
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs">
          <X className="h-3 w-3 mr-1" /> Annuler
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onSave}
          disabled={!draft.title.trim() || isPending}
          className="h-7 text-xs"
          data-testid={`${testid}-save`}
        >
          <Save className="h-3 w-3 mr-1" /> {isPending ? '...' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3" data-testid="ue-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Unités d'enseignement (UE) & Matières</h3>
          <Badge variant="outline" className="text-[10px]">{ues.length} UE · {modules.length} matière{modules.length > 1 ? 's' : ''}</Badge>
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

      {/* Empty state */}
      {ues.length === 0 && unassigned.length === 0 ? (
        <Card className="p-6 text-center bg-muted/20">
          <GraduationCap className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Aucune UE</p>
          <p className="text-xs text-muted-foreground/70 mb-3">
            Une formation est organisée en Unités d'Enseignement (UE), chacune regroupant plusieurs matières.
          </p>
          <Button type="button" size="sm" onClick={() => createUE.mutate()} disabled={createUE.isPending} data-testid="create-first-ue-btn">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Créer la première UE
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {ues.map((ue) => {
            const matieres = matieresByUE.get(ue.id) || [];
            const isUEEditing = editingUEId === ue.id;
            const showAddForm = addingMatiereInUE === ue.id;
            return (
              <Card key={ue.id} className="overflow-hidden border-l-4 border-l-primary/50" data-testid={`ue-card-${ue.id}`}>
                {/* UE Header */}
                <div className="p-3 bg-muted/40 flex items-center gap-2">
                  <button type="button" onClick={() => toggle(ue.id)} className="text-muted-foreground hover:text-foreground">
                    {isExpanded(ue.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  {isUEEditing ? (
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
                    <div className="flex-1 flex items-center gap-2 flex-wrap">
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
                    {isUEEditing ? (
                      <>
                        <Button type="button" size="sm" onClick={() => updateUE.mutate()} className="h-7 px-2 text-xs">Sauver</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setEditingUEId(null)} className="h-7 px-2 text-xs">Annuler</Button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startAddingMatiere(ue.id)}
                          className="px-2 py-1 rounded text-[11px] bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1"
                          title="Ajouter une matière dans cette UE"
                          data-testid={`add-matiere-to-${ue.id}`}
                        >
                          <Plus className="h-3 w-3" /> Matière
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditingUE(ue)}
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
                {isExpanded(ue.id) && (
                  <div className="p-2 space-y-1.5">
                    {matieres.length === 0 && !showAddForm ? (
                      <div className="text-center py-3 text-xs text-muted-foreground italic">
                        Aucune matière. Cliquez sur "+ Matière" en haut pour en ajouter une.
                      </div>
                    ) : matieres.map((m: any) => {
                      const isEditing = editingMatiereId === m.id;
                      if (isEditing) {
                        return (
                          <div key={m.id}>
                            {renderMatiereForm(
                              matiereEdit,
                              setMatiereEdit,
                              () => updateMatiere.mutate({ moduleId: m.id, draft: matiereEdit, orderIndex: m.order_index || 0 }),
                              () => setEditingMatiereId(null),
                              updateMatiere.isPending,
                              `matiere-edit-${m.id}`,
                            )}
                          </div>
                        );
                      }
                      const inssCount = m.module_instructors?.length || m.instructors?.length || 0;
                      return (
                        <div
                          key={m.id}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded border bg-background hover:bg-muted/30 text-sm"
                          data-testid={`matiere-row-${m.id}`}
                        >
                          <span className="flex-1 font-medium">{m.title || <em className="text-muted-foreground">Sans titre</em>}</span>
                          <Badge variant="outline" className="text-[10px]">coef {m.coefficient || 1}</Badge>
                          {m.duration_hours > 0 && (
                            <Badge variant="secondary" className="text-[10px]">{m.duration_hours}h</Badge>
                          )}
                          <Badge variant="secondary" className="text-[10px]">
                            {inssCount} formateur{inssCount > 1 ? 's' : ''}
                          </Badge>
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
                          <button
                            type="button"
                            onClick={() => startEditingMatiere(m)}
                            className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary"
                            title="Éditer la matière"
                            data-testid={`edit-matiere-${m.id}`}
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Supprimer la matière "${m.title}" ?`)) {
                                deleteMatiere.mutate(m.id);
                              }
                            }}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                            title="Supprimer la matière"
                            data-testid={`delete-matiere-${m.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}

                    {/* Inline add form */}
                    {showAddForm && renderMatiereForm(
                      matiereDraft,
                      setMatiereDraft,
                      () => createMatiere.mutate({ ueId: ue.id, draft: matiereDraft }),
                      () => { setAddingMatiereInUE(null); setMatiereDraft(emptyDraft()); },
                      createMatiere.isPending,
                      `matiere-add-${ue.id}`,
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Unassigned matières */}
      {unassigned.length > 0 && ues.length > 0 && (
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
