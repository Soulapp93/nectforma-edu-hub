
-- BATCH 4 FIXED

-- chat_group_members
DROP POLICY IF EXISTS "Admins manage group members" ON public.chat_group_members;
CREATE POLICY "Admins manage group members" ON public.chat_group_members FOR ALL TO authenticated USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());
DROP POLICY IF EXISTS "Users join establishment groups" ON public.chat_group_members;
CREATE POLICY "Users join establishment groups" ON public.chat_group_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "View establishment group members" ON public.chat_group_members;
CREATE POLICY "View establishment group members" ON public.chat_group_members FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM chat_groups cg WHERE cg.id = chat_group_members.group_id AND cg.establishment_id = get_current_user_establishment()));

-- chat_groups
DROP POLICY IF EXISTS "Admins manage chat groups" ON public.chat_groups;
CREATE POLICY "Admins manage chat groups" ON public.chat_groups FOR ALL TO authenticated
  USING (establishment_id = get_current_user_establishment() AND is_current_user_admin())
  WITH CHECK (establishment_id = get_current_user_establishment() AND is_current_user_admin());
DROP POLICY IF EXISTS "Create groups" ON public.chat_groups;
CREATE POLICY "Create groups" ON public.chat_groups FOR INSERT TO authenticated WITH CHECK (establishment_id = get_current_user_establishment());
DROP POLICY IF EXISTS "Delete own groups" ON public.chat_groups;
CREATE POLICY "Delete own groups" ON public.chat_groups FOR DELETE TO authenticated USING (created_by = auth.uid());
DROP POLICY IF EXISTS "Members create private groups" ON public.chat_groups;
CREATE POLICY "Members create private groups" ON public.chat_groups FOR INSERT TO authenticated WITH CHECK (establishment_id = get_current_user_establishment());
DROP POLICY IF EXISTS "Update own groups" ON public.chat_groups;
CREATE POLICY "Update own groups" ON public.chat_groups FOR UPDATE TO authenticated USING (created_by = auth.uid() OR is_current_user_admin());
DROP POLICY IF EXISTS "View establishment chat groups" ON public.chat_groups;
CREATE POLICY "View establishment chat groups" ON public.chat_groups FOR SELECT TO authenticated USING (establishment_id = get_current_user_establishment());
DROP POLICY IF EXISTS "View establishment groups" ON public.chat_groups;
CREATE POLICY "View establishment groups" ON public.chat_groups FOR SELECT TO authenticated USING (establishment_id = get_current_user_establishment());

-- chat_message_attachments
DROP POLICY IF EXISTS "Create chat attachments (members only)" ON public.chat_message_attachments;
CREATE POLICY "Create chat attachments (members only)" ON public.chat_message_attachments FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "View chat attachments (members only)" ON public.chat_message_attachments;
CREATE POLICY "View chat attachments (members only)" ON public.chat_message_attachments FOR SELECT TO authenticated USING (true);

-- chat_messages
DROP POLICY IF EXISTS "Delete own messages" ON public.chat_messages;
CREATE POLICY "Delete own messages" ON public.chat_messages FOR DELETE TO authenticated USING (sender_id = auth.uid() OR is_current_user_admin());
DROP POLICY IF EXISTS "Edit own messages" ON public.chat_messages;
CREATE POLICY "Edit own messages" ON public.chat_messages FOR UPDATE TO authenticated USING (sender_id = auth.uid());
DROP POLICY IF EXISTS "Send messages" ON public.chat_messages;
CREATE POLICY "Send messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
DROP POLICY IF EXISTS "View group messages" ON public.chat_messages;
CREATE POLICY "View group messages" ON public.chat_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM chat_group_members cgm WHERE cgm.group_id = chat_messages.group_id AND cgm.user_id = auth.uid()));

-- assignment_corrections
DROP POLICY IF EXISTS "Admins view all corrections" ON public.assignment_corrections;
CREATE POLICY "Admins view all corrections" ON public.assignment_corrections FOR SELECT TO authenticated USING (is_current_user_admin());
DROP POLICY IF EXISTS "Correctors manage own corrections" ON public.assignment_corrections;
CREATE POLICY "Correctors manage own corrections" ON public.assignment_corrections FOR ALL TO authenticated USING (corrected_by = auth.uid()) WITH CHECK (corrected_by = auth.uid());
DROP POLICY IF EXISTS "Students view published corrections" ON public.assignment_corrections;
CREATE POLICY "Students view published corrections" ON public.assignment_corrections FOR SELECT TO authenticated
  USING (published_at IS NOT NULL AND EXISTS (SELECT 1 FROM assignment_submissions s WHERE s.id = assignment_corrections.submission_id AND s.student_id = auth.uid()));

-- assignment_files
DROP POLICY IF EXISTS "Manage assignment files" ON public.assignment_files;
CREATE POLICY "Manage assignment files" ON public.assignment_files FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "View assignment files" ON public.assignment_files;
CREATE POLICY "View assignment files" ON public.assignment_files FOR SELECT TO authenticated USING (true);

-- assignment_submissions
DROP POLICY IF EXISTS "Admins view all submissions" ON public.assignment_submissions;
CREATE POLICY "Admins view all submissions" ON public.assignment_submissions FOR SELECT TO authenticated USING (is_current_user_admin());
DROP POLICY IF EXISTS "Students create own submissions" ON public.assignment_submissions;
CREATE POLICY "Students create own submissions" ON public.assignment_submissions FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
DROP POLICY IF EXISTS "Students view own submissions" ON public.assignment_submissions;
CREATE POLICY "Students view own submissions" ON public.assignment_submissions FOR SELECT TO authenticated USING (student_id = auth.uid());

-- modules
DROP POLICY IF EXISTS "Manage module assignments" ON public.module_assignments;
CREATE POLICY "Manage module assignments" ON public.module_assignments FOR ALL TO authenticated USING (can_manage_module(module_id)) WITH CHECK (can_manage_module(module_id));
DROP POLICY IF EXISTS "View module assignments" ON public.module_assignments;
CREATE POLICY "View module assignments" ON public.module_assignments FOR SELECT TO authenticated USING (can_access_module(module_id));
DROP POLICY IF EXISTS "Module contents: delete" ON public.module_contents;
CREATE POLICY "Module contents: delete" ON public.module_contents FOR DELETE TO authenticated USING (can_manage_module(module_id));
DROP POLICY IF EXISTS "Module contents: select" ON public.module_contents;
CREATE POLICY "Module contents: select" ON public.module_contents FOR SELECT TO authenticated USING (can_access_module(module_id));
DROP POLICY IF EXISTS "Module contents: update" ON public.module_contents;
CREATE POLICY "Module contents: update" ON public.module_contents FOR UPDATE TO authenticated USING (can_manage_module(module_id));
DROP POLICY IF EXISTS "Module documents: delete" ON public.module_documents;
CREATE POLICY "Module documents: delete" ON public.module_documents FOR DELETE TO authenticated USING (can_manage_module(module_id));
DROP POLICY IF EXISTS "Module documents: select" ON public.module_documents;
CREATE POLICY "Module documents: select" ON public.module_documents FOR SELECT TO authenticated USING (can_access_module(module_id));
DROP POLICY IF EXISTS "Module documents: update" ON public.module_documents;
CREATE POLICY "Module documents: update" ON public.module_documents FOR UPDATE TO authenticated USING (can_manage_module(module_id));
DROP POLICY IF EXISTS "Admins manage module instructors" ON public.module_instructors;
CREATE POLICY "Admins manage module instructors" ON public.module_instructors FOR ALL TO authenticated USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());
DROP POLICY IF EXISTS "Instructors view own assignments" ON public.module_instructors;
CREATE POLICY "Instructors view own assignments" ON public.module_instructors FOR SELECT TO authenticated USING (instructor_id = auth.uid());
DROP POLICY IF EXISTS "Tutors view student module instructors" ON public.module_instructors;
CREATE POLICY "Tutors view student module instructors" ON public.module_instructors FOR SELECT TO authenticated USING (can_access_module(module_id));
DROP POLICY IF EXISTS "Users view formation module instructors" ON public.module_instructors;
CREATE POLICY "Users view formation module instructors" ON public.module_instructors FOR SELECT TO authenticated USING (can_access_module(module_id));

-- notifications
DROP POLICY IF EXISTS "Delete own notifications" ON public.notifications;
CREATE POLICY "Delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Update own notifications" ON public.notifications;
CREATE POLICY "Update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "View own notifications" ON public.notifications;
CREATE POLICY "View own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());

-- tutors
DROP POLICY IF EXISTS "Admins manage tutors" ON public.tutors;
CREATE POLICY "Admins manage tutors" ON public.tutors FOR ALL TO authenticated
  USING (establishment_id = get_current_user_establishment() AND is_current_user_admin())
  WITH CHECK (establishment_id = get_current_user_establishment() AND is_current_user_admin());
DROP POLICY IF EXISTS "Tutors view own profile" ON public.tutors;
CREATE POLICY "Tutors view own profile" ON public.tutors FOR SELECT TO authenticated USING (id = auth.uid());
DROP POLICY IF EXISTS "Tutors update own profile" ON public.tutors;
CREATE POLICY "Tutors update own profile" ON public.tutors FOR UPDATE TO authenticated USING (id = auth.uid());
DROP POLICY IF EXISTS "Students view assigned tutor" ON public.tutors;
CREATE POLICY "Students view assigned tutor" ON public.tutors FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tutor_student_assignments tsa WHERE tsa.tutor_id = tutors.id AND tsa.student_id = auth.uid() AND tsa.is_active = true));

-- tutor_student_assignments
DROP POLICY IF EXISTS "Admins manage tutor assignments" ON public.tutor_student_assignments;
CREATE POLICY "Admins manage tutor assignments" ON public.tutor_student_assignments FOR ALL TO authenticated USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());
DROP POLICY IF EXISTS "Tutors view own assignments" ON public.tutor_student_assignments;
CREATE POLICY "Tutors view own assignments" ON public.tutor_student_assignments FOR SELECT TO authenticated USING (tutor_id = auth.uid());
DROP POLICY IF EXISTS "Students view own tutor assignment" ON public.tutor_student_assignments;
CREATE POLICY "Students view own tutor assignment" ON public.tutor_student_assignments FOR SELECT TO authenticated USING (student_id = auth.uid());

-- user_formation_assignments
DROP POLICY IF EXISTS "Admins manage assignments" ON public.user_formation_assignments;
CREATE POLICY "Admins manage assignments" ON public.user_formation_assignments FOR ALL TO authenticated USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());
DROP POLICY IF EXISTS "Tutors view student assignments" ON public.user_formation_assignments;
CREATE POLICY "Tutors view student assignments" ON public.user_formation_assignments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tutor_student_assignments tsa WHERE tsa.tutor_id = auth.uid() AND tsa.student_id = user_formation_assignments.user_id AND tsa.is_active = true));
DROP POLICY IF EXISTS "Users view own assignments" ON public.user_formation_assignments;
CREATE POLICY "Users view own assignments" ON public.user_formation_assignments FOR SELECT TO authenticated USING (user_id = auth.uid());

-- platform_user_roles
DROP POLICY IF EXISTS "Super admins manage platform roles" ON public.platform_user_roles;
CREATE POLICY "Super admins manage platform roles" ON public.platform_user_roles FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());
DROP POLICY IF EXISTS "Users view own platform roles" ON public.platform_user_roles;
CREATE POLICY "Users view own platform roles" ON public.platform_user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- social
DROP POLICY IF EXISTS "Blog managers view social analytics" ON public.social_analytics;
CREATE POLICY "Blog managers view social analytics" ON public.social_analytics FOR SELECT TO authenticated USING (can_manage_blog());
DROP POLICY IF EXISTS "Super admins manage social connections" ON public.social_media_connections;
CREATE POLICY "Super admins manage social connections" ON public.social_media_connections FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());
DROP POLICY IF EXISTS "Super admins manage social posts" ON public.social_posts;
CREATE POLICY "Super admins manage social posts" ON public.social_posts FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

-- text_books
DROP POLICY IF EXISTS "Admins manage text books" ON public.text_books;
CREATE POLICY "Admins manage text books" ON public.text_books FOR ALL TO authenticated USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());
DROP POLICY IF EXISTS "Tutors view student text books" ON public.text_books;
CREATE POLICY "Tutors view student text books" ON public.text_books FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tutor_student_assignments tsa JOIN user_formation_assignments ufa ON ufa.user_id = tsa.student_id WHERE tsa.tutor_id = auth.uid() AND tsa.is_active = true AND ufa.formation_id = text_books.formation_id));
DROP POLICY IF EXISTS "Users view assigned text books" ON public.text_books;
CREATE POLICY "Users view assigned text books" ON public.text_books FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_formation_assignments ufa WHERE ufa.user_id = auth.uid() AND ufa.formation_id = text_books.formation_id));
DROP POLICY IF EXISTS "Admins manage text book entries" ON public.text_book_entries;
CREATE POLICY "Admins manage text book entries" ON public.text_book_entries FOR ALL TO authenticated USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());
DROP POLICY IF EXISTS "Instructors manage own entries" ON public.text_book_entries;
CREATE POLICY "Instructors manage own entries" ON public.text_book_entries FOR ALL TO authenticated USING (instructor_id = auth.uid()) WITH CHECK (instructor_id = auth.uid());
DROP POLICY IF EXISTS "Users view text book entries" ON public.text_book_entries;
CREATE POLICY "Users view text book entries" ON public.text_book_entries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM text_books tb JOIN user_formation_assignments ufa ON ufa.formation_id = tb.formation_id WHERE tb.id = text_book_entries.text_book_id AND ufa.user_id = auth.uid()));

-- workspace
DROP POLICY IF EXISTS "Admins manage establishment folders" ON public.workspace_folders;
CREATE POLICY "Admins manage establishment folders" ON public.workspace_folders FOR ALL TO authenticated
  USING (establishment_id = get_current_user_establishment() AND is_current_user_admin())
  WITH CHECK (establishment_id = get_current_user_establishment() AND is_current_user_admin());
DROP POLICY IF EXISTS "Users manage own folders" ON public.workspace_folders;
CREATE POLICY "Users manage own folders" ON public.workspace_folders FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS "Users view establishment folders" ON public.workspace_folders;
CREATE POLICY "Users view establishment folders" ON public.workspace_folders FOR SELECT TO authenticated USING (establishment_id = get_current_user_establishment());
DROP POLICY IF EXISTS "Users manage own documents" ON public.workspace_documents;
CREATE POLICY "Users manage own documents" ON public.workspace_documents FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS "Users view shared documents" ON public.workspace_documents;
CREATE POLICY "Users view shared documents" ON public.workspace_documents FOR SELECT TO authenticated USING (is_document_shared_with_me(id) OR owner_id = auth.uid());
DROP POLICY IF EXISTS "Document owners manage shares" ON public.workspace_document_shares;
CREATE POLICY "Document owners manage shares" ON public.workspace_document_shares FOR ALL TO authenticated USING (is_document_owner(document_id)) WITH CHECK (is_document_owner(document_id));
DROP POLICY IF EXISTS "Shared users view own shares" ON public.workspace_document_shares;
CREATE POLICY "Shared users view own shares" ON public.workspace_document_shares FOR SELECT TO authenticated USING (shared_with_id = auth.uid());

-- quizzes (owner_id, not created_by)
DROP POLICY IF EXISTS "Users can update power ups" ON public.quiz_power_ups;
CREATE POLICY "Users can update power ups" ON public.quiz_power_ups FOR UPDATE TO authenticated USING (participant_id = auth.uid());
DROP POLICY IF EXISTS "Users can use power ups" ON public.quiz_power_ups;
CREATE POLICY "Users can use power ups" ON public.quiz_power_ups FOR INSERT TO authenticated WITH CHECK (participant_id = auth.uid());
DROP POLICY IF EXISTS "Users can view power ups in their session" ON public.quiz_power_ups;
CREATE POLICY "Users can view power ups in their session" ON public.quiz_power_ups FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Quiz owner manages questions" ON public.quiz_questions;
CREATE POLICY "Quiz owner manages questions" ON public.quiz_questions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM quizzes q WHERE q.id = quiz_questions.quiz_id AND q.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM quizzes q WHERE q.id = quiz_questions.quiz_id AND q.owner_id = auth.uid()));
DROP POLICY IF EXISTS "View questions of published quizzes" ON public.quiz_questions;
CREATE POLICY "View questions of published quizzes" ON public.quiz_questions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Host views all answers" ON public.quiz_answers;
CREATE POLICY "Host views all answers" ON public.quiz_answers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users manage own answers" ON public.quiz_answers;
CREATE POLICY "Users manage own answers" ON public.quiz_answers FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Users can view leaderboard history" ON public.quiz_leaderboard_history;
CREATE POLICY "Users can view leaderboard history" ON public.quiz_leaderboard_history FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert leaderboard history" ON public.quiz_leaderboard_history;
CREATE POLICY "Users can insert leaderboard history" ON public.quiz_leaderboard_history FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Host manages sessions" ON public.quiz_sessions;
CREATE POLICY "Host manages sessions" ON public.quiz_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Host manages teams" ON public.quiz_teams;
CREATE POLICY "Host manages teams" ON public.quiz_teams FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Participants view teams" ON public.quiz_teams;
CREATE POLICY "Participants view teams" ON public.quiz_teams FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users manage own quizzes" ON public.quizzes;
CREATE POLICY "Users manage own quizzes" ON public.quizzes FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS "View published quizzes in establishment" ON public.quizzes;
CREATE POLICY "View published quizzes in establishment" ON public.quizzes FOR SELECT TO authenticated USING (establishment_id = get_current_user_establishment());

-- questionnaires
DROP POLICY IF EXISTS "Owner manages matrix rows" ON public.questionnaire_matrix_rows;
CREATE POLICY "Owner manages matrix rows" ON public.questionnaire_matrix_rows FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Owner manages options" ON public.questionnaire_options;
CREATE POLICY "Owner manages options" ON public.questionnaire_options FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Owner manages questions" ON public.questionnaire_questions;
CREATE POLICY "Owner manages questions" ON public.questionnaire_questions FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Owner manages sections" ON public.questionnaire_sections;
CREATE POLICY "Owner manages sections" ON public.questionnaire_sections FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Users manage own questionnaires" ON public.questionnaires;
CREATE POLICY "Users manage own questionnaires" ON public.questionnaires FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS "Owner views answers" ON public.questionnaire_answers;
CREATE POLICY "Owner views answers" ON public.questionnaire_answers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "questionnaire_responses_select_owner" ON public.questionnaire_responses;
CREATE POLICY "questionnaire_responses_select_owner" ON public.questionnaire_responses FOR SELECT TO authenticated USING (true);

-- blog admin
DROP POLICY IF EXISTS "Admins manage all posts" ON public.blog_posts;
CREATE POLICY "Admins manage all posts" ON public.blog_posts FOR ALL TO authenticated USING (can_manage_blog()) WITH CHECK (can_manage_blog());
DROP POLICY IF EXISTS "Admins manage categories" ON public.blog_categories;
CREATE POLICY "Admins manage categories" ON public.blog_categories FOR ALL TO authenticated USING (can_manage_blog()) WITH CHECK (can_manage_blog());
DROP POLICY IF EXISTS "Admins manage tags" ON public.blog_tags;
CREATE POLICY "Admins manage tags" ON public.blog_tags FOR ALL TO authenticated USING (can_manage_blog()) WITH CHECK (can_manage_blog());
DROP POLICY IF EXISTS "Admins manage post tags" ON public.blog_post_tags;
CREATE POLICY "Admins manage post tags" ON public.blog_post_tags FOR ALL TO authenticated USING (can_manage_blog()) WITH CHECK (can_manage_blog());
DROP POLICY IF EXISTS "Admins view analytics" ON public.blog_analytics;
CREATE POLICY "Admins view analytics" ON public.blog_analytics FOR SELECT TO authenticated USING (can_manage_blog());
DROP POLICY IF EXISTS "Super admins manage newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Super admins manage newsletter subscribers" ON public.newsletter_subscribers FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());
DROP POLICY IF EXISTS "Super admins view newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Super admins view newsletter subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (is_super_admin());

-- ai_autopilot_runs
DROP POLICY IF EXISTS "Super admins manage autopilot runs" ON public.ai_autopilot_runs;
CREATE POLICY "Super admins manage autopilot runs" ON public.ai_autopilot_runs FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());
