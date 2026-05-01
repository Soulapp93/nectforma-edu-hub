-- =====================================================================
-- Bulletin Configurations System
-- =====================================================================
-- Context: P1 from AUDIT_APPROFONDI_2026.md — enable each school to
-- fully configure its bulletins (rules, design, signatures) per period.
--
-- Hierarchy with inheritance:
--    establishment  →  formation  →  period
--    (each level can override any field of its parent)
-- =====================================================================

-- -----------------------------------
-- 1. Table definition
-- -----------------------------------
CREATE TABLE IF NOT EXISTS public.bulletin_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scoping (exactly one of the three FKs is set, except system templates)
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
  formation_id UUID REFERENCES public.formations(id) ON DELETE CASCADE,
  period_id UUID REFERENCES public.evaluation_periods(id) ON DELETE CASCADE,

  -- Metadata
  name TEXT NOT NULL,
  description TEXT,
  is_system_template BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- The 7 JSONB configuration blocks
  sources_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  calculation_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  layout_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  design_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  text_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  signatures_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  decision_rules JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Audit
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Integrity: a non-system-template must belong to exactly one scope
  CONSTRAINT bulletin_configurations_scope_check CHECK (
    is_system_template = TRUE
    OR (period_id IS NOT NULL)
    OR (formation_id IS NOT NULL AND period_id IS NULL)
    OR (establishment_id IS NOT NULL AND formation_id IS NULL AND period_id IS NULL)
  ),
  -- Uniqueness: at most one active config per scope
  CONSTRAINT bulletin_configurations_unique_period UNIQUE NULLS NOT DISTINCT (period_id),
  CONSTRAINT bulletin_configurations_unique_formation UNIQUE NULLS NOT DISTINCT (formation_id, period_id)
);

CREATE INDEX IF NOT EXISTS idx_bulletin_configurations_establishment ON public.bulletin_configurations(establishment_id);
CREATE INDEX IF NOT EXISTS idx_bulletin_configurations_formation ON public.bulletin_configurations(formation_id);
CREATE INDEX IF NOT EXISTS idx_bulletin_configurations_period ON public.bulletin_configurations(period_id);
CREATE INDEX IF NOT EXISTS idx_bulletin_configurations_template ON public.bulletin_configurations(is_system_template) WHERE is_system_template = TRUE;

COMMENT ON TABLE public.bulletin_configurations IS
  'Per-school / per-formation / per-period configuration for bulletin rendering. Resolved by cascade.';

-- -----------------------------------
-- 2. Keep updated_at fresh
-- -----------------------------------
CREATE OR REPLACE FUNCTION public.bulletin_configurations_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_bulletin_configurations_touch ON public.bulletin_configurations;
CREATE TRIGGER tg_bulletin_configurations_touch
  BEFORE UPDATE ON public.bulletin_configurations
  FOR EACH ROW EXECUTE FUNCTION public.bulletin_configurations_touch_updated_at();

-- -----------------------------------
-- 3. Cascade resolution function
-- -----------------------------------
-- Returns the merged config for a given period.
-- Merge order (later overrides earlier):
--   1. system template (BTS France default)
--   2. establishment config
--   3. formation config
--   4. period config
-- For JSONB blocks, we use `jsonb_strip_nulls(parent || child)` so the
-- child's non-null fields override the parent's.
CREATE OR REPLACE FUNCTION public.resolve_bulletin_config(period_id_param UUID)
RETURNS TABLE (
  sources_config JSONB,
  calculation_rules JSONB,
  layout_config JSONB,
  design_config JSONB,
  text_config JSONB,
  signatures_config JSONB,
  decision_rules JSONB,
  source_chain JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_formation_id UUID;
  v_establishment_id UUID;
  v_period_cfg RECORD;
  v_formation_cfg RECORD;
  v_establishment_cfg RECORD;
  v_template_cfg RECORD;
  v_chain JSONB := '[]'::jsonb;
BEGIN
  -- Look up formation + establishment from the period
  SELECT ep.formation_id, f.establishment_id
  INTO v_formation_id, v_establishment_id
  FROM public.evaluation_periods ep
  JOIN public.formations f ON f.id = ep.formation_id
  WHERE ep.id = period_id_param;

  IF v_formation_id IS NULL THEN
    RAISE EXCEPTION 'Period % not found or formation missing', period_id_param;
  END IF;

  -- Load the 4 levels in order (nullable rows)
  SELECT * INTO v_template_cfg
  FROM public.bulletin_configurations
  WHERE is_system_template = TRUE
    AND name = 'BTS France — Defaut systeme'
  LIMIT 1;

  SELECT * INTO v_establishment_cfg
  FROM public.bulletin_configurations
  WHERE establishment_id = v_establishment_id
    AND formation_id IS NULL
    AND period_id IS NULL
    AND is_active = TRUE
  LIMIT 1;

  SELECT * INTO v_formation_cfg
  FROM public.bulletin_configurations
  WHERE formation_id = v_formation_id
    AND period_id IS NULL
    AND is_active = TRUE
  LIMIT 1;

  SELECT * INTO v_period_cfg
  FROM public.bulletin_configurations
  WHERE period_id = period_id_param
    AND is_active = TRUE
  LIMIT 1;

  -- Build the source chain for debugging / display
  IF v_template_cfg IS NOT NULL THEN v_chain := v_chain || jsonb_build_object('level', 'template', 'id', v_template_cfg.id, 'name', v_template_cfg.name); END IF;
  IF v_establishment_cfg IS NOT NULL THEN v_chain := v_chain || jsonb_build_object('level', 'establishment', 'id', v_establishment_cfg.id, 'name', v_establishment_cfg.name); END IF;
  IF v_formation_cfg IS NOT NULL THEN v_chain := v_chain || jsonb_build_object('level', 'formation', 'id', v_formation_cfg.id, 'name', v_formation_cfg.name); END IF;
  IF v_period_cfg IS NOT NULL THEN v_chain := v_chain || jsonb_build_object('level', 'period', 'id', v_period_cfg.id, 'name', v_period_cfg.name); END IF;

  -- Cascade merge (child overrides parent)
  RETURN QUERY SELECT
    COALESCE(v_template_cfg.sources_config, '{}'::jsonb)
      || COALESCE(v_establishment_cfg.sources_config, '{}'::jsonb)
      || COALESCE(v_formation_cfg.sources_config, '{}'::jsonb)
      || COALESCE(v_period_cfg.sources_config, '{}'::jsonb) AS sources_config,

    COALESCE(v_template_cfg.calculation_rules, '{}'::jsonb)
      || COALESCE(v_establishment_cfg.calculation_rules, '{}'::jsonb)
      || COALESCE(v_formation_cfg.calculation_rules, '{}'::jsonb)
      || COALESCE(v_period_cfg.calculation_rules, '{}'::jsonb) AS calculation_rules,

    COALESCE(v_template_cfg.layout_config, '{}'::jsonb)
      || COALESCE(v_establishment_cfg.layout_config, '{}'::jsonb)
      || COALESCE(v_formation_cfg.layout_config, '{}'::jsonb)
      || COALESCE(v_period_cfg.layout_config, '{}'::jsonb) AS layout_config,

    COALESCE(v_template_cfg.design_config, '{}'::jsonb)
      || COALESCE(v_establishment_cfg.design_config, '{}'::jsonb)
      || COALESCE(v_formation_cfg.design_config, '{}'::jsonb)
      || COALESCE(v_period_cfg.design_config, '{}'::jsonb) AS design_config,

    COALESCE(v_template_cfg.text_config, '{}'::jsonb)
      || COALESCE(v_establishment_cfg.text_config, '{}'::jsonb)
      || COALESCE(v_formation_cfg.text_config, '{}'::jsonb)
      || COALESCE(v_period_cfg.text_config, '{}'::jsonb) AS text_config,

    COALESCE(v_template_cfg.signatures_config, '{}'::jsonb)
      || COALESCE(v_establishment_cfg.signatures_config, '{}'::jsonb)
      || COALESCE(v_formation_cfg.signatures_config, '{}'::jsonb)
      || COALESCE(v_period_cfg.signatures_config, '{}'::jsonb) AS signatures_config,

    COALESCE(v_template_cfg.decision_rules, '{}'::jsonb)
      || COALESCE(v_establishment_cfg.decision_rules, '{}'::jsonb)
      || COALESCE(v_formation_cfg.decision_rules, '{}'::jsonb)
      || COALESCE(v_period_cfg.decision_rules, '{}'::jsonb) AS decision_rules,

    v_chain;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_bulletin_config(UUID) TO authenticated;

-- -----------------------------------
-- 4. Row Level Security
-- -----------------------------------
ALTER TABLE public.bulletin_configurations ENABLE ROW LEVEL SECURITY;

-- System templates are readable by all authenticated users
CREATE POLICY "bulletin_configurations_templates_read"
  ON public.bulletin_configurations FOR SELECT TO authenticated
  USING (is_system_template = TRUE);

-- Establishment-scoped configs: read for members of the establishment
CREATE POLICY "bulletin_configurations_select_own_establishment"
  ON public.bulletin_configurations FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR establishment_id = public.get_current_user_establishment()
    OR EXISTS (
      SELECT 1 FROM public.formations f
      WHERE f.id = bulletin_configurations.formation_id
        AND f.establishment_id = public.get_current_user_establishment()
    )
    OR EXISTS (
      SELECT 1 FROM public.evaluation_periods ep
      JOIN public.formations f ON f.id = ep.formation_id
      WHERE ep.id = bulletin_configurations.period_id
        AND f.establishment_id = public.get_current_user_establishment()
    )
  );

-- Write: admins of the establishment only (super admin can manage everything)
CREATE POLICY "bulletin_configurations_admins_write"
  ON public.bulletin_configurations FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR (
      public.is_current_user_admin()
      AND (
        establishment_id = public.get_current_user_establishment()
        OR EXISTS (
          SELECT 1 FROM public.formations f
          WHERE f.id = bulletin_configurations.formation_id
            AND f.establishment_id = public.get_current_user_establishment()
        )
        OR EXISTS (
          SELECT 1 FROM public.evaluation_periods ep
          JOIN public.formations f ON f.id = ep.formation_id
          WHERE ep.id = bulletin_configurations.period_id
            AND f.establishment_id = public.get_current_user_establishment()
        )
      )
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      public.is_current_user_admin()
      AND is_system_template = FALSE
      AND (
        establishment_id = public.get_current_user_establishment()
        OR EXISTS (
          SELECT 1 FROM public.formations f
          WHERE f.id = bulletin_configurations.formation_id
            AND f.establishment_id = public.get_current_user_establishment()
        )
        OR EXISTS (
          SELECT 1 FROM public.evaluation_periods ep
          JOIN public.formations f ON f.id = ep.formation_id
          WHERE ep.id = bulletin_configurations.period_id
            AND f.establishment_id = public.get_current_user_establishment()
        )
      )
    )
  );

-- -----------------------------------
-- 5. Seed the 2 priority system templates
-- -----------------------------------
INSERT INTO public.bulletin_configurations (
  name, description, is_system_template,
  sources_config, calculation_rules, layout_config,
  design_config, text_config, signatures_config, decision_rules
) VALUES

-- Template 1: BTS France
(
  'BTS France — Defaut systeme',
  'Bulletin standard pour les ecoles de BTS en France. Semestres en CC + gestion du BTS blanc combinant CC et BTS blanc.',
  TRUE,
  -- sources_config
  jsonb_build_object(
    'included_types', jsonb_build_array('controle_continu', 'devoir_surveille', 'projet', 'oral', 'tp'),
    'combination_mode', 'weighted_average',
    'type_weights', jsonb_build_object(
      'controle_continu', 1,
      'devoir_surveille', 1,
      'projet', 1,
      'oral', 1,
      'tp', 1
    )
  ),
  -- calculation_rules
  jsonb_build_object(
    'module_average_method', 'weighted_by_coefficient',
    'general_average_method', 'weighted_by_module_coefficient',
    'compensation_allowed', true,
    'auto_rattrapage_threshold', 10,
    'eliminatory_note_threshold', null,
    'scale', 20,
    'rounding_decimals', 2
  ),
  -- layout_config
  jsonb_build_object(
    'sections', jsonb_build_object(
      'header', true,
      'student_identity', true,
      'grades_table', true,
      'general_average', true,
      'class_rank', true,
      'attendance', true,
      'general_appreciation', true,
      'decision', true,
      'signatures', true,
      'legal_notice', true
    ),
    'table_columns', jsonb_build_array('module', 'instructor', 'average', 'coefficient', 'appreciation'),
    'group_by_teaching_unit', false
  ),
  -- design_config
  jsonb_build_object(
    'primary_color', '#1a1a2e',
    'accent_color', '#c8a94e',
    'success_color', '#16a34a',
    'error_color', '#dc2626',
    'font_family', 'Times New Roman',
    'page_format', 'A4',
    'orientation', 'portrait',
    'logo_position', 'left',
    'watermark_enabled', false,
    'qr_code_enabled', true,
    'qr_code_position', 'bottom_right'
  ),
  -- text_config
  jsonb_build_object(
    'main_title', 'BULLETIN DE NOTES',
    'appreciation_ranges', jsonb_build_array(
      jsonb_build_object('min', 16, 'max', 20, 'text', 'Excellent. Tres bon travail, continuez ainsi.'),
      jsonb_build_object('min', 14, 'max', 16, 'text', 'Bien. Resultats satisfaisants.'),
      jsonb_build_object('min', 12, 'max', 14, 'text', 'Assez bien. Peut mieux faire.'),
      jsonb_build_object('min', 10, 'max', 12, 'text', 'Passable. Efforts a fournir.'),
      jsonb_build_object('min', 0, 'max', 10, 'text', 'Insuffisant. Travail serieux a revoir.')
    ),
    'legal_notice', 'Document officiel certifie authentique.'
  ),
  -- signatures_config
  jsonb_build_object(
    'signatories', jsonb_build_array(
      jsonb_build_object('role_label', 'Directeur pedagogique', 'required', true, 'order', 1),
      jsonb_build_object('role_label', 'Professeur principal', 'required', false, 'order', 2)
    ),
    'stamp_enabled', true,
    'stamp_position', 'center',
    'electronic_signature', false
  ),
  -- decision_rules
  jsonb_build_object(
    'admission_threshold', 10,
    'mentions', jsonb_build_array(
      jsonb_build_object('label', 'Tres bien', 'threshold', 16),
      jsonb_build_object('label', 'Bien', 'threshold', 14),
      jsonb_build_object('label', 'Assez bien', 'threshold', 12),
      jsonb_build_object('label', 'Passable', 'threshold', 10)
    ),
    'admitted_label', 'ADMIS(E)',
    'not_admitted_label', 'NON ADMIS(E)',
    'pending_label', 'EN COURS'
  )
),

-- Template 2: Licence universitaire
(
  'Licence universitaire (ECTS) — Defaut systeme',
  'Bulletin universitaire avec credits ECTS, regroupement par UE, compensation dans l''UE.',
  TRUE,
  -- sources_config
  jsonb_build_object(
    'included_types', jsonb_build_array('controle_continu', 'devoir_surveille', 'partiel', 'examen_final', 'projet', 'oral'),
    'combination_mode', 'weighted_average',
    'type_weights', jsonb_build_object(
      'controle_continu', 0.4,
      'partiel', 0.3,
      'examen_final', 0.3
    )
  ),
  -- calculation_rules
  jsonb_build_object(
    'module_average_method', 'weighted_by_coefficient',
    'general_average_method', 'weighted_by_ects',
    'compensation_allowed', true,
    'compensation_scope', 'teaching_unit_only',
    'auto_rattrapage_threshold', 10,
    'eliminatory_note_threshold', null,
    'scale', 20,
    'rounding_decimals', 2
  ),
  -- layout_config
  jsonb_build_object(
    'sections', jsonb_build_object(
      'header', true,
      'student_identity', true,
      'grades_table', true,
      'general_average', true,
      'class_rank', false,
      'attendance', true,
      'general_appreciation', true,
      'decision', true,
      'signatures', true,
      'legal_notice', true
    ),
    'table_columns', jsonb_build_array('module', 'instructor', 'average', 'coefficient', 'ects_credits', 'appreciation'),
    'group_by_teaching_unit', true
  ),
  -- design_config
  jsonb_build_object(
    'primary_color', '#2c3e50',
    'accent_color', '#3498db',
    'success_color', '#27ae60',
    'error_color', '#e74c3c',
    'font_family', 'Garamond',
    'page_format', 'A4',
    'orientation', 'portrait',
    'logo_position', 'left',
    'watermark_enabled', true,
    'watermark_text', 'DOCUMENT OFFICIEL',
    'qr_code_enabled', true,
    'qr_code_position', 'bottom_right'
  ),
  -- text_config
  jsonb_build_object(
    'main_title', 'RELEVE DE NOTES',
    'appreciation_ranges', jsonb_build_array(
      jsonb_build_object('min', 16, 'max', 20, 'text', 'Excellente maitrise des competences.'),
      jsonb_build_object('min', 14, 'max', 16, 'text', 'Bonne maitrise des competences.'),
      jsonb_build_object('min', 12, 'max', 14, 'text', 'Acquisition satisfaisante.'),
      jsonb_build_object('min', 10, 'max', 12, 'text', 'Acquisition partielle. A consolider.'),
      jsonb_build_object('min', 0, 'max', 10, 'text', 'Competences non acquises.')
    ),
    'legal_notice', 'Document officiel delivre conformement au reglement universitaire.'
  ),
  -- signatures_config
  jsonb_build_object(
    'signatories', jsonb_build_array(
      jsonb_build_object('role_label', 'Directeur d''UFR', 'required', true, 'order', 1),
      jsonb_build_object('role_label', 'Responsable de formation', 'required', true, 'order', 2)
    ),
    'stamp_enabled', true,
    'stamp_position', 'center',
    'electronic_signature', false
  ),
  -- decision_rules
  jsonb_build_object(
    'admission_threshold', 10,
    'mentions', jsonb_build_array(
      jsonb_build_object('label', 'Tres bien', 'threshold', 16),
      jsonb_build_object('label', 'Bien', 'threshold', 14),
      jsonb_build_object('label', 'Assez bien', 'threshold', 12),
      jsonb_build_object('label', 'Passable', 'threshold', 10)
    ),
    'admitted_label', 'VALIDE',
    'not_admitted_label', 'NON VALIDE',
    'pending_label', 'EN COURS'
  )
)
ON CONFLICT DO NOTHING;
