
-- 1) Policy SELECT pour que les admins puissent lire les signatures des utilisateurs de leur établissement
CREATE POLICY "Admins can read user_signatures of same establishment"
ON public.user_signatures
FOR SELECT
TO authenticated
USING (
  public.is_current_user_admin()
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = user_signatures.user_id
      AND u.establishment_id = public.get_current_user_establishment()
  )
);

-- 2) Backfill: compléter les attendance_signatures avec signature_data=null quand une signature profil existe
UPDATE public.attendance_signatures AS asig
SET signature_data = us.signature_data
FROM public.user_signatures us
WHERE asig.user_id = us.user_id
  AND asig.present = true
  AND asig.signature_data IS NULL
  AND us.signature_data IS NOT NULL;
