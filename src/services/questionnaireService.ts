import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

export interface Questionnaire {
  id: string;
  owner_id: string;
  establishment_id: string | null;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  theme_color: string;
  is_published: boolean;
  is_accepting_responses: boolean;
  requires_auth: boolean;
  allow_multiple_responses: boolean;
  shuffle_questions: boolean;
  show_progress_bar: boolean;
  confirmation_message: string;
  public_token: string;
  scoring_enabled: boolean;
  total_points: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionnaireSection {
  id: string;
  questionnaire_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

export interface QuestionnaireQuestion {
  id: string;
  questionnaire_id: string;
  section_id: string | null;
  question_type: string;
  title: string;
  description: string | null;
  is_required: boolean;
  order_index: number;
  points: number;
  settings: any;
  condition_question_id: string | null;
  condition_operator: string | null;
  condition_value: string | null;
  created_at: string;
  updated_at: string;
  options?: QuestionnaireOption[];
  matrix_rows?: QuestionnaireMatrixRow[];
}

export interface QuestionnaireOption {
  id: string;
  question_id: string;
  label: string;
  value: string | null;
  is_correct: boolean;
  points: number;
  order_index: number;
  image_url: string | null;
  created_at: string;
}

export interface QuestionnaireMatrixRow {
  id: string;
  question_id: string;
  label: string;
  order_index: number;
}

export interface QuestionnaireResponse {
  id: string;
  questionnaire_id: string;
  respondent_id: string | null;
  respondent_name: string | null;
  respondent_email: string | null;
  score: number | null;
  max_score: number | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface QuestionnaireAnswer {
  id: string;
  response_id: string;
  question_id: string;
  answer_text: string | null;
  answer_values: any;
  answer_file_url: string | null;
  points_earned: number;
  created_at: string;
}

export const questionnaireService = {
  // ==================== QUESTIONNAIRES ====================
  async getMyQuestionnaires(ownerId: string): Promise<Questionnaire[]> {
    const { data, error } = await db
      .from('questionnaires')
      .select('*')
      .eq('owner_id', ownerId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getQuestionnaireById(id: string): Promise<Questionnaire> {
    const { data, error } = await db
      .from('questionnaires')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async getQuestionnaireByToken(token: string): Promise<Questionnaire | null> {
    const { data, error } = await db
      .from('questionnaires')
      .select('*')
      .eq('public_token', token)
      .eq('is_published', true)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async createQuestionnaire(q: Partial<Questionnaire>): Promise<Questionnaire> {
    const { data, error } = await db
      .from('questionnaires')
      .insert(q)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateQuestionnaire(id: string, updates: Partial<Questionnaire>): Promise<Questionnaire> {
    const { data, error } = await db
      .from('questionnaires')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteQuestionnaire(id: string): Promise<void> {
    const { error } = await db.from('questionnaires').delete().eq('id', id);
    if (error) throw error;
  },

  // ==================== SECTIONS ====================
  async getSections(questionnaireId: string): Promise<QuestionnaireSection[]> {
    const { data, error } = await db
      .from('questionnaire_sections')
      .select('*')
      .eq('questionnaire_id', questionnaireId)
      .order('order_index');
    if (error) throw error;
    return data || [];
  },

  async createSection(s: Partial<QuestionnaireSection>): Promise<QuestionnaireSection> {
    const { data, error } = await db.from('questionnaire_sections').insert(s).select().single();
    if (error) throw error;
    return data;
  },

  async updateSection(id: string, updates: Partial<QuestionnaireSection>): Promise<void> {
    const { error } = await db.from('questionnaire_sections').update(updates).eq('id', id);
    if (error) throw error;
  },

  async deleteSection(id: string): Promise<void> {
    const { error } = await db.from('questionnaire_sections').delete().eq('id', id);
    if (error) throw error;
  },

  // ==================== QUESTIONS ====================
  async getQuestions(questionnaireId: string): Promise<QuestionnaireQuestion[]> {
    const { data: questions, error } = await db
      .from('questionnaire_questions')
      .select('*')
      .eq('questionnaire_id', questionnaireId)
      .order('order_index');
    if (error) throw error;

    if (!questions?.length) return [];

    const questionIds = questions.map((q: any) => q.id);

    const [{ data: options }, { data: matrixRows }] = await Promise.all([
      db.from('questionnaire_options').select('*').in('question_id', questionIds).order('order_index'),
      db.from('questionnaire_matrix_rows').select('*').in('question_id', questionIds).order('order_index'),
    ]);

    return questions.map((q: any) => ({
      ...q,
      options: (options || []).filter((o: any) => o.question_id === q.id),
      matrix_rows: (matrixRows || []).filter((r: any) => r.question_id === q.id),
    }));
  },

  async createQuestion(q: Partial<QuestionnaireQuestion>): Promise<QuestionnaireQuestion> {
    const { options, matrix_rows, ...questionData } = q as any;
    const { data, error } = await db.from('questionnaire_questions').insert(questionData).select().single();
    if (error) throw error;
    return { ...data, options: [], matrix_rows: [] };
  },

  async updateQuestion(id: string, updates: Partial<QuestionnaireQuestion>): Promise<void> {
    const { options, matrix_rows, ...questionData } = updates as any;
    const { error } = await db.from('questionnaire_questions').update(questionData).eq('id', id);
    if (error) throw error;
  },

  async deleteQuestion(id: string): Promise<void> {
    const { error } = await db.from('questionnaire_questions').delete().eq('id', id);
    if (error) throw error;
  },

  // ==================== OPTIONS ====================
  async createOption(o: Partial<QuestionnaireOption>): Promise<QuestionnaireOption> {
    const { data, error } = await db.from('questionnaire_options').insert(o).select().single();
    if (error) throw error;
    return data;
  },

  async updateOption(id: string, updates: Partial<QuestionnaireOption>): Promise<void> {
    const { error } = await db.from('questionnaire_options').update(updates).eq('id', id);
    if (error) throw error;
  },

  async deleteOption(id: string): Promise<void> {
    const { error } = await db.from('questionnaire_options').delete().eq('id', id);
    if (error) throw error;
  },

  // ==================== MATRIX ROWS ====================
  async createMatrixRow(r: Partial<QuestionnaireMatrixRow>): Promise<QuestionnaireMatrixRow> {
    const { data, error } = await db.from('questionnaire_matrix_rows').insert(r).select().single();
    if (error) throw error;
    return data;
  },

  async deleteMatrixRow(id: string): Promise<void> {
    const { error } = await db.from('questionnaire_matrix_rows').delete().eq('id', id);
    if (error) throw error;
  },

  // ==================== RESPONSES ====================
  async getResponses(questionnaireId: string): Promise<QuestionnaireResponse[]> {
    const { data, error } = await db
      .from('questionnaire_responses')
      .select('*')
      .eq('questionnaire_id', questionnaireId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createResponse(r: Partial<QuestionnaireResponse>): Promise<QuestionnaireResponse> {
    const { data, error } = await db.from('questionnaire_responses').insert(r).select().single();
    if (error) throw error;
    return data;
  },

  async updateResponse(id: string, updates: Partial<QuestionnaireResponse>): Promise<void> {
    const { error } = await db.from('questionnaire_responses').update(updates).eq('id', id);
    if (error) throw error;
  },

  // ==================== ANSWERS ====================
  async getAnswers(responseId: string): Promise<QuestionnaireAnswer[]> {
    const { data, error } = await db
      .from('questionnaire_answers')
      .select('*')
      .eq('response_id', responseId);
    if (error) throw error;
    return data || [];
  },

  async getAnswersByQuestionnaire(questionnaireId: string): Promise<QuestionnaireAnswer[]> {
    const { data: responses } = await db
      .from('questionnaire_responses')
      .select('id')
      .eq('questionnaire_id', questionnaireId);
    if (!responses?.length) return [];
    
    const responseIds = responses.map((r: any) => r.id);
    const { data, error } = await db
      .from('questionnaire_answers')
      .select('*')
      .in('response_id', responseIds);
    if (error) throw error;
    return data || [];
  },

  async submitAnswers(answers: Partial<QuestionnaireAnswer>[]): Promise<void> {
    const { error } = await db.from('questionnaire_answers').insert(answers);
    if (error) throw error;
  },

  // ==================== ANALYTICS ====================
  async getAnalytics(questionnaireId: string) {
    const [responses, questions, allAnswers] = await Promise.all([
      this.getResponses(questionnaireId),
      this.getQuestions(questionnaireId),
      this.getAnswersByQuestionnaire(questionnaireId),
    ]);

    const totalResponses = responses.length;
    const completedResponses = responses.filter(r => r.completed_at).length;
    const completionRate = totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0;
    const avgScore = responses.filter(r => r.score != null).length > 0
      ? responses.filter(r => r.score != null).reduce((s, r) => s + (r.score || 0), 0) / responses.filter(r => r.score != null).length
      : null;

    const questionAnalytics = questions.map(q => {
      const answers = allAnswers.filter(a => a.question_id === q.id);
      
      if (['single_choice', 'multiple_choice', 'dropdown'].includes(q.question_type)) {
        const optionCounts: Record<string, number> = {};
        q.options?.forEach(o => { optionCounts[o.label] = 0; });
        answers.forEach(a => {
          if (a.answer_text) {
            optionCounts[a.answer_text] = (optionCounts[a.answer_text] || 0) + 1;
          }
          if (a.answer_values && Array.isArray(a.answer_values)) {
            a.answer_values.forEach((v: string) => {
              optionCounts[v] = (optionCounts[v] || 0) + 1;
            });
          }
        });
        return { question: q, type: 'choice', data: optionCounts, totalAnswers: answers.length };
      }

      if (['linear_scale', 'rating', 'number'].includes(q.question_type)) {
        const values = answers.map(a => parseFloat(a.answer_text || '0')).filter(v => !isNaN(v));
        const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
        const min = values.length > 0 ? Math.min(...values) : 0;
        const max = values.length > 0 ? Math.max(...values) : 0;
        const distribution: Record<string, number> = {};
        values.forEach(v => { const k = String(v); distribution[k] = (distribution[k] || 0) + 1; });
        return { question: q, type: 'numeric', data: { avg, min, max, distribution }, totalAnswers: values.length };
      }

      return {
        question: q,
        type: 'text',
        data: answers.map(a => a.answer_text).filter(Boolean),
        totalAnswers: answers.length,
      };
    });

    return {
      totalResponses,
      completedResponses,
      completionRate,
      avgScore,
      questionAnalytics,
      responses,
    };
  },
};
