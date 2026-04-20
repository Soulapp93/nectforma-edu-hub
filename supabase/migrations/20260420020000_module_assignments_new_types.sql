-- =====================================================
-- Extend module_assignments.assignment_type to support
-- the 8 new evaluation types.
-- Executed: 2026-04-20
-- =====================================================

-- 1) Migrate legacy values first so they match the new enum.
UPDATE public.module_assignments
SET assignment_type = 'devoir_maison'
WHERE assignment_type = 'devoir';

UPDATE public.module_assignments
SET assignment_type = 'examen_final'
WHERE assignment_type = 'evaluation';

-- 2) Drop the old CHECK constraint if present.
ALTER TABLE public.module_assignments
  DROP CONSTRAINT IF EXISTS module_assignments_assignment_type_check;

-- 3) Add the new CHECK with the 8 supported types.
ALTER TABLE public.module_assignments
  ADD CONSTRAINT module_assignments_assignment_type_check
  CHECK (assignment_type IN (
    'devoir_maison',
    'controle_continu',
    'devoir_surveille',
    'examen_blanc',
    'examen_final',
    'partiel',
    'rattrapage',
    'autre'
  ));

-- 4) Default value aligned with new enum.
ALTER TABLE public.module_assignments
  ALTER COLUMN assignment_type SET DEFAULT 'devoir_maison';

COMMENT ON COLUMN public.module_assignments.assignment_type IS
  'Type d''évaluation: devoir_maison | controle_continu | devoir_surveille | examen_blanc | examen_final | partiel | rattrapage | autre';
