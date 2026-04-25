-- =====================================================
-- Bulletin signatures (replace old signature workflow)
-- + relax formation_modules.semester (now optional)
-- Executed: 2026-04-25
-- =====================================================

-- 1) New table for bulletin signatures (per evaluation period)
CREATE TABLE IF NOT EXISTS public.bulletin_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id uuid NOT NULL REFERENCES public.evaluation_periods(id) ON DELETE CASCADE,
  signature_type text NOT NULL CHECK (signature_type IN ('pedagogue','jury','stamp')),
  name text,
  title text,
  signature_image text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(period_id, signature_type)
);

CREATE INDEX IF NOT EXISTS idx_bulletin_signatures_period ON public.bulletin_signatures(period_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.bulletin_signatures_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_bulletin_signatures_set_updated_at ON public.bulletin_signatures;
CREATE TRIGGER trg_bulletin_signatures_set_updated_at
  BEFORE UPDATE ON public.bulletin_signatures
  FOR EACH ROW EXECUTE FUNCTION public.bulletin_signatures_set_updated_at();

-- RLS
ALTER TABLE public.bulletin_signatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bulletin_signatures_select ON public.bulletin_signatures;
CREATE POLICY bulletin_signatures_select ON public.bulletin_signatures
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM public.evaluation_periods ep
      JOIN public.formations f ON f.id = ep.formation_id
      JOIN public.users u ON u.establishment_id = f.establishment_id
      WHERE ep.id = bulletin_signatures.period_id AND u.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS bulletin_signatures_write ON public.bulletin_signatures;
CREATE POLICY bulletin_signatures_write ON public.bulletin_signatures
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM public.evaluation_periods ep
      JOIN public.formations f ON f.id = ep.formation_id
      JOIN public.users u ON u.establishment_id = f.establishment_id
      WHERE ep.id = bulletin_signatures.period_id
        AND u.id = auth.uid()
        AND u.role IN ('AdminPrincipal','Admin','Formateur')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.evaluation_periods ep
      JOIN public.formations f ON f.id = ep.formation_id
      JOIN public.users u ON u.establishment_id = f.establishment_id
      WHERE ep.id = bulletin_signatures.period_id
        AND u.id = auth.uid()
        AND u.role IN ('AdminPrincipal','Admin','Formateur')
    )
  );

-- 2) Make formation_modules.semester optional (nullable)
ALTER TABLE public.formation_modules ALTER COLUMN semester DROP NOT NULL;

COMMENT ON TABLE public.bulletin_signatures IS 'Signatures et cachets attaches a une periode d evaluation pour les bulletins (pedagogue, jury, cachet)';
COMMENT ON COLUMN public.formation_modules.semester IS 'Optionnel: les modules ne sont plus rattaches a un semestre par defaut. Les periodes referencent les modules via period_modules.';
