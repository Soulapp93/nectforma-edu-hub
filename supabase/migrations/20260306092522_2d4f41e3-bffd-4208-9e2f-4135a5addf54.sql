
-- BATCH 3 FIXED: Attendance, formations, schedules, chat

-- attendance_link_deliveries
DROP POLICY IF EXISTS "Admins can create attendance link deliveries" ON public.attendance_link_deliveries;
CREATE POLICY "Admins can create attendance link deliveries" ON public.attendance_link_deliveries FOR INSERT TO authenticated
  WITH CHECK (is_current_user_admin());
DROP POLICY IF EXISTS "Admins can delete attendance link deliveries" ON public.attendance_link_deliveries;
CREATE POLICY "Admins can delete attendance link deliveries" ON public.attendance_link_deliveries FOR DELETE TO authenticated
  USING (is_current_user_admin());
DROP POLICY IF EXISTS "Admins can update attendance link deliveries" ON public.attendance_link_deliveries;
CREATE POLICY "Admins can update attendance link deliveries" ON public.attendance_link_deliveries FOR UPDATE TO authenticated
  USING (is_current_user_admin());
DROP POLICY IF EXISTS "Admins can view attendance link deliveries" ON public.attendance_link_deliveries;
CREATE POLICY "Admins can view attendance link deliveries" ON public.attendance_link_deliveries FOR SELECT TO authenticated
  USING (is_current_user_admin());

-- attendance_sheets
DROP POLICY IF EXISTS "Admins manage sheets" ON public.attendance_sheets;
CREATE POLICY "Admins manage sheets" ON public.attendance_sheets FOR ALL TO authenticated
  USING (is_current_user_admin() AND formation_id IN (SELECT id FROM formations WHERE establishment_id = get_current_user_establishment()))
  WITH CHECK (is_current_user_admin() AND formation_id IN (SELECT id FROM formations WHERE establishment_id = get_current_user_establishment()));
DROP POLICY IF EXISTS "Instructors manage own sheets" ON public.attendance_sheets;
CREATE POLICY "Instructors manage own sheets" ON public.attendance_sheets FOR ALL TO authenticated
  USING (instructor_id = auth.uid()) WITH CHECK (instructor_id = auth.uid());
DROP POLICY IF EXISTS "Tutors view student sheets" ON public.attendance_sheets;
CREATE POLICY "Tutors view student sheets" ON public.attendance_sheets FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tutor_student_assignments tsa JOIN user_formation_assignments ufa ON ufa.user_id = tsa.student_id WHERE tsa.tutor_id = auth.uid() AND tsa.is_active = true AND ufa.formation_id = attendance_sheets.formation_id));
DROP POLICY IF EXISTS "View formation sheets" ON public.attendance_sheets;
CREATE POLICY "View formation sheets" ON public.attendance_sheets FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_formation_assignments ufa WHERE ufa.user_id = auth.uid() AND ufa.formation_id = attendance_sheets.formation_id));

-- attendance_signatures
DROP POLICY IF EXISTS "Admins manage signatures" ON public.attendance_signatures;
CREATE POLICY "Admins manage signatures" ON public.attendance_signatures FOR ALL TO authenticated
  USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());
DROP POLICY IF EXISTS "Create own signature" ON public.attendance_signatures;
CREATE POLICY "Create own signature" ON public.attendance_signatures FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Instructors view session signatures" ON public.attendance_signatures;
CREATE POLICY "Instructors view session signatures" ON public.attendance_signatures FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM attendance_sheets s WHERE s.id = attendance_signatures.attendance_sheet_id AND s.instructor_id = auth.uid()));
DROP POLICY IF EXISTS "Tutors view student signatures" ON public.attendance_signatures;
CREATE POLICY "Tutors view student signatures" ON public.attendance_signatures FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tutor_student_assignments tsa WHERE tsa.tutor_id = auth.uid() AND tsa.student_id = attendance_signatures.user_id AND tsa.is_active = true));
DROP POLICY IF EXISTS "View own signatures" ON public.attendance_signatures;
CREATE POLICY "View own signatures" ON public.attendance_signatures FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- formations
DROP POLICY IF EXISTS "Admins manage formations" ON public.formations;
CREATE POLICY "Admins manage formations" ON public.formations FOR ALL TO authenticated
  USING (establishment_id = get_current_user_establishment() AND is_current_user_admin())
  WITH CHECK (establishment_id = get_current_user_establishment() AND is_current_user_admin());
DROP POLICY IF EXISTS "Tutors view student formations" ON public.formations;
CREATE POLICY "Tutors view student formations" ON public.formations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tutor_student_assignments tsa JOIN user_formation_assignments ufa ON ufa.user_id = tsa.student_id WHERE tsa.tutor_id = auth.uid() AND tsa.is_active = true AND ufa.formation_id = formations.id));

-- formation_modules
DROP POLICY IF EXISTS "Admins manage modules" ON public.formation_modules;
CREATE POLICY "Admins manage modules" ON public.formation_modules FOR ALL TO authenticated
  USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());

-- establishments
DROP POLICY IF EXISTS "Admins update establishment" ON public.establishments;
CREATE POLICY "Admins update establishment" ON public.establishments FOR UPDATE TO authenticated
  USING (id = get_current_user_establishment() AND is_current_user_admin());
DROP POLICY IF EXISTS "Authenticated create establishments" ON public.establishments;
CREATE POLICY "Authenticated create establishments" ON public.establishments FOR INSERT TO authenticated
  WITH CHECK (true);
DROP POLICY IF EXISTS "View own establishment" ON public.establishments;
CREATE POLICY "View own establishment" ON public.establishments FOR SELECT TO authenticated
  USING (id = get_current_user_establishment());

-- schedules (uses formation_id, not establishment_id)
DROP POLICY IF EXISTS "Admins manage schedules" ON public.schedules;
CREATE POLICY "Admins manage schedules" ON public.schedules FOR ALL TO authenticated
  USING (is_current_user_admin() AND EXISTS (SELECT 1 FROM formations f WHERE f.id = schedules.formation_id AND f.establishment_id = get_current_user_establishment()))
  WITH CHECK (is_current_user_admin() AND EXISTS (SELECT 1 FROM formations f WHERE f.id = schedules.formation_id AND f.establishment_id = get_current_user_establishment()));
DROP POLICY IF EXISTS "Admins view all schedules" ON public.schedules;
CREATE POLICY "Admins view all schedules" ON public.schedules FOR SELECT TO authenticated
  USING (is_current_user_admin() AND EXISTS (SELECT 1 FROM formations f WHERE f.id = schedules.formation_id AND f.establishment_id = get_current_user_establishment()));
DROP POLICY IF EXISTS "Tutors view student schedules" ON public.schedules;
CREATE POLICY "Tutors view student schedules" ON public.schedules FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tutor_student_assignments tsa JOIN user_formation_assignments ufa ON ufa.user_id = tsa.student_id WHERE tsa.tutor_id = auth.uid() AND tsa.is_active = true AND ufa.formation_id = schedules.formation_id));
DROP POLICY IF EXISTS "Users view assigned formation schedules" ON public.schedules;
CREATE POLICY "Users view assigned formation schedules" ON public.schedules FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_formation_assignments ufa WHERE ufa.user_id = auth.uid() AND ufa.formation_id = schedules.formation_id));

-- schedule_slots (uses schedule_id -> schedules -> formation_id)
DROP POLICY IF EXISTS "Admins manage slots" ON public.schedule_slots;
CREATE POLICY "Admins manage slots" ON public.schedule_slots FOR ALL TO authenticated
  USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());
DROP POLICY IF EXISTS "Admins view all schedule slots" ON public.schedule_slots;
CREATE POLICY "Admins view all schedule slots" ON public.schedule_slots FOR SELECT TO authenticated
  USING (is_current_user_admin());
DROP POLICY IF EXISTS "Instructors view assigned slots" ON public.schedule_slots;
CREATE POLICY "Instructors view assigned slots" ON public.schedule_slots FOR SELECT TO authenticated
  USING (instructor_id = auth.uid());
DROP POLICY IF EXISTS "Tutors view student schedule slots" ON public.schedule_slots;
CREATE POLICY "Tutors view student schedule slots" ON public.schedule_slots FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM schedules s JOIN tutor_student_assignments tsa ON true JOIN user_formation_assignments ufa ON ufa.user_id = tsa.student_id WHERE s.id = schedule_slots.schedule_id AND tsa.tutor_id = auth.uid() AND tsa.is_active = true AND ufa.formation_id = s.formation_id));
DROP POLICY IF EXISTS "Users view assigned formation schedule slots" ON public.schedule_slots;
CREATE POLICY "Users view assigned formation schedule slots" ON public.schedule_slots FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM schedules s JOIN user_formation_assignments ufa ON ufa.formation_id = s.formation_id WHERE s.id = schedule_slots.schedule_id AND ufa.user_id = auth.uid()));
