import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { ClipboardList, FileText, Calendar, Award, Paperclip, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { assignmentService, Assignment } from '@/services/assignmentService';
import { fileUploadService } from '@/services/fileUploadService';
import { supabase } from '@/integrations/supabase/client';
import FileUpload from '@/components/ui/file-upload';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { EVALUATION_TYPE_META, EVALUATION_TYPE_ORDER, type EvaluationType } from '@/utils/evaluationTypes';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  onSuccess: () => void;
  editAssignment?: Assignment;
}

const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  isOpen,
  onClose,
  moduleId,
  onSuccess,
  editAssignment
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignment_type: 'devoir_maison' as EvaluationType,
    due_date: '',
    max_points: 100
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<Array<{ id: string; file_name: string; file_url: string; file_size?: number | null }>>([]);
  const [loading, setLoading] = useState(false);

  const { userId } = useCurrentUser();

  // Load existing files when editing
  useEffect(() => {
    if (editAssignment && isOpen) {
      (async () => {
        const { data } = await (supabase as any)
          .from('assignment_files')
          .select('id, file_name, file_url, file_size')
          .eq('assignment_id', editAssignment.id);
        setExistingFiles(data || []);
      })();
    } else {
      setExistingFiles([]);
    }
  }, [editAssignment, isOpen]);

  const handleRemoveExistingFile = async (fileId: string) => {
    if (!window.confirm('Supprimer ce fichier ?')) return;
    try {
      const { error } = await (supabase as any)
        .from('assignment_files')
        .delete()
        .eq('id', fileId);
      if (error) throw error;
      setExistingFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.success('Fichier supprimé');
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la suppression');
    }
  };

  useEffect(() => {
    if (editAssignment) {
      setFormData({
        title: editAssignment.title,
        description: editAssignment.description || '',
        assignment_type: (editAssignment.assignment_type as EvaluationType) || 'devoir_maison',
        due_date: editAssignment.due_date ? new Date(editAssignment.due_date).toISOString().slice(0, 16) : '',
        max_points: editAssignment.max_points
      });
    } else {
      // Reset form when opening for creation
      setFormData({
        title: '',
        description: '',
        assignment_type: 'devoir_maison',
        due_date: '',
        max_points: 100
      });
      setSelectedFiles([]);
    }
  }, [editAssignment, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let assignmentId: string | null = null;
    let isNew = !editAssignment;

    try {
      if (editAssignment) {
        await assignmentService.updateAssignment(editAssignment.id, {
          ...formData,
          due_date: formData.due_date || undefined
        });
        assignmentId = editAssignment.id;
      } else {
        if (!userId) {
          toast.error('Utilisateur non authentifié');
          setLoading(false);
          return;
        }

        const assignment = await assignmentService.createAssignment({
          title: formData.title,
          description: formData.description,
          assignment_type: formData.assignment_type,
          module_id: moduleId,
          created_by: userId,
          is_published: true,
          due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
          max_points: formData.max_points
        });
        assignmentId = assignment.id;
      }

      // Upload new files (works for both create and edit)
      if (assignmentId && selectedFiles.length > 0) {
        let uploadedCount = 0;
        let failedCount = 0;
        for (const file of selectedFiles) {
          try {
            const fileUrl = await fileUploadService.uploadFile(file);
            await assignmentService.addAssignmentFile({
              assignment_id: assignmentId,
              file_url: fileUrl,
              file_name: file.name,
              file_size: file.size
            });
            uploadedCount++;
          } catch (fileErr) {
            logger.error('Erreur upload fichier:', file.name, fileErr);
            failedCount++;
          }
        }
        if (failedCount > 0) {
          toast.error(`${failedCount} fichier(s) n'ont pas pu être ajoutés. ${uploadedCount} fichier(s) ont été ajoutés avec succès.`);
        } else if (uploadedCount > 0) {
          toast.success(`${uploadedCount} fichier(s) ajouté(s)`);
        }
      }

      toast.success(isNew ? 'Évaluation créée avec succès' : 'Évaluation modifiée avec succès');
      onSuccess();
      onClose();
    } catch (error: any) {
      logger.error('Erreur lors de la sauvegarde:', error);
      toast.error(error?.message || (editAssignment ? "Erreur lors de la modification" : "Erreur lors de la création"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-primary" />
            {editAssignment ? 'Modifier l\'évaluation' : 'Nouvelle évaluation'}
          </DialogTitle>
          <DialogDescription>
            {editAssignment 
              ? 'Modifiez les informations du devoir existant.'
              : 'Remplissez les informations pour créer une nouvelle évaluation.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable form body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {/* Titre */}
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Titre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Exercice chapitre 3"
                required
              />
            </div>

            {/* Type - grille cliquable 8 options */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                Type d'évaluation <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {EVALUATION_TYPE_ORDER.map((t) => {
                  const meta = EVALUATION_TYPE_META[t];
                  const Icon = meta.icon;
                  const active = formData.assignment_type === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData({ ...formData, assignment_type: t })}
                      data-testid={`eval-type-${t}`}
                      className={`p-2.5 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 min-h-[78px] ${
                        active ? 'shadow-md scale-[1.02]' : 'border-border hover:border-foreground/40 bg-card'
                      }`}
                      style={active ? { backgroundColor: `${meta.color}15`, borderColor: meta.color } : undefined}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${meta.color}20` }}
                      >
                        <Icon className="h-[18px] w-[18px]" style={{ color: meta.color }} />
                      </div>
                      <span className="text-[11px] font-semibold text-center leading-tight">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Instructions détaillées pour les étudiants..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Date et Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Date d'échéance
                </Label>
                <DateTimePicker
                  value={formData.due_date}
                  onChange={(value) => setFormData({ ...formData, due_date: value })}
                  placeholder="Sélectionner"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_points" className="flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  Points maximum
                </Label>
                <Input
                  id="max_points"
                  type="number"
                  value={formData.max_points}
                  onChange={(e) => setFormData({ ...formData, max_points: parseInt(e.target.value) || 0 })}
                  min="1"
                  max="1000"
                />
              </div>
            </div>

            {/* Fichiers joints */}
            <div className="space-y-3" data-testid="assignment-files-section">
              <Label className="flex items-center gap-1.5">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                Fichiers joints
              </Label>

              {/* Fichiers existants (edit mode) */}
              {existingFiles.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Fichiers déjà associés :</p>
                  {existingFiles.map((f) => (
                    <div key={f.id} className="flex items-center justify-between gap-2 p-2 bg-muted/40 rounded-lg border border-border">
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip className="h-4 w-4 text-primary shrink-0" />
                        <a
                          href={f.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-foreground hover:text-primary hover:underline truncate"
                          title={f.file_name}
                        >
                          {f.file_name}
                        </a>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveExistingFile(f.id)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                        data-testid={`remove-existing-file-${f.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <FileUpload
                onFileSelect={setSelectedFiles}
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.ppt,.pptx,.xls,.xlsx"
                maxSize={10}
              />
              {selectedFiles.length > 0 && (
                <p className="text-xs text-primary font-medium" data-testid="selected-files-indicator">
                  ✓ {selectedFiles.length} nouveau(x) fichier(s) sera(ont) ajouté(s) à la sauvegarde
                </p>
              )}
            </div>
          </div>

          {/* Fixed footer with buttons */}
          <DialogFooter className="flex-shrink-0 px-6 py-4 border-t bg-muted/30">
            <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !formData.title.trim()}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {editAssignment ? 'Modification...' : 'Création...'}
                  </>
                ) : (
                  <>
                    <ClipboardList className="h-4 w-4" />
                    {editAssignment ? 'Modifier' : 'Créer l\'évaluation'}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAssignmentModal;
