-- Create chat_groups table (IF NOT EXISTS - may already exist)
CREATE TABLE IF NOT EXISTS public.chat_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.users(id),
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.chat_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    content TEXT,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system')),
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View establishment groups" ON public.chat_groups;
CREATE POLICY "View establishment groups"
ON public.chat_groups FOR SELECT
USING (establishment_id = get_current_user_establishment());

DROP POLICY IF EXISTS "Create groups" ON public.chat_groups;
CREATE POLICY "Create groups"
ON public.chat_groups FOR INSERT
WITH CHECK (establishment_id = get_current_user_establishment());

DROP POLICY IF EXISTS "Update own groups" ON public.chat_groups;
CREATE POLICY "Update own groups"
ON public.chat_groups FOR UPDATE
USING (created_by = auth.uid() OR is_current_user_admin());

DROP POLICY IF EXISTS "Delete own groups" ON public.chat_groups;
CREATE POLICY "Delete own groups"
ON public.chat_groups FOR DELETE
USING (created_by = auth.uid() OR is_current_user_admin());

DROP POLICY IF EXISTS "View group members" ON public.chat_group_members;
CREATE POLICY "View group members"
ON public.chat_group_members FOR SELECT
USING (group_id IN (
    SELECT id FROM public.chat_groups
    WHERE establishment_id = get_current_user_establishment()
));

DROP POLICY IF EXISTS "Manage group members" ON public.chat_group_members;
CREATE POLICY "Manage group members"
ON public.chat_group_members FOR ALL
USING (
    group_id IN (
        SELECT cgm.group_id FROM public.chat_group_members cgm
        WHERE cgm.user_id = auth.uid() AND cgm.role = 'admin'
    ) OR is_current_user_admin()
);

DROP POLICY IF EXISTS "Join groups" ON public.chat_group_members;
CREATE POLICY "Join groups"
ON public.chat_group_members FOR INSERT
WITH CHECK (user_id = auth.uid() OR is_current_user_admin());

DROP POLICY IF EXISTS "View group messages" ON public.chat_messages;
CREATE POLICY "View group messages"
ON public.chat_messages FOR SELECT
USING (group_id IN (
    SELECT group_id FROM public.chat_group_members
    WHERE user_id = auth.uid()
));

DROP POLICY IF EXISTS "Send messages" ON public.chat_messages;
CREATE POLICY "Send messages"
ON public.chat_messages FOR INSERT
WITH CHECK (
    sender_id = auth.uid() AND
    group_id IN (
        SELECT group_id FROM public.chat_group_members
        WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Edit own messages" ON public.chat_messages;
CREATE POLICY "Edit own messages"
ON public.chat_messages FOR UPDATE
USING (sender_id = auth.uid());

DROP POLICY IF EXISTS "Delete own messages" ON public.chat_messages;
CREATE POLICY "Delete own messages"
ON public.chat_messages FOR DELETE
USING (sender_id = auth.uid() OR is_current_user_admin());

-- Enable realtime (safe to run multiple times)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chat_groups_establishment ON public.chat_groups(establishment_id);
CREATE INDEX IF NOT EXISTS idx_chat_group_members_group ON public.chat_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_group_members_user ON public.chat_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_group ON public.chat_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at DESC);
