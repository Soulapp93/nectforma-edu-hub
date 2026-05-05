-- Session 62: Add numero_ce and numero_ine to users for official transcript fields
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS numero_ce text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS numero_ine text;
