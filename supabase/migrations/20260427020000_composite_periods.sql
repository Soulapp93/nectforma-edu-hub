-- =====================================================
-- Add support for "composite" / "final" bulletins
-- A composite period combines multiple existing periods
-- =====================================================

-- Add columns to evaluation_periods
ALTER TABLE public.evaluation_periods
  ADD COLUMN IF NOT EXISTS combined_period_ids uuid[] DEFAULT NULL;

ALTER TABLE public.evaluation_periods
  ADD COLUMN IF NOT EXISTS is_composite boolean NOT NULL DEFAULT false;

-- Index for querying composites
CREATE INDEX IF NOT EXISTS idx_evaluation_periods_composite
  ON public.evaluation_periods(formation_id, is_composite)
  WHERE is_composite = true;
