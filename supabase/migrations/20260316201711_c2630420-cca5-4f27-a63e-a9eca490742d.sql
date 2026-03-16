
-- 1. Add semesters_count to formations
ALTER TABLE public.formations ADD COLUMN IF NOT EXISTS semesters_count integer DEFAULT 2;

-- 2. Create promotions table
CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id uuid NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  name text NOT NULL,
  academic_year text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  capacity integer DEFAULT 30,
  status text DEFAULT 'active',
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Create student_promotion_assignments table
CREATE TABLE public.student_promotion_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  promotion_id uuid NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(student_id, promotion_id)
);

-- 4. Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_promotion_assignments ENABLE ROW LEVEL SECURITY;

-- 5. RLS for promotions
CREATE POLICY "Users can view promotions in their establishment"
ON public.promotions FOR SELECT TO authenticated
USING (establishment_id = public.get_current_user_establishment());

CREATE POLICY "Admins can insert promotions"
ON public.promotions FOR INSERT TO authenticated
WITH CHECK (public.is_current_user_admin() AND establishment_id = public.get_current_user_establishment());

CREATE POLICY "Admins can update promotions"
ON public.promotions FOR UPDATE TO authenticated
USING (public.is_current_user_admin() AND establishment_id = public.get_current_user_establishment())
WITH CHECK (public.is_current_user_admin() AND establishment_id = public.get_current_user_establishment());

CREATE POLICY "Admins can delete promotions"
ON public.promotions FOR DELETE TO authenticated
USING (public.is_current_user_admin() AND establishment_id = public.get_current_user_establishment());

-- 6. RLS for student_promotion_assignments
CREATE POLICY "Users can view student promotion assignments"
ON public.student_promotion_assignments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.promotions p
    WHERE p.id = promotion_id AND p.establishment_id = public.get_current_user_establishment()
  )
);

CREATE POLICY "Admins can insert student promotion assignments"
ON public.student_promotion_assignments FOR INSERT TO authenticated
WITH CHECK (
  public.is_current_user_admin() AND EXISTS (
    SELECT 1 FROM public.promotions p
    WHERE p.id = promotion_id AND p.establishment_id = public.get_current_user_establishment()
  )
);

CREATE POLICY "Admins can update student promotion assignments"
ON public.student_promotion_assignments FOR UPDATE TO authenticated
USING (
  public.is_current_user_admin() AND EXISTS (
    SELECT 1 FROM public.promotions p
    WHERE p.id = promotion_id AND p.establishment_id = public.get_current_user_establishment()
  )
);

CREATE POLICY "Admins can delete student promotion assignments"
ON public.student_promotion_assignments FOR DELETE TO authenticated
USING (
  public.is_current_user_admin() AND EXISTS (
    SELECT 1 FROM public.promotions p
    WHERE p.id = promotion_id AND p.establishment_id = public.get_current_user_establishment()
  )
);

-- 7. Add promotion_id to schedules
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS promotion_id uuid REFERENCES public.promotions(id) ON DELETE SET NULL;

-- 8. Add promotion_id to attendance_sheets
ALTER TABLE public.attendance_sheets ADD COLUMN IF NOT EXISTS promotion_id uuid REFERENCES public.promotions(id) ON DELETE SET NULL;

-- 9. Add promotion_id to evaluation_periods
ALTER TABLE public.evaluation_periods ADD COLUMN IF NOT EXISTS promotion_id uuid REFERENCES public.promotions(id) ON DELETE SET NULL;

-- 10. Updated_at trigger for promotions
CREATE TRIGGER set_promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 11. RPC function to get promotion students
CREATE OR REPLACE FUNCTION public.get_promotion_students(promotion_id_param uuid)
RETURNS TABLE(user_id uuid, first_name text, last_name text, email text, phone text, profile_photo_url text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.promotions p
    WHERE p.id = promotion_id_param
      AND p.establishment_id = public.get_current_user_establishment()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.profile_photo_url
  FROM public.student_promotion_assignments spa
  JOIN public.users u ON u.id = spa.student_id
  WHERE spa.promotion_id = promotion_id_param
    AND u.role = 'Étudiant'::public.user_role
  ORDER BY u.last_name, u.first_name;
END;
$$;

-- 12. Auto-migrate existing formations to promotions
INSERT INTO public.promotions (formation_id, name, academic_year, start_date, end_date, capacity, status, establishment_id)
SELECT 
  f.id,
  'Promotion ' || EXTRACT(YEAR FROM f.start_date)::text || '-' || EXTRACT(YEAR FROM f.end_date)::text,
  EXTRACT(YEAR FROM f.start_date)::text || '-' || EXTRACT(YEAR FROM f.end_date)::text,
  f.start_date,
  f.end_date,
  f.max_students,
  f.status,
  f.establishment_id
FROM public.formations f;

-- 13. Migrate student assignments to student_promotion_assignments
INSERT INTO public.student_promotion_assignments (student_id, promotion_id)
SELECT DISTINCT ufa.user_id, p.id
FROM public.user_formation_assignments ufa
JOIN public.users u ON u.id = ufa.user_id AND u.role = 'Étudiant'
JOIN public.promotions p ON p.formation_id = ufa.formation_id
ON CONFLICT DO NOTHING;

-- 14. Update schedules with promotion_id
UPDATE public.schedules s
SET promotion_id = p.id
FROM public.promotions p
WHERE p.formation_id = s.formation_id;

-- 15. Update attendance_sheets with promotion_id
UPDATE public.attendance_sheets a
SET promotion_id = p.id
FROM public.promotions p
WHERE p.formation_id = a.formation_id;

-- 16. Update evaluation_periods with promotion_id
UPDATE public.evaluation_periods ep
SET promotion_id = p.id
FROM public.promotions p
WHERE p.formation_id = ep.formation_id;
