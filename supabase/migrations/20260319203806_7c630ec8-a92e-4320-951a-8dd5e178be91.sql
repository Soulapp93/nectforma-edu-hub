
ALTER TABLE public.formations ADD COLUMN IF NOT EXISTS duration_years integer NOT NULL DEFAULT 1;

ALTER TABLE public.formation_modules ADD COLUMN IF NOT EXISTS semester integer;
