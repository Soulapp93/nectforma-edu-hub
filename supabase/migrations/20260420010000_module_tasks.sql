-- =====================================================
-- Module Tasks ("Travail a faire")
-- Simple tasks teachers can assign without needing
-- submission/correction (unlike module_assignments).
-- Executed: 2026-04-20
-- =====================================================

CREATE TABLE IF NOT EXISTS public.module_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.formation_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date timestamptz,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  attachment_url text,
  attachment_name text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_module_tasks_module_id ON public.module_tasks(module_id);
CREATE INDEX IF NOT EXISTS idx_module_tasks_due_date  ON public.module_tasks(due_date);

-- updated_at trigger (reuse existing trg_set_updated_at if present; else create)
CREATE OR REPLACE FUNCTION public.module_tasks_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_module_tasks_set_updated_at ON public.module_tasks;
CREATE TRIGGER trg_module_tasks_set_updated_at
  BEFORE UPDATE ON public.module_tasks
  FOR EACH ROW EXECUTE FUNCTION public.module_tasks_set_updated_at();

-- Enable RLS
ALTER TABLE public.module_tasks ENABLE ROW LEVEL SECURITY;

-- SELECT: any authenticated user of the establishment that owns the formation
DROP POLICY IF EXISTS module_tasks_select_members ON public.module_tasks;
CREATE POLICY module_tasks_select_members ON public.module_tasks
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM public.formation_modules fm
      JOIN public.formations f ON f.id = fm.formation_id
      JOIN public.users u ON u.establishment_id = f.establishment_id
      WHERE fm.id = module_tasks.module_id AND u.id = auth.uid()
    )
  );

-- INSERT/UPDATE/DELETE: AdminPrincipal, Admin, Formateur of the establishment
DROP POLICY IF EXISTS module_tasks_write_staff ON public.module_tasks;
CREATE POLICY module_tasks_write_staff ON public.module_tasks
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM public.formation_modules fm
      JOIN public.formations f ON f.id = fm.formation_id
      JOIN public.users u ON u.establishment_id = f.establishment_id
      WHERE fm.id = module_tasks.module_id
        AND u.id = auth.uid()
        AND u.role IN ('AdminPrincipal','Admin','Formateur')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.formation_modules fm
      JOIN public.formations f ON f.id = fm.formation_id
      JOIN public.users u ON u.establishment_id = f.establishment_id
      WHERE fm.id = module_tasks.module_id
        AND u.id = auth.uid()
        AND u.role IN ('AdminPrincipal','Admin','Formateur')
    )
  );

COMMENT ON TABLE public.module_tasks IS 'Simple tasks/homework assigned by teachers (no submission/correction flow)';
