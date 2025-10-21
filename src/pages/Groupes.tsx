import React, { useState, useEffect } from 'react';
import { MessageCircle, Users as UsersIcon } from 'lucide-react';
import { useChatGroups } from '@/hooks/useChatGroups';
import ChatRoom from '@/components/chat/ChatRoom';

const Groupes = () => {
  const { groups, loading } = useChatGroups();
  const establishmentGroup = groups.find(g => g.group_type === 'establishment');

  console.log('📍 Groupes page - loading:', loading, 'groups:', groups.length, 'establishment group:', establishmentGroup);

  // Sélectionner automatiquement le groupe établissement quand il est disponible
  useEffect(() => {
    if (establishmentGroup && !loading) {
      console.log('✅ Establishment group found:', establishmentGroup);
    }
  }, [establishmentGroup, loading]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-border/50 bg-card/80 backdrop-blur-md shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <UsersIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Groupe Établissement</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-0.5">
                Communiquez avec tous les membres de l'établissement
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <UsersIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4 animate-pulse" />
              <p className="text-muted-foreground">Chargement du groupe...</p>
            </div>
          </div>
        ) : establishmentGroup ? (
          <ChatRoom
            groupId={establishmentGroup.id}
            groupName={establishmentGroup.name}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Aucun groupe établissement
              </h3>
              <p className="text-muted-foreground">
                Le groupe établissement n'a pas encore été créé
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Groupes;
