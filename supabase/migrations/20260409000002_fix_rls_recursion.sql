-- =====================================================
-- FIX: RLS infinite recursion on user_formation_assignments
-- Root cause: Circular references between policies on
-- user_formation_assignments, attendance_sheets, formations,
-- schedules, schedule_slots, and users tables.
-- Solution: SECURITY DEFINER functions to bypass RLS
-- in cross-table policy checks.
-- Executed: 2026-04-09
-- =====================================================

-- ============ HELPER FUNCTIONS (SECURITY DEFINER) ============

-- Check if user has a formation assignment (bypasses RLS)
CREATE OR REPLACE FUNCTION public.user_has_formation_assignment(p_user_id UUID, p_formation_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_formation_assignments WHERE user_id = p_user_id AND formation_id = p_formation_id);
$$;

-- Check if user is instructor for a formation via attendance
CREATE OR REPLACE FUNCTION public.user_is_instructor_for_attendance(p_user_id UUID, p_formation_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.attendance_sheets WHERE instructor_id = p_user_id AND formation_id = p_formation_id);
$$;

-- Get formation IDs for a user
CREATE OR REPLACE FUNCTION public.get_user_formation_ids(p_user_id UUID)
RETURNS SETOF UUID LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT formation_id FROM public.user_formation_assignments WHERE user_id = p_user_id;
$$;

-- Get tutor's student formation IDs
CREATE OR REPLACE FUNCTION public.get_tutor_student_formation_ids(p_tutor_id UUID)
RETURNS SETOF UUID LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT DISTINCT ufa.formation_id
  FROM public.user_formation_assignments ufa
  JOIN public.tutor_student_assignments tsa ON tsa.student_id = ufa.user_id
  WHERE tsa.tutor_id = p_tutor_id AND tsa.is_active = true;
$$;

-- Get establishment formation IDs
CREATE OR REPLACE FUNCTION public.get_establishment_formation_ids(p_establishment_id UUID)
RETURNS SETOF UUID LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT id FROM public.formations WHERE establishment_id = p_establishment_id;
$$;

-- Get all user IDs in same formations as a given user
CREATE OR REPLACE FUNCTION public.get_formation_user_ids(p_user_id UUID)
RETURNS SETOF UUID LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT DISTINCT ufa2.user_id
  FROM public.user_formation_assignments ufa1
  JOIN public.user_formation_assignments ufa2 ON ufa1.formation_id = ufa2.formation_id
  WHERE ufa1.user_id = p_user_id;
$$;

-- Get student IDs for an instructor
CREATE OR REPLACE FUNCTION public.get_instructor_student_ids(p_instructor_id UUID)
RETURNS SETOF UUID LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT DISTINCT ufa.user_id
  FROM public.user_formation_assignments ufa
  JOIN public.formation_modules fm ON fm.formation_id = ufa.formation_id
  JOIN public.module_instructors mi ON mi.module_id = fm.id
  WHERE mi.instructor_id = p_instructor_id;
$$;

-- ============ FIXED POLICIES ============

-- user_formation_assignments
DROP POLICY IF EXISTS "Instructors view assignments for their sessions" ON public.user_formation_assignments;
CREATE POLICY "Instructors view assignments for their sessions" ON public.user_formation_assignments
  FOR SELECT USING (user_is_instructor_for_attendance(auth.uid(), formation_id));

DROP POLICY IF EXISTS "Admins manage assignments" ON public.user_formation_assignments;
CREATE POLICY "Admins manage assignments" ON public.user_formation_assignments
  FOR ALL USING (is_current_user_admin() AND formation_id IN (SELECT get_establishment_formation_ids(get_current_user_establishment())))
  WITH CHECK (is_current_user_admin() AND formation_id IN (SELECT get_establishment_formation_ids(get_current_user_establishment())));

-- attendance_sheets
DROP POLICY IF EXISTS "View formation sheets" ON public.attendance_sheets;
CREATE POLICY "View formation sheets" ON public.attendance_sheets
  FOR SELECT USING (user_has_formation_assignment(auth.uid(), formation_id));

DROP POLICY IF EXISTS "Admins manage sheets" ON public.attendance_sheets;
CREATE POLICY "Admins manage sheets" ON public.attendance_sheets
  FOR ALL USING (is_current_user_admin() AND formation_id IN (SELECT get_establishment_formation_ids(get_current_user_establishment())));

DROP POLICY IF EXISTS "Tutors view student attendance sheets" ON public.attendance_sheets;
CREATE POLICY "Tutors view student attendance sheets" ON public.attendance_sheets
  FOR SELECT USING (formation_id IN (SELECT get_tutor_student_formation_ids(auth.uid())));

DROP POLICY IF EXISTS "Tutors view student sheets" ON public.attendance_sheets;
CREATE POLICY "Tutors view student sheets" ON public.attendance_sheets
  FOR SELECT USING (formation_id IN (SELECT get_tutor_student_formation_ids(auth.uid())));

-- formations
DROP POLICY IF EXISTS "Users view assigned formations" ON public.formations;
CREATE POLICY "Users view assigned formations" ON public.formations
  FOR SELECT USING ((NOT is_current_user_admin()) AND (get_current_user_role() <> 'Tuteur') AND (id IN (SELECT get_user_formation_ids(auth.uid()))));

DROP POLICY IF EXISTS "Tutors view student formations" ON public.formations;
CREATE POLICY "Tutors view student formations" ON public.formations
  FOR SELECT USING (id IN (SELECT get_tutor_student_formation_ids(auth.uid())));

-- schedules
DROP POLICY IF EXISTS "Users view assigned formation schedules" ON public.schedules;
CREATE POLICY "Users view assigned formation schedules" ON public.schedules
  FOR SELECT USING (user_has_formation_assignment(auth.uid(), formation_id));

DROP POLICY IF EXISTS "View formation schedules" ON public.schedules;
CREATE POLICY "View formation schedules" ON public.schedules
  FOR SELECT USING (formation_id IN (SELECT get_user_formation_ids(auth.uid())));

DROP POLICY IF EXISTS "Tutors view student schedules" ON public.schedules;
CREATE POLICY "Tutors view student schedules" ON public.schedules
  FOR SELECT USING (formation_id IN (SELECT get_tutor_student_formation_ids(auth.uid())));

-- schedule_slots
DROP POLICY IF EXISTS "Users view assigned formation schedule slots" ON public.schedule_slots;
CREATE POLICY "Users view assigned formation schedule slots" ON public.schedule_slots
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.schedules s WHERE s.id = schedule_slots.schedule_id AND user_has_formation_assignment(auth.uid(), s.formation_id)));

DROP POLICY IF EXISTS "View formation slots" ON public.schedule_slots;
CREATE POLICY "View formation slots" ON public.schedule_slots
  FOR SELECT USING (schedule_id IN (SELECT s.id FROM public.schedules s WHERE user_has_formation_assignment(auth.uid(), s.formation_id)));

DROP POLICY IF EXISTS "Tutors view student schedule slots" ON public.schedule_slots;
CREATE POLICY "Tutors view student schedule slots" ON public.schedule_slots
  FOR SELECT USING (schedule_id IN (SELECT s.id FROM public.schedules s WHERE s.formation_id IN (SELECT get_tutor_student_formation_ids(auth.uid()))));

DROP POLICY IF EXISTS "Tutors view student slots" ON public.schedule_slots;
CREATE POLICY "Tutors view student slots" ON public.schedule_slots
  FOR SELECT USING (schedule_id IN (SELECT s.id FROM public.schedules s WHERE s.formation_id IN (SELECT get_tutor_student_formation_ids(auth.uid()))));

-- users
DROP POLICY IF EXISTS "Students view classmates basic info" ON public.users;
CREATE POLICY "Students view classmates basic info" ON public.users
  FOR SELECT USING (get_current_user_role() = 'Étudiant' AND (id = auth.uid() OR id IN (SELECT get_formation_user_ids(auth.uid()))));

DROP POLICY IF EXISTS "Instructors view formation students" ON public.users;
CREATE POLICY "Instructors view formation students" ON public.users
  FOR SELECT USING (get_current_user_role() = 'Formateur' AND (id = auth.uid() OR id IN (SELECT get_instructor_student_ids(auth.uid()))));
