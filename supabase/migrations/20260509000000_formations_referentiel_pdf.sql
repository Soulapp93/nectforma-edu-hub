-- Phase 1: Add referentiel PDF URL to formations
ALTER TABLE public.formations ADD COLUMN IF NOT EXISTS referentiel_pdf_url text;

-- Update formation_type CHECK to align with new app values (presentiel/foad/en_ligne in addition to legacy ones)
-- We don't drop existing constraints to avoid breaking old rows; instead we widen the allowed values.
-- The column already exists with default 'ecole_sup' (legacy). New rows will use 'presentiel'/'foad'/'en_ligne'.
-- No constraint update needed because the column has no CHECK constraint currently.
