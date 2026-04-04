
-- =====================================================
-- ASSIGNMENT SYSTEM TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL,
    student_id UUID NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    content TEXT,
    status TEXT DEFAULT 'submitted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assignment_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.assignment_submissions(id) ON DELETE CASCADE,
    corrector_id UUID NOT NULL,
    grade NUMERIC,
    feedback TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students view own submissions" ON public.assignment_submissions;
CREATE POLICY "Students view own submissions"
ON public.assignment_submissions FOR SELECT
USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students create own submissions" ON public.assignment_submissions;
CREATE POLICY "Students create own submissions"
ON public.assignment_submissions FOR INSERT
WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Admins view all submissions" ON public.assignment_submissions;
CREATE POLICY "Admins view all submissions"
ON public.assignment_submissions FOR SELECT
USING (is_current_user_admin() OR get_current_user_role() = 'Formateur');

DROP POLICY IF EXISTS "Correctors manage own corrections" ON public.assignment_corrections;
CREATE POLICY "Correctors manage own corrections"
ON public.assignment_corrections FOR ALL
USING (corrected_by = auth.uid());

DROP POLICY IF EXISTS "Students view published corrections" ON public.assignment_corrections;
CREATE POLICY "Students view published corrections"
ON public.assignment_corrections FOR SELECT
USING (
    published_at IS NOT NULL
    AND submission_id IN (
        SELECT id FROM public.assignment_submissions WHERE student_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Admins view all corrections" ON public.assignment_corrections;
CREATE POLICY "Admins view all corrections"
ON public.assignment_corrections FOR SELECT
USING (is_current_user_admin());

DROP POLICY IF EXISTS "View chat attachments" ON public.chat_message_attachments;
CREATE POLICY "View chat attachments"
ON public.chat_message_attachments FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Create chat attachments" ON public.chat_message_attachments;
CREATE POLICY "Create chat attachments"
ON public.chat_message_attachments FOR INSERT
WITH CHECK (true);

DROP VIEW IF EXISTS public.tutor_students_view;
CREATE OR REPLACE VIEW public.tutor_students_view
WITH (security_invoker = on)
AS
SELECT
    tsa.id,
    tsa.tutor_id,
    tsa.student_id,
    tsa.is_active,
    tsa.assigned_at,
    u.first_name AS student_first_name,
    u.last_name AS student_last_name,
    u.email AS student_email,
    u.profile_photo_url AS student_photo
FROM public.tutor_student_assignments tsa
JOIN public.users u ON u.id = tsa.student_id;

DROP FUNCTION IF EXISTS public.get_tutor_apprentice_formations();
CREATE OR REPLACE FUNCTION public.get_tutor_apprentice_formations()
RETURNS TABLE (
    formation_id UUID,
    formation_title TEXT,
    formation_level TEXT,
    formation_status TEXT,
    student_id UUID,
    student_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id AS formation_id,
        f.title AS formation_title,
        f.level AS formation_level,
        f.status AS formation_status,
        u.id AS student_id,
        (u.first_name || ' ' || u.last_name) AS student_name
    FROM tutor_student_assignments tsa
    JOIN users u ON u.id = tsa.student_id
    JOIN user_formation_assignments ufa ON ufa.user_id = tsa.student_id
    JOIN formations f ON f.id = ufa.formation_id
    WHERE tsa.tutor_id = auth.uid()
    AND tsa.is_active = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tutor_apprentice_formations() TO authenticated;

DROP TRIGGER IF EXISTS handle_assignment_submissions_updated_at ON public.assignment_submissions;
CREATE TRIGGER handle_assignment_submissions_updated_at
    BEFORE UPDATE ON public.assignment_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_assignment_corrections_updated_at ON public.assignment_corrections;
CREATE TRIGGER handle_assignment_corrections_updated_at
    BEFORE UPDATE ON public.assignment_corrections
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
