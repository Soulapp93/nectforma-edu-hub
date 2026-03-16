
import { supabase } from '@/integrations/supabase/client';

export interface Promotion {
  id: string;
  formation_id: string;
  name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  capacity: number;
  status: string;
  establishment_id: string;
  created_at: string;
  updated_at: string;
  // Joined data
  students_count?: number;
  formation?: {
    id: string;
    title: string;
    level: string;
    color: string | null;
    duration: number;
    semesters_count: number;
  };
}

export interface CreatePromotionData {
  formation_id: string;
  name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  capacity: number;
  establishment_id: string;
  status?: string;
}

export const promotionService = {
  async getPromotionsByFormation(formationId: string): Promise<Promotion[]> {
    const { data, error } = await (supabase as any)
      .from('promotions')
      .select('*')
      .eq('formation_id', formationId)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Erreur récupération promotions:', error);
      throw new Error(error.message);
    }

    // Get student counts for each promotion
    const promotionsWithCounts = await Promise.all(
      (data || []).map(async (promo: any) => {
        const count = await this.getPromotionStudentsCount(promo.id);
        return { ...promo, students_count: count };
      })
    );

    return promotionsWithCounts;
  },

  async getAllPromotions(): Promise<Promotion[]> {
    const { data, error } = await (supabase as any)
      .from('promotions')
      .select(`
        *,
        formation:formations(id, title, level, color, duration, semesters_count)
      `)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Erreur récupération promotions:', error);
      throw new Error(error.message);
    }

    return data || [];
  },

  async getPromotionById(id: string): Promise<Promotion> {
    const { data, error } = await (supabase as any)
      .from('promotions')
      .select(`
        *,
        formation:formations(id, title, level, color, duration, semesters_count, description)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erreur récupération promotion:', error);
      throw new Error(error.message);
    }

    return data;
  },

  async createPromotion(data: CreatePromotionData): Promise<Promotion> {
    const { data: promo, error } = await (supabase as any)
      .from('promotions')
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error('Erreur création promotion:', error);
      throw new Error(error.message);
    }

    return promo;
  },

  async updatePromotion(id: string, data: Partial<CreatePromotionData>): Promise<Promotion> {
    const { data: promo, error } = await (supabase as any)
      .from('promotions')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur mise à jour promotion:', error);
      throw new Error(error.message);
    }

    return promo;
  },

  async deletePromotion(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('promotions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur suppression promotion:', error);
      throw new Error(error.message);
    }
  },

  async getPromotionStudentsCount(promotionId: string): Promise<number> {
    const { data, error } = await supabase.rpc('get_promotion_students', {
      promotion_id_param: promotionId
    });

    if (error) {
      console.error('Erreur comptage étudiants promotion:', error);
      return 0;
    }

    return (data as any[])?.length || 0;
  },

  async getPromotionStudents(promotionId: string) {
    const { data, error } = await supabase.rpc('get_promotion_students', {
      promotion_id_param: promotionId
    });

    if (error) {
      console.error('Erreur récupération étudiants promotion:', error);
      throw new Error(error.message);
    }

    return data || [];
  },

  async assignStudentToPromotion(studentId: string, promotionId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('student_promotion_assignments')
      .insert([{ student_id: studentId, promotion_id: promotionId }]);

    if (error) {
      if (error.code === '23505') {
        throw new Error('Cet étudiant est déjà inscrit dans cette promotion');
      }
      console.error('Erreur assignation étudiant:', error);
      throw new Error(error.message);
    }
  },

  async removeStudentFromPromotion(studentId: string, promotionId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('student_promotion_assignments')
      .delete()
      .eq('student_id', studentId)
      .eq('promotion_id', promotionId);

    if (error) {
      console.error('Erreur retrait étudiant:', error);
      throw new Error(error.message);
    }
  },

  async duplicatePromotion(sourcePromotionId: string, newData: {
    name: string;
    academic_year: string;
    start_date: string;
    end_date: string;
    capacity: number;
  }): Promise<Promotion> {
    // Get source promotion
    const source = await this.getPromotionById(sourcePromotionId);
    
    // Create new promotion
    const newPromo = await this.createPromotion({
      formation_id: source.formation_id,
      name: newData.name,
      academic_year: newData.academic_year,
      start_date: newData.start_date,
      end_date: newData.end_date,
      capacity: newData.capacity,
      establishment_id: source.establishment_id,
      status: 'active'
    });

    return newPromo;
  }
};
