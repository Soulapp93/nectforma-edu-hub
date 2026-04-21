-- =====================================================
-- Diploma: verification code + public route support
-- Executed: 2026-04-21
-- =====================================================

-- 1) Add diploma_number + verification_code to generated_diplomas
ALTER TABLE public.generated_diplomas
  ADD COLUMN IF NOT EXISTS diploma_number text,
  ADD COLUMN IF NOT EXISTS verification_code text;

-- 2) Generate codes for any rows that don't have one yet.
UPDATE public.generated_diplomas gd
SET
  verification_code = COALESCE(gd.verification_code, 'DIP-' || to_char(now(), 'YYYY') || '-' || substr(md5(random()::text || gd.id::text), 1, 10)),
  diploma_number    = COALESCE(gd.diploma_number,    'DIP-' || to_char(now(), 'YYYY') || '-' || lpad(rn.pos::text, 4, '0'))
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS pos
  FROM public.generated_diplomas
) rn
WHERE gd.id = rn.id AND (gd.verification_code IS NULL OR gd.diploma_number IS NULL);

-- 3) Enforce unique + not null going forward
ALTER TABLE public.generated_diplomas
  ALTER COLUMN verification_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS generated_diplomas_verification_code_key
  ON public.generated_diplomas(verification_code);

-- 4) Public RPC to look up a diploma by code (used by /verify-diploma/:code)
CREATE OR REPLACE FUNCTION public.verify_diploma_by_code(p_code text)
RETURNS TABLE (
  diploma_number text,
  verification_code text,
  status text,
  student_first_name text,
  student_last_name text,
  formation_title text,
  formation_level text,
  academic_year text,
  establishment_name text,
  general_average numeric,
  mention text,
  decision text,
  jury_date date,
  generated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    gd.diploma_number,
    gd.verification_code,
    gd.status,
    u.first_name AS student_first_name,
    u.last_name  AS student_last_name,
    f.title      AS formation_title,
    f.level      AS formation_level,
    f.academic_year,
    e.name       AS establishment_name,
    t.general_average,
    t.mention,
    t.decision,
    t.jury_date,
    gd.created_at AS generated_at
  FROM public.generated_diplomas gd
  LEFT JOIN public.users u          ON u.id = gd.student_id
  LEFT JOIN public.formations f     ON f.id = gd.formation_id
  LEFT JOIN public.establishments e ON e.id = gd.establishment_id
  LEFT JOIN public.transcripts t    ON t.id = gd.transcript_id
  WHERE gd.verification_code = p_code
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_diploma_by_code(text) TO anon, authenticated;

COMMENT ON FUNCTION public.verify_diploma_by_code IS 'Public lookup of a diploma by its verification code (safe: only published info returned).';
