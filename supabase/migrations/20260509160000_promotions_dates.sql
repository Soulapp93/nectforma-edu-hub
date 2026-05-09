-- Phase 3 follow-up: Promotions need their own start_date / end_date
-- (previously they inherited from the parent formation, which now represents only the program template).
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS end_date date;

-- Backfill existing promotions with the parent formation's dates as initial guess
UPDATE public.promotions p
SET start_date = COALESCE(p.start_date, f.start_date),
    end_date = COALESCE(p.end_date, f.end_date)
FROM public.formations f
WHERE p.formation_id = f.id
  AND (p.start_date IS NULL OR p.end_date IS NULL);
