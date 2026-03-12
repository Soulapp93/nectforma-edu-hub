
-- =====================================================
-- GRADING SCALES - Barèmes configurables par établissement
-- =====================================================

CREATE TABLE IF NOT EXISTS public.grading_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scale_type TEXT NOT NULL DEFAULT 'numeric_20',
  max_value NUMERIC DEFAULT 20,
  passing_value NUMERIC DEFAULT 10,
  scale_levels JSONB DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add scale_id to grading_rules to link formation to a scale
ALTER TABLE public.grading_rules ADD COLUMN IF NOT EXISTS scale_id UUID REFERENCES public.grading_scales(id);

-- Add scale_id to evaluations so individual evaluations can override the formation scale
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS scale_type TEXT DEFAULT 'numeric_20';

-- =====================================================
-- TRANSCRIPT TEMPLATES - Modèles de relevés
-- =====================================================

CREATE TABLE IF NOT EXISTS public.transcript_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL DEFAULT 'standard',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  header_config JSONB DEFAULT '{}'::jsonb,
  columns_config JSONB DEFAULT '[]'::jsonb,
  footer_config JSONB DEFAULT '{}'::jsonb,
  style_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link formations to a transcript template
ALTER TABLE public.grading_rules ADD COLUMN IF NOT EXISTS transcript_template_id UUID REFERENCES public.transcript_templates(id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.grading_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcript_templates ENABLE ROW LEVEL SECURITY;

-- Grading scales: authenticated users of the establishment
CREATE POLICY "grading_scales_select" ON public.grading_scales
  FOR SELECT TO authenticated
  USING (establishment_id = public.get_current_user_establishment());

CREATE POLICY "grading_scales_insert" ON public.grading_scales
  FOR INSERT TO authenticated
  WITH CHECK (establishment_id = public.get_current_user_establishment() AND public.is_current_user_admin());

CREATE POLICY "grading_scales_update" ON public.grading_scales
  FOR UPDATE TO authenticated
  USING (establishment_id = public.get_current_user_establishment() AND public.is_current_user_admin());

CREATE POLICY "grading_scales_delete" ON public.grading_scales
  FOR DELETE TO authenticated
  USING (establishment_id = public.get_current_user_establishment() AND public.is_current_user_admin());

-- Transcript templates: same pattern
CREATE POLICY "transcript_templates_select" ON public.transcript_templates
  FOR SELECT TO authenticated
  USING (establishment_id = public.get_current_user_establishment());

CREATE POLICY "transcript_templates_insert" ON public.transcript_templates
  FOR INSERT TO authenticated
  WITH CHECK (establishment_id = public.get_current_user_establishment() AND public.is_current_user_admin());

CREATE POLICY "transcript_templates_update" ON public.transcript_templates
  FOR UPDATE TO authenticated
  USING (establishment_id = public.get_current_user_establishment() AND public.is_current_user_admin());

CREATE POLICY "transcript_templates_delete" ON public.transcript_templates
  FOR DELETE TO authenticated
  USING (establishment_id = public.get_current_user_establishment() AND public.is_current_user_admin());

-- Triggers for updated_at
CREATE TRIGGER handle_grading_scales_updated_at
  BEFORE UPDATE ON public.grading_scales
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_transcript_templates_updated_at
  BEFORE UPDATE ON public.transcript_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
