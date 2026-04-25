-- =====================================================
-- TRANSCRIPT TEMPLATES (bulletin layout templates)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.transcript_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name text NOT NULL,
  template_type text NOT NULL DEFAULT 'bulletin',
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  columns_config jsonb,
  header_config jsonb,
  footer_config jsonb,
  style_config jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transcript_templates_estab
  ON public.transcript_templates(establishment_id);

CREATE OR REPLACE FUNCTION public.transcript_templates_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_transcript_templates_set_updated_at ON public.transcript_templates;
CREATE TRIGGER trg_transcript_templates_set_updated_at
  BEFORE UPDATE ON public.transcript_templates
  FOR EACH ROW EXECUTE FUNCTION public.transcript_templates_set_updated_at();

-- Add link column on grading_rules if missing
ALTER TABLE public.grading_rules
  ADD COLUMN IF NOT EXISTS transcript_template_id uuid
  REFERENCES public.transcript_templates(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE public.transcript_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS transcript_templates_select ON public.transcript_templates;
CREATE POLICY transcript_templates_select ON public.transcript_templates
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.establishment_id = transcript_templates.establishment_id
    )
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS transcript_templates_write ON public.transcript_templates;
CREATE POLICY transcript_templates_write ON public.transcript_templates
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.establishment_id = transcript_templates.establishment_id
        AND u.role IN ('Admin','AdminPrincipal')
    )
    OR public.is_super_admin()
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.establishment_id = transcript_templates.establishment_id
        AND u.role IN ('Admin','AdminPrincipal')
    )
    OR public.is_super_admin()
  );
