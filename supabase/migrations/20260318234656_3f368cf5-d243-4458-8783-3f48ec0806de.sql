-- Secure helper to authorize attendance link management without relying on table RLS joins
CREATE OR REPLACE FUNCTION public.can_manage_attendance_student_links(_sheet_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_establishment_id uuid;
  v_instructor_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  SELECT f.establishment_id, ash.instructor_id
  INTO v_establishment_id, v_instructor_id
  FROM public.attendance_sheets ash
  JOIN public.formations f ON f.id = ash.formation_id
  WHERE ash.id = _sheet_id;

  IF v_establishment_id IS NULL THEN
    RETURN false;
  END IF;

  IF public.is_current_user_admin() AND v_establishment_id = public.get_current_user_establishment() THEN
    RETURN true;
  END IF;

  IF v_instructor_id = auth.uid() THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

DROP POLICY IF EXISTS "Admins can insert links" ON public.attendance_student_links;
DROP POLICY IF EXISTS "Instructors can insert links" ON public.attendance_student_links;
DROP POLICY IF EXISTS "Admins can update links" ON public.attendance_student_links;

CREATE POLICY "Managers can insert attendance links"
ON public.attendance_student_links
FOR INSERT
TO authenticated
WITH CHECK (public.can_manage_attendance_student_links(attendance_sheet_id));

CREATE POLICY "Managers can update attendance links"
ON public.attendance_student_links
FOR UPDATE
TO authenticated
USING (public.can_manage_attendance_student_links(attendance_sheet_id))
WITH CHECK (public.can_manage_attendance_student_links(attendance_sheet_id));

CREATE POLICY "Managers can delete attendance links"
ON public.attendance_student_links
FOR DELETE
TO authenticated
USING (public.can_manage_attendance_student_links(attendance_sheet_id));