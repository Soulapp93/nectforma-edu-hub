-- ================================================
-- Migration: Add get_promotion_students RPC function
-- A promotion links to a formation, so we fetch
-- students from user_formation_assignments via the
-- promotion's formation_id.
-- ================================================

CREATE OR REPLACE FUNCTION public.get_promotion_students(promotion_id_param uuid)
RETURNS TABLE(
  user_id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  profile_photo_url text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_formation_id uuid;
BEGIN
  -- Auth obligatoire
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Récupérer la formation liée à la promotion
  SELECT p.formation_id INTO v_formation_id
  FROM public.promotions p
  WHERE p.id = promotion_id_param;

  IF v_formation_id IS NULL THEN
    RAISE EXCEPTION 'Promotion not found';
  END IF;

  -- Autorisation: Admin ou Formateur assigné
  IF NOT (
    public.is_current_user_admin()
    OR (
      public.get_current_user_role() = 'Formateur'
      AND EXISTS (
        SELECT 1
        FROM public.user_formation_assignments ufa
        WHERE ufa.formation_id = v_formation_id
          AND ufa.user_id = auth.uid()
      )
    )
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.profile_photo_url
  FROM public.user_formation_assignments ufa
  JOIN public.users u ON u.id = ufa.user_id
  WHERE ufa.formation_id = v_formation_id
    AND u.role = 'Étudiant'
  ORDER BY u.last_name, u.first_name;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.get_promotion_students(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_promotion_students(uuid) FROM anon;

COMMENT ON FUNCTION public.get_promotion_students IS 'Retourne les étudiants d''une promotion via la formation associée';
