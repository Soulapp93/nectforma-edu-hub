
-- 1. Table des blocs de compétences (niveau au-dessus des UE)
CREATE TABLE IF NOT EXISTS public.competency_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  code TEXT,
  description TEXT,
  coefficient NUMERIC NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_validated_independently BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Lier les UE aux blocs de compétences
ALTER TABLE public.teaching_units ADD COLUMN IF NOT EXISTS block_id UUID REFERENCES public.competency_blocks(id) ON DELETE SET NULL;

-- 3. Mode d'évaluation par module (CC, examen blanc, les deux)
ALTER TABLE public.formation_modules ADD COLUMN IF NOT EXISTS evaluation_mode TEXT NOT NULL DEFAULT 'both';

-- 4. Étendre grading_rules avec options de compensation avancées
ALTER TABLE public.grading_rules ADD COLUMN IF NOT EXISTS compensation_mode TEXT NOT NULL DEFAULT 'intra_block';
ALTER TABLE public.grading_rules ADD COLUMN IF NOT EXISTS allow_inter_block_compensation BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.grading_rules ADD COLUMN IF NOT EXISTS eliminatory_threshold NUMERIC DEFAULT NULL;
ALTER TABLE public.grading_rules ADD COLUMN IF NOT EXISTS has_eliminatory_threshold BOOLEAN NOT NULL DEFAULT false;

-- 5. RLS pour competency_blocks
ALTER TABLE public.competency_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view competency_blocks of their establishment formations"
ON public.competency_blocks FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.formations f
    WHERE f.id = competency_blocks.formation_id
      AND f.establishment_id = public.get_current_user_establishment()
  )
);

CREATE POLICY "Admins can manage competency_blocks"
ON public.competency_blocks FOR ALL TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- 6. Updated_at trigger for competency_blocks
CREATE TRIGGER set_competency_blocks_updated_at
  BEFORE UPDATE ON public.competency_blocks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
