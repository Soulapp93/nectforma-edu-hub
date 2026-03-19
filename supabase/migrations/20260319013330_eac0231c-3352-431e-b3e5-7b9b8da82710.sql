
ALTER TABLE public.establishments
ADD COLUMN IF NOT EXISTS theme_primary TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS theme_secondary TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS theme_sidebar TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS theme_background TEXT DEFAULT NULL;

COMMENT ON COLUMN public.establishments.theme_primary IS 'HSL primary color (e.g. "258 62% 35%")';
COMMENT ON COLUMN public.establishments.theme_secondary IS 'HSL secondary/accent color';
COMMENT ON COLUMN public.establishments.theme_sidebar IS 'HSL sidebar background color';
COMMENT ON COLUMN public.establishments.theme_background IS 'HSL page background color';
