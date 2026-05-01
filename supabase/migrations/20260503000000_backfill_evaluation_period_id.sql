-- =====================================================================
-- Backfill: assign period_id to legacy evaluations
-- =====================================================================
-- Strict period isolation requires every evaluation to be linked to
-- a specific evaluation_period. Legacy evaluations created before this
-- enforcement may have NULL period_id — they would then be invisible
-- under the new strict filter.
--
-- Strategy:
--   1. For each evaluation with NULL period_id, look up the module's
--      `semester` field
--   2. Find the matching period of the same formation whose name
--      contains that semester number ("Semestre 1", "S1", "1er", etc.)
--   3. Assign that period_id
--   4. If no match (no semester / no matching period), the evaluation
--      stays NULL — admins must reassign manually
-- =====================================================================

WITH legacy AS (
  SELECT e.id AS eval_id,
         fm.formation_id,
         fm.semester
    FROM public.evaluations e
    JOIN public.formation_modules fm ON fm.id = e.module_id
   WHERE e.period_id IS NULL
     AND fm.semester IS NOT NULL
), match_period AS (
  SELECT l.eval_id,
         (
           SELECT ep.id
             FROM public.evaluation_periods ep
            WHERE ep.formation_id = l.formation_id
              AND ep.is_composite = false
              AND ep.period_type = 'semestre'
              AND (
                ep.name ILIKE '%' || l.semester::text || '%'
                OR ep.order_index = l.semester::int
              )
            ORDER BY ep.order_index
            LIMIT 1
         ) AS period_id
    FROM legacy l
)
UPDATE public.evaluations e
   SET period_id = m.period_id
  FROM match_period m
 WHERE e.id = m.eval_id
   AND m.period_id IS NOT NULL
   AND e.period_id IS NULL;

-- Helpful diagnostic view: lists evaluations still without a period
CREATE OR REPLACE VIEW public.evaluations_without_period AS
SELECT e.id AS evaluation_id,
       e.title,
       e.evaluation_type,
       e.module_id,
       fm.title AS module_title,
       fm.semester AS module_semester,
       fm.formation_id,
       f.title AS formation_title
  FROM public.evaluations e
  JOIN public.formation_modules fm ON fm.id = e.module_id
  LEFT JOIN public.formations f ON f.id = fm.formation_id
 WHERE e.period_id IS NULL;

GRANT SELECT ON public.evaluations_without_period TO authenticated;
