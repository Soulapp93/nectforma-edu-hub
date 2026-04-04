-- Allow users to delete their own notifications
DROP POLICY IF EXISTS "Delete own notifications" ON public.notifications;
CREATE POLICY "Delete own notifications"
ON public.notifications
FOR DELETE
USING (user_id = auth.uid());

-- Enable realtime for notifications table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
