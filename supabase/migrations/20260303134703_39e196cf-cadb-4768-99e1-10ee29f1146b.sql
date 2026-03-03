
-- Make user_id nullable for anonymous players
ALTER TABLE public.quiz_participants ALTER COLUMN user_id DROP NOT NULL;

-- Add anonymous_id column for unauthenticated players
ALTER TABLE public.quiz_participants ADD COLUMN IF NOT EXISTS anonymous_id text;
ALTER TABLE public.quiz_participants ADD COLUMN IF NOT EXISTS avatar_emoji text DEFAULT '😎';

-- Drop existing restrictive policies on quiz_participants
DROP POLICY IF EXISTS "Users manage own participation" ON public.quiz_participants;
DROP POLICY IF EXISTS "View session participants" ON public.quiz_participants;

-- New policies: allow anyone (including anon) to insert and view participants
CREATE POLICY "Anyone can join quiz sessions"
ON public.quiz_participants
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can view quiz participants"
ON public.quiz_participants
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can update own participation"
ON public.quiz_participants
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow anon to read active quiz sessions (for PIN lookup)
DROP POLICY IF EXISTS "Participants view active sessions" ON public.quiz_sessions;
CREATE POLICY "Anyone can view active sessions"
ON public.quiz_sessions
FOR SELECT
TO anon, authenticated
USING (status <> 'finished');

-- Allow anon to read quiz details for active sessions
CREATE POLICY "Anyone can view quizzes for active sessions"
ON public.quizzes
FOR SELECT
TO anon, authenticated
USING (true);
