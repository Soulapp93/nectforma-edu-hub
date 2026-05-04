-- Standardise establishment type values to lowercase snake_case
-- Fixes inconsistency found in audit (14 values with mixed casing)

UPDATE public.establishments
SET type = CASE type
  WHEN 'université'                 THEN 'universite'
  WHEN 'Université'                 THEN 'universite'
  WHEN 'enseignement_superieur_public' THEN 'universite'
  WHEN 'école supérieure'           THEN 'ecole_superieure'
  WHEN 'École supérieure'           THEN 'ecole_superieure'
  WHEN 'enseignement_superieur_prive'  THEN 'ecole_superieure'
  WHEN 'centre de formation'        THEN 'centre_formation'
  WHEN 'Centre de formation'        THEN 'centre_formation'
  WHEN 'organisme_formation'        THEN 'organisme_formation'
  WHEN 'Organisme de formation'     THEN 'organisme_formation'
  WHEN 'cfa'                        THEN 'cfa'
  WHEN 'Entreprise'                 THEN 'entreprise'
  WHEN 'Formateur indépendant'      THEN 'formateur_independant'
  WHEN 'autre'                      THEN 'autre'
  ELSE type
END
WHERE type IS NOT NULL;

-- Drop old CHECK constraint and replace with standardised values
ALTER TABLE public.establishments
  DROP CONSTRAINT IF EXISTS establishments_type_check;

ALTER TABLE public.establishments
  ADD CONSTRAINT establishments_type_check CHECK (
    type IS NULL OR type IN (
      'universite',
      'ecole_superieure',
      'centre_formation',
      'organisme_formation',
      'cfa',
      'entreprise',
      'formateur_independant',
      'autre'
    )
  );
