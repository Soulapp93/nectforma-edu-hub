import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { ClipboardCheck, CalendarClock, Flag, Paperclip } from 'lucide-react';
import FileUpload from '@/components/ui/file-upload';
import { fileUploadService } from '@/services/fileUploadService';
import { taskService, type ModuleTask } from '@/services/taskService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  editTask?: ModuleTask | null;
  onSuccess: () => void;
}

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Basse',   color: '#10B981' },
  { value: 'medium', label: 'Moyenne', color: '#F59E0B' },
  { value: 'high',   label: 'Haute',   color: '#EF4444' },
] as const;

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen, onClose, moduleId, editTask, onSuccess,
}) => {
  const { userId } = useCurrentUser();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || '');
      setDueDate(editTask.due_date ? new Date(editTask.due_date).toISOString().slice(0, 16) : '');
      setPriority(editTask.priority);
      setFile(null);
    } else {
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('medium');
      setFile(null);
    }
  }, [editTask, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      let attachment_url: string | undefined;
      let attachment_name: string | undefined;
      if (file) {
        attachment_url = await fileUploadService.uploadFile(file, 'module-files');
        attachment_name = file.name;
      }

      if (editTask) {
        await taskService.update(editTask.id, {
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate || null,
          priority,
          ...(attachment_url ? { attachment_url, attachment_name } : {}),
        });
        toast.success('Travail à faire mis à jour');
      } else {
        await taskService.create({
          module_id: moduleId,
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate || null,
          priority,
          attachment_url,
          attachment_name,
          created_by: userId || null,
        });
        toast.success('Travail à faire créé');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0" data-testid="create-task-modal">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            {editTask ? 'Modifier le travail' : 'Nouveau travail à faire'}
          </DialogTitle>
          <DialogDescription>
            Donnez une consigne à vos étudiants avec une date limite et, si besoin, un fichier.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="task-title">Titre *</Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Lire le chapitre 4 et répondre aux questions"
                required
                data-testid="task-title-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Description / Consigne</Label>
              <Textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Détails, ressources, attendus..."
                rows={4}
                className="resize-none"
                data-testid="task-description-input"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  Date limite
                </Label>
                <DateTimePicker value={dueDate} onChange={setDueDate} placeholder="Optionnelle" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Flag className="h-4 w-4 text-muted-foreground" />
                  Priorité
                </Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {PRIORITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPriority(opt.value)}
                      data-testid={`task-priority-${opt.value}`}
                      className={`py-2 text-xs font-semibold rounded-lg border-2 transition-all ${
                        priority === opt.value ? 'scale-105' : 'border-border hover:border-foreground/40'
                      }`}
                      style={priority === opt.value ? { borderColor: opt.color, backgroundColor: `${opt.color}18`, color: opt.color } : undefined}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {!editTask && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  Pièce jointe (optionnelle)
                </Label>
                <FileUpload
                  onFileSelect={(files) => setFile(files[0] || null)}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.ppt,.pptx,.xls,.xlsx"
                  maxSize={10}
                />
                {file && <p className="text-xs text-muted-foreground">{file.name}</p>}
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 px-6 py-4 border-t bg-muted/30">
            <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading || !title.trim()} data-testid="task-submit-btn" className="gap-2">
                {loading
                  ? <><span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Enregistrement...</>
                  : <><ClipboardCheck className="h-4 w-4" /> {editTask ? 'Enregistrer' : 'Créer'}</>
                }
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskModal;
