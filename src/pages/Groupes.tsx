import React, { useState } from 'react';
import { MessageCircle, Search, Plus, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChatGroups } from '@/hooks/useChatGroups';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import ChatRoom from '@/components/chat/ChatRoom';
import CreateGroupModal from '@/components/chat/CreateGroupModal';
import SeedGroupsButton from '@/components/chat/SeedGroupsButton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const Groupes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { groups, loading, createGroup } = useChatGroups();
  const { userRole } = useCurrentUser();

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const getGroupIcon = (type: string) => {
    switch (type) {
      case 'establishment':
        return '🏫';
      case 'formation':
        return '🎓';
      case 'private':
        return '👥';
      default:
        return '💬';
    }
  };

  const handleCreateGroup = async (groupData: any) => {
    await createGroup(groupData);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-border bg-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Groupes de discussion</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Communiquez avec vos collègues et étudiants
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SeedGroupsButton />
            <Button 
              onClick={() => {
                const establishmentGroup = groups.find(g => g.group_type === 'establishment');
                if (establishmentGroup) {
                  setSelectedGroupId(establishmentGroup.id);
                }
              }}
              variant="outline"
              className="gap-2"
            >
              <UsersIcon className="h-4 w-4" />
              Groupe établissement
            </Button>
            {(userRole === 'Étudiant' || userRole === 'Formateur') && (
              <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Créer un groupe privé
              </Button>
            )}
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un groupe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full sm:w-64"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Groups List */}
        <div className="w-80 border-r border-border bg-card overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Chargement des groupes...
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <UsersIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucun groupe trouvé</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className={cn(
                    'w-full p-4 text-left hover:bg-accent transition-colors',
                    selectedGroupId === group.id && 'bg-accent'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{getGroupIcon(group.group_type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">
                          {group.name}
                        </h3>
                        {group.group_type === 'establishment' && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            Général
                          </Badge>
                        )}
                      </div>
                      {group.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {group.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1">
          {selectedGroup ? (
            <ChatRoom
              groupId={selectedGroup.id}
              groupName={selectedGroup.name}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Sélectionnez un groupe
                </h3>
                <p className="text-muted-foreground">
                  Choisissez un groupe pour commencer à discuter
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
};

export default Groupes;
