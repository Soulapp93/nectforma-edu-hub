
import { supabase } from '@/integrations/supabase/client';
import { retryQuery, rpcWithRetry, isTransientError } from '@/lib/supabaseRetry';

export interface Formation {
  id: string;
  title: string;
  description?: string;
  level: string;
  start_date: string;
  end_date: string;
  status: string;
  color?: string;
  duration: number;
  max_students: number;
  price?: number;
  establishment_id: string;
  academic_year?: string;
  created_at: string;
  updated_at: string;
  formation_modules?: any[];
}

const db = supabase as any;

const RETRY_OPTIONS = {
  maxRetries: 3,
  baseDelayMs: 500,
  onRetry: (attempt: number, err: Error) => {
    logger.warn(`Retry attempt ${attempt} for formation service:`, err.message);
  }
};

export const formationService = {
  async createFormation(formationData: Omit<Formation, 'id' | 'created_at' | 'updated_at'>) {
    logger.log('Création de formation avec les données:', formationData);
    
    const { data, error } = await supabase
      .from('formations')
      .insert([formationData])
      .select()
      .single();

    if (error) {
      logger.error('Erreur lors de la création de la formation:', error);
      throw new Error(`Erreur lors de la création de la formation: ${error.message}`);
    }

    logger.log('Formation créée avec succès:', data);
    return data;
  },

  async getFormations() {
    logger.log('Récupération des formations...');
    
    const { data, error } = await retryQuery(
      () => supabase
        .from('formations')
        .select(`
          *,
          formation_modules (
            id,
            title,
            description,
            duration_hours,
            order_index
          )
        `)
        .order('created_at', { ascending: false }),
      RETRY_OPTIONS
    );

    if (error) {
      logger.error('Erreur lors de la récupération des formations:', error);
      throw new Error(`Erreur lors de la récupération des formations: ${error.message}`);
    }

    logger.log('Formations récupérées:', data);
    return data;
  },

  async getAllFormations() {
    return this.getFormations();
  },

  async getFormationById(id: string) {
    logger.log('Récupération de la formation par ID:', id);
    
    const { data, error } = await retryQuery(
      () => supabase
        .from('formations')
        .select(`
          *,
          formation_modules (
            id,
            title,
            description,
            duration_hours,
            order_index,
            semester
          )
        `)
        .eq('id', id)
        .single(),
      RETRY_OPTIONS
    );

    if (error) {
      logger.error('Erreur lors de la récupération de la formation:', error);
      throw new Error(`Erreur lors de la récupération de la formation: ${error.message}`);
    }

    logger.log('Formation récupérée:', data);
    return data;
  },

  async updateFormation(id: string, formationData: Partial<Formation>) {
    logger.log('Mise à jour de la formation:', id, formationData);
    
    const { data, error } = await supabase
      .from('formations')
      .update(formationData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Erreur lors de la mise à jour de la formation:', error);
      throw new Error(`Erreur lors de la mise à jour de la formation: ${error.message}`);
    }

    logger.log('Formation mise à jour avec succès:', data);
    return data;
  },

  async deleteFormation(id: string) {
    logger.log('Suppression de la formation:', id);
    
    try {
      const { error: modulesError } = await supabase
        .from('formation_modules')
        .delete()
        .eq('formation_id', id);

      if (modulesError) {
        logger.error('Erreur lors de la suppression des modules:', modulesError);
        throw new Error(`Erreur lors de la suppression des modules: ${modulesError.message}`);
      }

      const { error: formationError } = await supabase
        .from('formations')
        .delete()
        .eq('id', id);

      if (formationError) {
        logger.error('Erreur lors de la suppression de la formation:', formationError);
        throw new Error(`Erreur lors de la suppression de la formation: ${formationError.message}`);
      }

      logger.log('Formation supprimée avec succès');
      return true;

    } catch (error) {
      logger.error('Erreur lors de la suppression:', error);
      throw error;
    }
  },

  async duplicateFormationForNewYear(formationId: string, newAcademicYear: string, newStartDate: string, newEndDate: string) {
    logger.log('Duplication de la formation pour nouvelle année:', formationId, newAcademicYear);
    
    // Get original formation
    const original = await this.getFormationById(formationId);
    if (!original) throw new Error('Formation introuvable');

    // Create new formation with new academic year
    const newFormationData = {
      title: original.title,
      description: original.description || '',
      level: original.level,
      start_date: newStartDate,
      end_date: newEndDate,
      status: 'Actif',
      color: original.color || '#8B5CF6',
      duration: original.duration,
      max_students: original.max_students,
      price: original.price || 0,
      establishment_id: original.establishment_id,
      academic_year: newAcademicYear,
    };

    const newFormation = await this.createFormation(newFormationData as any);

    // Duplicate modules with sub-modules
    const { moduleService } = await import('./moduleService');
    const modules = await moduleService.getFormationModules(formationId);
    
    for (const mod of modules) {
      const newModule = await moduleService.createModule({
        formation_id: newFormation.id,
        title: mod.title,
        description: mod.description,
        duration_hours: mod.duration_hours,
        order_index: mod.order_index,
      }, mod.module_instructors?.map((mi: any) => mi.instructor_id) || []);

      // Duplicate sub-modules
      const subModules = await moduleService.getSubModules(mod.id);
      for (const sub of subModules) {
        await moduleService.createSubModule({
          module_id: newModule.id,
          title: sub.title,
          description: sub.description,
          duration_hours: sub.duration_hours,
          order_index: sub.order_index,
          coefficient: sub.coefficient,
        });
      }
    }

    // Auto-create textbook and schedule for the new promotion
    try {
      const { textBookService } = await import('./textBookService');
      await textBookService.createTextBook({
        formation_id: newFormation.id,
        title: `Cahier de texte - ${newFormation.title} ${newAcademicYear}`,
      });
    } catch (e) {
      logger.warn('Auto-création cahier de texte échouée:', e);
    }

    try {
      const { scheduleService } = await import('./scheduleService');
      await scheduleService.createSchedule({
        formation_id: newFormation.id,
        title: `Emploi du temps - ${newFormation.title} ${newAcademicYear}`,
      });
    } catch (e) {
      logger.warn('Auto-création emploi du temps échouée:', e);
    }

    return newFormation;
  },

  async migrateStudents(studentIds: string[], fromFormationId: string, toFormationId: string) {
    logger.log('Migration des étudiants:', studentIds, 'de', fromFormationId, 'vers', toFormationId);
    
    // Remove from old formation
    for (const studentId of studentIds) {
      const { error: deleteError } = await db
        .from('user_formation_assignments')
        .delete()
        .eq('user_id', studentId)
        .eq('formation_id', fromFormationId);

      if (deleteError) {
        logger.error('Erreur suppression assignation:', deleteError);
        throw deleteError;
      }
    }

    // Add to new formation
    const assignments = studentIds.map(studentId => ({
      user_id: studentId,
      formation_id: toFormationId,
    }));

    const { error: insertError } = await db
      .from('user_formation_assignments')
      .insert(assignments);

    if (insertError) {
      logger.error('Erreur insertion assignation:', insertError);
      throw insertError;
    }

    logger.log('Migration réussie');
    return true;
  },

  async getFormationParticipantsCount(formationId: string): Promise<number> {
    logger.log('Récupération du nombre de participants pour la formation:', formationId);
    
    const { data, error } = await rpcWithRetry(
      () => supabase.rpc('get_formation_students', {
        formation_id_param: formationId
      }),
      RETRY_OPTIONS
    );

    if (error) {
      logger.error('Erreur lors de la récupération des participants:', error);
      return 0;
    }

    return (data as any[])?.length || 0;
  },

  async getFormationStudents(formationId: string) {
    const { data, error } = await supabase.rpc('get_formation_students', {
      formation_id_param: formationId
    });

    if (error) {
      logger.error('Erreur:', error);
      return [];
    }

    return data || [];
  },

  async getFormationInstructors(formationId: string): Promise<{ id: string; first_name: string; last_name: string }[]> {
    logger.log('Récupération des formateurs pour la formation:', formationId);
    
    const { data: modules, error: modulesError } = await supabase
      .from('formation_modules')
      .select('id')
      .eq('formation_id', formationId);

    if (modulesError) {
      logger.error('Erreur lors de la récupération des modules:', modulesError);
      return [];
    }

    if (!modules || modules.length === 0) {
      return [];
    }

    const moduleIds = modules.map(m => m.id);

    const { data: instructorAssignments, error: assignError } = await db
      .from('module_instructors')
      .select('instructor_id')
      .in('module_id', moduleIds);

    if (assignError) {
      logger.error('Erreur lors de la récupération des assignations:', assignError);
      return [];
    }

    if (!instructorAssignments || instructorAssignments.length === 0) {
      return [];
    }

    const uniqueInstructorIds = [...new Set(instructorAssignments.map((a: any) => a.instructor_id))] as string[];

    const { data: instructors, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .in('id', uniqueInstructorIds);

    if (usersError) {
      logger.error('Erreur lors de la récupération des utilisateurs:', usersError);
      return [];
    }

    logger.log('Formateurs récupérés via modules:', instructors);
    return instructors || [];
  }
};
