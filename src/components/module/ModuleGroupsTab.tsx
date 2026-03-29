import React, { useState, useEffect } from 'react';
import { Users, Plus, Shuffle, Trash2, Edit2, UserMinus, UserPlus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { moduleGroupService, ModuleGroup } from '@/services/moduleGroupService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import CreateGroupModal from './CreateGroupModal';
import RandomGroupsModal from './RandomGroupsModal';

interface ModuleGroupsTabProps {
  moduleId: string;
  formationId: string;
}

const ModuleGroupsTab: React.FC<ModuleGroupsTabProps> = ({ moduleId, formationId }) => {
  const [groups, setGroups] = useState<ModuleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRandomModal, setShowRandomModal] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const { userRole } = useCurrentUser();

  const canManage = userRole === 'Admin' || userRole === 'AdminPrincipal' || userRole === 'Formateur';

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await moduleGroupService.getModuleGroups(moduleId);
      setGroups(data);
    } catch (err) {
      toast.error('Erreur lors du chargement des groupes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroups(); }, [moduleId]);

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Supprimer ce groupe ?')) return;
    try {
      await moduleGroupService.deleteGroup(groupId);
      toast.success('Groupe supprimé');
      fetchGroups();
    } catch { toast.error('Erreur lors de la suppression'); }
  };

  const handleRename = async (groupId: string) => {
    if (!editName.trim()) return;
    try {
      await moduleGroupService.updateGroupName(groupId, editName.trim());
      setEditingGroupId(null);
      toast.success('Groupe renommé');
      fetchGroups();
    } catch { toast.error('Erreur lors du renommage'); }
  };

  const handleRemoveMember = async (groupId: string, studentId: string) => {
    try {
      await moduleGroupService.removeMember(groupId, studentId);
      toast.success('Étudiant retiré du groupe');
      fetchGroups();
    } catch { toast.error('Erreur'); }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      {canManage && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-1" /> Créer un groupe
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowRandomModal(true)}>
            <Shuffle className="h-4 w-4 mr-1" /> Groupes aléatoires
          </Button>
        </div>
      )}

      {/* Groups list */}
      {groups.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="font-semibold text-foreground mb-1">Aucun groupe</h3>
          <p className="text-sm text-muted-foreground">Créez des groupes pour organiser les étudiants.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {groups.map(group => (
            <Card key={group.id} className="border border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  {editingGroupId === group.id ? (
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="border rounded px-2 py-1 text-sm flex-1 bg-background"
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && handleRename(group.id)}
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRename(group.id)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingGroupId(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        {group.name}
                        <Badge variant="secondary" className="text-[10px]">{group.members?.length || 0}</Badge>
                      </CardTitle>
                      {canManage && (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingGroupId(group.id); setEditName(group.name); }}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteGroup(group.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {(group.members?.length || 0) === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Aucun membre</p>
                ) : (
                  <div className="space-y-1.5">
                    {group.members?.map(member => (
                      <div key={member.id} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {member.student?.first_name?.[0]}{member.student?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{member.student?.first_name} {member.student?.last_name}</span>
                        </div>
                        {canManage && (
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleRemoveMember(group.id, member.student_id)}>
                            <UserMinus className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        moduleId={moduleId}
        formationId={formationId}
        existingGroups={groups}
        onCreated={fetchGroups}
      />
      <RandomGroupsModal
        isOpen={showRandomModal}
        onClose={() => setShowRandomModal(false)}
        moduleId={moduleId}
        formationId={formationId}
        onCreated={fetchGroups}
      />
    </div>
  );
};

export default ModuleGroupsTab;
