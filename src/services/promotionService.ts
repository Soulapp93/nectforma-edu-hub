import { supabase } from '@/integrations/supabase/client';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
export interface Promotion {
  id: string;
  establishment_id: string;
  formation_id: string;
  name: string;
  academic_year_start: number;
  academic_year_end: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  formations?: { title: string; level: string; color: string; start_date: string; end_date: string };
  student_count?: number;
  schedule_id?: string;
  text_book_id?: string;
}

export const promotionService = {
  async getPromotions(establishmentId: string): Promise<Promotion[]> {
    const { data, error } = await supabase
      .from('promotions')
      .select('*, formations(title, level, color, start_date, end_date)')
      .eq('establishment_id', establishmentId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    // Enrich with student count, schedule_id, text_book_id
    const enriched = await Promise.all((data || []).map(async (p: any) => {
      const [studentsRes, scheduleRes, textBookRes] = await Promise.all([
        supabase.from('user_formation_assignments').select('user_id', { count: 'exact', head: true }).eq('formation_id', p.formation_id),
        supabase.from('schedules').select('id').eq('promotion_id', p.id).limit(1).maybeSingle(),
        supabase.from('text_books').select('id').eq('promotion_id', p.id).limit(1).maybeSingle(),
      ]);
      return {
        ...p,
        student_count: studentsRes.count || 0,
        schedule_id: scheduleRes.data?.id || null,
        text_book_id: textBookRes.data?.id || null,
      } as Promotion;
    }));

    return enriched;
  },

  async createPromotionWithResources(params: {
    formationId: string;
    formationTitle: string;
    establishmentId: string;
    academicYear: string;
    startDate: string;
    endDate: string;
  }): Promise<Promotion> {
    const [yearStart, yearEnd] = params.academicYear.split('-').map(Number);

    // 1. Create the promotion
    const { data: promotion, error: promError } = await supabase
      .from('promotions')
      .insert({
        formation_id: params.formationId,
        establishment_id: params.establishmentId,
        name: `${params.formationTitle} ${params.academicYear}`,
        academic_year_start: yearStart || new Date().getFullYear(),
        academic_year_end: yearEnd || new Date().getFullYear() + 1,
        is_active: true,
      })
      .select()
      .single();

    if (promError) throw new Error(`Erreur création promotion: ${promError.message}`);

    // 2. Create schedule linked to promotion
    try {
      await supabase.from('schedules').insert({
        formation_id: params.formationId,
        promotion_id: promotion.id,
        title: `Emploi du temps - ${params.formationTitle} ${params.academicYear}`,
      });
    } catch (e) {
      logger.warn('Auto-création emploi du temps échouée:', e);
    }

    // 3. Create text book linked to promotion
    try {
      await supabase.from('text_books').insert({
        formation_id: params.formationId,
        promotion_id: promotion.id,
        title: `Cahier de texte - ${params.formationTitle} ${params.academicYear}`,
        academic_year: params.academicYear,
      });
    } catch (e) {
      logger.warn('Auto-création cahier de texte échouée:', e);
    }

    return promotion as Promotion;
  },

  async deletePromotion(promotionId: string): Promise<void> {
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', promotionId);
    if (error) throw error;
  },

  async togglePromotionActive(promotionId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('promotions')
      .update({ is_active: isActive })
      .eq('id', promotionId);
    if (error) throw error;
  },
};
