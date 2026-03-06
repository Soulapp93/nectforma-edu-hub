
-- BATCH 1: Critical security tables (users, signatures, messages)

-- ==================== users ====================
DROP POLICY IF EXISTS "Admins manage users" ON public.users;
CREATE POLICY "Admins manage users" ON public.users FOR ALL TO authenticated
  USING (establishment_id = get_current_user_establishment() AND is_current_user_admin())
  WITH CHECK (establishment_id = get_current_user_establishment() AND is_current_user_admin());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "View establishment users" ON public.users;
CREATE POLICY "View establishment users" ON public.users FOR SELECT TO authenticated
  USING (establishment_id = get_current_user_establishment());

-- ==================== user_signatures ====================
DROP POLICY IF EXISTS "Manage own signature" ON public.user_signatures;
CREATE POLICY "Manage own signature" ON public.user_signatures FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ==================== messages ====================
DROP POLICY IF EXISTS "Messages: delete own" ON public.messages;
CREATE POLICY "Messages: delete own" ON public.messages FOR DELETE TO authenticated
  USING (sender_id = auth.uid());

DROP POLICY IF EXISTS "Messages: select if sender or recipient" ON public.messages;
CREATE POLICY "Messages: select if sender or recipient" ON public.messages FOR SELECT TO authenticated
  USING (can_access_message(id));

DROP POLICY IF EXISTS "Messages: update own" ON public.messages;
CREATE POLICY "Messages: update own" ON public.messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid());

-- ==================== message_attachments ====================
DROP POLICY IF EXISTS "Message attachments: delete by sender" ON public.message_attachments;
CREATE POLICY "Message attachments: delete by sender" ON public.message_attachments FOR DELETE TO authenticated
  USING (is_message_sender(message_id));

DROP POLICY IF EXISTS "Message attachments: select if can access message" ON public.message_attachments;
CREATE POLICY "Message attachments: select if can access message" ON public.message_attachments FOR SELECT TO authenticated
  USING (can_access_message(message_id));

-- ==================== message_recipients ====================
DROP POLICY IF EXISTS "Message recipients: delete by sender" ON public.message_recipients;
CREATE POLICY "Message recipients: delete by sender" ON public.message_recipients FOR DELETE TO authenticated
  USING (is_message_sender(message_id));

DROP POLICY IF EXISTS "Message recipients: select own or sender" ON public.message_recipients;
CREATE POLICY "Message recipients: select own or sender" ON public.message_recipients FOR SELECT TO authenticated
  USING (recipient_id = auth.uid() OR is_message_sender(message_id));

DROP POLICY IF EXISTS "Message recipients: update own" ON public.message_recipients;
CREATE POLICY "Message recipients: update own" ON public.message_recipients FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid());
