
-- =====================================================
-- MODULE NOTES & ÉVALUATIONS - SCHÉMA COMPLET
-- =====================================================

-- 1. Unités d'enseignement (optionnel, regroupement de modules)
CREATE TABLE public.teaching_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  code TEXT,
  coefficient NUMERIC(5,2) NOT NULL DEFAULT 1,
  credits NUMERIC(5,1) DEFAULT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lien module -> UE (optionnel)
ALTER TABLE public.formation_modules 
  ADD COLUMN IF NOT EXISTS teaching_unit_id UUID REFERENCES public.teaching_units(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS coefficient NUMERIC(5,2) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS credits NUMERIC(5,1) DEFAULT NULL;

-- 2. Périodes d'évaluation (configurable)
CREATE TABLE public.evaluation_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'semestre', -- semestre, trimestre, annee, bloc, custom
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  locked_at TIMESTAMPTZ,
  locked_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Évaluations
CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.formation_modules(id) ON DELETE CASCADE,
  period_id UUID REFERENCES public.evaluation_periods(id) ON DELETE SET NULL,
  instructor_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  evaluation_date DATE,
  evaluation_type TEXT NOT NULL DEFAULT 'controle_continu', -- controle_continu, examen_final, rattrapage, projet, oral, tp
  scale NUMERIC(5,1) NOT NULL DEFAULT 20, -- barème (sur 20, sur 100, etc.)
  coefficient NUMERIC(5,2) NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'brouillon', -- brouillon, ouvert, cloture, diffuse
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Notes
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  value NUMERIC(6,2),
  status TEXT NOT NULL DEFAULT 'brouillon', -- brouillon, validee
  is_absent BOOLEAN NOT NULL DEFAULT false,
  is_excused BOOLEAN NOT NULL DEFAULT false,
  is_dispensed BOOLEAN NOT NULL DEFAULT false,
  is_cheating BOOLEAN NOT NULL DEFAULT false,
  internal_comment TEXT,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(evaluation_id, student_id)
);

-- 5. Historique des modifications de notes
CREATE TABLE public.grade_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id UUID NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
  old_value NUMERIC(6,2),
  new_value NUMERIC(6,2),
  old_status TEXT,
  new_status TEXT,
  changed_by UUID NOT NULL,
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Relevés de notes / Bulletins
CREATE TABLE public.transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  period_id UUID REFERENCES public.evaluation_periods(id) ON DELETE SET NULL,
  general_average NUMERIC(5,2),
  validated_credits NUMERIC(5,1) DEFAULT 0,
  total_credits NUMERIC(5,1) DEFAULT 0,
  decision TEXT, -- admis, ajourne, rattrapage, en_cours
  mention TEXT, -- tres_bien, bien, assez_bien, passable
  jury_date DATE,
  jury_comment TEXT,
  pdf_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, formation_id, period_id)
);

-- 7. Détail des moyennes par module dans un relevé
CREATE TABLE public.transcript_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id UUID NOT NULL REFERENCES public.transcripts(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.formation_modules(id) ON DELETE CASCADE,
  teaching_unit_id UUID REFERENCES public.teaching_units(id) ON DELETE SET NULL,
  module_average NUMERIC(5,2),
  coefficient NUMERIC(5,2) NOT NULL DEFAULT 1,
  credits_earned NUMERIC(5,1) DEFAULT 0,
  credits_possible NUMERIC(5,1) DEFAULT 0,
  is_validated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Paramètres de validation par formation
CREATE TABLE public.grading_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  validation_threshold NUMERIC(5,2) NOT NULL DEFAULT 10, -- seuil de validation (ex: 10/20)
  allow_compensation BOOLEAN NOT NULL DEFAULT true,
  compensation_threshold NUMERIC(5,2) DEFAULT 8, -- seuil minimum pour compensation
  credits_system TEXT DEFAULT 'none', -- none, ects, internal
  credits_per_semester NUMERIC(5,1) DEFAULT 30,
  mention_passable_threshold NUMERIC(5,2) DEFAULT 10,
  mention_ab_threshold NUMERIC(5,2) DEFAULT 12,
  mention_bien_threshold NUMERIC(5,2) DEFAULT 14,
  mention_tb_threshold NUMERIC(5,2) DEFAULT 16,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(formation_id)
);

-- Triggers updated_at
CREATE TRIGGER handle_teaching_units_updated_at BEFORE UPDATE ON public.teaching_units FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_evaluation_periods_updated_at BEFORE UPDATE ON public.evaluation_periods FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_evaluations_updated_at BEFORE UPDATE ON public.evaluations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_grades_updated_at BEFORE UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_transcripts_updated_at BEFORE UPDATE ON public.transcripts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_grading_rules_updated_at BEFORE UPDATE ON public.grading_rules FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- FONCTIONS RPC SECURITY DEFINER
-- =====================================================

-- Vérifier si l'utilisateur peut accéder aux notes d'une formation
CREATE OR REPLACE FUNCTION public.can_access_formation_grades(_formation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  
  -- Admin de l'établissement
  IF public.is_current_user_admin() THEN
    RETURN EXISTS (
      SELECT 1 FROM formations f 
      WHERE f.id = _formation_id 
        AND f.establishment_id = public.get_current_user_establishment()
    );
  END IF;
  
  -- Formateur/Étudiant assigné
  IF EXISTS (
    SELECT 1 FROM user_formation_assignments ufa
    WHERE ufa.formation_id = _formation_id AND ufa.user_id = auth.uid()
  ) THEN RETURN true; END IF;
  
  -- Tuteur via apprenti
  IF EXISTS (
    SELECT 1 FROM tutor_student_assignments tsa
    JOIN user_formation_assignments ufa ON ufa.user_id = tsa.student_id
    WHERE tsa.tutor_id = auth.uid() AND tsa.is_active = true AND ufa.formation_id = _formation_id
  ) THEN RETURN true; END IF;
  
  RETURN false;
END;
$$;

-- Vérifier si le formateur peut gérer une évaluation
CREATE OR REPLACE FUNCTION public.can_manage_evaluation(_evaluation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF public.is_current_user_admin() THEN
    RETURN EXISTS (
      SELECT 1 FROM evaluations e
      JOIN formation_modules fm ON fm.id = e.module_id
      JOIN formations f ON f.id = fm.formation_id
      WHERE e.id = _evaluation_id AND f.establishment_id = public.get_current_user_establishment()
    );
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM evaluations e WHERE e.id = _evaluation_id AND e.instructor_id = auth.uid()
  );
END;
$$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.teaching_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcript_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_rules ENABLE ROW LEVEL SECURITY;

-- teaching_units
CREATE POLICY "teaching_units_select" ON public.teaching_units FOR SELECT TO authenticated
  USING (public.can_access_formation_grades(formation_id));
CREATE POLICY "teaching_units_insert" ON public.teaching_units FOR INSERT TO authenticated
  WITH CHECK (public.is_current_user_admin() AND EXISTS (
    SELECT 1 FROM formations f WHERE f.id = formation_id AND f.establishment_id = public.get_current_user_establishment()
  ));
CREATE POLICY "teaching_units_update" ON public.teaching_units FOR UPDATE TO authenticated
  USING (public.is_current_user_admin() AND EXISTS (
    SELECT 1 FROM formations f WHERE f.id = formation_id AND f.establishment_id = public.get_current_user_establishment()
  ));
CREATE POLICY "teaching_units_delete" ON public.teaching_units FOR DELETE TO authenticated
  USING (public.is_current_user_admin() AND EXISTS (
    SELECT 1 FROM formations f WHERE f.id = formation_id AND f.establishment_id = public.get_current_user_establishment()
  ));

-- evaluation_periods
CREATE POLICY "eval_periods_select" ON public.evaluation_periods FOR SELECT TO authenticated
  USING (public.can_access_formation_grades(formation_id));
CREATE POLICY "eval_periods_insert" ON public.evaluation_periods FOR INSERT TO authenticated
  WITH CHECK (public.is_current_user_admin() AND EXISTS (
    SELECT 1 FROM formations f WHERE f.id = formation_id AND f.establishment_id = public.get_current_user_establishment()
  ));
CREATE POLICY "eval_periods_update" ON public.evaluation_periods FOR UPDATE TO authenticated
  USING (public.is_current_user_admin() AND EXISTS (
    SELECT 1 FROM formations f WHERE f.id = formation_id AND f.establishment_id = public.get_current_user_establishment()
  ));
CREATE POLICY "eval_periods_delete" ON public.evaluation_periods FOR DELETE TO authenticated
  USING (public.is_current_user_admin() AND EXISTS (
    SELECT 1 FROM formations f WHERE f.id = formation_id AND f.establishment_id = public.get_current_user_establishment()
  ));

-- evaluations
CREATE POLICY "evaluations_select" ON public.evaluations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM formation_modules fm JOIN formations f ON f.id = fm.formation_id
      WHERE fm.id = module_id AND public.can_access_formation_grades(f.id)
    )
  );
CREATE POLICY "evaluations_insert" ON public.evaluations FOR INSERT TO authenticated
  WITH CHECK (
    public.is_current_user_admin() OR (
      public.get_current_user_role() = 'Formateur' AND instructor_id = auth.uid()
    )
  );
CREATE POLICY "evaluations_update" ON public.evaluations FOR UPDATE TO authenticated
  USING (public.can_manage_evaluation(id));
CREATE POLICY "evaluations_delete" ON public.evaluations FOR DELETE TO authenticated
  USING (public.can_manage_evaluation(id));

-- grades
CREATE POLICY "grades_select" ON public.grades FOR SELECT TO authenticated
  USING (
    -- Étudiant voit ses propres notes (si évaluation diffusée)
    (student_id = auth.uid() AND EXISTS (
      SELECT 1 FROM evaluations e WHERE e.id = evaluation_id AND e.is_published = true
    ))
    -- Admin/Formateur voient toutes les notes de leurs évaluations
    OR EXISTS (
      SELECT 1 FROM evaluations e WHERE e.id = evaluation_id AND public.can_manage_evaluation(e.id)
    )
    -- Tuteur voit les notes de son apprenti
    OR EXISTS (
      SELECT 1 FROM tutor_student_assignments tsa
      WHERE tsa.tutor_id = auth.uid() AND tsa.student_id = grades.student_id AND tsa.is_active = true
    )
  );
CREATE POLICY "grades_insert" ON public.grades FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM evaluations e WHERE e.id = evaluation_id AND public.can_manage_evaluation(e.id) AND e.status IN ('ouvert', 'brouillon')
  ));
CREATE POLICY "grades_update" ON public.grades FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM evaluations e WHERE e.id = evaluation_id AND public.can_manage_evaluation(e.id) AND e.status IN ('ouvert', 'brouillon')
  ));
CREATE POLICY "grades_delete" ON public.grades FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM evaluations e WHERE e.id = evaluation_id AND public.can_manage_evaluation(e.id) AND e.status = 'brouillon'
  ));

-- grade_history
CREATE POLICY "grade_history_select" ON public.grade_history FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM grades g JOIN evaluations e ON e.id = g.evaluation_id
    WHERE g.id = grade_id AND public.can_manage_evaluation(e.id)
  ));
CREATE POLICY "grade_history_insert" ON public.grade_history FOR INSERT TO authenticated
  WITH CHECK (changed_by = auth.uid());

-- transcripts
CREATE POLICY "transcripts_select" ON public.transcripts FOR SELECT TO authenticated
  USING (
    (student_id = auth.uid() AND is_published = true)
    OR public.can_access_formation_grades(formation_id)
  );
CREATE POLICY "transcripts_insert" ON public.transcripts FOR INSERT TO authenticated
  WITH CHECK (public.is_current_user_admin() AND EXISTS (
    SELECT 1 FROM formations f WHERE f.id = formation_id AND f.establishment_id = public.get_current_user_establishment()
  ));
CREATE POLICY "transcripts_update" ON public.transcripts FOR UPDATE TO authenticated
  USING (public.is_current_user_admin() AND EXISTS (
    SELECT 1 FROM formations f WHERE f.id = formation_id AND f.establishment_id = public.get_current_user_establishment()
  ));
CREATE POLICY "transcripts_delete" ON public.transcripts FOR DELETE TO authenticated
  USING (public.is_current_user_admin() AND EXISTS (
    SELECT 1 FROM formations f WHERE f.id = formation_id AND f.establishment_id = public.get_current_user_establishment()
  ));

-- transcript_modules
CREATE POLICY "transcript_modules_select" ON public.transcript_modules FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM transcripts t WHERE t.id = transcript_id AND (
      (t.student_id = auth.uid() AND t.is_published = true)
      OR public.can_access_formation_grades(t.formation_id)
    )
  ));
CREATE POLICY "transcript_modules_insert" ON public.transcript_modules FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM transcripts t JOIN formations f ON f.id = t.formation_id
    WHERE t.id = transcript_id AND public.is_current_user_admin() AND f.establishment_id = public.get_current_user_establishment()
  ));
CREATE POLICY "transcript_modules_update" ON public.transcript_modules FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM transcripts t JOIN formations f ON f.id = t.formation_id
    WHERE t.id = transcript_id AND public.is_current_user_admin() AND f.establishment_id = public.get_current_user_establishment()
  ));
CREATE POLICY "transcript_modules_delete" ON public.transcript_modules FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM transcripts t JOIN formations f ON f.id = t.formation_id
    WHERE t.id = transcript_id AND public.is_current_user_admin() AND f.establishment_id = public.get_current_user_establishment()
  ));

-- grading_rules
CREATE POLICY "grading_rules_select" ON public.grading_rules FOR SELECT TO authenticated
  USING (public.can_access_formation_grades(formation_id));
CREATE POLICY "grading_rules_insert" ON public.grading_rules FOR INSERT TO authenticated
  WITH CHECK (public.is_current_user_admin() AND EXISTS (
    SELECT 1 FROM formations f WHERE f.id = formation_id AND f.establishment_id = public.get_current_user_establishment()
  ));
CREATE POLICY "grading_rules_update" ON public.grading_rules FOR UPDATE TO authenticated
  USING (public.is_current_user_admin() AND EXISTS (
    SELECT 1 FROM formations f WHERE f.id = formation_id AND f.establishment_id = public.get_current_user_establishment()
  ));

-- Indexes pour performance
CREATE INDEX idx_evaluations_module ON public.evaluations(module_id);
CREATE INDEX idx_evaluations_period ON public.evaluations(period_id);
CREATE INDEX idx_evaluations_instructor ON public.evaluations(instructor_id);
CREATE INDEX idx_grades_evaluation ON public.grades(evaluation_id);
CREATE INDEX idx_grades_student ON public.grades(student_id);
CREATE INDEX idx_grade_history_grade ON public.grade_history(grade_id);
CREATE INDEX idx_transcripts_student ON public.transcripts(student_id);
CREATE INDEX idx_transcripts_formation ON public.transcripts(formation_id);
CREATE INDEX idx_transcript_modules_transcript ON public.transcript_modules(transcript_id);
CREATE INDEX idx_teaching_units_formation ON public.teaching_units(formation_id);
CREATE INDEX idx_evaluation_periods_formation ON public.evaluation_periods(formation_id);
