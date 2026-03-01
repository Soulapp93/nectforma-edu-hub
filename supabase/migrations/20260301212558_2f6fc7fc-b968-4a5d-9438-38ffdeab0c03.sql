
-- Fix overly permissive quiz_teams policy
DROP POLICY IF EXISTS "Session participants manage teams" ON public.quiz_teams;

CREATE POLICY "Host manages teams" ON public.quiz_teams
  FOR ALL USING (session_id IN (SELECT id FROM public.quiz_sessions WHERE host_id = auth.uid()))
  WITH CHECK (session_id IN (SELECT id FROM public.quiz_sessions WHERE host_id = auth.uid()));

CREATE POLICY "Participants view teams" ON public.quiz_teams
  FOR SELECT USING (session_id IN (
    SELECT session_id FROM public.quiz_participants WHERE user_id = auth.uid()
  ));
