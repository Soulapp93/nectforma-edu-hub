
-- Fix 1: Newsletter subscribers - restrict SELECT to super admins only
DROP POLICY IF EXISTS "Check own subscription by email" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Super admins view newsletter subscribers" ON public.newsletter_subscribers;

CREATE POLICY "Super admins view newsletter subscribers"
ON public.newsletter_subscribers
FOR SELECT
USING (is_super_admin());

-- Add is_private column to chat_groups if missing (was in CREATE TABLE IF NOT EXISTS that was skipped)
ALTER TABLE public.chat_groups ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Fix 2: Chat tables - replace permissive dev policies with proper ones

-- Drop old permissive policies if they exist
DROP POLICY IF EXISTS "Allow all for development - chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow all for development - chat_groups" ON public.chat_groups;
DROP POLICY IF EXISTS "Allow all for development - chat_group_members" ON public.chat_group_members;
DROP POLICY IF EXISTS "Allow all for development - chat_message_attachments" ON public.chat_message_attachments;

-- Chat Groups policies
DROP POLICY IF EXISTS "View establishment chat groups" ON public.chat_groups;
DROP POLICY IF EXISTS "Admins manage chat groups" ON public.chat_groups;
DROP POLICY IF EXISTS "Users create chat groups" ON public.chat_groups;
DROP POLICY IF EXISTS "Members create private groups" ON public.chat_groups;

CREATE POLICY "View establishment chat groups"
ON public.chat_groups
FOR SELECT
USING (establishment_id = get_current_user_establishment());

CREATE POLICY "Admins manage chat groups"
ON public.chat_groups
FOR ALL
USING (is_current_user_admin() AND establishment_id = get_current_user_establishment())
WITH CHECK (is_current_user_admin() AND establishment_id = get_current_user_establishment());

CREATE POLICY "Members create private groups"
ON public.chat_groups
FOR INSERT
WITH CHECK (
  establishment_id = get_current_user_establishment()
  AND (
    is_current_user_admin()
    OR (is_private = true AND created_by = auth.uid())
  )
);
