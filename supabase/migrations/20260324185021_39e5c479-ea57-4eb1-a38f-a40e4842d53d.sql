
CREATE TABLE public.published_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id uuid NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  semester_number integer NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  published_by uuid NOT NULL,
  academic_year text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(formation_id, semester_number)
);

ALTER TABLE public.published_transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage published transcripts" ON public.published_transcripts
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
