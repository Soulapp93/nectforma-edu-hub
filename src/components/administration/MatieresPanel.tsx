import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, BookOpen, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
 * Flat matières manager: Formation → Matières (no UE layer).
 * Allows admins to create/edit/delete matières directly with coefficients & instructors.
 */
const MatieresPanel: React.FC<Props> = ({ formationId }) => {
  const queryClient = useQueryClient();
  const { instructors } = useInstructors();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<MatiereDraft>(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<MatiereDraft>(emptyDraft());

  const { data: modules = [] } = useQuery({
    queryKey: ['formation-modules-flat', formationId],
    queryFn: () => moduleService.getFormationModules(formationId),
    enabled: !!formationId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['formation-modules-flat', formationId] });
    queryClient.invalidateQueries({ queryKey: ['formation-modules', formationId] });
    queryClient.invalidateQueries({ queryKey: ['formation-modules-with-ue', formationId] });
  };

  const createMatiere = useMutation({
    mutationFn: async () => {
      await moduleService.createModule({
        formation_id: formationId,
        title: draft.title.trim(),
        description: '',
        duration_hours: draft.duration_hours || 0,
        coefficient: draft.coefficient || 1,
        order_index: modules.length,
      } as any, draft.instructorIds);
    },
    onSuccess: () => {
      invalidate();
      setAdding(false);
      setDraft(emptyDraft());
      toast.success('Matière ajoutée');
    },
    onError: (e: any) => toast.error(e.message || 'Erreur lors de l\'ajout'),
  });

  const updateMatiere = useMutation({
    mutationFn: async ({ moduleId, orderIndex }: { moduleId: string; orderIndex: number }) => {
      await moduleService.updateModule(moduleId, {
        title: editDraft.title.trim(),
        order_index: orderIndex,
        duration_hours: editDraft.duration_hours || 0,
        coefficient: editDraft.coefficient || 1,
      } as any, editDraft.instructorIds);
    },
    onSuccess: () => {
      invalidate();
      setEditingId(null);
      toast.success('Matière mise à jour');
    },
    onError: (e: any) => toast.error(e.message || 'Erreur'),
  });

  const deleteMatiere = useMutation({
    mutationFn: (moduleId: string) => moduleService.deleteModule(moduleId),
    onSuccess: () => { invalidate(); toast.success('Matière supprimée'); },
    onError: (e: any) => toast.error(e.message || 'Erreur'),
  });

  const startEdit = (m: any) => {
    setAdding(false);
    setEditingId(m.id);
    setEditDraft({
      title: m.title || '',
      coefficient: m.coefficient ?? 1,
      duration_hours: m.duration_hours || 0,
      instructorIds: (m.module_instructors || []).map((mi: any) => mi.instructor_id),
    });
  };

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

  const renderForm = (
    d: MatiereDraft,
    setD: (n: MatiereDraft) => void,
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
            value={d.title}
            onChange={(e) => setD({ ...d, title: e.target.value })}
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
            value={d.coefficient}
            onChange={(e) => setD({ ...d, coefficient: Number(e.target.value) })}
            className="h-8 text-sm"
            data-testid={`${testid}-coef`}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-foreground mb-1">Durée (h)</label>
          <Input
            type="number"
            min="0"
            value={d.duration_hours}
            onChange={(e) => setD({ ...d, duration_hours: Number(e.target.value) })}
            className="h-8 text-sm"
            data-testid={`${testid}-hours`}
          />
        </div>
        <div className="md:col-span-3">
          <label className="block text-[11px] font-medium text-foreground mb-1">Formateurs</label>
          {renderInstructorPicker(d.instructorIds, (ids) => setD({ ...d, instructorIds: ids }), `${testid}-ins`)}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={isPending} className="h-7 text-xs">
          <X className="h-3 w-3 mr-1" /> Annuler
        </Button>
        <Button size="sm" onClick={onSave} disabled={!d.title.trim() || isPending} className="h-7 text-xs" data-testid={`${testid}-save`}>
          <Save className="h-3 w-3 mr-1" /> {isPending ? '...' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4" data-testid="matieres-panel">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Matières de la formation</h3>
          <span className="text-xs text-muted-foreground">({modules.length})</span>
        </div>
        <Button
          size="sm"
          onClick={() => { setAdding(true); setEditingId(null); setDraft(emptyDraft()); }}
          disabled={adding}
          className="h-8 text-xs"
          data-testid="add-matiere-btn"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter une matière
        </Button>
      </div>

      {adding && renderForm(
        draft,
        setDraft,
        () => createMatiere.mutate(),
        () => { setAdding(false); setDraft(emptyDraft()); },
        createMatiere.isPending,
        'matiere-add-form'
      )}

      <div className="space-y-2">
        {modules.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground italic text-center py-6 border-2 border-dashed border-primary/20 rounded-lg">
            Aucune matière. Cliquez sur « Ajouter une matière » pour commencer.
          </p>
        )}
        {modules.map((m: any, idx: number) => (
          <div key={m.id} className="border border-primary/15 rounded-lg bg-card" data-testid={`matiere-row-${m.id}`}>
            {editingId === m.id ? (
              <div className="p-2">
                {renderForm(
                  editDraft,
                  setEditDraft,
                  () => updateMatiere.mutate({ moduleId: m.id, orderIndex: idx }),
                  () => setEditingId(null),
                  updateMatiere.isPending,
                  `matiere-edit-form-${m.id}`
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors">
                <BookOpen className="h-4 w-4 text-primary/70 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground truncate">{m.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">coef {m.coefficient || 1}</span>
                    {m.duration_hours > 0 && (
                      <span className="text-[10px] text-muted-foreground">{m.duration_hours}h</span>
                    )}
                  </div>
                  {m.instructors && m.instructors.length > 0 && (
                    <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {m.instructors.map((i: any) => `${i.first_name} ${i.last_name}`).join(', ')}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(m)}
                    className="h-7 w-7 p-0"
                    data-testid={`matiere-edit-${m.id}`}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Supprimer la matière "${m.title}" ?`)) deleteMatiere.mutate(m.id);
                    }}
                    className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                    data-testid={`matiere-delete-${m.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatieresPanel;
