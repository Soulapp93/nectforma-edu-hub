
-- Table des justificatifs d'absence
CREATE TABLE public.absence_justifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signature_id UUID NOT NULL REFERENCES public.attendance_signatures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(signature_id)
);

-- Enable RLS
ALTER TABLE public.absence_justifications ENABLE ROW LEVEL SECURITY;

-- Étudiants/Formateurs: peuvent voir et créer leurs propres justificatifs
CREATE POLICY "Users can view own justifications"
  ON public.absence_justifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_current_user_admin());

CREATE POLICY "Users can insert own justifications"
  ON public.absence_justifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admin: peut tout mettre à jour (valider/rejeter)
CREATE POLICY "Admins can update justifications"
  ON public.absence_justifications FOR UPDATE
  TO authenticated
  USING (public.is_current_user_admin());

-- Trigger updated_at
CREATE TRIGGER handle_absence_justifications_updated_at
  BEFORE UPDATE ON public.absence_justifications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
