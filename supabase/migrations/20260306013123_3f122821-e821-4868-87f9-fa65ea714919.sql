-- Fix RLS on questionnaire_responses (emails exposed)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'questionnaire_responses' AND schemaname = 'public' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.questionnaire_responses', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "questionnaire_responses_select_owner" ON public.questionnaire_responses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.questionnaires q
      WHERE q.id = questionnaire_responses.questionnaire_id
        AND q.owner_id = auth.uid()
    )
    OR public.is_current_user_admin()
  );

-- Secure the tutor_students_view
DROP VIEW IF EXISTS public.tutor_students_view;

CREATE VIEW public.tutor_students_view 
WITH (security_invoker = true)
AS
SELECT 
  tsa.id as assignment_id,
  tsa.tutor_id,
  tsa.student_id,
  tsa.is_active,
  u.first_name as student_first_name,
  u.last_name as student_last_name,
  u.email as student_email,
  t.first_name as tutor_first_name,
  t.last_name as tutor_last_name,
  t.email as tutor_email,
  t.establishment_id
FROM public.tutor_student_assignments tsa
JOIN public.users u ON u.id = tsa.student_id
JOIN public.tutors t ON t.id = tsa.tutor_id
WHERE tsa.is_active = true
  AND t.establishment_id = public.get_current_user_establishment();