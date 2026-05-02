/**
 * Teaching Units (UE) service.
 *
 * UE → Matières hierarchy: a formation has 1+ teaching_units, each unit
 * groups 1+ formation_modules ("matières"). Coefficients live on the
 * matière (not on the UE — the UE is a visual/pedagogical grouping).
 */
import { supabase } from '@/integrations/supabase/client';

export interface TeachingUnit {
  id: string;
  formation_id: string;
  title: string;
  code: string | null;
  coefficient: number;
  credits: number | null;
  order_index: number;
  matieres?: any[]; // populated client-side via join
}

export interface CreateTeachingUnitInput {
  formation_id: string;
  title: string;
  code?: string | null;
  credits?: number | null;
  order_index?: number;
}

export const teachingUnitService = {
  async listForFormation(formationId: string): Promise<TeachingUnit[]> {
    const { data, error } = await supabase
      .from('teaching_units')
      .select('*')
      .eq('formation_id', formationId)
      .order('order_index');
    if (error) throw error;
    return (data || []) as unknown as TeachingUnit[];
  },

  async create(input: CreateTeachingUnitInput): Promise<TeachingUnit> {
    const order = input.order_index ?? 0;
    const { data, error } = await (supabase as any)
      .from('teaching_units')
      .insert({
        formation_id: input.formation_id,
        title: input.title,
        code: input.code || null,
        coefficient: 1, // legacy NOT NULL — kept at 1 since coef lives on matières
        credits: input.credits ?? null,
        order_index: order,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as TeachingUnit;
  },

  async update(id: string, patch: Partial<CreateTeachingUnitInput>): Promise<TeachingUnit> {
    const upd: any = {};
    if (patch.title !== undefined) upd.title = patch.title;
    if (patch.code !== undefined) upd.code = patch.code;
    if (patch.credits !== undefined) upd.credits = patch.credits;
    if (patch.order_index !== undefined) upd.order_index = patch.order_index;
    const { data, error } = await (supabase as any)
      .from('teaching_units')
      .update(upd)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as TeachingUnit;
  },

  async delete(id: string): Promise<void> {
    // Prevent deletion when UE still has matières (safety: backend FK will block)
    const { count } = await supabase
      .from('formation_modules')
      .select('id', { count: 'exact', head: true })
      .eq('teaching_unit_id', id);
    if ((count || 0) > 0) {
      throw new Error(`Impossible de supprimer cette UE : ${count} matière(s) y sont rattachées. Déplacez-les ou supprimez-les d'abord.`);
    }
    const { error } = await (supabase as any).from('teaching_units').delete().eq('id', id);
    if (error) throw error;
  },

  /**
   * Move a matière to another UE (or to no UE = standalone).
   */
  async assignMatiereToUE(moduleId: string, teachingUnitId: string | null): Promise<void> {
    const { error } = await (supabase as any)
      .from('formation_modules')
      .update({ teaching_unit_id: teachingUnitId })
      .eq('id', moduleId);
    if (error) throw error;
  },
};
