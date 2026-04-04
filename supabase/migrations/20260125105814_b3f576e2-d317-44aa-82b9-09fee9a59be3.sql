-- =====================================================
-- NECTFORMA - Skipped full schema recreation (tables/types already exist)
-- Only keeping new function definitions and policy rewrites
-- =====================================================

-- Update utility functions (all already exist, OR REPLACE is safe)
CREATE OR REPLACE FUNCTION public.get_current_user_establishment()
RETURNS UUID
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_establishment_id UUID;
BEGIN
  SELECT establishment_id INTO user_establishment_id FROM public.tutors WHERE id = auth.uid();
  IF user_establishment_id IS NULL THEN
    SELECT establishment_id INTO user_establishment_id FROM public.users WHERE id = auth.uid();
  END IF;
  RETURN user_establishment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM public.tutors WHERE id = auth.uid()) THEN
    RETURN 'Tuteur';
  END IF;
  SELECT role::TEXT INTO user_role FROM public.users WHERE id = auth.uid();
  RETURN user_role;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN get_current_user_role() IN ('Admin', 'AdminPrincipal');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT jsonb_build_object(
    'id', t.id, 'email', t.email, 'first_name', t.first_name, 'last_name', t.last_name,
    'phone', t.phone, 'profile_photo_url', t.profile_photo_url, 'role', 'Tuteur',
    'status', CASE WHEN t.is_activated THEN 'Actif' ELSE 'En attente' END,
    'establishment_id', t.establishment_id, 'is_activated', t.is_activated
  ) INTO v_result FROM tutors t WHERE t.id = v_user_id;

  IF v_result IS NOT NULL THEN RETURN v_result; END IF;

  SELECT jsonb_build_object(
    'id', u.id, 'email', u.email, 'first_name', u.first_name, 'last_name', u.last_name,
    'phone', u.phone, 'profile_photo_url', u.profile_photo_url, 'role', u.role,
    'status', u.status, 'establishment_id', u.establishment_id, 'is_activated', u.is_activated
  ) INTO v_result FROM users u WHERE u.id = v_user_id;

  RETURN COALESCE(v_result, jsonb_build_object('error', 'User not found'));
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_context()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_data JSONB;
  v_relation_data JSONB;
  v_establishment_data JSONB;
  v_role TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('error', 'Not authenticated'); END IF;

  SELECT jsonb_build_object(
    'id', t.id, 'email', t.email, 'first_name', t.first_name, 'last_name', t.last_name,
    'phone', t.phone, 'profile_photo_url', t.profile_photo_url, 'role', 'Tuteur',
    'company_name', t.company_name, 'position', t.position, 'establishment_id', t.establishment_id
  ) INTO v_user_data FROM tutors t WHERE t.id = v_user_id;

  IF v_user_data IS NOT NULL THEN
    v_role := 'Tuteur';
    SELECT jsonb_build_object('type', 'student', 'id', u.id, 'name', u.first_name || ' ' || u.last_name, 'email', u.email)
    INTO v_relation_data FROM tutor_student_assignments tsa JOIN users u ON u.id = tsa.student_id
    WHERE tsa.tutor_id = v_user_id AND tsa.is_active = true LIMIT 1;
  ELSE
    SELECT jsonb_build_object(
      'id', u.id, 'email', u.email, 'first_name', u.first_name, 'last_name', u.last_name,
      'phone', u.phone, 'profile_photo_url', u.profile_photo_url, 'role', u.role, 'establishment_id', u.establishment_id
    ) INTO v_user_data FROM users u WHERE u.id = v_user_id;

    IF v_user_data IS NOT NULL THEN
      v_role := v_user_data->>'role';
      IF v_role = 'Étudiant' THEN
        SELECT jsonb_build_object('type', 'tutor', 'id', t.id, 'name', t.first_name || ' ' || t.last_name,
          'email', t.email, 'company', t.company_name, 'position', t.position)
        INTO v_relation_data FROM tutor_student_assignments tsa JOIN tutors t ON t.id = tsa.tutor_id
        WHERE tsa.student_id = v_user_id AND tsa.is_active = true LIMIT 1;
      END IF;
    END IF;
  END IF;

  IF v_user_data IS NOT NULL AND v_user_data->>'establishment_id' IS NOT NULL THEN
    SELECT jsonb_build_object('id', e.id, 'name', e.name, 'logo_url', e.logo_url)
    INTO v_establishment_data FROM establishments e WHERE e.id = (v_user_data->>'establishment_id')::UUID;
  END IF;

  RETURN jsonb_build_object(
    'user', COALESCE(v_user_data, 'null'::JSONB),
    'relation', COALESCE(v_relation_data, 'null'::JSONB),
    'establishment', COALESCE(v_establishment_data, 'null'::JSONB),
    'role', v_role
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_establishment() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_context() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_current_user_establishment() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_current_user_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_profile() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_context() FROM anon;
