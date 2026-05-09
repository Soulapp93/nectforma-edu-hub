-- Phase 3: Backfill promotions for legacy formations that don't have one yet.
-- For each formation without any row in `promotions`, create the matching promotion
-- with academic year + dates inferred from the formation row, then create the linked
-- schedule and text_book (idempotent: ON CONFLICT DO NOTHING via NOT EXISTS guards).

DO $$
DECLARE
  f RECORD;
  new_promo_id uuid;
  yr_start int;
  yr_end int;
  new_name text;
BEGIN
  FOR f IN
    SELECT *
    FROM public.formations
    WHERE NOT EXISTS (SELECT 1 FROM public.promotions p WHERE p.formation_id = formations.id)
  LOOP
    -- Parse academic_year ('2026-2027') into integer years; fall back to start_date year.
    BEGIN
      yr_start := COALESCE(NULLIF(split_part(f.academic_year, '-', 1), '')::int,
                           EXTRACT(YEAR FROM f.start_date)::int);
      yr_end   := COALESCE(NULLIF(split_part(f.academic_year, '-', 2), '')::int,
                           yr_start + COALESCE(f.duration_years, 1));
    EXCEPTION WHEN OTHERS THEN
      yr_start := EXTRACT(YEAR FROM f.start_date)::int;
      yr_end   := yr_start + COALESCE(f.duration_years, 1);
    END;

    new_name := f.title || ' ' || COALESCE(f.academic_year, yr_start || '-' || yr_end);

    INSERT INTO public.promotions (formation_id, establishment_id, name, academic_year_start, academic_year_end, is_active)
    VALUES (f.id, f.establishment_id, new_name, yr_start, yr_end, true)
    RETURNING id INTO new_promo_id;

    -- Link a schedule if the formation has none with a promotion_id
    IF NOT EXISTS (SELECT 1 FROM public.schedules s WHERE s.formation_id = f.id AND s.promotion_id = new_promo_id) THEN
      INSERT INTO public.schedules (formation_id, promotion_id, title)
      VALUES (f.id, new_promo_id, 'Emploi du temps - ' || new_name);
    END IF;

    -- Link a text_book if the formation has none with a promotion_id
    IF NOT EXISTS (SELECT 1 FROM public.text_books tb WHERE tb.formation_id = f.id AND tb.promotion_id = new_promo_id) THEN
      INSERT INTO public.text_books (formation_id, promotion_id, title, academic_year)
      VALUES (f.id, new_promo_id, 'Cahier de texte - ' || new_name, COALESCE(f.academic_year, yr_start || '-' || yr_end));
    END IF;

    RAISE NOTICE 'Backfilled promotion for formation %: % (% to %)', f.id, new_name, yr_start, yr_end;
  END LOOP;
END $$;

-- Also backfill: existing schedules / text_books that are NOT linked to a promotion
-- but whose formation now has a promotion → link them (orphan resources).
UPDATE public.schedules s
SET promotion_id = p.id
FROM public.promotions p
WHERE s.formation_id = p.formation_id
  AND s.promotion_id IS NULL;

UPDATE public.text_books tb
SET promotion_id = p.id
FROM public.promotions p
WHERE tb.formation_id = p.formation_id
  AND tb.promotion_id IS NULL;
