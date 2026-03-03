import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

export interface Quiz {
  id: string;
  owner_id: string;
  establishment_id: string | null;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  theme_color: string;
  theme_preset: string;
  theme_config: any;
  audio_enabled: boolean;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  background_image_url: string | null;
  background_music_url: string | null;
  time_per_question: number;
  points_per_question: number;
  bonus_speed_points: boolean;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_correct_answer: boolean;
  show_leaderboard_after_each: boolean;
  allow_teams: boolean;
  max_team_size: number;
  mode: 'live' | 'async' | 'both';
  is_published: boolean;
  total_questions: number;
  streak_bonus_enabled: boolean;
  power_ups_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_type: 'mcq' | 'true_false' | 'open_text' | 'ordering' | 'matching' | 'puzzle' | 'fill_blank' | 'slider';
  title: string;
  description: string | null;
  image_url: string | null;
  time_limit: number;
  points: number;
  order_index: number;
  options: any[];
  correct_order: any[];
  matching_pairs: any[];
  accepted_answers: string[];
  slider_min: number;
  slider_max: number;
  slider_correct: number | null;
  slider_tolerance: number;
  explanation: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuizSession {
  id: string;
  quiz_id: string;
  host_id: string;
  pin_code: string;
  status: 'waiting' | 'in_progress' | 'question_active' | 'showing_results' | 'finished';
  current_question_index: number;
  current_question_started_at: string | null;
  mode: 'live' | 'async';
  session_type: string;
  max_participants: number | null;
  tournament_round: number;
  allow_late_join: boolean;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuizParticipant {
  id: string;
  session_id: string;
  user_id: string | null;
  anonymous_id: string | null;
  team_id: string | null;
  nickname: string | null;
  avatar_url: string | null;
  avatar_emoji: string;
  total_score: number;
  current_streak: number;
  best_streak: number;
  correct_answers: number;
  total_answered: number;
  rank: number | null;
  badges: any[];
  power_ups_used: any[];
  perfect_rounds: number;
  joined_at: string;
}

export interface QuizAnswer {
  id: string;
  session_id: string;
  question_id: string;
  participant_id: string;
  answer_data: any;
  is_correct: boolean | null;
  points_earned: number;
  time_taken_ms: number | null;
  streak_at_time: number;
  answered_at: string;
}

export interface QuizTeam {
  id: string;
  session_id: string;
  name: string;
  color: string;
  avatar_emoji: string;
  total_score: number;
  created_at: string;
}

export const quizService = {
  // ====== QUIZZES ======
  async createQuiz(data: Partial<Quiz>): Promise<Quiz> {
    const { data: quiz, error } = await db.from('quizzes').insert(data).select().single();
    if (error) throw error;
    return quiz;
  },

  async getQuiz(id: string): Promise<Quiz> {
    const { data, error } = await db.from('quizzes').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async getMyQuizzes(ownerId: string): Promise<Quiz[]> {
    const { data, error } = await db.from('quizzes').select('*').eq('owner_id', ownerId).order('updated_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz> {
    const { data, error } = await db.from('quizzes').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteQuiz(id: string): Promise<void> {
    const { error } = await db.from('quizzes').delete().eq('id', id);
    if (error) throw error;
  },

  // ====== QUESTIONS ======
  async getQuestions(quizId: string): Promise<QuizQuestion[]> {
    const { data, error } = await db.from('quiz_questions').select('*').eq('quiz_id', quizId).order('order_index');
    if (error) throw error;
    return data || [];
  },

  async createQuestion(data: Partial<QuizQuestion>): Promise<QuizQuestion> {
    const { data: q, error } = await db.from('quiz_questions').insert(data).select().single();
    if (error) throw error;
    return q;
  },

  async updateQuestion(id: string, updates: Partial<QuizQuestion>): Promise<QuizQuestion> {
    const { data, error } = await db.from('quiz_questions').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteQuestion(id: string): Promise<void> {
    const { error } = await db.from('quiz_questions').delete().eq('id', id);
    if (error) throw error;
  },

  async reorderQuestions(quizId: string, questionIds: string[]): Promise<void> {
    for (let i = 0; i < questionIds.length; i++) {
      await db.from('quiz_questions').update({ order_index: i }).eq('id', questionIds[i]);
    }
  },

  // ====== SESSIONS ======
  async createSession(data: Partial<QuizSession>): Promise<QuizSession> {
    const { data: session, error } = await db.from('quiz_sessions').insert(data).select().single();
    if (error) throw error;
    return session;
  },

  async getSession(id: string): Promise<QuizSession> {
    const { data, error } = await db.from('quiz_sessions').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async getSessionByPin(pin: string): Promise<QuizSession | null> {
    const { data, error } = await db.from('quiz_sessions').select('*').eq('pin_code', pin).eq('status', 'waiting').single();
    if (error) return null;
    return data;
  },

  async updateSession(id: string, updates: Partial<QuizSession>): Promise<QuizSession> {
    const { data, error } = await db.from('quiz_sessions').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async getActiveSessions(quizId: string): Promise<QuizSession[]> {
    const { data, error } = await db.from('quiz_sessions').select('*').eq('quiz_id', quizId).neq('status', 'finished').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getSessionHistory(hostId: string): Promise<QuizSession[]> {
    const { data, error } = await db.from('quiz_sessions').select('*').eq('host_id', hostId).order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return data || [];
  },

  // ====== PARTICIPANTS ======
  async joinSession(sessionId: string, userId: string, nickname?: string, avatarEmoji?: string): Promise<QuizParticipant> {
    const { data, error } = await db.from('quiz_participants').insert({
      session_id: sessionId,
      user_id: userId,
      nickname,
      avatar_emoji: avatarEmoji || '😎',
    }).select().single();
    if (error) throw error;
    return data;
  },

  async joinSessionAnonymous(sessionId: string, anonymousId: string, nickname?: string, avatarEmoji?: string): Promise<QuizParticipant> {
    const { data, error } = await db.from('quiz_participants').insert({
      session_id: sessionId,
      anonymous_id: anonymousId,
      nickname,
      avatar_emoji: avatarEmoji || '😎',
    }).select().single();
    if (error) throw error;
    return data;
  },

  async getParticipants(sessionId: string): Promise<QuizParticipant[]> {
    const { data, error } = await db.from('quiz_participants').select('*').eq('session_id', sessionId).order('total_score', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async updateParticipant(id: string, updates: Partial<QuizParticipant>): Promise<void> {
    const { error } = await db.from('quiz_participants').update(updates).eq('id', id);
    if (error) throw error;
  },

  // ====== TEAMS ======
  async createTeam(data: Partial<QuizTeam>): Promise<QuizTeam> {
    const { data: team, error } = await db.from('quiz_teams').insert(data).select().single();
    if (error) throw error;
    return team;
  },

  async getTeams(sessionId: string): Promise<QuizTeam[]> {
    const { data, error } = await db.from('quiz_teams').select('*').eq('session_id', sessionId).order('total_score', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async updateTeam(id: string, updates: Partial<QuizTeam>): Promise<void> {
    const { error } = await db.from('quiz_teams').update(updates).eq('id', id);
    if (error) throw error;
  },

  // ====== ANSWERS ======
  async submitAnswer(data: Partial<QuizAnswer>): Promise<QuizAnswer> {
    const { data: answer, error } = await db.from('quiz_answers').insert(data).select().single();
    if (error) throw error;
    return answer;
  },

  async getAnswersForQuestion(sessionId: string, questionId: string): Promise<QuizAnswer[]> {
    const { data, error } = await db.from('quiz_answers').select('*').eq('session_id', sessionId).eq('question_id', questionId);
    if (error) throw error;
    return data || [];
  },

  async getParticipantAnswers(participantId: string): Promise<QuizAnswer[]> {
    const { data, error } = await db.from('quiz_answers').select('*').eq('participant_id', participantId).order('answered_at');
    if (error) throw error;
    return data || [];
  },

  async getAllSessionAnswers(sessionId: string): Promise<QuizAnswer[]> {
    const { data, error } = await db.from('quiz_answers').select('*').eq('session_id', sessionId);
    if (error) throw error;
    return data || [];
  },

  // ====== SCORING ======
  calculatePoints(isCorrect: boolean, timeTakenMs: number, timeLimitMs: number, basePoints: number, bonusSpeed: boolean, currentStreak: number, streakBonus: boolean): { points: number; newStreak: number } {
    if (!isCorrect) return { points: 0, newStreak: 0 };
    
    let points = basePoints;
    
    // Speed bonus: faster = more points (up to 2x)
    if (bonusSpeed && timeLimitMs > 0) {
      const speedFactor = Math.max(0, 1 - (timeTakenMs / timeLimitMs));
      points = Math.round(basePoints * (1 + speedFactor));
    }
    
    // Streak bonus: consecutive correct answers
    if (streakBonus && currentStreak > 0) {
      const streakMultiplier = 1 + Math.min(currentStreak * 0.1, 0.5); // up to 50% bonus
      points = Math.round(points * streakMultiplier);
    }
    
    return { points, newStreak: currentStreak + 1 };
  },

  checkAnswer(question: QuizQuestion, answerData: any): boolean {
    switch (question.question_type) {
      case 'mcq': {
        const correctOptions = (question.options || []).filter((o: any) => o.isCorrect).map((o: any) => o.id);
        const selected = answerData.selectedOptionIds || [answerData.selectedOptionId];
        return correctOptions.length === selected.length && correctOptions.every((id: string) => selected.includes(id));
      }
      case 'true_false': {
        const correct = (question.options || []).find((o: any) => o.isCorrect);
        return correct && answerData.selectedOptionId === correct.id;
      }
      case 'open_text': {
        const userAnswer = (answerData.text || '').trim().toLowerCase();
        return (question.accepted_answers || []).some((a: string) => a.trim().toLowerCase() === userAnswer);
      }
      case 'ordering': {
        const correctOrder = question.correct_order || [];
        const userOrder = answerData.order || [];
        return JSON.stringify(correctOrder) === JSON.stringify(userOrder);
      }
      case 'matching': {
        const correctPairs = question.matching_pairs || [];
        const userPairs = answerData.matches || [];
        return correctPairs.every((cp: any, i: number) => userPairs[i]?.right === cp.right);
      }
      case 'fill_blank': {
        const userAnswer = (answerData.text || '').trim().toLowerCase();
        return (question.accepted_answers || []).some((a: string) => a.trim().toLowerCase() === userAnswer);
      }
      case 'slider': {
        const value = answerData.value;
        const correct = question.slider_correct;
        const tolerance = question.slider_tolerance || 5;
        return correct !== null && Math.abs(value - correct!) <= tolerance;
      }
      default:
        return false;
    }
  },

  // ====== REALTIME ======
  subscribeToSession(sessionId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`quiz-session-${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_sessions', filter: `id=eq.${sessionId}` }, callback)
      .subscribe();
  },

  subscribeToParticipants(sessionId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`quiz-participants-${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_participants', filter: `session_id=eq.${sessionId}` }, callback)
      .subscribe();
  },

  subscribeToAnswers(sessionId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`quiz-answers-${sessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quiz_answers', filter: `session_id=eq.${sessionId}` }, callback)
      .subscribe();
  },

  // ====== REPORTS ======
  async getSessionReport(sessionId: string) {
    const [participants, answers, session] = await Promise.all([
      this.getParticipants(sessionId),
      this.getAllSessionAnswers(sessionId),
      this.getSession(sessionId),
    ]);

    const quiz = await this.getQuiz(session.quiz_id);
    const questions = await this.getQuestions(session.quiz_id);

    const questionStats = questions.map(q => {
      const qAnswers = answers.filter(a => a.question_id === q.id);
      const correct = qAnswers.filter(a => a.is_correct).length;
      const total = qAnswers.length;
      const avgTime = total > 0 ? Math.round(qAnswers.reduce((sum, a) => sum + (a.time_taken_ms || 0), 0) / total) : 0;

      return {
        question: q,
        totalAnswers: total,
        correctAnswers: correct,
        successRate: total > 0 ? Math.round((correct / total) * 100) : 0,
        avgTimeMs: avgTime,
        answerDistribution: this.getAnswerDistribution(q, qAnswers),
      };
    });

    return {
      quiz,
      session,
      participants: participants.sort((a, b) => b.total_score - a.total_score),
      questionStats,
      totalParticipants: participants.length,
      avgScore: participants.length > 0 ? Math.round(participants.reduce((sum, p) => sum + p.total_score, 0) / participants.length) : 0,
      completionRate: participants.length > 0 ? Math.round((participants.filter(p => p.total_answered === questions.length).length / participants.length) * 100) : 0,
    };
  },

  getAnswerDistribution(question: QuizQuestion, answers: QuizAnswer[]) {
    if (question.question_type === 'mcq' || question.question_type === 'true_false') {
      const dist: Record<string, number> = {};
      (question.options || []).forEach((o: any) => { dist[o.id] = 0; });
      answers.forEach(a => {
        const selected = a.answer_data?.selectedOptionId || a.answer_data?.selectedOptionIds?.[0];
        if (selected && dist[selected] !== undefined) dist[selected]++;
      });
      return (question.options || []).map((o: any) => ({
        label: o.text,
        count: dist[o.id] || 0,
        isCorrect: o.isCorrect,
      }));
    }
    return [];
  },
};
