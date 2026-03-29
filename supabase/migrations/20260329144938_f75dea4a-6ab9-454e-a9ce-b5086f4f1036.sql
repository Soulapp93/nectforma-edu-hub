
-- Table des groupes par module
CREATE TABLE public.module_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.formation_modules(id) ON DELETE CASCADE,
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des membres de groupe
CREATE TABLE public.module_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.module_groups(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, student_id)
);

-- Enable RLS
ALTER TABLE public.module_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_group_members ENABLE ROW LEVEL SECURITY;

-- RLS for module_groups
CREATE POLICY "Users can view groups of their establishment formations"
ON public.module_groups FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.formations f
    WHERE f.id = module_groups.formation_id
      AND f.establishment_id = public.get_current_user_establishment()
  )
);

CREATE POLICY "Admin and formateur can manage groups"
ON public.module_groups FOR ALL TO authenticated
USING (
  public.is_current_user_admin()
  OR (
    public.get_current_user_role() = 'Formateur'
    AND EXISTS (
      SELECT 1 FROM public.user_formation_assignments ufa
      WHERE ufa.formation_id = module_groups.formation_id AND ufa.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  public.is_current_user_admin()
  OR (
    public.get_current_user_role() = 'Formateur'
    AND EXISTS (
      SELECT 1 FROM public.user_formation_assignments ufa
      WHERE ufa.formation_id = module_groups.formation_id AND ufa.user_id = auth.uid()
    )
  )
);

-- RLS for module_group_members
CREATE POLICY "Users can view group members of their establishment"
ON public.module_group_members FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.module_groups mg
    JOIN public.formations f ON f.id = mg.formation_id
    WHERE mg.id = module_group_members.group_id
      AND f.establishment_id = public.get_current_user_establishment()
  )
);

CREATE POLICY "Admin and formateur can manage group members"
ON public.module_group_members FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.module_groups mg
    WHERE mg.id = module_group_members.group_id
      AND (
        public.is_current_user_admin()
        OR (
          public.get_current_user_role() = 'Formateur'
          AND EXISTS (
            SELECT 1 FROM public.user_formation_assignments ufa
            WHERE ufa.formation_id = mg.formation_id AND ufa.user_id = auth.uid()
          )
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.module_groups mg
    WHERE mg.id = module_group_members.group_id
      AND (
        public.is_current_user_admin()
        OR (
          public.get_current_user_role() = 'Formateur'
          AND EXISTS (
            SELECT 1 FROM public.user_formation_assignments ufa
            WHERE ufa.formation_id = mg.formation_id AND ufa.user_id = auth.uid()
          )
        )
      )
  )
);

-- Trigger updated_at
CREATE TRIGGER handle_module_groups_updated_at
  BEFORE UPDATE ON public.module_groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
