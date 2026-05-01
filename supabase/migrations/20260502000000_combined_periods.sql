-- =====================================================================
-- Combined evaluation periods (re-enable and standardize)
-- =====================================================================
-- Brings back the "combined period" feature on top of the existing
-- bulletin_configurations system. A combined period:
--   * has period_type = 'combined'
--   * has is_composite = TRUE
--   * has combined_period_ids = [s1.id, s2.id, ...]
--   * stores its calculation rule + per-period weights in `composite_config`
--
-- The combined bulletin is rendered as a vertical stack of the source
-- periods' bulletins (each one keeping its own per-period config) plus
-- a final aggregated section governed by the combined period's own
-- `bulletin_configurations` entry.
-- =====================================================================

-- 1. Ensure required columns exist (idempotent)
ALTER TABLE public.evaluation_periods
  ADD COLUMN IF NOT EXISTS is_composite boolean NOT NULL DEFAULT false;

ALTER TABLE public.evaluation_periods
  ADD COLUMN IF NOT EXISTS combined_period_ids uuid[] DEFAULT NULL;

ALTER TABLE public.evaluation_periods
  ADD COLUMN IF NOT EXISTS composite_config jsonb DEFAULT NULL;

COMMENT ON COLUMN public.evaluation_periods.combined_period_ids IS
  'Source period IDs that this combined period aggregates (only set when is_composite=TRUE).';

COMMENT ON COLUMN public.evaluation_periods.composite_config IS
  'JSONB: { calculation_rule: "simple_average"|"weighted_average"|"weighted_by_coefficient", weights: {<period_id>: number}, custom_label?: string }';

-- 2. CHECK constraint to ensure consistency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'evaluation_periods_combined_consistency'
  ) THEN
    ALTER TABLE public.evaluation_periods
      ADD CONSTRAINT evaluation_periods_combined_consistency
      CHECK (
        (is_composite = FALSE AND combined_period_ids IS NULL)
        OR
        (is_composite = TRUE AND combined_period_ids IS NOT NULL AND array_length(combined_period_ids, 1) >= 1)
      );
  END IF;
END $$;

-- 3. Index to query composite periods quickly
CREATE INDEX IF NOT EXISTS idx_evaluation_periods_is_composite
  ON public.evaluation_periods(formation_id) WHERE is_composite = TRUE;

-- 4. RPC helper: list source periods for a combined period
CREATE OR REPLACE FUNCTION public.get_combined_source_periods(combined_period_id uuid)
RETURNS TABLE (
  id uuid,
  formation_id uuid,
  name text,
  period_type text,
  start_date date,
  end_date date,
  order_index integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ids uuid[];
BEGIN
  SELECT combined_period_ids INTO v_ids
  FROM public.evaluation_periods
  WHERE evaluation_periods.id = combined_period_id;

  IF v_ids IS NULL OR array_length(v_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT ep.id, ep.formation_id, ep.name, ep.period_type, ep.start_date, ep.end_date, ep.order_index
    FROM public.evaluation_periods ep
    WHERE ep.id = ANY(v_ids)
    ORDER BY ep.order_index;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_combined_source_periods(uuid) TO authenticated;
