
-- Add 'quiz' to workspace_documents document_type check constraint
ALTER TABLE public.workspace_documents DROP CONSTRAINT IF EXISTS workspace_documents_document_type_check;
ALTER TABLE public.workspace_documents ADD CONSTRAINT workspace_documents_document_type_check 
  CHECK (document_type IN ('text', 'spreadsheet', 'presentation', 'visual', 'whiteboard', 'questionnaire', 'quiz'));

-- Quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  establishment_id UUID REFERENCES public.establishments(id),
  title TEXT NOT NULL DEFAULT 'Quiz sans titre',
  description TEXT,
  cover_image_url TEXT,
  theme_color TEXT DEFAULT '#8B5CF6',
  -- Quiz settings
  time_per_question INTEGER DEFAULT 30, -- seconds
  points_per_question INTEGER DEFAULT 1000,
  bonus_speed_points BOOLEAN DEFAULT true,
  shuffle_questions BOOLEAN DEFAULT false,
  shuffle_options BOOLEAN DEFAULT false,
  show_correct_answer BOOLEAN DEFAULT true,
  show_leaderboard_after_each BOOLEAN DEFAULT true,
  allow_teams BOOLEAN DEFAULT false,
  max_team_size INTEGER DEFAULT 4,
  -- Game modes
  mode TEXT NOT NULL DEFAULT 'live' CHECK (mode IN ('live', 'async', 'both')),
  -- Status
  is_published BOOLEAN DEFAULT false,
  total_questions INTEGER DEFAULT 0,
  -- Gamification
  streak_bonus_enabled BOOLEAN DEFAULT true,
  power_ups_enabled BOOLEAN DEFAULT false,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own quizzes" ON public.quizzes
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "View published quizzes in establishment" ON public.quizzes
  FOR SELECT USING (is_published = true AND establishment_id = get_current_user_establishment());

-- Quiz questions
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL DEFAULT 'mcq' CHECK (question_type IN (
    'mcq', 'true_false', 'open_text', 'ordering', 'matching', 'puzzle', 'fill_blank', 'slider'
  )),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  time_limit INTEGER DEFAULT 30, -- override per question
  points INTEGER DEFAULT 1000,
  order_index INTEGER NOT NULL DEFAULT 0,
  -- For MCQ/True-False
  options JSONB DEFAULT '[]'::jsonb, -- [{id, text, isCorrect, imageUrl}]
  -- For ordering
  correct_order JSONB DEFAULT '[]'::jsonb, -- [itemId1, itemId2, ...]
  -- For matching
  matching_pairs JSONB DEFAULT '[]'::jsonb, -- [{left, right}]
  -- For fill blank
  accepted_answers JSONB DEFAULT '[]'::jsonb, -- ["answer1", "answer2"]
  -- For slider
  slider_min INTEGER DEFAULT 0,
  slider_max INTEGER DEFAULT 100,
  slider_correct INTEGER,
  slider_tolerance INTEGER DEFAULT 5,
  -- Explanation shown after answer
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quiz owner manages questions" ON public.quiz_questions
  FOR ALL USING (quiz_id IN (SELECT id FROM public.quizzes WHERE owner_id = auth.uid()))
  WITH CHECK (quiz_id IN (SELECT id FROM public.quizzes WHERE owner_id = auth.uid()));

CREATE POLICY "View questions of published quizzes" ON public.quiz_questions
  FOR SELECT USING (quiz_id IN (
    SELECT id FROM public.quizzes WHERE is_published = true AND establishment_id = get_current_user_establishment()
  ));

-- Quiz sessions (live game instances)
CREATE TABLE public.quiz_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  host_id UUID NOT NULL,
  pin_code TEXT NOT NULL DEFAULT lpad(floor(random() * 999999)::text, 6, '0'),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'question_active', 'showing_results', 'finished')),
  current_question_index INTEGER DEFAULT 0,
  current_question_started_at TIMESTAMPTZ,
  mode TEXT NOT NULL DEFAULT 'live' CHECK (mode IN ('live', 'async')),
  allow_late_join BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Host manages sessions" ON public.quiz_sessions
  FOR ALL USING (host_id = auth.uid()) WITH CHECK (host_id = auth.uid());

CREATE POLICY "Participants view active sessions" ON public.quiz_sessions
  FOR SELECT USING (status != 'finished');

-- Enable realtime for sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_sessions;

-- Quiz teams
CREATE TABLE public.quiz_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#8B5CF6',
  avatar_emoji TEXT DEFAULT '🎯',
  total_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session participants manage teams" ON public.quiz_teams
  FOR ALL USING (true) WITH CHECK (true);

-- Quiz participants
CREATE TABLE public.quiz_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  team_id UUID REFERENCES public.quiz_teams(id) ON DELETE SET NULL,
  nickname TEXT,
  avatar_url TEXT,
  total_score INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_answered INTEGER DEFAULT 0,
  rank INTEGER,
  badges JSONB DEFAULT '[]'::jsonb,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

ALTER TABLE public.quiz_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own participation" ON public.quiz_participants
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "View session participants" ON public.quiz_participants
  FOR SELECT USING (session_id IN (SELECT id FROM public.quiz_sessions));

-- Enable realtime for participants (leaderboard)
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_participants;

-- Quiz answers
CREATE TABLE public.quiz_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.quiz_participants(id) ON DELETE CASCADE,
  answer_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- flexible: {selectedOptionId, text, order, matches, value}
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  time_taken_ms INTEGER, -- milliseconds to answer
  streak_at_time INTEGER DEFAULT 0,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, question_id, participant_id)
);

ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own answers" ON public.quiz_answers
  FOR ALL USING (participant_id IN (SELECT id FROM public.quiz_participants WHERE user_id = auth.uid()))
  WITH CHECK (participant_id IN (SELECT id FROM public.quiz_participants WHERE user_id = auth.uid()));

CREATE POLICY "Host views all answers" ON public.quiz_answers
  FOR SELECT USING (session_id IN (SELECT id FROM public.quiz_sessions WHERE host_id = auth.uid()));

-- Enable realtime for answers
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_answers;

-- Trigger to update quiz total_questions
CREATE OR REPLACE FUNCTION public.update_quiz_question_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.quizzes SET total_questions = (
      SELECT COUNT(*) FROM public.quiz_questions WHERE quiz_id = OLD.quiz_id
    ), updated_at = now() WHERE id = OLD.quiz_id;
    RETURN OLD;
  ELSE
    UPDATE public.quizzes SET total_questions = (
      SELECT COUNT(*) FROM public.quiz_questions WHERE quiz_id = NEW.quiz_id
    ), updated_at = now() WHERE id = NEW.quiz_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_update_quiz_question_count
AFTER INSERT OR DELETE ON public.quiz_questions
FOR EACH ROW EXECUTE FUNCTION public.update_quiz_question_count();
