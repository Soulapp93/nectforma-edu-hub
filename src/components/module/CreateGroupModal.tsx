import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { moduleGroupService, ModuleGroup } from '@/services/moduleGroupService';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  formationId: string;
  existingGroups: ModuleGroup[];
  onCreated: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen, onClose, moduleId, formationId, existingGroups, onCreated
}) => {
  const [name, setName] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(`Groupe ${existingGroups.length + 1}`);
    setSelectedIds([]);
    // Fetch formation students
    supabase.rpc('get_formation_students', { formation_id_param: formationId })
      .then(({ data }) => setStudents((data as Student[]) || []));
  }, [isOpen, formationId, existingGroups.length]);

  const toggleStudent = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Saisissez un nom de groupe'); return; }
    try {
      setSaving(true);
      const group = await moduleGroupService.createGroup(moduleId, formationId, name.trim());
      if (selectedIds.length > 0) {
        await moduleGroupService.addMembers(group.id, selectedIds);
      }
      toast.success('Groupe créé');
      onCreated();
      onClose();
    } catch { toast.error('Erreur lors de la création'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un groupe</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nom du groupe</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Groupe 1" />
          </div>
          <div>
            <Label>Sélectionner les étudiants ({selectedIds.length}/{students.length})</Label>
            <ScrollArea className="h-60 border rounded-md mt-1">
              <div className="p-2 space-y-1">
                {students.map(s => (
                  <label key={s.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                    <Checkbox checked={selectedIds.includes(s.id)} onCheckedChange={() => toggleStudent(s.id)} />
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {s.first_name?.[0]}{s.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{s.first_name} {s.last_name}</span>
                  </label>
                ))}
                {students.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucun étudiant trouvé</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Création...' : 'Créer'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupModal;
