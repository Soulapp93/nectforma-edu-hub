-- =====================================================
-- Add period_id support to published_transcripts
-- =====================================================

ALTER TABLE public.published_transcripts
  ADD COLUMN IF NOT EXISTS period_id uuid
  REFERENCES public.evaluation_periods(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_published_transcripts_period
  ON public.published_transcripts(period_id);

-- Allow unique publication per period (or per semester for legacy rows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'published_transcripts_formation_period_uniq'
  ) THEN
    CREATE UNIQUE INDEX published_transcripts_formation_period_uniq
      ON public.published_transcripts(formation_id, period_id)
      WHERE period_id IS NOT NULL;
  END IF;
END $$;
