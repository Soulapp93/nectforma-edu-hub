-- =====================================================
-- FIX: Remove duplicate establishment group triggers
-- Root cause: 3 triggers fire on establishments INSERT,
-- all trying to create the same chat_group, causing
-- unique constraint violation on idx_unique_establishment_group
-- =====================================================

-- Step 1: Drop ALL old triggers on establishments for chat group creation
DROP TRIGGER IF EXISTS on_establishment_created ON public.establishments;
DROP TRIGGER IF EXISTS create_establishment_group_trigger ON public.establishments;
DROP TRIGGER IF EXISTS trigger_auto_create_establishment_group ON public.establishments;

-- Step 2: Drop the old function (replaced by auto_create_establishment_group)
DROP FUNCTION IF EXISTS public.create_establishment_group() CASCADE;

-- Step 3: Replace auto_create_establishment_group with an idempotent version
CREATE OR REPLACE FUNCTION public.auto_create_establishment_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use ON CONFLICT to prevent duplicate group creation
  INSERT INTO public.chat_groups (establishment_id, name, group_type, description, is_private)
  VALUES (NEW.id, 'Général', 'establishment', 'Groupe de discussion de l''établissement', false)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Step 4: Recreate a single clean trigger
CREATE TRIGGER trigger_auto_create_establishment_group
  AFTER INSERT ON public.establishments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_establishment_group();

-- Step 5: Also extend establishments_type_check for new frontend values
ALTER TABLE public.establishments DROP CONSTRAINT IF EXISTS establishments_type_check;
ALTER TABLE public.establishments ADD CONSTRAINT establishments_type_check 
CHECK (type = ANY (ARRAY[
  'université'::text, 
  'école supérieure'::text, 
  'centre de formation'::text,
  'École supérieure'::text,
  'Centre de formation'::text,
  'Organisme de formation'::text,
  'Entreprise'::text,
  'Formateur indépendant'::text,
  'enseignement_superieur_prive'::text,
  'enseignement_superieur_public'::text,
  'organisme_formation'::text,
  'cfa'::text,
  'universite'::text,
  'autre'::text
]));
