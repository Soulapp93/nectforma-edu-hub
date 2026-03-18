-- Allow admins/instructors managing a sheet to read attendance links as well.
-- This is required because the client inserts links with `select('id, token, student_id')`
-- and PostgREST applies SELECT/RLS to the returned rows.

DROP POLICY IF EXISTS "Managers can read attendance links" ON public.attendance_student_links;

CREATE POLICY "Managers can read attendance links"
ON public.attendance_student_links
FOR SELECT
TO authenticated
USING (public.can_manage_attendance_student_links(attendance_sheet_id));