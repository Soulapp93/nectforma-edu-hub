-- Enable realtime for attendance_signatures table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'attendance_signatures'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_signatures;
  END IF;
END $$;
