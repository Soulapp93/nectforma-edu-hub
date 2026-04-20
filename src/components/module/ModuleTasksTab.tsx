import React, { useEffect, useState, useCallback } from 'react';
import {
  ClipboardCheck, Plus, Flag, CalendarClock, Paperclip, Edit2, Trash2,
  AlertTriangle, CheckSquare, Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { taskService, type ModuleTask } from '@/services/taskService';
import CreateTaskModal from './CreateTaskModal';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface ModuleTasksTabProps {
  moduleId: string;
}

const PRIORITY_META: Record<'low' | 'medium' | 'high', { label: string; color: string }> = {
  low:    { label: 'Basse',   color: '#10B981' },
  medium: { label: 'Moyenne', color: '#F59E0B' },
  high:   { label: 'Haute',   color: '#EF4444' },
};

const DONE_KEY = 'nect-module-task-done';

const getDoneSet = (): Set<string> => {
  try { return new Set(JSON.parse(localStorage.getItem(DONE_KEY) || '[]')); }
  catch { return new Set(); }
};
const setDoneSet = (s: Set<string>) => {
  try { localStorage.setItem(DONE_KEY, JSON.stringify([...s])); } catch { /* noop */ }
};

const ModuleTasksTab: React.FC<ModuleTasksTabProps> = ({ moduleId }) => {
  const { userRole } = useCurrentUser();
  const canEdit = ['AdminPrincipal', 'Admin', 'Formateur'].includes(userRole || '');

  const [tasks, setTasks] = useState<ModuleTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [editTask, setEditTask] = useState<ModuleTask | null>(null);
  const [done, setDone] = useState<Set<string>>(getDoneSet());

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const list = await taskService.list(moduleId);
      setTasks(list);
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const toggleDone = (id: string) => {
    const next = new Set(done);
    if (next.has(id)) next.delete(id); else next.add(id);
    setDone(next);
    setDoneSet(next);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer définitivement ce travail ?')) return;
    try {
      await taskService.remove(id);
      toast.success('Travail supprimé');
      fetchTasks();
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-4" data-testid="module-tasks-tab">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Travail à faire</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Consignes et travaux préparatoires donnés par le formateur.
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => { setEditTask(null); setOpenCreate(true); }} className="gap-2" data-testid="new-task-btn">
            <Plus className="h-4 w-4" /> Nouveau travail
          </Button>
        )}
      </div>

      {/* Loading / empty */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Chargement...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-xl border-2 border-dashed border-border">
          <ClipboardCheck className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Aucun travail à faire pour le moment.</p>
          {canEdit && (
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setOpenCreate(true)}>
              Ajouter le premier travail
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const prio = PRIORITY_META[task.priority];
            const isDone = done.has(task.id);
            const isOverdue = task.due_date ? new Date(task.due_date) < new Date() && !isDone : false;
            return (
              <Card
                key={task.id}
                className={`p-4 transition-all hover:shadow-md ${isDone ? 'opacity-60' : ''}`}
                data-testid={`task-card-${task.id}`}
                style={{ borderLeft: `4px solid ${prio.color}` }}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleDone(task.id)}
                    className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
                    title={isDone ? 'Marquer comme non fait' : 'Marquer comme fait'}
                    data-testid={`task-done-toggle-${task.id}`}
                  >
                    {isDone ? <CheckSquare className="h-5 w-5 text-emerald-600" /> : <Square className="h-5 w-5" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <h3 className={`font-semibold text-foreground ${isDone ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{task.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                          style={{ backgroundColor: `${prio.color}15`, color: prio.color }}
                        >
                          <Flag className="h-3 w-3" />
                          {prio.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                      {task.due_date && (
                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
                          <CalendarClock className="h-3.5 w-3.5" />
                          {new Date(task.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          {isOverdue && <> <AlertTriangle className="h-3.5 w-3.5" /> En retard</>}
                        </span>
                      )}
                      {task.attachment_url && (
                        <a href={task.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                          <Paperclip className="h-3.5 w-3.5" /> {task.attachment_name || 'Pièce jointe'}
                        </a>
                      )}
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditTask(task); setOpenCreate(true); }} data-testid={`task-edit-${task.id}`}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(task.id)} data-testid={`task-delete-${task.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CreateTaskModal
        isOpen={openCreate}
        onClose={() => { setOpenCreate(false); setEditTask(null); }}
        moduleId={moduleId}
        editTask={editTask}
        onSuccess={fetchTasks}
      />
    </div>
  );
};

export default ModuleTasksTab;
