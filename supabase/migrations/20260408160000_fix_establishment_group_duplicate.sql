-- Fix the auto_create_establishment_group trigger to handle duplicates gracefully

CREATE OR REPLACE FUNCTION public.auto_create_establishment_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Créer le groupe établissement "Général" seulement s'il n'existe pas déjà
  -- Check if group already exists first
  IF NOT EXISTS (
    SELECT 1 FROM public.chat_groups 
    WHERE establishment_id = NEW.id AND group_type = 'establishment'
  ) THEN
    INSERT INTO public.chat_groups (establishment_id, name, group_type, description, is_private)
    VALUES (NEW.id, 'Général', 'establishment', 'Groupe de discussion de l''établissement', false);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Note: This fix ensures the trigger won't fail if a chat group already exists for the establishment
-- The trigger itself remains the same, only the function body changed
