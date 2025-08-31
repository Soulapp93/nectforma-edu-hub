
import { supabase } from '@/integrations/supabase/client';

export interface FormationModule {
  id: string;
  formation_id: string;
  title: string;
  description?: string;
  duration_hours: number;
  order_index: number;
  instructors?: Instructor[];
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
    const { data, error } = await supabase
      .from('formation_modules')
      .select(`
        *,
        module_instructors (
          id,
          instructor_id,
          instructor:users (
            id,
            first_name,
            last_name,
            email
          )
        )
      `)
      .eq('formation_id', formationId)
      .order('order_index');
    
    if (error) throw error;
    return data;
  },

  async createModule(moduleData: Omit<FormationModule, 'id'>, instructorIds: string[]) {
    const { data: module, error: moduleError } = await supabase
      .from('formation_modules')
      .insert(moduleData)
      .select()
      .single();

    if (moduleError) throw moduleError;

    // Assigner les formateurs au module
    if (instructorIds.length > 0) {
      const assignments = instructorIds.map(instructorId => ({
        module_id: module.id,
        instructor_id: instructorId
      }));

      const { error: assignmentError } = await supabase
        .from('module_instructors')
        .insert(assignments);

      if (assignmentError) throw assignmentError;
    }

    return module;
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
