
-- Create quiz_power_ups table for game power-ups
CREATE TABLE IF NOT EXISTS public.quiz_power_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.quiz_sessions(id) ON DELETE CASCADE NOT NULL,
  participant_id uuid REFERENCES public.quiz_participants(id) ON DELETE CASCADE NOT NULL,
  power_up_type text NOT NULL,
  used_at timestamp with time zone,
  target_participant_id uuid REFERENCES public.quiz_participants(id),
  question_index integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create leaderboard_history for tracking rankings over time
CREATE TABLE IF NOT EXISTS public.quiz_leaderboard_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.quiz_sessions(id) ON DELETE CASCADE NOT NULL,
  participant_id uuid REFERENCES public.quiz_participants(id) ON DELETE CASCADE NOT NULL,
  question_index integer NOT NULL,
  rank integer NOT NULL,
  score integer NOT NULL,
  streak integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS policies
ALTER TABLE public.quiz_power_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_leaderboard_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view power ups in their session" ON public.quiz_power_ups
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can use power ups" ON public.quiz_power_ups
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update power ups" ON public.quiz_power_ups
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can view leaderboard history" ON public.quiz_leaderboard_history
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert leaderboard history" ON public.quiz_leaderboard_history
  FOR INSERT TO authenticated WITH CHECK (true);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_power_ups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_leaderboard_history;
