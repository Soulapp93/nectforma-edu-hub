-- Extend establishments_type_check to accept all establishment types
-- This migration adds new types to accommodate the updated frontend form
ALTER TABLE public.establishments DROP CONSTRAINT IF EXISTS establishments_type_check;

ALTER TABLE public.establishments ADD CONSTRAINT establishments_type_check 
CHECK (type = ANY (ARRAY[
  'université'::text, 
  'école supérieure'::text, 
  'centre de formation'::text,
  'École supérieure'::text,
  'Centre de formation'::text,
  'Organisme de formation'::text,
  'Entreprise'::text,
  'Formateur indépendant'::text,
  'enseignement_superieur_prive'::text,
  'enseignement_superieur_public'::text,
  'organisme_formation'::text,
  'cfa'::text,
  'universite'::text,
  'autre'::text
]));
