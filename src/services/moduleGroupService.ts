import { supabase } from '@/integrations/supabase/client';

export interface ModuleGroup {
  id: string;
  module_id: string;
  formation_id: string;
  name: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  members?: GroupMember[];
}

export interface GroupMember {
  id: string;
  group_id: string;
  student_id: string;
  assigned_at: string;
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_photo_url: string | null;
  };
}

export const moduleGroupService = {
  async getModuleGroups(moduleId: string): Promise<ModuleGroup[]> {
    const { data: groups, error } = await supabase
      .from('module_groups')
      .select('*')
      .eq('module_id', moduleId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Fetch members for each group
    const groupIds = (groups || []).map(g => g.id);
    if (groupIds.length === 0) return groups || [];

    const { data: members, error: membersError } = await supabase
      .from('module_group_members')
      .select('*')
      .in('group_id', groupIds);

    if (membersError) throw membersError;

    // Fetch student details
    const studentIds = [...new Set((members || []).map(m => m.student_id))];
    let studentsMap: Record<string, any> = {};
    
    if (studentIds.length > 0) {
      const { data: students } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, profile_photo_url')
        .in('id', studentIds);
      
      (students || []).forEach(s => { studentsMap[s.id] = s; });
    }

    return (groups || []).map(g => ({
      ...g,
      members: (members || [])
        .filter(m => m.group_id === g.id)
        .map(m => ({ ...m, student: studentsMap[m.student_id] }))
    }));
  },

  async createGroup(moduleId: string, formationId: string, name: string): Promise<ModuleGroup> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('module_groups')
      .insert({ module_id: moduleId, formation_id: formationId, name, created_by: user?.id || null })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateGroupName(groupId: string, name: string): Promise<void> {
    const { error } = await supabase
      .from('module_groups')
      .update({ name })
      .eq('id', groupId);
    if (error) throw error;
  },

  async deleteGroup(groupId: string): Promise<void> {
    const { error } = await supabase
      .from('module_groups')
      .delete()
      .eq('id', groupId);
    if (error) throw error;
  },

  async addMembers(groupId: string, studentIds: string[]): Promise<void> {
    const rows = studentIds.map(student_id => ({ group_id: groupId, student_id }));
    const { error } = await supabase
      .from('module_group_members')
      .upsert(rows, { onConflict: 'group_id,student_id' });
    if (error) throw error;
  },

  async removeMember(groupId: string, studentId: string): Promise<void> {
    const { error } = await supabase
      .from('module_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('student_id', studentId);
    if (error) throw error;
  },

  async createRandomGroups(
    moduleId: string,
    formationId: string,
    numberOfGroups: number,
    students: { id: string }[]
  ): Promise<void> {
    // Fisher-Yates shuffle
    const shuffled = [...students];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const { data: { user } } = await supabase.auth.getUser();
    const baseSize = Math.floor(shuffled.length / numberOfGroups);
    const extra = shuffled.length % numberOfGroups;
    let index = 0;

    for (let g = 0; g < numberOfGroups; g++) {
      const size = baseSize + (g < extra ? 1 : 0);
      const groupStudents = shuffled.slice(index, index + size);
      index += size;

      // Create group
      const { data: group, error } = await supabase
        .from('module_groups')
        .insert({
          module_id: moduleId,
          formation_id: formationId,
          name: `Groupe ${g + 1}`,
          created_by: user?.id || null
        })
        .select()
        .single();
      if (error) throw error;

      // Add members
      if (groupStudents.length > 0) {
        const rows = groupStudents.map(s => ({ group_id: group.id, student_id: s.id }));
        const { error: mError } = await supabase
          .from('module_group_members')
          .insert(rows);
        if (mError) throw mError;
      }
    }
  }
};
