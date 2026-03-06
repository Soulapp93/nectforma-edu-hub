-- Corriger accès tuteur + enrichir la RPC des formations tuteur

-- 1) Policies tuteur sur devoirs/corrections
DROP POLICY IF EXISTS "Tutors view apprentice submissions" ON public.assignment_submissions;
CREATE POLICY "Tutors view apprentice submissions"
ON public.assignment_submissions
FOR SELECT
TO authenticated
USING (
  public.get_current_user_role() = 'Tuteur'
  AND EXISTS (
    SELECT 1
    FROM public.tutor_student_assignments tsa
    WHERE tsa.tutor_id = auth.uid()
      AND tsa.student_id = assignment_submissions.student_id
      AND tsa.is_active = true
  )
  AND EXISTS (
    SELECT 1
    FROM public.module_assignments ma
    WHERE ma.id = assignment_submissions.assignment_id
      AND public.can_access_module(ma.module_id)
  )
);

DROP POLICY IF EXISTS "Tutors view apprentice published corrections" ON public.assignment_corrections;
CREATE POLICY "Tutors view apprentice published corrections"
ON public.assignment_corrections
FOR SELECT
TO authenticated
USING (
  published_at IS NOT NULL
  AND public.get_current_user_role() = 'Tuteur'
  AND EXISTS (
    SELECT 1
    FROM public.assignment_submissions s
    JOIN public.tutor_student_assignments tsa
      ON tsa.student_id = s.student_id
    JOIN public.module_assignments ma
      ON ma.id = s.assignment_id
    WHERE s.id = assignment_corrections.submission_id
      AND tsa.tutor_id = auth.uid()
      AND tsa.is_active = true
      AND public.can_access_module(ma.module_id)
  )
);

-- 2) Recréer la fonction avec une nouvelle signature de retour
DROP FUNCTION IF EXISTS public.get_tutor_apprentice_formations();

CREATE FUNCTION public.get_tutor_apprentice_formations()
RETURNS TABLE(
  formation_id uuid,
  formation_title text,
  formation_level text,
  formation_status text,
  formation_description text,
  formation_start_date date,
  formation_end_date date,
  formation_color text,
  formation_duration integer,
  modules_count integer,
  student_id uuid,
  student_first_name text,
  student_last_name text,
  student_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    f.id AS formation_id,
    f.title AS formation_title,
    f.level AS formation_level,
    f.status AS formation_status,
    f.description AS formation_description,
    f.start_date AS formation_start_date,
    f.end_date AS formation_end_date,
    f.color AS formation_color,
    f.duration AS formation_duration,
    COALESCE(COUNT(DISTINCT fm.id), 0)::integer AS modules_count,
    u.id AS student_id,
    u.first_name AS student_first_name,
    u.last_name AS student_last_name,
    u.email AS student_email
  FROM public.tutor_student_assignments tsa
  JOIN public.users u
    ON u.id = tsa.student_id
  JOIN public.user_formation_assignments ufa
    ON ufa.user_id = tsa.student_id
  JOIN public.formations f
    ON f.id = ufa.formation_id
  LEFT JOIN public.formation_modules fm
    ON fm.formation_id = f.id
  WHERE tsa.tutor_id = auth.uid()
    AND tsa.is_active = true
  GROUP BY
    f.id, f.title, f.level, f.status, f.description, f.start_date, f.end_date, f.color, f.duration,
    u.id, u.first_name, u.last_name, u.email
  ORDER BY f.start_date DESC, f.title ASC;
END;
$function$;