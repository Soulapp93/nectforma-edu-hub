
-- Table for unique student attendance links
CREATE TABLE public.attendance_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_sheet_id UUID REFERENCES public.attendance_sheets(id) ON DELETE CASCADE NOT NULL,
  student_id UUID NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast token lookup
CREATE INDEX idx_attendance_student_links_token ON public.attendance_student_links(token);
CREATE INDEX idx_attendance_student_links_sheet ON public.attendance_student_links(attendance_sheet_id);

-- Enable RLS
ALTER TABLE public.attendance_student_links ENABLE ROW LEVEL SECURITY;

-- Students can read their own links
CREATE POLICY "Students can read own links"
ON public.attendance_student_links
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Admins and instructors can insert links
CREATE POLICY "Admins can insert links"
ON public.attendance_student_links
FOR INSERT
TO authenticated
WITH CHECK (public.is_current_user_admin());

-- Admins and instructors can update links (mark as used)
CREATE POLICY "Admins can update links"
ON public.attendance_student_links
FOR UPDATE
TO authenticated
USING (public.is_current_user_admin());

-- Students can update their own links (mark as used when signing)
CREATE POLICY "Students can update own links"
ON public.attendance_student_links
FOR UPDATE
TO authenticated
USING (student_id = auth.uid());

-- Instructors can insert links (for formateur-initiated sessions)
CREATE POLICY "Instructors can insert links"
ON public.attendance_student_links
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.attendance_sheets ash
    WHERE ash.id = attendance_sheet_id
    AND ash.instructor_id = auth.uid()
  )
);

-- Validate student link token function
CREATE OR REPLACE FUNCTION public.validate_student_link_token(token_param text)
RETURNS TABLE(link_id uuid, sheet_id uuid, student_id uuid, is_valid boolean, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_link RECORD;
BEGIN
    SELECT * INTO v_link 
    FROM attendance_student_links 
    WHERE token = token_param;
    
    IF v_link IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::UUID, false, 'Token invalide'::TEXT;
        RETURN;
    END IF;
    
    IF v_link.is_used THEN
        RETURN QUERY SELECT v_link.id, v_link.attendance_sheet_id, v_link.student_id, false, 'Ce lien a déjà été utilisé'::TEXT;
        RETURN;
    END IF;
    
    IF v_link.expires_at < now() THEN
        RETURN QUERY SELECT v_link.id, v_link.attendance_sheet_id, v_link.student_id, false, 'Le lien a expiré'::TEXT;
        RETURN;
    END IF;
    
    IF v_link.student_id != auth.uid() THEN
        RETURN QUERY SELECT v_link.id, v_link.attendance_sheet_id, v_link.student_id, false, 'Ce lien ne vous appartient pas'::TEXT;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT v_link.id, v_link.attendance_sheet_id, v_link.student_id, true, NULL::TEXT;
END;
$$;

-- Enable realtime for the new table
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_student_links;
