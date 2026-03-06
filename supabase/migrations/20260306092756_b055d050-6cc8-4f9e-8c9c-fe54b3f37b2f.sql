
-- BATCH 5: Fix remaining TO public policies

-- module_contents insert
DROP POLICY IF EXISTS "Module contents: insert" ON public.module_contents;
CREATE POLICY "Module contents: insert" ON public.module_contents FOR INSERT TO authenticated WITH CHECK (can_manage_module(module_id));

-- module_documents insert
DROP POLICY IF EXISTS "Module documents: insert" ON public.module_documents;
CREATE POLICY "Module documents: insert" ON public.module_documents FOR INSERT TO authenticated WITH CHECK (can_manage_module(module_id));

-- notifications create
DROP POLICY IF EXISTS "Create notifications" ON public.notifications;
CREATE POLICY "Create notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_current_user_admin());

-- social_analytics system insert (keep for service role)
DROP POLICY IF EXISTS "System inserts social analytics" ON public.social_analytics;
CREATE POLICY "System inserts social analytics" ON public.social_analytics FOR INSERT TO authenticated WITH CHECK (can_manage_blog());

-- social_publication_logs
DROP POLICY IF EXISTS "System inserts publication logs" ON public.social_publication_logs;
CREATE POLICY "System inserts publication logs" ON public.social_publication_logs FOR INSERT TO authenticated WITH CHECK (can_manage_blog());
DROP POLICY IF EXISTS "Blog managers view publication logs" ON public.social_publication_logs;
CREATE POLICY "Blog managers view publication logs" ON public.social_publication_logs FOR SELECT TO authenticated USING (can_manage_blog());

-- social_publishing_settings
DROP POLICY IF EXISTS "Super admins manage publishing settings" ON public.social_publishing_settings;
CREATE POLICY "Super admins manage publishing settings" ON public.social_publishing_settings FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

-- student_fees
DROP POLICY IF EXISTS "Admins manage student fees" ON public.student_fees;
CREATE POLICY "Admins manage student fees" ON public.student_fees FOR ALL TO authenticated USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());

-- submission_files
DROP POLICY IF EXISTS "Students manage own submission files" ON public.submission_files;
CREATE POLICY "Students manage own submission files" ON public.submission_files FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admins view submission files" ON public.submission_files;
CREATE POLICY "Admins view submission files" ON public.submission_files FOR SELECT TO authenticated USING (is_current_user_admin());

-- text_book_entries (old policies)
DROP POLICY IF EXISTS "Manage entries" ON public.text_book_entries;
-- text_book_entry_files
DROP POLICY IF EXISTS "Manage text book entry files" ON public.text_book_entry_files;
CREATE POLICY "Manage text book entry files" ON public.text_book_entry_files FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "View text book entry files" ON public.text_book_entry_files;
CREATE POLICY "View text book entry files" ON public.text_book_entry_files FOR SELECT TO authenticated USING (true);

-- text_books (old policy)
DROP POLICY IF EXISTS "Manage text books" ON public.text_books;

-- tutor_student_assignments (old duplicates)
DROP POLICY IF EXISTS "View own assignments" ON public.tutor_student_assignments;
DROP POLICY IF EXISTS "Admins manage assignments" ON public.tutor_student_assignments;

-- tutors (old policies)
DROP POLICY IF EXISTS "View own tutor profile" ON public.tutors;
DROP POLICY IF EXISTS "Update own tutor profile" ON public.tutors;

-- user_activation_tokens
DROP POLICY IF EXISTS "No direct access" ON public.user_activation_tokens;
CREATE POLICY "No direct access" ON public.user_activation_tokens FOR ALL TO authenticated USING (false);

-- user_formation_assignments (old duplicates)
DROP POLICY IF EXISTS "Admins manage formation assignments" ON public.user_formation_assignments;
DROP POLICY IF EXISTS "View formation assignments" ON public.user_formation_assignments;
