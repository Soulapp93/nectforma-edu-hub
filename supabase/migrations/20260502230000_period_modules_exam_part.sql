-- Session 59: BTS Blanc Écrit/Oral support
-- Adds exam_part discriminator to period_modules so a BTS Blanc period can
-- reference the same matière twice (once as écrit, once as oral) with
-- independent coefficients.

ALTER TABLE public.period_modules
  ADD COLUMN IF NOT EXISTS exam_part text CHECK (exam_part IN ('ecrit','oral'));

-- Replace the old UNIQUE(period_id, module_id) with a composite uniqueness
-- that allows up to 2 rows per (period, module) when distinguished by part.
ALTER TABLE public.period_modules
  DROP CONSTRAINT IF EXISTS period_modules_period_id_module_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS period_modules_period_module_part_uidx
  ON public.period_modules (period_id, module_id, COALESCE(exam_part,'__main__'));
