
-- Add academic_year column to formations table
ALTER TABLE public.formations ADD COLUMN IF NOT EXISTS academic_year text;

-- Create sub_modules table for sub-modules within modules
CREATE TABLE IF NOT EXISTS public.sub_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.formation_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  duration_hours integer NOT NULL DEFAULT 0,
  order_index integer NOT NULL DEFAULT 0,
  coefficient numeric NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on sub_modules
ALTER TABLE public.sub_modules ENABLE ROW LEVEL SECURITY;

-- RLS policies for sub_modules (same access as formation_modules via establishment)
CREATE POLICY "Authenticated users can view sub_modules"
ON public.sub_modules FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.formation_modules fm
    JOIN public.formations f ON f.id = fm.formation_id
    WHERE fm.id = sub_modules.module_id
    AND f.establishment_id = public.get_current_user_establishment()
  )
);

CREATE POLICY "Admins can manage sub_modules"
ON public.sub_modules FOR ALL TO authenticated
USING (
  public.is_current_user_admin() AND EXISTS (
    SELECT 1 FROM public.formation_modules fm
    JOIN public.formations f ON f.id = fm.formation_id
    WHERE fm.id = sub_modules.module_id
    AND f.establishment_id = public.get_current_user_establishment()
  )
)
WITH CHECK (
  public.is_current_user_admin() AND EXISTS (
    SELECT 1 FROM public.formation_modules fm
    JOIN public.formations f ON f.id = fm.formation_id
    WHERE fm.id = sub_modules.module_id
    AND f.establishment_id = public.get_current_user_establishment()
  )
);
