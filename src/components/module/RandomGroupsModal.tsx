import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Shuffle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { moduleGroupService } from '@/services/moduleGroupService';

interface Student {
  user_id: string;
  first_name: string;
  last_name: string;
}

interface RandomGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  formationId: string;
  onCreated: () => void;
}

const RandomGroupsModal: React.FC<RandomGroupsModalProps> = ({
  isOpen, onClose, moduleId, formationId, onCreated
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [numberOfGroups, setNumberOfGroups] = useState(2);
  const [preview, setPreview] = useState<Student[][]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setPreview([]);
    setNumberOfGroups(2);
    supabase.rpc('get_formation_students', { formation_id_param: formationId })
      .then(({ data }) => {
        const mapped = (data || []).map((s: any) => ({ user_id: s.user_id, first_name: s.first_name, last_name: s.last_name }));
        setStudents(mapped);
      });
  }, [isOpen, formationId]);

  const studentsPerGroup = useMemo(() => {
    if (numberOfGroups <= 0 || students.length === 0) return 0;
    return Math.floor(students.length / numberOfGroups);
  }, [numberOfGroups, students.length]);

  const extraStudents = useMemo(() => {
    if (numberOfGroups <= 0) return 0;
    return students.length % numberOfGroups;
  }, [numberOfGroups, students.length]);

  const generatePreview = () => {
    const shuffled = [...students];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const groups: Student[][] = [];
    let idx = 0;
    for (let g = 0; g < numberOfGroups; g++) {
      const size = studentsPerGroup + (g < extraStudents ? 1 : 0);
      groups.push(shuffled.slice(idx, idx + size));
      idx += size;
    }
    setPreview(groups);
  };

  const handleCreate = async () => {
    if (preview.length === 0) { toast.error('Générez la prévisualisation d\'abord'); return; }
    try {
      setSaving(true);
      // Use the service to create groups from preview
      const { data: { user } } = await supabase.auth.getUser();
      for (let g = 0; g < preview.length; g++) {
        const group = await moduleGroupService.createGroup(moduleId, formationId, `Groupe ${g + 1}`);
        if (preview[g].length > 0) {
          await moduleGroupService.addMembers(group.id, preview[g].map(s => s.user_id));
        }
      }
      toast.success(`${preview.length} groupes créés`);
      onCreated();
      onClose();
    } catch { toast.error('Erreur lors de la création'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Shuffle className="h-5 w-5" /> Groupes aléatoires
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <span className="font-medium">{students.length}</span> étudiants dans la formation
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nombre de groupes</Label>
              <Input
                type="number" min={1} max={students.length}
                value={numberOfGroups}
                onChange={e => { setNumberOfGroups(parseInt(e.target.value) || 1); setPreview([]); }}
              />
            </div>
            <div>
              <Label>Étudiants/groupe</Label>
              <div className="mt-2 text-sm text-muted-foreground">
                ~{studentsPerGroup} {extraStudents > 0 && <span>(+{extraStudents} répartis)</span>}
              </div>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={generatePreview} disabled={students.length === 0 || numberOfGroups < 1}>
            <Shuffle className="h-4 w-4 mr-2" /> Générer la répartition
          </Button>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Prévisualisation :</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {preview.map((group, i) => (
                  <div key={i} className="border rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-primary" /> Groupe {i + 1}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">{group.length}</Badge>
                    </div>
                    {group.map(s => (
                      <div key={s.user_id} className="flex items-center gap-2 text-xs">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                            {s.first_name?.[0]}{s.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        {s.first_name} {s.last_name}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleCreate} disabled={saving || preview.length === 0}>
            {saving ? 'Création...' : 'Valider et créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RandomGroupsModal;
