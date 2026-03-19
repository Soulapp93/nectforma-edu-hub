import { supabase } from '@/integrations/supabase/client';

// Type helper for database operations on non-typed tables
const db = supabase as any;

export interface FormationModule {
  id: string;
  formation_id: string;
  title: string;
  description?: string;
  duration_hours: number;
  order_index: number;
  semester?: number | null;
  instructors?: Instructor[];
}

export interface SubModule {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  duration_hours: number;
  order_index: number;
  coefficient: number;
  instructor_id?: string;
}

export interface Instructor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface ModuleInstructor {
  id: string;
  module_id: string;
  instructor_id: string;
  instructor: Instructor;
}

export const moduleService = {
  async getFormationModules(formationId: string) {
    const { data: modules, error: modulesError } = await supabase
      .from('formation_modules')
      .select('*')
      .eq('formation_id', formationId)
      .order('order_index');

    if (modulesError) throw modulesError;

    const modulesWithInstructors = await Promise.all(
      (modules || []).map(async (mod) => {
        const { data: instructorAssignments, error: assignError } = await db
          .from('module_instructors')
          .select('instructor_id')
          .eq('module_id', mod.id);

        if (assignError) {
          console.warn('Erreur récupération formateurs module:', assignError);
          return { ...mod, instructors: [], module_instructors: [] };
        }

        if (instructorAssignments && instructorAssignments.length > 0) {
          const instructorIds = instructorAssignments.map((a: any) => a.instructor_id);
          const { data: instructors } = await supabase
            .from('users')
            .select('id, first_name, last_name, email')
            .in('id', instructorIds);

          return {
            ...mod,
            instructors: instructors || [],
            module_instructors: instructorAssignments.map((a: any) => ({ instructor_id: a.instructor_id })),
          };
        }
        return { ...mod, instructors: [], module_instructors: [] };
      })
    );

    return modulesWithInstructors;
  },

  async createModule(moduleData: Omit<FormationModule, 'id'>, instructorIds: string[]) {
    const { data: module, error: moduleError } = await supabase
      .from('formation_modules')
      .insert({
        formation_id: moduleData.formation_id,
        title: moduleData.title,
        description: moduleData.description,
        duration_hours: moduleData.duration_hours,
        order_index: moduleData.order_index,
        semester: moduleData.semester ?? null,
      })
      .select()
      .single();

    if (moduleError) throw moduleError;

    if (instructorIds.length > 0) {
      const assignments = instructorIds.map(instructorId => ({
        module_id: module.id,
        instructor_id: instructorId,
      }));

      const { error: assignmentError } = await db
        .from('module_instructors')
        .insert(assignments);

      if (assignmentError) {
        console.error('Erreur assignation formateurs:', assignmentError);
        throw assignmentError;
      }
    }

    return module;
  },

  async updateModule(
    moduleId: string,
    moduleData: { title: string; description?: string; order_index: number; duration_hours?: number; semester?: number | null },
    instructorIds: string[]
  ) {
    const { error: moduleError } = await supabase
      .from('formation_modules')
      .update({
        title: moduleData.title,
        description: moduleData.description,
        order_index: moduleData.order_index,
        duration_hours: moduleData.duration_hours,
        semester: moduleData.semester ?? null,
      })
      .eq('id', moduleId);

    if (moduleError) throw moduleError;

    const { error: deleteError } = await db
      .from('module_instructors')
      .delete()
      .eq('module_id', moduleId);

    if (deleteError) {
      console.error('Erreur suppression anciennes assignations:', deleteError);
      throw deleteError;
    }

    if (instructorIds.length > 0) {
      const assignments = instructorIds.map(instructorId => ({
        module_id: moduleId,
        instructor_id: instructorId,
      }));

      const { error: insertError } = await db
        .from('module_instructors')
        .insert(assignments);

      if (insertError) {
        console.error('Erreur insertion nouvelles assignations:', insertError);
        throw insertError;
      }
    }
  },

  async deleteModule(moduleId: string) {
    // Delete sub-modules first
    const { error: subModError } = await db
      .from('sub_modules')
      .delete()
      .eq('module_id', moduleId);

    if (subModError) {
      console.warn('Erreur suppression sous-modules:', subModError);
    }

    const { error: deleteAssignError } = await db
      .from('module_instructors')
      .delete()
      .eq('module_id', moduleId);

    if (deleteAssignError) {
      console.warn('Erreur suppression assignations:', deleteAssignError);
    }

    const { error } = await supabase
      .from('formation_modules')
      .delete()
      .eq('id', moduleId);

    if (error) throw error;
  },

  // Sub-modules CRUD
  async getSubModules(moduleId: string): Promise<SubModule[]> {
    const { data, error } = await db
      .from('sub_modules')
      .select('*')
      .eq('module_id', moduleId)
      .order('order_index');

    if (error) {
      console.error('Erreur récupération sous-modules:', error);
      return [];
    }
    return data || [];
  },

  async createSubModule(subModuleData: Omit<SubModule, 'id'>): Promise<SubModule> {
    const { data, error } = await db
      .from('sub_modules')
      .insert(subModuleData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSubModule(subModuleId: string, subModuleData: Partial<SubModule>) {
    const { error } = await db
      .from('sub_modules')
      .update(subModuleData)
      .eq('id', subModuleId);

    if (error) throw error;
  },

  async deleteSubModule(subModuleId: string) {
    const { error } = await db
      .from('sub_modules')
      .delete()
      .eq('id', subModuleId);

    if (error) throw error;
  },

  async getInstructors() {
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role')
      .eq('role', 'Formateur')
      .order('first_name');
    
    if (error) throw error;
    return data;
  }
};
