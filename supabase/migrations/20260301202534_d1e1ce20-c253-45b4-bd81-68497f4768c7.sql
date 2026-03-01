
-- Questionnaires table
CREATE TABLE public.questionnaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  establishment_id UUID REFERENCES public.establishments(id),
  title TEXT NOT NULL DEFAULT 'Questionnaire sans titre',
  description TEXT,
  cover_image_url TEXT,
  theme_color TEXT DEFAULT '#8B5CF6',
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_accepting_responses BOOLEAN NOT NULL DEFAULT true,
  requires_auth BOOLEAN NOT NULL DEFAULT false,
  allow_multiple_responses BOOLEAN NOT NULL DEFAULT false,
  shuffle_questions BOOLEAN NOT NULL DEFAULT false,
  show_progress_bar BOOLEAN NOT NULL DEFAULT true,
  confirmation_message TEXT DEFAULT 'Merci pour votre réponse !',
  public_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  scoring_enabled BOOLEAN NOT NULL DEFAULT false,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sections for grouping questions
CREATE TABLE public.questionnaire_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  questionnaire_id UUID NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Section sans titre',
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Questions
CREATE TABLE public.questionnaire_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  questionnaire_id UUID NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.questionnaire_sections(id) ON DELETE SET NULL,
  question_type TEXT NOT NULL DEFAULT 'short_text',
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  points INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}'::jsonb,
  -- conditional logic: show this question only if condition met
  condition_question_id UUID REFERENCES public.questionnaire_questions(id) ON DELETE SET NULL,
  condition_operator TEXT, -- 'equals', 'not_equals', 'contains'
  condition_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_question_type CHECK (question_type IN (
    'short_text', 'long_text', 'single_choice', 'multiple_choice',
    'dropdown', 'linear_scale', 'rating', 'date', 'time', 'file_upload',
    'ranking', 'matrix', 'number', 'email', 'phone', 'url', 'section_break'
  ))
);

-- Options for choice-based questions
CREATE TABLE public.questionnaire_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questionnaire_questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT,
  is_correct BOOLEAN DEFAULT false,
  points INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Matrix rows (for matrix questions)
CREATE TABLE public.questionnaire_matrix_rows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questionnaire_questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Responses (one per submission)
CREATE TABLE public.questionnaire_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  questionnaire_id UUID NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  respondent_id UUID,
  respondent_name TEXT,
  respondent_email TEXT,
  score INTEGER,
  max_score INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual answers
CREATE TABLE public.questionnaire_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID NOT NULL REFERENCES public.questionnaire_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questionnaire_questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  answer_values JSONB, -- for multi-choice, matrix, ranking
  answer_file_url TEXT,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_matrix_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_answers ENABLE ROW LEVEL SECURITY;

-- RLS: Questionnaires
CREATE POLICY "Users manage own questionnaires" ON public.questionnaires
FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "View published questionnaires via token" ON public.questionnaires
FOR SELECT USING (is_published = true);

-- RLS: Sections
CREATE POLICY "Owner manages sections" ON public.questionnaire_sections
FOR ALL USING (questionnaire_id IN (SELECT id FROM public.questionnaires WHERE owner_id = auth.uid()))
WITH CHECK (questionnaire_id IN (SELECT id FROM public.questionnaires WHERE owner_id = auth.uid()));

CREATE POLICY "Public view sections" ON public.questionnaire_sections
FOR SELECT USING (questionnaire_id IN (SELECT id FROM public.questionnaires WHERE is_published = true));

-- RLS: Questions
CREATE POLICY "Owner manages questions" ON public.questionnaire_questions
FOR ALL USING (questionnaire_id IN (SELECT id FROM public.questionnaires WHERE owner_id = auth.uid()))
WITH CHECK (questionnaire_id IN (SELECT id FROM public.questionnaires WHERE owner_id = auth.uid()));

CREATE POLICY "Public view questions" ON public.questionnaire_questions
FOR SELECT USING (questionnaire_id IN (SELECT id FROM public.questionnaires WHERE is_published = true));

-- RLS: Options
CREATE POLICY "Owner manages options" ON public.questionnaire_options
FOR ALL USING (question_id IN (SELECT id FROM public.questionnaire_questions WHERE questionnaire_id IN (SELECT id FROM public.questionnaires WHERE owner_id = auth.uid())))
WITH CHECK (question_id IN (SELECT id FROM public.questionnaire_questions WHERE questionnaire_id IN (SELECT id FROM public.questionnaires WHERE owner_id = auth.uid())));

CREATE POLICY "Public view options" ON public.questionnaire_options
FOR SELECT USING (question_id IN (SELECT id FROM public.questionnaire_questions WHERE questionnaire_id IN (SELECT id FROM public.questionnaires WHERE is_published = true)));

-- RLS: Matrix rows
CREATE POLICY "Owner manages matrix rows" ON public.questionnaire_matrix_rows
FOR ALL USING (question_id IN (SELECT id FROM public.questionnaire_questions WHERE questionnaire_id IN (SELECT id FROM public.questionnaires WHERE owner_id = auth.uid())))
WITH CHECK (question_id IN (SELECT id FROM public.questionnaire_questions WHERE questionnaire_id IN (SELECT id FROM public.questionnaires WHERE owner_id = auth.uid())));

CREATE POLICY "Public view matrix rows" ON public.questionnaire_matrix_rows
FOR SELECT USING (question_id IN (SELECT id FROM public.questionnaire_questions WHERE questionnaire_id IN (SELECT id FROM public.questionnaires WHERE is_published = true)));

-- RLS: Responses
CREATE POLICY "Owner views responses" ON public.questionnaire_responses
FOR SELECT USING (questionnaire_id IN (SELECT id FROM public.questionnaires WHERE owner_id = auth.uid()));

CREATE POLICY "Anyone can submit responses" ON public.questionnaire_responses
FOR INSERT WITH CHECK (questionnaire_id IN (SELECT id FROM public.questionnaires WHERE is_published = true AND is_accepting_responses = true));

CREATE POLICY "Respondent views own response" ON public.questionnaire_responses
FOR SELECT USING (respondent_id = auth.uid());

-- RLS: Answers
CREATE POLICY "Owner views answers" ON public.questionnaire_answers
FOR SELECT USING (response_id IN (SELECT id FROM public.questionnaire_responses WHERE questionnaire_id IN (SELECT id FROM public.questionnaires WHERE owner_id = auth.uid())));

CREATE POLICY "Anyone can submit answers" ON public.questionnaire_answers
FOR INSERT WITH CHECK (response_id IN (SELECT id FROM public.questionnaire_responses WHERE questionnaire_id IN (SELECT id FROM public.questionnaires WHERE is_published = true AND is_accepting_responses = true)));

-- Indexes
CREATE INDEX idx_questionnaire_owner ON public.questionnaires(owner_id);
CREATE INDEX idx_questionnaire_token ON public.questionnaires(public_token);
CREATE INDEX idx_questions_questionnaire ON public.questionnaire_questions(questionnaire_id, order_index);
CREATE INDEX idx_options_question ON public.questionnaire_options(question_id, order_index);
CREATE INDEX idx_responses_questionnaire ON public.questionnaire_responses(questionnaire_id);
CREATE INDEX idx_answers_response ON public.questionnaire_answers(response_id);

-- Updated_at trigger
CREATE TRIGGER update_questionnaires_updated_at BEFORE UPDATE ON public.questionnaires
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questionnaire_questions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Also update workspace_documents check constraint to allow 'questionnaire' type
ALTER TABLE public.workspace_documents DROP CONSTRAINT IF EXISTS workspace_documents_document_type_check;
ALTER TABLE public.workspace_documents ADD CONSTRAINT workspace_documents_document_type_check 
CHECK (document_type IN ('text', 'spreadsheet', 'presentation', 'visual', 'whiteboard', 'questionnaire'));

-- Enable realtime for responses
ALTER PUBLICATION supabase_realtime ADD TABLE public.questionnaire_responses;
