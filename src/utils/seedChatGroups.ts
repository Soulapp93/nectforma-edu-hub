import { supabase } from '@/integrations/supabase/client';

export const seedChatGroups = async () => {
  try {
    // Get current user and establishment
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: currentUser } = await supabase
      .from('users')
      .select('establishment_id, id')
      .eq('id', user.id)
      .single();

    if (!currentUser) throw new Error('User not found');

    // Get all users from the establishment
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, first_name, last_name, role')
      .eq('establishment_id', currentUser.establishment_id)
      .eq('is_activated', true);

    if (!allUsers || allUsers.length === 0) throw new Error('No users found');

    // Get formations
    const { data: formations } = await supabase
      .from('formations')
      .select('id, title')
      .eq('establishment_id', currentUser.establishment_id)
      .limit(3);

    // Create establishment group if it doesn't exist
    const { data: existingEstablishmentGroup } = await supabase
      .from('chat_groups')
      .select('id')
      .eq('establishment_id', currentUser.establishment_id)
      .eq('group_type', 'establishment')
      .single();

    let establishmentGroupId = existingEstablishmentGroup?.id;

    if (!establishmentGroupId) {
      const { data: newEstablishmentGroup, error: groupError } = await supabase
        .from('chat_groups')
        .insert({
          name: 'Groupe Établissement',
          description: 'Groupe de discussion pour tous les membres de l\'établissement',
          group_type: 'establishment',
          establishment_id: currentUser.establishment_id,
          created_by: currentUser.id,
          is_active: true,
        })
        .select()
        .single();

      if (groupError) throw groupError;
      establishmentGroupId = newEstablishmentGroup.id;

      // Add all users to establishment group
      const establishmentMembers = allUsers.map(u => ({
        group_id: establishmentGroupId,
        user_id: u.id,
        role: u.id === currentUser.id ? 'admin' : 'member',
      }));

      await supabase.from('chat_group_members').insert(establishmentMembers);
    }

    // Create formation groups
    if (formations && formations.length > 0) {
      for (const formation of formations) {
        const { data: existingFormationGroup } = await supabase
          .from('chat_groups')
          .select('id')
          .eq('formation_id', formation.id)
          .eq('group_type', 'formation')
          .single();

        if (!existingFormationGroup) {
          const { data: formationGroup, error: formationGroupError } = await supabase
            .from('chat_groups')
            .insert({
              name: `Groupe ${formation.title}`,
              description: `Discussion pour la formation ${formation.title}`,
              group_type: 'formation',
              formation_id: formation.id,
              establishment_id: currentUser.establishment_id,
              created_by: currentUser.id,
              is_active: true,
            })
            .select()
            .single();

          if (formationGroupError) throw formationGroupError;

          // Get students in this formation
          const { data: formationStudents } = await supabase
            .from('user_formation_assignments')
            .select('user_id')
            .eq('formation_id', formation.id);

          if (formationStudents && formationStudents.length > 0) {
            const formationMembers = formationStudents.map(fs => ({
              group_id: formationGroup.id,
              user_id: fs.user_id,
              role: 'member',
            }));

            await supabase.from('chat_group_members').insert(formationMembers);
          }
        }
      }
    }

    // Create private groups
    const privateGroupsData = [
      {
        name: 'Équipe Projet A',
        description: 'Discussion pour le projet A',
        members: allUsers.slice(0, Math.min(4, allUsers.length)),
      },
      {
        name: 'Groupe d\'étude',
        description: 'Entraide pour les devoirs',
        members: allUsers.slice(0, Math.min(5, allUsers.length)),
      },
    ];

    for (const groupData of privateGroupsData) {
      const { data: privateGroup, error: privateGroupError } = await supabase
        .from('chat_groups')
        .insert({
          name: groupData.name,
          description: groupData.description,
          group_type: 'private',
          establishment_id: currentUser.establishment_id,
          created_by: currentUser.id,
          is_active: true,
        })
        .select()
        .single();

      if (privateGroupError) throw privateGroupError;

      const privateMembers = groupData.members.map(member => ({
        group_id: privateGroup.id,
        user_id: member.id,
        role: member.id === currentUser.id ? 'admin' : 'member',
      }));

      await supabase.from('chat_group_members').insert(privateMembers);

      // Add sample messages
      const sampleMessages = [
        { content: 'Bonjour à tous ! 👋', sender_id: groupData.members[0].id },
        { content: 'Salut ! Comment allez-vous ?', sender_id: groupData.members[1]?.id || currentUser.id },
        { content: 'Très bien merci ! On commence quand ?', sender_id: groupData.members[2]?.id || currentUser.id },
        { content: 'Je propose demain matin', sender_id: currentUser.id },
      ];

      for (const msg of sampleMessages) {
        await supabase.from('chat_messages').insert({
          group_id: privateGroup.id,
          sender_id: msg.sender_id,
          content: msg.content,
          message_type: 'text',
        });
      }
    }

    // Add messages to establishment group
    const establishmentMessages = [
      { content: 'Bienvenue dans le groupe établissement ! 🎉', sender_id: currentUser.id },
      { content: 'Merci ! Heureux d\'être ici', sender_id: allUsers[1]?.id || currentUser.id },
      { content: 'N\'hésitez pas à partager vos questions', sender_id: allUsers[2]?.id || currentUser.id },
    ];

    for (const msg of establishmentMessages) {
      await supabase.from('chat_messages').insert({
        group_id: establishmentGroupId!,
        sender_id: msg.sender_id,
        content: msg.content,
        message_type: 'text',
      });
    }

    console.log('✅ Chat groups seeded successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error seeding chat groups:', error);
    throw error;
  }
};
