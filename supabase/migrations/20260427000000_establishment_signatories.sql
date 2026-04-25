-- =====================================================
-- Establishment Signatories (flexible custom signers)
-- Each establishment defines its own list of bulletin signers
-- (e.g., "Responsable pédagogique", "Directeur", "Cachet officiel"...)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.establishment_signatories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  role_label text NOT NULL,            -- e.g. "Responsable pédagogique"
  name text,                           -- person name (optional for stamps)
  signature_image text,                -- base64 dataURL or storage URL
  is_stamp boolean NOT NULL DEFAULT false,
  order_index int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_establishment_signatories_estab
  ON public.establishment_signatories(establishment_id);

CREATE OR REPLACE FUNCTION public.establishment_signatories_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_establishment_signatories_set_updated_at ON public.establishment_signatories;
CREATE TRIGGER trg_establishment_signatories_set_updated_at
  BEFORE UPDATE ON public.establishment_signatories
  FOR EACH ROW EXECUTE FUNCTION public.establishment_signatories_set_updated_at();

-- RLS
ALTER TABLE public.establishment_signatories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS establishment_signatories_select ON public.establishment_signatories;
CREATE POLICY establishment_signatories_select ON public.establishment_signatories
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.establishment_id = establishment_signatories.establishment_id
    )
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS establishment_signatories_write ON public.establishment_signatories;
CREATE POLICY establishment_signatories_write ON public.establishment_signatories
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.establishment_id = establishment_signatories.establishment_id
        AND u.role IN ('Admin','AdminPrincipal')
    )
    OR public.is_super_admin()
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.establishment_id = establishment_signatories.establishment_id
        AND u.role IN ('Admin','AdminPrincipal')
    )
    OR public.is_super_admin()
  );
